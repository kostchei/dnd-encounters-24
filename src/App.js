import React, { useState } from 'react';
import XP_TABLE from './enc_xp.json';
import { spendEncounterBudget } from './spend_enc_xp.js'; // Your existing function
import styles from './styles'; // Assuming you have a styles object

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

function App() {
  // Up to 3 lines => each { level, count }
  const [lines, setLines] = useState([{ level: 1, count: 1 }]);

  // Difficulty states (existing logic)
  const [difficulty, setDifficulty] = useState('High');
  const [resolvedDifficulty, setResolvedDifficulty] = useState('High');

  // The "Encounter Type" dropdown
  const [encounterType, setEncounterType] = useState('Any');

  // New "Terrain" dropdown
  const [terrain, setTerrain] = useState('Random');

  // We'll store the final result of "spending" the XP budget here
  const [spentEncounter, setSpentEncounter] = useState('');

  // We'll store the calculated "Encounter Distance" here
  const [encounterDistance, setEncounterDistance] = useState(null);

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

  // Spend XP Budget button handler
  const handleSpendBudget = () => {
    const allLevels = lines.map((l) => l.level);
    const partySize = lines.reduce((sum, l) => sum + l.count, 0);

    // This uses your existing function from spend_enc_xp.js
    const result = spendEncounterBudget(totalXP, allLevels, partySize);

    // Choose or randomize the terrain
    let chosenTerrain = terrain;
    if (chosenTerrain === 'Random') {
      // Filter out a "Random" key if you do not want it in the real list:
      const terrainOptions = Object.keys(terrainDistanceMap);
      chosenTerrain =
        terrainOptions[Math.floor(Math.random() * terrainOptions.length)];
    }

    // Calculate the distance
    const distanceFn = terrainDistanceMap[chosenTerrain];
    const distance = distanceFn ? distanceFn() : 0;

    // Store them in state
    const finalString = `${encounterType}: ${result}`;
    setSpentEncounter(finalString);
    setEncounterDistance(distance);
  };

  return (
    <div style={styles.container}>
      <h1>D&D Encounter XP Budget</h1>

      {/* Difficulty dropdown */}
      <div style={styles.row}>
        <label htmlFor="difficulty" style={styles.label}>Difficulty:</label>
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

      <p>Currently using: <strong>{difficultyLabel}</strong></p>

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

          <label style={{ marginLeft: '1rem', marginRight: '0.5rem' }}>
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
        <h2>Total XP Budget: {totalXP.toLocaleString()}</h2>
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
          <option value="BloodWar">BloodWar</option>
          <option value="Off Arc">Off Arc</option>
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

      {/* Spend XP Budget button + result */}
      <button onClick={handleSpendBudget} style={styles.addButton}>
        Spend XP Budget
      </button>

      {/* Show the result of spending the budget */}
      {spentEncounter && (
        <div style={{ marginTop: '1rem' }}>
          <p><strong>Encounter:</strong> {spentEncounter}</p>
        </div>
      )}

      {/* Show the terrain-based encounter distance */}
      {encounterDistance !== null && (
        <div style={{ marginTop: '1rem' }}>
          <p><strong>Encounter Distance:</strong> {encounterDistance} ft.</p>
        </div>
      )}
    </div>
  );
}

export default App;
