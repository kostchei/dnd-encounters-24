/**
 * Diagnostic: Analyze why adventures aren't showing on encounters
 */

const fs = require('fs');
const monsters = require('../src/data/enriched_monster_list.json');
const adventureRegions = require('../src/data/adventure_regions.json');

// Get all unique adventures from monster data
const allAdventuresInData = new Set();
const adventureMonsterCounts = new Map();

monsters.forEach(m => {
    if (m.Adventures && m.Adventures.length > 0) {
        m.Adventures.forEach(adv => {
            allAdventuresInData.add(adv);
            adventureMonsterCounts.set(adv, (adventureMonsterCounts.get(adv) || 0) + 1);
        });
    }
});

const configuredAdventures = Object.keys(adventureRegions);
const missingFromConfig = [...allAdventuresInData].filter(adv => !configuredAdventures.includes(adv));

const result = {
    summary: {
        totalUniqueAdventuresInMonsterData: allAdventuresInData.size,
        totalConfiguredAdventures: configuredAdventures.length,
        missingFromConfigCount: missingFromConfig.length
    },
    missingFromConfig: missingFromConfig.map(adv => ({
        name: adv,
        monsterCount: adventureMonsterCounts.get(adv) || 0
    })),
    cr1Analysis: {}
};

// CR 1 analysis
const cr1Monsters = monsters.filter(m => m.CR === '1');
const cr1WithAdventures = cr1Monsters.filter(m => m.Adventures && m.Adventures.length > 0);

const regions = ['icewind', 'heartlands', 'calimshan', 'dungeon', 'cities', 'moonshae'];

regions.forEach(regionId => {
    let wouldDisplay = 0;
    let wouldNotDisplay = 0;

    cr1WithAdventures.forEach(m => {
        const validAdventures = m.Adventures.filter(advName => {
            const advConfig = adventureRegions[advName];
            if (!advConfig) return false;
            return advConfig.regions.includes('all') || advConfig.regions.includes(regionId);
        });

        if (validAdventures.length > 0) wouldDisplay++;
        else wouldNotDisplay++;
    });

    result.cr1Analysis[regionId] = { wouldDisplay, wouldNotDisplay, total: cr1WithAdventures.length };
});

fs.writeFileSync('diagnosis_result.json', JSON.stringify(result, null, 2));
console.log('Written to diagnosis_result.json');
