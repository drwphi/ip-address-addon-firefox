// background.js - Retrieves IP addresses for websites
const ipCache = new Map();

// Listen for messages from content scripts
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getIP') {
    const hostname = request.hostname;
    
    // Check cache first
    if (ipCache.has(hostname)) {
      sendResponse({ ip: ipCache.get(hostname) });
      return;
    }
    
    // Try to resolve using the browser DNS API first
    resolveIP(hostname).then(ip => {
      if (ip) {
        ipCache.set(hostname, ip);
        sendResponse({ ip: ip });
      } else {
        sendResponse({ ip: null, error: 'IP niet gevonden' });
      }
    }).catch(error => {
      console.error('IP lookup fout:', error);
      sendResponse({ ip: null, error: error.message });
    });
    
    return true; // Async response
  }
});

// Resolve IP address using the browser DNS API; fall back to external lookup on failure
async function resolveIP(hostname) {
  try {
    const result = await browser.dns.resolve(hostname);
    if (result && result.addresses && result.addresses.length > 0) {
      return result.addresses[0];
    }
  } catch (e) {
    console.log('browser.dns failed, using external API...');
  }
  return fetchIPFromAPI(hostname);
}

// Function that uses an external API for IP lookup
async function fetchIPFromAPI(hostname) {
  const lookups = [
    `https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=A`,
    `https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=AAAA`,
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=A`,
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=AAAA`
  ];

  for (const url of lookups) {
    try {
      const headers = url.includes('cloudflare') ? { 'Accept': 'application/dns-json' } : {};
      const response = await fetch(url, { headers });
      if (response.ok) {
        const data = await response.json();
        if (data.Answer && data.Answer.length > 0) {
          for (const answer of data.Answer) {
            if (answer.type === 1 || answer.type === 28) {
              return answer.data;
            }
          }
        }
      }
    } catch (e) {
      // Try next service
    }
  }
  
  return null;
}

// Clear cache every 30 minutes
setInterval(() => {
  ipCache.clear();
}, 30 * 60 * 1000);

// Listen for tab updates to clear the cache for specific hosts
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    try {
      const url = new URL(tab.url);
      const hostname = url.hostname;
      // Remove from cache to force a fresh lookup
      ipCache.delete(hostname);
    } catch (e) {
      // Ignore invalid URLs
    }
  }
});
