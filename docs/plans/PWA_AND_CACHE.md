# PWA ja pelattujen otteluiden cache

## PWA
Asennettava kuori GH Pagesissa (`vite-plugin-pwa`). Offline = apin kuori + localStorage-persistoidut pelatut ottelut. TASO-kutsuja ei cacheteta service workerissa.

## Cloudflare Worker
`workers/taso-proxy`

```bash
cd workers/taso-proxy
npx wrangler login
npx wrangler secret put TASO_ACCEPT   # sama Accept-avain kuin TASOssa
npx wrangler deploy
```

Worker-URL esim. `https://taso-proxy.<account>.workers.dev/taso`

GitHub repo → Settings → Variables → `VITE_TASO_PROXY` = tuo URL (ilman perän kauttaviivaa, path päättyy `/taso` tai workerin juureen — selain kutsuu `${PROXY}/getMatch?match_id=`).

Reititys workerissa: viimeinen path-osa on endpoint (`/getMatch`).

- `getMatch` + status Played → Cache API, 1 vuosi, immutable
- muut → 120 s + SWR, ei pitkää storea

Ilman muuttujaa appi kutsuu TASOa suoraan kuten ennen.
