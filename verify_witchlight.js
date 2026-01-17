const fs = require('fs');
const REGION_MONSTERS = require('./src/data/region_monsters.json');

const regions = ['moonshae', 'heartlands'];
const targetSource = "The Wild Beyond The Witchlight";

console.log('Verifying Witchlight monsters in regions...');

regions.forEach(regionId => {
    const regionData = REGION_MONSTERS[regionId];
    if (!regionData) {
        console.error(`Region ${regionId} not found!`);
        return;
    }

    let foundCount = 0;
    let examples = [];

    for (const cr in regionData) {
        if (cr === "13") {
            console.log(`Region ${regionId} CR 13 monsters:`, regionData[cr]);
        }
        regionData[cr].forEach(monster => {
            // Check if this monster is from Witchlight. 
            // The region_monsters.json structure usually stores just names or basic objects. 
            // We might need to look up in enriched list or check if adventure tag is present there if preserved.
            // Actually, let's just check for known Witchlight monster names.
            const witchlightNames = [
                "Campestri", "Jabberwock", "Bavlorna Blightstraw", "Endelyn Moongrave",
                "Skabatha Nightshade", "Harengon Brigand", "Brigganock"
            ];

            const name = typeof monster === 'string' ? monster : monster.Name;
            if (witchlightNames.includes(name)) {
                foundCount++;
                if (examples.length < 3) examples.push(name);
            }
        });
    }

    console.log(`Region: ${regionId}`);
    console.log(`  Found ${foundCount} Witchlight monsters.`);
    console.log(`  Examples: ${examples.join(', ')}`);
});
