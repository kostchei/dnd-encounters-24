// spend_enc_xp.js
import CR_XP_TABLE from './cr_xp.json';

/**
 * @param {number} totalXP The total XP budget to spend.
 * @param {number[]} levels An array of character levels. We'll use min/max from here.
 * @param {number} partySize The total number of characters.
 * @returns {string} A string describing what monsters were "purchased."
 */
export function spendEncounterBudget(totalXP, levels, partySize) {
  // We randomly pick 1 of the 3 methods
  const methodIndex = Math.floor(Math.random() * 3);

  // Method 1: Buy as many monsters of CR == the lowest party level
  if (methodIndex === 0) {
    const lowestLevel = Math.min(...levels);
    // Because your CR table keys are strings, we’ll convert the level to a string
    // (assuming your lowest party level corresponds exactly to a CR in your CR table).
    const crKey = String(lowestLevel);  
    const costPerMonster = CR_XP_TABLE[crKey] || 0;
    if (costPerMonster === 0) {
      return `No matching CR for level ${lowestLevel} in the CR table.`;
    }
    const maxCount = Math.floor(totalXP / costPerMonster);
    return `${maxCount} × CR${lowestLevel}`;
  }

  // Method 2: Single highest CR that fits in the total budget
  if (methodIndex === 1) {
    // We'll look through CR_XP_TABLE to find the largest CR whose xp <= totalXP
    let bestCR = null;
    let bestCRXP = 0;
    for (let crString in CR_XP_TABLE) {
      const xpValue = CR_XP_TABLE[crString];
      if (xpValue <= totalXP && xpValue > bestCRXP) {
        bestCR = crString;
        bestCRXP = xpValue;
      }
    }
    if (bestCR === null) {
      return 'No monster fits within this budget?!';
    }
    return `1 × CR${bestCR}`;
  }

  // Method 3: Double the party size, divide budget by that
  // Then pick the highest CR that fits. Then buy that many monsters.
  if (methodIndex === 2) {
    const multiplier = partySize * 2;
    const xpPerMonster = totalXP / multiplier;

    // find the largest CR xp that is <= xpPerMonster
    let bestCR = null;
    let bestCRXP = 0;
    for (let crString in CR_XP_TABLE) {
      const xpValue = CR_XP_TABLE[crString];
      if (xpValue <= xpPerMonster && xpValue > bestCRXP) {
        bestCR = crString;
        bestCRXP = xpValue;
      }
    }
    if (bestCR === null) {
      return 'No monster fits within the per-monster budget.';
    }

    return `${multiplier} × CR${bestCR}`;
  }

  // Fallback (should never happen logically)
  return 'Encounter generation method not found.';
}
