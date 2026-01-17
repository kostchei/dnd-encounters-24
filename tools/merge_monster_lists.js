const fs = require('fs');
const path = require('path');

const MAIN_LIST_PATH = path.join(__dirname, '../src/data/enriched_monster_list.json');
const PHANDELVER_PATH = path.join(__dirname, '../data/phandelver_encounters.json');
const ICEWIND_PATH = path.join(__dirname, '../data/icewind_dale_encounters.json');
const ICESPIRE_PATH = path.join(__dirname, '../data/icespirepeak_encounters.json');
const WATERDEEP_PATH = path.join(__dirname, '../data/waterdeep_encounters.json');
const BALDURS_PATH = path.join(__dirname, '../data/baldurs_gate_encounters.json');
const ABYSS_PATH = path.join(__dirname, '../data/out_of_the_abyss_encounters.json');

function mergeMonsters() {
    console.log('Reading main list...');
    let mainList = [];
    try {
        mainList = JSON.parse(fs.readFileSync(MAIN_LIST_PATH, 'utf-8'));
    } catch (e) {
        console.error('Error reading main list:', e.message);
        return;
    }

    const filesToMerge = [PHANDELVER_PATH, ICEWIND_PATH, ICESPIRE_PATH, WATERDEEP_PATH, BALDURS_PATH, ABYSS_PATH];
    let addedCount = 0;
    let updatedCount = 0;

    filesToMerge.forEach(filePath => {
        if (!fs.existsSync(filePath)) {
            console.warn(`Skipping missing file: ${filePath}`);
            return;
        }
        console.log(`Merging ${path.basename(filePath)}...`);
        const newMonsters = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        newMonsters.forEach(newM => {
            const existingIndex = mainList.findIndex(m => m.Name === newM.Name);

            if (existingIndex === -1) {
                // Add new monster
                mainList.push(newM);
                addedCount++;
            } else {
                // Update existing monster regions
                const existing = mainList[existingIndex];
                let changed = false;

                if (newM.Region && Array.isArray(newM.Region)) {
                    newM.Region.forEach(r => {
                        if (!existing.Region.includes(r)) {
                            existing.Region.push(r);
                            changed = true;
                        }
                    });
                }

                // Merge Adventures
                if (!existing.Adventures) existing.Adventures = [];
                if (newM.Adventures && Array.isArray(newM.Adventures)) {
                    newM.Adventures.forEach(adv => {
                        if (!existing.Adventures.includes(adv)) {
                            existing.Adventures.push(adv);
                            changed = true;
                        }
                    });
                }

                // Update stats if "Unknown" in existing but known in new
                // (Only update basic stats, trust existing for specific modifications if any)
                if (existing.CR === "Unknown" && newM.CR !== "Unknown") {
                    // Copy better stats
                    existing.CR = newM.CR;
                    existing.Type = newM.Type;
                    existing.Stats = newM.Stats; // hypothetical fields
                    // Maybe blindly copy enriched fields if new one looks enriched
                    if (newM.PassivePerception) existing.PassivePerception = newM.PassivePerception;
                    changed = true;
                }

                if (changed) updatedCount++;
            }
        });
    });

    console.log(`Merge complete.`);
    console.log(`Added: ${addedCount}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Total monsters: ${mainList.length}`);

    // Sort by Name
    mainList.sort((a, b) => a.Name.localeCompare(b.Name));

    fs.writeFileSync(MAIN_LIST_PATH, JSON.stringify(mainList, null, 2));
    console.log(`Saved to ${MAIN_LIST_PATH}`);
}

mergeMonsters();
