// new_encounter_system.js
import CR_XP_TABLE from './cr_xp.json';
import DRAGONS from './dragon.json';
import LEGENDARY from './legendary.json';
import MOUNTS from './mounts.json';
import RIDERS from './riders.json';
import MONSTERS_BY_CR from './enc_by_cr.json';

// Helper function to get random element from array
function getRandomElement(array) {
  if (!array || array.length === 0) return null;
  return array[Math.floor(Math.random() * array.length)];
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
 * @returns {object} - Encounter result object
 */
export function generateNewEncounter(totalXP, levels, partySize, theme = 'Any') {
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
  const categories = ['dragon_legendary', 'mounts_riders', 'groups', 'mixed_groups'];
  const selectedCategory = getRandomElement(categories);
  
  switch (selectedCategory) {
    case 'dragon_legendary':
      return generateDragonLegendary(totalXP, actualTheme, theme);
      
    case 'mounts_riders':
      return generateMountsRiders(totalXP, minQuantity, maxQuantity, actualTheme, theme);
      
    case 'groups':
      return generateGroups(totalXP, minQuantity, maxQuantity, actualTheme, theme);
      
    case 'mixed_groups':
      return generateMixedGroups(totalXP, minQuantity, maxQuantity, actualTheme, theme);
      
    default:
      return { error: 'Unknown encounter category' };
  }
}

// Dragon or Legendary encounter (always 1 monster)
function generateDragonLegendary(totalXP, actualTheme, originalTheme) {
  const bestFit = findBestCR(totalXP);
  if (!bestFit.cr) {
    return { error: 'No dragon or legendary creature fits budget' };
  }
  
  // Try dragons first, then legendary, filtered by actual theme
  let dragons = getMonstersByCR(bestFit.cr, 'dragons', actualTheme);
  let legendaries = getMonstersByCR(bestFit.cr, 'legendary', actualTheme);
  
  const allOptions = [...dragons, ...legendaries];
  if (allOptions.length === 0) {
    return { error: `No ${actualTheme} dragon or legendary creature found for CR ${bestFit.cr}` };
  }
  
  const chosen = getRandomElement(allOptions);
  return {
    category: 'Dragon or Legendary',
    quantity: 1,
    monsters: [chosen],
    totalXP: bestFit.xp,
    description: `${chosen.Name} (CR ${chosen.CR})`,
    theme: originalTheme === 'Any' ? actualTheme : originalTheme
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
  
  // Select 1-2 mount types that could reasonably fit in the total budget, filtered by theme
  const selectedMountTypes = [];
  for (const cr of availableMountCRs) {
    const crXP = CR_XP_TABLE[cr];
    if (crXP <= totalXP && selectedMountTypes.length < 2) {
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
  
  // Select 1-2 rider types that could reasonably fit in the total budget, filtered by theme  
  const selectedRiderTypes = [];
  for (const cr of availableRiderCRs) {
    const crXP = CR_XP_TABLE[cr];
    if (crXP <= totalXP && selectedRiderTypes.length < 2) {
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
  
  // More aggressive XP spending - keep adding creatures until we hit quantity or run out of XP
  while (creaturesAdded < quantity && remainingXP > 0) {
    // Decide if this is a mount+rider pair or just a rider
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
        const mountRatio = mountGetsMore ? (2/3) : (1/3);
        const riderRatio = mountGetsMore ? (1/3) : (2/3);
        
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

// Groups encounter (same creature type)
function generateGroups(totalXP, minQuantity, maxQuantity, actualTheme, originalTheme) {
  const quantity = Math.floor(Math.random() * (maxQuantity - minQuantity + 1)) + minQuantity;
  const xpPerCreature = totalXP / quantity;
  
  const bestFit = findBestCR(xpPerCreature);
  if (!bestFit.cr) {
    return { error: 'No creature fits per-creature budget for group' };
  }
  
  // Get creatures from original monster data, filtered by actual theme
  const availableCreatures = getMonstersByCR(bestFit.cr, 'original', actualTheme);
  if (availableCreatures.length === 0) {
    return { error: `No ${actualTheme} creatures found for CR ${bestFit.cr} group encounter` };
  }
  
  const chosenCreature = getRandomElement(availableCreatures);
  const totalUsedXP = bestFit.xp * quantity;
  
  return {
    category: 'Groups',
    quantity: quantity,
    monsters: Array(quantity).fill(chosenCreature),
    totalXP: totalUsedXP,
    description: `${quantity}× ${chosenCreature.Name} (CR ${chosenCreature.CR} each)`,
    theme: originalTheme === 'Any' ? actualTheme : originalTheme
  };
}

// Mixed Groups encounter (different creature types)
function generateMixedGroups(totalXP, minQuantity, maxQuantity, actualTheme, originalTheme) {
  const quantity = Math.floor(Math.random() * (maxQuantity - minQuantity + 1)) + minQuantity;
  
  // Allocate XP: 40% to leader, 60% to minions
  const leaderXP = totalXP * 0.4;
  const minionXP = totalXP * 0.6;
  const minions = quantity - 1;
  const xpPerMinion = minions > 0 ? minionXP / minions : 0;
  
  const results = [];
  let totalUsedXP = 0;
  
  // Get leader, filtered by actual theme
  const leaderCR = findBestCR(leaderXP);
  if (leaderCR.cr) {
    const leader = getRandomElement(getMonstersByCR(leaderCR.cr, 'original', actualTheme));
    if (leader) {
      results.push({ ...leader, role: 'leader' });
      totalUsedXP += leaderCR.xp;
    }
  }
  
  // Get minions, filtered by actual theme
  if (minions > 0 && xpPerMinion > 0) {
    const minionCR = findBestCR(xpPerMinion);
    if (minionCR.cr) {
      const minionCreatures = getMonstersByCR(minionCR.cr, 'original', actualTheme);
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
    theme: originalTheme === 'Any' ? actualTheme : originalTheme
  };
}

// Helper functions for formatting descriptions
function formatMountRiderDescription(results) {
  const pairs = results.filter(r => r.type === 'pair');
  const dismounted = results.filter(r => r.type === 'dismounted');
  
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