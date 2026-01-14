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
  calimshan: ['Blue', 'Dragon Turtle', 'Dragon Tortoise'],
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


// Helper function to get monsters by CR and theme from any source
function getMonstersByCR(cr, source = 'all', theme = 'Any') {
  const crString = String(cr);

  if (source === 'dragons') {
    let dragons = DRAGONS.filter(dragon => String(dragon.CR) === crString);
    if (theme !== 'Any') {
      dragons = dragons.filter(dragon => dragon.Theme === theme);
    }
    return dragons;
  }

  if (source === 'legendary') {
    let legendary = LEGENDARY.filter(legendary => String(legendary.CR) === crString);
    if (theme !== 'Any') {
      legendary = legendary.filter(legendary => legendary.Theme === theme);
    }
    return legendary;
  }

  if (source === 'mounts') {
    let mounts = MOUNTS.filter(mount => String(mount.CR) === crString);
    if (theme !== 'Any') {
      mounts = mounts.filter(mount => mount.Theme === theme);
    }
    return mounts;
  }

  if (source === 'riders') {
    let riders = RIDERS.filter(rider => String(rider.CR) === crString);
    if (theme !== 'Any') {
      riders = riders.filter(rider => rider.Theme === theme);
    }
    return riders;
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
 * Generate encounter using new category-based system
 * @param {number} totalXP - Total XP budget
 * @param {number[]} levels - Array of character levels  
 * @param {number} partySize - Number of characters
 * @param {string} theme - Campaign theme (Lolth, Vecna, BloodWar, Dragons, Off Arc, Any)
 * @param {string} region - Region ID for region-based monster selection (optional)
 * @returns {object} - Encounter result object
 */
export function generateNewEncounter(totalXP, levels, partySize, theme = 'Any', region = null) {
  // Calculate quantity range: 2 to 2×party size (max 10)
  const minQuantity = 2;
  const maxQuantity = Math.min(partySize * 2, 10);

  // If "Any" theme selected, pick a random specific theme for this encounter
  let actualTheme = theme;
  if (theme === 'Any') {
    const availableThemes = ['Lolth', 'Vecna', 'BloodWar', 'Dragons', 'Off Arc'];
    actualTheme = getRandomElement(availableThemes);
  }

  // Randomly select encounter category
  // Only use encounter categories that pull from regional tables
  const categories = ['dragon_legendary', 'groups', 'mixed_groups'];
  const selectedCategory = getRandomElement(categories);

  switch (selectedCategory) {
    case 'dragon_legendary':
      return generateDragonLegendary(totalXP, actualTheme, theme, region);

    case 'groups':
      return generateGroups(totalXP, minQuantity, maxQuantity, actualTheme, theme, region);

    case 'mixed_groups':
      return generateMixedGroups(totalXP, minQuantity, maxQuantity, actualTheme, theme, region);

    default:
      return { error: 'Unknown encounter category' };
  }
}


// Dragon or Legendary encounter (always 1 monster) - uses region-specific dragons
function generateDragonLegendary(totalXP, actualTheme, originalTheme, region = null) {
  const bestFit = findBestCR(totalXP);
  if (!bestFit.cr) {
    return { error: 'No dragon or legendary creature fits budget' };
  }

  const sourceRegion = region ? pickEncounterRegion(region) : 'heartlands';
  let allOptions = [];

  // Try region-specific dragons first
  allOptions = getRegionDragonsByCR(bestFit.cr, sourceRegion);

  // If no dragons at exact CR, try adjacent CRs
  if (allOptions.length === 0) {
    const adjacentCRs = getAdjacentCRs(bestFit.cr);
    for (const adjCR of adjacentCRs) {
      allOptions = getRegionDragonsByCR(adjCR, sourceRegion);
      if (allOptions.length > 0) break;
    }
  }

  // Also try legendaries from region monster table
  const regionLegendaries = getRegionMonstersByCR(bestFit.cr, sourceRegion)
    .filter(m => m.Name.includes('Dragon') || m.Name.includes('Remorhaz') ||
      m.Name.includes('Dracolich') || m.Name.includes('Turtle'));
  allOptions = [...allOptions, ...regionLegendaries];

  if (allOptions.length === 0) {
    return { error: `No regional dragon found for CR ${bestFit.cr} in ${sourceRegion}` };
  }

  const chosen = getRandomElement(allOptions);
  return {
    category: 'Dragon or Legendary',
    quantity: 1,
    monsters: [chosen],
    totalXP: bestFit.xp,
    description: `${chosen.Name} (CR ${chosen.CR})`,
    sourceRegion: sourceRegion
  };
}


// Mounts and Riders encounter
function generateMountsRiders(totalXP, minQuantity, maxQuantity, actualTheme, originalTheme) {
  const quantity = Math.floor(Math.random() * (maxQuantity - minQuantity + 1)) + minQuantity;
  let remainingXP = totalXP;

  // Pre-select up to 2 mount types and 2 rider types for the entire encounter
  const availableMountCRs = [...new Set(MOUNTS.map(m => m.CR))].sort((a, b) => {
    const aXP = CR_XP_TABLE[a] || 0;
    const bXP = CR_XP_TABLE[b] || 0;
    return bXP - aXP; // Sort by XP descending
  });

  const availableRiderCRs = [...new Set(RIDERS.map(r => r.CR))].sort((a, b) => {
    const aXP = CR_XP_TABLE[a] || 0;
    const bXP = CR_XP_TABLE[b] || 0;
    return bXP - aXP; // Sort by XP descending
  });

  // Select 1-2 mount types that leave room for riders, filtered by theme
  // Limit mount XP to maximum 70% of total budget to ensure room for riders
  const maxMountXP = totalXP * 0.7;
  const selectedMountTypes = [];
  for (const cr of availableMountCRs) {
    const crXP = CR_XP_TABLE[cr];
    if (crXP <= maxMountXP && selectedMountTypes.length < 2) {
      const mountsOfThisCR = getMonstersByCR(cr, 'mounts', actualTheme);
      if (mountsOfThisCR.length > 0) {
        selectedMountTypes.push({
          cr: cr,
          xp: crXP,
          creatures: mountsOfThisCR
        });
      }
    }
  }

  // Select 1-2 rider types that leave room for mounts, filtered by theme
  // Limit rider XP to maximum 70% of total budget to ensure room for mounts  
  const maxRiderXP = totalXP * 0.7;
  const selectedRiderTypes = [];
  for (const cr of availableRiderCRs) {
    const crXP = CR_XP_TABLE[cr];
    if (crXP <= maxRiderXP && selectedRiderTypes.length < 2) {
      const ridersOfThisCR = getMonstersByCR(cr, 'riders', actualTheme);
      if (ridersOfThisCR.length > 0) {
        selectedRiderTypes.push({
          cr: cr,
          xp: crXP,
          creatures: ridersOfThisCR
        });
      }
    }
  }

  const results = [];
  let totalUsedXP = 0;
  let creaturesAdded = 0;
  let hasMount = false;
  let hasRider = false;

  // FIRST: Guarantee at least one mount+rider pair if we have both types available
  if (selectedMountTypes.length > 0 && selectedRiderTypes.length > 0) {
    // Find the best combination that fits in remaining XP for the mandatory pair
    let bestCombo = null;
    let bestComboXP = 0;

    // Try all combinations of selected mount/rider types
    for (const mountType of selectedMountTypes) {
      for (const riderType of selectedRiderTypes) {
        const totalComboXP = mountType.xp + riderType.xp;
        if (totalComboXP <= remainingXP && totalComboXP > bestComboXP) {
          bestCombo = { mountType, riderType };
          bestComboXP = totalComboXP;
        }
      }
    }

    if (bestCombo) {
      // Add the mandatory mount+rider pair
      const mountRatio = Math.random() < 0.5 ? (2 / 3) : (1 / 3);
      const riderRatio = 1 - mountRatio;

      const mount = getRandomElement(bestCombo.mountType.creatures);
      const rider = getRandomElement(bestCombo.riderType.creatures);

      results.push({
        mount,
        rider,
        type: 'pair',
        mountRatio,
        riderRatio,
        mountCR: bestCombo.mountType.cr,
        riderCR: bestCombo.riderType.cr
      });
      totalUsedXP += bestComboXP;
      remainingXP -= bestComboXP;
      creaturesAdded++;
      hasMount = true;
      hasRider = true;
    }
  }

  // If we couldn't create a pair but need both types, try to ensure we get at least one of each
  // Prioritize cheaper options to ensure we can afford both
  if (!hasMount && selectedMountTypes.length > 0) {
    // Reserve some XP for a rider if we don't have one yet
    const reserveXP = !hasRider && selectedRiderTypes.length > 0 ?
      Math.min(selectedRiderTypes[selectedRiderTypes.length - 1].xp, remainingXP * 0.3) : 0;
    const availableForMount = remainingXP - reserveXP;

    const bestMount = selectedMountTypes.find(mt => mt.xp <= availableForMount);
    if (bestMount) {
      const mount = getRandomElement(bestMount.creatures);
      results.push({
        mount,
        type: 'mount_only',
        mountCR: bestMount.cr
      });
      totalUsedXP += bestMount.xp;
      remainingXP -= bestMount.xp;
      creaturesAdded++;
      hasMount = true;
    }
  }

  if (!hasRider && selectedRiderTypes.length > 0) {
    // Use cheapest available rider that fits
    const bestRider = selectedRiderTypes
      .filter(rt => rt.xp <= remainingXP)
      .sort((a, b) => a.xp - b.xp)[0]; // Get cheapest that fits

    if (bestRider) {
      const rider = getRandomElement(bestRider.creatures);
      results.push({
        rider,
        type: 'dismounted',
        riderCR: bestRider.cr
      });
      totalUsedXP += bestRider.xp;
      remainingXP -= bestRider.xp;
      creaturesAdded++;
      hasRider = true;
    }
  }

  // FALLBACK: If we still don't have a rider, try to find ANY rider that fits (ignore the 70% limit)
  if (!hasRider && remainingXP > 0) {
    // Get all available rider CRs for this theme, not limited by the 70% rule
    const fallbackRiderTypes = [];
    for (const cr of availableRiderCRs) {
      const crXP = CR_XP_TABLE[cr];
      if (crXP <= remainingXP) {
        const ridersOfThisCR = getMonstersByCR(cr, 'riders', actualTheme);
        if (ridersOfThisCR.length > 0) {
          fallbackRiderTypes.push({
            cr: cr,
            xp: crXP,
            creatures: ridersOfThisCR
          });
        }
      }
    }

    if (fallbackRiderTypes.length > 0) {
      // Use cheapest available rider
      const bestRider = fallbackRiderTypes.sort((a, b) => a.xp - b.xp)[0];
      const rider = getRandomElement(bestRider.creatures);
      results.push({
        rider,
        type: 'dismounted',
        riderCR: bestRider.cr
      });
      totalUsedXP += bestRider.xp;
      remainingXP -= bestRider.xp;
      creaturesAdded++;
      hasRider = true;
    }
  }

  // NOW fill the remaining slots with additional creatures
  while (creaturesAdded < quantity && remainingXP > 0) {
    // Decide if this is a mount+rider pair or just a rider (prefer pairs when possible)
    const isPair = Math.random() < 0.7; // 70% chance of mounted

    if (isPair && selectedMountTypes.length > 0 && selectedRiderTypes.length > 0) {
      // Find the best combination that fits in remaining XP
      let bestCombo = null;
      let bestComboXP = 0;

      // Try all combinations of selected mount/rider types
      for (const mountType of selectedMountTypes) {
        for (const riderType of selectedRiderTypes) {
          const totalComboXP = mountType.xp + riderType.xp;
          if (totalComboXP <= remainingXP && totalComboXP > bestComboXP) {
            bestCombo = { mountType, riderType };
            bestComboXP = totalComboXP;
          }
        }
      }

      if (bestCombo) {
        // Randomly decide XP allocation: either 1/3 mount + 2/3 rider OR 2/3 mount + 1/3 rider
        const mountGetsMore = Math.random() < 0.5; // 50% chance each way
        const mountRatio = mountGetsMore ? (2 / 3) : (1 / 3);
        const riderRatio = mountGetsMore ? (1 / 3) : (2 / 3);

        const mount = getRandomElement(bestCombo.mountType.creatures);
        const rider = getRandomElement(bestCombo.riderType.creatures);

        results.push({
          mount,
          rider,
          type: 'pair',
          mountRatio,
          riderRatio,
          mountCR: bestCombo.mountType.cr,
          riderCR: bestCombo.riderType.cr
        });
        totalUsedXP += bestComboXP;
        remainingXP -= bestComboXP;
        creaturesAdded++;
      } else {
        // Can't afford any pairs, try dismounted
        const currentXP = remainingXP; // Capture the value to avoid loop closure issue
        const bestRider = selectedRiderTypes.find(rt => rt.xp <= currentXP);
        if (bestRider) {
          const rider = getRandomElement(bestRider.creatures);
          results.push({
            rider,
            type: 'dismounted',
            riderCR: bestRider.cr
          });
          totalUsedXP += bestRider.xp;
          remainingXP -= bestRider.xp;
          creaturesAdded++;
        } else {
          break; // Can't afford anything
        }
      }
    } else if (selectedRiderTypes.length > 0) {
      // Just a rider (dismounted) - find best that fits
      const currentXP = remainingXP; // Capture the value to avoid loop closure issue
      const bestRider = selectedRiderTypes
        .filter(rt => rt.xp <= currentXP)
        .sort((a, b) => b.xp - a.xp)[0]; // Get highest XP that fits

      if (bestRider) {
        const rider = getRandomElement(bestRider.creatures);
        results.push({
          rider,
          type: 'dismounted',
          riderCR: bestRider.cr
        });
        totalUsedXP += bestRider.xp;
        remainingXP -= bestRider.xp;
        creaturesAdded++;
      } else {
        break; // Can't afford anything
      }
    } else {
      break; // No suitable types
    }
  }

  // If we still have significant XP left and room for more creatures, try to add more
  const maxCreatures = Math.min(maxQuantity, 10);
  while (results.length < maxCreatures && remainingXP > 0) {
    // Try to add the cheapest possible creature
    const currentXP = remainingXP; // Capture the value to avoid loop closure issue
    const cheapestRider = selectedRiderTypes
      .filter(rt => rt.xp <= currentXP)
      .sort((a, b) => a.xp - b.xp)[0]; // Get cheapest that fits

    if (cheapestRider && cheapestRider.xp <= currentXP) {
      const rider = getRandomElement(cheapestRider.creatures);
      results.push({
        rider,
        type: 'dismounted',
        riderCR: cheapestRider.cr
      });
      totalUsedXP += cheapestRider.xp;
      remainingXP -= cheapestRider.xp;
    } else {
      break; // Can't afford anything else
    }
  }

  return {
    category: 'Mounts and Riders',
    quantity: results.length,
    monsters: results,
    totalXP: totalUsedXP,
    description: formatMountRiderDescription(results),
    mountTypes: selectedMountTypes.map(mt => mt.cr),
    riderTypes: selectedRiderTypes.map(rt => rt.cr),
    theme: originalTheme === 'Any' ? actualTheme : originalTheme
  };
}

// Groups encounter (same creature type) - uses region monster tables only
function generateGroups(totalXP, minQuantity, maxQuantity, actualTheme, originalTheme, region = null) {
  const quantity = Math.floor(Math.random() * (maxQuantity - minQuantity + 1)) + minQuantity;
  const xpPerCreature = totalXP / quantity;

  const bestFit = findBestCR(xpPerCreature);
  if (!bestFit.cr) {
    return { error: 'No creature fits per-creature budget for group' };
  }

  // Use region-based selection with cross-regional chance
  const sourceRegion = region ? pickEncounterRegion(region) : 'heartlands';
  let availableCreatures = getRegionMonstersByCR(bestFit.cr, sourceRegion);

  // If no creatures at exact CR, try adjacent CRs in the region
  if (availableCreatures.length === 0) {
    const adjacentCRs = getAdjacentCRs(bestFit.cr);
    for (const adjCR of adjacentCRs) {
      availableCreatures = getRegionMonstersByCR(adjCR, sourceRegion);
      if (availableCreatures.length > 0) break;
    }
  }

  if (availableCreatures.length === 0) {
    return { error: `No creatures found for CR ${bestFit.cr} in ${sourceRegion}` };
  }

  const chosenCreature = getRandomElement(availableCreatures);
  const totalUsedXP = bestFit.xp * quantity;

  return {
    category: 'Groups',
    quantity: quantity,
    monsters: Array(quantity).fill(chosenCreature),
    totalXP: totalUsedXP,
    description: `${quantity}× ${chosenCreature.Name} (CR ${chosenCreature.CR} each)`,
    sourceRegion: sourceRegion
  };
}



// Mixed Groups encounter (different creature types) - uses region monster tables only
function generateMixedGroups(totalXP, minQuantity, maxQuantity, actualTheme, originalTheme, region = null) {
  const quantity = Math.floor(Math.random() * (maxQuantity - minQuantity + 1)) + minQuantity;

  // Allocate XP: 40% to leader, 60% to minions
  const leaderXP = totalXP * 0.4;
  const minionXP = totalXP * 0.6;
  const minions = quantity - 1;
  const xpPerMinion = minions > 0 ? minionXP / minions : 0;

  const results = [];
  let totalUsedXP = 0;

  // Use region-based selection with cross-regional chance
  const sourceRegion = region ? pickEncounterRegion(region) : 'heartlands';

  // Get leader from region
  const leaderCR = findBestCR(leaderXP);
  if (leaderCR.cr) {
    let leaderCreatures = getRegionMonstersByCR(leaderCR.cr, sourceRegion);
    // Try adjacent CRs if no creatures at exact CR
    if (leaderCreatures.length === 0) {
      const adjacentCRs = getAdjacentCRs(leaderCR.cr);
      for (const adjCR of adjacentCRs) {
        leaderCreatures = getRegionMonstersByCR(adjCR, sourceRegion);
        if (leaderCreatures.length > 0) break;
      }
    }
    const leader = getRandomElement(leaderCreatures);
    if (leader) {
      results.push({ ...leader, role: 'leader' });
      totalUsedXP += leaderCR.xp;
    }
  }

  // Get minions from region
  if (minions > 0 && xpPerMinion > 0) {
    const minionCR = findBestCR(xpPerMinion);
    if (minionCR.cr) {
      let minionCreatures = getRegionMonstersByCR(minionCR.cr, sourceRegion);
      // Try adjacent CRs if no creatures at exact CR
      if (minionCreatures.length === 0) {
        const adjacentCRs = getAdjacentCRs(minionCR.cr);
        for (const adjCR of adjacentCRs) {
          minionCreatures = getRegionMonstersByCR(adjCR, sourceRegion);
          if (minionCreatures.length > 0) break;
        }
      }
      for (let i = 0; i < minions; i++) {
        const minion = getRandomElement(minionCreatures);
        if (minion) {
          results.push({ ...minion, role: 'minion' });
          totalUsedXP += minionCR.xp;
        }
      }
    }
  }

  return {
    category: 'Mixed Groups',
    quantity: results.length,
    monsters: results,
    totalXP: totalUsedXP,
    description: formatMixedGroupDescription(results),
    sourceRegion: sourceRegion
  };
}



// Helper functions for formatting descriptions
function formatMountRiderDescription(results) {
  const pairs = results.filter(r => r.type === 'pair');
  const dismounted = results.filter(r => r.type === 'dismounted');
  const mountsOnly = results.filter(r => r.type === 'mount_only');

  let desc = '';

  if (pairs.length > 0) {
    // Group pairs by mount and rider types to show the limited variety
    const pairsByCombo = {};
    pairs.forEach(pair => {
      const key = `${pair.rider.Name} on ${pair.mount.Name}`;
      if (!pairsByCombo[key]) {
        pairsByCombo[key] = { count: 0, dominant: pair.mountRatio > pair.riderRatio ? 'mount-focused' : 'rider-focused' };
      }
      pairsByCombo[key].count++;
    });

    const pairDescriptions = Object.entries(pairsByCombo).map(([combo, info]) => {
      return info.count > 1 ? `${info.count}× ${combo} (${info.dominant})` : `${combo} (${info.dominant})`;
    });

    desc += `${pairs.length} mounted: ${pairDescriptions.join(', ')}`;
  }

  if (mountsOnly.length > 0) {
    if (desc) desc += '; ';

    // Group mounts by type
    const mountsByType = {};
    mountsOnly.forEach(m => {
      const key = m.mount.Name;
      mountsByType[key] = (mountsByType[key] || 0) + 1;
    });

    const mountDescriptions = Object.entries(mountsByType).map(([mount, count]) => {
      return count > 1 ? `${count}× ${mount}` : mount;
    });

    desc += `${mountsOnly.length} mount${mountsOnly.length > 1 ? 's' : ''} only: ${mountDescriptions.join(', ')}`;
  }

  if (dismounted.length > 0) {
    if (desc) desc += '; ';

    // Group dismounted by rider type
    const dismountedByType = {};
    dismounted.forEach(d => {
      const key = d.rider.Name;
      dismountedByType[key] = (dismountedByType[key] || 0) + 1;
    });

    const dismountedDescriptions = Object.entries(dismountedByType).map(([rider, count]) => {
      return count > 1 ? `${count}× ${rider}` : rider;
    });

    desc += `${dismounted.length} dismounted: ${dismountedDescriptions.join(', ')}`;
  }

  return desc;
}

function formatMixedGroupDescription(results) {
  const leaders = results.filter(r => r.role === 'leader');
  const minions = results.filter(r => r.role === 'minion');

  let desc = '';
  if (leaders.length > 0) {
    desc += `1× ${leaders[0].Name} (leader, CR ${leaders[0].CR})`;
  }
  if (minions.length > 0) {
    if (desc) desc += ' + ';
    desc += `${minions.length}× ${minions[0].Name} (minions, CR ${minions[0].CR})`;
  }

  return desc;
}