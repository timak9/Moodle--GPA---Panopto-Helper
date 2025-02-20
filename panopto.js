(function () {
  'use strict';

  // Fonction pour ajouter le style du modal
  function addStyle(CSS) {
    const style = document.createElement('style');
    style.innerText = CSS;
    document.head.appendChild(style);
  }

  // Fonction pour copier du texte dans le presse-papiers
  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    }).catch(e => {
      console.error('Error copying to clipboard', e);
    });
  }

  // Fonction pour créer une notification simple
  function notifyUser(message) {
    alert(message);
  }

  if (location.pathname.includes('/List.aspx')) {
    // Service pour les listes de vidéos Panopto
    const button = document.createElement('button');
    button.className = 'css-t83cx2 css-tr3oo4 css-coghg4';
    button.role = 'button';
    button.style.marginLeft = '0.5rem';
    button.innerHTML = '<span class="material-icons css-6xugel" style="font-size: 18px;margin-bottom:-0.25rem;">file_download</span>Download';

    button.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();

      let _t;
      const list = (_t = document.querySelectorAll('#listViewContainer tbody > tr a.detail-title')).length ?
            _t : (_t = document.querySelectorAll('#detailsTable tbody > tr a.detail-title')).length ?
            _t : (_t = document.querySelectorAll('#thumbnailGrid > li a.detail-title')).length ?
            _t : null;
      if (!list) {
        notifyUser('No videos found');
        return;
      }

      const requestsList = [...list].map(item => {
        let videoId = new URL(item.getAttribute('href')).searchParams.get('id');
        const videoTitle = item.textContent.trim();
        return requestDeliveryInfo(videoId)
          .catch(error => {
            notifyUser('Failed to get lesson link for "' + videoTitle + '"');
          });
      });

      Promise.allSettled(requestsList)
        .then(responses => {
          responses.forEach(response => {
            if (response.status == 'fulfilled' && response.value) {
              const streamUrl = response.value?.[0];
              if (streamUrl) {
                handleDownloadOrCopy(streamUrl);
              }
            }
          });
        });
    });

    document.querySelector('#actionHeader button')?.parentElement.appendChild(button);
  } else if (location.pathname.includes('/Viewer.aspx')) {
    // Service pour la page Viewer Panopto
    const button = document.createElement('a');
    button.href = '#';
    button.innerHTML = '<span class="material-icons" style="font-size:15px;margin-bottom:-0.25rem;">file_download</span> Download';
    button.classList = 'event-tab-header';
    button.style = 'display:inline-flex;align-items:center;position:absolute;bottom:30px;padding:5px 10px;text-decoration:none;cursor:pointer;';

    button.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      getVideoDownloadLink();
    });
    document.querySelector('#eventTabControl').appendChild(button);
  }

  // Fonction pour obtenir le lien de téléchargement de la vidéo
  function getVideoDownloadLink() {
    const url = new URL(location.href);
    const videoId = url.searchParams.get('id');
    if (!videoId) {
      notifyUser('Failed to get Lesson ID.');
      return;
    }

    requestDeliveryInfo(videoId)
      .then(_streams => {
        const streamUrl = _streams[0];
        if (streamUrl) {
          handleDownloadOrCopy(streamUrl);
        } else {
          notifyUser('Stream URL not ready yet');
        }
      })
      .catch(error => {
        notifyUser('Failed to get lesson link');
      });
  }

  // Fonction pour gérer le téléchargement ou la copie du lien en fonction du format
  function handleDownloadOrCopy(url) {
    if (url.endsWith('.mp4')) {
      downloadFile(url);
    } else {
      copyToClipboard(url);
    }
  }

  // Fonction pour télécharger un fichier
  function downloadFile(url) {
    chrome.runtime.sendMessage({ action: "download", url: url }, function (response) {
      if (chrome.runtime.lastError) {
        console.error('Erreur lors de l\'envoi du message de téléchargement', chrome.runtime.lastError);
      } else {
        console.log('Demande de téléchargement envoyée', response);
      }
    });
  }

  // Fonction pour demander les informations de livraison (lien vidéo)
  function requestDeliveryInfo(videoId) {
    return fetch(
      location.origin + '/Panopto/Pages/Viewer/DeliveryInfo.aspx', {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      body: 'deliveryId=' + videoId + '&isEmbed=true&responseType=json',
    })
      .then(response => response.json())
      .then(data => {
        const streamUrl = data.Delivery?.PodcastStreams[0]?.StreamUrl;
        if (!streamUrl) {
          throw new Error('Stream URL not ready yet');
        }
        return [streamUrl];
      })
      .catch(error => {
        console.error(error);
        throw error;
      });
  }

})();
