(function () {
    'use strict';

    console.log("🚀 content.js chargé avec succès !");

    // Fonction pour ouvrir les liens dans de nouveaux onglets
    function enforceTabLinks() {
        document.addEventListener('click', event => {
            const link = event.target.closest('a'); 
            if (!link) return;

            const onclickValue = link.getAttribute('onclick');
            if (onclickValue && onclickValue.includes('window.open')) {
                event.preventDefault();
                event.stopImmediatePropagation();

                let url = link.href;
                if (!url.includes('&redirect=1')) {
                    url += '&redirect=1';
                }

                console.log("🌍 Ouverture du lien dans un nouvel onglet :", url);
                window.open(url, '_blank');
            }
        }, true);
    }

    // Fonction d'auto-login pour Technion
    function autoLogin(username, password, server) {
        console.log("🚀 Exécution de autoLogin() avec :", username, "(mot de passe masqué)");

        const forms = document.forms;
        for (let form of forms) {
            if (form.querySelector("input[name='j_username']") && form.querySelector("input[name='j_password']")) {
                console.log("✅ Formulaire détecté, remplissage des champs...");

                form.querySelector("input[name='j_username']").value = server ? `${username}@campus.technion.ac.il` : `${username}@technion.ac.il`;
                form.querySelector("input[name='j_password']").value = password;

                let submitBtn = form.querySelector("input[type='submit'], button[type='submit']");
                if (submitBtn) {
                    console.log("🖱️ Bouton de soumission trouvé, tentative de connexion...");
                    setTimeout(() => submitBtn.click(), 1000);
                } else {
                    console.warn("❌ Aucun bouton de soumission détecté.");
                }
                return;
            }
        }
        console.warn("❌ Aucun formulaire de connexion détecté.");
    }

    // Fonction d'auto-login pour Microsoft
    function checkMicrosoftLogin(username, password) {
        console.log("🔐 Exécution de checkMicrosoftLogin() avec :", username);

        let loginForm = document.forms.f1;
        let submitButton = document.getElementById("idSIButton9");

        if (loginForm && !document.getElementById("passwordError")) {
            console.log("📌 Page Microsoft détectée, tentative de connexion...");

            if (loginForm.passwd) {
                loginForm.passwd.value = password;
                setTimeout(() => loginForm.submit(), 1000);
            } else if (submitButton) {
                console.log("🖱️ Bouton Microsoft trouvé, clic...");
                submitButton.click();
            } else {
                console.warn("❌ Impossible de trouver le champ de mot de passe.");
            }
        }
    }

    // Vérifier les identifiants enregistrés
    chrome.storage.local.get(["username", "password", "server"], function (data) {
        console.log("🔎 Récupération des identifiants dans content.js :", data);

        if (data.username && data.password) {
            console.log("✅ Identifiants trouvés :", data.username, "(mot de passe masqué)");

            if (/technion\.ac\.il/.test(window.location.hostname)) {
                console.log("🌐 Site Technion détecté, tentative de connexion...");
                document.addEventListener("DOMContentLoaded", () => autoLogin(data.username, data.password, data.server));
            } else if (/login\.microsoftonline\.com/.test(window.location.hostname)) {
                console.log("🔐 Page de connexion Microsoft détectée, tentative de connexion...");
                document.addEventListener("DOMContentLoaded", () => checkMicrosoftLogin(data.username, data.password));
            } else {
                console.log("🌍 Aucune page de connexion détectée, script inactif.");
            }
        } else {
            console.warn("⚠️ Aucune donnée d'identifiant enregistrée !");
        }
    });

})();
