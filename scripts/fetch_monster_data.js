const fs = require('fs');
const path = require('path');
const https = require('https');

// Paths
const INPUT_FILE = path.join(__dirname, '../data/monsterlistby_cr_dnd2024.md');
const OUTPUT_JSON = path.join(__dirname, '../data/monster_dataset.json');
const OUTPUT_CSV = path.join(__dirname, '../data/monster_dataset.csv');

// Helper to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to fetch data with timeout
function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    if (res.statusCode !== 200) {
                        reject(new Error(`Status code ${res.statusCode}`));
                        return;
                    }
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (err) => reject(err));

        req.setTimeout(10000, () => { // 10s timeout
            req.destroy();
            reject(new Error("Timeout"));
        });
    });
}

// Logic for alignment
function processAlignment(alignment) {
    if (!alignment || alignment.toLowerCase().includes('any') || alignment.toLowerCase().includes('unaligned')) {
        // 75% Evil, 25% Neutral
        const roll = Math.random();
        return roll < 0.75 ? 'Evil' : 'Neutral';
    }
    return alignment;
}

// Name cleaning/matching logic
function cleanName(name) {
    let clean = name;
    const suffixes = [' Minion', ' Warrior', ' Skirmisher', ' Boss', ' Minion', ' Captain', ' Lord', ' Chief', ' Shaman', ' Veteran', ' Knight', ' Archer', ' Scout', ' Fanatic', ' Cultist', ' Soldier', ' Guard', ' Adult', ' Young', ' Ancient'];

    if (name.toLowerCase().includes('dragon')) {
        // Don't strip age from dragons
    } else {
        for (const suffix of suffixes) {
            if (clean.endsWith(suffix)) {
                clean = clean.substring(0, clean.length - suffix.length);
            }
        }
    }

    if (clean === "Modron Monodrone") return "Monodrone";
    if (clean === "Modron Duodrone") return "Duodrone";

    return clean;
}

// Helper for concurrency
async function mapConcurrent(items, mapFn, concurrency) {
    const results = [];
    let processed = 0;

    const chunks = [];
    for (let i = 0; i < items.length; i += concurrency) {
        chunks.push(items.slice(i, i + concurrency));
    }

    for (const chunk of chunks) {
        const chunkResults = await Promise.all(chunk.map(mapFn));
        results.push(...chunkResults);
        processed += chunk.length;
        console.log(`Processed ${processed}/${items.length} monsters...`);
    }
    return results;
}

// Main function
async function main() {
    console.log(`Reading monster list from ${INPUT_FILE}...`);

    if (!fs.existsSync(INPUT_FILE)) {
        console.error("Input file not found!");
        process.exit(1);
    }

    const fileContent = fs.readFileSync(INPUT_FILE, 'utf-8');
    const lines = fileContent.split('\n');
    const monsterNames = [];

    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('CR')) {
            monsterNames.push(trimmed);
        }
    });

    console.log(`Found ${monsterNames.length} monsters. Fetching data with concurrency 5...`);

    const processMonster = async (name) => {
        let entry = {
            Name: name,
            CR: "Unknown",
            Type: "Unknown",
            Alignment: "Unknown",
            Perception: 0,
            Stealth: 0,
            Intelligence: 10,
            Wisdom: 10,
            Charisma: 10,
            Statblock_Link: "",
            Faction: "",
            Adventure: ""
        };

        try {
            // First try exact name
            let searchName = name;
            let result = null;

            try {
                result = await fetchUrl(`https://api.open5e.com/monsters/?search=${encodeURIComponent(searchName)}`);
            } catch (err) {
                // Ignore
            }

            let monsterData = null;

            if (result && result.results && result.results.length > 0) {
                // Exact match check
                monsterData = result.results.find(m => m.name.toLowerCase() === searchName.toLowerCase());
                if (!monsterData) monsterData = result.results[0]; // Fallback
            }

            // If no data, try cleaned name
            if (!monsterData) {
                const cleaned = cleanName(name);
                if (cleaned !== name) {
                    try {
                        const resultClean = await fetchUrl(`https://api.open5e.com/monsters/?search=${encodeURIComponent(cleaned)}`);
                        if (resultClean.results && resultClean.results.length > 0) {
                            monsterData = resultClean.results.find(m => m.name.toLowerCase() === cleaned.toLowerCase());
                            if (!monsterData) monsterData = resultClean.results[0];
                        }
                    } catch (err) {
                        // Ignore
                    }
                }
            }

            if (monsterData) {
                entry = {
                    Name: name,
                    CR: monsterData.challenge_rating,
                    Type: monsterData.type,
                    Alignment: processAlignment(monsterData.alignment),
                    Perception: monsterData.skills && monsterData.skills.perception ? monsterData.skills.perception : 0,
                    Stealth: monsterData.skills && monsterData.skills.stealth ? monsterData.skills.stealth : 0,
                    Intelligence: monsterData.intelligence,
                    Wisdom: monsterData.wisdom,
                    Charisma: monsterData.charisma,
                    Statblock_Link: "",
                    Faction: "",
                    Adventure: ""
                };
            }

        } catch (error) {
            console.error(`Error processing ${name}:`, error.message);
        }

        return entry;
    };

    // Run with concurrency of 5
    const dataset = await mapConcurrent(monsterNames, processMonster, 5);

    const foundCount = dataset.filter(d => d.CR !== "Unknown").length;
    console.log(`Finished. Found data for ${foundCount} / ${dataset.length} monsters.`);
    console.log(`Missing: ${dataset.length - foundCount}`);

    // Log missing ones to a file for review
    const missing = dataset.filter(d => d.CR === "Unknown").map(d => d.Name);
    if (missing.length > 0) {
        fs.writeFileSync(path.join(__dirname, '../data/missing_monsters.txt'), missing.join('\n'));
        console.log(`List of missing monsters saved to data/missing_monsters.txt`);
    }

    // Save JSON
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(dataset, null, 2));
    console.log(`Saved JSON to ${OUTPUT_JSON}`);

    // Save CSV
    const headers = ["Name", "CR", "Type", "Alignment", "Perception", "Stealth", "Intelligence", "Wisdom", "Charisma", "Statblock_Link", "Faction", "Adventure"];
    const csvContent = [
        headers.join(','),
        ...dataset.map(row => headers.map(fieldName => {
            let val = row[fieldName];
            if (val === undefined || val === null) val = "";
            // Handle commas in strings
            if (typeof val === 'string' && val.includes(',')) {
                return `"${val}"`;
            }
            return val;
        }).join(','))
    ].join('\n');

    fs.writeFileSync(OUTPUT_CSV, csvContent);
    console.log(`Saved CSV to ${OUTPUT_CSV}`);
}

main();
