const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const ENRICHED_FILE = path.join(DATA_DIR, 'enriched_monster_list.json');
const OUT_FILE = path.join(__dirname, 'src/data/region_monsters.json');

const FILE_TO_REGION_MAP = {
    'Encounter spreadsheet - Calimshan.csv': 'calimshan',
    'Encounter spreadsheet - Cities.csv': 'cities',
    'Encounter spreadsheet - Dungeons.csv': 'dungeon',
    'Encounter spreadsheet - Heartlands.csv': 'heartlands',
    'Encounter spreadsheet - IceWind Dale.csv': 'icewind',
    'Encounter spreadsheet - Moonshae.csv': 'moonshae'
};

function main() {
    console.log('Starting Region Monsters Update (from enriched_monster_list.json)...');

    if (!fs.existsSync(ENRICHED_FILE)) {
        console.error(`Error: Could not find ${ENRICHED_FILE}`);
        process.exit(1);
    }

    let enrichedData = [];
    try {
        enrichedData = JSON.parse(fs.readFileSync(ENRICHED_FILE, 'utf8'));
    } catch (e) {
        console.error(`Error parsing ${ENRICHED_FILE}: ${e.message}`);
        process.exit(1);
    }

    const fullData = {};

    // Initialize regions
    Object.values(FILE_TO_REGION_MAP).forEach(region => {
        fullData[region] = {};
    });

    let count = 0;

    enrichedData.forEach(monster => {
        if (!monster.FoundIn || !Array.isArray(monster.FoundIn)) return;

        const name = monster.Name;
        const cr = String(monster.CR || "Unknown");

        // Some CRs might be "Unknown", we probably want to skip those or handle them?
        // The original script skipped rows without CR.
        if (cr === "Unknown") return;

        monster.FoundIn.forEach(filename => {
            const regionKey = FILE_TO_REGION_MAP[filename];
            if (regionKey) {
                if (!fullData[regionKey][cr]) {
                    fullData[regionKey][cr] = [];
                }
                // Avoid duplicates if a monster is listed purely twice for some reason, 
                // though the set in enrich_monsters should have handled it. 
                // However, detailed logic: checking inclusion is safer.
                if (!fullData[regionKey][cr].includes(name)) {
                    fullData[regionKey][cr].push(name);
                    count++;
                }
            }
        });
    });

    // Sort the arrays for consistency
    for (const region in fullData) {
        for (const cr in fullData[region]) {
            fullData[region][cr].sort();
        }
    }

    fs.writeFileSync(OUT_FILE, JSON.stringify(fullData, null, 4));
    console.log(`Successfully updated ${OUT_FILE}`);
    console.log(`Mapped ${count} monster entries to regions.`);
}

main();
