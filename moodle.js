function enforceTabLinks() {
    document.addEventListener('click', event => {
        const link = event.target.closest('a'); // Trouver le lien cliqué
        if (!link) return;

        // Empêcher les clics qui déclencheraient une nouvelle fenêtre
        const onclickValue = link.getAttribute('onclick');
        if (onclickValue && onclickValue.includes('window.open')) {
            event.preventDefault();
            event.stopImmediatePropagation();

            // Extraire l'URL du lien
            let url = link.href;
            if (!url.includes('&redirect=1')) {
                url += '&redirect=1'; // Ajouter le paramètre redirect=1 si nécessaire
            }

            // Ouvrir le lien dans un nouvel onglet
            window.open(url, '_blank');
        }
    }, true); // Utiliser la phase de capture pour bloquer en amont
}

// Exécuter une fois le DOM chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enforceTabLinks);
} else {
    enforceTabLinks();
}
