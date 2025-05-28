// content.js - Shows the website IP address
let ipDisplay = null;
let currentIP = null;
let isLookingUp = false;

// Create the IP display element
function createIPDisplay() {
  if (ipDisplay) return;
  
  ipDisplay = document.createElement('a');
  ipDisplay.className = 'website-ip-display';
  ipDisplay.textContent = 'IP ophalen...';
  ipDisplay.href = '#';
  ipDisplay.target = '_blank';
  ipDisplay.rel = 'noopener noreferrer';

  // Link is updated when the IP becomes available
  
  document.body.appendChild(ipDisplay);
}

// Retrieve and display the IP
function displayIP(forceRefresh = false) {
  const hostname = window.location.hostname;
  
  if (!hostname) {
    if (ipDisplay) {
      ipDisplay.textContent = 'Geen hostname';
    }
    return;
  }
  
  // If the hostname is already an IP address, show it
    if (hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      if (ipDisplay) {
        ipDisplay.textContent = hostname;
        ipDisplay.title = 'Dit is al een IP-adres';
        ipDisplay.href = `https://ipinfo.io/${hostname}/json?token=63251f89ade4d1`;
      }
      return;
    }
  
  // Show that a lookup is in progress
  if (ipDisplay) {
    ipDisplay.textContent = 'Zoeken...';
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
      if (ipDisplay) {
        ipDisplay.textContent = currentIP;
        ipDisplay.title = `${hostname} → ${currentIP}`;
        ipDisplay.href = `https://ipinfo.io/${currentIP}/json?token=63251f89ade4d1`;
      }
    } else {
      // Retry after a short delay if lookup fails
      if (!forceRefresh) {
        setTimeout(() => displayIP(true), 1000);
      } else {
        if (ipDisplay) {
          ipDisplay.textContent = 'IP onbekend';
          ipDisplay.title = hostname;
          ipDisplay.href = '#';
        }
      }
    }
  }).catch(error => {
    isLookingUp = false;
    console.error('Fout bij ophalen IP:', error);
    if (ipDisplay) {
      ipDisplay.textContent = 'Fout';
      ipDisplay.title = hostname;
      ipDisplay.href = '#';
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
