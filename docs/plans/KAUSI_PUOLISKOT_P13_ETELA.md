# Speksi: kausi, season_id ja kevat/syksy (P13 Etela)

> football-stats — Taso REST 2026-08-29 live-tarkistus
> Liittyy: `docs/plans/PELIOIKEUS_P13_ETELA.md`
> Status: lahdetotuus datamallille

**`season_id` on kalenterivuosi (`"2026"`). Kevat ja syksy EIVAT ole eri seasoneita.**
Ne ovat eri `group_id` / `group_name` saman kategorian alla.

Ala vertaa `season_id === "2026-kevat"`. Sellaista arvoa ei ole.

## Hierarkia (vahvistettu Taso API 29.8.2026)

```
competition etejp26  "Etelä Jalkapallo 2026"  season_id = "2026"
  category P13LE P13 Liiga Etelä  11v11
  category P131  P13 Ykkönen      11v11
  category P132  P13 Kakkonen     8v8
  category P133  P13 Kolmonen     8v8
    group  <-- TÄSSÄ on kevät / syksy
```

| category_id | group_id | group_name |
|---|---|---|
| P13LE | 1 | Kevat |
| P13LE | 3 | Mitalisarja |
| P13LE | 5 | Jatkosarja |
| P13LE | 7 | Karsinta A |
| P13LE | 9 | Karsinta B |
| P131 | 1 | Kevat |
| P131 | 2 | Syksy |
| P132 | 1 | Kevat 1 |
| P132 | 2 | Kevat 2 |
| P132 | 4 | Syksy 1 |
| P132 | 6 | Syksy 2 |
| P133 | 1 | Kevat 1 |
| P133 | 2 | Kevat 2 |
| P133 | 4 | Syksy 1 |
| P133 | 5 | Syksy 2 |

Liiga Etela syksy = Mitalisarja / Jatkosarja / Karsinta → pelioikeudessa `autumn`.
Futsal voi kayttaa `2025-26`. Jalkapallon kesakausi ei.

## Kentat ottelurivillä

- `season_id` = `"2026"` (kausivertailu)
- `competition_id` = `etejp26`
- `category_id` / `category_name` = taso (parseLevel)
- `group_name` = seasonHalf (`Kevat 1` / `Syksy 2` / `Mitalisarja`)
- `status` = Played | Fixture

## seasonHalf

Tiedosto `src/domain/eligibility/seasonHalf.ts`:

1. group_name: kevat → spring, syksy/mitali/jatko/karsinta → autumn
2. date vs Etela 2026: springEnd 2026-06-28, autumnStart 2026-08-03
3. muuten single (kesatauko ei nollaa eika siirra kiintiota)

KM §15 R6: lastOfficial nollautuu kevat→syksy. Liiga-kevat ei siirry syksyn Kakkonen-kiintioon.

## Appisaannot

- `seasonMatchesYear` (`src/utils/names.ts`) — ei raw `=== "2026"`
- pastMatches = `status === Played`, ei kellovertailua
- lastOfficial per `(teamId, seasonHalf)`, ei per koko season_id
