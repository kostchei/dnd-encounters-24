const fs = require('fs');
const path = require('path');
const glob = require('glob');

const ENCOUNTER_DATA_DIR = path.join(__dirname, '../data');
const BESTIARY_DATA_DIR = path.join(__dirname, '../5etools-v2.23.0/data/bestiary');
const OUTPUT_FILE = path.join(ENCOUNTER_DATA_DIR, 'enriched_monster_list.json');

// Helper to clean monster names
function cleanName(name) {
    return name.trim();
}

// Helper to parse CR
function parseCr(cr) {
    if (!cr) return "Unknown";
    if (typeof cr === 'string') return cr;
    if (typeof cr === 'object' && cr.cr) return cr.cr;
    return "Unknown";
}

// Helper to parse Type
function parseType(type) {
    if (!type) return "Unknown";
    if (typeof type === 'string') return type;
    if (typeof type === 'object' && type.type) {
        let t = type.type;
        if (type.tags) {
            t += ` (${type.tags.join(', ')})`;
        }
        return t;
    }
    return "Unknown";
}

// Helper to parse Alignment
function parseAlignment(alignment) {
    if (!alignment) return "Unknown";
    if (Array.isArray(alignment)) {
        return alignment.map(a => {
            if (typeof a === 'string') return a;
            if (typeof a === 'object') {
                if (a.alignment) return a.alignment.join('');
                if (a.special) return a.special;
            }
            return "";
        }).join(' ');
    }
    return String(alignment);
}

// Helper to get modifier from score
function getModifier(score) {
    return Math.floor((score - 10) / 2);
}

// Helper to get Passive Perception
function getPassivePerception(monster) {
    let passive = 10 + getModifier(monster.wis || 10);
    if (monster.passive) return monster.passive;

    // Check skills
    if (monster.skill && monster.skill.perception) {
        // parsing string like "+5" or number
        return 10 + parseInt(monster.skill.perception);
    }
    return passive;
}

// Helper to get Stealth
function getStealth(monster) {
    if (monster.skill && monster.skill.stealth) {
        return parseInt(monster.skill.stealth);
    }
    return getModifier(monster.dex || 10);
}
// Helper to get Proficiency Bonus from CR
function getPb(cr) {
    if (!cr || cr === "Unknown") return 2;
    // parse fraction or number
    let val = 0;
    if (typeof cr === 'string' && cr.includes('/')) {
        const [n, d] = cr.split('/');
        val = parseInt(n) / parseInt(d);
    } else if (typeof cr === 'object' && cr.cr) {
        val = parseFloat(cr.cr); // handle object case roughly
    } else {
        val = parseFloat(cr);
    }

    if (val < 5) return 2;
    if (val < 9) return 3;
    if (val < 13) return 4;
    if (val < 17) return 5;
    if (val < 21) return 6;
    if (val < 25) return 7;
    if (val < 29) return 8;
    return 9;
}

// Helper to get Initiative Bonus
function getInitiativeBonus(monster) {
    let dexMod = getModifier(monster.dex || 10);
    let bonus = 0;

    if (monster.initiative) {
        if (monster.initiative.bonus) bonus += monster.initiative.bonus;
        if (monster.initiative.proficiency) {
            bonus += getPb(monster.cr);
        }
    }

    return dexMod + bonus;
}

// Helper to get Saving Throws string
function getSavingThrows(monster) {
    if (!monster.save) return "";
    return Object.entries(monster.save)
        .map(([stat, val]) => `${stat.charAt(0).toUpperCase() + stat.slice(1)} ${val}`)
        .join(', ');
}

// Helper to get specific Skill Bonus
function getSkillBonus(monster, skillName, statStat) {
    if (monster.skill && monster.skill[skillName]) {
        return parseInt(monster.skill[skillName]);
    }
    return getModifier(monster[statStat] || 10);
}

async function main() {
    console.log("Starting Enrichment Process...");

    // 1. Scan CSVs
    // Use readdirSync instead of glob to avoid path issues on Windows
    let allFiles = [];
    try {
        allFiles = fs.readdirSync(ENCOUNTER_DATA_DIR);
    } catch (err) {
        console.error(`Failed to read directory ${ENCOUNTER_DATA_DIR}: ${err.message}`);
        return;
    }

    const encounterFiles = allFiles
        .filter(f => f.startsWith('Encounter spreadsheet - ') && f.endsWith('.csv'))
        .map(f => path.join(ENCOUNTER_DATA_DIR, f));

    console.log(`Found ${encounterFiles.length} encounter spreadsheets in ${ENCOUNTER_DATA_DIR}`);

    const foundMonsters = new Set();
    const monsterSourceMap = new Map(); // Name -> Array of Source Files

    for (const file of encounterFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split(/\r?\n/);

        // Find header
        let headerIndex = -1;
        let monsterColIndex = -1;

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes('monsters')) {
                headerIndex = i;
                const headers = lines[i].split(',').map(h => h.trim().toLowerCase());
                monsterColIndex = headers.findIndex(h => h.includes('monsters'));
                if (monsterColIndex === -1 && lines[i].includes('Monsters')) {
                    // Fallback simpler parsing if header is just CR,Monsters
                    monsterColIndex = 1;
                }
                break;
            }
        }

        if (monsterColIndex === -1) {
            console.warn(`Could not find 'Monsters' header in ${path.basename(file)}, assuming implicit structure (CR, Monster...).`);
            headerIndex = -1; // Start from line 0
            monsterColIndex = 1; // Assume monsters start at col 1
        }

        // Manual string fixes for CSV errors
        const CSV_FIXES = [
            { search: 'Merrow Awakened Tree', replace: 'Merrow, Awakened Tree' },
            { search: 'Merfolk Wavebender Hobgoblin Warlord', replace: 'Merfolk Wavebender, Hobgoblin Warlord' },
            { search: 'Ogrillon Ogre', replace: 'Ogrillon, Ogre' },
            { search: 'Goristo', replace: 'Goristro' },
            { search: 'Night Walker', replace: 'Nightwalker' },
            { search: 'Sahaugain Warrior', replace: 'Sahuagin Warrior' },
            { search: 'Sahaugin Baron', replace: 'Sahuagin Baron' },
            { search: 'beserker commander', replace: 'Berserker Commander' },
            { search: 'Cheiftan', replace: 'Reghed Chieftain' },
            { search: 'Cultist Heirophant', replace: 'Cultist Hierophant' },
            { search: 'Baleen Whale', replace: 'Killer Whale' },
            { search: 'Sperm Whale', replace: 'Killer Whale' },
            { search: 'mountain goat', replace: 'Goat' },
            { search: 'yeti tyke', replace: 'Yeti Tyke' },
            { search: 'wolf', replace: 'Wolf' },
            { search: 'zombie', replace: 'Zombie' }
        ];

        for (let i = headerIndex + 1; i < lines.length; i++) {
            let line = lines[i].trim();
            if (!line) continue;

            // Apply fixes
            CSV_FIXES.forEach(fix => {
                line = line.split(fix.search).join(fix.replace);
            });

            const cols = line.split(',');
            // Skip CR column (index 0)
            for (let j = 1; j < cols.length; j++) {
                const beast = cleanName(cols[j]);
                if (beast) {
                    foundMonsters.add(beast);

                    const filename = path.basename(file);
                    if (!monsterSourceMap.has(beast)) {
                        monsterSourceMap.set(beast, new Set());
                    }
                    monsterSourceMap.get(beast).add(filename);
                }
            }
        }
    }
    console.log(`identified ${foundMonsters.size} unique monsters associated with tables.`);

    // 2. Load Bestiary Data
    let allBestiaryFiles = [];
    try {
        allBestiaryFiles = fs.readdirSync(BESTIARY_DATA_DIR);
    } catch (err) {
        console.error(`Failed to read bestiary directory ${BESTIARY_DATA_DIR}: ${err.message}`);
    }

    const bestiaryFiles = allBestiaryFiles
        .filter(f => f.startsWith('bestiary-') && f.endsWith('.json'))
        .map(f => path.join(BESTIARY_DATA_DIR, f));

    console.log(`Found ${bestiaryFiles.length} bestiary files in ${BESTIARY_DATA_DIR}`);

    const bestiaryMap = new Map();

    for (const file of bestiaryFiles) {
        try {
            const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
            if (data.monster) {
                for (const m of data.monster) {
                    // normalize name for key
                    bestiaryMap.set(m.name.toLowerCase(), m);
                }
            }
        } catch (e) {
            console.error(`Error reading ${file}: ${e.message}`);
        }
    }
    console.log(`Loaded ${bestiaryMap.size} monsters from 5etools.`);

    // Manual mappings for known typos/mismatches
    const MANUAL_MAPPING = {
        "beserker commander": "Berserker Commander",
        "cheiftan": "Reghed Chieftain",
        "cultist heirophant": "Cultist Hierophant",
        "sahaugin baron": "Sahuagin Baron",
        "merf": "Merfolk",
        "salamander fire snake": "Fire Snake"
    };

    // 3. Enrich Data
    const enrichedList = [];
    const missing = [];

    for (const name of foundMonsters) {
        let lookupName = name.toLowerCase();

        // Apply manual mapping if exists
        if (MANUAL_MAPPING[lookupName]) {
            lookupName = MANUAL_MAPPING[lookupName].toLowerCase();
        }

        // Try exact match first
        let data = bestiaryMap.get(lookupName);

        // Try removing "Ancient" "Adult" "Young" prefixes if not found? 
        // No, we want specific stats. 
        // Try singular? 
        if (!data && lookupName.endsWith('s')) {
            data = bestiaryMap.get(lookupName.slice(0, -1));
        }

        if (data) {
            enrichedList.push({
                Name: data.name, // Use canonical name
                CR: parseCr(data.cr),
                Type: parseType(data.type),
                Alignment: parseAlignment(data.alignment),
                PassivePerception: getPassivePerception(data),
                PerceptionBonus: getSkillBonus(data, "perception", "wis"),
                StealthBonus: getSkillBonus(data, "stealth", "dex"),
                InitiativeBonus: getInitiativeBonus(data),
                SavingThrows: getSavingThrows(data),
                Intelligence: data.int || 10,
                Wisdom: data.wis || 10,
                Charisma: data.cha || 10,
                Statblock_Link: `https://5e.tools/bestiary.html#${encodeURIComponent(data.name).toLowerCase()}_${data.source.toLowerCase()}`,
                Faction: "",
                Adventure: "",
                FoundIn: Array.from(monsterSourceMap.get(name) || [])
            });
        } else {
            missing.push(name);
            enrichedList.push({
                Name: name,
                CR: "Unknown",
                Type: "Unknown",
                Alignment: "Unknown",
                PassivePerception: 0,
                PerceptionBonus: 0,
                StealthBonus: 0,
                InitiativeBonus: 0,
                SavingThrows: "",
                Intelligence: 10,
                Wisdom: 10,
                Charisma: 10,
                Statblock_Link: "",
                Faction: "",
                Adventure: "",
                FoundIn: Array.from(monsterSourceMap.get(name) || [])
            });
        }
    }

    console.log(`Enriched ${enrichedList.length - missing.length} monsters.`);
    console.log(`Missing ${missing.length} monsters:`);
    if (missing.length > 0) {
        console.log(JSON.stringify(missing, null, 2));
    }

    // Sort by Name
    enrichedList.sort((a, b) => a.Name.localeCompare(b.Name));

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(enrichedList, null, 2));
    console.log(`Wrote output to ${OUTPUT_FILE}`);
}

main();
