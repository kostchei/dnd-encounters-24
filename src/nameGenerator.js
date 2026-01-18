/**
 * Faerun Name Generator
 * 
 * Generates contextually appropriate names for creatures in Forgotten Realms encounters.
 * 
 * Features:
 * - Region-based name selection (Heartlands, Calimshan, Moonshae, Cities, Dungeons, Icewind Dale)
 * - 50% from fixed lists, 50% procedurally generated
 * - Male/female variants
 * - CR-based complexity:
 *   - CR < 4: 85% short names (single name only)
 *   - CR >= 10: 50% chance of title
 *   - Higher CR = more elaborate names
 * - Faction title integration (random format: before or after name)
 * - Dragon name generation with type-appropriate patterns
 * - Legendary beast naming
 */

import regionNames from './data/region_names.json';
import factionNames from './data/faction_names.json';
import dragonNames from './data/dragon_names.json';
import { generateProceduralName } from './nameGenerators/faerunNames';

// Utility functions
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const coinFlip = (probability = 0.5) => Math.random() < probability;

/**
 * Normalize region names to match our data keys
 */
function normalizeRegion(region) {
    if (!region) return 'heartlands';

    const normalized = region.toLowerCase().replace(/\s+/g, '_');
    const mappings = {
        'icewind dale': 'icewind_dale',
        'icewindale': 'icewind_dale',
        'icewind': 'icewind_dale',
        'calimshan': 'calimshan',
        'calimport': 'calimshan',
        'heartlands': 'heartlands',
        'sword coast': 'heartlands',
        'swordcoast': 'heartlands',
        'moonshae': 'moonshae',
        'moonshaes': 'moonshae',
        'cities': 'cities',
        'city': 'cities',
        'waterdeep': 'cities',
        'baldurs gate': 'cities',
        'dungeons': 'dungeons',
        'dungeon': 'dungeons',
        'underdark': 'dungeons'
    };

    return mappings[normalized] || normalized;
}

/**
 * Determine name complexity based on CR
 * - CR < 4: 85% short, 15% medium
 * - CR 4-9: 50% medium, 50% full
 * - CR >= 10: 50% full with title, 50% full
 */
function determineNameComplexity(cr) {
    const numCR = parseFloat(cr) || 0;

    if (numCR < 4) {
        return coinFlip(0.85) ? 'short' : 'medium';
    } else if (numCR < 10) {
        return coinFlip(0.5) ? 'medium' : 'full';
    } else {
        return coinFlip(0.5) ? 'full_with_title' : 'full';
    }
}

/**
 * Get a first name - 50% from lists, 50% procedurally generated
 * 
 * @param {string} region - Normalized region name
 * @param {string} gender - 'male' or 'female'
 * @returns {string} A first name
 */
function getFirstName(region, gender) {
    const regionData = regionNames[region] || regionNames.heartlands;
    const names = regionData[gender] || regionData.male || [];

    // 50/50 split: list vs procedural
    if (names.length > 0 && coinFlip(0.5)) {
        // Pick from list
        return randomChoice(names);
    } else {
        // Generate procedurally
        return generateProceduralName(region, gender);
    }
}


/**
 * Get a title appropriate for the CR
 */
function getTitle(cr, region) {
    const numCR = parseFloat(cr) || 0;

    const militaryTitles = ['Captain', 'Commander', 'Warlord', 'Marshal', 'Champion'];
    const magesTitles = ['Archmage', 'High Mage', 'Sorcerer Supreme', 'Wizard', 'Magister'];
    const nobleTitles = ['Lord', 'Lady', 'Duke', 'Duchess', 'Baron', 'Baroness', 'Count', 'Countess'];
    const infamousTitles = ['the Cruel', 'the Merciless', 'the Terrible', 'the Dread', 'the Feared'];
    const heroicTitles = ['the Bold', 'the Brave', 'the Mighty', 'the Valiant', 'the Just'];

    // Higher CR = more impressive titles
    if (numCR >= 20) {
        return randomChoice([...infamousTitles, 'the Legendary', 'Destroyer of Kingdoms', 'the Eternal']);
    } else if (numCR >= 15) {
        return randomChoice([...magesTitles, ...infamousTitles, 'the Ancient', 'the Undying']);
    } else if (numCR >= 10) {
        return randomChoice([...militaryTitles, ...nobleTitles, ...heroicTitles]);
    } else {
        return randomChoice([...militaryTitles.slice(0, 2), ...heroicTitles.slice(0, 2)]);
    }
}

/**
 * Main name generation function
 * 
 * @param {Object} options
 * @param {string} options.region - Region (heartlands, calimshan, moonshae, cities, dungeons, icewind_dale)
 * @param {string} options.gender - 'male' or 'female'
 * @param {number|string} options.cr - Challenge Rating
 * @param {string} options.faction - Optional faction name
 * @param {string} options.creatureType - Optional creature type for special handling
 * @param {boolean} options.forceTitle - Force include a title
 * @param {boolean} options.forceShort - Force a short name
 * @returns {string} Generated name
 */
export function generateName(options = {}) {
    const {
        region = 'heartlands',
        gender = coinFlip() ? 'male' : 'female',
        cr = 1,
        faction = null,
        creatureType = null,
        forceTitle = false,
        forceShort = false
    } = options;

    const normalizedRegion = normalizeRegion(region);
    const regionData = regionNames[normalizedRegion] || regionNames.heartlands;

    // Handle special creature types
    if (creatureType) {
        const lowerType = creatureType.toLowerCase();
        if (lowerType.includes('dragon')) {
            return generateDragonName(lowerType, cr, normalizedRegion);
        }
    }

    // Determine complexity
    let complexity = forceShort ? 'short' : (forceTitle ? 'full_with_title' : determineNameComplexity(cr));

    // Get base name using 50/50 list vs procedural split
    const genderKey = gender === 'female' ? 'female' : 'male';
    let firstName = getFirstName(normalizedRegion, genderKey);


    // Build name based on complexity
    let fullName = firstName;

    if (complexity === 'medium' || complexity === 'full' || complexity === 'full_with_title') {
        // Add surname
        const surnames = regionData.surnames || [];
        if (surnames.length > 0 && coinFlip(0.7)) {
            fullName += ' ' + randomChoice(surnames);
        }
    }

    // Add faction title
    if (faction && factionNames[faction]) {
        const factionData = factionNames[faction];
        const titles = factionData.titles || [];
        if (titles.length > 0) {
            const title = randomChoice(titles);
            // Random format: title before or after name
            if (coinFlip()) {
                fullName = title + ' ' + fullName;
            } else {
                fullName = fullName + ' ' + title;
            }
        }
    }
    // Add generic title for high CR without faction
    else if (complexity === 'full_with_title') {
        const title = getTitle(cr, normalizedRegion);
        // Titles starting with "the" go after name
        if (title.startsWith('the ') || title.startsWith('the')) {
            fullName = fullName + ' ' + title;
        } else {
            // Role titles can go before
            if (coinFlip()) {
                fullName = title + ' ' + fullName;
            } else {
                fullName = fullName + ', ' + title;
            }
        }
    }

    return fullName;
}

/**
 * Generate a dragon name
 * 
 * @param {string} dragonType - Dragon type (e.g., 'red dragon', 'ancient gold dragon')
 * @param {number|string} cr - Challenge Rating
 * @param {string} region - Region for flavor
 * @returns {string} Generated dragon name
 */
export function generateDragonName(dragonType, cr, region = 'heartlands') {
    const numCR = parseFloat(cr) || 10;
    const lowerType = (dragonType || '').toLowerCase();

    // Determine dragon color
    let color = 'red'; // default
    const colors = ['red', 'blue', 'green', 'black', 'white', 'gold', 'silver', 'bronze', 'copper', 'brass', 'amethyst', 'emerald', 'sapphire', 'topaz', 'crystal'];
    for (const c of colors) {
        if (lowerType.includes(c)) {
            color = c;
            break;
        }
    }

    // Determine age category
    let age = 'adult';
    if (lowerType.includes('ancient')) age = 'ancient';
    else if (lowerType.includes('adult')) age = 'adult';
    else if (lowerType.includes('young')) age = 'young';
    else if (lowerType.includes('wyrmling')) age = 'wyrmling';
    else if (numCR >= 20) age = 'ancient';
    else if (numCR >= 13) age = 'adult';
    else if (numCR >= 7) age = 'young';
    else age = 'wyrmling';

    // Determine if chromatic, metallic, or gem
    const chromaticColors = ['red', 'blue', 'green', 'black', 'white'];
    const metallicColors = ['gold', 'silver', 'bronze', 'copper', 'brass'];
    const gemColors = ['amethyst', 'emerald', 'sapphire', 'topaz', 'crystal'];

    let dragonCategory;
    if (chromaticColors.includes(color)) dragonCategory = 'chromatic';
    else if (metallicColors.includes(color)) dragonCategory = 'metallic';
    else if (gemColors.includes(color)) dragonCategory = 'gem';
    else dragonCategory = 'chromatic';

    // Try to get a famous name first for higher CR
    const famousNames = dragonNames.famous?.[color] || [];
    if (famousNames.length > 0 && numCR >= 15 && coinFlip(0.3)) {
        const name = randomChoice(famousNames);
        const titles = dragonNames.titles?.[age] || [];
        if (titles.length > 0 && (age === 'ancient' || coinFlip(0.5))) {
            return name + ' ' + randomChoice(titles);
        }
        return name;
    }

    // Generate procedural name
    const patterns = dragonNames.patterns?.[dragonCategory] || dragonNames.patterns?.chromatic;
    const prefix = randomChoice(patterns?.prefixes || ['Drag']);
    const suffix = randomChoice(patterns?.suffixes || ['on']);
    let name = prefix + suffix;

    // Add title based on age/CR
    const titles = dragonNames.titles?.[age] || [];
    const crTitles = dragonNames.titles_by_cr || {};

    // Ancient dragons almost always have titles
    if (age === 'ancient' || numCR >= 17) {
        const titlePool = [...titles, ...(crTitles['20'] || []), ...(crTitles['24'] || [])];
        if (titlePool.length > 0) {
            name += ' ' + randomChoice(titlePool);
        }
    }
    // Adult dragons often have titles
    else if (age === 'adult' || numCR >= 10) {
        if (coinFlip(0.6)) {
            const titlePool = [...titles, ...(crTitles['13'] || []), ...(crTitles['17'] || [])];
            if (titlePool.length > 0) {
                name += ' ' + randomChoice(titlePool);
            }
        }
    }
    // Young dragons occasionally have titles
    else if (age === 'young' && coinFlip(0.3)) {
        if (titles.length > 0) {
            name += ' ' + randomChoice(titles);
        }
    }

    return name;
}

/**
 * Generate a name for a legendary beast/creature
 * 
 * @param {string} creatureType - Type of creature (e.g., 'beholder', 'mind flayer', 'aboleth')
 * @param {number|string} cr - Challenge Rating
 * @param {string} region - Region for flavor
 * @returns {string} Generated name
 */
export function generateLegendaryName(creatureType, cr, region = 'dungeons') {
    const numCR = parseFloat(cr) || 10;
    const lowerType = (creatureType || '').toLowerCase();

    // Special naming patterns by creature type
    const creaturePatterns = {
        beholder: {
            prefixes: ['Xanat', 'Kar', 'Zelek', 'Irith', 'Bozk', 'Uzrk', 'Gzok', 'Thrk', 'Xznt', 'Ygrt'],
            suffixes: ['har', 'gor', 'mel', 'zak', 'orn', 'yx', 'ax', 'ix', 'ox', 'ex'],
            titles: ['the All-Seeing', 'Eye Tyrant', 'the Many-Eyed', 'Lord of Eyes', 'the Paranoid']
        },
        'mind flayer': {
            prefixes: ['Quar', 'Illith', 'Zall', 'Ulph', 'Yth', 'Xel', 'Mith', 'Neth', 'Kel', 'Zeph'],
            suffixes: ['thid', 'rac', 'ael', 'uar', 'ex', 'ox', 'ax', 'ir', 'ur', 'ar'],
            titles: ['the Devourer', 'Mindtaker', 'the Cerebrate', 'Thought Tyrant', 'the Hungry Mind']
        },
        aboleth: {
            prefixes: ['Glor', 'Xur', 'Nth', 'Yth', 'Zal', 'Qux', 'Vex', 'Wex', 'Rex', 'Tex'],
            suffixes: ['uth', 'esh', 'aal', 'oth', 'ith', 'ath', 'eth', 'uth', 'oph', 'aph'],
            titles: ['the Ancient', 'the Eternal', 'Keeper of Secrets', 'the Dreaming One', 'Memory of Aeons']
        },
        lich: {
            prefixes: ['Acer', 'Vec', 'Szass', 'Zant', 'Xev', 'Krow', 'Mork', 'Thul', 'Drak', 'Vel'],
            suffixes: ['erak', 'na', 'tam', 'ul', 'ix', 'ax', 'or', 'ar', 'ir', 'ur'],
            titles: ['the Undying', 'Lord of the Dead', 'Necromancer Supreme', 'the Eternal', 'Deathless One']
        },
        vampire: {
            prefixes: ['Strahd', 'Kass', 'Vlad', 'Drac', 'Vor', 'Ser', 'Bar', 'Count', 'Lord', 'Duke'],
            suffixes: ['von', 'eth', 'mir', 'islav', 'ovich', 'escu', 'borne', 'fang', 'blood', 'night'],
            titles: ['the Immortal', 'Lord of Night', 'the Crimson', 'Blood Lord', 'the Ancient']
        },
        demon: {
            prefixes: ['Orc', 'Dem', 'Graz', 'Bal', 'Fraz', 'Yeeno', 'Juibl', 'Zuggt', 'Bapho', 'Kost'],
            suffixes: ['us', 'zt', 'ogorgon', 'or', 'urb', 'ghu', 'ex', 'met', 'chtchie', 'yl'],
            titles: ['the Destroyer', 'Prince of Demons', 'Lord of the Abyss', 'the Ruinous', 'Bringer of Chaos']
        },
        devil: {
            prefixes: ['Asm', 'Baal', 'Disp', 'Geryon', 'Glass', 'Levist', 'Mamm', 'Mephist', 'Zariel'],
            suffixes: ['odeus', 'zebul', 'ater', 'ya', 'on', 'us', 'opheles', 'iel', 'ax'],
            titles: ['Lord of the Nine', 'Archduke of Hell', 'the Infernal', 'Prince of Lies', 'the Damned']
        }
    };

    // Find matching pattern
    let pattern = null;
    for (const [type, p] of Object.entries(creaturePatterns)) {
        if (lowerType.includes(type)) {
            pattern = p;
            break;
        }
    }

    // Default pattern for unknown legendary creatures
    if (!pattern) {
        pattern = {
            prefixes: ['Vor', 'Kal', 'Mor', 'Xen', 'Zar', 'Thar', 'Grim', 'Drak', 'Skar', 'Vex'],
            suffixes: ['ax', 'or', 'ul', 'ix', 'on', 'ar', 'eth', 'oth', 'ith', 'ath'],
            titles: ['the Terrible', 'the Ancient', 'the Dread', 'the Feared', 'the Legendary']
        };
    }

    // Generate name
    const prefix = randomChoice(pattern.prefixes);
    const suffix = randomChoice(pattern.suffixes);
    let name = prefix + suffix;

    // Add title based on CR
    if (numCR >= 20 || coinFlip(0.7)) {
        name += ' ' + randomChoice(pattern.titles);
    } else if (numCR >= 10 && coinFlip(0.5)) {
        name += ' ' + randomChoice(pattern.titles);
    }

    return name;
}

/**
 * Generate a name with faction affiliation
 * 
 * @param {string} factionName - Name of the faction
 * @param {string} region - Region for base name flavor
 * @param {string} gender - 'male' or 'female'
 * @param {number} cr - Challenge Rating
 * @returns {string} Generated name with faction title
 */
export function generateFactionMemberName(factionName, region = 'heartlands', gender = null, cr = 5) {
    const faction = factionNames[factionName];

    if (!faction) {
        return generateName({ region, gender, cr });
    }

    const chosenGender = gender || (coinFlip() ? 'male' : 'female');

    // Check if faction has specific names
    const factionSpecificNames = faction.names?.[chosenGender] || faction.names?.male || [];

    let baseName;
    if (factionSpecificNames.length > 0 && coinFlip(0.4)) {
        // Use faction-specific name sometimes
        baseName = randomChoice(factionSpecificNames);
    } else {
        // Use regional name
        baseName = generateName({ region, gender: chosenGender, cr, forceShort: true });
    }

    // Add surname sometimes
    const normalizedRegion = normalizeRegion(region);
    const regionData = regionNames[normalizedRegion] || regionNames.heartlands;
    const surnames = regionData.surnames || [];
    if (surnames.length > 0 && coinFlip(0.5)) {
        baseName += ' ' + randomChoice(surnames);
    }

    // Add faction title
    const titles = faction.titles || [];
    const epithets = faction.epithets || [];

    if (titles.length > 0) {
        const title = randomChoice(titles);

        // Higher CR gets epithets sometimes
        if (cr >= 10 && epithets.length > 0 && coinFlip(0.4)) {
            const epithet = randomChoice(epithets);
            // Format: "Name the Title, Epithet" or "Title Name, Epithet"
            if (coinFlip()) {
                baseName = baseName + ' ' + title + ', ' + epithet;
            } else {
                baseName = title + ' ' + baseName + ', ' + epithet;
            }
        } else {
            // Standard title format
            if (coinFlip()) {
                baseName = baseName + ' ' + title;
            } else {
                baseName = title + ' ' + baseName;
            }
        }
    }

    return baseName;
}

/**
 * Batch generate names for an encounter
 * 
 * @param {Array} creatures - Array of creature objects with { name, cr, type, count, region, faction }
 * @param {string} defaultRegion - Default region if not specified per creature
 * @returns {Array} Array of { originalName, generatedName, cr }
 */
export function generateEncounterNames(creatures, defaultRegion = 'heartlands') {
    return creatures.map(creature => {
        const {
            name: originalName,
            cr = 1,
            type: creatureType,
            region = defaultRegion,
            faction = null,
            count = 1
        } = creature;

        // Generate unique names for each creature in the group
        const generatedNames = [];
        for (let i = 0; i < count; i++) {
            let generatedName;

            // Check for special creature types
            const lowerName = (originalName || '').toLowerCase();
            const lowerType = (creatureType || '').toLowerCase();

            if (lowerName.includes('dragon') || lowerType.includes('dragon')) {
                generatedName = generateDragonName(originalName || creatureType, cr, region);
            } else if (['beholder', 'mind flayer', 'aboleth', 'lich', 'vampire', 'demon', 'devil'].some(t => lowerName.includes(t) || lowerType.includes(t))) {
                generatedName = generateLegendaryName(originalName || creatureType, cr, region);
            } else if (faction) {
                generatedName = generateFactionMemberName(faction, region, null, cr);
            } else {
                generatedName = generateName({ region, cr, creatureType });
            }

            generatedNames.push(generatedName);
        }

        return {
            originalName,
            generatedNames,
            cr
        };
    });
}

// Export all functions
const nameGenerator = {
    generateName,
    generateDragonName,
    generateLegendaryName,
    generateFactionMemberName,
    generateEncounterNames
};

export default nameGenerator;
