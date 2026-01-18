# Faerun Name Generation System

Generate culturally-appropriate names for creatures in Forgotten Realms encounters.

## Quick Start

```javascript
import { generateName, generateDragonName, generateLegendaryName } from './nameGenerator';

// Basic name (50% from list, 50% procedurally generated)
generateName({ region: 'heartlands', gender: 'male', cr: 5 });

// Dragon name with age-appropriate title
generateDragonName('Ancient Red Dragon', 24, 'calimshan');

// Faction member with title
generateFactionMemberName('Red Wizards', 'calimshan', 'male', 12);
```

## Features

| Feature | Description |
|---------|-------------|
| **50/50 Split** | Half names from curated lists, half procedurally generated |
| **Regional Cultures** | Each region draws from multiple cultural languages |
| **CR-Based Complexity** | CR < 4: 85% short names; CR ≥ 10: 50% have titles |
| **Faction Titles** | 20 factions with themed titles and epithets |
| **Dragon Names** | Chromatic/metallic/gem patterns with age-based titles |
| **Legendary Beasts** | Beholders, liches, mind flayers with creature-specific patterns |

## Regional Culture Mapping

Based on `data/NameData.md`:

| Region | Encounter ID | Cultural Languages |
|--------|--------------|-------------------|
| Heartlands | `heartlands` | Chondathan (primary), Aglarondan, Alzhedo, Chessentan |
| Calimshan | `calimshan` | Alzhedo/Arabic, Mulhorand/Egyptian, Durpari, Chultan |
| Moonshae | `moonshae` | Celtic/Ffolk (primary), Elven, Halfling |
| Cities | `cities` | Turmic/Spanish, Lantanese/German |
| Dungeons | `dungeons` | Drow, Dwarven, Gnome, Orc |
| Icewind Dale | `icewind_dale` | Illuskan/Norse, Rashemi/Slavic, Damaran, Uluik |

## Files

```
src/
├── nameGenerator.js              # Main API
├── nameGenerators/
│   └── faerunNames.js            # Syllable-based procedural generators
└── data/
    ├── region_names.json         # 100+ names per region
    ├── faction_names.json        # 20+ names/titles per faction
    └── dragon_names.json         # Dragon naming patterns
```

## API Reference

### `generateName(options)`

```javascript
generateName({
  region: 'heartlands',     // Region ID from encounter system
  gender: 'male',           // 'male' or 'female'
  cr: 5,                    // Challenge Rating (affects complexity)
  faction: 'Red Wizards',   // Optional: adds faction title
  forceTitle: false,        // Force include a title
  forceShort: false         // Force short name (first name only)
});
```

### `generateDragonName(dragonType, cr, region)`

```javascript
generateDragonName('Ancient Gold Dragon', 24, 'heartlands');
// => "Palaranduskwing the Eternal"

generateDragonName('Young Red Dragon', 10, 'calimshan');
// => "Klauthrax Flamescale"
```

### `generateLegendaryName(creatureType, cr, region)`

```javascript
generateLegendaryName('beholder', 13, 'dungeons');
// => "Xanatgor the All-Seeing"

generateLegendaryName('lich', 21, 'dungeons');  
// => "Szasstam the Undying"
```

### `generateFactionMemberName(factionName, region, gender, cr)`

```javascript
generateFactionMemberName('Zhentarim', 'cities', 'male', 8);
// => "Davil Margaster the Black Network Agent"
```

## CR-Based Name Complexity

| CR Range | Name Format | Example |
|----------|-------------|---------|
| < 4 | 85% short (first name only) | "Gruul" |
| 4-9 | 50% medium (with surname) | "Gruul Stonefist" |
| ≥ 10 | 50% full with title | "Gruul Stonefist the Mighty" |

## Procedural Generation

Each culture has syllable patterns extracted from canonical names:

```javascript
// Illuskan (Norse) example
maleStart: ["An", "Bla", "Bra", "Fra", "Hro", "Rag", "Sig", "Ulf", "Wul"]
maleEnd: ["th", "der", "gar", "nar", "rik", "vald", "mund", "bjorn"]
// Generates: "Ragvald", "Ulfgar", "Brader", etc.
```

## Testing

```bash
node test_name_generator.js
```

Shows sample names from each region demonstrating cultural variety.
