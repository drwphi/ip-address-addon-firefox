// content.js - Shows the website IP address
let ipDisplay = null;
let ipLink = null;
let leftArrow = null;
let rightArrow = null;
let currentIP = null;
let isLookingUp = false;

// Create the IP display element
function createIPDisplay() {
  if (ipDisplay) return;

  ipDisplay = document.createElement('div');
  ipDisplay.className = 'website-ip-display';

  leftArrow = document.createElement('span');
  leftArrow.className = 'arrow arrow-left';
  leftArrow.textContent = '←';

  rightArrow = document.createElement('span');
  rightArrow.className = 'arrow arrow-right hidden';
  rightArrow.textContent = '→';

  ipLink = document.createElement('a');
  ipLink.className = 'ip-link';
  ipLink.textContent = 'IP ophalen...';
  ipLink.href = '#';
  ipLink.target = '_blank';
  ipLink.rel = 'noopener noreferrer';

  leftArrow.addEventListener('click', () => {
    ipDisplay.classList.add('moved-left');
    updateArrows();
  });

  rightArrow.addEventListener('click', () => {
    ipDisplay.classList.remove('moved-left');
    updateArrows();
  });

  ipDisplay.appendChild(leftArrow);
  ipDisplay.appendChild(ipLink);
  ipDisplay.appendChild(rightArrow);

  document.body.appendChild(ipDisplay);
  updateArrows();
}

function updateArrows() {
  if (!leftArrow || !rightArrow) return;
  if (ipDisplay.classList.contains('moved-left')) {
    leftArrow.classList.add('hidden');
    rightArrow.classList.remove('hidden');
  } else {
    leftArrow.classList.remove('hidden');
    rightArrow.classList.add('hidden');
  }
}

// Retrieve and display the IP
function displayIP(forceRefresh = false) {
  const hostname = window.location.hostname;
  
  if (!hostname) {
    if (ipLink) {
      ipLink.textContent = 'Geen hostname';
      ipLink.href = '#';
    }
    return;
  }
  
  // Detect IPv4 and IPv6 hostnames
  const isIPv4 = /^\d+\.\d+\.\d+\.\d+$/.test(hostname);
  const isIPv6 = /^[0-9a-fA-F:]+$/.test(hostname);

  // Show the address directly when the hostname is already an IP
  if (isIPv4) {
    if (ipLink) {
      ipLink.textContent = hostname;
      ipLink.title = 'Dit is al een IP-adres';
      ipLink.href = `https://ipinfo.io/${hostname}/json?token=63251f89ade4d1`;
    }
    return;
  } else if (isIPv6) {
    if (ipLink) {
      ipLink.textContent = hostname;
      ipLink.title = 'Dit is al een IPv6-adres';
      ipLink.href = '#';
    }
    return;
  }
  
  // Show that a lookup is in progress
  if (ipLink) {
    ipLink.textContent = 'Zoeken...';
    ipLink.href = '#';
    ipLink.title = '';
    isLookingUp = true;
  }
  
  // Request the IP from the background script
  browser.runtime.sendMessage({
    action: 'getIP',
    hostname: hostname,
    forceRefresh: forceRefresh
  }).then(response => {
    isLookingUp = false;
    
    if (response && response.ip) {
      currentIP = response.ip;
      if (ipLink) {
        ipLink.textContent = currentIP;
        ipLink.title = `${hostname} → ${currentIP}`;
        ipLink.href = `https://ipinfo.io/${currentIP}/json?token=63251f89ade4d1`;
      }
    } else {
      // Retry after a short delay if lookup fails
      if (!forceRefresh) {
        setTimeout(() => displayIP(true), 1000);
      } else {
        if (ipLink) {
          ipLink.textContent = 'IP onbekend';
          ipLink.title = hostname;
          ipLink.href = '#';
        }
      }
    }
  }).catch(error => {
    isLookingUp = false;
    console.error('Fout bij ophalen IP:', error);
    if (ipLink) {
      ipLink.textContent = 'Fout';
      ipLink.title = hostname;
      ipLink.href = '#';
    }
  });
}

// Initialize when the page is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  // Skip certain protocols
  if (window.location.protocol === 'about:' || 
      window.location.protocol === 'chrome:' ||
      window.location.protocol === 'moz-extension:' ||
      window.location.protocol === 'file:') {
    return;
  }
  
  createIPDisplay();
  displayIP();
}

// Update on navigation without a page reload (for SPAs)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    displayIP();
  }
}).observe(document, { subtree: true, childList: true });
