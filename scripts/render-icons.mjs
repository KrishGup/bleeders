#!/usr/bin/env node
/**
 * Renders the PNG app icons and the Open Graph share card with headless
 * Chromium, from the same artwork the site uses.
 *
 *   npx playwright install chromium   # once, if you don't have it
 *   npm run icons
 *
 * Set CHROMIUM_PATH to use an existing Chromium binary instead.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pub = (...p) => resolve(root, 'public', ...p);
const mod = (...p) => resolve(root, 'node_modules', ...p);
const font = (path) => `url(data:font/woff2;base64,${readFileSync(path).toString('base64')}) format('woff2')`;

const favicon = readFileSync(pub('favicon.svg'), 'utf8');
const markOnly = favicon.replace(/<rect width="64" height="64" rx="15" fill="url\(#bg\)"\/>/, '');

async function launch() {
  const candidates = [
    process.env.CHROMIUM_PATH,
    undefined,
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  ];
  for (const executablePath of candidates) {
    if (executablePath && !existsSync(executablePath)) continue;
    try {
      return await chromium.launch(executablePath ? { executablePath } : {});
    } catch (error) {
      if (executablePath === candidates.at(-1)) throw error;
    }
  }
  throw new Error('No Chromium available — run `npx playwright install chromium` or set CHROMIUM_PATH.');
}

const browser = await launch();
const page = await browser.newPage();

async function render(html, width, height, out) {
  await page.setViewportSize({ width, height });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out, omitBackground: false });
  console.log('wrote', out.replace(`${root}/`, ''));
}

const iconPage = (
  size,
  { fullBleed = false, scale = 1 } = {},
) => `<!doctype html><html><body style="margin:0;background:${fullBleed ? '#08080c' : 'transparent'}">
  <div style="width:${size}px;height:${size}px;display:grid;place-items:center;background:${
    fullBleed ? 'radial-gradient(circle at 30% 25%, #1f1f2c, #050508 75%)' : 'transparent'
  }">
    <div style="width:${size * scale}px;height:${size * scale}px">${(fullBleed ? markOnly : favicon).replace(
      '<svg ',
      '<svg width="100%" height="100%" ',
    )}</div>
  </div></body></html>`;

await render(iconPage(192), 192, 192, pub('icons', 'icon-192.png'));
await render(iconPage(512), 512, 512, pub('icons', 'icon-512.png'));
await render(iconPage(512, { fullBleed: true, scale: 0.72 }), 512, 512, pub('icons', 'maskable-512.png'));
await render(iconPage(180, { fullBleed: true, scale: 0.86 }), 180, 180, pub('icons', 'apple-touch-icon.png'));

const og = `<!doctype html><html><head><style>
  @font-face { font-family: 'Cinzel'; font-weight: 900; src: ${font(mod('@fontsource/cinzel/files/cinzel-latin-900-normal.woff2'))}; }
  @font-face { font-family: 'Inter'; font-weight: 100 900; src: ${font(mod('@fontsource-variable/inter/files/inter-latin-wght-normal.woff2'))}; }
  @font-face { font-family: 'Kanji'; font-weight: 800; src: ${font(resolve(root, 'src/assets/fonts/shippori-kanji-800.woff2'))}; }
  * { box-sizing: border-box; }
  body { margin: 0; width: 1200px; height: 630px; overflow: hidden; font-family: Inter, sans-serif; color: #f3f1ec;
    background: radial-gradient(900px 420px at 50% -10%, rgba(116,212,255,.22), transparent 60%),
      radial-gradient(700px 420px at -5% 110%, rgba(227,38,59,.22), transparent 60%),
      radial-gradient(600px 400px at 105% 90%, rgba(185,150,255,.14), transparent 60%), #08080c; }
  .wrap { height: 100%; display: grid; place-items: center; align-content: center; gap: 26px; position: relative; }
  .kanji-bg { position: absolute; right: -40px; top: -60px; font: 800 620px/1 Kanji; color: rgba(116,212,255,.05); }
  .word { position: relative; font: 900 156px/1 Cinzel; letter-spacing: .14em; padding-left: .14em; }
  .top { clip-path: polygon(0 0,100% 0,100% 36%,0 66%); background: linear-gradient(#fff,#cfd6e6); -webkit-background-clip: text; color: transparent; }
  .bottom { position: absolute; inset: 0; padding-left: .14em; clip-path: polygon(0 66%,100% 36%,100% 100%,0 100%); transform: translate(.05em,.035em);
    background: linear-gradient(#e9e3df,#8b8f9c); -webkit-background-clip: text; color: transparent; }
  .glow { position: absolute; inset: 0; filter: drop-shadow(0 0 6px #e3263b) drop-shadow(0 0 20px rgba(227,38,59,.5)); }
  .slash { position: absolute; inset: 0 -3%; background: linear-gradient(90deg,transparent,#fff 18%,#ffd2d7 45%,#e3263b 80%,transparent);
    clip-path: polygon(0 67.4%,100% 36.2%,100% 38.4%,0 69.6%); }
  .sub { font: 800 26px/1 Kanji; letter-spacing: .6em; color: #aeacb8; }
  .tag { font-size: 30px; font-weight: 600; color: #d8d6e0; }
  .modes { display: flex; gap: 16px; }
  .mode { display: flex; align-items: center; gap: 12px; padding: 12px 22px 12px 14px; border-radius: 18px;
    background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.12); font-size: 24px; font-weight: 700; }
  .mode b { display: grid; place-items: center; width: 46px; height: 46px; border-radius: 12px; font: 800 26px/1 Kanji; color: #08080c; }
  .foot { font-size: 21px; color: #8f8d9b; letter-spacing: .04em; }
</style></head><body><div class="wrap">
  <div class="kanji-bg">魂</div>
  <div class="word"><div class="top">BLEEDLE</div><div class="bottom">BLEEDLE</div><div class="glow"><div class="slash"></div></div></div>
  <div class="sub">ブリードル</div>
  <div class="tag">The daily Bleach character guessing game</div>
  <div class="modes">
    <div class="mode"><b style="background:#74d4ff">魂</b>Classic</div>
    <div class="mode"><b style="background:#ff5a76">解</b>Release</div>
    <div class="mode"><b style="background:#f3c55a">言</b>Quote</div>
    <div class="mode"><b style="background:#b996ff">絵</b>Emoji</div>
  </div>
  <div class="foot">200+ souls · filler & films included · new puzzles every midnight</div>
</div></body></html>`;

await render(og, 1200, 630, pub('og-image.png'));
await browser.close();
