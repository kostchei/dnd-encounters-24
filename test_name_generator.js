/**
 * Test Regional Language Selection
 * Run with: node test_name_generator.js
 */

const fs = require('fs');
const path = require('path');

const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const coinFlip = (probability = 0.5) => Math.random() < probability;

// ============================================================
// All Cultural Generators (copied for Node.js testing)
// ============================================================

const chondathan = {
    maleStart: ["Dar", "Ev", "Gor", "Hel", "Mal", "Ran", "Sted", "Ae", "Bae", "Cor"],
    maleEnd: ["dur", "vin", "grim", "dor", "ric", "dan", "mir", "thas"],
    femaleStart: ["Ar", "Es", "Jhe", "Lur", "Mi", "Row", "Shan", "Tes"],
    femaleEnd: ["ene", "ara", "wyn", "ela", "ira", "ana", "essa"]
};

const alzhedo = {
    maleStart: ["As", "Ba", "Ha", "Khe", "Meh", "Su", "Za", "Ao", "Ra", "Tha"],
    maleEnd: ["cir", "eid", "med", "man", "heir", "ras", "hur", "ir", "im"],
    femaleStart: ["At", "Ce", "Ha", "Ja", "Me", "Sc", "Ya", "Za", "Am", "Ba"],
    femaleEnd: ["ala", "dil", "ma", "mal", "lil", "eira", "ida", "ira"]
};

const mulhorand = {
    maleStart: ["Ao", "Ba", "Eh", "Ke", "Mu", "Ra", "So", "Tha", "Ur"],
    maleEnd: ["th", "ris", "med", "mas", "hur", "kur", "tep", "mose"],
    femaleStart: ["Ar", "Cha", "Ne", "Nu", "Mu", "Se", "Tho", "Um", "Zo"],
    femaleEnd: ["zima", "thi", "phis", "lara", "rithi", "la", "titi"]
};

const illuskan = {
    maleStart: ["An", "Bla", "Bra", "Fra", "Ge", "Lan", "Lu", "Mal", "Sto", "Ta"],
    maleEnd: ["th", "der", "cer", "man", "gar", "nar", "rik", "vald", "mund", "bjorn"],
    femaleStart: ["Am", "Be", "Ce", "Ke", "Ma", "Ol", "Si", "We", "As", "Bry"],
    femaleEnd: ["frey", "tha", "a", "ga", "stra", "hild", "dis", "run"]
};

const rashemi = {
    maleStart: ["Bo", "Fa", "Jan", "Ka", "Ma", "Ral", "Sha", "Vla", "Gri"],
    maleEnd: ["vik", "gar", "dar", "thar", "slak", "mar", "gor", "slav"],
    femaleStart: ["Fy", "Hul", "Im", "Na", "She", "Tam", "Yul", "An"],
    femaleEnd: ["varra", "marra", "mith", "zel", "arra", "dra", "va"]
};

const celtic = {
    maleStart: ["Ai", "An", "Br", "Ca", "Con", "Da", "Eg", "Fer", "Ga", "Ken"],
    maleEnd: ["n", "c", "s", "gh", "ll", "an", "in", "wyn", "dric", "mac"],
    femaleStart: ["Ai", "Ar", "Bri", "Ca", "Ci", "De", "El", "Fi", "Gra", "Is"],
    femaleEnd: ["a", "e", "wen", "eth", "ine", "ana", "een", "la", "nne"]
};

const drow = {
    maleStart: ["Al", "Dri", "Il", "Mer", "Pha", "Riz", "Teb", "Zak", "Jar"],
    maleEnd: ["ak", "t", "yn", "id", "aun", "zen", "fein", "orn", "ryn"],
    femaleStart: ["Ak", "Cha", "Ecl", "Jha", "Ned", "Qi", "Si", "Vlo", "Mal"],
    femaleEnd: ["dia", "thra", "dra", "rnya", "lene", "lue", "fay", "dril"]
};

const dwarven = {
    maleStart: ["Bar", "Dor", "Joy", "Kho", "Ror", "Sto", "Tho", "Wul", "Bru"],
    maleEnd: ["dar", "n", "in", "ndar", "yn", "rn", "rik", "gar", "rim"],
    femaleStart: ["Bel", "Dor", "Joy", "Ki", "Sam", "Ta", "Um", "Ka", "Kri"],
    femaleEnd: ["mara", "na", "lin", "ira", "bril", "ce", "il", "thra"]
};

const orc = {
    maleStart: ["Be", "Du", "Fan", "Go", "Ha", "Ke", "Or", "Tha", "Tho", "Ugu"],
    maleEnd: ["sk", "rth", "g", "og", "rl", "usk", "ag", "ash", "uk", "ght"],
    femaleStart: ["Be", "Cre", "Ed", "Du", "Ne", "Or", "Va", "Yes", "Bag"],
    femaleEnd: ["rra", "ske", "aega", "e", "gi", "gga", "ev", "tha"]
};

const turmic = {
    maleStart: ["An", "Di", "Mar", "Pie", "Rim", "Rom", "Sal", "Um", "Al"],
    maleEnd: ["ton", "ero", "con", "ron", "ardo", "bero", "zar", "eo", "io"],
    femaleStart: ["Bal", "Don", "Fa", "Jal", "Lu", "Mar", "Qu", "Sel", "Von"],
    femaleEnd: ["ama", "a", "ila", "ana", "isa", "ta", "ara", "ise", "da"]
};

function genName(gen, gender) {
    if (gender === "female") {
        return randomChoice(gen.femaleStart) + randomChoice(gen.femaleEnd);
    }
    return randomChoice(gen.maleStart) + randomChoice(gen.maleEnd);
}

// Multi-culture region mapping (matching NameData.md)
const regionCultures = {
    heartlands: [chondathan, chondathan, alzhedo],
    calimshan: [alzhedo, mulhorand, alzhedo],
    moonshae: [celtic, celtic, chondathan],
    cities: [turmic, chondathan, turmic],
    dungeons: [drow, dwarven, orc, drow],
    icewind_dale: [illuskan, rashemi, illuskan]
};

function generateProceduralName(region, gender) {
    const cultures = regionCultures[region] || regionCultures.heartlands;
    const culture = randomChoice(cultures);
    return genName(culture, gender);
}

// ============================================================
// TESTS
// ============================================================

console.log('='.repeat(60));
console.log('FAERUN NAME GENERATOR - MULTI-CULTURE REGIONAL TEST');
console.log('='.repeat(60));

console.log('\n--- Region Culture Mapping (from NameData.md) ---');
console.log('Heartlands: Aglarondan, Alzhedo, Chessentan, Chondathan (weighted Chondathan)');
console.log('Calimshan: Chultan, Dambrathan, Durpari, Mulhorand, etc (weighted Arabic/Egyptian)');
console.log('Moonshae: Elven, Halfling, Halruaan (weighted Celtic/Ffolk)');
console.log('Cities: Lantanese, Turmic (mixed urban)');
console.log('Dungeons: Dwarven, Drow, Gnome, Orc (Underdark races)');
console.log('Icewind Dale: Illuskan, Uluik, Rashemi, Damaran (Norse/Slavic)');

console.log('\n--- Sample Names by Region (showing cultural variety) ---\n');

const regions = ['heartlands', 'calimshan', 'moonshae', 'cities', 'dungeons', 'icewind_dale'];
for (const region of regions) {
    console.log(`${region.toUpperCase()}:`);
    const names = [];
    for (let i = 0; i < 8; i++) {
        const gender = i % 2 === 0 ? 'male' : 'female';
        names.push(generateProceduralName(region, gender));
    }
    console.log(`  ${names.join(', ')}`);
    console.log('');
}

console.log('--- Procedural Generation Variety (10 unique names per region) ---\n');
for (const region of regions) {
    const names = new Set();
    while (names.size < 10) {
        names.add(generateProceduralName(region, coinFlip() ? 'male' : 'female'));
    }
    console.log(`${region}: ${Array.from(names).join(', ')}`);
}

console.log('\n' + '='.repeat(60));
console.log('TEST COMPLETE - Names should show cultural variety within each region');
console.log('='.repeat(60));
