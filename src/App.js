import React, { useState } from 'react';
import XP_TABLE from './enc_xp.json';
import MONSTERS_BY_CR from './enc_by_cr.json';
import { spendEncounterBudget } from './spend_enc_xp.js';
import styles from './styles';
import banner from './banner.jpg';  // Import the banner image

// Simple dice roller: rollDice(2, 6) -> sum of 2d6
function rollDice(numDice, sides) {
  let total = 0;
  for (let i = 0; i < numDice; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total;
}

// Map each terrain to a function that returns a distance.
// Multiply by 10 for your desired scale (e.g. 2d6 * 10 ft).
const terrainDistanceMap = {
  'Open/Desert/Arctic': () => rollDice(6, 6) * 10,
  'Forest': () => rollDice(2, 8) * 10,
  'Hills/Urban': () => rollDice(2, 10) * 10,
  'Mountains': () => rollDice(4, 10) * 10,
  'Jungle/Indoors': () => rollDice(2, 6) * 10,
};

// Helper function to parse CR from the spendEncounterBudget result
function parseCRFromResult(result) {
  // Result format is like "2 × CR3" or "1 × CR1/4"
  const crMatch = result.match(/CR([\d/]+)/);
  if (crMatch) {
    return crMatch[1]; // Returns the CR value (e.g., "3" or "1/4")
  }
  return "1/8"; // Default to lowest CR if we can't parse
}

// Helper function to get random monster from array
function getRandomMonster(monsters) {
  if (!monsters || monsters.length === 0) return "No monster available";
  return monsters[Math.floor(Math.random() * monsters.length)];
}

function App() {
  // Up to 3 lines => each { level, count }
  const [lines, setLines] = useState([{ level: 1, count: 1 }]);

  // Difficulty states
  const [difficulty, setDifficulty] = useState('High');
  const [resolvedDifficulty, setResolvedDifficulty] = useState('High');

  // The "Encounter Type" dropdown
  const [encounterType, setEncounterType] = useState('Any');

  // "Terrain" dropdown
  const [terrain, setTerrain] = useState('Random');

  // Store the final result of "spending" the XP budget here
  const [spentEncounter, setSpentEncounter] = useState('');

  // Store the calculated "Encounter Distance" here
  const [encounterDistance, setEncounterDistance] = useState(null);

  // Keep track of the final terrain chosen
  const [finalTerrain, setFinalTerrain] = useState('');

  const handleDifficultyChange = (e) => {
    const choice = e.target.value;
    setDifficulty(choice);

    if (choice === 'Random') {
      const possibilities = ['Low', 'Moderate', 'High'];
      setResolvedDifficulty(
        possibilities[Math.floor(Math.random() * possibilities.length)]
      );
    } else {
      setResolvedDifficulty(choice);
    }
  };

  const addLine = () => {
    if (lines.length < 3) {
      setLines((prev) => [...prev, { level: 1, count: 1 }]);
    }
  };

  const handleLineChange = (index, field, value) => {
    const newLines = [...lines];
    newLines[index][field] = parseInt(value, 10);
    setLines(newLines);
  };

  // Calculate total XP from the party input
  const calculateTotalXP = () => {
    let total = 0;
    lines.forEach((line) => {
      const xpRow = XP_TABLE[line.level];
      if (xpRow) {
        total += xpRow[resolvedDifficulty] * line.count;
      }
    });
    return total;
  };

  const totalXP = calculateTotalXP();
  const difficultyLabel = resolvedDifficulty + ' XP Encounter';

  const handleSpendBudget = () => {
    const allLevels = lines.map((l) => l.level);
    const partySize = lines.reduce((sum, l) => sum + l.count, 0);

    // Get the encounter string from spendEncounterBudget
    const encounterResult = spendEncounterBudget(totalXP, allLevels, partySize);
    
    // Parse the CR from the result
    const cr = parseCRFromResult(encounterResult);
    
    // Get the quantity of monsters (if needed)
    const quantityMatch = encounterResult.match(/(\d+) ×/);
    const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
    
    // Find monsters for this CR
    const monstersForCR = MONSTERS_BY_CR.find(entry => entry.challenge_rating === cr);
    
    // Process Encounter Type
    let chosenEncounterType = encounterType;
    if (chosenEncounterType === 'Any') {
      const encounterOptions = ['Lolth', 'Vecna', 'BloodWar', 'Off Arc', 'Dragons'];
      chosenEncounterType = encounterOptions[Math.floor(Math.random() * encounterOptions.length)];
    }
    
    // Get a random monster of the chosen type
    let monster = "No suitable monster found";
    if (monstersForCR && monstersForCR[chosenEncounterType] && monstersForCR[chosenEncounterType].length > 0) {
      monster = getRandomMonster(monstersForCR[chosenEncounterType]);
    }

    // Process Terrain
    let chosenTerrain = terrain;
    if (chosenTerrain === 'Random') {
      const terrainOptions = Object.keys(terrainDistanceMap);
      chosenTerrain = terrainOptions[Math.floor(Math.random() * terrainOptions.length)];
    }

    const distanceFn = terrainDistanceMap[chosenTerrain];
    const distance = distanceFn ? distanceFn() : 0;

    setFinalTerrain(chosenTerrain);
    
    // Format the final encounter string with quantity if more than 1
    const monsterString = quantity > 1 ? `${quantity}× ${monster}` : monster;
    setSpentEncounter(`${chosenEncounterType} (CR ${cr}): ${monsterString}`);
    setEncounterDistance(distance);
  };

  return (
    <div style={styles.container}>
      <div style={styles.mistOverlay} />
      <div style={styles.contentWrapper}>
        <img src={banner} alt="D&D Banner" style={styles.banner} />
        
        <div style={styles.innerContainer}>
          <h1 style={styles.title}>D&D Encounter Generator</h1>
  
          {/* Difficulty dropdown */}
          <div style={styles.row}>
            <label htmlFor="difficulty" style={styles.label}>
              Difficulty:
            </label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={handleDifficultyChange}
              style={styles.select}
            >
              <option value="Low">Low</option>
              <option value="Moderate">Moderate</option>
              <option value="High">High</option>
              <option value="Random">Random</option>
            </select>
          </div>
  
          <p style={styles.emphasis}>
            Currently using: <strong>{difficultyLabel}</strong>
          </p>
  
          {lines.map((line, index) => (
            <div key={index} style={styles.lineContainer}>
              <label style={styles.label}>Level:</label>
              <select
                value={line.level}
                onChange={(e) => handleLineChange(index, 'level', e.target.value)}
                style={styles.select}
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
  
              <label style={styles.label}>
                # of Characters:
              </label>
              <select
                value={line.count}
                onChange={(e) => handleLineChange(index, 'count', e.target.value)}
                style={styles.select}
              >
                {Array.from({ length: 8 }, (_, i) => i + 1).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          ))}
  
          {lines.length < 3 && (
            <button onClick={addLine} style={styles.addButton}>
              + Add Another Line
            </button>
          )}
  
          {/* Display total XP */}
          <div style={styles.resultContainer}>
            <h2 style={styles.emphasis}>Total XP Budget: {totalXP.toLocaleString()}</h2>
          </div>
  
          {/* Encounter Type dropdown */}
          <div style={styles.row}>
            <label style={styles.label}>Encounter Type:</label>
            <select
              value={encounterType}
              onChange={(e) => setEncounterType(e.target.value)}
              style={styles.select}
            >
              <option value="Lolth">Lolth</option>
              <option value="Vecna">Vecna</option>
              <option value="BloodWar">Blood War</option>
              <option value="Off Arc">Off Arc</option>
              <option value="Dragons">Dragons</option>
              <option value="Any">Any</option>
            </select>
          </div>
  
          {/* Terrain dropdown */}
          <div style={styles.row}>
            <label style={styles.label}>Terrain:</label>
            <select
              value={terrain}
              onChange={(e) => setTerrain(e.target.value)}
              style={styles.select}
            >
              <option value="Random">Random</option>
              <option value="Open/Desert/Arctic">Open/Desert/Arctic</option>
              <option value="Forest">Forest</option>
              <option value="Hills/Urban">Hills/Urban</option>
              <option value="Mountains">Mountains</option>
              <option value="Jungle/Indoors">Jungle/Indoors</option>
            </select>
          </div>
  
          {/* Spend XP Budget button + results */}
          <button onClick={handleSpendBudget} style={styles.addButton}>
            Spend XP Budget
          </button>
  
          {/* Combined encounter results */}
          {(spentEncounter || (encounterDistance !== null && finalTerrain)) && (
            <div style={styles.encounterResult}>
              {spentEncounter && (
                <p>
                  <span style={styles.emphasis}>Encounter:</span> {spentEncounter}
                </p>
              )}
              {encounterDistance !== null && finalTerrain && (
                <p>
                  <span style={styles.emphasis}>Encounter Distance:</span>{' '}
                  {encounterDistance} ft. (Terrain: {finalTerrain})
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;