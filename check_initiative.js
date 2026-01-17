const fs = require('fs');
const monsters = require('./src/data/enriched_monster_list.json');

const names = ["Water Weird", "Giant Eagle"];
names.forEach(name => {
    const m = monsters.find(x => x.Name === name);
    if (m) {
        console.log(`${name}: InitiativeBonus = ${m.InitiativeBonus}`);
    } else {
        console.log(`${name}: NOT FOUND`);
    }
});
