const fs = require('fs');
const path = require('path');

const filePath = 'D:\\Code\\dnd-encounters-24\\data\\Adventures\\sub_book_encounters.md';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

let currentAdventure = null;
let hasItems = false;
let emptyAdventures = [];
let populatedCount = 0;

lines.forEach(line => {
    const match = line.match(/^###\s+(.*)$/);
    if (match) {
        if (currentAdventure && !hasItems) {
            emptyAdventures.push(currentAdventure);
        } else if (currentAdventure && hasItems) {
            populatedCount++;
        }
        currentAdventure = match[1].trim();
        hasItems = false;
    } else if (line.trim().startsWith('- [ ]')) {
        hasItems = true;
    }
});
// Check last one
if (currentAdventure && !hasItems) {
    emptyAdventures.push(currentAdventure);
} else if (currentAdventure && hasItems) {
    populatedCount++;
}

console.log(`Populated: ${populatedCount}`);
console.log(`Empty: ${emptyAdventures.length}`);
console.log('Empty Adventures:');
emptyAdventures.forEach(a => console.log(`- ${a}`));
