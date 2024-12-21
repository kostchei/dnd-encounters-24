import React, { useState } from 'react';
import XP_TABLE from './enc_xp.json';
import { spendEncounterBudget } from './spend_enc_xp.js'; // <-- Our new function
import styles from './styles'; // If you have the styles in a separate file or keep them inline

function App() {
  // lines: up to 3 lines => each { level, count }
  const [lines, setLines] = useState([{ level: 1, count: 1 }]);

  // Difficulty states (existing logic)
  const [difficulty, setDifficulty] = useState('High');
  const [resolvedDifficulty, setResolvedDifficulty] = useState('High');

  // The new "Encounter Type" dropdown
  const [encounterType, setEncounterType] = useState('Any');

  // We'll store the final result of "spending" the XP budget here
  const [spentEncounter, setSpentEncounter] = useState('');

  // The rest of your existing logic...
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

  // *** New handler for the "Spend XP Budget" button ***
  const handleSpendBudget = () => {
    // We'll gather the data we need:
    // 1) totalXP
    // 2) array of levels
    // 3) total party size (# of characters)
    const allLevels = lines.map((l) => l.level);
    const partySize = lines.reduce((sum, l) => sum + l.count, 0);

    // We call our function from spend_enc_xp.js
    const result = spendEncounterBudget(totalXP, allLevels, partySize);

    // Optionally incorporate the encounterType in the result
    // e.g. "Lolth: 5x CR3" or "Any: 1x CR7"
    const finalString = `${encounterType}: ${result}`;
    setSpentEncounter(finalString);
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
              <option key={lvl} value={lvl}>{lvl}</option>
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
              <option key={c} value={c}>{c}</option>
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

      {/* New Encounter Type dropdown */}
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
    </div>
  );
}

export default App;
