/* CV Generator: alles draait in de browser, het cv staat alleen in localStorage van dit apparaat. */
'use strict';

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const clone = (o) => JSON.parse(JSON.stringify(o));
const KEY = 'cvgen.v1';
const params = new URLSearchParams(location.search);
const EMBED = params.has('embed');
if (EMBED) document.body.classList.add('embed');
if (EMBED) { $('.top').hidden = true; $('footer').hidden = true; }

/* ── Soorten onderdelen ──
   tijdlijn: items met titel, ondertitel, plaats, van, tot en tekst · niveau: naam + 0-5 · tekst: één tekstvak */
const SOORTEN = {
  werk:   { ic: 'mdi-briefcase',          nl: 'Werkervaring',      en: 'Work experience', t: 'tijdlijn', f: ['Functie', 'Werkgever', 'Plaats'] },
  opl:    { ic: 'mdi-school',             nl: 'Opleidingen',       en: 'Education',       t: 'tijdlijn', f: ['Opleiding', 'School', 'Plaats'] },
  stage:  { ic: 'mdi-account-hard-hat',   nl: 'Stages',            en: 'Internships',     t: 'tijdlijn', f: ['Functie', 'Bedrijf', 'Plaats'] },
  cursus: { ic: 'mdi-book-open-variant',  nl: 'Cursussen',         en: 'Courses',         t: 'tijdlijn', f: ['Cursus', 'Instituut', 'Plaats'] },
  cert:   { ic: 'mdi-certificate',        nl: 'Certificaten',      en: 'Certificates',    t: 'tijdlijn', f: ['Certificaat', 'Uitgever', 'Plaats'] },
  vrijw:  { ic: 'mdi-hand-heart',         nl: 'Vrijwilligerswerk', en: 'Volunteering',    t: 'tijdlijn', f: ['Functie', 'Organisatie', 'Plaats'] },
  skills: { ic: 'mdi-star-circle',        nl: 'Vaardigheden',      en: 'Skills',          t: 'niveau' },
  talen:  { ic: 'mdi-translate',          nl: 'Talen',             en: 'Languages',       t: 'niveau' },
  hobby:  { ic: 'mdi-heart',              nl: "Hobby's",           en: 'Interests',       t: 'tekst' },
  refs:   { ic: 'mdi-account-voice',      nl: 'Referenties',       en: 'References',      t: 'tijdlijn', f: ['Naam', 'Functie en bedrijf', 'Telefoon of e-mail'] },
  extra:  { ic: 'mdi-text-box-plus',      nl: 'Eigen onderdeel',   en: 'Other',           t: 'tijdlijn', f: ['Titel', 'Ondertitel', 'Plaats'] },
};
const NIVEAU = ['', 'Basis', 'Redelijk', 'Goed', 'Zeer goed', 'Uitstekend'];
const NIVEAU_EN = ['', 'Basic', 'Fair', 'Good', 'Very good', 'Excellent'];
const FONTS = {
  calibri: ['Calibri', "Calibri, Carlito, 'Segoe UI', sans-serif"],
  opensans: ['Open Sans', "'Open Sans', sans-serif"],
  lato: ['Lato', 'Lato, sans-serif'],
  montserrat: ['Montserrat', 'Montserrat, sans-serif'],
  merriweather: ['Merriweather', 'Merriweather, Georgia, serif'],
  serif: ['Source Serif', "'Source Serif 4', Georgia, serif"],
};
const KLEUREN = ['#2f7fd1', '#039be5', '#00897b', '#43a047', '#7e57c2', '#d81b60', '#e53935', '#ef6c00', '#455a64', '#212121'];
const MARGES = { smal: 12, normaal: 17, ruim: 22 };
const GROOTTE = { klein: '9.5pt', normaal: '10.5pt', groot: '11.5pt' };
const LIJN = { compact: 1.3, normaal: 1.45, ruim: 1.6 };
const LEEG_PERSOON = { naam: '', titel: '', email: '', tel: '', adres: '', plaats: '', geboren: '', rijbewijs: '', web: '', linkedin: '', foto: '', profiel: '' };

const nieuwItem = (soort) => SOORTEN[soort].t === 'niveau' ? { id: uid(), naam: '', niveau: 0 } : { id: uid(), a: '', b: '', c: '', van: '', tot: '', tekst: '' };
const nieuweSectie = (soort, taal = 'nl') => ({ id: uid(), soort, kop: SOORTEN[soort][taal], aan: true, items: SOORTEN[soort].t === 'tekst' ? [] : [nieuwItem(soort)], tekst: '' });

function leegCV() {
  return {
    v: 1, taal: 'nl', layout: 'modern', kleur: '#2f7fd1', font: 'calibri', marge: 'normaal', grootte: 'normaal', lijn: 'normaal',
    foto: 'rond', niveauStijl: 'stippen', band: true,
    p: { ...LEEG_PERSOON },
    s: ['opl', 'werk', 'cursus', 'cert', 'skills', 'talen', 'hobby'].map((k) => nieuweSectie(k)),
  };
}

/* Verzonnen voorbeeld, om te zien hoe het eruitziet */
function voorbeeldCV() {
  const c = leegCV();
  c.p = { ...LEEG_PERSOON, naam: 'Sanne de Vries', titel: 'Projectcoördinator', email: 'sanne@voorbeeld.nl', tel: '06 12345678', plaats: 'Utrecht',
    geboren: '14 maart 1996', rijbewijs: 'B', web: 'sannedevries.nl', linkedin: 'linkedin.com/in/voorbeeld',
    profiel: 'Gestructureerde projectcoördinator met een hart voor mensen en processen. Ik zorg dat plannen niet alleen op papier kloppen, maar ook in de praktijk werken.' };
  const it = (a, b, c2, van, tot, tekst) => ({ id: uid(), a, b, c: c2, van, tot, tekst });
  const sec = (k) => c.s.find((s) => s.soort === k);
  sec('opl').items = [it('HBO Bedrijfskunde', 'Hogeschool Utrecht', 'Utrecht', 'sep 2014', 'jun 2018', ''), it('HAVO', 'Christelijk Lyceum', 'Zeist', '2008', '2014', '')];
  sec('werk').items = [
    it('Projectcoördinator', 'Gemeente Utrecht', 'Utrecht', 'mrt 2021', 'heden', 'Aanspreekpunt voor vijf lopende projecten in de openbare ruimte.\n- Planning en budgetbewaking\n- Overleg met bewoners en aannemers\n- Rapportage aan het management'),
    it('Medewerker planning', 'Bouwbedrijf Jansen', 'Amersfoort', 'aug 2018', 'feb 2021', 'Opstellen van weekplanningen voor 40 monteurs en bewaken van de voortgang.'),
  ];
  sec('cursus').items = [it('Projectmanagement Agile Scrum', 'NCOI', '', '', '2022', '')];
  sec('cert').items = [it('PRINCE2 Foundation', 'AXELOS', '', '', 'sep 2022', ''), it('Microsoft 365 Fundamentals', 'Microsoft', '', '', 'jun 2023', '')];
  sec('skills').items = [['Plannen en organiseren', 5], ['Communicatie', 4], ['Excel', 4], ['Power BI', 3]].map(([naam, niveau]) => ({ id: uid(), naam, niveau }));
  sec('talen').items = [['Nederlands', 5], ['Engels', 4], ['Duits', 2]].map(([naam, niveau]) => ({ id: uid(), naam, niveau }));
  sec('hobby').tekst = 'Hardlopen, koken voor vrienden en vrijwilliger bij de voedselbank.';
  return c;
}

/* ── Oude CV-maker van het dashboard (pe.cv.v1) omzetten ── */
function vanOudeCV(o) {
  const c = leegCV();
  Object.assign(c.p, { naam: o.naam || '', titel: o.titel || '', email: o.email || '', tel: o.tel || '', plaats: o.plaats || '', web: o.web || '', profiel: o.profiel || '' });
  const sec = (k) => c.s.find((s) => s.soort === k);
  const werk = (o.werk || []).filter((w) => w.functie || w.bedrijf || w.tekst);
  if (werk.length) sec('werk').items = werk.map((w) => ({ id: uid(), a: w.functie || '', b: w.bedrijf || '', c: '', van: w.van || '', tot: w.tot || '', tekst: w.tekst || '' }));
  const opl = (o.opl || []).filter((w) => w.opleiding || w.school);
  if (opl.length) sec('opl').items = opl.map((w) => ({ id: uid(), a: w.opleiding || '', b: w.school || '', c: '', van: w.van || '', tot: w.tot || '', tekst: '' }));
  const lijst = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean).map((naam) => ({ id: uid(), naam, niveau: 0 }));
  if (lijst(o.skills).length) sec('skills').items = lijst(o.skills);
  if (lijst(o.talen).length) sec('talen').items = lijst(o.talen);
  return c;
}

function laad() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (v && v.p && Array.isArray(v.s)) return { ...leegCV(), ...v, p: { ...LEEG_PERSOON, ...v.p } };
    const oud = JSON.parse(localStorage.getItem('pe.cv.v1') || 'null');
    if (oud && (oud.naam || oud.email)) return vanOudeCV(oud);
  } catch (e) { /* kapotte opslag: begin opnieuw */ }
  return leegCV();
}

let cv = laad();
const open = new Set(['persoon']);   // welke panelen en items openstaan (alleen voor de editor)

/* ── Opslaan + ongedaan maken ── */
const hist = [JSON.stringify(cv)]; let hpos = 0; let htimer = null;
function opslaan(direct) {
  try { localStorage.setItem(KEY, JSON.stringify(cv)); } catch (e) { toast('Opslaan lukt niet (opslag vol of privévenster)'); }
  clearTimeout(htimer);
  const neem = () => { const j = JSON.stringify(cv); if (j === hist[hpos]) return; hist.splice(hpos + 1); hist.push(j); if (hist.length > 100) hist.shift(); hpos = hist.length - 1; knoppen(); };
  if (direct) neem(); else htimer = setTimeout(neem, 500);
}
function terug(stap) {
  clearTimeout(htimer);
  const j = JSON.stringify(cv); if (j !== hist[hpos]) { hist.splice(hpos + 1); hist.push(j); hpos = hist.length - 1; }
  const n = hpos + stap; if (n < 0 || n >= hist.length) return;
  hpos = n; cv = JSON.parse(hist[hpos]);
  try { localStorage.setItem(KEY, hist[hpos]); } catch (e) { /* */ }
  editor(); teken(); knoppen();
}
function knoppen() { $('#undo').disabled = hpos <= 0 && JSON.stringify(cv) === hist[0]; $('#redo').disabled = hpos >= hist.length - 1; }

function toast(t) {
  const d = Object.assign(document.createElement('div'), { className: 'toast', textContent: t });
  document.body.append(d); setTimeout(() => d.remove(), 2200);
}

/* ── Tekst met eenvoudige opmaak: regels met - of • worden opsommingen, **vet** wordt vet ── */
function opmaak(s) {
  const regels = String(s || '').split('\n'); let html = ''; let lijst = false; let alinea = [];
  const inl = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  const sluitAlinea = () => { if (alinea.length) { html += `<p>${alinea.map(inl).join('<br>')}</p>`; alinea = []; } };
  for (const r of regels) {
    const m = r.match(/^\s*[-•*▪]\s+(.*)$/);
    if (m) { sluitAlinea(); if (!lijst) { html += '<ul>'; lijst = true; } html += `<li>${inl(m[1])}</li>`; continue; }
    if (lijst) { html += '</ul>'; lijst = false; }
    if (!r.trim()) sluitAlinea(); else alinea.push(r);
  }
  sluitAlinea(); if (lijst) html += '</ul>';
  return html;
}

/* ════════ Het cv tekenen ════════ */
const periode = (i) => [i.van, i.tot].filter(Boolean).join(' - ');
const gevuld = (s) => {
  const t = SOORTEN[s.soort].t;
  if (!s.aan) return false;
  if (t === 'tekst') return !!s.tekst.trim();
  if (t === 'niveau') return s.items.some((i) => i.naam.trim());
  return s.items.some((i) => i.a || i.b || i.tekst || i.van || i.tot);
};

function niveauHtml(n) {
  if (!n) return '';
  if (cv.niveauStijl === 'tekst') return `<span class="nivt">${esc((cv.taal === 'en' ? NIVEAU_EN : NIVEAU)[n])}</span>`;
  if (cv.niveauStijl === 'balk') return `<span class="bar"><b style="width:${n * 20}%"></b></span>`;
  return `<span class="niv">${[1, 2, 3, 4, 5].map((k) => `<i class="${k <= n ? 'on' : ''}"></i>`).join('')}</span>`;
}

function contactRegels() {
  const p = cv.p;
  return [['mdi-email', p.email], ['mdi-phone', p.tel], ['mdi-home', [p.adres, p.plaats].filter(Boolean).join(', ')], ['mdi-calendar', p.geboren],
    ['mdi-car', p.rijbewijs && (cv.taal === 'en' ? 'Driving licence ' : 'Rijbewijs ') + p.rijbewijs], ['mdi-link-variant', p.web], ['mdi-linkedin', p.linkedin]]
    .filter(([, v]) => v).map(([ic, v]) => `<span><i class="mdi ${ic}"></i>${esc(v)}</span>`).join('');
}
const fotoHtml = () => cv.p.foto && cv.foto !== 'geen' ? `<img class="foto ${cv.foto === 'rond' ? 'rond' : 'vk'}" src="${cv.p.foto}" alt="">` : '';
const naamHtml = () => cv.p.naam ? esc(cv.p.naam) : '<span class="leeg">Jouw naam</span>';

function sectieHtml(s, stijl) {
  const t = SOORTEN[s.soort].t;
  const kop = `<h2>${esc(s.kop)}</h2>`;
  if (t === 'tekst') {
    return stijl === 'modern' ? `<section>${kop}<div class="item"><div class="when"></div><div class="what nob txt">${opmaak(s.tekst)}</div></div></section>`
      : `<section>${kop}<div class="txt">${opmaak(s.tekst)}</div></section>`;
  }
  if (t === 'niveau') {
    const rij = (i) => `<div class="lvrow"><span>${esc(i.naam)}</span>${niveauHtml(i.niveau)}</div>`;
    const items = s.items.filter((i) => i.naam.trim());
    if (stijl === 'modern') return `<section>${kop}${items.map((i) => `<div class="item kort"><div class="when"></div><div class="what">${rij(i)}</div></div>`).join('')}</section>`;
    if (stijl === 'klassiek') return `<section>${kop}<div class="lvgrid">${items.map(rij).join('')}</div></section>`;
    return `<section>${kop}${items.map(rij).join('')}</section>`;
  }
  const items = s.items.filter((i) => i.a || i.b || i.tekst || i.van || i.tot);
  const sub = (i) => [i.b, i.c].filter(Boolean).map(esc).join(', ');
  if (stijl === 'modern') {
    return `<section>${kop}${items.map((i) => `<div class="item"><div class="when">${esc(periode(i))}</div><div class="what">
      ${i.a ? `<b>${esc(i.a)}</b>` : ''}${sub(i) ? `<div class="sub">${sub(i)}</div>` : ''}${i.tekst ? `<div class="txt">${opmaak(i.tekst)}</div>` : ''}</div></div>`).join('')}</section>`;
  }
  return `<section>${kop}${items.map((i) => `<div class="item"><div class="row"><b>${esc(i.a)}</b><span>${esc(periode(i))}</span></div>
    ${sub(i) ? `<div class="sub">${sub(i)}</div>` : ''}${i.tekst ? `<div class="txt">${opmaak(i.tekst)}</div>` : ''}</div>`).join('')}</section>`;
}

function cvHtml() {
  const secs = cv.s.filter(gevuld);
  const profiel = cv.p.profiel ? `<div class="profiel txt">${opmaak(cv.p.profiel)}</div>` : '';
  if (cv.layout === 'zijbalk') {
    const zij = secs.filter((s) => SOORTEN[s.soort].t !== 'tijdlijn' && s.soort !== 'extra');
    const hoofd = secs.filter((s) => !zij.includes(s));
    const contact = contactRegels();
    return `<div class="cv zijbalk"><aside>${fotoHtml()}
      ${contact ? `<section><h2>${cv.taal === 'en' ? 'Personal details' : 'Persoonlijk'}</h2><div class="contact">${contact}</div></section>` : ''}
      ${zij.map((s) => sectieHtml(s, 'zij')).join('')}</aside>
      <div class="mainc"><h1>${naamHtml()}</h1>${cv.p.titel ? `<div class="ttl">${esc(cv.p.titel)}</div>` : ''}${profiel}
      ${hoofd.map((s) => sectieHtml(s, 'zij')).join('')}</div></div>`;
  }
  const kop = `<div class="head"><div><h1>${naamHtml()}</h1>${cv.p.titel ? `<div class="ttl">${esc(cv.p.titel)}</div>` : ''}<div class="contact">${contactRegels()}</div></div>${fotoHtml()}</div>`;
  if (cv.layout === 'klassiek') return `<div class="cv klassiek">${kop}${profiel}${secs.map((s) => sectieHtml(s, 'klassiek')).join('')}</div>`;
  return `<div class="cv modern">${cv.band ? `<div class="band">${kop}${profiel}</div>` : kop + profiel}${secs.map((s) => sectieHtml(s, 'modern')).join('')}</div>`;
}

function teken() {
  const paper = $('#paper');
  paper.className = 'paper ' + cv.layout;
  paper.style.setProperty('--c', cv.kleur);
  paper.style.setProperty('--cvfont', (FONTS[cv.font] || FONTS.calibri)[1]);
  paper.style.setProperty('--fs', GROOTTE[cv.grootte] || GROOTTE.normaal);
  paper.style.setProperty('--lh', LIJN[cv.lijn] || LIJN.normaal);
  const m = MARGES[cv.marge] || MARGES.normaal;
  paper.style.setProperty('--m', m + 'mm');
  paper.innerHTML = cvHtml();
  // Afdrukken: pagina 1 begint bovenaan het papier (de opvulling van het cv geeft de marge), volgende pagina's krijgen dezelfde marge
  $('#pagecss').textContent = `@page { size: A4; margin: ${m}mm 0; } @page :first { margin-top: 0; }`;
  document.title = cv.p.naam ? `CV ${cv.p.naam}` : 'CV Generator';
  schaal();
  // pagina-einden ongeveer aangeven
  const mm = paper.offsetWidth / 210, h = paper.offsetHeight / mm;
  let y = 297 - m, n = 2;
  while (y < h - 2 && n < 12) {
    const d = Object.assign(document.createElement('div'), { className: 'pagebreak', innerHTML: `<span>pagina ${n}</span>` });
    d.style.top = (y * mm) + 'px'; paper.append(d); y += 297 - 2 * m; n++;
  }
}

function schaal() {
  const desk = $('#desk'), sc = $('#scaler'), paper = $('#paper');
  const w = desk.clientWidth - 32, f = Math.min(1, w / paper.offsetWidth);
  sc.style.transform = `scale(${f})`;
  sc.style.height = (paper.offsetHeight * f) + 'px';
}
window.addEventListener('resize', schaal);

/* ════════ De editor (links) ════════ */
const fld = (label, path, val, opts = {}) => {
  const { wide, area, ph = '', type = 'text', rows } = opts;
  const attrs = `data-p="${path}" placeholder="${esc(ph)}"`;
  return `<div class="fld${wide ? ' wide' : ''}"><label>${label}</label>${area
    ? `<textarea ${attrs} rows="${rows || 4}">${esc(val)}</textarea>` : `<input type="${type}" ${attrs} value="${esc(val)}">`}</div>`;
};
const tegel = (id, ic, titel, sub, inhoud, extra = '', cls = '') => `<div class="panel ${open.has(id) ? 'open' : ''} ${cls}" data-panel="${id}">
  <div class="tile-head" data-toggle="${id}"><div class="tile-ic"><i class="mdi ${ic}"></i></div>
    <div class="tile-txt"><b>${titel}</b><small>${sub}</small></div><div class="tile-btns">${extra}<span class="ib chev"><i class="mdi mdi-chevron-down"></i></span></div></div>
  <div class="body">${inhoud}</div></div>`;

const layoutSvg = {
  modern: '<svg viewBox="0 0 54 72"><rect x="0" y="0" width="54" height="17" fill="#eaf2fb"/><rect x="5" y="5" width="22" height="3" rx="1" fill="#2f7fd1"/><rect x="5" y="10" width="28" height="1.5" fill="#bbb"/><circle cx="45" cy="9" r="5" fill="#cfd8e3"/><rect x="5" y="22" width="10" height="2" fill="#2f7fd1"/><rect x="5" y="27" width="9" height="1.5" fill="#bbb"/><rect x="19" y="27" width="2" height="2" fill="#2f7fd1"/><rect x="23" y="27" width="22" height="1.5" fill="#888"/><rect x="23" y="30" width="18" height="1.5" fill="#bbb"/><rect x="5" y="35" width="9" height="1.5" fill="#bbb"/><rect x="19" y="35" width="2" height="2" fill="#2f7fd1"/><rect x="23" y="35" width="24" height="1.5" fill="#888"/><rect x="23" y="38" width="20" height="1.5" fill="#bbb"/><rect x="5" y="45" width="10" height="2" fill="#2f7fd1"/><rect x="5" y="50" width="9" height="1.5" fill="#bbb"/><rect x="19" y="50" width="2" height="2" fill="#2f7fd1"/><rect x="23" y="50" width="22" height="1.5" fill="#888"/><rect x="23" y="53" width="24" height="1.5" fill="#bbb"/></svg>',
  zijbalk: '<svg viewBox="0 0 54 72"><rect x="0" y="0" width="18" height="72" fill="#2f7fd1"/><circle cx="9" cy="10" r="5" fill="#cfe0f5"/><rect x="3" y="20" width="12" height="1.5" fill="#fff"/><rect x="3" y="24" width="10" height="1.5" fill="#fff" opacity=".7"/><rect x="3" y="27" width="11" height="1.5" fill="#fff" opacity=".7"/><rect x="3" y="34" width="12" height="1.5" fill="#fff"/><rect x="3" y="38" width="9" height="1.5" fill="#fff" opacity=".7"/><rect x="22" y="5" width="22" height="3" rx="1" fill="#333"/><rect x="22" y="10" width="14" height="1.5" fill="#2f7fd1"/><rect x="22" y="17" width="27" height="1.5" fill="#bbb"/><rect x="22" y="20" width="24" height="1.5" fill="#bbb"/><rect x="22" y="27" width="14" height="1.5" fill="#2f7fd1"/><rect x="22" y="31" width="20" height="1.5" fill="#888"/><rect x="22" y="34" width="26" height="1.5" fill="#bbb"/><rect x="22" y="40" width="20" height="1.5" fill="#888"/><rect x="22" y="43" width="24" height="1.5" fill="#bbb"/></svg>',
  klassiek: '<svg viewBox="0 0 54 72"><rect x="14" y="5" width="26" height="3" rx="1" fill="#333"/><rect x="19" y="10" width="16" height="1.5" fill="#2f7fd1"/><rect x="10" y="14" width="34" height="1.5" fill="#bbb"/><rect x="5" y="21" width="16" height="1.5" fill="#2f7fd1"/><rect x="5" y="23.5" width="44" height=".8" fill="#2f7fd1"/><rect x="5" y="27" width="22" height="1.5" fill="#888"/><rect x="40" y="27" width="9" height="1.5" fill="#bbb"/><rect x="5" y="30" width="30" height="1.5" fill="#bbb"/><rect x="5" y="35" width="20" height="1.5" fill="#888"/><rect x="40" y="35" width="9" height="1.5" fill="#bbb"/><rect x="5" y="38" width="34" height="1.5" fill="#bbb"/><rect x="5" y="45" width="16" height="1.5" fill="#2f7fd1"/><rect x="5" y="47.5" width="44" height=".8" fill="#2f7fd1"/><rect x="5" y="51" width="22" height="1.5" fill="#888"/><rect x="5" y="54" width="28" height="1.5" fill="#bbb"/></svg>',
};

function seg(path, keuzes) {
  const cur = path.split('.').reduce((o, k) => o[k], cv);
  return `<div class="seg">${keuzes.map(([v, l]) => `<button type="button" data-set="${path}" data-v="${v}" class="${cur === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;
}

function ontwerpPaneel() {
  const inhoud = `<div class="opts">
    <div class="opt"><label>Lay-out</label><div class="layouts">${Object.keys(layoutSvg).map((k) => `<button type="button" data-set="layout" data-v="${k}" class="${cv.layout === k ? 'on' : ''}">${layoutSvg[k]}${k[0].toUpperCase() + k.slice(1)}</button>`).join('')}</div></div>
    <div class="opt"><label>Kleur</label><div class="colors">${KLEUREN.map((k) => `<button type="button" class="sw ${cv.kleur === k ? 'sel' : ''}" style="background:${k}" data-set="kleur" data-v="${k}" title="${k}"></button>`).join('')}
      <input type="color" id="eigenkleur" value="${esc(cv.kleur)}" title="Eigen kleur"></div></div>
    <div class="opt"><label>Lettertype</label><div class="seg">${Object.entries(FONTS).map(([k, [n, f]]) => `<button type="button" data-set="font" data-v="${k}" class="${cv.font === k ? 'on' : ''}" style="font-family:${f}">${n}</button>`).join('')}</div></div>
    <div class="form">
      <div class="opt"><label>Lettergrootte</label>${seg('grootte', [['klein', 'Klein'], ['normaal', 'Normaal'], ['groot', 'Groot']])}</div>
      <div class="opt"><label>Marges</label>${seg('marge', [['smal', 'Smal'], ['normaal', 'Normaal'], ['ruim', 'Ruim']])}</div>
      <div class="opt"><label>Regelafstand</label>${seg('lijn', [['compact', 'Compact'], ['normaal', 'Normaal'], ['ruim', 'Ruim']])}</div>
      <div class="opt"><label>Foto</label>${seg('foto', [['rond', 'Rond'], ['vierkant', 'Vierkant'], ['geen', 'Geen']])}</div>
      <div class="opt"><label>Niveau tonen als</label>${seg('niveauStijl', [['stippen', 'Stippen'], ['balk', 'Balk'], ['tekst', 'Woord']])}</div>
      <div class="opt"><label>Taal van de kopjes</label>${seg('taal', [['nl', 'Nederlands'], ['en', 'English']])}</div>
    </div>
    ${cv.layout === 'modern' ? '<label class="tog"><input type="checkbox" data-check="band" ' + (cv.band ? 'checked' : '') + '><span></span> Gekleurde balk achter de kop</label>' : ''}
  </div>`;
  const naam = (FONTS[cv.font] || FONTS.calibri)[0];
  return tegel('ontwerp', 'mdi-palette', 'Ontwerp', `${cv.layout[0].toUpperCase() + cv.layout.slice(1)} · ${naam}`, inhoud);
}

function persoonPaneel() {
  const p = cv.p, f = (l, k, o) => fld(l, 'p.' + k, p[k], o);
  const inhoud = `<div class="form">
    <div class="photo"><div class="ph" style="${p.foto ? `background-image:url(${p.foto})` : ''}">${p.foto ? '' : '<i class="mdi mdi-account"></i>'}</div>
      <div class="btns"><button type="button" class="small" id="fotokies"><i class="mdi mdi-camera"></i> ${p.foto ? 'Andere foto' : 'Foto kiezen'}</button>
      ${p.foto ? '<button type="button" class="small" id="fotoweg"><i class="mdi mdi-delete"></i> Weg</button>' : ''}</div></div>
    ${f('Naam', 'naam')}${f('Functietitel <span>(optioneel)</span>', 'titel', { ph: 'bijv. IT-beheerder' })}
    ${f('E-mail', 'email', { type: 'email' })}${f('Telefoon', 'tel', { type: 'tel' })}
    ${f('Adres', 'adres', { ph: 'Straat en huisnummer' })}${f('Postcode en woonplaats', 'plaats')}
    ${f('Geboortedatum', 'geboren', { ph: 'bijv. 11 december 2004' })}${f('Rijbewijs', 'rijbewijs', { ph: 'bijv. B' })}
    ${f('Website', 'web')}${f('LinkedIn', 'linkedin', { ph: 'linkedin.com/in/...' })}
    ${f('Profiel <span>(3 tot 5 zinnen: wie ben je, wat kun je, wat zoek je)</span>', 'profiel', { wide: true, area: true, rows: 5 })}
  </div>`;
  return tegel('persoon', 'mdi-account-circle', 'Persoonlijke gegevens', esc([p.naam, p.email].filter(Boolean).join(' · ') || 'Naam, contact, foto en profiel'), inhoud);
}

function sectiePaneel(s, idx) {
  const def = SOORTEN[s.soort], t = def.t, pad = `s.${idx}`;
  let inhoud;
  if (t === 'tekst') {
    inhoud = `<div class="form">${fld('Kop', pad + '.kop', s.kop, { wide: true })}${fld('Tekst', pad + '.tekst', s.tekst, { wide: true, area: true })}</div>`;
  } else if (t === 'niveau') {
    inhoud = `<div class="form" style="margin-bottom:10px">${fld('Kop', pad + '.kop', s.kop, { wide: true })}</div><div class="kids">
      ${s.items.map((i, j) => `<div class="kid lvl"><input type="text" data-p="${pad}.items.${j}.naam" value="${esc(i.naam)}" placeholder="${s.soort === 'talen' ? 'bijv. Engels' : 'bijv. Excel'}">
        <div class="dots" title="Niveau (klik nogmaals om uit te zetten)">${[1, 2, 3, 4, 5].map((k) => `<button type="button" class="${k <= i.niveau ? 'on' : ''}" data-niv="${idx}.${j}.${k}"></button>`).join('')}</div>
        <button type="button" class="ib" data-mv="${idx}.${j}.-1" ${j ? '' : 'disabled'} title="Omhoog"><i class="mdi mdi-arrow-up"></i></button>
        <button type="button" class="ib" data-del="${idx}.${j}" title="Verwijderen"><i class="mdi mdi-close"></i></button></div>`).join('')}
      <button type="button" class="add" data-add="${idx}"><i class="mdi mdi-plus"></i> Toevoegen</button></div>`;
  } else {
    inhoud = `<div class="form" style="margin-bottom:10px">${fld('Kop', pad + '.kop', s.kop, { wide: true })}</div><div class="kids">
      ${s.items.map((i, j) => {
        const ip = `${pad}.items.${j}`, isOpen = open.has(i.id);
        return `<div class="kid ${isOpen ? 'open' : ''}"><div class="kid-head" data-kid="${i.id}">
          <div class="kname">${esc(i.a || def.f[0])}<small>${esc([i.b, periode(i)].filter(Boolean).join(' · ') || 'Nog leeg')}</small></div>
          <button type="button" class="ib" data-mv="${idx}.${j}.-1" ${j ? '' : 'disabled'} title="Omhoog"><i class="mdi mdi-arrow-up"></i></button>
          <button type="button" class="ib" data-mv="${idx}.${j}.1" ${j < s.items.length - 1 ? '' : 'disabled'} title="Omlaag"><i class="mdi mdi-arrow-down"></i></button>
          <button type="button" class="ib" data-del="${idx}.${j}" title="Verwijderen"><i class="mdi mdi-delete-outline"></i></button></div>
          <div class="form">${fld(def.f[0], ip + '.a', i.a)}${fld(def.f[1], ip + '.b', i.b)}
            ${fld('Van', ip + '.van', i.van, { ph: 'bijv. jan 2021' })}${fld('Tot', ip + '.tot', i.tot, { ph: 'bijv. heden' })}
            ${fld(def.f[2], ip + '.c', i.c)}
            ${fld('Omschrijving <span>(regels met - worden opsommingstekens, **vet** wordt vet)</span>', ip + '.tekst', i.tekst, { wide: true, area: true })}</div></div>`;
      }).join('')}
      <button type="button" class="add" data-add="${idx}"><i class="mdi mdi-plus"></i> ${esc(def.f[0])} toevoegen</button></div>`;
  }
  const n = t === 'tekst' ? (s.tekst.trim() ? 'Ingevuld' : 'Leeg') : `${s.items.filter((i) => i.a || i.naam).length} ingevuld`;
  const extra = `<button type="button" class="ib" data-smv="${idx}.-1" ${idx ? '' : 'disabled'} title="Onderdeel omhoog"><i class="mdi mdi-arrow-up"></i></button>
    <button type="button" class="ib" data-smv="${idx}.1" ${idx < cv.s.length - 1 ? '' : 'disabled'} title="Onderdeel omlaag"><i class="mdi mdi-arrow-down"></i></button>
    <button type="button" class="ib" data-aan="${idx}" title="${s.aan ? 'Verbergen op het cv' : 'Tonen op het cv'}"><i class="mdi ${s.aan ? 'mdi-eye' : 'mdi-eye-off'}"></i></button>
    <button type="button" class="ib" data-sdel="${idx}" title="Onderdeel verwijderen"><i class="mdi mdi-delete-outline"></i></button>`;
  return tegel(s.id, def.ic, esc(s.kop || def.nl), s.aan ? n : 'Verborgen', inhoud, extra, s.aan ? '' : 'off');
}

function editor() {
  const y = window.scrollY, act = document.activeElement?.dataset?.p;
  const ontbreekt = Object.keys(SOORTEN).filter((k) => k === 'extra' || !cv.s.some((s) => s.soort === k));
  $('#left').innerHTML = ontwerpPaneel() + persoonPaneel() + cv.s.map(sectiePaneel).join('')
    + `<div class="panel"><div class="tile-head" style="cursor:default"><div class="tile-ic"><i class="mdi mdi-plus"></i></div><div class="tile-txt"><b>Onderdeel toevoegen</b><small>Kies wat je nog op je cv wilt</small></div></div>
      <div class="addsec">${ontbreekt.map((k) => `<button type="button" data-sadd="${k}"><i class="mdi ${SOORTEN[k].ic}"></i> ${SOORTEN[k].nl}</button>`).join('')}</div>
      <div class="btns" style="margin-top:14px"><button type="button" class="small" id="voorbeeld"><i class="mdi mdi-auto-fix"></i> Voorbeeld laden</button>
      <button type="button" class="small" id="wissen"><i class="mdi mdi-delete-sweep"></i> Alles wissen</button></div>
      <p class="hint">Je cv wordt automatisch bewaard in deze browser. Wil je het op een ander apparaat gebruiken? Gebruik <b>Bewaren</b> en <b>Openen</b>.</p></div>`;
  if (act) { const el = $(`[data-p="${act}"]`); if (el) el.focus(); }
  window.scrollTo(0, y);
}

/* ── Waarden op een pad zetten, bijv. "s.2.items.0.a" ── */
function zet(path, v) {
  const ks = path.split('.'); let o = cv;
  for (const k of ks.slice(0, -1)) o = o[k];
  o[ks[ks.length - 1]] = v;
}

const left = $('#left');
left.addEventListener('input', (e) => {
  const t = e.target;
  if (t.dataset.p) {
    zet(t.dataset.p, t.value); teken(); opslaan();
    // samenvatting in de kop van het item/paneel bijwerken zonder de editor opnieuw te tekenen (focus blijft)
    const kid = t.closest('.kid'); const m = t.dataset.p.match(/^s\.(\d+)\.items\.(\d+)\./);
    if (kid && m && kid.querySelector('.kname')) {
      const s = cv.s[+m[1]], i = s.items[+m[2]];
      kid.querySelector('.kname').innerHTML = `${esc(i.a || SOORTEN[s.soort].f[0])}<small>${esc([i.b, periode(i)].filter(Boolean).join(' · ') || 'Nog leeg')}</small>`;
    }
    const km = t.dataset.p.match(/^s\.(\d+)\.kop$/);
    if (km) t.closest('.panel').querySelector('.tile-txt b').textContent = t.value || SOORTEN[cv.s[+km[1]].soort].nl;
  } else if (t.id === 'eigenkleur') { cv.kleur = t.value; teken(); opslaan(); left.querySelectorAll('.sw').forEach((b) => b.classList.remove('sel')); }
  else if (t.dataset.check) { cv[t.dataset.check] = t.checked; teken(); opslaan(true); }
});
left.addEventListener('change', (e) => { if (e.target.id === 'eigenkleur') opslaan(true); });

left.addEventListener('click', (e) => {
  const b = e.target.closest('button, [data-toggle], [data-kid]'); if (!b) return;
  const d = b.dataset; let opnieuw = true;
  const nr = (s) => s.split('.').map(Number);
  if (d.set) {
    const oud = cv[d.set]; cv[d.set] = d.v;
    if (d.set === 'taal' && oud !== d.v) cv.s.forEach((s) => { if (s.kop === SOORTEN[s.soort][oud]) s.kop = SOORTEN[s.soort][d.v]; });
  } else if (d.niv) { const [i, j, k] = nr(d.niv); const it = cv.s[i].items[j]; it.niveau = it.niveau === k ? 0 : k; }
  else if (d.add) { const s = cv.s[+d.add]; const it = nieuwItem(s.soort); s.items.push(it); open.add(it.id); }
  else if (d.del) {
    const [i, j] = nr(d.del); const s = cv.s[i], it = s.items[j];
    const vol = it.a || it.b || it.tekst || it.naam;
    if (vol && !confirm(`"${it.a || it.naam}" verwijderen?`)) return;
    s.items.splice(j, 1);
  } else if (d.mv) { const [i, j, r] = nr(d.mv); const a = cv.s[i].items; [a[j], a[j + r]] = [a[j + r], a[j]]; }
  else if (d.smv) { const [i, r] = nr(d.smv); [cv.s[i], cv.s[i + r]] = [cv.s[i + r], cv.s[i]]; e.stopPropagation(); }
  else if (d.aan) { cv.s[+d.aan].aan = !cv.s[+d.aan].aan; }
  else if (d.sdel) { const s = cv.s[+d.sdel]; if (gevuld({ ...s, aan: true }) && !confirm(`Onderdeel "${s.kop}" met alles erin verwijderen?`)) return; cv.s.splice(+d.sdel, 1); }
  else if (d.sadd) { const s = nieuweSectie(d.sadd, cv.taal); cv.s.push(s); open.add(s.id); if (s.items[0]) open.add(s.items[0].id); }
  else if (d.toggle) { if (e.target.closest('.tile-btns button')) return; open.has(d.toggle) ? open.delete(d.toggle) : open.add(d.toggle); opnieuw = false; b.closest('.panel').classList.toggle('open'); }
  else if (d.kid) { if (e.target.closest('button')) return; open.has(d.kid) ? open.delete(d.kid) : open.add(d.kid); opnieuw = false; b.closest('.kid').classList.toggle('open'); }
  else if (b.id === 'fotokies') { $('#photofile').click(); return; }
  else if (b.id === 'fotoweg') { cv.p.foto = ''; }
  else if (b.id === 'voorbeeld') { if (heeftInhoud() && !confirm('Je huidige cv vervangen door het voorbeeld? (Ongedaan maken kan daarna nog)')) return; cv = voorbeeldCV(); }
  else if (b.id === 'wissen') { if (!confirm('Alles wissen en opnieuw beginnen? (Ongedaan maken kan daarna nog)')) return; cv = leegCV(); }
  else return;
  if (opnieuw) { editor(); teken(); opslaan(true); }
});
const heeftInhoud = () => cv.p.naam || cv.p.email || cv.s.some((s) => gevuld({ ...s, aan: true }));

/* ── Foto: verkleinen tot 480 px zodat hij in de browseropslag past ── */
$('#photofile').addEventListener('change', (e) => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  const img = new Image();
  img.onload = () => {
    const z = Math.min(img.width, img.height), max = 480, c = document.createElement('canvas');
    c.width = c.height = Math.min(max, z);
    c.getContext('2d').drawImage(img, (img.width - z) / 2, (img.height - z) / 3, z, z, 0, 0, c.width, c.height);
    cv.p.foto = c.toDataURL('image/jpeg', .85); URL.revokeObjectURL(img.src);
    editor(); teken(); opslaan(true);
  };
  img.onerror = () => toast('Deze afbeelding kan ik niet openen');
  img.src = URL.createObjectURL(f);
});

/* ── Knoppen boven het voorbeeld ── */
$('#print').onclick = () => { teken(); window.print(); };
$('#undo').onclick = () => terug(-1);
$('#redo').onclick = () => terug(1);
document.addEventListener('keydown', (e) => {
  if (!(e.ctrlKey || e.metaKey)) return;
  const k = e.key.toLowerCase();
  if (k === 'z' && !e.shiftKey && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) { e.preventDefault(); terug(-1); }
  else if ((k === 'y' || (k === 'z' && e.shiftKey)) && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) { e.preventDefault(); terug(1); }
  else if (k === 'p') { e.preventDefault(); teken(); window.print(); }
});
$('#export').onclick = () => {
  const blob = new Blob([JSON.stringify(cv, null, 2)], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `cv-${(cv.p.naam || 'mijn-cv').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json` });
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); toast('Bestand gedownload');
};
$('#import').onclick = () => $('#file').click();
$('#file').addEventListener('change', async (e) => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const v = JSON.parse(await f.text());
    if (!v || !v.p || !Array.isArray(v.s)) throw new Error();
    v.s = v.s.filter((s) => SOORTEN[s.soort]);
    cv = { ...leegCV(), ...v, p: { ...LEEG_PERSOON, ...v.p } }; editor(); teken(); opslaan(true); toast('Cv geopend');
  } catch (err) { toast('Dit is geen cv-bestand van de CV Generator'); }
});
$('#copytxt').onclick = async () => {
  const p = cv.p, out = [p.naam, p.titel, [p.email, p.tel, [p.adres, p.plaats].filter(Boolean).join(', '), p.web, p.linkedin].filter(Boolean).join(' · ')].filter(Boolean);
  if (p.profiel) out.push('', p.profiel);
  for (const s of cv.s.filter(gevuld)) {
    out.push('', s.kop.toUpperCase());
    const t = SOORTEN[s.soort].t;
    if (t === 'tekst') out.push(s.tekst);
    else if (t === 'niveau') s.items.filter((i) => i.naam).forEach((i) => out.push(i.naam + (i.niveau ? ` (${(cv.taal === 'en' ? NIVEAU_EN : NIVEAU)[i.niveau].toLowerCase()})` : '')));
    else s.items.filter((i) => i.a || i.b).forEach((i) => { out.push([periode(i), [i.a, i.b, i.c].filter(Boolean).join(', ')].filter(Boolean).join('  ')); if (i.tekst) out.push(i.tekst); });
  }
  try { await navigator.clipboard.writeText(out.join('\n').trim()); toast('Tekst gekopieerd'); } catch (err) { toast('Kopiëren lukt niet in deze browser'); }
};

/* ── Licht / donker (onthouden per browser) ── */
const thema = (() => { try { return params.get('theme') || localStorage.getItem('cvgen.theme'); } catch (e) { return params.get('theme'); } })();
if (thema) document.documentElement.dataset.theme = thema;
$('#theme').onclick = () => {
  const nu = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const nw = nu === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = nw;
  try { localStorage.setItem('cvgen.theme', nw); } catch (e) { /* */ }
};

editor(); teken(); knoppen();
if (document.fonts) document.fonts.ready.then(teken);
