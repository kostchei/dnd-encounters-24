const data = require('../src/data/enriched_monster_list.json');

const cr1 = data.filter(m => m.CR === '1');

const hasAdventure = (m) => {
    if (m.Adventures && m.Adventures.length > 0) return true;
    if (m.Adventure) {
        if (Array.isArray(m.Adventure)) return m.Adventure.length > 0;
        return m.Adventure !== '';
    }
    return false;
};

const withAdv = cr1.filter(hasAdventure);
const noAdv = cr1.filter(m => !hasAdventure(m));

console.log('=== CR 1 Monster Adventure Analysis ===\n');
console.log('Total CR 1 monsters:', cr1.length);
console.log('With adventure(s):', withAdv.length);
console.log('Without adventures:', noAdv.length);
console.log('Percentage with adventures:', ((withAdv.length / cr1.length) * 100).toFixed(1) + '%');

console.log('\n--- CR 1 Monsters WITH Adventures ---');
withAdv.forEach(m => {
    let advs = [];
    if (m.Adventures && m.Adventures.length > 0) advs = m.Adventures;
    else if (m.Adventure) {
        advs = Array.isArray(m.Adventure) ? m.Adventure : [m.Adventure];
    }
    console.log(`  ${m.Name}: ${advs.join(', ')}`);
});

console.log('\n--- CR 1 Monsters WITHOUT Adventures ---');
noAdv.forEach(m => console.log(`  ${m.Name}`));
