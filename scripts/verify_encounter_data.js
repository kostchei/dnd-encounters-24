const fs = require('fs');
const path = require('path');

const REGION_FILE = path.join(__dirname, '../src/data/region_monsters.json');

function verifyData() {
    console.log(`Verifying ${REGION_FILE}...`);

    if (!fs.existsSync(REGION_FILE)) {
        console.error("FAILED: File not found.");
        process.exit(1);
    }

    let data;
    try {
        data = JSON.parse(fs.readFileSync(REGION_FILE, 'utf8'));
    } catch (e) {
        console.error("FAILED: Invalid JSON.", e.message);
        process.exit(1);
    }

    const expectedRegions = ['calimshan', 'cities', 'dungeon', 'heartlands', 'icewind', 'moonshae'];
    const foundRegions = Object.keys(data);

    console.log(`Found regions: ${foundRegions.join(', ')}`);

    const missingRegions = expectedRegions.filter(r => !foundRegions.includes(r));
    if (missingRegions.length > 0) {
        console.error(`FAILED: Missing regions: ${missingRegions.join(', ')}`);
        process.exit(1);
    }

    let totalMonsters = 0;
    let errors = 0;

    for (const region of foundRegions) {
        const crKeys = Object.keys(data[region]);
        console.log(`Region '${region}' has ${crKeys.length} CR levels.`);

        if (crKeys.length === 0 && region !== 'cities') {
            // Cities might be empty if no csv data, but let's warn
            console.warn(`WARNING: Region '${region}' is empty.`);
        }

        for (const cr of crKeys) {
            const list = data[region][cr];
            if (!Array.isArray(list)) {
                console.error(`FAILED: ${region} CR ${cr} is not an array.`);
                errors++;
                continue;
            }
            if (list.length === 0) {
                console.warn(`WARNING: ${region} CR ${cr} has empty monster list.`);
            }
            totalMonsters += list.length;
            list.forEach(m => {
                if (typeof m !== 'string' || !m) {
                    console.error(`FAILED: Invalid monster entry in ${region} CR ${cr}: ${m}`);
                    errors++;
                }
            });
        }
    }

    console.log(`Total monsters mapped: ${totalMonsters}`);

    if (errors === 0) {
        console.log("SUCCESS: Data structure is valid.");
    } else {
        console.error(`FAILED: Found ${errors} errors.`);
        process.exit(1);
    }
}

verifyData();
