/**
 * Faerun Name Generators - Procedural Name Generation
 * 
 * Based on phonetic patterns extracted from each cultural group.
 * Creates infinite unique names that sound authentic to each region.
 */

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ============================================================
// CHONDATHAN / HEARTLANDS (English/Common fantasy)
// Similar to Arthurian/medieval English names
// ============================================================

const chondathan = {
    maleStart: ["Dar", "Ev", "Gor", "Hel", "Mal", "Ran", "Sted", "Ae", "Bae", "Cor", "Del", "Fal", "Jar", "Kel", "Mor", "Nar", "Pir", "Rha", "Sel", "Tes", "Van", "Zel"],
    maleMid: ["en", "al", "or", "in", "ar", "el", "an", "ir", "on", "ur"],
    maleEnd: ["dur", "vin", "grim", "dor", "ric", "dan", "mir", "thas", "stan", "bert", "mund", "gal", "wen", "gar", "thor", "mar", "son", "red", "ald"],

    femaleStart: ["Ar", "Es", "Jhe", "Lur", "Mi", "Row", "Shan", "Tes", "Bla", "Cour", "May", "Wyd", "Ari", "Cyl", "Hal", "Num", "Sin", "El", "Gal", "Ky", "Val"],
    femaleMid: ["ve", "a", "i", "o", "ae", "ee", "iel", "al", "el", "in"],
    femaleEnd: ["ene", "ara", "wyn", "ela", "ira", "ana", "essa", "ine", "ora", "lia", "eth", "sel", "ri", "dri", "na", "lla", "da"],

    surnames: ["Amble", "Buck", "Dun", "Even", "Grey", "Tall", "Blade", "Crown", "Gold", "Hawk", "Iron", "Long", "Quick", "Storm", "Thunder", "Wand"],
    surnameEnds: ["crown", "man", "dragon", "wood", "castle", "stag", "gold", "hand", "star", "sword", "helm", "shield"]
};

function generateChondathanName(gender) {
    const c = chondathan;
    const syllables = Math.random() < 0.5 ? 2 : 3;
    let name;

    if (gender === "female") {
        name = randomChoice(c.femaleStart);
        if (syllables === 3) name += randomChoice(c.femaleMid);
        name += randomChoice(c.femaleEnd);
    } else {
        name = randomChoice(c.maleStart);
        if (syllables === 3) name += randomChoice(c.maleMid);
        name += randomChoice(c.maleEnd);
    }

    return name.charAt(0).toUpperCase() + name.slice(1);
}

// ============================================================
// ALZHEDO / CALIMSHAN (Arabic/Persian influenced)
// Similar to Middle Eastern naming patterns
// ============================================================

const alzhedo = {
    maleStart: ["As", "Ba", "Ha", "Khe", "Meh", "Su", "Za", "Ao", "Ra", "Uh", "Tha", "Ak", "Da", "Fa", "Ja", "Ka", "Ma", "Na", "Qa", "Sa", "Ta", "Ya"],
    maleMid: ["de", "se", "li", "ri", "za", "ma", "ba", "la", "ra", "sha"],
    maleEnd: ["cir", "eid", "med", "man", "heir", "ras", "hur", "ir", "im", "id", "ud", "ar", "as", "an", "ur", "em", "oz", "iq", "ud"],

    femaleStart: ["At", "Ce", "Ha", "Ja", "Me", "Sc", "Ya", "Za", "Am", "Ba", "Da", "Fa", "Gu", "Kha", "La", "Na", "Pa", "Ra", "Sa", "Ta"],
    femaleMid: ["i", "a", "ei", "sha", "li", "ri", "za", "ma"],
    femaleEnd: ["ala", "dil", "ma", "mal", "lil", "pora", "eira", "ida", "a", "ira", "ina", "ah", "iya", "uma", "asa", "ima", "ijah", "min"],

    prefixWords: ["al-", "ibn-", "bint-", "el-"],
    surnames: ["Basha", "Dumein", "Jassan", "Khalid", "Mostana", "Pashar", "Rein", "Rashid", "Maktoum", "Said"]
};

function generateAlzhedoName(gender) {
    const a = alzhedo;
    const syllables = Math.random() < 0.4 ? 2 : 3;
    let name;

    if (gender === "female") {
        name = randomChoice(a.femaleStart);
        if (syllables === 3) name += randomChoice(a.femaleMid);
        name += randomChoice(a.femaleEnd);
    } else {
        name = randomChoice(a.maleStart);
        if (syllables === 3) name += randomChoice(a.maleMid);
        name += randomChoice(a.maleEnd);
    }

    return name.charAt(0).toUpperCase() + name.slice(1);
}

// ============================================================
// MULHORAND (Egyptian influenced)
// ============================================================

const mulhorand = {
    maleStart: ["Ao", "Ba", "Eh", "Ke", "Mu", "Ra", "So", "Tha", "Ur", "Im", "Nu", "Se", "Te", "Ka", "Ne", "Pa", "Sa"],
    maleMid: ["re", "ho", "pu", "me", "za", "ka", "no", "se"],
    maleEnd: ["th", "ris", "med", "mas", "hur", "kur", "tep", "mis", "nus", "bek", "mose", "tef", "amon"],

    femaleStart: ["Ar", "Cha", "Ne", "Nu", "Mu", "Se", "Tho", "Um", "Zo", "Ha", "Me", "Ta"],
    femaleMid: ["i", "a", "ri", "phi", "zi", "la"],
    femaleEnd: ["zima", "thi", "phis", "lara", "rithi", "fris", "la", "ra", "titi", "set", "ra", "ret"],

    surnames: ["Ankhalab", "Anskuld", "Fezim", "Hahpet", "Nathandem", "Sepret", "Uuthrakt"]
};

function generateMulhorandName(gender) {
    const m = mulhorand;
    const syllables = Math.random() < 0.5 ? 2 : 3;
    let name;

    if (gender === "female") {
        name = randomChoice(m.femaleStart);
        if (syllables === 3) name += randomChoice(m.femaleMid);
        name += randomChoice(m.femaleEnd);
    } else {
        name = randomChoice(m.maleStart);
        if (syllables === 3) name += randomChoice(m.maleMid);
        name += randomChoice(m.maleEnd);
    }

    return name.charAt(0).toUpperCase() + name.slice(1);
}

// ============================================================
// ILLUSKAN / ICEWIND DALE (Norse/Viking influenced)
// ============================================================

const illuskan = {
    // Consonant clusters for harsh northern sounds
    nm1: ["a", "e", "i", "o", "u", "ei", "au", "ae"],
    nm2: ["", "", "b", "br", "bl", "d", "dr", "f", "fr", "g", "gr", "gl", "h", "hr", "k", "kr", "l", "m", "n", "r", "s", "sk", "st", "sv", "t", "th", "tr", "v", "w", "y"],
    nm3: ["ld", "lf", "lg", "lk", "ll", "lm", "ln", "lr", "ls", "lt", "lv", "nd", "ng", "nk", "nn", "rd", "rf", "rg", "rk", "rl", "rm", "rn", "rr", "rs", "rt", "rv", "sk", "st", "th"],
    nm4: ["d", "f", "g", "k", "l", "m", "n", "r", "s", "th", "v"],

    maleStart: ["An", "Bla", "Bra", "Fra", "Ge", "Lan", "Lu", "Mal", "Sto", "Ta", "Ur", "Bj", "Er", "Hro", "Ing", "Rag", "Sig", "Sv", "Ulf", "Wul"],
    maleMid: ["der", "ath", "th", "or", "ar", "ur", "orn", "ald"],
    maleEnd: ["th", "der", "cer", "man", "gar", "nar", "rik", "vald", "mund", "bjorn", "arr", "ulf", "mir", "dor", "grim"],

    femaleStart: ["Am", "Be", "Ce", "Ke", "Ma", "Ol", "Si", "We", "As", "Bry", "Dag", "Ei", "Fre", "Gu", "Hel", "In", "Jo", "Rag", "Sig", "Tho"],
    femaleMid: ["a", "i", "li", "fre", "ra"],
    femaleEnd: ["frey", "tha", "a", "ga", "stra", "hild", "dis", "run", "rid", "wyn", "vor", "va", "na", "ra", "li"],

    surnames: ["Bright", "Hel", "Horn", "Lack", "Ston", "Storm", "Wind", "Iron", "Frost", "Snow", "Ice", "Bear", "Wolf"],
    surnameEnds: ["wood", "der", "raven", "man", "ar", "wind", "river", "wolf", "beard", "strider", "born", "heart", "stone"]
};

function generateIlluskanName(gender) {
    const i = illuskan;
    const syllables = Math.random() < 0.4 ? 2 : 3;
    let name;

    if (gender === "female") {
        name = randomChoice(i.femaleStart);
        if (syllables === 3) name += randomChoice(i.femaleMid);
        name += randomChoice(i.femaleEnd);
    } else {
        name = randomChoice(i.maleStart);
        if (syllables === 3) name += randomChoice(i.maleMid);
        name += randomChoice(i.maleEnd);
    }

    return name.charAt(0).toUpperCase() + name.slice(1);
}

// ============================================================
// RASHEMI (Slavic influenced)
// ============================================================

const rashemi = {
    maleStart: ["Bo", "Fa", "Jan", "Ka", "Ma", "Ral", "Sha", "Vla", "Gri", "Iva", "Mi", "Pa", "Se", "To", "Yu"],
    maleMid: ["ri", "di", "ni", "me", "gor", "slav", "mir"],
    maleEnd: ["vik", "gar", "dar", "thar", "slak", "vik", "mar", "gor", "slav", "mir", "av", "ev", "ov"],

    femaleStart: ["Fy", "Hul", "Im", "Na", "She", "Tam", "Yul", "An", "Kat", "Ma", "Ol", "Ta", "Zo"],
    femaleMid: ["e", "a", "i", "ra"],
    femaleEnd: ["varra", "marra", "mith", "zel", "arra", "mith", "dra", "va", "na", "ra", "sha"],

    surnames: ["Chergoba", "Dyernina", "Iltazyara", "Murnyethara", "Stayanoga", "Ulmokina"]
};

function generateRashemiName(gender) {
    const r = rashemi;
    const syllables = Math.random() < 0.5 ? 2 : 3;
    let name;

    if (gender === "female") {
        name = randomChoice(r.femaleStart);
        if (syllables === 3) name += randomChoice(r.femaleMid);
        name += randomChoice(r.femaleEnd);
    } else {
        name = randomChoice(r.maleStart);
        if (syllables === 3) name += randomChoice(r.maleMid);
        name += randomChoice(r.maleEnd);
    }

    return name.charAt(0).toUpperCase() + name.slice(1);
}

// ============================================================
// MOONSHAE / CELTIC (Irish/Welsh influenced)
// ============================================================

const celtic = {
    maleStart: ["Ai", "An", "Br", "Ca", "Con", "Da", "Eg", "Fer", "Ga", "Ken", "Mor", "Ow", "Pry", "Rea", "Tal", "Tier", "Ao", "Bev", "Ci", "Dec", "Ea", "Fio", "Lo", "Ni", "Pa", "Ro", "Sea", "Ta"],
    maleMid: ["rell", "ghus", "an", "dman", "alt", "rcy", "han", "vyn", "lvyn", "deri", "ghan", "iesin", "rnay", "dh", "wyn"],
    maleEnd: ["n", "c", "s", "gh", "ll", "an", "in", "wyn", "dric", "gan", "lin", "thas", "ric", "og", "us", "mac", "aid"],

    femaleStart: ["Ai", "Ar", "Bri", "Ca", "Ci", "De", "El", "Fi", "Gra", "Is", "Ke", "Lin", "Ma", "Ni", "Or", "Reg", "Row", "Si", "Wyn", "Ao", "Bri", "Dei", "Ei", "Fio", "Mae", "Oo", "Sio", "Un"],
    femaleMid: ["fe", "na", "enh", "omh", "eene", "en", "sha", "nne", "eune", "done", "ia", "sa", "on", "vene", "nne", "ul", "seult"],
    femaleEnd: ["a", "e", "wen", "eth", "ine", "ana", "een", "la", "ria", "nne", "ith", "ora", "id", "uala", "nne", "ve", "an"],

    surnames: ["Ken", "Dono", "Flan", "Gall", "Kavan", "Mac", "O'", "Fitz"],
    surnameEnds: ["drick", "ghue", "agan", "agher", "agh", "Bride", "Brien", "Connor", "Malley", "Neill", "gerald", "Carthy"]
};

function generateCelticName(gender) {
    const c = celtic;
    const syllables = Math.random() < 0.5 ? 2 : 3;
    let name;

    if (gender === "female") {
        name = randomChoice(c.femaleStart);
        if (syllables === 3) name += randomChoice(c.femaleMid);
        name += randomChoice(c.femaleEnd);
    } else {
        name = randomChoice(c.maleStart);
        if (syllables === 3) name += randomChoice(c.maleMid);
        name += randomChoice(c.maleEnd);
    }

    return name.charAt(0).toUpperCase() + name.slice(1);
}

// ============================================================
// DROW (Dark Elf - harsh elegant sounds)
// ============================================================

const drow = {
    maleStart: ["Al", "Dri", "Il", "Mer", "Pha", "Riz", "Teb", "Zak", "Jar", "Gro", "Nal", "Mas", "Din", "Kel", "Ber"],
    maleMid: ["zz", "mr", "in", "au", "na", "el", "oz"],
    maleEnd: ["ak", "t", "yn", "id", "aun", "zen", "fein", "orn", "ryn", "ex", "ix", "ax"],

    femaleStart: ["Ak", "Cha", "Ecl", "Jha", "Ned", "Qi", "Si", "Vlo", "Mal", "Yvon", "Quen", "Tri", "Sha", "Zeer"],
    femaleMid: ["or", "li", "el", "yl", "ae"],
    femaleEnd: ["dia", "thra", "dra", "rnya", "lene", "lue", "fay", "dril", "ice", "nel", "ki", "el", "ith"],

    housePrefixes: ["Do'", "Baen", "Oblod", "Mizzr", "Fae", "Xorl"],
    houseSuffixes: ["Urden", "re", "ra", "ym", "n Tlabbar", "arrin"]
};

function generateDrowName(gender) {
    const d = drow;
    const syllables = Math.random() < 0.4 ? 2 : 3;
    let name;

    if (gender === "female") {
        name = randomChoice(d.femaleStart);
        if (syllables === 3) name += randomChoice(d.femaleMid);
        name += randomChoice(d.femaleEnd);
    } else {
        name = randomChoice(d.maleStart);
        if (syllables === 3) name += randomChoice(d.maleMid);
        name += randomChoice(d.maleEnd);
    }

    return name.charAt(0).toUpperCase() + name.slice(1);
}

// ============================================================
// DWARVEN (Germanic/gruff sounds)
// ============================================================

const dwarven = {
    maleStart: ["Bar", "Dor", "Joy", "Kho", "Ror", "Sto", "Tho", "Wul", "Bru", "Ath", "Con", "Pwe", "Tor", "Gan"],
    maleMid: ["un", "in", "on", "or", "ar"],
    maleEnd: ["dar", "n", "in", "ndar", "yn", "rn", "rik", "gar", "rim", "or", "ak", "ek", "uk"],

    femaleStart: ["Bel", "Dor", "Joy", "Ki", "Sam", "Ta", "Um", "Ka", "Kri", "Lif", "Mar", "Ris", "Vis"],
    femaleMid: ["a", "i", "ra"],
    femaleEnd: ["mara", "na", "lin", "ira", "bril", "ce", "il", "thra", "stryd", "trasa", "dred", "wyn"],

    clanPrefixes: ["Battle", "Blood", "Braw", "Crown", "Dark", "Ever", "Fire", "Frost", "Gold", "Hammer", "Iron", "Stone", "Thunder", "True"],
    clanSuffixes: ["hammer", "axe", "anvil", "shield", "helm", "fist", "beard", "finder", "bane", "blood", "heart"]
};

function generateDwarvenName(gender) {
    const d = dwarven;
    const syllables = Math.random() < 0.4 ? 2 : 3;
    let name;

    if (gender === "female") {
        name = randomChoice(d.femaleStart);
        if (syllables === 3) name += randomChoice(d.femaleMid);
        name += randomChoice(d.femaleEnd);
    } else {
        name = randomChoice(d.maleStart);
        if (syllables === 3) name += randomChoice(d.maleMid);
        name += randomChoice(d.maleEnd);
    }

    return name.charAt(0).toUpperCase() + name.slice(1);
}

// ============================================================
// ORC (Harsh guttural sounds)
// ============================================================

const orc = {
    // Complex consonant clusters like barbarianNames.js
    nm1: ["a", "e", "i", "o", "u", "a", "o", "u"],
    nm2: ["", "", "b", "br", "d", "dr", "f", "g", "gh", "gr", "gn", "h", "k", "kr", "l", "m", "n", "r", "s", "sh", "sk", "t", "th", "thr", "v", "z"],
    nm3: ["g", "gg", "gd", "gn", "gr", "k", "kk", "ks", "lb", "lg", "lk", "mb", "mg", "mk", "nd", "ng", "nk", "rb", "rd", "rg", "rk", "rn", "rt", "rz", "sg", "sk", "st", "th", "zg", "zk"],
    nm4: ["g", "k", "sh", "th", "rk", "sk", "ght", "gh", "z", "ks"],

    maleStart: ["Be", "Du", "Fan", "Go", "Ha", "Ke", "Or", "Tha", "Tho", "Ugu", "Gri", "Muz", "Sha", "Ug", "Az", "Bo", "Lu"],
    maleMid: ["sk", "rth", "g", "rog", "rl", "sk", "rru", "ag", "ash"],
    maleEnd: ["sk", "rth", "g", "og", "rl", "sk", "usk", "ag", "ash", "uk", "urk", "ght", "th"],

    femaleStart: ["Be", "Cre", "Ed", "Du", "Ne", "Or", "Va", "Yes", "Bag", "Gra", "Il", "My", "Shau"],
    femaleMid: ["tha", "ske", "arre", "aega", "sk", "va"],
    femaleEnd: ["rra", "ske", "ske", "aega", "e", "rra", "rra", "gi", "gga", "ev", "tha"],

    clanNames: ["Dummik", "Horthor", "Lammar", "Sormuzhik", "Turnskull", "Ulkrunnar", "Zorgar", "Bonegrinder", "Skullcrusher"]
};

function generateOrcName(gender) {
    const o = orc;
    let name;

    // Use the complex pattern similar to barbarianNames.js
    if (gender === "male") {
        const rnd = Math.floor(Math.random() * o.nm2.length);
        const rnd2 = Math.floor(Math.random() * o.nm1.length);
        const rnd3 = Math.floor(Math.random() * o.nm3.length);
        const rnd4 = Math.floor(Math.random() * o.nm1.length);
        const rnd5 = Math.floor(Math.random() * o.nm4.length);

        name = o.nm2[rnd] + o.nm1[rnd2] + o.nm3[rnd3] + o.nm1[rnd4] + o.nm4[rnd5];
    } else {
        name = randomChoice(o.femaleStart);
        if (Math.random() < 0.5) name += randomChoice(o.femaleMid);
        name += randomChoice(o.femaleEnd);
    }

    return name.charAt(0).toUpperCase() + name.slice(1);
}

// ============================================================
// TURMIC / CITIES (Spanish/Italian influenced)
// ============================================================

const turmic = {
    maleStart: ["An", "Di", "Mar", "Pie", "Rim", "Rom", "Sal", "Um", "Al", "Ber", "Car", "Don", "Fer", "Gus", "Lu", "Nic", "Raf", "San", "Vin"],
    maleMid: ["ton", "ero", "con", "ron", "ardo", "bero", "zar"],
    maleEnd: ["ton", "ero", "con", "ron", "ardo", "bero", "zar", "eo", "io", "co", "do", "go", "mo", "no", "ro"],

    femaleStart: ["Bal", "Don", "Fa", "Jal", "Lu", "Mar", "Qu", "Sel", "Von", "Al", "Bri", "Ce", "Is", "Lor", "Ma", "Ros", "So"],
    femaleMid: ["a", "i", "e", "ana"],
    femaleEnd: ["ama", "a", "ila", "ana", "isa", "ta", "ara", "ise", "da", "ella", "ina", "ita", "ia"],

    surnames: ["Agosto", "Astorio", "Calabra", "Domine", "Falone", "Marivaldi", "Pisacar", "Ramondo"]
};

function generateTurmicName(gender) {
    const t = turmic;
    const syllables = Math.random() < 0.5 ? 2 : 3;
    let name;

    if (gender === "female") {
        name = randomChoice(t.femaleStart);
        if (syllables === 3) name += randomChoice(t.femaleMid);
        name += randomChoice(t.femaleEnd);
    } else {
        name = randomChoice(t.maleStart);
        if (syllables === 3) name += randomChoice(t.maleMid);
        name += randomChoice(t.maleEnd);
    }

    return name.charAt(0).toUpperCase() + name.slice(1);
}

// ============================================================
// MAIN EXPORT - Region-based generator selection
// Now randomly picks from multiple cultures within each region
// matching the groupings in NameData.md
// ============================================================

// Region to cultures mapping (from NameData.md)
const regionCultures = {
    // Heartlands Region: Aglarondan, Alzhedo, Chessentan, Chondathan
    heartlands: [generateChondathanName, generateChondathanName, generateAlzhedoName], // weighted toward Chondathan

    // Calimshan Region: Chultan, Dambrathan, Durpari, Mulhorand, Shaaran, Tashalan, Untheric
    calimshan: [generateAlzhedoName, generateMulhorandName, generateAlzhedoName], // Arabic-influenced primary

    // Moonshae Region: Elven, Halfling, Halruaan (Ffolk/Celtic dominant)
    moonshae: [generateCelticName, generateCelticName, generateChondathanName], // Celtic dominant

    // City Region: Lantanese, Turmic
    cities: [generateTurmicName, generateChondathanName, generateTurmicName], // Mixed urban

    // Dungeon Region: Dwarven, Drow, Gnome, Orc
    dungeons: [generateDrowName, generateDwarvenName, generateOrcName, generateDrowName], // Underdark races

    // IceWind Dale: Illuskan, Uluik, Rashemi, Damaran
    icewind_dale: [generateIlluskanName, generateRashemiName, generateIlluskanName] // Norse/Slavic
};

// Direct culture mappings for specific requests
const cultureGenerators = {
    chondathan: generateChondathanName,
    aglarondan: generateChondathanName,
    chessentan: generateChondathanName,
    alzhedo: generateAlzhedoName,
    mulhorand: generateMulhorandName,
    chultan: generateAlzhedoName,
    durpari: generateAlzhedoName,
    illuskan: generateIlluskanName,
    rashemi: generateRashemiName,
    damaran: generateRashemiName,
    uluik: generateIlluskanName,
    celtic: generateCelticName,
    ffolk: generateCelticName,
    elven: generateCelticName,
    halfling: generateCelticName,
    drow: generateDrowName,
    dwarven: generateDwarvenName,
    dwarf: generateDwarvenName,
    gnome: generateDwarvenName,
    orc: generateOrcName,
    orcish: generateOrcName,
    turmic: generateTurmicName,
    lantanese: generateTurmicName
};

/**
 * Generate a procedural name for a specific culture/region
 * For regions: randomly selects from the cultures within that region
 * For specific cultures: uses that culture's generator
 * 
 * @param {string} region - The region or culture name
 * @param {string} gender - "male" or "female"
 * @returns {string} A procedurally generated name
 */
export function generateProceduralName(region, gender = "male") {
    const normalizedRegion = (region || "heartlands").toLowerCase().replace(/\s+/g, "_");

    // Check if it's a region (pick random culture from that region)
    if (regionCultures[normalizedRegion]) {
        const generators = regionCultures[normalizedRegion];
        const generator = randomChoice(generators);
        return generator(gender);
    }

    // Check if it's a specific culture
    if (cultureGenerators[normalizedRegion]) {
        return cultureGenerators[normalizedRegion](gender);
    }

    // Default to Chondathan
    return generateChondathanName(gender);
}


/**
 * Generate a full name with optional surname
 * 
 * @param {string} region - The region or culture name
 * @param {string} gender - "male" or "female"
 * @param {boolean} includeSurname - Whether to include a surname
 * @returns {string} A full procedurally generated name
 */
export function generateFullProceduralName(region, gender = "male", includeSurname = true) {
    const firstName = generateProceduralName(region, gender);

    if (!includeSurname || Math.random() > 0.7) {
        return firstName;
    }

    const normalizedRegion = (region || "heartlands").toLowerCase().replace(/\s+/g, "_");

    // Generate surname based on region
    let surname = "";

    if (normalizedRegion === "heartlands" || normalizedRegion === "chondathan") {
        surname = randomChoice(chondathan.surnames) + randomChoice(chondathan.surnameEnds);
    } else if (normalizedRegion === "calimshan" || normalizedRegion === "alzhedo") {
        if (Math.random() < 0.3) {
            surname = randomChoice(alzhedo.prefixWords) + randomChoice(alzhedo.surnames);
        } else {
            surname = randomChoice(alzhedo.surnames);
        }
    } else if (normalizedRegion === "icewind_dale" || normalizedRegion === "illuskan") {
        surname = randomChoice(illuskan.surnames) + randomChoice(illuskan.surnameEnds);
    } else if (normalizedRegion === "moonshae" || normalizedRegion === "celtic") {
        surname = randomChoice(celtic.surnames) + randomChoice(celtic.surnameEnds);
    } else if (normalizedRegion === "dungeons" || normalizedRegion === "drow") {
        surname = randomChoice(drow.housePrefixes) + randomChoice(drow.houseSuffixes);
    } else if (normalizedRegion === "dwarven" || normalizedRegion === "dwarf") {
        surname = randomChoice(dwarven.clanPrefixes) + randomChoice(dwarven.clanSuffixes);
    } else if (normalizedRegion === "orc" || normalizedRegion === "orcish") {
        surname = randomChoice(orc.clanNames);
    } else if (normalizedRegion === "cities" || normalizedRegion === "turmic") {
        surname = randomChoice(turmic.surnames);
    }

    return surname ? `${firstName} ${surname}` : firstName;
}

// Export individual generators for direct use
export {
    generateChondathanName,
    generateAlzhedoName,
    generateMulhorandName,
    generateIlluskanName,
    generateRashemiName,
    generateCelticName,
    generateDrowName,
    generateDwarvenName,
    generateOrcName,
    generateTurmicName
};

export default { generateProceduralName, generateFullProceduralName };
