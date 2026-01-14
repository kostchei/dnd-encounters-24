# D&D 5e 2024 Forgotten Realms Encounter Generator

A React-based encounter generator for D&D 5th Edition (2024 rules) set in the Forgotten Realms. Generates balanced encounters based on party size, level, and region, with appropriate encounter distances based on terrain.

## Features

- **Region-based encounters**: Six distinct regions with unique monster tables
- **Difficulty scaling**: Low, Moderate, High, or Random difficulty
- **Cross-regional encounters**: Chance for monsters from adjacent regions to appear
- **Terrain-based distance**: Encounter distance calculated based on terrain type
- **XP budget system**: Encounters balanced to party size and level

## Running the App

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view in your browser.

---

## Encounter Distance Calculation

Encounter distance is determined by the terrain type, which is randomly selected based on the region's weighted terrain probabilities.

### Distance Formulas by Terrain

| Terrain | Dice Roll | Range (ft) | Average |
|---------|-----------|------------|---------|
| Open/Desert/Arctic | 6d6 × 10 | 60–360 | 210 ft |
| Forest | 2d8 × 10 | 20–160 | 90 ft |
| Hills/Urban | 2d10 × 10 | 20–200 | 110 ft |
| Mountains | 4d10 × 10 | 40–400 | 220 ft |
| Jungle/Indoors | 2d6 × 10 | 20–120 | 70 ft |

### Region Terrain Weights

Each region has weighted probabilities for terrain types:

| Region | Terrain Distribution |
|--------|---------------------|
| **Icewind Dale** | 70% Open/Desert/Arctic, 25% Mountains, 5% Hills/Urban |
| **Heartlands** | 25% Forest, 25% Hills/Urban, 25% Mountains, 25% Jungle/Indoors |
| **Moonshae Isles** | 30% Forest, 40% Hills/Urban, 30% Mountains |
| **Calimshan** | 60% Open/Desert/Arctic, 10% Forest, 10% Hills/Urban, 10% Mountains, 10% Jungle/Indoors |
| **Cities** | 50% Hills/Urban, 50% Jungle/Indoors |
| **Dungeon** | 90% Jungle/Indoors, 10% Hills/Urban |

---

## Encounter Categories

The generator produces three types of encounters:

1. **Dragon or Legendary**: Single powerful creature (always quantity 1)
2. **Groups**: Multiple creatures of the same type
3. **Mixed Groups**: A leader with minions (40% XP to leader, 60% to minions)

### Quantity Range

For group encounters:
- **Minimum**: 2 creatures
- **Maximum**: 2 × party size (capped at 10)

---

## Data Files

Monster data is stored in `src/data/`:

| File | Purpose |
|------|---------|
| `region_monsters.json` | Region-specific monster lists by CR |
| `cross_region_encounters.json` | Cross-regional encounter chances |
| `dragon.json` | Dragon entries with CR and theme |
| `legendary.json` | Legendary creature entries |
| `cr_xp.json` | CR to XP conversion table |
| `enc_xp.json` | XP thresholds by level and difficulty |

---

## Available Scripts

### `npm start`

Runs the app in development mode at [http://localhost:3000](http://localhost:3000).

### `npm test`

Launches the test runner in interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.
