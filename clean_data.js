const fs = require('fs');
const path = require('path');

// Read the markdown list
const mdPath = 'd:/Code/dnd-encounters-24/data/monsterlistby_cr_dnd2024.md';
const mdContent = fs.readFileSync(mdPath, 'utf8');

// Extract monster names from MD
// Lines like "Bandit" or "Kobold Warrior"
// Exclude empty lines and "CR X" lines
const validMonsters = new Set(
    mdContent.split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('CR '))
);

console.log(`Found ${validMonsters.size} valid monsters in markdown.`);

// Function to clean a file
const cleanFile = (filename) => {
    const filePath = path.join('d:/Code/dnd-encounters-24/src/data', filename);
    if (!fs.existsSync(filePath)) {
        console.log(`${filename} not found.`);
        return;
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const originalCount = data.length;

    // Filter monsters and remove Theme property
    const cleanedData = data
        .filter(m => validMonsters.has(m.Name))
        .map(m => {
            const { Theme, ...rest } = m; // Remove Theme property
            return rest;
        });

    const removedCount = originalCount - cleanedData.length;
    console.log(`Cleaned ${filename}: Removed ${removedCount} invalid entries.`);

    fs.writeFileSync(filePath, JSON.stringify(cleanedData, null, 2));
};

cleanFile('mounts.json');
cleanFile('riders.json');
cleanFile('dragon.json');
cleanFile('legendary.json');
