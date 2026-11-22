# The Marlowe Job — a midnight vault heist

A complete, original top-down stealth heist game that runs offline in a desktop
browser from static files. Three nights, three rooms, one thief: cross the
gallery, read the patrols, dodge the vision cones and the sweeping cameras, lift
the vault piece and reach the exit before the alarm hits full.

## Play

Open `game/index.html` in desktop Chrome (or serve the folder with any static
server — `node serve.ts` serves it at http://localhost:8080).

- **WASD / arrow keys** — move Marlowe the thief
- **Shift** — sneak (slower, but the alarm fills half as fast while you are seen)
- **Q** — smoke bomb (2 per night; cones cannot see through smoke; costs 25 score)
- **E** — EMP burst (1 per night; blinds every camera for 6 seconds; costs 25 score)
- **P** — pause · **Space / click** — confirm, start, continue

## The job

Each night is one room of the Halcyon Gallery:

1. **The Gallery** — two guards, one camera, the Sapphire.
2. **The Vault Hall** — three guards, two cameras, the Ruby.
3. **The Diamond Room** — four guards, three cameras, the Marlowe Diamond.

Guards walk waypoint patrols and look through a vision cone; cameras sweep from
the walls. Being seen fills the **alarm meter**: at 40% the guards get
suspicious and hunt your last-seen spot, at 70% they chase you, at 100% the job
is blown and you lose a life. Cover (display cases, crates, pillars) blocks both
movement and sight, so every room has at least two routes to the vault — a fast
open lane under the cones and a slow covered lane behind the cases.

Small loot (gold bars, canvases) is optional score; the vault piece opens the
exit. Clearing a room pays a time bonus, plus a ghost bonus when the alarm never
passed 50%, plus a bonus per life left at the end of the third night. Three
lives; lose them all and Marlowe is in cuffs.

## Files

- `game/` — the playable game, plain static files, no network request
  - `game/index.html` — the page
  - `game/src/config.js` — every tuning number in one place
  - `game/src/levels.js` — the three rooms
  - `game/src/world.js` — the simulation: movement, patrols, vision, alarm, tools
  - `game/src/render.js` — all canvas drawing, HUD and screens
  - `game/src/input.js` — keyboard and mouse
  - `game/src/shots.js` — the four staged screenshot scenes
  - `game/src/rng.js` — seeded random, so `?seed=N` always deals the same room
  - `game/src/main.js` — boot and the fixed-step loop
- `screenshots/` — four renders of the game's own code: title, mid-sneak,
  high-alarm, and the getaway
- `shots.json` — the queries that stage each screenshot (`?shot=…&seed=1`)
- `main.ts` — the entry program: copies `game/` and `screenshots/` to the
  output directory and writes `dossier.json`
- `serve.ts` — a tiny static server for local play-testing only

## Screenshots

The screenshots are staged by the game's own code: `?shot=start|play|tense|win`
plays the real rules forward from a fresh world with a waypoint autopilot, so
each frame is what a real game looks like. Serve the game and capture them with
headless Chrome, e.g.:

```
node serve.ts &
google-chrome --headless --disable-gpu --window-size=1280,720 \
  --virtual-time-budget=5000 --screenshot=screenshots/1-start.jpg \
  "http://localhost:8080/?shot=start&seed=1"
```

## License

MIT — see `LICENSE`.
