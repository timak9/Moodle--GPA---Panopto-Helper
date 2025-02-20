document.addEventListener("DOMContentLoaded", async function () {
    const fileInput = document.getElementById("pdfUpload");
    const resultsContainer = document.getElementById("gradesResults");

    // Charger pdf.js en tant que module
    import(chrome.runtime.getURL("libs/pdf.mjs"))
        .then(pdfjsLib => {
            pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL("libs/pdf.worker.mjs");

            fileInput.addEventListener("change", async function (event) {
                const file = event.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.readAsArrayBuffer(file);
                reader.onload = async function () {
                    const typedArray = new Uint8Array(reader.result);
                    const pdf = await pdfjsLib.getDocument(typedArray).promise;

                    let text = "";
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        text += content.items.map(item => item.str).join(" ") + "\n";
                    }
                    console.log("Texte extrait du PDF :", text);


                    // Parser les notes depuis le texte
                    const grades = parseGrades(text);
                    openResultsWindow(grades);
                };
            });

            function parseGrades(text) {
                // Ajoute un saut de ligne avant toute suite de 6 chiffres ou plus non précédée d'un saut de ligne
                text = text.replace(/([^\n])(\d{6,})/g, '$1\n$2')
                .replace(/([^\n])(נקודות מצטברות)/g, '$1\n$2')
                .replace(/([^\n])(\d+(?:.\d+)?\s*נקודות רישום:)/g, '$1\n$2');
                      
                const lines = text.split("\n").map(line => line.trim()).filter(line => line.length > 0);
                console.log("Extracted lines before filtering:", lines);
            
                const coursePattern = /(?<!\d)(\d{6,8})(?!\d)\s+(.+?)(?=\s+\d+(?:\.\d+)?(?:\s+(?:(?:\d+(?:\.\d+)?\*?)|(?:\*?לא השלים\*?)|עובר|פטור(?: ללא ניקוד| עם ניקוד)?))?\s*$)\s+(\d+(?:\.\d+)?)(?:\s+((?:\d+(?:\.\d+)?\*?)|(?:\*?לא השלים\*?)|עובר|פטור(?: ללא ניקוד| עם ניקוד)?))?\s*$/g;
                let grades = [];
            
                lines.forEach(line => {
                    const parts = line.split(/\s+/);
                    let cleanedLine = [];
            
                    for (let i = 0; i < parts.length; i++) {
                        if (parts[i].length >= 6 && /^\d{6,}$/.test(parts[i])) {
                            cleanedLine = parts.slice(i).join(" ");
                            break;
                        }
                    }
            
                    if (cleanedLine.length === 0) {
                        console.log("Ignored line (no valid course ID found):", line);
                        return;
                    }
            
                    let matches;
                    while ((matches = coursePattern.exec(cleanedLine)) !== null) {
                        let course_id = matches[1];
                        let course_name = matches[2].trim();
                        // Ici, le nombre correspond aux crédits
                        let credits = matches[3] ? parseFloat(matches[3]) : null;
                        // Et le texte correspond à la note
                        let grade = matches[4] || null;
            
                        // Dans le cas "פטור ללא ניקוד", on conserve le 0 en crédit et la note reste "פטור ללא ניקוד"
                        // On n'altère donc pas course_name ni la valeur numérique.
            
                        grades.push({
                            course_id: course_id,
                            course_name: course_name,
                            grade: grade,       // note
                            credits: credits    // crédits
                        });
                    }
                });
            
                console.log("Extracted grades:", grades);
                return grades;
            }
            
            
            
            
            
            
            

            function displayGrades(grades) {
                resultsContainer.innerHTML = "";
                if (grades.length === 0) {
                    resultsContainer.innerHTML = "<p>Aucune note trouvée.</p>";
                    return;
                }

                const table = document.createElement("table");
                const headerRow = table.insertRow();
                ["Semestre", "Saison", "Note", "Crédits", "Cours", "ID"].forEach(text => {
                    const th = document.createElement("th");
                    th.textContent = text;
                    headerRow.appendChild(th);
                });

                grades.forEach(grade => {
                    const row = table.insertRow();
                    Object.values(grade).forEach(value => {
                        const cell = row.insertCell();
                        cell.textContent = value;
                    });
                });

                resultsContainer.appendChild(table);
            }
        })
        .catch(error => console.error("Erreur lors du chargement de pdf.js :", error));

        function openResultsWindow(grades) {
            sessionStorage.setItem("gradesData", JSON.stringify(grades));
        
            setTimeout(() => {
                const newWindow = window.open("", "_blank");
        
                if (!newWindow) {
                    alert("The window was blocked by the browser. Please allow popups for this extension.");
                    return;
                }
        
                newWindow.document.write(`
                    <!DOCTYPE html>
                    <html dir="rtl">
                    <head>
                        <meta charset="utf-8">
                        <meta http-equiv="cache-control" content="no-cache" />
                        <title>מחשבון ממוצע ציונים אקדמי</title>
                        <link rel="stylesheet" type="text/css" href="${chrome.runtime.getURL("style.css")}" />
                        <script src="${chrome.runtime.getURL("results.js")}" defer></script>
                        <style>
                            /* Increase the width of the Course column */
                            .course_name {
                                min-width: 250px;
                                max-width: 350px;
                                word-wrap: break-word;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="maor_norm_wrapper">
                            <h1>מחשבון ממוצע ציונים אקדמי</h1>
        
                            <div id="stats" class="maor_grid" style="grid-template-columns: repeat(3, 1fr);">
                                <h3>ממוצע ציונים מחושב: <span id="avg_grade"></span></h3>
                                <h3>נקודות מחושבות: <span id="curr_points"></span> (מתוכן <span id="ex_points"></span> נקודות פטור)</h3>
                                <h3>אחוז הצלחה: <span id="percentageRatio"></span>%</h3>
                            </div>
        
                            <h2>ציונים שנכנסו לממוצע</h2>
                            <div class="maor_table" id="inlist">
                                <div class="maor_table_header">
                                    <div>קורס</div> <!-- Course -->
                                    <div>נקודות</div> <!-- Credits -->
                                    <div>ציון</div> <!-- Grade -->
                                    <div>כלול בממוצע</div> <!-- Included in Average -->
                                </div>
                                ${grades.map((grade, index) => `
                                    <div class="maor_table_row">
                                        <div class="course_name">${grade.course_name || "-"}</div>
                                        <div>${grade.credits !== null ? grade.credits : "-"}</div>
                                        <div>
                                            ${isNaN(grade.grade) ? 
                                                `<span>${grade.grade}</span>` : 
                                                `<input type="number" class="grade-input" data-index="${index}" value="${grade.grade}" min="0" max="100">`
                                            }
                                        </div>
                                        <div class="center"><input type="checkbox" class="include-checkbox" data-index="${index}" checked></div>
                                    </div>
                                `).join("")}
                            </div>
        
                            <h2>Add a New Course</h2>
                            <form id="addCourseForm">
                                <input type="text" id="newCourseName" placeholder="Course Name (optional)">
                                <input type="number" id="newCourseCredits" placeholder="Credits" required min="0.5" step="0.5">
                                <input type="number" id="newCourseGrade" placeholder="Grade" required min="0" max="100">
                                <button type="submit">Add</button>
                            </form>
                        </div>
                    </body>
                    </html>
                `);
        
                newWindow.document.close();
            }, 100);
        }
        
        
        
        
        
        
        
        
        
});
