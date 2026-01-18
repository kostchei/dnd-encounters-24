/**
 * One-time cleanup script to normalize adventure field names.
 * Merges 'Adventure' (singular) into 'Adventures' (plural) and removes the singular field.
 */

const fs = require('fs');
const path = require('path');

const ENRICHED_FILE = path.join(__dirname, '../src/data/enriched_monster_list.json');

const monsters = JSON.parse(fs.readFileSync(ENRICHED_FILE, 'utf-8'));

let mergedCount = 0;
let removedCount = 0;

monsters.forEach(m => {
    // Ensure Adventures array exists
    if (!m.Adventures) {
        m.Adventures = [];
    }

    // Merge Adventure (singular) into Adventures (plural)
    if (m.Adventure) {
        const advList = Array.isArray(m.Adventure) ? m.Adventure : [m.Adventure];
        advList.forEach(adv => {
            if (adv && adv !== '' && !m.Adventures.includes(adv)) {
                m.Adventures.push(adv);
                mergedCount++;
            }
        });
        // Remove the singular field
        delete m.Adventure;
        removedCount++;
    }
});

// Sort and save
monsters.sort((a, b) => a.Name.localeCompare(b.Name));
fs.writeFileSync(ENRICHED_FILE, JSON.stringify(monsters, null, 2));

console.log(`Done. Merged ${mergedCount} adventure entries.`);
console.log(`Removed 'Adventure' field from ${removedCount} monsters.`);
console.log(`All monsters now use 'Adventures' (plural) array.`);
