// background.js - Haalt IP-adressen op voor websites
const ipCache = new Map();

// Luister naar berichten van content scripts
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getIP') {
    const hostname = request.hostname;
    
    // Check cache eerst
    if (ipCache.has(hostname)) {
      sendResponse({ ip: ipCache.get(hostname) });
      return;
    }
    
    // Gebruik externe API voor betrouwbare IP lookup
    fetchIPFromAPI(hostname).then(ip => {
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

// Functie die externe API gebruikt voor IP lookup
async function fetchIPFromAPI(hostname) {
  try {
    // Methode 1: Gebruik ipapi.co
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
    // Methode 2: Gebruik dns.google.com
    const response2 = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=A`);
    const data = await response2.json();
    
    if (data.Answer && data.Answer.length > 0) {
      // Zoek naar een A record (IPv4)
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
    // Methode 3: Gebruik cloudflare DNS
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

// Clear cache elke 30 minuten
setInterval(() => {
  ipCache.clear();
}, 30 * 60 * 1000);

// Luister naar tab updates om cache te clearen voor specifieke hosts
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    try {
      const url = new URL(tab.url);
      const hostname = url.hostname;
      // Verwijder uit cache om verse lookup te forceren
      ipCache.delete(hostname);
    } catch (e) {
      // Ignore invalid URLs
    }
  }
});
