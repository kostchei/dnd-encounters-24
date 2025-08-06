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

// Helper function to get monsters by CR from any source
function getMonstersByCR(cr, source = 'all') {
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
      // Flatten all monster types into one array
      return Object.values(crData)
        .filter(value => Array.isArray(value))
        .flat()
        .map(name => ({ Name: name, CR: crString }));
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
 * @returns {object} - Encounter result object
 */
export function generateNewEncounter(totalXP, levels, partySize) {
  // Calculate quantity range: 2 to 2×party size (max 10)
  const minQuantity = 2;
  const maxQuantity = Math.min(partySize * 2, 10);
  
  // Randomly select encounter category
  const categories = ['dragon_legendary', 'mounts_riders', 'groups', 'mixed_groups'];
  const selectedCategory = getRandomElement(categories);
  
  switch (selectedCategory) {
    case 'dragon_legendary':
      return generateDragonLegendary(totalXP);
      
    case 'mounts_riders':
      return generateMountsRiders(totalXP, minQuantity, maxQuantity);
      
    case 'groups':
      return generateGroups(totalXP, minQuantity, maxQuantity);
      
    case 'mixed_groups':
      return generateMixedGroups(totalXP, minQuantity, maxQuantity);
      
    default:
      return { error: 'Unknown encounter category' };
  }
}

// Dragon or Legendary encounter (always 1 monster)
function generateDragonLegendary(totalXP) {
  const bestFit = findBestCR(totalXP);
  if (!bestFit.cr) {
    return { error: 'No dragon or legendary creature fits budget' };
  }
  
  // Try dragons first, then legendary
  let dragons = getMonstersByCR(bestFit.cr, 'dragons');
  let legendaries = getMonstersByCR(bestFit.cr, 'legendary');
  
  const allOptions = [...dragons, ...legendaries];
  if (allOptions.length === 0) {
    return { error: `No dragon or legendary creature found for CR ${bestFit.cr}` };
  }
  
  const chosen = getRandomElement(allOptions);
  return {
    category: 'Dragon or Legendary',
    quantity: 1,
    monsters: [chosen],
    totalXP: bestFit.xp,
    description: `${chosen.Name} (CR ${chosen.CR})`
  };
}

// Mounts and Riders encounter
function generateMountsRiders(totalXP, minQuantity, maxQuantity) {
  const quantity = Math.floor(Math.random() * (maxQuantity - minQuantity + 1)) + minQuantity;
  const xpPerCreature = totalXP / quantity;
  
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
  
  // Select 1-2 mount types that could fit in the budget
  const selectedMountTypes = [];
  for (const cr of availableMountCRs) {
    const crXP = CR_XP_TABLE[cr];
    if (crXP <= xpPerCreature && selectedMountTypes.length < 2) {
      const mountsOfThisCR = MOUNTS.filter(m => m.CR === cr);
      if (mountsOfThisCR.length > 0) {
        selectedMountTypes.push({
          cr: cr,
          xp: crXP,
          creatures: mountsOfThisCR
        });
      }
    }
  }
  
  // Select 1-2 rider types that could fit in the budget  
  const selectedRiderTypes = [];
  for (const cr of availableRiderCRs) {
    const crXP = CR_XP_TABLE[cr];
    if (crXP <= xpPerCreature && selectedRiderTypes.length < 2) {
      const ridersOfThisCR = RIDERS.filter(r => r.CR === cr);
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
  
  for (let i = 0; i < quantity; i++) {
    // Decide if this is a mount+rider pair or just a rider
    const isPair = Math.random() < 0.7; // 70% chance of mounted
    
    if (isPair && selectedMountTypes.length > 0 && selectedRiderTypes.length > 0) {
      // Randomly decide XP allocation: either 1/3 mount + 2/3 rider OR 2/3 mount + 1/3 rider
      const mountGetsMore = Math.random() < 0.5; // 50% chance each way
      
      const mountRatio = mountGetsMore ? (2/3) : (1/3);
      const riderRatio = mountGetsMore ? (1/3) : (2/3);
      
      const mountBudget = xpPerCreature * mountRatio;
      const riderBudget = xpPerCreature * riderRatio;
      
      // Find suitable mount and rider from selected types
      const suitableMounts = selectedMountTypes.filter(mt => mt.xp <= mountBudget);
      const suitableRiders = selectedRiderTypes.filter(rt => rt.xp <= riderBudget);
      
      if (suitableMounts.length > 0 && suitableRiders.length > 0) {
        const chosenMountType = getRandomElement(suitableMounts);
        const chosenRiderType = getRandomElement(suitableRiders);
        
        const mount = getRandomElement(chosenMountType.creatures);
        const rider = getRandomElement(chosenRiderType.creatures);
        
        results.push({ 
          mount, 
          rider, 
          type: 'pair', 
          mountRatio, 
          riderRatio,
          mountCR: chosenMountType.cr,
          riderCR: chosenRiderType.cr
        });
        totalUsedXP += (chosenMountType.xp + chosenRiderType.xp);
      }
    } else if (selectedRiderTypes.length > 0) {
      // Just a rider (dismounted)
      const suitableRiders = selectedRiderTypes.filter(rt => rt.xp <= xpPerCreature);
      
      if (suitableRiders.length > 0) {
        const chosenRiderType = getRandomElement(suitableRiders);
        const rider = getRandomElement(chosenRiderType.creatures);
        
        results.push({ 
          rider, 
          type: 'dismounted',
          riderCR: chosenRiderType.cr
        });
        totalUsedXP += chosenRiderType.xp;
      }
    }
  }
  
  return {
    category: 'Mounts and Riders',
    quantity: results.length,
    monsters: results,
    totalXP: totalUsedXP,
    description: formatMountRiderDescription(results),
    mountTypes: selectedMountTypes.map(mt => mt.cr),
    riderTypes: selectedRiderTypes.map(rt => rt.cr)
  };
}

// Groups encounter (same creature type)
function generateGroups(totalXP, minQuantity, maxQuantity) {
  const quantity = Math.floor(Math.random() * (maxQuantity - minQuantity + 1)) + minQuantity;
  const xpPerCreature = totalXP / quantity;
  
  const bestFit = findBestCR(xpPerCreature);
  if (!bestFit.cr) {
    return { error: 'No creature fits per-creature budget for group' };
  }
  
  // Get creatures from original monster data
  const availableCreatures = getMonstersByCR(bestFit.cr, 'original');
  if (availableCreatures.length === 0) {
    return { error: `No creatures found for CR ${bestFit.cr} group encounter` };
  }
  
  const chosenCreature = getRandomElement(availableCreatures);
  const totalUsedXP = bestFit.xp * quantity;
  
  return {
    category: 'Groups',
    quantity: quantity,
    monsters: Array(quantity).fill(chosenCreature),
    totalXP: totalUsedXP,
    description: `${quantity}× ${chosenCreature.Name} (CR ${chosenCreature.CR} each)`
  };
}

// Mixed Groups encounter (different creature types)
function generateMixedGroups(totalXP, minQuantity, maxQuantity) {
  const quantity = Math.floor(Math.random() * (maxQuantity - minQuantity + 1)) + minQuantity;
  
  // Allocate XP: 40% to leader, 60% to minions
  const leaderXP = totalXP * 0.4;
  const minionXP = totalXP * 0.6;
  const minions = quantity - 1;
  const xpPerMinion = minions > 0 ? minionXP / minions : 0;
  
  const results = [];
  let totalUsedXP = 0;
  
  // Get leader
  const leaderCR = findBestCR(leaderXP);
  if (leaderCR.cr) {
    const leader = getRandomElement(getMonstersByCR(leaderCR.cr, 'original'));
    if (leader) {
      results.push({ ...leader, role: 'leader' });
      totalUsedXP += leaderCR.xp;
    }
  }
  
  // Get minions
  if (minions > 0 && xpPerMinion > 0) {
    const minionCR = findBestCR(xpPerMinion);
    if (minionCR.cr) {
      const minionCreatures = getMonstersByCR(minionCR.cr, 'original');
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
    description: formatMixedGroupDescription(results)
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