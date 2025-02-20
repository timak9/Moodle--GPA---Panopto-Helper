chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "download" && request.url) {
        chrome.downloads.download({
            url: request.url,
            filename: request.url.split('/').pop(), // Nom du fichier
            saveAs: true
        }, function (downloadId) {
            if (chrome.runtime.lastError) {
                console.error('Erreur lors du téléchargement', chrome.runtime.lastError);
                sendResponse({ success: false });
            } else {
                console.log('Téléchargement en cours, ID:', downloadId);
                sendResponse({ success: true, downloadId: downloadId });
            }
        });
        return true; // Indique que la réponse est asynchrone
    }
});
