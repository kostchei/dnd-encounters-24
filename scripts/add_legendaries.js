const fs = require('fs');
const path = require('path');

const bestiaryDir = 'D:\\Code\\dnd-encounters-24\\5etools-v2.23.0\\data\\bestiary';
const enrichedFile = 'D:\\Code\\dnd-encounters-24\\src\\data\\enriched_monster_list.json';
const legendaryFile = 'D:\\Code\\dnd-encounters-24\\src\\data\\legendary.json';

const creaturesToAdd = [
    // Icewind Dale
    "Ancient White Dragon", "Remorhaz", "Abominable Yeti", "Bheur Hag",
    // Heartlands
    "Ancient Red Dragon", "Ancient Silver Dragon", "Adult Gold Dragon", "Ki-rin",
    // Calimshan
    "Ancient Blue Dragon", "Androsphinx", "Mummy Lord", "Adult Blue Dragon",
    // Dungeons
    "Elder Brain", "Beholder", "Aboleth", "Kraken", "Balhannoth",
    // Cities
    "Vampire Spellcaster", "Vampire Warrior", "Rakshasa", "Lich",
    // Moonshae
    "Ancient Green Dragon", "Dragon Turtle", "Sea Fury", "Unicorn"
];

function getModifier(score) {
    return Math.floor((score - 10) / 2);
}

function parseSkillBonus(skillObj, skillName) {
    if (!skillObj || !skillObj[skillName]) return 0;
    return parseInt(skillObj[skillName].replace('+', ''));
}

function formatSavingThrows(saveObj) {
    if (!saveObj) return "";
    return Object.entries(saveObj)
        .map(([stat, val]) => `${stat.charAt(0).toUpperCase() + stat.slice(1)} ${val}`)
        .join(", ");
}

function run() {
    console.log("Reading existing data...");
    let enrichedList = JSON.parse(fs.readFileSync(enrichedFile, 'utf8'));
    let legendaryList = JSON.parse(fs.readFileSync(legendaryFile, 'utf8'));

    const existingNames = new Set(enrichedList.map(m => m.Name));
    const newCreatures = [];

    const files = fs.readdirSync(bestiaryDir);

    files.forEach(file => {
        if (!file.startsWith('bestiary-') || file.includes('fluff')) return;

        try {
            const content = fs.readFileSync(path.join(bestiaryDir, file), 'utf8');
            const json = JSON.parse(content);
            if (!json.monster) return;

            json.monster.forEach(monster => {
                if (creaturesToAdd.includes(monster.name) && !existingNames.has(monster.name)) {
                    // Check if it's already found in this run (duplicates across files)
                    if (newCreatures.find(c => c.Name === monster.name)) return;

                    console.log(`Found ${monster.name} in ${file}`);

                    const cr = typeof monster.cr === 'object' ? monster.cr.cr : monster.cr;
                    const type = typeof monster.type === 'object' ? `${monster.type.type} (${monster.type.tags ? monster.type.tags.join(', ') : ''})` : monster.type;
                    const alignment = typeof monster.alignment === 'object' ? monster.alignment.join(' ') : (monster.alignment || "U");

                    const passivePerception = monster.passive || (10 + parseSkillBonus(monster.skill, 'perception'));
                    const perceptionBonus = parseSkillBonus(monster.skill, 'perception') || getModifier(monster.wis || 10);
                    const stealthBonus = parseSkillBonus(monster.skill, 'stealth') || getModifier(monster.dex || 10);
                    const initiativeBonus = getModifier(monster.dex || 10); // Standard, unless trait says otherwise (ignoring complex parsing for now)

                    const entry = {
                        "Name": monster.name,
                        "CR": cr || "Unknown",
                        "Type": type,
                        "Alignment": alignment,
                        "PassivePerception": passivePerception,
                        "PerceptionBonus": perceptionBonus,
                        "StealthBonus": stealthBonus,
                        "InitiativeBonus": initiativeBonus,
                        "SavingThrows": formatSavingThrows(monster.save),
                        "Intelligence": monster.int || 10,
                        "Wisdom": monster.wis || 10,
                        "Charisma": monster.cha || 10,
                        "Statblock_Link": `https://5e.tools/bestiary.html#${encodeURIComponent(monster.name.toLowerCase())}_${monster.source.toLowerCase()}`,
                        "Faction": "",
                        "Adventure": "",
                        "Region": [] // Will be filled by region logic if I were doing that here, but I'll leave empty for now
                    };

                    enrichedList.push(entry);
                    newCreatures.push(entry);
                    existingNames.add(monster.name);

                    // Add to legendary.json if eligible
                    if ((monster.legendary || monster.legendaryGroup) && !legendaryList.find(l => l.Name === monster.name)) {
                        legendaryList.push({
                            "Name": monster.name,
                            "Type": "Legendary " + (typeof monster.type === 'string' ? monster.type : monster.type.type).charAt(0).toUpperCase() + (typeof monster.type === 'string' ? monster.type : monster.type.type).slice(1),
                            "CR": cr
                        });
                    }
                }
            });
        } catch (e) {
            console.error(`Error processing ${file}: ${e.message}`);
        }
    });

    console.log(`Adding ${newCreatures.length} new creatures.`);

    fs.writeFileSync(enrichedFile, JSON.stringify(enrichedList, null, 2));
    fs.writeFileSync(legendaryFile, JSON.stringify(legendaryList, null, 2));
    console.log("Files updated.");
}

run();
