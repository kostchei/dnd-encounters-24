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
  //           If we can't afford any, fallback to lower CRs (1/2, 1/4, 1/8, 0)
  if (methodIndex === 0) {
    const lowestLevel = Math.min(...levels);
    const crKey = String(lowestLevel);

    // Potential fallback CRs in descending order of "power" from the "lowestLevel"
    // For a real CR fallback, you'd want a full CR ordering, but let's do a simple array:
    const fallbackOrder = ["1/2", "1/4", "1/8", "0"];

    // We'll combine them: first we try the exact 'lowestLevel', then fallback
    const crCandidates = [crKey, ...fallbackOrder];

    let chosenCR = null;
    let chosenCRXP = 0;

    // Attempt each CR in order. As soon as we find a CR that fits at least 1 monster, we stop.
    for (const candidate of crCandidates) {
      const cost = CR_XP_TABLE[candidate];
      if (cost) {
        const maxCount = Math.floor(totalXP / cost);
        if (maxCount >= 1) {
          chosenCR = candidate;
          chosenCRXP = cost;
          break;
        }
      }
    }

    // If we never found a CR that fits, return a "no monster" message
    if (!chosenCR) {
      return `No monster fits within the budget for CR${lowestLevel} or lower.`;
    }

    // Otherwise, buy as many as we can of the chosen CR
    const maxCount = Math.floor(totalXP / chosenCRXP);
    return `${maxCount} × CR${chosenCR}`;
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
