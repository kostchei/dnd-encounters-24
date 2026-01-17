/**
 * Parse Raw Encounter Markdown Files
 * 
 * Converts raw encounter markdown files (copied from D&D Beyond or similar sources)
 * into structured JSON format for use in the encounter generator.
 * 
 * Usage:
 *   node tools/parse_raw_encounters.js <input_file.md> <region1,region2,...> [output_file.json] [--exclude-npcs]
 * 
 * Examples:
 *   node tools/parse_raw_encounters.js data/raw_encounters_phandelver.md Heartlands,Dungeons
 *   node tools/parse_raw_encounters.js data/raw_curse_of_strahd.md Heartlands --exclude-npcs
 */

const fs = require('fs');
const path = require('path');

// Config
const BESTIARY_DATA_DIR = path.join(__dirname, '../5etools-v2.23.0/data/bestiary');

// Parse command line arguments
const args = process.argv.slice(2);
const excludeNpcs = args.includes('--exclude-npcs');
const filteredArgs = args.filter(a => !a.startsWith('--'));

if (filteredArgs.length < 2) {
    console.log('Usage: node tools/parse_raw_encounters.js <input_file.md> <region1,region2,...> [output_file.json] [--exclude-npcs]');
    console.log('');
    console.log('Options:');
    console.log('  --exclude-npcs    Remove named NPCs from output (adventure-specific characters)');
    console.log('');
    console.log('Example:');
    console.log('  node tools/parse_raw_encounters.js data/raw_encounters_phandelver.md Heartlands,Dungeons');
    console.log('  node tools/parse_raw_encounters.js data/raw_encounters_phandelver.md Heartlands,Dungeons --exclude-npcs');
    process.exit(1);
}

const inputFile = filteredArgs[0];
const regions = filteredArgs[1].split(',').map(r => r.trim());
const outputFile = filteredArgs[2] || inputFile.replace('.md', '.json');

// Read input file
let content;
try {
    content = fs.readFileSync(inputFile, 'utf-8');
} catch (err) {
    console.error(`Error reading file: ${inputFile}`);
    console.error(err.message);
    process.exit(1);
}

// Load all bestiary data
console.log('Loading 5etools bestiary data...');
const bestiaryMap = new Map();

// Priority order for sources - prefer core books over adventure-specific
const SOURCE_PRIORITY = ['XMM', 'MM', 'MPMM', 'VGM', 'MTF', 'FTD', 'BGG'];

function getSourcePriority(source) {
    const idx = SOURCE_PRIORITY.indexOf(source);
    return idx === -1 ? 100 : idx; // Unknown sources get low priority
}

let bestiaryFiles = [];
try {
    bestiaryFiles = fs.readdirSync(BESTIARY_DATA_DIR)
        .filter(f => f.startsWith('bestiary-') && f.endsWith('.json'))
        .map(f => path.join(BESTIARY_DATA_DIR, f));
} catch (err) {
    console.warn(`Warning: Could not read bestiary directory: ${err.message}`);
    console.warn('Proceeding without stat enrichment.');
}

for (const file of bestiaryFiles) {
    try {
        const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
        if (data.monster) {
            for (const m of data.monster) {
                const key = m.name.toLowerCase();
                const existing = bestiaryMap.get(key);

                // Only replace if no existing entry, or this source has higher priority
                if (!existing || getSourcePriority(m.source) < getSourcePriority(existing.source)) {
                    bestiaryMap.set(key, m);
                }
            }
        }
    } catch (e) {
        // Skip files that fail to parse
    }
}
console.log(`Loaded ${bestiaryMap.size} unique monsters from 5etools (prioritizing core sources).`);

// ============= STAT EXTRACTION HELPERS =============

function getModifier(score) {
    return Math.floor((score - 10) / 2);
}

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

function parseCr(cr) {
    if (!cr) return "Unknown";
    if (typeof cr === 'string') return cr;
    if (typeof cr === 'object' && cr.cr) return cr.cr;
    return "Unknown";
}

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

function getPassivePerception(monster) {
    if (monster.passive) return monster.passive;
    let passive = 10 + getModifier(monster.wis || 10);
    if (monster.skill && monster.skill.perception) {
        return 10 + parseInt(monster.skill.perception);
    }
    return passive;
}

function getSkillBonus(monster, skillName, stat) {
    if (monster.skill && monster.skill[skillName]) {
        return parseInt(monster.skill[skillName]);
    }
    return getModifier(monster[stat] || 10);
}

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

function getSavingThrows(monster) {
    if (!monster.save) return "";
    return Object.entries(monster.save)
        .map(([stat, val]) => `${stat.charAt(0).toUpperCase() + stat.slice(1)} ${val}`)
        .join(', ');
}

function parseSize(size) {
    if (!size) return "Medium";
    const sizeMap = { T: "Tiny", S: "Small", M: "Medium", L: "Large", H: "Huge", G: "Gargantuan" };
    if (Array.isArray(size)) return sizeMap[size[0]] || "Medium";
    return sizeMap[size] || "Medium";
}

// ============= PARSING HELPERS =============

function isCRValue(line) {
    return /^(0|1\/8|1\/4|1\/2|[1-9]|1[0-9]|2[0-9]|30)$/.test(line.trim());
}

function isSize(line) {
    const sizes = ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'];
    return sizes.includes(line.toLowerCase());
}

function isSourceBook(line) {
    const sourcePatterns = [
        /monster manual/i, /legacy/i, /phandelver/i, /curse of strahd/i,
        /tomb of annihilation/i, /waterdeep/i, /baldur's gate/i,
        /icewind dale/i, /strixhaven/i, /spelljammer/i, /dragonlance/i,
        /planescape/i, /quests from the infinite/i, /tales from/i,
        /volo's guide/i, /mordenkainen/i, /xanathar/i, /fizban/i,
        /explorer's guide/i, /eberron/i, /ravnica/i, /theros/i,
        /van richten/i, /witchlight/i, /candlekeep/i, /ghosts of saltmarsh/i,
        /princes of the apocalypse/i, /out of the abyss/i, /storm king/i,
        /descent into avernus/i, /rise of tiamat/i, /hoard of the dragon/i,
        /lost mine/i, /dragon of icespire/i, /dungeon of the mad mage/i,
        /essentials kit/i, /starter set/i, /vecna/i, /journeys through/i,
        /shattered obelisk/i
    ];
    return sourcePatterns.some(pattern => pattern.test(line));
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============= TAG BUILDING =============

function buildTags(name, type) {
    const tags = [];
    const lowerName = name.toLowerCase();
    const lowerType = type.toLowerCase();

    // Tags are for creature type groupings useful for themed encounters

    // Mind Flayer related
    if (lowerName.includes('mind flayer') || lowerName.includes('illithid') || lowerType.includes('mind flayer')) {
        tags.push('Mind Flayer');
    }

    // Psionic creatures
    if (lowerName.includes('psi') || lowerName.includes('psychic') ||
        lowerName.includes('encephalon') || lowerName.includes('intellect')) {
        tags.push('Psionic');
    }

    // Mutates
    if (lowerName.includes('mutate')) tags.push('Mutate');

    // Slaad
    if (lowerName.includes('slaad')) tags.push('Slaad');

    // Dragons
    if (lowerType.includes('dragon') || lowerName.includes('dragon')) tags.push('Dragon');

    // Goblinoids
    if (lowerType.includes('goblinoid') || lowerName.includes('goblin') ||
        lowerName.includes('hobgoblin') || lowerName.includes('bugbear')) {
        tags.push('Goblinoid');
    }

    // Yugoloths
    if (lowerType.includes('yugoloth') || lowerName.includes('mezzoloth') ||
        lowerName.includes('nycaloth') || lowerName.includes('arcanaloth') ||
        lowerName.includes('ultroloth')) {
        tags.push('Yugoloth');
    }

    // Demons/Devils
    if (lowerType.includes('demon')) tags.push('Demon');
    if (lowerType.includes('devil')) tags.push('Devil');

    // Undead subtypes
    if (lowerName.includes('zombie')) tags.push('Zombie');
    if (lowerName.includes('skeleton')) tags.push('Skeleton');
    if (lowerName.includes('vampire')) tags.push('Vampire');
    if (lowerName.includes('ghost') || lowerName.includes('specter') || lowerName.includes('wraith')) {
        tags.push('Incorporeal');
    }

    // Shapechanger
    if (lowerType.includes('shapechanger')) tags.push('Shapechanger');

    // Beholder
    if (lowerName.includes('beholder') || lowerType.includes('beholder')) tags.push('Beholder');

    return tags;
}

// ============= MONSTER BLOCK PARSING =============

const MANUAL_MAPPING = {
    // Icewind Dale & Variants
    "half-ogre": "Half-Ogre (Ogrillon)",
    "cultist (knights of the black sword)": "Cultist",
    "cult fanatic (knights of the black sword)": "Cult Fanatic",
    "tribal warrior spore servants": "Tribal Warrior",
    "piercer (ice variant)": "Piercer",
    "dzaan’s simulacrum": "Simulacrum",
    "living bigby’s hand": "Living Bigby's Hand",
    "sea hag (coven variant)": "Sea Hag",
    "night hag (coven variant)": "Night Hag",
    "goblin boss (variant)": "Goblin Boss",
    "aberrant zealot (variant)": "Aberrant Zealot",
    "young griffon (tiny)": "Griffon", // Fallback or custom? Defaulting to Griffon base for now
    "young griffon (small)": "Griffon",
    "young griffon (medium)": "Griffon",
    "gnome squidling": "Gnome Squidling", // Should exist
    "gnome ceremorph": "Gnome Ceremorph"
};

function normalizeName(name) {
    let normalized = name.toLowerCase().trim();
    // Fix smart quotes
    normalized = normalized.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');

    if (MANUAL_MAPPING[normalized]) {
        return MANUAL_MAPPING[normalized].toLowerCase();
    }
    return normalized;
}

function parseMonsterBlock(lines, startIndex) {
    const cr = lines[startIndex].trim();
    let i = startIndex + 1;

    if (i >= lines.length) return null;
    const name = lines[i].trim();
    i++;

    // Skip source info
    while (i < lines.length && (isSourceBook(lines[i]) || lines[i].trim() === 'Legacy')) {
        i++;
    }

    // Get creature type
    if (i >= lines.length) return null;
    let type = lines[i].trim();
    i++;

    // Check for subtype
    if (i < lines.length && lines[i].trim().startsWith('(')) {
        type = `${type} ${lines[i].trim()}`;
        i++;
    }

    // Get size
    while (i < lines.length && !isSize(lines[i])) {
        i++;
    }
    if (i >= lines.length) return null;
    const size = capitalizeFirst(lines[i].trim().toLowerCase());
    i++;

    // Get alignment
    if (i >= lines.length) return null;
    const alignment = lines[i].trim();
    i++;

    // Skip remaining tags
    while (i < lines.length && !isCRValue(lines[i])) {
        i++;
    }

    return {
        name,
        cr,
        type: capitalizeFirst(type),
        size,
        alignment,
        _nextIndex: i
    };
}

function parseRawEncounters(content) {
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
    const monsters = [];

    let i = 0;
    while (i < lines.length) {
        if (isCRValue(lines[i].trim())) {
            const monster = parseMonsterBlock(lines, i);
            if (monster) {
                monsters.push(monster);
                i = monster._nextIndex;
                continue;
            }
        }
        i++;
    }

    return monsters;
}

// ============= MAIN EXECUTION =============

console.log(`Parsing: ${inputFile}`);
const rawMonsters = parseRawEncounters(content);
console.log(`Found ${rawMonsters.length} monsters in raw file.`);

// Enrich with bestiary data
const output = [];
const missing = [];
let npcCount = 0;

for (const raw of rawMonsters) {
    const lookupName = normalizeName(raw.name);
    const bestiaryData = bestiaryMap.get(lookupName);

    // Check if NPC
    const isNpc = bestiaryData && (bestiaryData.isNpc || bestiaryData.isNamedCreature);

    if (excludeNpcs && isNpc) {
        npcCount++;
        continue;
    }

    let monster;

    if (bestiaryData) {
        // Use enriched data from bestiary
        const typeStr = parseType(bestiaryData.type);
        monster = {
            Name: bestiaryData.name,
            CR: parseCr(bestiaryData.cr),
            Type: typeStr,
            Size: parseSize(bestiaryData.size),
            Alignment: parseAlignment(bestiaryData.alignment),
            PassivePerception: getPassivePerception(bestiaryData),
            PerceptionBonus: getSkillBonus(bestiaryData, "perception", "wis"),
            StealthBonus: getSkillBonus(bestiaryData, "stealth", "dex"),
            InitiativeBonus: getInitiativeBonus(bestiaryData),
            SavingThrows: getSavingThrows(bestiaryData),
            Intelligence: bestiaryData.int || 10,
            Wisdom: bestiaryData.wis || 10,
            Charisma: bestiaryData.cha || 10,
            Tags: buildTags(bestiaryData.name, typeStr),
            Region: regions,
            Statblock_Link: `https://5e.tools/bestiary.html#${encodeURIComponent(bestiaryData.name).toLowerCase()}_${bestiaryData.source.toLowerCase()}`
        };
    } else {
        // Fallback to raw data
        missing.push(raw.name);
        monster = {
            Name: raw.name,
            CR: raw.cr,
            Type: raw.type,
            Size: raw.size,
            Alignment: raw.alignment,
            PassivePerception: 10,
            PerceptionBonus: 0,
            StealthBonus: 0,
            InitiativeBonus: 0,
            SavingThrows: "",
            Intelligence: 10,
            Wisdom: 10,
            Charisma: 10,
            Tags: buildTags(raw.name, raw.type),
            Region: regions,
            Statblock_Link: ""
        };
    }

    output.push(monster);
}

// Write output
fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));

// Summary
console.log(`\n✓ Parsed ${output.length} monsters`);
console.log(`✓ Regions: ${regions.join(', ')}`);
console.log(`✓ Enriched with stats: ${output.length - missing.length}`);
if (missing.length > 0) {
    console.log(`⚠ Missing from bestiary (using basic data): ${missing.length}`);
    missing.forEach(m => console.log(`  - ${m}`));
}
if (excludeNpcs) {
    console.log(`✓ Excluded ${npcCount} NPCs`);
}
console.log(`✓ Output: ${outputFile}`);

// CR breakdown
const byCR = {};
output.forEach(m => { byCR[m.CR] = (byCR[m.CR] || 0) + 1; });
console.log('\nMonsters by CR:');
Object.keys(byCR)
    .sort((a, b) => {
        const numA = a.includes('/') ? eval(a) : parseInt(a);
        const numB = b.includes('/') ? eval(b) : parseInt(b);
        return numA - numB;
    })
    .forEach(cr => console.log(`  CR ${cr}: ${byCR[cr]}`));
