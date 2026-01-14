// new_encounter_system.js
import CR_XP_TABLE from './data/cr_xp.json';
import DRAGONS from './data/dragon.json';
import LEGENDARY from './data/legendary.json';
import MOUNTS from './data/mounts.json';
import RIDERS from './data/riders.json';
import MONSTERS_BY_CR from './data/enc_by_cr.json';
import REGION_MONSTERS from './data/region_monsters.json';
import CROSS_REGION from './data/cross_region_encounters.json';

// Helper function to get random element from array
function getRandomElement(array) {
  if (!array || array.length === 0) return null;
  return array[Math.floor(Math.random() * array.length)];
}

// Get monsters from a specific region by CR
function getRegionMonstersByCR(cr, region) {
  const crString = String(cr);
  const regionData = REGION_MONSTERS[region];
  if (!regionData) return [];

  const monsters = regionData[crString];
  if (!monsters || !Array.isArray(monsters)) return [];

  return monsters.map(name => ({ Name: name, CR: crString, Region: region }));
}

// Determine which region to pull monsters from, with cross-regional chance
function pickEncounterRegion(primaryRegion) {
  const crossRegionData = CROSS_REGION.regions[primaryRegion];
  if (!crossRegionData) return primaryRegion;

  const roll = Math.random() * 100;
  let cumulative = 0;

  for (const [otherRegion, chance] of Object.entries(crossRegionData)) {
    cumulative += chance;
    if (roll < cumulative) {
      return otherRegion;
    }
  }

  // No cross-regional encounter, use primary region
  return primaryRegion;
}


// Get adjacent CRs for fallback when exact CR has no monsters
const CR_ORDER = ['0', '1/8', '1/4', '1/2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '30'];

function getAdjacentCRs(cr) {
  const crString = String(cr);
  const index = CR_ORDER.indexOf(crString);
  if (index === -1) return [];

  const adjacent = [];
  // Try one CR lower first, then one higher
  if (index > 0) adjacent.push(CR_ORDER[index - 1]);
  if (index < CR_ORDER.length - 1) adjacent.push(CR_ORDER[index + 1]);
  return adjacent;
}

// Region-specific dragon types (patterns to match dragon names)
const REGION_DRAGONS = {
  icewind: ['White', 'Kobold', 'Remorhaz', 'Dracolich'],
  heartlands: ['Red', 'Black', 'Dracolich'],
  calimshan: ['Blue', 'Dragon Turtle', 'Dragon Tortoise', 'Spirit'],
  dungeon: ['Red', 'Deep', 'Dracolich'],
  cities: ['Silver'],
  moonshae: ['Green', 'Dragon Turtle', 'Dragon Tortoise']
};

// Get dragons from DRAGONS array filtered by region
function getRegionDragonsByCR(cr, region) {
  const crString = String(cr);
  const regionPatterns = REGION_DRAGONS[region];
  if (!regionPatterns) return [];

  return DRAGONS.filter(dragon => {
    if (String(dragon.CR) !== crString) return false;
    // Check if dragon name contains any of the region patterns
    return regionPatterns.some(pattern => dragon.Name.includes(pattern));
  });
}

// Helper function to get monsters by CR from any source
function getMonstersByCR(cr, source = 'all', theme = 'Any') {
  const crString = String(cr);

  if (source === 'dragons') {
    return DRAGONS.filter(dragon => String(dragon.CR) === crString);
  }

  if (source === 'legendary') {
    return LEGENDARY.filter(legendary => String(legendary.CR) === crString);
  }

  if (source === 'mounts') {
    return MOUNTS.filter(mount => String(mount.CR) === crString);
  }

  if (source === 'riders') {
    return RIDERS.filter(rider => String(rider.CR) === crString);
  }

  if (source === 'original') {
    const crData = MONSTERS_BY_CR.find(entry => entry.challenge_rating === crString);
    if (crData) {
      if (theme === 'Any') {
        // Return all monsters from all themes
        return Object.values(crData)
          .filter(value => Array.isArray(value))
          .flat()
          .map(name => ({ Name: name, CR: crString, Theme: 'Mixed' }));
      } else {
        // Return monsters from specific theme only
        const themeMonsters = crData[theme];
        if (themeMonsters && Array.isArray(themeMonsters)) {
          return themeMonsters.map(name => ({ Name: name, CR: crString, Theme: theme }));
        }
      }
    }
  }

  return [];
}

// Find the best CR that fits within a budget
function findBestCR(budget) {
  let bestCR = null;
  let bestCRXP = 0;

  for (let crString in CR_XP_TABLE) {
    const xpValue = CR_XP_TABLE[crString];
    if (xpValue <= budget && xpValue > bestCRXP) {
      bestCR = crString;
      bestCRXP = xpValue;
    }
  }

  return { cr: bestCR, xp: bestCRXP };
}

/**
 * Generate encounter using the 6-template system
 */
export function generateNewEncounter(totalXP, levels, partySize, theme = 'Any', region = null) {
  // Use "Mixed" theme when "Any" is requested
  let actualTheme = theme === 'Any' ? 'Mixed' : theme;

  // Select Template randomly (1-6)
  const templateRoll = Math.floor(Math.random() * 6) + 1;

  switch (templateRoll) {
    case 1: // Solo - 1 Dragon or Legendary
      return generateSolo(totalXP, actualTheme, region);

    case 2: // Skirmish - Half Party Size
      const skirmishCount = Math.max(1, Math.floor(partySize / 2));
      return generateGroup(totalXP, skirmishCount, region, 'Skirmish');

    case 3: // Standard - Party Size
      return generateGroup(totalXP, partySize, region, 'Standard');

    case 4: // Elite Group - 1 Boss + Half Party Minions
      const eliteMinions = Math.max(1, Math.floor(partySize / 2));
      return generateBossMinions(totalXP, eliteMinions, region, 'Elite Group');

    case 5: // Horde - Double Party Size
      return generateGroup(totalXP, partySize * 2, region, 'Horde');

    case 6: // Boss Mob - 1 Boss + Party Size Minions
      return generateBossMinions(totalXP, partySize, region, 'Boss Mob');

    default:
      return generateGroup(totalXP, partySize, region, 'Standard (Fallback)');
  }
}

// Template 1: Solo Dragon or Legendary
function generateSolo(totalXP, actualTheme, region = null) {
  const bestFit = findBestCR(totalXP);
  if (!bestFit.cr) {
    return { error: 'No dragon or legendary creature fits budget' };
  }

  const sourceRegion = region ? pickEncounterRegion(region) : 'heartlands';

  // Try region specific dragons first
  let allOptions = getRegionDragonsByCR(bestFit.cr, sourceRegion);

  // If none, try adjacent CRs
  if (allOptions.length === 0) {
    const adjacentCRs = getAdjacentCRs(bestFit.cr);
    for (const adjCR of adjacentCRs) {
      allOptions = getRegionDragonsByCR(adjCR, sourceRegion);
      if (allOptions.length > 0) break;
    }
  }

  // Also try Legendaries
  const regionLegendaries = getRegionMonstersByCR(bestFit.cr, sourceRegion)
    .filter(m => m.Name.includes('Dragon') || m.Name.includes('Remorhaz') ||
      m.Name.includes('Dracolich') || m.Name.includes('Turtle') ||
      m.Name.includes('Lich') || m.Name.includes('Vampire')); // Expanded legendary keywords

  allOptions = [...allOptions, ...regionLegendaries];

  // Also try general Legendary file if needed and desperate (filtered by theme/region if we had those tags, but we assume pure CR for now)
  if (allOptions.length === 0) {
    const globalLegendaries = getMonstersByCR(bestFit.cr, 'legendary');
    allOptions = [...globalLegendaries];
  }

  if (allOptions.length === 0) {
    return { error: `No solo found for CR ${bestFit.cr} in ${sourceRegion}` };
  }

  const chosen = getRandomElement(allOptions);
  return {
    category: 'Solo',
    quantity: 1,
    monsters: [chosen],
    totalXP: bestFit.xp,
    description: `${chosen.Name} (CR ${chosen.CR})`
  };
}

// Templates 2, 3, 5: Group (One monster type)
function generateGroup(totalXP, count, region, typeName) {
  const xpPerCreature = totalXP / count;
  const bestFit = findBestCR(xpPerCreature);

  if (!bestFit.cr) return { error: `No creature fits budget for ${typeName}` };

  const sourceRegion = region ? pickEncounterRegion(region) : 'heartlands';
  let candidates = getRegionMonstersByCR(bestFit.cr, sourceRegion);

  // Fallback to adjacent CRs
  if (candidates.length === 0) {
    const adjacentCRs = getAdjacentCRs(bestFit.cr);
    for (const adjCR of adjacentCRs) {
      candidates = getRegionMonstersByCR(adjCR, sourceRegion);
      if (candidates.length > 0) break;
    }
  }

  // Fallback to general list if region empty (shouldn't happen with cleanup, but safe)
  if (candidates.length === 0) {
    candidates = getMonstersByCR(bestFit.cr, 'original');
  }

  if (candidates.length === 0) {
    return { error: `No candidates found for ${typeName} CR ${bestFit.cr}` };
  }

  const chosenOne = getRandomElement(candidates);

  return {
    category: typeName,
    quantity: count,
    monsters: Array(count).fill(chosenOne),
    totalXP: bestFit.xp * count,
    description: `${count}× ${chosenOne.Name} (CR ${chosenOne.CR})`
  };
}

// Templates 4, 6: Boss + Minions
function generateBossMinions(totalXP, minionCount, region, typeName) {
  const bossXP = totalXP * 0.5;
  const minionsTotalXP = totalXP * 0.5;
  const xpPerMinion = minionsTotalXP / minionCount;

  // 1. Select Boss
  const bossCR = findBestCR(bossXP);
  // 2. Select Minions
  const minionCR = findBestCR(xpPerMinion);

  if (!bossCR.cr || !minionCR.cr) return { error: `Budget too low for ${typeName}` };

  const sourceRegion = region ? pickEncounterRegion(region) : 'heartlands';

  // Get Boss Candidates
  let bossCandidates = getRegionMonstersByCR(bossCR.cr, sourceRegion);
  if (bossCandidates.length === 0) {
    // Try adjacent for boss
    const adjacentCRs = getAdjacentCRs(bossCR.cr);
    for (const adjCR of adjacentCRs) {
      bossCandidates = getRegionMonstersByCR(adjCR, sourceRegion);
      if (bossCandidates.length > 0) break;
    }
  }

  // Get Minion Candidates
  let minionCandidates = getRegionMonstersByCR(minionCR.cr, sourceRegion);
  if (minionCandidates.length === 0) {
    // Try adjacent for minions
    const adjacentCRs = getAdjacentCRs(minionCR.cr);
    for (const adjCR of adjacentCRs) {
      minionCandidates = getRegionMonstersByCR(adjCR, sourceRegion);
      if (minionCandidates.length > 0) break;
    }
  }

  if (bossCandidates.length === 0 || minionCandidates.length === 0) {
    return { error: `Insufficient monsters for ${typeName} in ${sourceRegion}` };
  }

  const boss = getRandomElement(bossCandidates);
  const minionType = getRandomElement(minionCandidates);

  const monsters = [boss, ...Array(minionCount).fill(minionType)];

  return {
    category: typeName,
    quantity: monsters.length,
    monsters: monsters,
    totalXP: bossCR.xp + (minionCR.xp * minionCount),
    description: `1× ${boss.Name} (Boss, CR ${boss.CR}) + ${minionCount}× ${minionType.Name} (Minions, CR ${minionType.CR})`
  };
}