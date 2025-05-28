// content.js - Toont het IP-adres op de pagina
let ipDisplay = null;
let currentIP = null;
let isLookingUp = false;

// Functie om het IP-display element te maken
function createIPDisplay() {
  if (ipDisplay) return;
  
  ipDisplay = document.createElement('div');
  ipDisplay.className = 'website-ip-display';
  ipDisplay.textContent = 'IP ophalen...';
  
  // Voeg hover event listeners toe
  ipDisplay.addEventListener('mouseenter', () => {
    ipDisplay.classList.add('moved-left');
  });
  
  ipDisplay.addEventListener('mouseleave', () => {
    ipDisplay.classList.remove('moved-left');
  });
  
  // Klik om opnieuw op te halen
  ipDisplay.addEventListener('click', () => {
    if (!isLookingUp) {
      displayIP(true);
    }
  });
  
  document.body.appendChild(ipDisplay);
}

// Functie om IP op te halen en weer te geven
function displayIP(forceRefresh = false) {
  const hostname = window.location.hostname;
  
  if (!hostname) {
    if (ipDisplay) {
      ipDisplay.textContent = 'Geen hostname';
    }
    return;
  }
  
  // Als het al een IP-adres is, toon het direct
  if (hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    if (ipDisplay) {
      ipDisplay.textContent = hostname;
      ipDisplay.title = 'Dit is al een IP-adres';
    }
    return;
  }
  
  // Toon dat we bezig zijn
  if (ipDisplay) {
    ipDisplay.textContent = 'Zoeken...';
    isLookingUp = true;
  }
  
  // Vraag background script om IP
  browser.runtime.sendMessage({
    action: 'getIP',
    hostname: hostname,
    forceRefresh: forceRefresh
  }).then(response => {
    isLookingUp = false;
    
    if (response && response.ip) {
      currentIP = response.ip;
      if (ipDisplay) {
        ipDisplay.textContent = currentIP;
        ipDisplay.title = `${hostname} → ${currentIP}\nKlik om te vernieuwen`;
      }
    } else {
      // Als lookup faalt, probeer het nog een keer na kort wachten
      if (!forceRefresh) {
        setTimeout(() => displayIP(true), 1000);
      } else {
        if (ipDisplay) {
          ipDisplay.textContent = 'IP onbekend';
          ipDisplay.title = `${hostname}\nKlik om opnieuw te proberen`;
        }
      }
    }
  }).catch(error => {
    isLookingUp = false;
    console.error('Fout bij ophalen IP:', error);
    if (ipDisplay) {
      ipDisplay.textContent = 'Fout';
      ipDisplay.title = 'Klik om opnieuw te proberen';
    }
  });
}

// Initialiseer wanneer de pagina geladen is
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  // Niet tonen op bepaalde pagina's
  if (window.location.protocol === 'about:' || 
      window.location.protocol === 'chrome:' ||
      window.location.protocol === 'moz-extension:' ||
      window.location.protocol === 'file:') {
    return;
  }
  
  createIPDisplay();
  displayIP();
}

// Update bij navigatie zonder page reload (voor SPA's)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    displayIP();
  }
}).observe(document, { subtree: true, childList: true });