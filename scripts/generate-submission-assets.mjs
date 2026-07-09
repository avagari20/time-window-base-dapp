import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(new URL("..", import.meta.url).pathname);
const outDir = join(root, "base-submission");
const W = 1284;
const H = 2778;

const c = {
  bg: "#f2f4f7",
  panel: "#ffffff",
  line: "rgba(16,32,51,0.10)",
  ink: "#102033",
  navy: "#16324d",
  blue: "#dbe8f6",
  red: "#e84a5f",
};

function esc(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function wrap(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function frame(content) {
  return `
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="${c.bg}"/>
    <path d="M0 240H1284M0 480H1284M0 720H1284M0 960H1284M0 1200H1284M0 1440H1284M0 1680H1284M0 1920H1284M0 2160H1284M0 2400H1284M0 2640H1284" stroke="${c.line}" stroke-width="3"/>
    ${content}
  </svg>`;
}

function titleBlock(title, subtitle) {
  return `
    <text x="82" y="130" font-family="Courier New, monospace" font-size="30" font-weight="900" letter-spacing="7" fill="${c.red}">TIME WINDOW</text>
    <text x="80" y="236" font-family="Arial, sans-serif" font-size="82" font-weight="900" fill="${c.ink}">${esc(title)}</text>
    <text x="84" y="306" font-family="Arial, sans-serif" font-size="34" font-weight="800" fill="${c.navy}">${esc(subtitle)}</text>
  `;
}

function board(x, y, label, hour, note, wallet, date) {
  const noteLines = wrap(note, 34).slice(0, 3);
  return `
    <rect x="${x}" y="${y}" width="1080" height="1240" rx="34" fill="${c.panel}" stroke="${c.line}" stroke-width="6"/>
    <rect x="${x + 44}" y="${y + 42}" width="992" height="170" rx="24" fill="${c.blue}"/>
    <text x="${x + 88}" y="${y + 104}" font-family="Courier New, monospace" font-size="24" font-weight="900" letter-spacing="5" fill="${c.red}">SLOT LABEL</text>
    <text x="${x + 88}" y="${y + 168}" font-family="Arial, sans-serif" font-size="56" font-weight="900" fill="${c.ink}">${esc(label)}</text>
    <rect x="${x + 44}" y="${y + 262}" width="992" height="370" rx="28" fill="${c.navy}"/>
    <text x="${x + 386}" y="${y + 406}" font-family="Courier New, monospace" font-size="26" font-weight="900" letter-spacing="6" fill="white">CLAIMED HOUR</text>
    <text x="${x + 250}" y="${y + 542}" font-family="Courier New, monospace" font-size="126" font-weight="900" letter-spacing="8" fill="white">${esc(hour)}</text>
    <rect x="${x + 44}" y="${y + 674}" width="992" height="180" rx="24" fill="#f7f9fb" stroke="${c.line}" stroke-width="4"/>
    <text x="${x + 86}" y="${y + 734}" font-family="Courier New, monospace" font-size="21" font-weight="900" fill="${c.red}">SLOT NOTE</text>
    ${noteLines.map((line, i) => `<text x="${x + 86}" y="${y + 790 + i * 34}" font-family="Arial, sans-serif" font-size="30" font-weight="850" fill="${c.ink}">${esc(line)}</text>`).join("")}
    <rect x="${x + 44}" y="${y + 900}" width="304" height="220" rx="22" fill="#f7f9fb"/>
    <rect x="${x + 388}" y="${y + 900}" width="304" height="220" rx="22" fill="#f7f9fb"/>
    <rect x="${x + 732}" y="${y + 900}" width="304" height="220" rx="22" fill="#f7f9fb"/>
    <text x="${x + 78}" y="${y + 962}" font-family="Courier New, monospace" font-size="20" font-weight="900" fill="${c.red}">WINDOW</text>
    <text x="${x + 78}" y="${y + 1030}" font-family="Arial, sans-serif" font-size="36" font-weight="900" fill="${c.ink}">${esc(hour)}</text>
    <text x="${x + 422}" y="${y + 962}" font-family="Courier New, monospace" font-size="20" font-weight="900" fill="${c.red}">WALLET</text>
    <text x="${x + 422}" y="${y + 1030}" font-family="Arial, sans-serif" font-size="32" font-weight="900" fill="${c.ink}">${esc(wallet)}</text>
    <text x="${x + 766}" y="${y + 962}" font-family="Courier New, monospace" font-size="20" font-weight="900" fill="${c.red}">STAMPED</text>
    <text x="${x + 766}" y="${y + 1030}" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="${c.ink}">${esc(date)}</text>
  `;
}

function panel(x, y, title, body, fill = "#f7f9fb") {
  return `
    <rect x="${x}" y="${y}" width="520" height="220" rx="24" fill="${fill}" stroke="${c.line}" stroke-width="5"/>
    <text x="${x + 34}" y="${y + 74}" font-family="Courier New, monospace" font-size="20" font-weight="900" letter-spacing="5" fill="${c.red}">${esc(title)}</text>
    ${wrap(body, 30).slice(0, 3).map((line, i) => `<text x="${x + 34}" y="${y + 128 + i * 34}" font-family="Arial, sans-serif" font-size="30" font-weight="850" fill="${c.ink}">${esc(line)}</text>`).join("")}
  `;
}

function screenshot1() {
  return frame(`
    ${titleBlock("Claim a short slot.", "Use Base to book a small public time window.")}
    ${board(102, 420, "Office Hours", "10:00 AM", "Quick product feedback and launch questions.", "0x65...020d", "May 18")}
    ${panel(102, 1740, "Use case", "Office hours, demo desks, reviews, or small sign-up windows.")}
    ${panel(662, 1740, "Public record", "Wallet, hour, note, and timestamp stay visible by ID.", c.blue)}
  `);
}

function screenshot2() {
  return frame(`
    ${titleBlock("Pick the next hour.", "Select a preset slot and claim it on Base.")}
    ${panel(102, 420, "Preset", "Demo Slot at 11:30 AM.", c.blue)}
    ${panel(662, 420, "Action", "Claim on Base")}
    ${board(102, 760, "Demo Slot", "11:30 AM", "Five-minute walkthrough at the builder desk.", "0x42...af62", "May 18")}
  `);
}

function screenshot3() {
  return frame(`
    ${titleBlock("Reload any slot.", "Look up a claimed time window by ID.")}
    ${board(102, 420, "Creator Review", "2:00 PM", "Short review window for creator app concepts.", "0x99...9652", "May 18")}
    ${panel(102, 1740, "Lookup", "Reload a claimed time slot by window ID.")}
    ${panel(662, 1740, "Receipt", "Open the Base transaction after confirmation.", c.blue)}
  `);
}

function iconSvg() {
  return `
  <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1024" fill="${c.bg}"/>
    <rect x="140" y="160" width="744" height="704" rx="82" fill="${c.panel}" stroke="${c.line}" stroke-width="24"/>
    <rect x="200" y="236" width="624" height="150" rx="30" fill="${c.blue}"/>
    <rect x="200" y="432" width="624" height="230" rx="30" fill="${c.navy}"/>
    <text x="244" y="342" font-family="Arial, sans-serif" font-size="90" font-weight="900" fill="${c.ink}">SLOT</text>
    <text x="258" y="586" font-family="Courier New, monospace" font-size="142" font-weight="900" fill="white">10:00</text>
    <rect x="200" y="714" width="286" height="94" rx="22" fill="#f7f9fb"/>
    <rect x="538" y="714" width="286" height="94" rx="22" fill="#f7f9fb"/>
  </svg>`;
}

function thumbnailSvg() {
  return `
  <svg width="1910" height="1000" viewBox="0 0 1910 1000" xmlns="http://www.w3.org/2000/svg">
    <rect width="1910" height="1000" fill="${c.bg}"/>
    <text x="94" y="154" font-family="Arial, sans-serif" font-size="118" font-weight="900" fill="${c.ink}">Time Window</text>
    <text x="102" y="246" font-family="Arial, sans-serif" font-size="42" font-weight="800" fill="${c.navy}">Claim a short public slot on Base.</text>
    ${panel(96, 390, "Use case", "Office hours, reviews, demos, and small appointment blocks.")}
    ${panel(96, 662, "Result", "Public time slot with wallet and receipt on Base.", c.blue)}
    ${board(770, 86, "Office Hours", "10:00 AM", "Quick product feedback and launch questions.", "0x65...020d", "May 18")}
  </svg>`;
}

async function writePng(name, svg, width = W, height = H) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg)).resize(width, height).png({ compressionLevel: 9 }).toFile(file);
  return file;
}

async function writeJpg(name, svg, width, height) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg)).resize(width, height).jpeg({ quality: 88, mozjpeg: true }).toFile(file);
  return file;
}

await mkdir(outDir, { recursive: true });

const files = [
  await writeJpg("app-icon.jpg", iconSvg(), 1024, 1024),
  await writeJpg("app-thumbnail.jpg", thumbnailSvg(), 1910, 1000),
  await writePng("screenshot-1.png", screenshot1()),
  await writePng("screenshot-2.png", screenshot2()),
  await writePng("screenshot-3.png", screenshot3()),
];

await writeFile(join(outDir, "asset-manifest.json"), JSON.stringify({ generatedAt: new Date().toISOString(), files }, null, 2), "utf8");
await writeFile(
  join(outDir, "submission-copy.md"),
  [
    "# Time Window",
    "",
    "App Name: Time Window",
    "Tagline: Claim a short slot",
    "Description: Claim a public short time slot with label, hour, note, wallet, and timestamp on Base for demos and office hours.",
    "",
    "Domain: https://time-window.vercel.app",
    "",
    "Assets:",
    "- app-icon.jpg",
    "- app-thumbnail.jpg",
    "- screenshot-1.png",
    "- screenshot-2.png",
    "- screenshot-3.png",
    "",
  ].join("\n"),
  "utf8",
);

console.log(`Generated ${files.length} Base submission assets in ${outDir}`);
