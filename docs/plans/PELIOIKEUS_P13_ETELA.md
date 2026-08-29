# Speksi: P13 pelioikeustarkastus (Etelä, 8v8 / 11v11)

> football-stats — Palloliitto kilpailumääräykset 2026 kohta 15
> Scope: saman seuran saman ikäluokan joukkueet, ylhäältä alas + poikkeusluvat
> Status: draft spec, ei vielä toteutettu
> Päivitetty: 2026-08-29

Tämä ei ole virallinen Palloliiton työkalu. Se on valmentajan / vanhemman **päätöstuki**:
vihreä / keltainen / punainen + sääntöviite. Lopullinen pelioikeus on aina TASO + kilpailunjärjestäjä.

---

## 1. Ongelma

P13-joukkueella on usein 2–4 tasoa samassa seurassa (Liiga / Ykkönen / Kakkonen / Kolmonen).
Valmentaja rakentaa 8v8-kokoonpanoa ja tarvitsee vastaukset:

1. Saako tämä pelaaja pelata **tässä ottelussa tänään**?
2. Onko hän **ylhäältä alas -kiintiössä** (viimeinen virallinen peli ylemmällä tasolla)?
3. Onko hänellä **poikkeuslupa** (K = kaksoisedustus, Y = yli-ikäinen) joka muuttaa laskentaa?
4. Tuleeko 31.5. / 2.9. -raja vastaan?

Nykyinen app näyttää pelaajan otteluhistorian (`PlayerMatchEntry`, `PastMatchDetail`) mutta ei päättele pelioikeutta.

---

## 2. Sääntöpohja (lähde totuus)

### 2.1 Valtakunnallinen (aina voimassa)

Kilpailumääräykset 2026 §15:

| ID | Sääntö |
|---|---|
| R1 | Nuorella pelioikeus samassa seurassa vain **yhdessä joukkueessa / sarjatasolla** per ikäluokka |
| R2 | Pelioikeus myös **vanhemmissa nuorten** ja **aikuisten** joukkueissa, yksi joukkue/taso |
| R3 | Saman ikäluokan eri tasoilla: **yksi sarjataso per päivä**. Seuraava taso aukeaa **seuraavana kalenteripäivänä** |
| R4 | Ylhäältä alas: alemman tason otteluun max **N** pelaajaa, jotka olivat ylempien tasojen **edellisessä virallisessa ottelussa** kokoonpanossa. N sisältää poikkeuslupapelaajat |
| R5 | 31.5. jälkeen ylemmällä tasolla pelannut ei saa pelata saman ikäluokan alemman tason **kolmessa viimeisessä kevätottelussa**. 2.9. sama syksyllä |
| R6 | Kevät- ja syyskierroksen välissä laskuri nollautuu |
| R7 | Eri ikäluokkien välillä ei karenssia (P13 + P14 sama päivä OK) |
| R8 | Yli-ikäinen ilmoitus: max 2 / joukkue. Y-pelaaja **ei saa pelata muissa nuorten joukkueissa** |
| R9 | Ykkösen nousukarsinta: ei pelaajia jotka pelanneet ylemmällä tasolla 31.5. / 2.9. jälkeen |

### 2.2 Alueprofiilit (konfiguroitava)

Etelä **ei ole julkaissut** Lännen/Idän kaltaista erillismääräys-PDF:ää 2026.
Siksi default = valtakunnallinen. Alue-override YAML/JSON.

| Alue | N ylhäältä alas | 8v8 N | 31.5 / 2.9 |
|---|---|---|---|
| **etela** (default) | 4 | 4 | voimassa (Liiga/Ykkönen). Kolmonen+ tapauskohtainen |
| lansi | 4 (11v11) | **3** | poistettu alue-sarjoista; karsinnassa voimassa |
| ita | 4 | 4 | poistettu alue-sarjoista; karsinnassa voimassa |
| pohjoinen | 4 kunnes toisin todistettu | 4 | tarkistettava |

P13 Etelä 2026 pelimuoto:

- Liiga Etelä + Ykkönen → 11v11
- Kakkonen ja alemmat → 8v8
- yksittäiset ottelut, ei miniturnauksia

### 2.3 Mitä "pelasi ottelussa" tarkoittaa

Kilpailumääräykset 3.14 + juniorien edestakaiset vaihdot:

> Jos ottelussa on edestakainen vaihto-oikeus, **kaikki kokoonpanoluetteloon merkityt** katsotaan pelanneen.

P13 8v8 ja 11v11 käyttävät EV-vaihtoja → **lineup-merkintä = pelasi**.
Ei vaadita minuutteja eikä maalia.

Virallinen ottelu = Palloliiton sarja- tai cup-ottelu (`status === Played`).
Harjoitusottelut eivät laske, ellei käyttäjä merkitse niitä manuaalisesti virallisiksi (default: ei).

---

## 3. Käyttäjätarina

**Valmentaja, P13 Kakkonen 8v8, lauantai 16:00**

1. Avaa joukkueen sivu → välilehti **Pelioikeus**
2. Valitsee ottelun (tuleva fixture) tai päivämäärän
3. Näkee ehdokaslistan: seuran P13-pelaajat + P12 + merkityt poikkeusluvat
4. Jokaisella rivillä: status, viimeinen virallinen peli, taso, K/Y-merkintä, syy
5. Kun 5. "ylhäältä alas" -pelaaja lisätään, rivi muuttuu punaiseksi ja kiintiöpalkki 4/4 → 5/4

Toissijainen näkymä: **Pelaajasivu** → kortti "Saako pelata X-joukkueessa Y-päivänä?"

---

## 4. Domain-malli

Uusi tiedosto `src/domain/eligibility/` — puhdas logiikka, ei Reactia, ei API-kutsuja.

```ts
export type RegionId = 'etela' | 'lansi' | 'ita' | 'pohjoinen'

export type AgeClass = 'P13' | 'T13' | string // P12, P14, ...

export type LevelRank =
  | 'liiga'
  | 'ykkonen'
  | 'kakkonen'
  | 'kolmonen'
  | 'nelonen'
  | 'vitonen'
  | 'harraste'
  | 'unknown'

export type Format = '11v11' | '8v8' | '5v5' | '4v4'

export type ExceptionKind = 'none' | 'K' | 'Y' | 'Y_permit'
// K = kaksoisedustus, Y = yli-ikäisyysilmoitus, Y_permit = yli-ikäisyyslupa (>2)

export type Verdict = 'ok' | 'warn' | 'block'

export interface RegionRuleSet {
  region: RegionId
  downFromHigherMax: Record<Format, number>
  dateGatesEnabled: boolean          // 31.5 / 2.9
  dateGateSpring: string             // '05-31'
  dateGateAutumn: string             // '09-02'
  lastThreeLowerBlockedAfterGate: boolean
  promotionPlayoffBlocksHigherAfterGate: boolean
  sameAgeClassOneLevelPerDay: boolean
  evLineupCountsAsPlayed: boolean    // true junioreissa
  overageDeclaredBlocksOtherYouth: boolean
}

export const ETELA_2026: RegionRuleSet = {
  region: 'etela',
  downFromHigherMax: { '11v11': 4, '8v8': 4, '5v5': 4, '4v4': 4 },
  dateGatesEnabled: true,
  dateGateSpring: '05-31',
  dateGateAutumn: '09-02',
  lastThreeLowerBlockedAfterGate: true,
  promotionPlayoffBlocksHigherAfterGate: true,
  sameAgeClassOneLevelPerDay: true,
  evLineupCountsAsPlayed: true,
  overageDeclaredBlocksOtherYouth: true,
}

export interface OfficialAppearance {
  playerId: string
  matchId: string
  date: string              // YYYY-MM-DD
  teamId: string
  clubId: string
  ageClass: AgeClass
  level: LevelRank
  format: Format
  official: boolean
  onLineup: boolean
  seasonHalf: 'spring' | 'autumn' | 'single'
}

export interface PlayerEligibilityContext {
  playerId: string
  clubId: string
  birthYear: number
  exceptions: {
    kind: ExceptionKind
    otherClubId?: string
    boundTeamId?: string    // Y lukitsee tähän nuorten joukkueeseen
  }[]
  appearances: OfficialAppearance[]
}

export interface TargetMatch {
  matchId?: string
  date: string
  clubId: string
  teamId: string
  ageClass: AgeClass
  level: LevelRank
  format: Format
  isPromotionPlayoff?: boolean
  isLastThreeOfHalf?: boolean   // syötetään tai päätellään kalenterista
  seasonHalf: 'spring' | 'autumn' | 'single'
}

export interface EligibilityReason {
  code:
    | 'OK'
    | 'SAME_AGE_SAME_DAY'
    | 'DOWN_QUOTA'
    | 'DATE_GATE_LAST_THREE'
    | 'PROMOTION_PLAYOFF_GATE'
    | 'OVERAGE_LOCKED'
    | 'NO_DUAL_CLUB'
    | 'UNKNOWN_LEVEL'
    | 'NOT_OFFICIAL_SOURCE'
  messageFi: string
  ruleRef: string            // 'KM 15.2', 'KM 15.3', ...
}

export interface PlayerEligibilityResult {
  playerId: string
  verdict: Verdict
  countsTowardDownQuota: boolean
  lastOfficialHigher?: OfficialAppearance
  lastOfficialAny?: OfficialAppearance
  reasons: EligibilityReason[]
}

export interface SquadEligibilityResult {
  target: TargetMatch
  region: RegionId
  downQuotaUsed: number
  downQuotaMax: number
  players: PlayerEligibilityResult[]
  squadVerdict: Verdict
}
```

Taso-järjestys (sama ikäluokka, sama alue):

```ts
export const LEVEL_ORDER: LevelRank[] = [
  'liiga', 'ykkonen', 'kakkonen', 'kolmonen', 'nelonen', 'vitonen', 'harraste', 'unknown',
]

export function isHigherLevel(a: LevelRank, b: LevelRank): boolean {
  return LEVEL_ORDER.indexOf(a) < LEVEL_ORDER.indexOf(b)
}
```

`unknown` ei saa koskaan laskea "ylemmäksi" → verdict `warn`, koodi `UNKNOWN_LEVEL`.

---

## 5. Päättely moottori

`evaluatePlayer(ctx, target, rules) -> PlayerEligibilityResult`

Järjestys (ensimmäinen block voittaa, warnit kertyvät):

```
1. Y-ilmoitus voimassa ja target.teamId !== boundTeamId
     ja target on nuorten joukkue
     → BLOCK OVERAGE_LOCKED (KM 15 + poikkeuslupamääräykset 2.1.1)

2. Kaksoisedustus puuttuu ja target.clubId !== ctx.clubId
     → BLOCK NO_DUAL_CLUB

3. Sama ageClass AND jokin official appearance samana päivänä eri levelillä
     → BLOCK SAME_AGE_SAME_DAY (KM 15.2 / FAQ 2026)

4. target.level on alempi kuin pelaajan viimeinen official appearance
   SAMASSA ageClassissa SAMALLA kauden puoliskolla
     → countsTowardDownQuota = true
     (ei block yksin — block syntyy joukkuetasolla kun used > max)

5. dateGatesEnabled AND appearance ylemmällä tasolla päivämäärän jälkeen
   AND target.isLastThreeOfHalf
     → BLOCK DATE_GATE_LAST_THREE (KM 15.3)

6. isPromotionPlayoff AND appearance ylemmällä tasolla gaten jälkeen
     → BLOCK PROMOTION_PLAYOFF_GATE

7. Muuten OK
```

`evaluateSquad(players, target, rules)`:

- aja evaluatePlayer kaikille valituille
- `downQuotaUsed` = count(countsTowardDownQuota)
- jos used > max → ne rivit joiden quota-flag on true ja jotka ylittävät maxin: BLOCK DOWN_QUOTA
- squadVerdict = block jos mikä tahansa block, muuten warn jos warn, muuten ok

### 5.1 "Viimeinen virallinen ottelu" -määritelmä

Jokaiselle **ylemmälle joukkueelle** erikseen:

```
lastOfficial(teamId) =
  max(date) appearances where
    official && onLineup && teamId == teamId && status Played
```

Kiintiöön kuuluu pelaaja, jos hän on **minkä tahansa ylemmän tason joukkueen** lastOfficial-kokoonpanossa.
Ei koko kauden historia — vain kunkin ylemmän joukkueen **viimeisin** virallinen peli.

Kevät/syksy-vaihto: jos `seasonHalf` vaihtuu, lastOfficial nollautuu (R6).

### 5.2 Miten lastOfficial saadaan SPL-datasta

Nykyinen ketju:

- `PlayerAPIResponse.matches: PlayerMatchEntry[]` (päivä, team_id, category_name, status)
- `MatchDetails.lineups: PlayerLineupInfo[]` (onLineup)

Moottori ei luota pelkkään `PlayerMatchEntry`-riviin. Juniori-EV:ssä lineup pitää vahvistaa `getMatchDetails`.

Algoritmi:

1. Pelaajan matches, filter `status === Played` ja `official`
2. Ryhmittele `team_id`
3. Ota max(date) per team
4. Hae kyseisen ottelun lineup (cache `src/services/cache.ts`)
5. Jos player_id lineuppissa → appearance

Puuttuva lineup → `warn NOT_OFFICIAL_SOURCE` ("vahvista TASOsta"), älä arvaa.

### 5.3 Taso category_name:sta

Heuristiikka `src/domain/eligibility/parseLevel.ts`:

```
/liiga/i          → liiga
/ykkönen|ykkonen/i → ykkonen
/kakkonen/i       → kakkonen
/kolmonen/i       → kolmonen
/nelonen/i        → nelonen
/vitonen/i        → vitonen
/harraste/i       → harraste
else              → unknown
```

Iluokka: `/P13|T13|P2013/` tms. + `birthYear` fallback (2026 kausi: P13 = 2013).

Override-taulu `src/domain/eligibility/competitionOverrides.ts` tunnetuille Etelän competition_id:ille, koska nimet vaihtelevat.

---

## 6. Poikkeusluvat (erityisoikeudet)

SPL-API ei takaa K/Y-kenttää. Siksi **manuaalinen lähde + valinnainen parsinta**.

### 6.1 Manual store (pakollinen v1)

LocalStorage / myöhemmin Dexie, avain `eligibility.exceptions.v1`:

```ts
interface StoredException {
  playerId: string
  kind: ExceptionKind
  validFrom: string
  validTo?: string
  boundTeamId?: string
  otherClubId?: string
  note?: string
  source: 'manual' | 'taso-import'
}
```

UI: Pelaajakortti → "Merkitse poikkeuslupa" (K / Y / Y-lupa).

### 6.2 Sääntövaikutus

| Lupa | Vaikutus moottorissa |
|---|---|
| K | Sallii toisen seuran target.clubId. Lasketaan silti down-quotaan jos tulee ylhäältä. Alueellisen Liigan/Ykkösen 8v8-pöytäkirjassa max 3 poikkeuslupapelaajaa (erillinen squad-check) |
| Y | Lukitsee pelaajan `boundTeamId`:hen nuorten sarjoissa. Aikuiset OK. Lasketaan poikkeuslupakiintiöön |
| Y_permit | Sama kuin Y + joukkuekohtainen >2 vaatii luvan (vain merkitään, ei myönnetä appissa) |

Poikkeuslupakiintiö ottelupöytäkirjassa (FAQ 2026):

- Alueellinen Liiga / Ykkönen: 11v11 max 5, 8v8 max 3, 5v5 max 2
- Muut alueelliset: K ei rajattu samoin, Y-raja silti

Tämä on **erillinen** kiintiö kuin down-from-higher. Molemmat näytetään palkkeina.

---

## 7. UI (Night Captain)

Design.md: dark only, accent `#faff69`, semantic green/amber/red.

### 7.1 Joukkuesivu — välilehti Pelioikeus

```
[P13 Kakkonen 8v8  · la 30.8. · Etelä]
Ylhäältä alas  2 / 4   ████░░░░
Poikkeusluvat  1 / 3   ██░░░░

OK 12   WARN 2   BLOCK 1

Pelaaja          Viimeisin ylempi          Lupa   Status
A. Virtanen      Liiga 24.8. lineup        —      WARN quota
S. Nieminen      Ykkönen 23.8.             K      OK
M. Korhonen      —                         Y      BLOCK locked
```

- OK = vihreä piste
- WARN = amber
- BLOCK = punainen + reasonFi yhdellä rivillä
- Tap → sheet: ruleRef, last match linkki MatchPageen, "miksi lasketaan kiintiöön"

### 7.2 Pelaajasivu

Kortti "Pelioikeus":

- Dropdown: seuran P13-joukkueet
- Päivämäärä (default tänään)
- Verdict + 1–3 syytä
- Form dots: viralliset ottelut, tooltipissä taso + "lasketaan seuraavaan alas-kiintiöön"

### 7.3 Disclaimer

Pieni caption jokaisessa näkymässä:

> Perustuu KM 2026 §15 ja Etelän julkaistuun linjaan. Ei korvaa TASOa. Vahvista epäselvyydet kilpailutoiminnolta.

---

## 8. API- ja dataraot

| Tarve | Lähde nyt | Puute |
|---|---|---|
| Ottelut / päivä | SPL matches | OK |
| Lineup | MatchDetails.lineups | OK, cache pakollinen |
| category → taso | category_name heuristiikka | override-taulu |
| K / Y | ei API:ssa luotettavasti | manuaalinen store v1 |
| clubId vs teamId | team objects | tarkista `useTeamData` |
| kevät/syksy split | date vs 30.6. default | konfig |
| "kolme viimeistä" | group fixtures | laske jäljellä olevat Played+Fixture |
| harjoitusottelu | status / competition | allowlist viralliset competition_id |

Älä kutsu SPL:ää N+1 per pelaaja ilman batchia (`api.ts` rate limit). Pelioikeus-välilehti: 1) team roster 2) recent matches per sibling team 3) lineups vain lastOfficial-otteluille.

---

## 9. Testit (pakolliset ennen UI:ta)

`src/domain/eligibility/*.test.ts` — vitest, jo käytössä `dates.test.ts`.

| # | Case | Odotus |
|---|---|---|
| T1 | Liiga eilen lineup, Kakkonen tänään | SAME_AGE_SAME_DAY block |
| T2 | Liiga eilen, Kakkonen huomenna, 3 muuta quota-pelaajaa | OK, countsTowardDownQuota |
| T3 | 5. quota-pelaaja Kakkosessa | squad BLOCK DOWN_QUOTA |
| T4 | P13 + P14 sama päivä | OK |
| T5 | Y-pelaaja toiseen P13-joukkueeseen | BLOCK OVERAGE_LOCKED |
| T6 | Y-pelaaja aikuisiin | OK |
| T7 | Liiga 1.6., Kakkonen viimeinen kevätottelu, etela | BLOCK DATE_GATE |
| T8 | Sama kuin T7, lansi dateGatesEnabled=false | ei date-gate-blockia |
| T9 | Kevät Liiga, syksyn ensimmäinen Kakkonen | quota nollautuu |
| T10 | Lineup puuttuu | WARN, ei quota-laskentaa |
| T11 | Etelä 8v8 max 4, Länsi 8v8 max 3 | region switch |
| T12 | Nousukarsinta + ylempi 3.9. jälkeen | BLOCK PLAYOFF_GATE |
| T13 | EV: merkitty vaihtopenkille, ei minuutteja | counts as played |

---

## 10. Toteutusjärjestys

1. `src/domain/eligibility/rules.ts` + region presets + testit T1–T13
2. `parseLevel.ts` + competitionOverrides Etelä P13 2026
3. `appearances.ts` — PlayerMatchEntry + lineup → OfficialAppearance
4. `evaluate.ts` — player + squad
5. LocalStorage exception store + pieni editori pelaajakorttiin
6. TeamPage-välilehti Pelioikeus
7. PlayerPage-kortti
8. Disclaimer + ruleRef-linkit `llms.txt` / README

Ei Palloliitto-brändiä päätöksenä. App on decision support.

---

## 11. Explicit non-goals (v1)

- Ei FIFA-siirtoja, ei aikuisten 6 päivän karenssia (eri pykälä)
- Ei automaattista TASO-kirjautumista
- Ei "myönnä lupa" -työnkulkua
- Ei turnauskohtaisten seurasääntöjen täyttää päättelyä (vain virallinen sarja)
- Ei Pedipäivä / Navikka -integraatiota

---

## 12. Lähteet

- Palloliitto, Jalkapallon kilpailumääräykset 2026, kohta 15
- Palloliitto FAQ: nuoren pelaajan pelioikeus, yksi taso per päivä, karenssi ikäluokkien välillä
- Poikkeuslupamääräykset jalkapallo 2026 (K / Y)
- Etelä kausiohje 2026 seuroille: P13 Liiga+Ykkönen 11v11, Kakkonen+ 8v8
- Länsi toimintaohjeet 2026: 8v8 max 3, date gates pois
- Itä erillismääräykset 2026: max 4, date gates pois, Etelän säännöt Tulospalvelussa
