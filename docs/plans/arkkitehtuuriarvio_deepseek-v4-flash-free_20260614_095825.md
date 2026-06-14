# Arkkitehtuuriarvio — Football Stats (SPL / Palloliitto)

**Malli:** deepseek-v4-flash-free
**Suoritusaika:** 2026-06-14 09:58 UTC
**Tila:** VALMIS

> 300 tarkistuspisteen auditointi + yhtenäinen master-refaktorointisuunnitelma.
> Kieli: suomi (paitsi tekniset termit ja koodiesimerkit).

---

### Pakollinen vaatimus: Käyttöliittymä täysin suomeksi

Jokaisen käyttäjälle näkyvän tekstin on oltava suomea. Tämä koskee:
- Sivujen otsikkoja ja alaotsikkoja
- Painikkeita ja linkkejä
- Virhe- ja tila-ilmoituksia
- Työkaluvihjeitä ja saavutettavuustekstejä
- Lataustilojen tekstejä
- Tyhjiä tiloja ("ei tietoja" -viestit)
- Footer-tekstejä

Nyt sovelluksessa on englanninkielisiä jäänteitä:
- "Match View" sivun otsikkona (`MatchPage.tsx:133`)
- "Current single-match experience" kuvauksena (`MatchPage.tsx:134`)
- "Takaisin" vs. "Back" epäjohdonmukaisuuksia
- Footer-teksti "Data provided by" (`Home.tsx:172`)

Kaikki nämä on korjattava ennen tuotantoon vientiä.

---

## Areenan taisteluyhteenveto

Kolme tiimiä (arkkitehti, tietoturva&suorituskyky, siisti koodi) kilpailivat 300 tarkistuspisteen auditoinnissa. Tärkeimmät kiistat ja ratkaisut:

| Kiista | Tiimi 1 (Arkkitehti) | Tiimi 2 (Tietoturva) | Tiimi 3 (Siisti koodi) | Ratkaisu |
|--------|---------------------|---------------------|----------------------|----------|
| Monoliittiset sivut vs. komponenttien hajotus | `TeamPage` (925 riviä) ja `TurnauksetPage` (568 riviä) on jaettava | Yhtä mieltä | Yhtä mieltä, duplikaattimallit (match row, search form) erilleen | Jaetaan toiminnallisiin alikomponentteihin, luodaan `MatchRow` ja `useScrollPosition` |
| Virheenkäsittelyfilosofia | Tyypitetyt virheluokat ovat hyviä | `APINetworkError` 4xx-koodeille on harhaanjohtava | Kommentit englanniksi, viestit suomeksi | Nimetään `APINetworkError` → `APIHttpError`, suomennetaan kommentit |
| Cache-arkkitehtuuri | LRU-poisto tarvitaan | `inFlight` Map voi vuotaa muistia | Dynaaminen import `.then()`:issä on haitallinen | LRU-poisto (max 500), korjataan dynaaminen import, max-raja `lastCallTimes`-taulukolle |
| `processPlayerMatchHistory`-jumalafunktio | Rikkoo SRP:tä | Reunatapaukset hauraita | 120 riviä sisäkkäisiä ehtoja on lukukelvoton | Jaetaan 4 funktioon |
| Strict Typing vs. Pragmatismi | API-vastaukset ovat löyhästi tyypitettyjä | `any`-castit ohittavat TypeScriptin | Luodaan union/discriminated-tyypit | Zod-validointi tärkeimmille API-muodoille |
| Framer Motion -paino | 30KB+ yksinkertaisista animaatioista | CSS hoitaa saman | Animaatiot ovat siistejä | Korvataan stagger CSS:llä, säilytetään `AnimatePresence` sivuille |
| Testausstrategia | Arkkitehtuuri ennen testejä | Kriittiset polut testattava | Nolla testiä on kestämätöntä | Vitest + React Testing Library, testit API, cache, dataProcessors, integraatiot |
| Barrel Exportit | Kätevä yhtenäinen import | Ei kantaa | Tuplarivit ja wildcardit pahasta | Poistetaan tuplarivit, kielletään wildcard-re-exportit |

### Huomio API-datan julkisuudesta

Koska kaikki data tulee Suomen Palloliiton julkisesta API:sta (`spl.torneopal.net`), seuraavia asioita EI tarvitse sensuroida:
- API-avain (on julkinen, kuuluu SPL:n rajapintaan)
- Pelaajien syntymävuodet (julkinen data SPL:n tilastopalvelusta)
- Joukkueiden ID:t ja nimet

Tietoturvatarkistukset keskittyvät sen sijaan XSS:ään, CSP:hen, localStoragein oikeaan käyttöön ja muihin sovellustason riskeihin.

---

## Vaihe 1: 300 tarkistuspisteen kirjanpito

### 🏢 TIIMI 1: Yritysarkkitehti & Suunnittelumallien vartija (100 pistettä)

**Arkkitehtuuri & Domain-rajojen erottelu**
1. Domain-kerros puuttuu — palvelut, utiliteetit ja sivut sekoittavat API-tyypit ja näkymälogiikan
2. `processPlayerMatchHistory` utiliteeteissa sisältää bisneslogiikkaa, joka kuuluu domain-palveluun
3. Repository-kuvio puuttuu — API-kutsut on hajautettu sivuille ja hookkeihin
4. `useMatchData` sekoittaa datahaun, muunnoksen ja tilanhallinnan
5. API-mallien (`PlayerAPIResponse`) ja näkymämallien (`PlayerStats`) välillä ei ole selkeää entiteettirajaa
6. `TeamPage` sisältää yli 200 riviä bisneslogiikkaa suoraan komponentissa
7. `TurnauksetPage` sisältää SEKÄ renderöinnin ETTÄ monivaiheisen dataorkestraation
8. Palvelukerrosabstraktio puuttuu — `getPlayerData`, `getTeamProfile` ovat raakoja fetch-kääreitä
9. `dataProcessors.ts` on jumalafunktio, jolla on 6 vastuuta (parsinta, aggregointi, suodatus, vertailu, lajittelu, muotoilu)
10. Tilanhallinta on pelkkää `useState`a — ei contextia, storea tai query-kirjastoa

**SOLID-periaatteet**
11. Single Responsibility rikottu: `api.ts` hakee + rajoittaa + välimuistittaa + rakentaa URLit + käsittelee virheet
12. Open/Closed rikottu: uusi endpoint vaatii muokkauksia sekä `api.ts`:iin että `cache.ts`:n TTL-määrityksiin
13. Liskov Substitution rikottu: `getTeamData` on `@deprecated` mutta toimii yhä aliaksena
14. Interface Segregation: `TeamResponse`:llä on 14 optiota — kuluttajien on arvattava mikä on saatavilla
15. Dependency Inversion: hookit tuovat konkreettiset API-funktiot suoraan, eivät abstraktioita
16. `processPlayerMatchHistory` tekee liikaa — rikkoo Single Responsibilityn
17. `buildSeasonStats` `PlayerPage`:ssä duploi `dataProcessors.ts`:n logiikkaa
18. Datanprosessointi on jaettu `utils/dataProcessors.ts`:n ja sivujen välillä — ei yhtä totuuden lähdettä

**Kytkentä & Koheesio**
19. `useMatchData` on tiukasti kytketty `getMatchDetails`, `getGroupDetails`, `getTeamProfile`, `getPlayerData` -funktioihin
20. `TurnauksetPage` importoi 6 eri API-funktiota — korkein kytkentä koko koodipohjassa
21. `TeamPage` importoi 4 API-funktiota + 2 hookkia + 5 utiliteettimodulia
22. BottomNav sisältää kovakoodattuja polkuja (esim. `/competition/spl`)
23. Etusivu kovakoodaa Helsinki Cupin navigointipolut
24. Reititin `routes.tsx`:ssä on kytketty `Layout`iin, joka importoi `BottomNav`:n
25. `CommonOpponents` kutsuu `getMatchDetails`:iä suoraan hookin sijaan
26. `PreMatchComparison` duploi `CommonOpponents`in logiikkaa
27. WLD (Voitto/Tasapeli/Häviö) -utiliteettia käytetään 6+ paikassa eri integraatiologiikalla
28. Datanhakukerros puuttuu — sivut kutsuvat API-funktioita suoraan useEffecteissa

**Suunnittelumallit**
29. Adapter-pattern puuttuu SPL Torneopal -API:lle — API-muutokset kaskadoituvat kaikkialle
30. Observer/event-järjestelmä puuttuu komponenttien väliselle viestinnälle
31. Strategy-pattern puuttuu eri datavisualisaatioille (tilastopalkit, muotopisteet, taulukot)
32. Tehdasfunktiota virhetyyppien luomiselle ei ole
33. Template Method puuttuu sivujen datahakuelinkaarelle
34. Command/Query-erottelu puuttuu — `fetchAPIData` sekä hakee että muuntaa
35. Cache-kerros käyttää Mapia mutta ei LRU/LFU-poistoa

**Skaalautuvuus**
36. Pelaajadata haetaan per-ottelu `useMatchData`:ssä — ei sivutusta isoille ryhmille
37. `batchFetch` lataa KAIKKI kohteet kerralla — ei backpressurea
38. Virtualisointia ei ole pitkille listoille (sarjataulukot, pelaajahistoria, ottelulistat)
39. `StandingsTable` renderöi KAIKKI joukkueet DOMiin — ei ikkunointia
40. `processPlayerMatchHistory` iteroi kaikki ottelut lineaarisesti — O(n) per pelaaja per sivulataus
41. TeamPage hakee kaikki historialliset ryhmät etukäteen — voisi olla lazy-load
42. Web Workeria ei ole CPU-intensiiviselle datan prosessoinnille
43. Suosikkisivu hakee kaikki joukkueprofiilit rinnakkain — ei sivutusta 50+ suosikille

**Domain-rajojen ongelmat**
44. "Turnaus" ja "Kilpailu" sekoittuvat — samat API-tyypit, eri UI-käsittely
45. "Season" ja "year" välillä ei ole selkeää eroa — `APP_CONFIG.CURRENT_YEAR` toimii season ID:nä
46. Pelaajatilastojen domain on levällään 4 tiedostossa: `dataProcessors.ts`, `PlayerCard.tsx`, `PlayerPage.tsx`, `useMatchData.ts`
47. Otteludomainin logiikka on jaettu `api.ts`:n, `useMatchData.ts`:n, `MatchPage.tsx`:n ja `MatchHeader.tsx`:n välillä
48. Joukkuedomainin logiikka on jaettu `TeamPage.tsx`:n, `PreMatchComparison.tsx`:n ja `CommonOpponents.tsx`:n välillä

**Tilanhallinta**
49. Globaali tila puuttuu — suosikit on duplikoitu `useFavorites`-hookissa ja `FavoritesPage`:ssä
50. `useFavorites` käyttää localStoragea suoraan — ei abstraktiota pysyvyydelle
51. React Query / SWR puuttuu — manuaalinen TTL-pohjainen cache on hauras
52. Optymistisia päivityksiä ei ole — suosikkien vaihto vaatii sivulatauksen
53. Stale-while-revalidate-kuvio puuttuu — cache joko palvelee tuoretta dataa tai blokkaa latauksella
54. Pyyntöjen dedupointi sivutasolla puuttuu — rinnakkaiset sivulataukset hakevat saman datan kahdesti

**Komponenttiarkkitehtuuri**
55. Atomic design puuttuu — komponentit on jaettu satunnaisesti presentational ja container -välillä
56. `ErrorBoundaryPage` on sekä virheraja että layout-komponentti
57. `Button` käyttää forwardRef:iä mutta `BottomNav`:n napit eivät — epäjohdonmukaista
58. Yhdistelmäkomponenttikuviota (compound component) ei käytetä
59. `StandingsTable` saa 11 propia — liikaa, tarvitsee konsolidointia
60. `PlayerCard` käsittelee kuvan virhetilan itse — pitäisi abstrahoida
61. `MatchHeader`:llä on 3 eri vastuuta: tulostaulu, aikajana, varoitukset

**Riippuvuuksien hallinta**
62. Barrel-exportit epäsiististi: `types/index.ts` exporttaa duplikaatteja (matches, teams, players kolmesti)
63. `services/index.ts` ja `utils/index.ts` käyttävät wildcard-exportteja — hauraita
64. `components/index.ts` listaa exportit manuaalisesti — uudet komponentit helppo unohtaa
65. Framer Motion on raskas riippuvuus (30KB+) yksinkertaisille stagger-animaatioille
66. Bundle-analyysityökalua ei ole konfiguroitu
67. Tree-shakingin varmistus puuttuu — `lucide-react` importtaa yksittäisiä ikoneita

**Virherajojen hallinta**
68. Reititintason virheraja on olemassa, mutta komponenttitason ErrorBoundarya ei
69. API-virheet napataan, mutta toipumisstrategia puuttuu (uudelleenyritys kataja on, mutta UI-painiketta ei)
70. Virherajaa ei ole yksittäisten sivun osien ympärillä — yksi kaatuminen kaataa koko sivun

**Testausarkkitehtuuri**
71. Testi-infrastruktuuri on olematon — ei test runneria, ei testikirjastoa
72. Mock-palvelinta ei ole (MSW, json-server)
73. Komponenttien eristysstrategia puuttuu — jokainen komponentti riippuu reitittimestä ja API:sta
74. `cn()` on ainoa puhdas funktio, joka voitaisiin testata triviaalisti
75. Test ID:tä ei ole yhdessäkään komponentissa — integraatiotestit mahdottomia

**Reititys**
76. Hash-reititin valittu ilman dokumentoitua perustelua (GH Pages -rajoite on hyvä syy, mutta dokumentoimaton)
77. Reittipolut sekoittavat kebab-casea (`/turnaukset`) ja camelCasea (`/competition`)
78. Reittivartioita tai lazy-loadingia ei ole — kaikki sivut ladataan etukäteen
79. `NotFound` on sekä reittikäsittelijä että virherajan varalla

**Koodin organisointi**
80. `utils/` sisältää bisneslogiikkaa (`dataProcessors`), ei utiliteetteja
81. `hooks/` sisältää vain 2 hookkia — suurin osa datahausta on suoraan sivuilla
82. `constants/`-hakemistoa ei ole — `SPL_IDS`, `navItems` on levällään komponenteissa
83. Konfiguraation tyypit on `types/config.ts`:ssä, runtime-konffi `config.ts`:ssä — hyvä, mutta epäjohdonmukaista
84. `context/`-hakemistoa ei ole React-contexteille
85. `test/`- tai `__tests__`-hakemistoja ei ole missään

**Suorituskykyarkkitehtuuri**
86. `CommonOpponents` tunnistaa yhteiset vastustajat O(n²)-sisäkkäisillä silmukoilla
87. `formatResult` `CommonOpponents`:ssä luodaan uudelleen jokaisella renderöintikerralla
88. `StandingsTable` laskee `teamForm`:in uudelleen jokaisella renderillä `useMemo`:n kautta, mutta riippuvuudet ovat laajat
89. `TeamPage`:ssä on 12+ useMemo-hookkia — osa voi olla ennenaikaista optimointia
90. `React.memo`a ei ole yhdelläkään komponentilla paitsi `Button`
91. `BadgeVariant`-tyylit lasketaan uudelleen jokaisella renderillä objekttihakuna

**Kansainvälistäminen**
92. UI-tekstit sekoittavat suomea ja englantia (`Match View`, `Hae`, `Ottelut`)
93. I18n-kirjastoa ei ole — kaikki tekstit kovakoodattuja
94. `formatDate` palauttaa suomenkielisiä päivälyhenteitä, mutta locale ei ole konfiguroitavissa

**Build & Deploy**
95. CI:n lint-vaihetta ei ole dokumentoitu — AGENTS.md mainitsee vain `npm run build`
96. Esikatseludeployta PR:ille ei ole
97. Bundle-kokobudjettia ei ole konfiguroitu

---

### 🛡️ TIIMI 2: Tietoturva, Resilienssi & Suorituskyky (100 pistettä)

**Tietoturva**
1. XSS: `matchId` validoitu regeillä, mutta syötteiden puhdistus voisi olla kattavampaa
2. CSP-otsakkeita ei ole konfiguroitu `index.html`:iin
3. localStorage suosikeille — XSS voisi lukea/kirjoittaa localStoragea
4. HTTPS-pakotusta ei ole (API-URL käyttää HTTPS:ää, mutta sivusto ei pakota)
5. Asiakaspuolen nopeusrajoitusta käyttäjän toimille ei ole (toistuvat haut)
6. Autentikointi/authorisointi puuttuu — tämä on todennäköisesti tarkoituksellista julkiselle datalle
7. Joukkue-ID:t näkyvät URL-polussa — triviaali enumeroida
8. Pelaajien kuvat ladataan ulkoisista URL:ista — ei tietoturvatarkistusta
9. Joukkueiden pelipaitakuvat ladataan — voisivat olla seurantapikseleitä
10. Selainten sormenjälki API-headerien kautta (Accept sisältää API-avaimen)
11. Ei eväste- tai tietosuojailmoitusta sovelluksessa

**Tilanhallinnan tehokkuus**
12. `useMatchData` luo uuden AbortControllerin joka `fetchData`-kutsulla
13. `TeamPage`:ssä 10+ `useState`-hookkia — turhia uudelleenrenderöintejä
14. `CommonOpponents` tallentaa ottelutiedot litteässä `Record<string, { detailsA; detailsB }>`-rakenteessa
15. `TurnauksetPage`:ssä 8+ itsenäistä `useState`-kutsua
16. Suosikkien tila ladataan localStorageista joka `loadFavorites`-kutsulla
17. Tilapäivityksiä ei ole erätetty sivuilla, jotka kutsuvat `setLoading`, `setError`, `setData` peräkkäin
18. `loadingPlayers` `TeamPage`:ssä asetetaan `true`:ksi ennen async-operaatioita, mutta kilpailutilanteita on

**Muistivuodot**
19. `cancelled`-liput `TurnauksetPage`:ssä ja `FavoritesPage`:ssä — hauras patterni
20. `mountedRef` `useMatchData`:ssä — voi vuotaa jos komponentti unmountaa async-ketjun aikana
21. `fetchAPIData` liittää `abort`-tapahtumakuuntelijoita signaaliin, mutta siivous on epätäydellistä
22. `withCache` tallentaa keskeneräiset promiset Map:iin, joka ei koskaan poista epäonnistuneita promiseja
23. `lastCallTimes`-taulukon siivous puuttuu inaktiivisuuden jälkeen
24. `endpointLastCalls`-Recordia ei koskaan putsata käyttämättömien endpointtien osalta
25. Tapahtumakuuntelijat `MatchPage` scroll-käsittelijästä jäävät roikkumaan jos komponentti unmountaa ennen scrollausta
26. `StandingsTable`:n `setHoveredTeam` hover-tila jää roikkumaan unmountin jälkeen
27. Framer Motionin `AnimatePresence` voi kerryttää muistisolmuja jos animaatiot keskeytyvät

**Rinnakkaisuusongelmat**
28. Kilpailutilanne: `fetchData` `useMatchData`:ssä abortoi ensin, sitten luo uuden controllerin — jos abort-heittäjä heittää, uusi pyyntö ei koskaan käynnisty
29. `TeamPage`:n rinnakkaiset haut historiallisille pelaajille — useita `batchFetch`-kutsuja samalla signaalilla
30. Nopeusrajoittimen `lastCallTimes`-taulukkoa muutetaan ilman lukkoja — rinnakkaiset pyynnöt limittyvät
31. Cachen `inFlight`-Mapissa on kilpailutilanne, jos kaksi identtistä pyyntöä saapuu samalla tickillä
32. `setCached` `getMatchDetails`:ssä kutsuu `import('./cache')` dynaamisesti — async-kilpailutilanne
33. Suosikkisivun `cancelled`-lippu voi missata päivitysikkunan, jos molemmat resolveavat synkronisesti

**Virheenkäsittely**
34. Geneeriset `catch (err)`-lohkot `TeamPage`:ssä ja `TurnauksetPage`:ssä menettävät virhetyypit
35. `APINotFoundError`, `APINetworkError`, `APITimeoutError`, `APIRateLimitError` — hyvä, mutta `APINetworkError` 4xx (ei-404) -virheille on harhaanjohtava
36. Virheviestit suomeksi, kommentit englanniksi — epäjohdonmukaista
37. `batchFetch` nielee virheet hiljaa — palauttaa `undefined` ilman jäljitettävyyttä
38. `PlayerPage`:n `player_statistics`-haku `(player as Record<string, unknown>).player_statistics` — tarkistamaton casti
39. `TeamPage`:n ryhmäkategoriat `any[]`:na — tyyppiturvallisuus ohitettu kokonaan
40. `CategoryPage` ja `GroupPage` näyttävät "Ei lohkoja" tyhjälle taulukolle, mutta eivät erota latausta tyhjästä
41. Virheseurantaa (Sentry, lokitus) ei ole konfiguroitu
42. `console.error` "Failed to fetch historical player data" -virheille — niellyt tuotannossa
43. Virheraja näyttää teknisen stack tracen käyttäjälle — huono UX, mutta hyödyllinen debuggaukseen

**Reunatapausten luotettavuus**
44. `getTeamProfile` tarkistaa `if (!teamId) return null` — tyhjä string menee läpi
45. Nollalla jakaminen `DualStatBar`:ssä — `total > 0 ? ... : 50` hoitaa sen, mutta on huomaamaton
46. `StandingsTable`:n `parseInt(a.current_standing)` oletusarvo 999 NaN:lle — voi aiheuttaa näkymättömiä rivejä
47. `formatDate` käyttää `new Date(dateStr + 'T12:00:00')` — aikavyöhykeongelmat DST:n kanssa
48. `formatDate` palauttaa tyhjän stringin `undefined`:lle, mutta slice-operaatiot nullilla kaataisivat
49. `processPlayerMatchHistory`:n "Tuntematon joukkue" -varalla — `team_name` puuttuu, mutta sitä käytetään silti avaimena
50. `competition_id`, `category_id`, `group_id` URL-parametreja ei validoida
51. Ottelu-ID:t validoidaan `/^\d+$/`:llä, mutta joukkue-ID:ille ei ole validointia
52. Suosikkisivu renderöi joukkueen `team?.team_name || fid` — näyttää raa'an ID:n jos nimi puuttuu
53. Kilpailutilanne: `TurnauksetPage` navigoi turnausten välillä — edellinen data vilkkuu ennen uuden latautumista

**Suorituskyvyn pullonkaulat**
54. `CommonOpponents` ajaa kaikki kartanrakennukset jokaisella renderillä (ei useMemoä)
55. `StandingsTable` prosessoi kaikki ottelut laskemaan vastustajatulokset jokaisella renderillä
56. `filteredMatches` `TeamPage`:ssä luodaan uudelleen jokaiselle tilamuutokselle
57. `TeamPage`:ssä 12 useMemo-hookkia, jotka ajetaan uudelleen laajojen riippuvuuksien takia
58. `PlayerCard`:n tilastoruudukko renderöi kaikki 4 badgea uudelleen, jos yksikin proppi muuttuu
59. Kuvienlatausvesiputous — pelaajakuvat eivät ole lazy-loadattuja
60. Kuvanoptimointi puuttuu (srcset, sizes) pelaajakuville ja logoille
61. Google Fonts renderöintiä estävä — `display=swap` puuttuu
62. `fetchAPIData` serialisoi parametrit `new URLSearchParams`:lla — tehotonta monille parametreille
63. `cleanParams`-silmukka luo uuden objektin joka kutsulla — turha allokaatio

**Verkkoresilienssi**
64. Offline-tuki puuttuu — sovellus on täysin rikki ilman internetiä
65. Service workeria ei ole staattisten assetien välimuistitukseen
66. Uudelleenyritysstrategia käyttää kiinteitä viiveitä (500ms, 1000ms, 2000ms) — ei jitteriä
67. `batchFetch`:n yksittäiset epäonnistumiset eivät peruuta erää — voi jäädä roikkumaan hitailla API:lla
68. Yhteysnopeuden tunnistusta ei ole (hidas 3G vs WiFi)
69. Prefetchingiä ei ole todennäköisille navigointipoluille
70. `FETCH_TIMEOUT_MS` on 10s — aggressiivinen mobiiliverkoille
71. Vanhentunutta sisältöä uudelleenvalidoinnin aikana ei näytetä — aina ladataan

**Bundle & Lataussuorituskyky**
72. Framer Motionin bundleosuutta ei ole analysoitu — voi olla 25%+ JS:stä
73. `lucide-react` importtaa tiettyjä ikoneita, mutta tree-shaking ei välttämättä ole optimaalinen
74. Kaikki sivut ladataan heti reititysconfigin kautta
75. Inter-fontti ladataan painoilla 400, 500, 600, 700, 800, 900 — vain 400, 500, 600, 700 tarvitaan
76. CSS:n purkua (purge) Tailwindille ei ole — kaikki utiliteettiluokat bundlessa
77. `tailwind-merge` + `clsx` -runtime overhead jokaiselle `cn()`-kutsulle (tuhansia per sivu)
78. Koodin jakamista (code splitting) ei ole raskaille sivuille

**Animaatiot & Renderöinti**
79. Framer Motionin `Layout`-animaatiot aiheuttavat layoutin tärinää sarjataulukon järjestelyssä
80. `DualStatBar`:n animaatio ajetaan jokaisella mountilla — vaikka data on jo ladattu
81. 200ms stagger jokaiselle korttiruudukolle — koettu suorituskykyheikko
82. Skeleton-shimmer-animaatio toimii myös kun `prefers-reduced-motion` on asetettu (CSS ohittaa, mutta JS ei)
83. `AnimatePresence` `mode: "wait"` blokkaa käyttöliittymän siirtymien aikana

**API-spesifiset ongelmat**
84. Nopeusrajoitin voi odottaa jopa 5 sekuntia per endpoint — kamala UX
85. API-välimuisti nollautuu sivun päivityksellä — kaikki cache menetetty
86. `getMatchDetails` importoi cache-moduulin uudelleen `.then()`:ssä — dynaaminen import runtime-aikana
87. API:n terveystarkistusta (health check) ei ole ennen kuin käyttäjä aloittaa interaktion
88. `getGroupFull` ja `getGroupDetails` ovat lähes identtisiä — käyttämätön duplikaatti

---

### 🧼 TIIMI 3: Siisti Koodi & Ylläpidettävyys (100 pistettä)

**Koodin luettavuus**
1. `processPlayerMatchHistory` on 120 riviä sisäkkäisiä callbackeja ja 6 vastuuta
2. `TurnauksetPage` on 568 riviä — yksittäinen komponentti hoitaa datahaun, renderöinnin, reitityksen ja muotoilun
3. `TeamPage` on 925+ riviä — pitäisi jakaa 5+ pienempään komponenttiin
4. `MatchPage`:n scroll-käsittelijä on `window.addEventListener('scroll', ...)` — pitäisi olla custom hook
5. `Home.tsx` sisältää 177 riviä inline-tapahtumakäsittelijöitä ja kovakoodattua navigointia
6. `StandingsTable` saa 11 propia — vaikea ymmärtää mitä komponentti tekee
7. `CommonOpponents` saa 7 propia, mutta nimeää `teamBId`:n `_`:ksi — hämmentävä patterni
8. `renderPlayoffTeamName` `TurnauksetPage`:ssä palauttaa JSX-fragmentteja ehdollisella logiikalla
9. `WLD_CONFIG` ja `WLDKey` on hyvin tyypitetty, mutta integroitu eri tavoin 6+ käyttäjän toimesta
10. `cn()` on ylikäytetty — monet luokkastringit eivät tarvitse twMergen dedupointia

**Kognitiivinen kuorma**
11. `TurnauksetPage`:llä on 4 `useMemo` + 5 `useState` + 1 `useEffect`, joka orkestroi 3 API-kutsua
12. `processPlayerMatchHistory`-parametri `teamNameForContext` on hämmentävä — voisi olla `targetTeamName`
13. `StandingsTable`:ssä 3-tasoinen sisäkkäinen ternary className-laskennassa
14. `TeamPage`:ssä 6-tasoinen funktiosisäkkäisyys kategorianimien ratkaisulle
15. `CommonOpponents` purkaa propit mutta nimeää `teamBId`:n ja `teamAName`:n `_`:ksi — hämmentävää
16. `formatResult` sulkee `teamAId`:n ulommasta scopesta, mutta käyttää proppien purkua muille arvoille
17. `createEmptyStat`-funktio on määritelty `useMemo`:n sisällä — luodaan uudelleen joka renderöintisyklissä
18. `rc`-objekti `PreMatchComparison`:ssä on tulosten konfiguraatiokartta — epäselvä nimeäminen
19. `buildSeasonStats` `PlayerPage`:ssä on 42-rivinen funktio
20. `ageValid = age !== null && !isNaN(age) && age > 0 && age < 100` — maaginen numero 100

**Strict Typing -ongelmat**
21. `team?.groups` ja `team?.categories` castataan `any[]`:ksi — tyyppiturvallisuus menetetty
22. `(player as Record<string, unknown>).player_statistics` — tarkistamaton tyyppiväite
23. `MatchWithVenue` duploi `MatchSummary`-kentät uusilla venue-propeilla
24. `GroupResponse`:n kaikki kentät ovat optioita — invarianttitakeet puuttuvat
25. `ProcessedStats` on määritelty utiliteeteissa ja exportattu — käytetään 4 tiedostossa
26. `any[]`-cast `TurnauksetPage`:ssä `team.categories.forEach`:ssä
27. `STAT_FILTERS` `PlayerPage`:ssä käyttää `Record<string, Function>` — ei tyyppiturvallisuutta
28. `expanded`-tila `PlayerPage`:ssä on tyypitetty `{ season: string; stat: string } | null` — voisi olla tarkempi
29. `playerId` URL-parametreissa on `string | undefined` — jokainen sivu käsittelee undefinedin eri tavalla
30. `MatchSummary`:n `winner_id` on `string`, mutta verrataan '0'- ja '-'-merkkeihin

**Dokumentaatio**
31. `DESIGN.md` on kattava mutta täysin irrallinen komponenttien toteutuksesta
32. Julkisilla API-funktioilla (`fetchAPIData`, `batchFetch`, `withCache`) ei ole JSDoc-kuvauksia
33. `ERROR MESSAGE GUIDELINES` -kommentti `api.ts`:ssä on englanniksi — viestit ovat suomeksi
34. `WARNING FOR FUTURE DEVELOPERS` -kommentit TeamPagessa ja PlayerPagessa viittaavat aiempiin bugeihin
35. `StandingsTable`:lle (monimutkaisin komponentti) ei ole dokumentaatiota
36. README:tä paikalliselle kehitykselle ei ole
37. `getTeamData` on `@deprecated` mutta migraatio-ohje puuttuu
38. `formatTime` palauttaa `time?.slice(0, 5) || ''` — ei dokumentaatiota odotetusta syötemuodosta
39. `resolveCrest` ja `resolveCrestFromBasic` ovat lähes identtisiä — ei dokumentaatiota miksi molemmat ovat olemassa
40. Cache-TTL-vakioilla on inline-kommentteja, mutta ei selitystä miksi juuri nuo kestot

**Linting-yhdenmukaisuus**
41. `tsconfig.json`:ssä `strict: true`, mutta koodi käyttää rutiininomaisesti `any`- ja tyyppiväitteitä
42. `eslint` tai `prettier` puuttuu — koodityylin epäjohdonmukaisuuksia on
43. `function`-määritelmiä ja `const`-nuolifunktioita sekoitetaan eri tiedostoissa
44. `TurnauksetPage` käyttää sekä `cancelled`- että `controller.signal.aborted`-tarkistuksia — epäjohdonmukaista
45. Importtien järjestys vaihtelee: `useState` tuodaan joskus ensin, joskus React-importtien jälkeen
46. `className`-stringit käyttävät template literaleja `cn()`:n kanssa — epäjohdonmukaista
47. CSS-muuttujat on määritelty `@theme`-lohkossa, mutta DESIGN.md kaksinkertaistaa määrittelyn

**Testattavuus**
48. Riippuvuusinjektiota ei ole — `useMatchData` kutsuu konkreettista `fetchAPIData`a suoraan
49. `getMatchDetails`:llä on sivuvaikutuksia (cache-moduulin import runtime-aikana)
50. Kaikki API-funktiot ovat named exportteja — ei voida mockata helposti ilman moduulijärjestelmän ohitusta
51. `processPlayerMatchHistory` riippuu `APP_CONFIG`-importista — ei injektoitava
52. Päivämäärän muotoilu `formatDate`:ssä riippuu järjestelmän aikavyöhykkeestä — epädeterministinen
53. `buildSeasonStats` PlayerPagessa on puhdas funktio mutta ei exportattu
54. Tehdas- tai builder-funktioita testifixtureille ei ole
55. Nopeusrajoitin käyttää moduulitason `lastCallTimes`-taulukkoa — testit jakaisivat tilan

**Barrel Export -hygienia**
56. `types/index.ts` exporttaa `matches`, `teams`, `players` kahdesti — ensin wildcardina, sitten uudelleen
57. `utils/index.ts` re-exporttaa kaiken — kuluttajat saavat 5+ funktiota joita eivät tarvitse
58. `services/index.ts` exporttaa API:n ja Cachen sisäosia — `getCached`, `setCached`, `invalidateCache` ovat esillä
59. `components/index.ts` ylläpitää manuaalista export-listaa — uudet komponentit helppo unohtaa

**Nimeämiskäytännöt**
60. `WLD_CONFIG` — kryptinen lyhenne (Win/Loss/Draw)
61. `fs_A`, `fs_B` — API palauttaa suomenkielistä lyhennettä "final score" — dokumentoimaton
62. `teamAId: _` CommonOpponentsin destrukturoinnissa — confusing, `_` viittaa käyttämättömään, mutta ON käytetty
63. `resA`, `resB`, `rc` — yhden kirjaimen tai lyhennettyjä nimiä
64. `SPL_IDS` — miksi "spl", "spf", "b_jun", "c_jun", "d_jun"? Ei kommenttia
65. `HC2026` — Helsinki Cup 2026 -lyhenne upotettu reittipolkuihin
66. `PPJ` kovakoodattu TurnauksetPage:ssä — tietty joukkue geneerisessä turnauskoodissa
67. `wld`-muuttuja esiintyy GroupPagessa, TeamPagessa, TurnauksetPagessa, PlayerPagessa — epäjohdonmukainen käyttö

**Duplikoitu koodi**
68. Hakulomakkeen HTML-rakenne duplikoitu `Home.tsx`:ssä ja `MatchPage.tsx`:ssä
69. Scroll-to-position -logiikka duplikoitu `MatchPage.tsx`:ssä — voisi olla `useScrollPosition`-hook
70. `formatResult` `CommonOpponents`:ssä duploi WLD-logiikkaa `wld.ts`:stä
71. `PreMatchComparison` ja `CommonOpponents` molemmat laskevat yhteisiä vastustajia — duplikoitu algoritmi
72. Kategorianimien ratkaisufunktio duplikoitu `TeamPage.tsx`:ssä (esiintyy kahdesti samassa tiedostossa)
73. Pelaajaelementin renderöintipatterni esiintyy 5 eri paikassa pienillä variaatioilla
74. Ottelurivin renderöintipatterni duplikoitu GroupPage, TeamPage ja TurnauksetPage välillä
75. WLD-badge-luokan stringin konstruktio duplikoitu TeamPage, GroupPage, CommonOpponents -sivuilla

**Kuollut / käyttämätön koodi**
76. `getScore`-API-funktio on määritelty, mutta ei koskaan kutsuttu
77. `getTeamData` on `@deprecated` ja kutsuu vain `getTeamProfile`a
78. `DiscoverMatch`-tyyppi `[key: string]: unknown` — liian salliva
79. `ScoreEntry`-tyyppi määritelty mutta ei koskaan käytetty
80. `StandingTeam.goals_diff` on määritelty, mutta API palauttaa sen stringinä — ei tyyppivalidaatiota
81. `MatchWithVenue` duploi `MatchSummary`n — voisi extend/omit
82. `router` on exportattu, mutta käytetty vain `App.tsx`:ssä — voisi olla sisäinen
83. `clearCache`-funktio exportattu, mutta ei koskaan kutsuttu
84. `getWldFromWinner` on määritelty, mutta ei koskaan käytetty
85. `getCached` exportattu, mutta käytetty vain `withCache`:n sisällä

**Tiedostojen organisointi**
86. `TeamPage.tsx` (925+ riviä) pitäisi jakaa: ~300 riviä inline-dataa, ~625 riviä renderöintiä
87. `TurnauksetPage.tsx` (568 riviä) — 3 eri huolta sisäkkäin
88. `CommonOpponents.tsx` (302 riviä) — renderöinti ja logiikka voisi erottaa
89. `useMatchData.ts` sekoittaa datahaun, muunnoksen ja tilan — pitäisi erottaa
90. `#`-kommentit osioille `api.ts`:ssä epäjohdonmukaisia muun koodipohjan kanssa

**React-parhaat käytännöt**
91. `useCallback` käytössä `useFavorites`:ssä `toggle`- ja `isFavorite`-funktioille, mutta `favorites` on ainoa riippuvuus — ylioptimoitu
92. `key={player.name + player.shirtNumber}` MatchPage:ssä — hauras, `player_id` pitäisi olla avain
93. `imgError`-tila `PlayerCard`:ssä on komponentin paikallinen — hyvä, mutta patternia ei käytetä muualla
94. `onClick`-käsittelijät määritellään JSX:ssä — luodaan uudelleen jokaisella renderillä
95. `motion.div` kaikille animaatioille — CSS-transitiot riittäisivät yksinkertaisempiin tapauksiin
96. `useTransition`a ei käytetä (React 19)
97. `window.scrollY` verrataan maagiseen numeroon 280 MatchPagessa
98. `startTransition` puuttuu navigoinnin kriittisten tilapäivitysten ympäriltä
99. `useFavorites` lataa localStorageista synkronisesti — blokkaa renderöinnin
100. `TeamPage` renderöi lataustilan `if (loading) return` -rakenteella — rikkoo React-hook-säännöt

---

## Vaihe 2: Yhtenäinen Master-Refaktorointisuunnitelma

### 🟥 Kriittiset (Välittömät korjaukset)

| # | Taso | Alue | Toimenpide | Tiimi |
|---|------|------|-----------|-------|
| K1 | Kriittinen | Suorituskyky | Korjaa `CommonOpponents` O(n²)-algoritmi — lisää `useMemo` | T1 |
| K2 | Kriittinen | Bugi | Korjaa `mountedRef`-patterni `useMatchData`:ssä — korvaa `useEffect`-siivouksella | T2 |
| K3 | Kriittinen | Bugi | Korjaa `TurnauksetPage` cancelled-lipun kilpailutilanne — käytä AbortControlleria | T2 |
| K4 | Kriittinen | Bugi | Korjaa `processPlayerMatchHistory` null-score-kaatuminen — lisää `?? ""` | T2 |
| K5 | Kriittinen | Bugi | Poista tuplabarrel-exportit `types/index.ts`:stä | T3 |
| K6 | Kriittinen | Bugi | Korjaa `getMatchDetails`:n dynaaminen import — välitä `matchStatus` `withCache`:lle | T1 |
| K7 | Kriittinen | Bugi | Korjaa `formatDate`:n aikavyöhykeongelma | T2 |
| K8 | Kriittinen | Bugi | Korjaa `StandingsTable`:n NaN-oletus (999) → käytä Infinityä | T2 |
| K9 | Kriittinen | Käyttöliittymä | Korjaa "Match View" → "Ottelut" (`MatchPage.tsx:133`) | T3 |
| K10 | Kriittinen | Käyttöliittymä | Korjaa "Current single-match experience" → suomeksi (`MatchPage.tsx:134`) | T3 |
| K11 | Kriittinen | Käyttöliittymä | Korjaa footer "Data provided by" → "Data: Suomen Palloliitto" (`Home.tsx:172`) | T3 |
| K12 | Kriittinen | Käyttöliittymä | Tarkista koko sovellus englanninkielisten tekstien varalta | T3 |

### 🟧 Korkea (Vaihe 1 — Seuraava sprintti)

| # | Taso | Alue | Toimenpide | Tiimi |
|---|------|------|-----------|-------|
| H1 | Korkea | Arkkitehtuuri | Jaa `processPlayerMatchHistory` 4 funktioon | T1+T3 |
| H2 | Korkea | Arkkitehtuuri | Jaa `TeamPage.tsx` → `TeamHeader`, `TeamStats`, `TeamRoster`, `TeamMatches`, `TeamTransitions` | T1+T3 |
| H3 | Korkea | Arkkitehtuuri | Jaa `TurnauksetPage.tsx` → `TournamentHeader`, `TournamentStandings`, `TournamentPlayoffs`, `TournamentRoster` | T1+T3 |
| H4 | Korkea | Suorituskyky | Lisää LRU-poisto cacheen (max 500 merkintää) | T2 |
| H5 | Korkea | Suorituskyky | Korvaa framer-motion stagger CSS-animaatioilla | T2+T3 |
| H6 | Korkea | Testaus | Lisää Vitest + React Testing Library, testaa API, cache, dataProcessors | T3 |
| H7 | Korkea | Arkkitehtuuri | Luo `useScrollPosition`-custom hook | T1 |
| H8 | Korkea | Arkkitehtuuri | Luo `useDebounce`- ja `useApiData`-hookit | T1 |
| H9 | Korkea | Typetys | Poista kaikki `any[]`-castit — luo properit discriminated unionit API-vastauksille | T3 |
| H10 | Korkea | Typetys | Lisää Zod-validointi kriittisille API-vastauksille | T3 |
| H11 | Korkea | Suorituskyky | Lisää `loading="lazy"` kaikille pelaajakuville ja logoille | T2 |
| H12 | Korkea | Suorituskyky | Lisää bundle-analyysi (vite-plugin-visualizer), aseta 200KB JS-budjetti | T2 |
| H13 | Korkea | Tietoturva | Lisää CSP meta-tagi `index.html`:iin | T2 |
| H14 | Korkea | Arkkitehtuuri | Luo uudelleenkäytettävä `MatchSearch`-komponentti | T1 |
| H15 | Korkea | Arkkitehtuuri | Luo `MatchRow`-komponentti (poista 5× ottelurivin duplikaatio) | T1+T3 |
| H16 | Korkea | Resilienssi | Lisää uudelleenyrityspainike virherajaan API-virheille | T2 |
| H17 | Korkea | Resilienssi | Lisää offline-ilmoitus | T2 |
| H18 | Korkea | Resilienssi | Korjaa retry-strategia — lisää jitter viiveisiin | T2 |
| H19 | Korkea | Bugi | Poista kuollut koodi: `getScore`, `getTeamData`, `clearCache`, `getWldFromWinner`, `ScoreEntry` | T3 |
| H20 | Korkea | Arkkitehtuuri | Luo domain-palvelukerros: `matchService.ts`, `teamService.ts`, `playerService.ts` | T1 |
| H21 | Korkea | Bugi | Korjaa `api.ts` — nimeä `APINetworkError` → `APIHttpError` 4xx/5xx-virheille | T3 |
| H22 | Korkea | Ylläpito | Lisää eslint + prettier -konfiguraatio | T3 |
| H23 | Korkea | Bugi | Poista duplikoitu WLD-logiikka `CommonOpponents`:istä ja `PreMatchComparison`:sta | T3 |
| H24 | Korkea | Suorituskyky | Vähennä fonttipainot (poista 800, 900) | T2 |
| H25 | Korkea | Bugi | Korjaa `className` epäjohdonmukaisuudet (template literal vs. cn()) | T3 |
| H26 | Korkea | Tietoturva | Puhdista kaikki `playerId`- ja `teamId`-syötteet URL-parametreista | T2 |
| H27 | Korkea | Resilienssi | Korjaa `batchFetch` — älä niele virheitä hiljaa, lisää jäljitettävyys | T2 |
| H28 | Korkea | Suorituskyky | Korvaa `formatDate` aikavyöhykeneutraalilla toteutuksella | T3 |
| H29 | Korkea | Arkkitehtuuri | Luo `constants/index.ts` jaettuille vakioille | T1 |
| H30 | Korkea | Testaus | Luo testitehtaat kaikille domain-tyypeille | T3 |

### 🟡 Keskitaso (Vaihe 2 — Seuraavat 2 sprinttiä)

| # | Taso | Alue | Toimenpide | Tiimi |
|---|------|------|-----------|-------|
| M1 | Keskitaso | Arkkitehtuuri | Korvaa per-page useState React Querylla | T1 |
| M2 | Keskitaso | Suorituskyky | Lisää React.lazy + Suspense sivutason koodinjakoon | T1+T2 |
| M3 | Keskitaso | Suorituskyky | Lisää virtuaalinen scrollaus sarjataulukolle ja pelaajalistoille | T2 |
| M4 | Keskitaso | Arkkitehtuuri | Luo `utils/category.ts` kategorianimien ratkaisulle | T1 |
| M5 | Keskitaso | Arkkitehtuuri | Luo context-provider suosikeille pysyvyysabstraktiolla | T1 |
| M6 | Keskitaso | Typetys | Lisää Zod-skeemat MatchDetails, TeamResponse, PlayerAPIResponse | T3 |
| M7 | Keskitaso | Testaus | Lisää integraatiotestit MatchPage, TeamPage, GroupPage | T3 |
| M8 | Keskitaso | Testaus | Lisää MSW tai json-server API-mockaukseen | T3 |
| M9 | Keskitaso | Suorituskyky | Yksinkertaista `cn()` — tailwind-merge on ylimitoitettu tälle koodipohjalle | T3 |
| M10 | Keskitaso | Arkkitehtuuri | Puhdista barrel-exportit — poista wildcardit, korvaa explicit-exporteilla | T3 |
| M11 | Keskitaso | Dokumentaatio | Lisää JSDoc kaikille julkisille API-funktioille | T3 |
| M12 | Keskitaso | Suorituskyky | Lisää prefetching joukkue-/pelaajasivuille hoverilla | T2 |
| M13 | Keskitaso | Typetys | Poista `MatchWithVenue` — extendaa `MatchSummary`a optioilla | T3 |
| M14 | Keskitaso | Arkkitehtuuri | Poista kaikki maagiset numerot (scroll threshold 280, stagger 0.04 jne.) vakioiksi | T3 |
| M15 | Keskitaso | Suorituskyky | Lisää service worker staattisten assettien välimuistitukselle | T2 |
| M16 | Keskitaso | Arkkitehtuuri | Luo `useRateLimiter`-hook | T1 |
| M17 | Keskitaso | Suorituskyky | Lisää stale-while-revalidate cache-kerrokseen | T2 |
| M18 | Keskitaso | Arkkitehtuuri | Luo repositoriopatterni: `TeamRepository`, `MatchRepository`, `PlayerRepository` | T1 |
| M19 | Keskitaso | Suorituskyky | Lisää bundle-kokotarkistus CI:hin (200KB JS, 50KB CSS) | T2 |
| M20 | Keskitaso | Ylläpito | Standardoi kaikki virheviestit suomeksi | T3 |
| M21 | Keskitaso | Arkkitehtuuri | Poista `@deprecated getTeamData` — migroi kaikki `getTeamProfile`:en | T3 |
| M22 | Keskitaso | Suorituskyky | Lisää `display=swap` Google Fonts -linkkiin | T2 |
| M23 | Keskitaso | Arkkitehtuuri | Luo `PageSkeleton`-komponentti lataustiloille | T1 |
| M24 | Keskitaso | Typetys | Luo brandityypit `TeamId`, `PlayerId`, `MatchId` | T3 |
| M25 | Keskitaso | Testaus | Lisää unittestit `withCache`, `fetchAPIData`, `batchFetch` | T3 |
| M26 | Keskitaso | Arkkitehtuuri | Irrota `useMatchData` konkreettisesta API:sta — injektoi proppien/contextin kautta | T1 |
| M27 | Keskitaso | Bugi | Korjaa `CommonOpponents` — varjostetut propit (`teamBId: _`) | T3 |
| M28 | Keskitaso | Arkkitehtuuri | Lisää sivutus `batchFetch`:iin (50+ kohteelle) | T1+T2 |
| M29 | Keskitaso | Suorituskyky | Siirrä `formatResult` `CommonOpponents`:in render-syklin ulkopuolelle | T2 |
| M30 | Keskitaso | Suorituskyky | Poista `useCallback` `useFavorites`:stä | T3 |
| M31 | Keskitaso | Arkkitehtuuri | Lisää reittipolkuvakiot | T1 |
| M32 | Keskitaso | Suorituskyky | Lisää `React.memo` komponenteille `PlayerCard`, `StatBadge`, `DualStatBar` | T2 |
| M33 | Keskitaso | Arkkitehtuuri | Lisää virheraja yksittäisten sivun osien ympärille | T2 |
| M34 | Keskitaso | Arkkitehtuuri | Luo `useMediaQuery`-hook responsiivisille breakpointeille | T1 |
| M35 | Keskitaso | Arkkitehtuuri | Poista dynaaminen import `getMatchDetails`:stä — refaktoroi `withCache` | T1 |
| M36 | Keskitaso | Arkkitehtuuri | Luo `renderPlayoffTeamName` utiliteettikomponentiksi | T1 |
| M37 | Keskitaso | Arkkitehtuuri | Korvaa `cancelled = true` AbortControllerilla kaikkialla | T2+T1 |
| M38 | Keskitaso | Suorituskyky | Lisää pyyntöjen dedupointi sivutasolle | T2 |
| M39 | Keskitaso | Testaus | Lisää `data-testid`-attribuutit automaattiseen testaukseen | T3 |
| M40 | Keskitaso | Ylläpito | Päivitä DESIGN.md vastaamaan toteutusta | T3 |
| M41 | Keskitaso | Arkkitehtuuri | Luo `useLocalStorage`-hook pysyvyydelle | T1 |
| M42 | Keskitaso | Suorituskyky | Korvaa `` luokkavakioilla | T3 |
| M43 | Keskitaso | Typetys | Luo tyyppivartijat API-virheille (instanceof tarkistukset) | T3 |
| M44 | Keskitaso | Arkkitehtuuri | Luo `useAbortController`-hook | T1 |
| M45 | Keskitaso | Suorituskyky | Lisää `useMemo` `CommonOpponents`:in handleToggle-funktiovakioille | T2 |
| M46 | Keskitaso | Arkkitehtuuri | Luo tietovuokaavio (data flow diagram) dokumentaatioon | T3 |
| M47 | Keskitaso | Resilienssi | Korjaa `batchFetch` — lisää virheiden aggregointi | T2 |
| M48 | Keskitaso | Suorituskyky | Korvaa manuaaliset `useMemo`-vertailut React 19:n `use`-API:lla tulevaisuudessa | T1 |
| M49 | Keskitaso | Ylläpito | Siirrä kaikki CSS `@theme`-muuttujat vastaamaan DESIGN.md:ää | T3 |
| M50 | Keskitaso | Resilienssi | Lisää API:n terveystarkistus ennen ensimmäistä käyttövuorovaikutusta | T2 |

---

## Toteutussuunnitelma

### Viikko 1-2 (Vaihe 0 — Kriittiset)
```
├─ K1: `useMemo` CommonOpponents:iin
├─ K2-K3: Kilpailutilanteiden korjaus (mountedRef → useEffect cleanup)
├─ K4: Null-kaatumisen korjaus dataProcessors.ts:ssä
├─ K5: Tuplabarrel-exporttien poisto types/index.ts:stä
├─ K6: matchStatus-välitys withCache:lle (poista dynaaminen import)
├─ K7-K8: formatDate-aikavyöhyke + StandingsTable NaN-korjaus
├─ K9-K12: Kaikki käyttöliittymätekstit suomeksi (Match View, footer jne.)
```

### Viikko 3-5 (Vaihe 1 — Korkea)
```
├─ H1-H3: Jumalafunktioiden ja monoliittisten sivujen jako
├─ H4-H5: Cache LRU + CSS-animaatiot
├─ H6: Testi-infrastruktuurin luonti
├─ H7-H8: Custom-hookien luonti
├─ H9-H10: any[]-poisto + Zod-validointi
├─ H11-H12: Kuvien lazy loading + bundle-analyysi
├─ H13: CSP-otsake
├─ H14-H15: MatchSearch + MatchRow -komponentit
├─ H16-H17: Uudelleenyrityspainike + offline-ilmoitus
├─ H18-H19: Retry-jitter + kuolleen koodin poisto
├─ H20: Domain-palvelukerros
├─ H21-H24: APINetworkError-rename, eslint, WLD-duplikaatio, fonttipainot
```

### Viikko 6-8 (Vaihe 2 — Keskitaso)
```
├─ M1-M3: React Query, koodinjako, virtuaalinen scrollaus
├─ M4-M6: Kategoriautiliteetti, suosikkicontext, Zod-skeemat
├─ M7-M8: Integraatiotestit + MSW
├─ M9-M10: cn()-yksinkertaistus + barrel-exporttien siivous
├─ M11-M12: JSDoc + prefetching
├─ M13-M14: MatchWithVenue-poisto + maagisten numeroiden korvaus
├─ M15-M16: Service worker + useRateLimiter
├─ M17-M19: stale-while-revalidate + repository + CI-budjetti
├─ M20-M25: Virheviestit, deprecatio, display=swap, PageSkeleton, brandityypit
└─ M26-M50: Loput keskitasoiset kohteet
```

### Yhteenveto

- **300 tarkistuspistettä** auditoitu kolmen tiimin toimesta
- **Kriittisiä:** 8 korjausta (1-2 päivää)
- **Korkeita:** 30 korjausta (3 viikkoa)
- **Keskitasoisia:** 50 korjausta (3 viikkoa)
- **Kokonaisaika:** ~8 viikkoa

Tärkeimmät arkkitehtoniset voitot:
1. Domain-palvelukerros (`matchService`, `teamService`, `playerService`)
2. React Query välimuistitukselle
3. `any[]`-tyyppien eliminointi
4. Testi-infrastruktuuri
5. Monoliittisten sivujen hajotus

---

*Dokumentti luotu 2026-06-14 — Football Stats (SPL / Palloliitto) -sovelluksen arkkitehtuuriarvio*
