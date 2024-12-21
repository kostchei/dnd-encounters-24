import React, { useState } from 'react';

function App() {
  // Difficulty table (level -> { Low, Moderate, High })
  // Excludes "Random" because that's a special case
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

  // Each "line" is { level: 1..20, count: 1..8 }
  const [lines, setLines] = useState([
    { level: 1, count: 1 },
  ]);

  // Difficulty states: "Low", "Moderate", "High", "Random"
  const [difficulty, setDifficulty] = useState('High');

  // Add a new line if we have fewer than 3
  const addLine = () => {
    if (lines.length < 3) {
      setLines((prev) => [...prev, { level: 1, count: 1 }]);
    }
  };

  // Handle changes in a line’s level or count
  const handleLineChange = (index, field, value) => {
    const newLines = [...lines];
    newLines[index][field] = parseInt(value, 10); 
    setLines(newLines);
  };

  // Randomly pick one of [Low, Moderate, High] if difficulty === "Random"
  const getDifficultyValue = () => {
    if (difficulty === 'Random') {
      const difficulties = ['Low', 'Moderate', 'High'];
      const randomIndex = Math.floor(Math.random() * difficulties.length);
      return difficulties[randomIndex];
    }
    return difficulty;
  };

  // Calculate total XP from all lines
  const calculateTotalXP = () => {
    const finalDifficulty = getDifficultyValue();
    let total = 0;

    lines.forEach((line) => {
      const xpRow = XP_TABLE[line.level];
      if (!xpRow) return; // safety check
      const xpValue = xpRow[finalDifficulty]; // e.g. xpRow["High"]
      total += xpValue * line.count;
    });

    return total;
  };

  const totalXP = calculateTotalXP();

  return (
    <div style={styles.container}>
      <h1>D&D Encounter XP Budget</h1>
      <p>
        Select up to 3 lines of party members. Pick the <strong>level</strong> and{' '}
        <strong>number of characters</strong>. Also choose a <strong>difficulty</strong>.
      </p>

      {/* Difficulty dropdown */}
      <div style={styles.row}>
        <label htmlFor="difficulty" style={styles.label}>
          Difficulty:
        </label>
        <select
          id="difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          style={styles.select}
        >
          <option value="Low">Low</option>
          <option value="Moderate">Moderate</option>
          <option value="High">High</option>
          <option value="Random">Random</option>
        </select>
      </div>

      {/* Lines for level & count */}
      {lines.map((line, index) => (
        <div key={index} style={styles.lineContainer}>
          <label style={styles.label}>Level: </label>
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

      {/* Button to add a new line (max 3) */}
      {lines.length < 3 && (
        <button onClick={addLine} style={styles.addButton}>
          + Add Another Line
        </button>
      )}

      {/* Display total XP budget */}
      <div style={styles.resultContainer}>
        <h2>Total XP Budget: {totalXP.toLocaleString()}</h2>
      </div>
    </div>
  );
}

export default App;

// Some inline styling just for demonstration
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

