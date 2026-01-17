const fs = require('fs');
const path = require('path');

const SOURCE_FILE = path.join(__dirname, '../data/Adventures/baldurs_gate_descent_into_avernus.md');
const BESTIARY_DIR = path.join(__dirname, '../5etools-v2.23.0/data/bestiary');
const OUTPUT_FILE = path.join(__dirname, '../data/baldurs_gate_encounters.json');

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

// Helpers for stats
function getModifier(score) {
    return Math.floor((score - 10) / 2);
}

function getPassivePerception(monster) {
    let passive = 10 + getModifier(monster.wis || 10);
    if (monster.passive) return monster.passive;
    if (monster.skill && monster.skill.perception) {
        return 10 + parseInt(monster.skill.perception);
    }
    return passive;
}

function getStealth(monster) {
    if (monster.skill && monster.skill.stealth) {
        return parseInt(monster.skill.stealth);
    }
    return getModifier(monster.dex || 10);
}

function getPb(cr) {
    if (!cr || cr === "Unknown") return 2;
    let val = 0;
    if (typeof cr === 'string' && cr.includes('/')) {
        const [n, d] = cr.split('/');
        val = parseInt(n) / parseInt(d);
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

function getInitiativeBonus(monster) {
    let dexMod = getModifier(monster.dex || 10);
    let bonus = 0;
    if (monster.initiative) {
        if (monster.initiative.bonus) bonus += monster.initiative.bonus;
        if (monster.initiative.proficiency) bonus += getPb(monster.cr);
    }
    return dexMod + bonus;
}

function getSavingThrows(monster) {
    if (!monster.save) return "";
    return Object.entries(monster.save)
        .map(([stat, val]) => `${stat.charAt(0).toUpperCase() + stat.slice(1)} ${val}`)
        .join(', ');
}

function getSkillBonus(monster, skillName, statStat) {
    if (monster.skill && monster.skill[skillName]) {
        return parseInt(monster.skill[skillName]);
    }
    return getModifier(monster[statStat] || 10);
}

async function main() {
    console.log('Reading source file...');
    const rawContent = fs.readFileSync(SOURCE_FILE, 'utf-8');
    const lines = rawContent.split(/\r?\n/);

    const parsedMonsters = [];
    let currentBlock = null;

    const crRegex = /^\s*(\d+|\d+\/\d+)\s*$/;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (crRegex.test(line)) {
            // Found a CR line. Starts a new monster.
            currentBlock = { cr: line };
            parsedMonsters.push(currentBlock);
            currentBlock.expectingName = true;
        } else {
            // Text line.
            if (currentBlock && currentBlock.expectingName) {
                currentBlock.name = line;
                currentBlock.expectingName = false;
            } else if (!currentBlock) {
                // We have text but no CR yet.
                currentBlock = { cr: "0", name: line, expectingName: false };
                parsedMonsters.push(currentBlock);
            } else {
                // Just metadata lines
            }
        }
    }

    console.log(`Parsed ${parsedMonsters.length} entries from text file.`);

    // Load Bestiary
    console.log('Loading Bestiary...');
    let bestiaryMap = new Map();
    const bestiaryFiles = fs.readdirSync(BESTIARY_DIR).filter(f => f.startsWith('bestiary-') && f.endsWith('.json'));

    for (const file of bestiaryFiles) {
        const data = JSON.parse(fs.readFileSync(path.join(BESTIARY_DIR, file), 'utf-8'));
        if (data.monster) {
            for (const m of data.monster) {
                bestiaryMap.set(m.name.toLowerCase(), m);
            }
        }
    }
    console.log(`Loaded ${bestiaryMap.size} monsters from 5etools.`);

    const outputList = [];
    const missing = [];

    for (const entry of parsedMonsters) {
        if (!entry.name) continue;

        let name = entry.name;

        let bestiaryData = bestiaryMap.get(name.toLowerCase());

        // Manual mapping if needed 
        if (!bestiaryData && name.toLowerCase().endsWith('s')) {
            bestiaryData = bestiaryMap.get(name.toLowerCase().slice(0, -1));
        }

        if (bestiaryData) {
            let finalCr = parseCr(bestiaryData.cr);
            if (finalCr === "Unknown" && entry.cr) {
                finalCr = entry.cr;
            }

            outputList.push({
                Name: bestiaryData.name,
                CR: finalCr,
                Type: parseType(bestiaryData.type),
                Alignment: parseAlignment(bestiaryData.alignment),
                PassivePerception: getPassivePerception(bestiaryData),
                PerceptionBonus: getSkillBonus(bestiaryData, "perception", "wis"),
                StealthBonus: getSkillBonus(bestiaryData, "stealth", "dex"),
                InitiativeBonus: getInitiativeBonus(bestiaryData),
                SavingThrows: getSavingThrows(bestiaryData),
                Intelligence: bestiaryData.int || 10,
                Wisdom: bestiaryData.wis || 10,
                Charisma: bestiaryData.cha || 10,
                Statblock_Link: `https://5e.tools/bestiary.html#${encodeURIComponent(bestiaryData.name).toLowerCase()}_${bestiaryData.source.toLowerCase()}`,
                Faction: "",
                Tags: [],
                Region: ["Cities"],
                Adventures: ["Baldur's Gate: Descent into Avernus"]
            });
        } else {
            console.warn(`Missing stats for: ${name}`);
            missing.push(name);
            // Fallback object
            outputList.push({
                Name: name,
                CR: entry.cr,
                Type: "Unknown",
                Alignment: "Unknown",
                PassivePerception: 10,
                PerceptionBonus: 0,
                StealthBonus: 0,
                InitiativeBonus: 0,
                SavingThrows: "",
                Intelligence: 10,
                Wisdom: 10,
                Charisma: 10,
                Tags: [],
                Region: ["Cities"],
                Adventures: ["Baldur's Gate: Descent into Avernus"],
                Statblock_Link: ""
            });
        }
    }

    console.log(`Generated ${outputList.length} monsters.`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputList, null, 2));
    console.log(`Saved to ${OUTPUT_FILE}`);
}

main();
