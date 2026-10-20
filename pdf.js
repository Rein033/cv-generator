/* Echte PDF-download. De browser zet het cv op zoals in het voorbeeld; dit bestand tekent precies die opmaak na met pdf-lib,
   zodat de tekst echte, doorzoekbare tekst blijft (fijn voor sollicitatiesystemen). Het cv zelf gaat nergens heen:
   alleen pdf-lib en de lettertypen worden (één keer) van jsDelivr opgehaald. */
'use strict';

const CDN = 'https://cdn.jsdelivr.net/';
const PDF_LIBS = ['npm/pdf-lib@1.17.1/dist/pdf-lib.min.js', 'npm/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js'];
const PDF_FONT = { calibri: 'carlito', opensans: 'open-sans', lato: 'lato', montserrat: 'montserrat', merriweather: 'merriweather', serif: 'source-serif-4' };
const MET_600 = new Set(['opensans', 'montserrat', 'serif']);   // deze laden in de pagina ook gewicht 600, de rest valt terug op vet
const MDI_TTF = 'npm/@mdi/font@7.4.47/fonts/materialdesignicons-webfont.ttf';
const PT = 0.75, MMPX = 96 / 25.4, A4 = [595.28, 841.89];      // 1 css-px = 0,75 pt; A4 in pt

const bestanden = new Map();
function haal(pad) {
  if (!bestanden.has(pad)) {
    const p = fetch(CDN + pad).then((r) => { if (!r.ok) throw new Error('Niet gevonden: ' + pad); return r.arrayBuffer(); });
    p.catch(() => bestanden.delete(pad)); bestanden.set(pad, p);
  }
  return bestanden.get(pad);
}
let pdfLibs = null;
function laadLibs() {
  pdfLibs ||= Promise.all(PDF_LIBS.map((src) => new Promise((ok, nee) => {
    document.head.append(Object.assign(document.createElement('script'), { src: CDN + src, onload: ok, onerror: () => nee(new Error('Laden mislukt: ' + src)) }));
  }))).catch((e) => { pdfLibs = null; throw e; });
  return pdfLibs;
}

/* rgb(a)/color(srgb …) uit getComputedStyle → [r, g, b, alfa] (0-1) */
function kleur(s) {
  let m = /rgba?\(([^)]+)\)/.exec(s);
  if (m) { const [r, g, b, a = 1] = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [r / 255, g / 255, b / 255, a]; }
  m = /color\(srgb ([^)]+)\)/.exec(s);
  if (m) { const [r, g, b, a = 1] = m[1].split(/[\s/]+/).filter(Boolean).map(Number); return [r, g, b, a]; }
  return null;
}
const straal = (v, w) => (v.endsWith('%') ? parseFloat(v) / 100 * w : parseFloat(v)) || 0;

/* Hoogte boven/onder de basislijn zoals de browser die gebruikt, voor één lettertype */
const maatCanvas = document.createElement('canvas').getContext('2d');
const metrieken = new Map();
function metriek(cs) {
  const f = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  if (!metrieken.has(f)) { maatCanvas.font = f; const m = maatCanvas.measureText('Hg'); metrieken.set(f, [m.fontBoundingBoxAscent, m.fontBoundingBoxDescent]); }
  return metrieken.get(f);
}
const basislijn = (cs, top, h) => { const [a, d] = metriek(cs); return top + (h - (a + d)) / 2 + a; };

/* ── Stap 1: de opmaak van het voorbeeld opmeten (zonder schaal) en omzetten in een lijst met vlakken, plaatjes en woorden ── */
function meetOp(paper) {
  const P = paper.getBoundingClientRect(), lijst = [], regels = [];
  const vak = (q) => ({ x: q.left - P.left, y: q.top - P.top, w: q.width, h: q.height });

  for (const el of [paper, ...paper.querySelectorAll('*')]) {
    if (el.closest('.pagebreak')) continue;
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = vak(el.getBoundingClientRect()); if (!r.w || !r.h) continue;
    const rad = straal(cs.borderTopLeftRadius, r.w);
    if (el !== paper) {
      const bg = kleur(cs.backgroundColor);
      const bw = ['Top', 'Right', 'Bottom', 'Left'].map((k) => (cs[`border${k}Style`] === 'none' ? 0 : parseFloat(cs[`border${k}Width`]) || 0));
      const bc = ['Top', 'Right', 'Bottom', 'Left'].map((k) => cs[`border${k}Color`]);
      const rand = bw.every((w) => w === bw[0]) && bc.every((c) => c === bc[0]) && bw[0] ? { w: bw[0], c: kleur(bc[0]) } : null;
      if (el.tagName === 'IMG') lijst.push({ t: 'img', ...r, rad, el, rand });
      else if ((bg && bg[3] > 0) || rand) lijst.push({ t: 'vlak', ...r, rad, bg: bg && bg[3] > 0 ? bg : null, rand });
      if (!rand) bw.forEach((w, i) => {   // losse randen (bijv. de lijn onder een kopje)
        const c = kleur(bc[i]); if (!w || !c || !c[3]) return;
        const z = [[r.x, r.y, r.w, w], [r.x + r.w - w, r.y, w, r.h], [r.x, r.y + r.h - w, r.w, w], [r.x, r.y, w, r.h]][i];
        lijst.push({ t: 'vlak', x: z[0], y: z[1], w: z[2], h: z[3], rad: 0, bg: c });
      });
      // ::before met een achtergrond (de blokjes in Modern) of een icoon (mdi)
      const vb = getComputedStyle(el, '::before');
      if (vb.content && vb.content !== 'none' && vb.display !== 'none') {
        if (el.classList.contains('mdi')) {
          const ch = vb.content.replace(/^["']|["']$/g, '');
          if (ch) lijst.push({ t: 'icoon', x: r.x, y: r.y, h: r.h, base: basislijn(vb, r.y, r.h), ch, size: parseFloat(vb.fontSize), kl: kleur(cs.color), op: +cs.opacity });
        } else if (vb.position === 'absolute' && kleur(vb.backgroundColor)?.[3]) {
          lijst.push({ t: 'vlak', x: r.x + parseFloat(vb.left), y: r.y + parseFloat(vb.top), w: parseFloat(vb.width), h: parseFloat(vb.height), rad: straal(vb.borderTopLeftRadius, parseFloat(vb.width)), bg: kleur(vb.backgroundColor) });
        }
      }
    }
  }

  // Tekst: per woord de plek die de browser koos, met de spatie erachter zodat kopiëren uit de PDF gewone zinnen geeft
  const loop = document.createTreeWalker(paper, NodeFilter.SHOW_TEXT), rng = document.createRange();
  for (let n = loop.nextNode(); n; n = loop.nextNode()) {
    const el = n.parentElement; if (el.closest('.pagebreak') || !n.data.trim()) continue;
    const cs = getComputedStyle(el); if (cs.display === 'none') continue;
    const stijl = { cs, size: parseFloat(cs.fontSize), kl: kleur(cs.color), ls: parseFloat(cs.letterSpacing) || 0, gewicht: +cs.fontWeight, schuin: cs.fontStyle !== 'normal', op: +cs.opacity,
      hoofd: cs.textTransform === 'uppercase' };
    let woord = null; const t = n.data;
    const klaar = () => { if (woord) { lijst.push(woord); regels.push(woord); woord = null; } };
    for (let i = 0; i < t.length; i++) {
      const lang = t.charCodeAt(i) >= 0xd800 && t.charCodeAt(i) < 0xdc00 ? 2 : 1;
      let ch = t.slice(i, i + lang); rng.setStart(n, i); rng.setEnd(n, i + lang); i += lang - 1;
      if (/\s/.test(ch)) { if (woord) { woord.s += ' '; klaar(); } continue; }
      const q = rng.getClientRects()[0]; if (!q || !q.width) continue;
      if (stijl.hoofd) ch = ch.toUpperCase();
      const y = q.top - P.top;
      if (woord && Math.abs(y - woord.y) > q.height / 2) klaar();   // nieuwe regel
      if (!woord) woord = { t: 'tekst', el, ...stijl, x: q.left - P.left, y, h: q.height, base: basislijn(cs, q.top, q.height) - P.top, s: '', xs: [] };
      woord.s += ch; woord.xs.push(q.left - P.left);
    }
    klaar();
  }

  // Opsommingstekens (die zitten niet in de pagina zelf): een bolletje links van de eerste regel van elk punt
  for (const li of paper.querySelectorAll('li')) {
    const cs = getComputedStyle(li), w = regels.find((r) => li.contains(r.el)); if (!w || cs.listStyleType === 'none') continue;
    const fs = parseFloat(cs.fontSize), rr = fs * 0.17, x = li.getBoundingClientRect().left - P.left - fs * 0.6;
    lijst.push({ t: 'vlak', x: x - rr, y: w.base - fs * 0.3 - rr, w: 2 * rr, h: 2 * rr, rad: rr, bg: kleur(cs.color) });
  }

  const blok = (sel) => [...paper.querySelectorAll(sel)].map((el) => vak(el.getBoundingClientRect()));
  return { lijst, regels, hoogte: P.height, blokken: blok('.item, .lvrow, .head'),
    koppen: [...paper.querySelectorAll('h2')].map((h) => ({ ...vak(h.getBoundingClientRect()), volgende: h.nextElementSibling && vak(h.nextElementSibling.getBoundingClientRect()) })) };
}

/* ── Stap 2: pagina-einden kiezen. Nooit door een regel, blok (functie, opleiding, vaardigheid) of direct onder een kopje ── */
function paginas(m, margeMm) {
  const uit = []; let s = 0;
  while (m.regels.some((r) => r.y >= s - 0.5)) {
    const ruimte = (297 - margeMm * (uit.length ? 2 : 1)) * MMPX;
    let e = s + ruimte;
    if (e >= m.hoogte) { uit.push([s, m.hoogte]); break; }
    for (let k = 0; k < 4; k++) {
      for (const r of m.regels) if (r.y < e && r.y + r.h > e) e = Math.min(e, r.y);
      for (const b of m.blokken) if (b.y < e && b.y + b.h > e && b.y > s + 20) e = Math.min(e, b.y);
      for (const h of m.koppen) if (h.y < e && h.y > s + 20 && h.volgende && h.volgende.y >= e - 1) e = Math.min(e, h.y);
    }
    if (e <= s + 20) e = s + ruimte;   // één blok langer dan een pagina: dan toch afbreken
    uit.push([s, e]); s = e;
  }
  return uit.length ? uit : [[0, m.hoogte]];
}

function rondPad(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  if (r < 0.2) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
  return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}`
    + `H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
}

/* Foto bijsnijden zoals object-fit: cover, met ronde hoeken, als PNG */
function fotoPng(img, w, h, rad) {
  const k = 3, c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
  const x = c.getContext('2d'), z = Math.min(img.naturalWidth / w, img.naturalHeight / h);
  x.beginPath(); x.roundRect(0, 0, c.width, c.height, rad * k); x.clip();
  x.drawImage(img, (img.naturalWidth - w * z) / 2, (img.naturalHeight - h * z) / 2, w * z, h * z, 0, 0, c.width, c.height);
  return c.toDataURL('image/png');
}

async function maakPdf() {
  const paper = $('#paper'), sc = $('#scaler');
  await Promise.all([laadLibs(), document.fonts?.ready]);
  const { PDFDocument, rgb, degrees, setCharacterSpacing } = window.PDFLib;

  teken(); sc.style.transform = 'none';
  let m; try { m = meetOp(paper); } finally { schaal(); }
  const marge = MARGES[cv.marge] || MARGES.normaal, stukken = paginas(m, marge);

  // Lettertypen ophalen: alleen de gewichten die echt gebruikt worden; latin-ext alleen als er tekens buiten latin zijn
  const slug = PDF_FONT[cv.font] || PDF_FONT.calibri;
  const gewicht = (w) => (w >= 600 ? (w < 700 && MET_600.has(cv.font) ? 600 : 700) : 400);
  const doc = await PDFDocument.create(); doc.registerFontkit(window.fontkit);
  const fonts = {};
  for (const w of new Set(m.regels.map((r) => gewicht(r.gewicht)))) {
    const f = await doc.embedFont(await haal(`fontsource/fonts/${slug}@latest/latin-${w}-normal.ttf`), { subset: true });
    const set = new Set(f.getCharacterSet()), ontbreekt = m.regels.some((r) => gewicht(r.gewicht) === w && [...r.s].some((c) => !set.has(c.codePointAt(0))));
    let ext = null, extSet = new Set();
    if (ontbreekt) {
      try { ext = await doc.embedFont(await haal(`fontsource/fonts/${slug}@latest/latin-ext-${w}-normal.ttf`), { subset: true }); extSet = new Set(ext.getCharacterSet()); } catch (e) { /* dan zonder */ }
    }
    fonts[w] = { f, set, ext, extSet };
  }
  // Iconen als vormen tekenen, niet als tekst: dan leest een sollicitatiesysteem er geen rare tekens in
  const iconen = m.lijst.some((d) => d.t === 'icoon') ? window.fontkit.create(new Uint8Array(await haal(MDI_TTF))) : null;
  const icoonPad = (ch) => {
    const g = iconen.glyphForCodePoint(ch.codePointAt(0)), L = { moveTo: 'M', lineTo: 'L', quadraticCurveTo: 'Q', bezierCurveTo: 'C', closePath: 'Z' };
    return g.path.commands.map((c) => L[c.command] + c.args.map((v, i) => (i % 2 ? -v : v)).join(' ')).join('');
  };

  const RGB = (k) => rgb(...k.slice(0, 3).map((v) => Math.min(1, Math.max(0, v))));
  const fotos = new Map();

  for (let p = 0; p < stukken.length; p++) {
    const [s, e] = stukken[p], page = doc.addPage(A4), H = A4[1];
    const dy = (p ? marge * MMPX : 0) - s;                  // css-px op het cv → plek op deze pagina
    const Y = (y) => H - (y + dy) * PT;
    if (cv.layout === 'zijbalk') {   // gekleurde zijbalk (achtergrond van het papier) loopt op elke pagina door
      const aside = $('.cv aside', paper);
      page.drawRectangle({ x: 0, y: 0, width: aside.offsetWidth * PT, height: H, color: RGB(kleur(getComputedStyle(paper).backgroundImage) || [0, 0, 0]) });
    }
    for (const d of m.lijst) {
      const boven = d.y, onder = d.y + d.h;
      if (d.t === 'vlak') {
        if (onder <= s || boven >= e) continue;
        const heel = boven >= s - 0.5 && onder <= e + 0.5;
        const y0 = Math.max(boven, s), y1 = Math.min(onder, e);
        const opt = { x: 0, y: H };
        if (d.bg) Object.assign(opt, { color: RGB(d.bg), opacity: d.bg[3] });
        if (d.rand && heel) Object.assign(opt, { borderColor: RGB(d.rand.c), borderOpacity: d.rand.c[3], borderWidth: d.rand.w * PT });
        if (!opt.color && !opt.borderColor) continue;
        const inz = opt.borderColor ? d.rand.w / 2 : 0;
        page.drawSvgPath(rondPad((d.x + inz) * PT, (y0 + dy + inz) * PT, (d.w - 2 * inz) * PT, (y1 - y0 - 2 * inz) * PT, heel ? Math.max(0, d.rad - inz) * PT : 0), opt);
        continue;
      }
      if (boven < s - 0.5 || boven >= e - 0.5) continue;        // woorden, iconen en foto's staan op de pagina waar hun bovenkant valt
      if (d.t === 'img') {
        if (!d.el.complete || !d.el.naturalWidth) continue;
        if (!fotos.has(d.el.src)) fotos.set(d.el.src, await doc.embedPng(fotoPng(d.el, d.w, d.h, d.rad)));
        page.drawImage(fotos.get(d.el.src), { x: d.x * PT, y: Y(onder), width: d.w * PT, height: d.h * PT });
        if (d.rand) page.drawSvgPath(rondPad((d.x + d.rand.w / 2) * PT, (boven + dy + d.rand.w / 2) * PT, (d.w - d.rand.w) * PT, (d.h - d.rand.w) * PT, Math.max(0, d.rad - d.rand.w / 2) * PT),
          { x: 0, y: H, borderColor: RGB(d.rand.c), borderOpacity: d.rand.c[3], borderWidth: d.rand.w * PT });
      } else if (d.t === 'icoon' && iconen) {
        try { page.drawSvgPath(icoonPad(d.ch), { x: d.x * PT, y: Y(d.base), scale: d.size * PT / iconen.unitsPerEm, color: RGB(d.kl), opacity: d.kl[3] * d.op }); } catch (err) { /* onbekend icoon */ }
      } else if (d.t === 'tekst') {
        const F = fonts[gewicht(d.gewicht)], tekens = [...d.s];
        // stukjes per lettertype (latin / latin-ext); tekens die geen van beide kent, vallen weg
        let i = 0;
        while (i < tekens.length) {
          const welk = (c) => (F.set.has(c.codePointAt(0)) || c === ' ' ? F.f : F.extSet.has(c.codePointAt(0)) ? F.ext : null);
          const font = welk(tekens[i]); let j = i + 1;
          while (j < tekens.length && welk(tekens[j]) === font) j++;
          if (font) {
            const x = d.xs[Math.min(i, d.xs.length - 1)];
            if (d.ls) page.pushOperators(setCharacterSpacing(d.ls * PT));
            page.drawText(tekens.slice(i, j).join(''), { x: x * PT, y: Y(d.base), size: d.size * PT, font, color: RGB(d.kl), opacity: d.kl[3] * d.op,
              xSkew: d.schuin ? degrees(12) : undefined });
            if (d.ls) page.pushOperators(setCharacterSpacing(0));
          }
          i = j;
        }
      }
    }
  }

  const naam = cv.p.naam.trim();
  doc.setTitle(naam ? `CV ${naam}` : 'CV'); if (naam) doc.setAuthor(naam);
  doc.setLanguage(cv.taal === 'en' ? 'en' : 'nl'); doc.setCreator('CV Generator – uselesssite.nl/cv-generator'); doc.setProducer('pdf-lib');
  const blob = new Blob([await doc.save()], { type: 'application/pdf' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${naam ? 'CV ' + naam.replace(/[\\/:*?"<>|]+/g, '') : 'cv'}.pdf` });
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return stukken.length;
}

/* De knop: PDF maken, en als dat niet lukt (geen internet voor de lettertypen) het printvenster als reserve */
async function downloadPdf() {
  const knop = $('#print'); if (knop.disabled) return;
  const oud = knop.innerHTML; knop.disabled = true; knop.innerHTML = '<i class="mdi mdi-loading mdi-spin"></i> PDF maken…';
  try { const n = await maakPdf(); toast(n > 1 ? `PDF gedownload (${n} pagina's)` : 'PDF gedownload'); }
  catch (err) { console.error(err); toast('PDF maken lukt niet, het printvenster gaat open'); setTimeout(() => window.print(), 600); }
  finally { knop.disabled = false; knop.innerHTML = oud; }
}
