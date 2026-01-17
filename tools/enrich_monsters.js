const fs = require('fs');
const path = require('path');

const ENCOUNTER_DATA_DIR = path.join(__dirname, '../data');
const BESTIARY_DATA_DIR = path.join(__dirname, '../5etools-v2.23.0/data/bestiary');
const ENRICHED_FILE = path.join(__dirname, '../src/data/enriched_monster_list.json');

// Helper to clean monster names
function cleanName(name) {
    return name.trim();
}

// Helper to parse CR
function parseCr(cr) {
    if (!cr && cr !== 0) return "Unknown";
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
    if (monster.skill && monster.skill.perception) {
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
    let val = 0;
    if (typeof cr === 'string' && cr.includes('/')) {
        const [n, d] = cr.split('/');
        val = parseInt(n) / parseInt(d);
    } else if (typeof cr === 'object' && cr.cr) {
        val = parseFloat(cr.cr);
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

// Manual mappings for known typos/mismatches
const MANUAL_MAPPING = {
    "beserker commander": "Berserker Commander",
    "cheiftan": "Reghed Chieftain",
    "cultist heirophant": "Cultist Hierophant",
    "sahaugin baron": "Sahuagin Baron",
    "merf": "Merfolk",
    "salamander fire snake": "Fire Snake",
    "animated rug of smothering": "Rug of Smothering",
};

function createEnrichedEntry(name, data, adventures, regions) {
    // Check if name has typo mapping
    let displayName = name;
    // Note: if data is found, data.name is correct.

    if (data) {
        return {
            Name: data.name,
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
            Adventure: adventures,
            Region: regions
        };
    } else {
        return {
            Name: displayName,
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
            Adventure: adventures,
            Region: regions
        };
    }
}

async function main() {
    console.log("Starting Enrichment Update Process...");

    // 1. Load Existing Enriched List
    let existingList = [];
    if (fs.existsSync(ENRICHED_FILE)) {
        try {
            existingList = JSON.parse(fs.readFileSync(ENRICHED_FILE, 'utf-8'));
            console.log(`Loaded ${existingList.length} existing monsters.`);
        } catch (e) {
            console.error(`Error parsing existing file: ${e.message}`);
            return;
        }
    } else {
        console.warn("No existing enriched monster list found! Creating new one.");
    }

    const existingMap = new Map();
    existingList.forEach(m => existingMap.set(m.Name.toLowerCase(), m));

    // 2. Parse sub_book_encounters.md
    const subBookPath = path.join(ENCOUNTER_DATA_DIR, 'Adventures/sub_book_encounters.md');
    const monsterAdventureMap = new Map(); // Name -> Set<AdventureName>
    const monsterRegionMap = new Map(); // Name -> Set<Region>

    // Also track monsters found so we can add new ones
    const foundMonsters = new Set();

    if (fs.existsSync(subBookPath)) {
        console.log(`Parsing sub-book encounters from ${subBookPath}...`);
        const content = fs.readFileSync(subBookPath, 'utf-8');
        const lines = content.split(/\r?\n/);

        let currentAdventure = "";
        let currentRegions = [];

        lines.forEach(line => {
            const trimmed = line.trim();
            // Adventure Header
            const advMatch = trimmed.match(/^###\s+(.*)$/);
            if (advMatch) {
                currentAdventure = advMatch[1].trim();
                return;
            }
            // Region Metadata
            const regMatch = trimmed.match(/^\*\*Region:\*\*\s+(.*)$/);
            if (regMatch) {
                currentRegions = regMatch[1].split(',').map(r => r.trim());
                return;
            }
            // Book Header
            if (trimmed.startsWith('## ')) {
                currentAdventure = "";
                currentRegions = [];
                return;
            }
            // Monster List Item
            const monMatch = trimmed.match(/^-\s+\[(?:x| )\]\s+(.*)$/);
            if (monMatch && currentAdventure) {
                let monsterName = cleanName(monMatch[1]);
                if (!monsterName) return;

                foundMonsters.add(monsterName);

                // Adventure Map
                if (!monsterAdventureMap.has(monsterName)) monsterAdventureMap.set(monsterName, new Set());
                monsterAdventureMap.get(monsterName).add(currentAdventure);

                // Region Map
                if (currentRegions.length > 0) {
                    if (!monsterRegionMap.has(monsterName)) monsterRegionMap.set(monsterName, new Set());
                    currentRegions.forEach(r => monsterRegionMap.get(monsterName).add(r));
                }
            }
        });
        console.log(`Parsed sub-books. Unique monsters found: ${foundMonsters.size}`);
    } else {
        console.warn("sub_book_encounters.md not found!");
    }

    // 3. Load Bestiary Data (needed for new monsters)
    const bestiaryFiles = fs.readdirSync(BESTIARY_DATA_DIR)
        .filter(f => f.startsWith('bestiary-') && f.endsWith('.json'))
        .map(f => path.join(BESTIARY_DATA_DIR, f));

    const bestiaryMap = new Map();
    for (const file of bestiaryFiles) {
        try {
            const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
            if (data.monster) {
                for (const m of data.monster) {
                    bestiaryMap.set(m.name.toLowerCase(), m);
                }
            }
        } catch (e) { console.error(e.message); }
    }
    console.log(`Loaded ${bestiaryMap.size} monsters from 5etools.`);

    // 4. Update Loop
    let updatedCount = 0;
    let newCount = 0;

    // A. Update Existing Monsters with new Adventures/Regions
    // But we iterate foundMonsters to ensure we cover everything
    for (const name of foundMonsters) {
        let lookupName = name.toLowerCase();
        if (MANUAL_MAPPING[lookupName]) lookupName = MANUAL_MAPPING[lookupName].toLowerCase();

        // Find existing entry
        let existing = existingMap.get(lookupName);

        // Find data (for new entries or verifying name)
        let data = bestiaryMap.get(lookupName);
        if (!data && lookupName.endsWith('s')) data = bestiaryMap.get(lookupName.slice(0, -1));

        const newAdventures = monsterAdventureMap.get(name) || new Set();
        const newRegions = monsterRegionMap.get(name) || new Set();

        if (existing) {
            // Update Existing
            let changed = false;

            // Merge Adventures
            // existing.Adventure might be string or array
            let currentAdvs = [];
            if (Array.isArray(existing.Adventure)) currentAdvs = existing.Adventure;
            else if (existing.Adventure) currentAdvs = [existing.Adventure];

            const startingAdvCount = currentAdvs.length;
            newAdventures.forEach(adv => {
                if (!currentAdvs.includes(adv)) currentAdvs.push(adv);
            });
            if (currentAdvs.length !== startingAdvCount) {
                existing.Adventure = currentAdvs;
                changed = true;
            }

            // Merge Regions
            let currentRegs = [];
            if (Array.isArray(existing.Region)) currentRegs = existing.Region;
            else if (existing.Region) currentRegs = [existing.Region];

            const startingRegCount = currentRegs.length;
            newRegions.forEach(reg => {
                // simple dedupe
                if (!currentRegs.some(r => r.toLowerCase() === reg.toLowerCase())) {
                    currentRegs.push(reg);
                }
            });
            if (currentRegs.length !== startingRegCount) {
                existing.Region = currentRegs;
                changed = true;
            }

            if (changed) updatedCount++;
        } else {
            // Create NEW Entry
            const newEntry = createEnrichedEntry(name, data, Array.from(newAdventures), Array.from(newRegions));
            existingList.push(newEntry);
            existingMap.set(newEntry.Name.toLowerCase(), newEntry); // update map just in case duplicate foundMonsters entries
            newCount++;
        }
    }

    // Sort by Name
    existingList.sort((a, b) => a.Name.localeCompare(b.Name));

    fs.writeFileSync(ENRICHED_FILE, JSON.stringify(existingList, null, 2));
    console.log(`Updated Enriched List. ${updatedCount} updated, ${newCount} new. Total: ${existingList.length}`);
}

main();
