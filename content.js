// content.js - Shows the website IP address
// Container that holds the arrow and the link
let ipDisplay = null;
// The clickable link showing the IP
let ipLink = null;
let arrow = null;
let currentIP = null;
let isLookingUp = false;
let isLeft = false;

// Create the IP display element
function createIPDisplay() {
  if (ipDisplay) return;

  ipDisplay = document.createElement('div');
  ipDisplay.className = 'website-ip-display';

  arrow = document.createElement('span');
  arrow.className = 'ip-toggle';
  arrow.textContent = '◀';

  ipLink = document.createElement('a');
  ipLink.className = 'ip-link';
  ipLink.textContent = 'IP ophalen...';
  ipLink.href = '#';
  ipLink.target = '_blank';

  arrow.addEventListener('click', togglePosition);

  ipDisplay.appendChild(arrow);
  ipDisplay.appendChild(ipLink);
  document.body.appendChild(ipDisplay);

  updatePosition();
}

// Retrieve and display the IP
function displayIP(forceRefresh = false) {
  const hostname = window.location.hostname;
  
  if (!hostname) {
    if (ipLink) {
      ipLink.textContent = 'Geen hostname';
      ipLink.removeAttribute('href');
    }
    return;
  }
  
  // If the hostname is already an IP address, show it
  if (hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    if (ipLink) {
      ipLink.textContent = hostname;
      ipLink.title = 'Dit is al een IP-adres';
      ipLink.href = `https://ipinfo.io/${hostname}/json?token=63251f89ade4d1`;
    }
    return;
  }
  
  // Show that a lookup is in progress
  if (ipLink) {
    ipLink.textContent = 'Zoeken...';
    ipLink.removeAttribute('href');
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
          ipLink.removeAttribute('href');
        }
      }
    }
  }).catch(error => {
    isLookingUp = false;
    console.error('Fout bij ophalen IP:', error);
    if (ipLink) {
      ipLink.textContent = 'Fout';
      ipLink.title = hostname;
      ipLink.removeAttribute('href');
    }
  });
}

function togglePosition() {
  isLeft = !isLeft;
  updatePosition();
}

function updatePosition() {
  if (!ipDisplay || !arrow) return;
  if (isLeft) {
    ipDisplay.classList.add('left');
    arrow.textContent = '▶';
  } else {
    ipDisplay.classList.remove('left');
    arrow.textContent = '◀';
  }
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