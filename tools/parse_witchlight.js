const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '../data/Adventures/TheWildBeyondTheWitchLight.md');
const outputFile = path.join(__dirname, '../data/witchlight_encounters.json');

const content = fs.readFileSync(inputFile, 'utf-8');
const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);

const monsters = [];
let i = 0;

function isCR(line) {
    // CR can be "0", "1/8", "1", "20", etc.
    return /^\d+(\/\d+)?$/.test(line);
}

while (i < lines.length) {
    // Try to find the start of a monster block (CR)
    if (isCR(lines[i])) {
        const cr = lines[i];
        const name = lines[i + 1];
        const source = lines[i + 2];

        // Basic validation to ensure we are at a start of a block
        if (name && source) {
            // Extract Type/Tags (this logic matches previous parsers for this format)
            // Usually followed by Type, Size, Alignment
            const typeLine = lines[i + 3];
            const size = lines[i + 4];
            const alignment = lines[i + 5];

            let type = typeLine;

            // Sometimes there's extra lines or structure variations, but let's try standard 6-line header first

            const monster = {
                Name: name,
                CR: cr,
                Type: type,
                Adventure: "The Wild Beyond The Witchlight",
                Region: ["Moonshae", "Heartlands"] // Per user request
            };

            monsters.push(monster);

            // Advance somewhat arbitrarily or try to find next CR
            // Actually, let's just create a simple entries list for now as we enrich later
            // The crucial parts are Name and CR for the merge script
        }

        // Scan forward for next CR
        i++;
        while (i < lines.length && !isCR(lines[i])) {
            i++;
        }
    } else {
        i++;
    }
}

console.log(`Parsed ${monsters.length} monsters.`);
fs.writeFileSync(outputFile, JSON.stringify(monsters, null, 2));
