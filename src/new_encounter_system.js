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
  
  const results = [];
  let totalUsedXP = 0;
  
  for (let i = 0; i < quantity; i++) {
    // Decide if this is a mount+rider pair or just a rider
    const isPair = Math.random() < 0.7; // 70% chance of mounted
    
    if (isPair) {
      // Randomly decide XP allocation: either 1/3 mount + 2/3 rider OR 2/3 mount + 1/3 rider
      const mountGetsMore = Math.random() < 0.5; // 50% chance each way
      
      const mountRatio = mountGetsMore ? (2/3) : (1/3);
      const riderRatio = mountGetsMore ? (1/3) : (2/3);
      
      const mountCR = findBestCR(xpPerCreature * mountRatio);
      const riderCR = findBestCR(xpPerCreature * riderRatio);
      
      const mount = getRandomElement(getMonstersByCR(mountCR.cr, 'mounts'));
      const rider = getRandomElement(getMonstersByCR(riderCR.cr, 'riders'));
      
      if (mount && rider) {
        results.push({ mount, rider, type: 'pair', mountRatio, riderRatio });
        totalUsedXP += (mountCR.xp + riderCR.xp);
      }
    } else {
      // Just a rider (dismounted)
      const riderCR = findBestCR(xpPerCreature);
      const rider = getRandomElement(getMonstersByCR(riderCR.cr, 'riders'));
      
      if (rider) {
        results.push({ rider, type: 'dismounted' });
        totalUsedXP += riderCR.xp;
      }
    }
  }
  
  return {
    category: 'Mounts and Riders',
    quantity: results.length,
    monsters: results,
    totalXP: totalUsedXP,
    description: formatMountRiderDescription(results)
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
    // Show variety in mount/rider combinations
    const pairDescriptions = pairs.map(pair => {
      const dominant = pair.mountRatio > pair.riderRatio ? 'mount-focused' : 'rider-focused';
      return `${pair.rider.Name} on ${pair.mount.Name} (${dominant})`;
    });
    desc += `${pairs.length} mounted: ${pairDescriptions.join(', ')}`;
  }
  if (dismounted.length > 0) {
    if (desc) desc += '; ';
    desc += `${dismounted.length} dismounted: ${dismounted[0].rider.Name}`;
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