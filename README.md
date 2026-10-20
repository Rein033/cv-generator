# CV Generator

[![Buy me a coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-rein033-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/rein033)

Maak gratis een net, modern cv en download het als echte PDF. Geen account, geen abonnement, geen watermerk.
*A free CV builder in Dutch: fill in, pick a style, save as PDF. Everything stays in your browser.*

**Gebruik hem:** [uselesssite.nl/cv-generator](https://uselesssite.nl/cv-generator/)

- Drie lay-outs: **Modern** (datums links, zoals de bekende cv-sites), **Zijbalk** en **Klassiek**
- Kleur, lettertype, lettergrootte, marges en regelafstand kiezen
- Foto (rond of vierkant), contactgegevens met iconen, profieltekst
- Onderdelen: werkervaring, opleidingen, stages, cursussen, certificaten, vrijwilligerswerk, vaardigheden en talen met niveau,
  hobby's, referenties en eigen onderdelen. Verplaatsen, verbergen en hernoemen kan allemaal
- Opsommingen met `- ` aan het begin van een regel, **vet** met `**tekst**`
- Kopjes in het Nederlands of Engels
- Ongedaan maken / opnieuw, live voorbeeld op A4 met pagina-einden
- **Download PDF** maakt direct een PDF met echte, doorzoekbare tekst (leesbaar voor sollicitatiesystemen), ingesloten lettertypen en nette pagina-einden
- Welkomstscherm om leeg of met een voorbeeld te beginnen; op de telefoon knoppen onderin
- Bewaren als bestand en later weer openen, of kopiëren als platte tekst

Alles draait in je browser. Je cv wordt alleen in de opslag van je eigen browser bewaard en gaat nergens naartoe.
Voor de PDF worden alleen [pdf-lib](https://pdf-lib.js.org) en de lettertypen (Fontsource, Material Design Icons) van jsDelivr geladen.

## Ontwikkelen

`pdf.js` meet de opmaak van het voorbeeld op en tekent die na met pdf-lib (vlakken, foto, iconen als vormen, tekst per woord).

Gewoon HTML, CSS en JavaScript, zonder build-stap. Verhoog het `?v=`-nummer achter `style.css`, `app.js` en `pdf.js` in `index.html`
na een wijziging, zodat browsers de nieuwe bestanden laden. Open `index.html` via een willekeurige webserver.

Met `?embed=1` verdwijnen kop- en voettekst, zodat je de generator in een eigen pagina kunt insluiten. `&theme=dark` of `&theme=light` zet het thema vast.

## Steun

Alles hier is gratis. Heb je er iets aan, dan kun je [een koffie trakteren](https://buymeacoffee.com/rein033) ☕

## Licentie

[MIT](LICENSE)
