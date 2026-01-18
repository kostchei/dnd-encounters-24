/**
 * Script to check and fix missing Statblock_Link in enriched_monster_list.json
 * 
 * For monsters without a Statblock_Link, this script generates the 5etools URL
 * based on the monster name and attempts to find the source book.
 */

const fs = require('fs');
const path = require('path');

const ENRICHED_PATH = path.join(__dirname, '../src/data/enriched_monster_list.json');

// Load monster data
const monsters = JSON.parse(fs.readFileSync(ENRICHED_PATH, 'utf-8'));

// Source abbreviation mappings for common adventures/books
const SOURCE_MAP = {
    'Rime of the Frostmaiden': 'idrotf',
    'Tomb of Annihilation': 'toa',
    'Waterdeep Dragon Heist': 'wdh',
    'Waterdeep: Dungeon of the Mad Mage': 'wdmm',
    "Baldur's Gate: Descent into Avernus": 'bgdia',
    'Out of the Abyss': 'oota',
    'The Wild Beyond The Witchlight': 'wbtw',
    'Phandelver and Below': 'pabtso',
    'Dragon of Icespire Peak': 'dip',
    'Storm King\'s Thunder': 'skt',
    'Curse of Strahd': 'cos',
    'Princes of the Apocalypse': 'pota',
    'Hoard of the Dragon Queen': 'hotdq',
    'Rise of Tiamat': 'rot',
    'Tales from the Yawning Portal': 'tftyp',
    'Monster Manual': 'mm',
    'Volo\'s Guide to Monsters': 'vgm',
    'Mordenkainen\'s Tome of Foes': 'mtf',
    'Fizban\'s Treasury of Dragons': 'ftd',
    'Mordenkainen Presents: Monsters of the Multiverse': 'mpmm',
    '2024 Monster Manual': 'xmm',
    'Ghosts of Saltmarsh': 'gos',
    'Explorer\'s Guide to Wildemount': 'egw',
    'Eberron: Rising from the Last War': 'erlw',
    'Acquisitions Incorporated': 'ai',
    'Candlekeep Mysteries': 'cm',
    'Van Richten\'s Guide to Ravenloft': 'vrgr',
    'The Book of Many Things': 'bmt'
};

// Generate 5etools URL from monster name
function generate5etoolsUrl(name, source = 'xmm') {
    // URL-encode the monster name (lowercase, spaces become %20)
    const encodedName = encodeURIComponent(name.toLowerCase());
    return `https://5e.tools/bestiary.html#${encodedName}_${source}`;
}

// Try to determine source from Adventure field
function getSourceFromAdventure(monster) {
    // Check Adventures array first
    if (monster.Adventures && monster.Adventures.length > 0) {
        for (const adv of monster.Adventures) {
            if (SOURCE_MAP[adv]) {
                return SOURCE_MAP[adv];
            }
        }
    }

    // Check Adventure field (can be string or array)
    if (monster.Adventure) {
        const adventures = Array.isArray(monster.Adventure) ? monster.Adventure : [monster.Adventure];
        for (const adv of adventures) {
            if (SOURCE_MAP[adv]) {
                return SOURCE_MAP[adv];
            }
        }
    }

    // Default to 2024 Monster Manual
    return 'xmm';
}

// Count monsters missing links
let missingCount = 0;
let fixedCount = 0;
const missingMonsters = [];

for (const monster of monsters) {
    if (!monster.Statblock_Link || monster.Statblock_Link === '') {
        missingCount++;
        missingMonsters.push(monster.Name);

        // Generate URL
        const source = getSourceFromAdventure(monster);
        monster.Statblock_Link = generate5etoolsUrl(monster.Name, source);
        fixedCount++;
    }
}

console.log(`\n=== Statblock Link Analysis ===`);
console.log(`Total monsters: ${monsters.length}`);
console.log(`Missing links found: ${missingCount}`);
console.log(`Links generated: ${fixedCount}`);

if (missingMonsters.length > 0 && missingMonsters.length <= 50) {
    console.log(`\nMonsters that were missing links:`);
    missingMonsters.forEach(name => console.log(`  - ${name}`));
} else if (missingMonsters.length > 50) {
    console.log(`\nFirst 50 monsters that were missing links:`);
    missingMonsters.slice(0, 50).forEach(name => console.log(`  - ${name}`));
    console.log(`  ... and ${missingMonsters.length - 50} more`);
}

// Save updated data
fs.writeFileSync(ENRICHED_PATH, JSON.stringify(monsters, null, 2));
console.log(`\nUpdated ${ENRICHED_PATH}`);
