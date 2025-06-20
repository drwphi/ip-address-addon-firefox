// background.js - Retrieves IP addresses for websites
const ipCache = new Map();
// Cache entries remain valid for thirty minutes
const CACHE_DURATION_MS = 30 * 60 * 1000;

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
    const result = await browser.dns.resolve(hostname, ["disable_ipv6"]);
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
  try {
    // Method 1: use ipapi.co
    const response1 = await fetch(`https://ipapi.co/${hostname}/json/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 Firefox Extension'
      }
    });
    
    if (response1.ok) {
      const data = await response1.json();
      if (data.ip) {
        return data.ip;
      }
    }
  } catch (e) {
    console.log('ipapi.co failed, trying alternative...');
  }
  
  try {
    // Method 2: use dns.google.com
    const response2 = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=A`);
    const data = await response2.json();
    
    if (data.Answer && data.Answer.length > 0) {
      // Look for an A record (IPv4)
      for (const answer of data.Answer) {
        if (answer.type === 1) { // Type 1 = A record
          return answer.data;
        }
      }
    }
  } catch (e) {
    console.log('dns.google failed, trying alternative...');
  }
  
  try {
    // Method 3: use Cloudflare DNS
    const response3 = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=A`, {
      headers: {
        'Accept': 'application/dns-json'
      }
    });
    
    if (response3.ok) {
      const data = await response3.json();
      if (data.Answer && data.Answer.length > 0) {
        for (const answer of data.Answer) {
          if (answer.type === 1) {
            return answer.data;
          }
        }
      }
    }
  } catch (e) {
    console.log('Cloudflare DNS failed');
  }
  
  return null;
}

// Clear the entire cache at regular intervals
setInterval(() => {
  ipCache.clear();
}, CACHE_DURATION_MS);

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
