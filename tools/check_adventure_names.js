/**
 * Check all adventure naming consistency - output to JSON
 */
const fs = require('fs');
const monsters = require('../src/data/enriched_monster_list.json');
const adventureRegions = require('../src/data/adventure_regions.json');

const adventuresInMonsterData = new Set();
monsters.forEach(m => {
    if (m.Adventures && m.Adventures.length > 0) {
        m.Adventures.forEach(adv => adventuresInMonsterData.add(adv));
    }
});

const configuredAdventures = new Set(Object.keys(adventureRegions));

const inDataNotConfig = [...adventuresInMonsterData].filter(a => !configuredAdventures.has(a)).sort();
const inConfigNotData = [...configuredAdventures].filter(a => !adventuresInMonsterData.has(a)).sort();

const result = {
    inMonsterDataButNotConfig: inDataNotConfig,
    inConfigButNotMonsterData: inConfigNotData,
    allInMonsterData: [...adventuresInMonsterData].sort(),
    allInConfig: [...configuredAdventures].sort()
};

fs.writeFileSync('adventure_name_check.json', JSON.stringify(result, null, 2));
console.log('Done - check adventure_name_check.json');
