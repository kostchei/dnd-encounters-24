import React, { useState, useEffect, useCallback } from 'react';
import XP_TABLE from './data/enc_xp.json';
import ENRICHED_MONSTERS from './data/enriched_monster_list.json';
import FACTIONS from './data/factions.json';
import ADVENTURE_REGIONS from './data/adventure_regions.json';
import { generateNewEncounter } from './new_encounter_system.js';
import { generateName, generateDragonName, generateLegendaryName } from './nameGenerator';
import styles from './styles';

// Create monster lookup map once at module level
const MONSTER_MAP = new Map(ENRICHED_MONSTERS.map(m => [m.Name, m]));

// Helper: Parse base type from monster type string (e.g., "humanoid (any race)" -> "humanoid")
function parseBaseType(typeString) {
  if (!typeString) return '';
  // Extract the base type before any parentheses
  const match = typeString.toLowerCase().match(/^([a-z]+)/);
  return match ? match[1] : typeString.toLowerCase();
}

// Helper: Check if alignment matches faction requirements
function alignmentMatches(monsterAlignment, factionAlignments) {
  if (!monsterAlignment || factionAlignments.includes('any')) return true;

  const align = monsterAlignment.toUpperCase();

  // Check for evil (E in alignment)
  const isEvil = align.includes('E') && !align.includes('ANY');
  // Check for good (G in alignment)
  const isGood = align.includes('G');
  // Check for lawful (L in alignment)
  const isLawful = align.includes('L');
  // Check for chaotic (C in alignment)
  const isChaotic = align.includes('C');
  // Check for neutral (N in alignment, but not NE or NG)
  const isNeutral = !isEvil && !isGood;

  for (const req of factionAlignments) {
    if (req === 'evil' && isEvil) return true;
    if (req === 'good' && isGood) return true;
    if (req === 'lawful' && isLawful && !isEvil) return true; // Lawful but not evil
    if (req === 'chaotic' && isChaotic) return true;
    if (req === 'neutral' && isNeutral) return true;
  }

  return false;
}

// Assign factions to monsters in an encounter - ONE faction per encounter max
function assignFactions(monsters) {
  const assignments = new Map(); // monster index -> faction name

  // Step 1: Find all eligible monsters (Int >= 6)
  const eligibleIndices = [];
  const eligibleData = [];

  for (let i = 0; i < monsters.length; i++) {
    const monster = monsters[i];
    const data = MONSTER_MAP.get(monster.Name);

    if (!data) continue;

    const intelligence = data.Intelligence ?? 0;
    if (intelligence >= 6) {
      eligibleIndices.push(i);
      eligibleData.push(data);
    }
  }

  // No eligible creatures
  if (eligibleIndices.length === 0) return assignments;

  // Step 2: 50% chance for the encounter to have a faction
  if (Math.random() >= 0.5) return assignments;

  // Step 3: Find factions that match ANY eligible creature
  const matchingFactions = FACTIONS.filter(faction => {
    return eligibleData.some(data => {
      const baseType = parseBaseType(data.Type);
      const typeMatches = faction.types.some(t => baseType.includes(t.toLowerCase()));
      if (!typeMatches) return false;
      return alignmentMatches(data.Alignment, faction.alignments);
    });
  });

  if (matchingFactions.length === 0) return assignments;

  // Step 4: Pick ONE faction for the whole encounter
  const chosenFaction = matchingFactions[Math.floor(Math.random() * matchingFactions.length)];

  // Step 5: Apply to all eligible creatures that match this faction
  for (let j = 0; j < eligibleIndices.length; j++) {
    const data = eligibleData[j];
    const baseType = parseBaseType(data.Type);
    const typeMatches = chosenFaction.types.some(t => baseType.includes(t.toLowerCase()));
    const alignMatches = alignmentMatches(data.Alignment, chosenFaction.alignments);

    if (typeMatches && alignMatches) {
      assignments.set(eligibleIndices[j], chosenFaction.name);
    }
  }

  return assignments;
}

// Helper: Pick a random valid adventure for a monster in a specific region
function pickAdventure(monsterName, regionId) {
  const data = MONSTER_MAP.get(monsterName);
  if (!data || !data.Adventures || data.Adventures.length === 0) return null;

  // Filter adventures valid for this region
  const validAdventures = data.Adventures.filter(advName => {
    const advConfig = ADVENTURE_REGIONS[advName];
    if (!advConfig) return false;
    // Check if region matches or is "all"
    return advConfig.regions.includes('all') || advConfig.regions.includes(regionId);
  });

  if (validAdventures.length === 0) return null;

  // Pick one randomly
  return validAdventures[Math.floor(Math.random() * validAdventures.length)];
}

// Legendary creature types that get special naming
const LEGENDARY_TYPES = ['beholder', 'mind flayer', 'aboleth', 'lich', 'vampire', 'demon', 'devil'];

// Generate names for encounter participants
// Criteria: Intelligence >= 3 OR CR >= 11
function generateNamesForEncounter(monsters, regionId) {
  const names = new Map(); // monster index -> generated name

  for (let i = 0; i < monsters.length; i++) {
    const monster = monsters[i];
    const data = MONSTER_MAP.get(monster.Name);
    if (!data) continue;

    const intelligence = data.Intelligence ?? 0;
    const crStr = String(monster.CR || data.CR || '0');
    // Parse CR safely - handle fractions like "1/4", "1/2"
    let numericCR;
    if (crStr.includes('/')) {
      const [num, denom] = crStr.split('/').map(Number);
      numericCR = num / denom;
    } else {
      numericCR = parseFloat(crStr);
    }

    // Check criteria: Intelligence >= 3 OR CR >= 11
    if (intelligence < 3 && numericCR < 11) continue;

    const lowerType = (data.Type || '').toLowerCase();
    const lowerName = monster.Name.toLowerCase();
    const gender = Math.random() < 0.5 ? 'male' : 'female';

    let generatedName;

    // Check if it's a dragon
    if (lowerName.includes('dragon') || lowerType.includes('dragon')) {
      generatedName = generateDragonName(monster.Name, numericCR, regionId);
    }
    // Check if it's a legendary creature type
    else if (LEGENDARY_TYPES.some(lt => lowerName.includes(lt) || lowerType.includes(lt))) {
      generatedName = generateLegendaryName(monster.Name, numericCR, regionId);
    }
    // Default: use regular name generator
    else {
      generatedName = generateName({
        region: regionId,
        gender: gender,
        cr: numericCR,
        creatureType: lowerType
      });
    }

    names.set(i, { name: generatedName, monsterName: monster.Name });
  }

  return names;
}


// Region data with hex colors and weighted terrain probabilities
// Each terrain entry is [terrain, weight] - weights are percentages
const REGIONS = [
  {
    id: 'icewind',
    name: 'Icewind Dale',
    color: '#A8D5E5',
    terrains: [['Open/Desert/Arctic', 70], ['Mountains', 25], ['Hills/Urban', 5]],
    theme: 'Any'
  },
  {
    id: 'heartlands',
    name: 'Heartlands',
    color: '#7CB342',
    terrains: [['Forest', 25], ['Hills/Urban', 25], ['Mountains', 25], ['Jungle/Indoors', 25]],
    theme: 'Any'
  },
  {
    id: 'moonshae',
    name: 'Moonshae Isles',
    color: '#5C6BC0',
    terrains: [['Forest', 30], ['Hills/Urban', 40], ['Mountains', 30]],
    theme: 'Any'
  },
  {
    id: 'calimshan',
    name: 'Calimshan',
    color: '#FFB74D',
    terrains: [['Open/Desert/Arctic', 60], ['Forest', 10], ['Hills/Urban', 10], ['Mountains', 10], ['Jungle/Indoors', 10]],
    theme: 'Any'
  },
  {
    id: 'cities',
    name: 'Cities',
    color: '#78909C',
    terrains: [['Hills/Urban', 50], ['Jungle/Indoors', 50]],
    theme: 'Any'
  },
  {
    id: 'dungeon',
    name: 'Dungeon',
    color: '#4A4A4A',
    terrains: [['Jungle/Indoors', 90], ['Hills/Urban', 10]],
    theme: 'Any'
  },
];

// Simple dice roller: rollDice(2, 6) -> sum of 2d6
function rollDice(numDice, sides) {
  let total = 0;
  for (let i = 0; i < numDice; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total;
}

// Calculate initiative for encounter - group by unique monster Name
function calculateInitiatives(monsters, monsterMap) {
  const initiativeGroups = new Map(); // name -> { count, bonus }

  for (const m of monsters) {
    const name = m.Name;
    if (!initiativeGroups.has(name)) {
      const data = monsterMap.get(name);
      const bonus = data?.InitiativeBonus ?? 0;
      initiativeGroups.set(name, { count: 0, bonus });
    }
    initiativeGroups.get(name).count++;
  }

  // Roll 1d20 + bonus for each unique monster group
  const results = [];
  for (const [name, info] of initiativeGroups) {
    const roll = rollDice(1, 20) + info.bonus;
    results.push({ name, count: info.count, roll });
  }

  // Sort by roll descending
  results.sort((a, b) => b.roll - a.roll);
  return results;
}

// Calculate perception - roll for each, return highest (min = passive)
function calculatePerception(monsters, monsterMap) {
  let highest = 0;

  for (const m of monsters) {
    const data = monsterMap.get(m.Name);
    const perceptionBonus = data?.PerceptionBonus ?? 0;
    const passivePerception = data?.PassivePerception ?? 10;

    const roll = rollDice(1, 20) + perceptionBonus;
    const result = Math.max(roll, passivePerception);

    if (result > highest) {
      highest = result;
    }
  }

  return highest;
}

// Calculate stealth - roll for each, return lowest
// Monsters without StealthBonus use DEX modifier with disadvantage
function calculateStealth(monsters, monsterMap) {
  let lowest = Infinity;

  for (const m of monsters) {
    const data = monsterMap.get(m.Name);
    const stealthBonus = data?.StealthBonus;

    let roll;
    if (stealthBonus != null && stealthBonus !== 0) {
      // Has stealth proficiency
      roll = rollDice(1, 20) + stealthBonus;
    } else {
      // No stealth - use DEX modifier with disadvantage (InitiativeBonus = DEX mod in 5e2024)
      const dexMod = data?.InitiativeBonus ?? 0;
      const roll1 = rollDice(1, 20) + dexMod;
      const roll2 = rollDice(1, 20) + dexMod;
      roll = Math.min(roll1, roll2); // disadvantage = take lower
    }

    if (roll < lowest) {
      lowest = roll;
    }
  }

  return lowest;
}

// Pick weighted random terrain from region's terrain list
function pickWeightedTerrain(terrains) {
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const [terrain, weight] of terrains) {
    cumulative += weight;
    if (roll < cumulative) {
      return terrain;
    }
  }
  // Fallback to last terrain
  return terrains[terrains.length - 1][0];
}

// Map each terrain to a function that returns a distance.
const terrainDistanceMap = {
  'Open/Desert/Arctic': () => rollDice(6, 6) * 10,
  'Forest': () => rollDice(2, 8) * 10,
  'Hills/Urban': () => rollDice(2, 10) * 10,
  'Mountains': () => rollDice(4, 10) * 10,
  'Jungle/Indoors': () => rollDice(2, 6) * 10,
};

// SVG Hexagon component
function Hexagon({ color, size = 50 }) {
  const height = size;
  const width = size * 0.866; // Hex width ratio
  const points = `${width / 2},0 ${width},${height * 0.25} ${width},${height * 0.75} ${width / 2},${height} 0,${height * 0.75} 0,${height * 0.25}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polygon
        points={points}
        fill={color}
        stroke="#58180D"
        strokeWidth="2"
      />
    </svg>
  );
}

// Helper function to format encounter result for display
// Returns React elements with monster names as hyperlinks to 5etools
function formatEncounterResult(encounterResult, selectedTheme, factionMap = null, regionId = null) {
  if (encounterResult.error) {
    return <span>Error: {encounterResult.error}</span>;
  }

  // Build custom description if we have faction assignments
  if (factionMap && factionMap.size > 0 && encounterResult.monsters) {
    const monsters = encounterResult.monsters;

    // Group monsters by name and track their faction assignments
    // name -> { count, factionCounts, adventure, statblockLink }
    const monsterGroups = new Map();

    for (let i = 0; i < monsters.length; i++) {
      const m = monsters[i];
      const name = m.Name;
      const cr = m.CR;
      const key = `${name}|${cr}`;

      if (!monsterGroups.has(key)) {
        const data = MONSTER_MAP.get(name);
        const statblockLink = data?.Statblock_Link || null;
        monsterGroups.set(key, { name, cr, count: 0, factionCounts: new Map(), adventure: null, statblockLink });
      }

      const group = monsterGroups.get(key);
      group.count++;

      // Track faction for this monster instance
      const faction = factionMap.get(i);
      if (faction) {
        group.factionCounts.set(faction, (group.factionCounts.get(faction) || 0) + 1);
      }

      // Pick adventure for the group (first valid one wins for consistency across group)
      if (!group.adventure && regionId) {
        group.adventure = pickAdventure(name, regionId);
      }
    }

    // Build description as React elements
    const elements = [];
    let idx = 0;
    for (const [, group] of monsterGroups) {
      if (idx > 0) elements.push(<span key={`sep-${idx}`}> + </span>);

      const distinctExtras = [];

      // Add adventure info if any
      if (group.adventure) {
        distinctExtras.push(`from ${group.adventure}`);
      }

      // Add faction info if any
      if (group.factionCounts.size > 0) {
        const factionParts = [];
        for (const [faction, count] of group.factionCounts) {
          if (count === group.count) {
            factionParts.push(`faction ${faction}`);
          } else {
            factionParts.push(`${count} faction ${faction}`);
          }
        }
        distinctExtras.push(...factionParts);
      }

      const extrasStr = distinctExtras.length > 0 ? ` (${distinctExtras.join(', ')})` : '';
      const countPrefix = group.count > 1 ? `${group.count}× ` : '';

      elements.push(
        <span key={`monster-${idx}`}>
          {countPrefix}
          {group.statblockLink ? (
            <a
              href={group.statblockLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#58180D', textDecoration: 'underline' }}
            >
              {group.name}
            </a>
          ) : (
            group.name
          )}
          {` (CR ${group.cr})`}{extrasStr}
        </span>
      );
      idx++;
    }

    if (selectedTheme === 'Any' && encounterResult.theme) {
      elements.push(<span key="theme"> [{encounterResult.theme} theme]</span>);
    }

    return <>{elements}</>;
  }

  // Fallback: parse the description and add links for known monsters
  if (encounterResult.monsters && encounterResult.monsters.length > 0) {
    // Group monsters for display
    const monsterGroups = new Map();
    for (const m of encounterResult.monsters) {
      const key = `${m.Name}|${m.CR}`;
      if (!monsterGroups.has(key)) {
        const data = MONSTER_MAP.get(m.Name);
        monsterGroups.set(key, {
          name: m.Name,
          cr: m.CR,
          count: 0,
          statblockLink: data?.Statblock_Link || null
        });
      }
      monsterGroups.get(key).count++;
    }

    const elements = [];
    let idx = 0;
    for (const [, group] of monsterGroups) {
      if (idx > 0) elements.push(<span key={`sep-${idx}`}> + </span>);

      const countPrefix = group.count > 1 ? `${group.count}× ` : '';

      elements.push(
        <span key={`monster-${idx}`}>
          {countPrefix}
          {group.statblockLink ? (
            <a
              href={group.statblockLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#58180D', textDecoration: 'underline' }}
            >
              {group.name}
            </a>
          ) : (
            group.name
          )}
          {` (CR ${group.cr})`}
        </span>
      );
      idx++;
    }

    if (selectedTheme === 'Any' && encounterResult.theme) {
      elements.push(<span key="theme"> [{encounterResult.theme} theme]</span>);
    }

    return <>{elements}</>;
  }

  // Ultimate fallback to original description
  let result = encounterResult.description;

  if (selectedTheme === 'Any' && encounterResult.theme) {
    result += ` [${encounterResult.theme} theme]`;
  }

  return <span>{result}</span>;
}

// Build JSON output for external app consumption
function buildEncounterJSON(encounterResult, reactionResult, region, namesResult, factionResult) {
  if (!encounterResult || !encounterResult.monsters) return null;

  // Get current date in YYYY-MM-DD format
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];

  // Map reaction attitude to lowercase
  const reactionWord = reactionResult?.attitude?.toLowerCase() || 'indifferent';

  // Build monsters array with names and factions if available
  const monsters = encounterResult.monsters.map((m, idx) => {
    const nameInfo = namesResult?.get(idx);
    const faction = factionResult?.get(idx) || null;
    return {
      monsterType: m.Name,
      cr: m.CR,
      name: nameInfo?.name || null,
      faction: faction
    };
  });

  return {
    monsters,
    reaction: reactionWord,
    date: dateStr,
    hexType: region.name,
    xpUsed: encounterResult.totalXP || 0
  };
}

function App() {
  // Region selection - 50/50 between heartlands and dungeon on load
  const [selectedRegion, setSelectedRegion] = useState(() =>
    Math.random() < 0.5 ? 'heartlands' : 'dungeon'
  );

  // Simplified party config: single level and party size
  const [partySize, setPartySize] = useState(4);
  const [partyLevel, setPartyLevel] = useState(1);

  // Difficulty states - defaults to Random
  const [difficulty, setDifficulty] = useState('Random');
  const [resolvedDifficulty, setResolvedDifficulty] = useState(() => {
    const possibilities = ['Low', 'Moderate', 'High'];
    return possibilities[Math.floor(Math.random() * possibilities.length)];
  });

  // Store the encounter result object
  const [encounterResult, setEncounterResult] = useState(null);

  // Store the calculated "Encounter Distance"
  const [encounterDistance, setEncounterDistance] = useState(null);
  const [finalTerrain, setFinalTerrain] = useState('');

  // Store the reaction roll result
  const [reactionResult, setReactionResult] = useState(null);
  const [initiativeResult, setInitiativeResult] = useState(null);
  const [perceptionResult, setPerceptionResult] = useState(null);
  const [stealthResult, setStealthResult] = useState(null);
  const [factionResult, setFactionResult] = useState(null);
  const [namesResult, setNamesResult] = useState(null);
  const [encounterJSON, setEncounterJSON] = useState(null);

  // Calculate total XP from the party input
  const calculateTotalXP = useCallback(() => {
    const xpRow = XP_TABLE[partyLevel];
    if (xpRow) {
      return xpRow[resolvedDifficulty] * partySize;
    }
    return 0;
  }, [partyLevel, partySize, resolvedDifficulty]);

  const [totalXP, setTotalXP] = useState(calculateTotalXP());

  useEffect(() => {
    setTotalXP(calculateTotalXP());
  }, [calculateTotalXP]);

  const handleDifficultyChange = (e) => {
    const choice = e.target.value;
    setDifficulty(choice);

    if (choice === 'Random') {
      const possibilities = ['Low', 'Moderate', 'High'];
      const newResolvedDifficulty = possibilities[Math.floor(Math.random() * possibilities.length)];
      setResolvedDifficulty(newResolvedDifficulty);
    } else {
      setResolvedDifficulty(choice);
    }
  };

  const handleSpendBudget = () => {
    const allLevels = Array(partySize).fill(partyLevel);

    // Get region data for terrain and theme
    const region = REGIONS.find(r => r.id === selectedRegion) || REGIONS[0];
    const regionTheme = region.theme;
    const regionTerrain = pickWeightedTerrain(region.terrains);

    // Use the new encounter generation system with region's theme and region
    const newEncounter = generateNewEncounter(totalXP, allLevels, partySize, regionTheme, selectedRegion);
    setEncounterResult(newEncounter);

    // Safety check: if generation failed or no monsters, allow rendering the error but skip stats
    if (!newEncounter || !newEncounter.monsters) {
      // Clear derived stats
      setReactionResult(null);
      setInitiativeResult(null);
      setPerceptionResult(null);
      setStealthResult(null);
      setFactionResult(null);
      return;
    }

    // Calculate distance using region's terrain
    const distanceFn = terrainDistanceMap[regionTerrain];
    const distance = distanceFn ? distanceFn() : 0;

    // Calculate Reaction Modifier based on Alignment
    const modifier = getReactionModifier(newEncounter.monsters);

    // Roll 2d6 + modifier for reaction
    const baseRoll = rollDice(2, 6);
    const reactionRoll = baseRoll + modifier;

    console.log(`Reaction: Base ${baseRoll} + Mod ${modifier} = ${reactionRoll}. Monsters: ${newEncounter.monsters.map(m => m.Name).join(', ')}`);

    let reaction;
    if (reactionRoll <= 4) {
      reaction = { roll: reactionRoll, attitude: 'Hostile', description: 'openly aggressive, obstructive, or likely to attack' };
    } else if (reactionRoll <= 9) {
      reaction = { roll: reactionRoll, attitude: 'Indifferent', description: 'cautious, neutral, will deal if there\'s a clear reason' };
    } else {
      reaction = { roll: reactionRoll, attitude: 'Friendly', description: 'helpful, open, inclined to cooperate' };
    }

    // Calculate initiative, perception, stealth using module-level map
    const initiatives = calculateInitiatives(newEncounter.monsters, MONSTER_MAP);
    const perception = calculatePerception(newEncounter.monsters, MONSTER_MAP);
    const stealth = calculateStealth(newEncounter.monsters, MONSTER_MAP);

    // Assign factions to intelligent creatures
    const factions = assignFactions(newEncounter.monsters);

    // Generate names for intelligent/powerful creatures
    const names = generateNamesForEncounter(newEncounter.monsters, selectedRegion);

    setFinalTerrain(regionTerrain);
    setEncounterDistance(distance);
    setReactionResult(reaction);
    setInitiativeResult(initiatives);
    setPerceptionResult(perception);
    setStealthResult(stealth);
    setFactionResult(factions);
    setNamesResult(names);

    // Build JSON output for external consumption
    const jsonOutput = buildEncounterJSON(
      newEncounter,
      reaction,
      region,
      names,
      factions
    );
    setEncounterJSON(jsonOutput);
  };

  // Helper: Get alignment modifier
  function getReactionModifier(monsters) {
    if (!monsters || monsters.length === 0) return 0;

    // Use module-level map for efficiency

    let allEvil = true;
    let anyEvil = false;
    let allGood = true;
    let allNeutral = true;

    for (const m of monsters) {
      const data = MONSTER_MAP.get(m.Name);
      const alignment = data ? (data.Alignment || "Unknown") : "Unknown";

      // Check for Evil (E) - excluding "Any" or "Unaligned" if they accidentally contain E (unlikely)
      const isEvil = alignment.includes('E') && !alignment.includes('Any'); // "Any Evil" has E. "L E" "N E" "C E"
      // "Any" alignment usually is "A" or "Any". "N E" contains E.

      // Check for Good (G)
      const isGood = alignment.includes('G');

      // Check for Neutral/Unaligned/Any (No E, No G)
      // "N" "L N" "C N" "U" "A" "Any"
      // Note: "N" is in "N G" and "N E", so just checking "N" is insufficient.
      // Neutral in this context means "Not Good AND Not Evil". 
      const isNeutral = !isEvil && !isGood;

      if (!isEvil) allEvil = false;
      if (isEvil) anyEvil = true;
      if (!isGood) allGood = false;
      if (!isNeutral) allNeutral = false;
    }

    if (allEvil) return -3;
    if (anyEvil) return -2;
    if (allGood) return 0;
    if (allNeutral) return -1;

    return 0;
  }

  return (
    <div style={styles.container}>
      <div style={styles.contentWrapper}>
        <div style={styles.innerContainer}>

          {/* Title at top */}
          <div style={styles.appTitle}>D&D 5e 2024 Forgotten Realms Encounter Generator</div>

          {/* Region Picker */}
          <div style={styles.sectionTitle}>What region are you in?</div>
          <div style={styles.hexGrid} className="hex-grid">
            {REGIONS.map((region) => (
              <div
                key={region.id}
                style={{
                  ...styles.hexOption,
                  ...(selectedRegion === region.id ? styles.hexOptionSelected : {}),
                }}
                className="hex-option"
                onClick={() => setSelectedRegion(region.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedRegion(region.id)}
              >
                <Hexagon color={region.color} size={50} />
                <span style={styles.hexLabel}>{region.name}</span>
              </div>
            ))}
          </div>

          {/* Party Configuration */}
          <div style={styles.sectionTitle}>How many party members, and what level?</div>
          <div style={styles.partyConfig}>
            <div style={styles.partyField}>
              <label style={styles.label}>Party Size</label>
              <select
                value={partySize}
                onChange={(e) => setPartySize(parseInt(e.target.value, 10))}
                style={styles.select}
              >
                {Array.from({ length: 8 }, (_, i) => i + 1).map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            <div style={styles.partyField}>
              <label style={styles.label}>Level</label>
              <select
                value={partyLevel}
                onChange={(e) => setPartyLevel(parseInt(e.target.value, 10))}
                style={styles.select}
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>
          </div>

          {/* XP Budget Display */}
          <div style={styles.xpBudget}>
            XP Budget: {totalXP.toLocaleString()} ({resolvedDifficulty})
          </div>

          {/* Difficulty dropdown */}
          <div style={styles.row} className="form-row">
            <label style={styles.label}>Difficulty</label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={handleDifficultyChange}
              style={styles.select}
            >
              <option value="Random">Random</option>
              <option value="Low">Low</option>
              <option value="Moderate">Moderate</option>
              <option value="High">High</option>
            </select>
          </div>

          {/* Generate Encounter Button */}
          <button
            onClick={handleSpendBudget}
            style={styles.generateButton}
            onMouseOver={(e) => e.target.style.backgroundColor = '#B11716'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#58180D'}
          >
            Generate Encounter
          </button>

          {/* Combined encounter results */}
          {(encounterResult || (encounterDistance !== null && finalTerrain)) && (
            <div style={styles.encounterResult}>
              {encounterResult && (
                <>
                  <p>
                    <span style={styles.emphasis}>Encounter:</span> {formatEncounterResult(encounterResult, 'Any', factionResult, selectedRegion)}
                  </p>
                  {namesResult && namesResult.size > 0 && (
                    <div style={styles.participantRoster}>
                      {Array.from(namesResult.entries()).map(([idx, info]) => (
                        <div key={idx} style={styles.participantName}>
                          • {info.name} <span style={{ opacity: 0.7, fontSize: '0.85em' }}>({info.monsterName})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              {encounterResult && encounterResult.totalXP && (
                <p>
                  <span style={styles.emphasis}>Used XP:</span> {encounterResult.totalXP.toLocaleString()} / {totalXP.toLocaleString()}
                </p>
              )}
              {encounterDistance !== null && finalTerrain && (
                <p>
                  <span style={styles.emphasis}>Distance:</span>{' '}
                  {encounterDistance} ft. ({finalTerrain})
                </p>
              )}
              {reactionResult && (
                <p>
                  <span style={styles.emphasis}>Reaction:</span>{' '}
                  {reactionResult.attitude} ({reactionResult.roll}) — {reactionResult.description}
                </p>
              )}
              {initiativeResult && initiativeResult.length > 0 && (
                <p>
                  <span style={styles.emphasis}>Initiative:</span>{' '}
                  {initiativeResult.map((g, i) => (
                    <span key={i}>
                      {g.count > 1 ? g.name + 's' : g.name}: {g.roll}
                      {i < initiativeResult.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </p>
              )}
              {perceptionResult !== null && (
                <p>
                  <span style={styles.emphasis}>Perception (best):</span> {perceptionResult}
                </p>
              )}
              {stealthResult !== null && stealthResult !== Infinity && (
                <p>
                  <span style={styles.emphasis}>Stealth (worst):</span> {stealthResult}
                </p>
              )}
              {encounterJSON && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(encounterJSON, null, 2));
                    }}
                    style={{
                      ...styles.generateButton,
                      backgroundColor: '#4A4A4A',
                      padding: '0.5rem 1rem',
                      fontSize: '0.9rem'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#666'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#4A4A4A'}
                  >
                    Copy JSON
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Title at bottom */}
          <div style={styles.appTitleBottom}>D&D 5e 2024 Forgotten Realms Encounter Generator</div>
        </div>
      </div>
    </div>
  );
}

export default App;