document.addEventListener("DOMContentLoaded", function () {
    let gradesData = sessionStorage.getItem("gradesData");

    if (!gradesData) {
        console.error("Error: No data found in sessionStorage.");
        return;
    }

    let grades = JSON.parse(gradesData);

    function updateStatistics() {
        let totalPoints = 0, passedPoints = 0, weightedSum = 0, totalWeightedPoints = 0, pointValidation = 0;
    
        document.querySelectorAll(".maor_table_row").forEach((row, index) => {

            let checkbox = row.querySelector(".include-checkbox");
            if (!checkbox || !checkbox.checked) return; // Skip if not checked
    
            let gradeInput = row.querySelector(".grade-input");
            let score = gradeInput ? parseInt(gradeInput.value) : grades[index].grade;
            let points = grades[index].credits ? parseFloat(grades[index].credits) : 0;

            if (score >= 55 || grades[index].grade === "עובר" || grades[index].grade === "פטור" || grades[index].grade === "פטור עם ניקוד") {
                passedPoints += points;
            }
    
            let gradeText = grades[index].grade ? grades[index].grade.toString() : "";

            // Extraire uniquement la partie numérique d'une note avec astérisque
            let numericGrade = parseFloat(gradeText.replace('*', ''));
            let courseName = row.querySelector(".course_name").textContent;
            let isExcluded = courseName.includes("פעילות חברתית");


            // Vérifier si la note est supérieure ou égale à 55, même avec une astérisque
            if (numericGrade >= 55 || gradeText === "עובר" || gradeText === "פטור" || gradeText === "פטור עם ניקוד") {
                pointValidation += points;
            }

            if ((!isNaN(numericGrade) && numericGrade !== null && numericGrade !== "") || gradeText === "עובר" || gradeText === "פטור" || gradeText === "פטור עם ניקוד" || gradeText === "*לא השלים" || gradeText === "לא השלים") {
                console.log("name: " + courseName + " grade: " + numericGrade + " points: " + points);
            totalPoints += points;
}

            
    
            if (!isNaN(score) && score >= 55) {
                weightedSum += points * score;
                totalWeightedPoints += points;
            }
    
            // Met à jour la note dans le tableau des notes
            grades[index].grade = score;
        });
    
        // Calcul du pourcentage de réussite
        let percentageRatio = totalPoints > 0 ? ((pointValidation / totalPoints) * 100).toFixed(2) : "0.00";
    
        // Mise à jour de l'affichage
        document.getElementById("avg_grade").textContent = totalWeightedPoints ? (weightedSum / totalWeightedPoints).toFixed(2) : "0.00";
        document.getElementById("curr_points").textContent = passedPoints;
        document.getElementById("percentageRatio").textContent = percentageRatio;
    }
    

    function addNewCourse(event) {
        event.preventDefault();

        let courseName = document.getElementById("newCourseName").value.trim();
        let courseCredits = parseFloat(document.getElementById("newCourseCredits").value);
        let courseGrade = parseInt(document.getElementById("newCourseGrade").value);

        if (isNaN(courseCredits) || isNaN(courseGrade)) {
            alert("'Credits' and 'Grades' are obligatory.");
            return;
        }

        let newIndex = grades.length;
        grades.push({
            course_id: "00000000", // Fake ID
            course_name: courseName || "-",
            credits: courseCredits,
            grade: courseGrade,
        });

        let newRow = `
            <div class="maor_table_row">
                <div class="course_name">${courseName || "-"}</div>
                <div>${courseCredits}</div>
                <div><input type="number" class="grade-input" data-index="${newIndex}" value="${courseGrade}" min="0" max="100"></div>
                <div class="center"><input type="checkbox" class="include-checkbox" data-index="${newIndex}" checked></div>
            </div>
        `;

        document.getElementById("inlist").insertAdjacentHTML("beforeend", newRow);

        // Add event listener to update statistics when the grade is modified
        document.querySelector(`.grade-input[data-index="${newIndex}"]`).addEventListener("change", function () {
            grades[newIndex].grade = parseInt(this.value);
            updateStatistics();
        });

        document.querySelector(`.include-checkbox[data-index="${newIndex}"]`).addEventListener("change", updateStatistics);

        updateStatistics();
    }

    document.getElementById("addCourseForm").addEventListener("submit", addNewCourse);

    // Ensure checkboxes and grade inputs for existing courses update statistics
    document.querySelectorAll(".grade-input").forEach(input => {
        input.addEventListener("change", function () {
            let index = this.getAttribute("data-index");
            grades[index].grade = parseInt(this.value);
            updateStatistics();
        });
    });

    document.querySelectorAll(".include-checkbox").forEach(checkbox => {
        checkbox.addEventListener("change", updateStatistics);
    });

    updateStatistics();
});
