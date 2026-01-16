const fs = require('fs');
const path = require('path');

const enrichedFile = 'D:\\Code\\dnd-encounters-24\\src\\data\\enriched_monster_list.json';
const regionFile = 'D:\\Code\\dnd-encounters-24\\src\\data\\region_monsters.json';

function verify() {
    console.log("Loading data files...");
    let enrichedList = [];
    let regionMonsters = {};

    try {
        enrichedList = JSON.parse(fs.readFileSync(enrichedFile, 'utf8'));
        regionMonsters = JSON.parse(fs.readFileSync(regionFile, 'utf8'));
    } catch (e) {
        console.error("Error loading files:", e.message);
        return;
    }

    const availableMonsters = new Set(enrichedList.map(m => m.Name));
    const errors = [];
    const missing = new Set();

    Object.entries(regionMonsters).forEach(([region, crList]) => {
        Object.entries(crList).forEach(([cr, monsters]) => {
            monsters.forEach(monster => {
                if (!availableMonsters.has(monster)) {
                    errors.push(`Missing: ${monster} (Region: ${region}, CR: ${cr})`);
                    missing.add(monster);
                }
            });
        });
    });

    if (errors.length > 0) {
        console.log("Verification FAILED. Found missing monsters:");
        errors.forEach(e => console.log(e));
        console.log("\nUnique missing monsters:");
        missing.forEach(m => console.log(m));
    } else {
        console.log("Verification PASSED. All region monsters are present in the enriched list.");
    }
}

verify();
