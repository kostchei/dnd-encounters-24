import React, { useState } from 'react';

function App() {
  // The XP table for each level and difficulty
  const XP_TABLE = {
    1:  { Low: 50,   Moderate: 75,   High: 100 },
    2:  { Low: 100,  Moderate: 150,  High: 200 },
    3:  { Low: 150,  Moderate: 225,  High: 400 },
    4:  { Low: 250,  Moderate: 375,  High: 500 },
    5:  { Low: 500,  Moderate: 750,  High: 1100 },
    6:  { Low: 600,  Moderate: 1000, High: 1400 },
    7:  { Low: 750,  Moderate: 1300, High: 1700 },
    8:  { Low: 1000, Moderate: 1700, High: 2100 },
    9:  { Low: 1300, Moderate: 2000, High: 2600 },
    10: { Low: 1600, Moderate: 2300, High: 3100 },
    11: { Low: 1900, Moderate: 2900, High: 4100 },
    12: { Low: 2200, Moderate: 3700, High: 4700 },
    13: { Low: 2600, Moderate: 4200, High: 5400 },
    14: { Low: 2900, Moderate: 4900, High: 6200 },
    15: { Low: 3300, Moderate: 5400, High: 7800 },
    16: { Low: 3800, Moderate: 6100, High: 9800 },
    17: { Low: 4500, Moderate: 7200, High: 11700 },
    18: { Low: 5000, Moderate: 8700, High: 14200 },
    19: { Low: 5500, Moderate: 10700,High: 17200 },
    20: { Low: 6400, Moderate: 13200,High: 22000 },
  };

  // Store up to 3 "lines", each with { level, count }
  const [lines, setLines] = useState([{ level: 1, count: 1 }]);

  // The dropdown’s actual selection, which can be "Low", "Moderate", "High", or "Random"
  const [difficulty, setDifficulty] = useState('High');

  // The *resolved* difficulty we use in calculations and display.
  // If the user picks "Random", we pick one of Low/Moderate/High and store it here.
  const [resolvedDifficulty, setResolvedDifficulty] = useState('High');

  // Handle user changing difficulty in the dropdown
  const handleDifficultyChange = (e) => {
    const choice = e.target.value;  // "Low", "Moderate", "High", or "Random"
    setDifficulty(choice);

    if (choice === 'Random') {
      // Pick one of the three difficulties
      const possibilities = ['Low', 'Moderate', 'High'];
      const randomPick = possibilities[Math.floor(Math.random() * possibilities.length)];
      setResolvedDifficulty(randomPick);
    } else {
      // They picked Low/Moderate/High explicitly
      setResolvedDifficulty(choice);
    }
  };

  // Add a new line (up to 3)
  const addLine = () => {
    if (lines.length < 3) {
      setLines((prev) => [...prev, { level: 1, count: 1 }]);
    }
  };

  // Update a given line's level or count
  const handleLineChange = (index, field, value) => {
    const newLines = [...lines];
    newLines[index][field] = parseInt(value, 10);
    setLines(newLines);
  };

  // Calculate total XP based on the *resolved* difficulty
  const calculateTotalXP = () => {
    let total = 0;
    lines.forEach((line) => {
      const xpRow = XP_TABLE[line.level];
      if (xpRow) {
        // xpRow might be e.g. { Low: 100, Moderate: 150, High: 200 }
        total += xpRow[resolvedDifficulty] * line.count;
      }
    });
    return total;
  };

  const totalXP = calculateTotalXP();

  // Format how we display the resolved difficulty
  const difficultyLabel = resolvedDifficulty + ' XP Encounter';

  return (
    <div style={styles.container}>
      <h1>D&D Encounter XP Budget</h1>

      {/* Difficulty dropdown */}
      <div style={styles.row}>
        <label htmlFor="difficulty" style={styles.label}>Difficulty:</label>
        <select
          id="difficulty"
          value={difficulty} // user’s "selected" value
          onChange={handleDifficultyChange}
          style={styles.select}
        >
          <option value="Low">Low</option>
          <option value="Moderate">Moderate</option>
          <option value="High">High</option>
          <option value="Random">Random</option>
        </select>
      </div>

      {/* Show which difficulty is actually being used if user picks random */}
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

      <div style={styles.resultContainer}>
        <h2>Total XP Budget: {totalXP.toLocaleString()}</h2>
      </div>
    </div>
  );
}

export default App;

const styles = {
  container: {
    margin: '2rem auto',
    maxWidth: '600px',
    fontFamily: 'Arial, sans-serif',
  },
  row: {
    marginBottom: '1rem',
  },
  label: {
    marginRight: '0.5rem',
  },
  select: {
    padding: '0.25rem',
    fontSize: '1rem',
  },
  lineContainer: {
    marginBottom: '1rem',
  },
  addButton: {
    padding: '0.5rem 1rem',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  resultContainer: {
    marginTop: '2rem',
    padding: '1rem',
    backgroundColor: '#f2f2f2',
    borderRadius: '4px',
  },
};