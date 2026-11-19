// Copies the golfers' guide (../guide/dist) into public/info so the draw site serves it at /info/.
// Rewrites each page's external fonts, relative paths (blocked by the CSP) and its absolute links for this host.
import { cpSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const source = fileURLToPath(new URL('../../guide/dist', import.meta.url));
const target = fileURLToPath(new URL('../public/info', import.meta.url));
rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });
for (const name of readdirSync(target).filter(file => file.endsWith('.html'))) {
  const page = `${target}/${name}`;
  const html = readFileSync(page, 'utf8')
    .replace(/<link rel="preconnect"[^\n]*\n/, '')
    .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/, '<link rel="stylesheet" href="/fonts.css">')
    .replaceAll('https://slg-golf-draw.vercel.app/', '/')
    .replaceAll('https://slg-golf-day.vercel.app/', 'https://slg-golf-draw.vercel.app/info/')
    // "./" is the guide's home page, which lives at /info/ here
    .replace(/(src|href)="\.\/([^"]*)"/g, '$1="/info/$2"')
    // root-relative so the page works at both /info and /info/
    .replace(/(src|href)="(?![a-z]+:|\/|#)([^"]+)"/g, '$1="/info/$2"');
  if (/fonts\.googleapis|slg-golf-day\.vercel/.test(html)) throw new Error(`${name} still references an external font or old URL.`);
  writeFileSync(page, html);
}
console.log('Guide copied to public/info.');
