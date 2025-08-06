import React, { useState, useEffect, useCallback } from 'react';
import XP_TABLE from './enc_xp.json';
import { generateNewEncounter } from './new_encounter_system.js';
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

// Helper function to format encounter result for display
function formatEncounterResult(encounterResult) {
  if (encounterResult.error) {
    return `Error: ${encounterResult.error}`;
  }
  
  return `${encounterResult.category}: ${encounterResult.description}`;
}

function App() {
  // Up to 3 lines => each { level, count }
  const [lines, setLines] = useState([{ level: 1, count: 1 }]);

  // Difficulty states
  const [difficulty, setDifficulty] = useState('High');
  const [resolvedDifficulty, setResolvedDifficulty] = useState('High');

  // Store the encounter result object
  const [encounterResult, setEncounterResult] = useState(null);

  // "Terrain" dropdown
  const [terrain, setTerrain] = useState('Random');

  // Store the calculated "Encounter Distance" here
  const [encounterDistance, setEncounterDistance] = useState(null);

  // Keep track of the final terrain chosen
  const [finalTerrain, setFinalTerrain] = useState('');

  // Calculate total XP from the party input
  const calculateTotalXP = useCallback(() => {
    let total = 0;
    lines.forEach((line) => {
      const xpRow = XP_TABLE[line.level];
      if (xpRow) {
        total += xpRow[resolvedDifficulty] * line.count;
      }
    });
    return total;
  }, [lines, resolvedDifficulty]);

  const [totalXP, setTotalXP] = useState(calculateTotalXP());

  useEffect(() => {
    setTotalXP(calculateTotalXP());
  }, [calculateTotalXP]);

  const difficultyLabel = resolvedDifficulty + ' XP Encounter';

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

  const handleSpendBudget = () => {
    const allLevels = lines.map((l) => l.level);
    const partySize = lines.reduce((sum, l) => sum + l.count, 0);

    // Use the new encounter generation system
    const newEncounter = generateNewEncounter(totalXP, allLevels, partySize);
    setEncounterResult(newEncounter);

    // Process Terrain
    let chosenTerrain = terrain;
    if (chosenTerrain === 'Random') {
      const terrainOptions = Object.keys(terrainDistanceMap);
      chosenTerrain = terrainOptions[Math.floor(Math.random() * terrainOptions.length)];
    }

    const distanceFn = terrainDistanceMap[chosenTerrain];
    const distance = distanceFn ? distanceFn() : 0;

    setFinalTerrain(chosenTerrain);
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
  
          {/* New encounter categories info */}
          <div style={styles.row}>
            <p style={styles.emphasis}>
              Encounter Categories: Dragon/Legendary, Mounts & Riders, Groups, Mixed Groups
            </p>
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
          {(encounterResult || (encounterDistance !== null && finalTerrain)) && (
            <div style={styles.encounterResult}>
              {encounterResult && (
                <p>
                  <span style={styles.emphasis}>Encounter:</span> {formatEncounterResult(encounterResult)}
                </p>
              )}
              {encounterResult && encounterResult.totalXP && (
                <p>
                  <span style={styles.emphasis}>Used XP:</span> {encounterResult.totalXP.toLocaleString()} / {totalXP.toLocaleString()}
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