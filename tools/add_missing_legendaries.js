const fs = require('fs');
const path = require('path');

const enrichedListPath = path.join(__dirname, '../src/data/enriched_monster_list.json');
const enrichedList = JSON.parse(fs.readFileSync(enrichedListPath, 'utf8'));

// Monster to add: { name: "Name", sourceFile: "path/to/json", source: "SourceAbbr" }
const monstersToAdd = [
    { name: "Thessalhydra", sourceFile: "../5etools-v2.23.0/data/bestiary/bestiary-hftt.json", source: "HftT" },
    { name: "Ambitious Assassin", sourceFile: "../5etools-v2.23.0/data/bestiary/bestiary-bmt.json", source: "BMT" },
    { name: "Fleecemane Lion", sourceFile: "../5etools-v2.23.0/data/bestiary/bestiary-mot.json", source: "MOT" },
    { name: "Yestabrod", sourceFile: "../5etools-v2.23.0/data/bestiary/bestiary-oota.json", source: "OotA" },
    // Additional requests
    { name: "Thousand Teeth", sourceFile: "../5etools-v2.23.0/data/bestiary/bestiary-gos.json", source: "GoS" },
    { name: "Obzedat Ghost", sourceFile: "../5etools-v2.23.0/data/bestiary/bestiary-ggr.json", source: "GGR" },
    { name: "Reduced-threat Aboleth", sourceFile: "../5etools-v2.23.0/data/bestiary/bestiary-tftyp.json", source: "TftYP" },
    { name: "Relentless Slasher", sourceFile: "../5etools-v2.23.0/data/bestiary/bestiary-vrgr.json", source: "VRGR" },
    { name: "Gar Shatterkeel", sourceFile: "../5etools-v2.23.0/data/bestiary/bestiary-pota.json", source: "PotA" }, // Using PotA version as primary
    { name: "Fate Hag", sourceFile: "../5etools-v2.23.0/data/bestiary/bestiary-bmt.json", source: "BMT" },
    { name: "Lorthuun", sourceFile: "../5etools-v2.23.0/data/bestiary/bestiary-oota.json", source: "OotA" },
    { name: "Karas Chembryl", sourceFile: "../5etools-v2.23.0/data/bestiary/bestiary-fraif.json", source: "FRAiF" },
    { name: "Auril (First Form)", sourceFile: "../5etools-v2.23.0/data/bestiary/bestiary-idrotf.json", source: "IDRotF" },
    { name: "Maw of Sekolah", sourceFile: "../5etools-v2.23.0/data/bestiary/bestiary-gos.json", source: "GoS" },
    { name: "Aphemia", sourceFile: "../5etools-v2.23.0/data/bestiary/bestiary-mot.json", source: "MOT" },
    { name: "Rezmir", sourceFile: "../5etools-v2.23.0/data/bestiary/bestiary-hotdq.json", source: "HotDQ" }
];

function getAbilityMod(score) {
    return Math.floor((score - 10) / 2);
}

function formatMod(mod) {
    return mod >= 0 ? `+${mod}` : `${mod}`;
}

monstersToAdd.forEach(m => {
    // Check if already exists
    if (enrichedList.find(e => e.Name.toLowerCase() === m.name.toLowerCase())) {
        console.log(`Skipping ${m.name}, already in list.`);
        return;
    }

    const filePath = path.join(__dirname, m.sourceFile);
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const monsterData = data.monster.find(x => x.name.toLowerCase() === m.name.toLowerCase());

    if (!monsterData) {
        console.error(`Monster not found in file: ${m.name}`);
        return;
    }

    // Extract stats
    const cr = monsterData.cr ? (typeof monsterData.cr === 'string' ? monsterData.cr : monsterData.cr.cr) : "Unknown";

    let type = "Unknown";
    if (typeof monsterData.type === 'string') type = monsterData.type;
    else if (monsterData.type && monsterData.type.type) type = monsterData.type.type;

    let alignment = "U";
    if (monsterData.alignment) {
        alignment = monsterData.alignment.map(a => {
            if (typeof a === 'string') {
                switch (a) {
                    case 'L': return 'L';
                    case 'N': return 'N';
                    case 'C': return 'C';
                    case 'G': return 'G';
                    case 'E': return 'E';
                    case 'U': return 'U';
                    case 'A': return 'A';
                    default: return a.toUpperCase();
                }
            }
            if (a.alignment) return "A"; // Handle complex alignment objects roughly
            return "";
        }).join(" ");
    }

    const passivePerception = monsterData.passive || (10 + getAbilityMod(monsterData.wis || 10)); // simplified

    // Calculate bonuses
    let perceptionBonus = 0;
    let stealthBonus = 0;
    if (monsterData.skill) {
        if (monsterData.skill.perception) perceptionBonus = parseInt(monsterData.skill.perception);
        if (monsterData.skill.stealth) stealthBonus = parseInt(monsterData.skill.stealth);
    }
    if (!perceptionBonus) perceptionBonus = getAbilityMod(monsterData.wis || 10);
    if (!stealthBonus) stealthBonus = getAbilityMod(monsterData.dex || 10);


    let initiativeBonus = getAbilityMod(monsterData.dex || 10);
    // Check for initiative alerts or traits if present (simplified here, usually just dex mod unless specified)


    let savingThrows = "";
    if (monsterData.save) {
        savingThrows = Object.entries(monsterData.save).map(([stat, val]) => {
            return `${stat.charAt(0).toUpperCase() + stat.slice(1)} ${val}`;
        }).join(", ");
    }

    const newEntry = {
        "Name": monsterData.name,
        "CR": cr,
        "Type": type,
        "Alignment": alignment,
        "PassivePerception": passivePerception,
        "PerceptionBonus": perceptionBonus,
        "StealthBonus": stealthBonus,
        "InitiativeBonus": initiativeBonus,
        "SavingThrows": savingThrows,
        "Intelligence": monsterData.int || 10,
        "Wisdom": monsterData.wis || 10,
        "Charisma": monsterData.cha || 10,
        "Statblock_Link": `https://5e.tools/bestiary.html#${encodeURIComponent(monsterData.name.toLowerCase())}_${m.source.toLowerCase()}`,
        "Faction": "",
        "Adventure": "",
        "Region": ["New Regional Addition"]
    };

    enrichedList.push(newEntry);
    console.log(`Added ${m.name} to list.`);
});

fs.writeFileSync(enrichedListPath, JSON.stringify(enrichedList, null, 2), 'utf8');
console.log("Enriched list updated.");
