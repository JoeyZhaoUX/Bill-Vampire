// Affiliate link mappings for AI alternative recommendations.
// When AI suggests an alternative, we match keywords and append affiliate links.
//
// HOW TO SET UP:
// 1. Sign up for each affiliate program (URLs in comments below)
// 2. Replace the placeholder URLs with your actual affiliate/referral links
// 3. Each program typically gives you a unique tracking URL or coupon code
//
// -----------------------------------------------------------------------
// AFFILIATE PROGRAM SIGN-UP LINKS (bookmark these):
//
// NordVPN        — https://nordvpn.com/affiliates/          (40-100% first payment, via Impact)
// Surfshark      — https://surfshark.com/affiliate           (40% recurring, via Impact)
// ExpressVPN     — https://www.expressvpn.com/affiliates     ($13-36 per sale)
// ProtonMail/VPN — https://proton.me/support/referral-program (credits-based referral, in-app)
// 1Password      — https://1password.com/affiliates/         (25% per sale, via Impact)
// NordPass       — https://nordpass.com/affiliates/          (40-100%, via Impact)
// pCloud         — https://www.pcloud.com/affiliate.html     (up to $30/sale lifetime plans)
// Canva          — https://www.canva.com/affiliates/         ($36 per Pro subscription, via Impact)
// Todoist        — https://todoist.com/affiliate             ($6 per Pro signup)
// Grammarly      — https://www.grammarly.com/affiliates      ($20 per activation, via Impact)
// Setapp         — https://setapp.com/affiliate              (recurring %, curated Mac app bundle)
// Notion         — https://www.notion.so/affiliates          (50% first year, via Impact)
// Linear         — https://linear.app (no public affiliate — remove if not accepted)
// Skillshare     — https://www.skillshare.com/affiliates     ($7 per free trial signup)
// Hostinger      — https://www.hostinger.com/affiliates      (60% per sale)
// Namecheap      — https://www.namecheap.com/affiliates/     (20-35% per sale)
// -----------------------------------------------------------------------

const AFFILIATE_MAP = [
  // --- VPN (alternatives to expensive VPNs) ---
  { keywords: ['nordvpn', 'nord vpn'], url: 'https://nordvpn.com/?ref=REPLACE_ME', label: 'NordVPN', category: 'vpn' },
  { keywords: ['surfshark'], url: 'https://surfshark.com/?ref=REPLACE_ME', label: 'Surfshark', category: 'vpn' },
  { keywords: ['expressvpn', 'express vpn'], url: 'https://expressvpn.com/?ref=REPLACE_ME', label: 'ExpressVPN', category: 'vpn' },
  { keywords: ['protonvpn', 'proton vpn'], url: 'https://protonvpn.com/?ref=REPLACE_ME', label: 'ProtonVPN', category: 'vpn' },

  // --- Password Managers (alternatives to LastPass, Dashlane) ---
  { keywords: ['1password', 'one password'], url: 'https://1password.com/?ref=REPLACE_ME', label: '1Password', category: 'security' },
  { keywords: ['nordpass', 'nord pass'], url: 'https://nordpass.com/?ref=REPLACE_ME', label: 'NordPass', category: 'security' },
  { keywords: ['bitwarden'], url: 'https://bitwarden.com', label: 'Bitwarden', category: 'security' },

  // --- Email & Privacy (alternatives to Gmail, Outlook) ---
  { keywords: ['proton', 'protonmail', 'proton mail'], url: 'https://proton.me/?ref=REPLACE_ME', label: 'Proton Mail', category: 'email' },

  // --- Cloud Storage (alternatives to Dropbox, iCloud, Google Drive) ---
  { keywords: ['pcloud', 'p cloud'], url: 'https://www.pcloud.com/?ref=REPLACE_ME', label: 'pCloud', category: 'storage' },

  // --- Productivity (alternatives to Asana, Monday, MS Office) ---
  { keywords: ['notion'], url: 'https://notion.so/?ref=REPLACE_ME', label: 'Notion', category: 'productivity' },
  { keywords: ['todoist'], url: 'https://todoist.com/?ref=REPLACE_ME', label: 'Todoist', category: 'productivity' },
  { keywords: ['obsidian'], url: 'https://obsidian.md', label: 'Obsidian', category: 'productivity' },
  { keywords: ['linear'], url: 'https://linear.app', label: 'Linear', category: 'productivity' },

  // --- Design (alternatives to Adobe CC) ---
  { keywords: ['canva'], url: 'https://canva.com/?ref=REPLACE_ME', label: 'Canva', category: 'design' },

  // --- Writing (alternatives to premium writing tools) ---
  { keywords: ['grammarly'], url: 'https://grammarly.com/?ref=REPLACE_ME', label: 'Grammarly', category: 'writing' },

  // --- Mac App Bundle (alternative to buying individual apps) ---
  { keywords: ['setapp'], url: 'https://setapp.com/?ref=REPLACE_ME', label: 'Setapp', category: 'apps' },

  // --- Learning (alternatives to expensive courses) ---
  { keywords: ['skillshare'], url: 'https://skillshare.com/?ref=REPLACE_ME', label: 'Skillshare', category: 'learning' },

  // --- Hosting (alternatives to expensive hosting) ---
  { keywords: ['hostinger'], url: 'https://hostinger.com/?ref=REPLACE_ME', label: 'Hostinger', category: 'hosting' },
  { keywords: ['namecheap'], url: 'https://namecheap.com/?ref=REPLACE_ME', label: 'Namecheap', category: 'hosting' },

  // --- Free alternatives (no affiliate, but good for user trust) ---
  { keywords: ['tubi'], url: 'https://tubitv.com', label: 'Tubi', category: 'streaming' },
  { keywords: ['pluto tv', 'plutotv'], url: 'https://pluto.tv', label: 'Pluto TV', category: 'streaming' },
  { keywords: ['duckduckgo'], url: 'https://duckduckgo.com', label: 'DuckDuckGo', category: 'search' },
  { keywords: ['brave'], url: 'https://brave.com', label: 'Brave', category: 'browser' },
  { keywords: ['libreoffice', 'libre office'], url: 'https://libreoffice.org', label: 'LibreOffice', category: 'productivity' },
  { keywords: ['gimp'], url: 'https://gimp.org', label: 'GIMP', category: 'design' },
  { keywords: ['davinci resolve', 'davinci'], url: 'https://blackmagicdesign.com/products/davinciresolve', label: 'DaVinci Resolve', category: 'video' },
];

// Products we especially want AI to recommend (ones with affiliate programs)
export const PREFERRED_ALTERNATIVES = [
  'NordVPN', 'Surfshark', '1Password', 'NordPass', 'Proton Mail', 'ProtonVPN',
  'pCloud', 'Notion', 'Todoist', 'Canva', 'Grammarly', 'Setapp',
  'Skillshare', 'Hostinger', 'Namecheap',
];

// Inject affiliate links into AI response text.
// Looks for known product names and appends a small linked badge.
export function injectAffiliateLinks(text) {
  let result = text;
  const injected = [];

  for (const entry of AFFILIATE_MAP) {
    for (const keyword of entry.keywords) {
      const regex = new RegExp(`(${keyword})`, 'gi');
      if (regex.test(result) && !injected.includes(entry.label)) {
        injected.push(entry.label);
        break;
      }
    }
  }

  return { text: result, affiliateLinks: injected.map(label => {
    const entry = AFFILIATE_MAP.find(e => e.label === label);
    return entry ? { label: entry.label, url: entry.url, category: entry.category } : null;
  }).filter(Boolean) };
}
