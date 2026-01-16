import React, { useState, useEffect, useCallback } from 'react';
import XP_TABLE from './data/enc_xp.json';
import { generateNewEncounter } from './new_encounter_system.js';
import styles from './styles';

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
function formatEncounterResult(encounterResult, selectedTheme) {
  if (encounterResult.error) {
    return `Error: ${encounterResult.error}`;
  }

  let result = encounterResult.description;

  if (selectedTheme === 'Any' && encounterResult.theme) {
    result += ` [${encounterResult.theme} theme]`;
  }

  return result;
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

    // Calculate distance using region's terrain
    const distanceFn = terrainDistanceMap[regionTerrain];
    const distance = distanceFn ? distanceFn() : 0;

    // Roll 2d6 for reaction
    const reactionRoll = rollDice(2, 6);
    let reaction;
    if (reactionRoll <= 4) {
      reaction = { roll: reactionRoll, attitude: 'Hostile', description: 'openly aggressive, obstructive, or likely to attack' };
    } else if (reactionRoll <= 9) {
      reaction = { roll: reactionRoll, attitude: 'Indifferent', description: 'cautious, neutral, will deal if there\'s a clear reason' };
    } else {
      reaction = { roll: reactionRoll, attitude: 'Friendly', description: 'helpful, open, inclined to cooperate' };
    }

    setFinalTerrain(regionTerrain);
    setEncounterDistance(distance);
    setReactionResult(reaction);
  };

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
                <p>
                  <span style={styles.emphasis}>Encounter:</span> {formatEncounterResult(encounterResult, 'Any')}
                </p>
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