/**
 * Migration Script: Rename FoundIn to Region and simplify region names
 * 
 * This script will:
 * 1. Update enriched_monster_list.json - rename FoundIn to Region and simplify file names
 * 2. Update enrich_monsters.js - change FoundIn to Region and add name simplification
 * 3. Update update_region_monsters.js - change field name and mapping
 * 4. Update add_missing_legendaries.js - change field name
 */

const fs = require('fs');
const path = require('path');

// Map old CSV file names to simplified region names
const REGION_NAME_MAP = {
    'Encounter spreadsheet - IceWind Dale.csv': 'Icewind Dale',
    'Encounter spreadsheet - Heartlands.csv': 'Heartlands',
    'Encounter spreadsheet - Calimshan.csv': 'Calimshan',
    'Encounter spreadsheet - Dungeons.csv': 'Dungeons',
    'Encounter spreadsheet - Cities.csv': 'Cities',
    'Encounter spreadsheet - Moonshae.csv': 'Moonshae',
    'New Regional Addition': 'New Regional Addition'
};

// 1. Update enriched_monster_list.json
function updateEnrichedMonsterList() {
    const filePath = path.join(__dirname, '../src/data/enriched_monster_list.json');
    console.log('Updating enriched_monster_list.json...');

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    let changedCount = 0;
    data.forEach(monster => {
        if (monster.FoundIn !== undefined) {
            // Create new Region field with simplified names
            monster.Region = monster.FoundIn.map(name => REGION_NAME_MAP[name] || name);
            // Remove old FoundIn field
            delete monster.FoundIn;
            changedCount++;
        }
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`  Updated ${changedCount} monster entries`);
}

// 2. Update enrich_monsters.js
function updateEnrichMonstersJs() {
    const filePath = path.join(__dirname, 'enrich_monsters.js');
    console.log('Updating enrich_monsters.js...');

    let content = fs.readFileSync(filePath, 'utf8');

    // Replace FoundIn with Region
    content = content.replace(/FoundIn:/g, 'Region:');

    // Add region name simplification after filename is retrieved
    // Find the line that adds to monsterSourceMap and modify the logic
    const oldMapAdd = `monsterSourceMap.get(beast).add(filename);`;
    const newMapAdd = `// Simplify filename to region name
                    const regionName = filename
                        .replace('Encounter spreadsheet - ', '')
                        .replace('.csv', '');
                    monsterSourceMap.get(beast).add(regionName);`;

    content = content.replace(oldMapAdd, newMapAdd);

    fs.writeFileSync(filePath, content);
    console.log('  Done');
}

// 3. Update update_region_monsters.js
function updateUpdateRegionMonstersJs() {
    const filePath = path.join(__dirname, '../update_region_monsters.js');
    console.log('Updating update_region_monsters.js...');

    let content = fs.readFileSync(filePath, 'utf8');

    // Update the FILE_TO_REGION_MAP with simplified names
    const oldMap = `const FILE_TO_REGION_MAP = {
    'Encounter spreadsheet - Calimshan.csv': 'calimshan',
    'Encounter spreadsheet - Cities.csv': 'cities',
    'Encounter spreadsheet - Dungeons.csv': 'dungeon',
    'Encounter spreadsheet - Heartlands.csv': 'heartlands',
    'Encounter spreadsheet - IceWind Dale.csv': 'icewind',
    'Encounter spreadsheet - Moonshae.csv': 'moonshae'
};`;

    const newMap = `const REGION_TO_KEY_MAP = {
    'Calimshan': 'calimshan',
    'Cities': 'cities',
    'Dungeons': 'dungeon',
    'Heartlands': 'heartlands',
    'Icewind Dale': 'icewind',
    'Moonshae': 'moonshae'
};`;

    content = content.replace(oldMap, newMap);

    // Update variable references
    content = content.replace(/FILE_TO_REGION_MAP/g, 'REGION_TO_KEY_MAP');
    content = content.replace(/monster\.FoundIn/g, 'monster.Region');

    fs.writeFileSync(filePath, content);
    console.log('  Done');
}

// 4. Update add_missing_legendaries.js
function updateAddMissingLegendariesJs() {
    const filePath = path.join(__dirname, 'add_missing_legendaries.js');
    console.log('Updating add_missing_legendaries.js...');

    let content = fs.readFileSync(filePath, 'utf8');

    // Replace FoundIn with Region
    content = content.replace(/"FoundIn":/g, '"Region":');

    fs.writeFileSync(filePath, content);
    console.log('  Done');
}

// Run all updates
console.log('Starting migration: FoundIn -> Region\n');

try {
    updateEnrichedMonsterList();
    updateEnrichMonstersJs();
    updateUpdateRegionMonstersJs();
    updateAddMissingLegendariesJs();

    console.log('\n✅ Migration complete!');
    console.log('\nChanges made:');
    console.log('  - enriched_monster_list.json: FoundIn renamed to Region, file names simplified');
    console.log('  - enrich_monsters.js: FoundIn renamed to Region, simplified region extraction');
    console.log('  - update_region_monsters.js: Updated field name and mapping');
    console.log('  - add_missing_legendaries.js: FoundIn renamed to Region');
} catch (err) {
    console.error('Error during migration:', err);
    process.exit(1);
}
