# D&D 5e 2024 Forgotten Realms Encounter Generator

A React-based encounter generator for D&D 5th Edition (2024 rules) set in the Forgotten Realms. Generates balanced encounters based on party size, level, and region, with full combat statistics and JSON export for external integration.

## Features

### Core Encounter Generation
- **Region-based encounters**: Six distinct regions (Icewind Dale, Heartlands, Moonshae Isles, Calimshan, Cities, Dungeon) with unique monster tables
- **Difficulty scaling**: Low, Moderate, High, or Random difficulty
- **Cross-regional encounters**: Chance for monsters from adjacent regions to appear
- **XP budget system**: Encounters balanced to party size and level

### Combat Statistics
- **Initiative**: Pre-rolled for each monster group (1d20 + initiative bonus)
- **Perception**: Best perception roll among monsters (minimum = passive perception)
- **Stealth**: Worst stealth roll (monsters without proficiency roll with disadvantage)
- **Encounter Distance**: Calculated based on terrain type

### Reaction System
- **2d6 Reaction Roll** with alignment modifiers:
  - All Evil: -3 modifier
  - Any Evil: -2 modifier
  - All Neutral: -1 modifier
  - All Good: +0 modifier
- **Results**: Hostile (≤4), Indifferent (5-9), Friendly (10+)

### Name Generation
- Intelligent creatures (Int ≥ 3) and powerful creatures (CR ≥ 11) receive generated names
- Region-appropriate naming based on Faerun cultures
- Special naming for dragons and legendary creatures

### Faction System
- 50% chance for encounters with intelligent creatures (Int ≥ 6) to have faction affiliations
- Factions matched by creature type and alignment
- One faction per encounter for thematic consistency

### JSON Export
Click **Copy JSON** to export the encounter for use in external applications (e.g., character progress trackers).

**JSON Format:**
```json
{
  "monsters": [
    {
      "monsterType": "Bandit Captain",
      "cr": "2",
      "name": "Jardwim Kormallis",
      "faction": "Zhentarim"
    }
  ],
  "reaction": "hostile",
  "date": "2026-01-18",
  "hexType": "Heartlands",
  "xpUsed": 450
}
```

| Field | Description |
|-------|-------------|
| `monsters` | Array of monsters with type, CR, generated name, and faction |
| `reaction` | Lowercase: "hostile", "indifferent", or "friendly" |
| `date` | Encounter date in ISO 8601 format (YYYY-MM-DD) |
| `hexType` | Region name (e.g., "Icewind Dale", "Heartlands") |
| `xpUsed` | Total XP value of the encounter |

---

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

The generator produces encounters using six templates:

| Template | Description |
|----------|-------------|
| **Solo** | Single dragon or legendary creature |
| **Skirmish** | Half party size of same monster type |
| **Standard** | Party size of same monster type |
| **Elite Group** | 1 boss + half party size minions |
| **Horde** | Double party size of same monster type |
| **Boss Mob** | 1 boss + party size minions |

---

## Data Files

Monster data is stored in `src/data/`:

| File | Purpose |
|------|---------|
| `region_monsters.json` | Region-specific monster lists by CR |
| `enriched_monster_list.json` | Full monster stats (Int, Perception, Stealth, etc.) |
| `cross_region_encounters.json` | Cross-regional encounter chances |
| `dragon.json` | Dragon entries with CR and theme |
| `legendary.json` | Legendary creature entries |
| `factions.json` | Faction definitions with type/alignment requirements |
| `adventure_regions.json` | Adventure source mappings to regions |
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
