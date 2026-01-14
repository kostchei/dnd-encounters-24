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

// Check JSON files
const checkFile = (filename) => {
    const filePath = path.join('d:/Code/dnd-encounters-24/src/data', filename);
    if (!fs.existsSync(filePath)) {
        console.log(`${filename} not found.`);
        return;
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let invalidCount = 0;
    let invalidNames = [];

    data.forEach(m => {
        if (!validMonsters.has(m.Name)) {
            invalidCount++;
            if (invalidNames.length < 5) invalidNames.push(m.Name);
        }
    });

    console.log(`\nChecking ${filename}:`);
    console.log(`Total entries: ${data.length}`);
    console.log(`Invalid entries: ${invalidCount}`);
    if (invalidCount > 0) {
        console.log(`First 5 invalid: ${invalidNames.join(', ')}`);
    }
};

checkFile('mounts.json');
checkFile('riders.json');
checkFile('dragon.json');
checkFile('legendary.json');
