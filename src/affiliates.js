// Affiliate link mappings for AI alternative recommendations.
// When AI suggests an alternative, we match keywords and append affiliate links.
// Replace placeholder URLs with your actual affiliate/referral links.

const AFFILIATE_MAP = [
  { keywords: ['bitwarden'], url: 'https://bitwarden.com/?ref=billvampire', label: 'Bitwarden' },
  { keywords: ['proton', 'protonmail', 'proton mail'], url: 'https://proton.me/?ref=billvampire', label: 'Proton' },
  { keywords: ['notion'], url: 'https://notion.so/?ref=billvampire', label: 'Notion' },
  { keywords: ['canva'], url: 'https://canva.com/?ref=billvampire', label: 'Canva' },
  { keywords: ['tubi'], url: 'https://tubitv.com/?ref=billvampire', label: 'Tubi' },
  { keywords: ['nordvpn', 'nord vpn'], url: 'https://nordvpn.com/?ref=billvampire', label: 'NordVPN' },
  { keywords: ['surfshark'], url: 'https://surfshark.com/?ref=billvampire', label: 'Surfshark' },
  { keywords: ['mullvad'], url: 'https://mullvad.net/?ref=billvampire', label: 'Mullvad' },
  { keywords: ['obsidian'], url: 'https://obsidian.md/?ref=billvampire', label: 'Obsidian' },
  { keywords: ['linear'], url: 'https://linear.app/?ref=billvampire', label: 'Linear' },
  { keywords: ['pluto tv', 'plutotv'], url: 'https://pluto.tv/?ref=billvampire', label: 'Pluto TV' },
  { keywords: ['duckduckgo'], url: 'https://duckduckgo.com/?ref=billvampire', label: 'DuckDuckGo' },
  { keywords: ['brave'], url: 'https://brave.com/?ref=billvampire', label: 'Brave' },
  { keywords: ['libreoffice'], url: 'https://libreoffice.org/?ref=billvampire', label: 'LibreOffice' },
  { keywords: ['gimp'], url: 'https://gimp.org/?ref=billvampire', label: 'GIMP' },
  { keywords: ['davinci resolve', 'davinci'], url: 'https://blackmagicdesign.com/products/davinciresolve/?ref=billvampire', label: 'DaVinci Resolve' },
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
        // We don't mutate the text inline — we collect matches and render links separately
        break;
      }
    }
  }

  return { text: result, affiliateLinks: injected.map(label => {
    const entry = AFFILIATE_MAP.find(e => e.label === label);
    return entry ? { label: entry.label, url: entry.url } : null;
  }).filter(Boolean) };
}
