const fs = require('fs');
const path = require('path');

const adventureDir = 'D:\\Code\\dnd-encounters-24\\5etools-v2.23.0\\data\\adventure';
const bookDir = 'D:\\Code\\dnd-encounters-24\\5etools-v2.23.0\\data\\book';

const targetFiles = [
    path.join(adventureDir, 'adventure-kftgv.json'),
    path.join(adventureDir, 'adventure-cm.json'),
    path.join(bookDir, 'book-fraif.json')
];

const aliases = {
    "Baker's Dozen": "Baker's Doesn't",
    "The Eyes of Atar": "The Eyes of At'ar",
    "Safehouse Standoff": "Safe House Standoff",
    "Mazfroth’s Mighty Digressions": "Mazfroth's Mighty Digressions"
    // Add others if needed
};

// 1. Read headers from sub_book_encounters.md
const templatePath = 'D:\\Code\\dnd-encounters-24\\data\\Adventures\\sub_book_encounters.md';
if (!fs.existsSync(templatePath)) {
    console.error("Template file not found!");
    process.exit(1);
}

const templateContent = fs.readFileSync(templatePath, 'utf8');
const lines = templateContent.split('\n');
const targetAdventures = new Map(); // Name -> Original Header Name

lines.forEach(line => {
    const match = line.match(/^###\s+(.*)$/);
    if (match) {
        let title = match[1].trim();
        targetAdventures.set(title, title);
        if (aliases[title]) {
            targetAdventures.set(aliases[title], title);
        }
    }
});

console.log(`Looking for ${targetAdventures.size} adventures...`);

// Helper to extract creatures
function extractCreatures(text) {
    const regex = /{@creature ([^}|]+)(?:\|[^}]*)?}/g;
    const creatures = new Set();
    let match;
    while ((match = regex.exec(text)) !== null) {
        creatures.add(match[1]);
    }
    return creatures;
}

// Traverse to extract creatures from a NODE
function traverseExtract(entry, creatures) {
    if (!entry) return;
    if (typeof entry === 'string') {
        extractCreatures(entry).forEach(c => creatures.add(c));
        return;
    }
    if (Array.isArray(entry)) {
        entry.forEach(e => traverseExtract(e, creatures));
        return;
    }
    if (typeof entry === 'object') {
        if (entry.name && typeof entry.name === 'string') {
            extractCreatures(entry.name).forEach(c => creatures.add(c));
        }
        const keys = ['entries', 'items', 'rows', 'caption', 'data'];
        keys.forEach(key => {
            if (entry[key]) traverseExtract(entry[key], creatures);
        });
        if (entry.type === 'table' && entry.rows) {
            entry.rows.forEach(row => traverseExtract(row, creatures));
        }
    }
}

const monsterMap = new Map(); // Header -> Set of Monsters

// Traverse to FIND adventures
function traverseFindAdventures(entry) {
    if (!entry) return;

    // Check if this entry is one of our targets
    if (typeof entry === 'object' && entry.name && typeof entry.name === 'string') {
        const name = entry.name.trim();
        console.log(`Scanning section: "${name}"`); // Uncomment for debug

        // Exact match check
        let headerName = targetAdventures.get(name);

        // Fuzzy check if exact failed
        if (!headerName) {
            for (const [key, val] of targetAdventures.entries()) {
                if (name.includes(key) || key.includes(name)) {
                    // Safety length check
                    if (Math.abs(name.length - key.length) < 50) {
                        headerName = val;
                        break;
                    }
                }
            }
        }

        if (headerName) {
            console.log(`Found adventure: "${name}" -> "${headerName}"`);
            if (!monsterMap.has(headerName)) {
                monsterMap.set(headerName, new Set());
            }
            traverseExtract(entry, monsterMap.get(headerName));
            // Don't recurse into this adventure looking for MORE adventures (usually)
            // But actually, simple recursion is safer? 
            // No, if we found the adventure, we extract EVERYTHING inside it as belonging to it.
            return;
        }
    }

    // Recurse
    if (Array.isArray(entry)) {
        entry.forEach(e => traverseFindAdventures(e));
        return;
    }
    if (typeof entry === 'object') {
        const keys = ['entries', 'items', 'rows', 'data']; // 'data' for top level
        keys.forEach(key => {
            if (entry[key]) traverseFindAdventures(entry[key]);
        });
    }
}

function processFile(filePath) {
    try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const filename = path.basename(filePath);
        console.log(`Processing ${filename}...`);
        traverseFindAdventures(content); // Start at root
    } catch (e) {
        console.error(`Error processing ${filePath}: ${e.message}`);
    }
}

// Run processing
targetFiles.forEach(f => {
    if (fs.existsSync(f)) processFile(f);
});

const allAdventureFiles = fs.readdirSync(adventureDir).map(f => path.join(adventureDir, f));
allAdventureFiles.filter(f => path.basename(f).startsWith('adventure-drde-') || path.basename(f).startsWith('adventure-tftyp-') || path.basename(f) === 'adventure-qftis.json').forEach(f => {
    processFile(f);
});

// Update Markdown
let newLines = [];
let populatedCount = 0;

lines.forEach(line => {
    newLines.push(line);
    const headerMatch = line.match(/^###\s+(.*)$/);
    if (headerMatch) {
        const title = headerMatch[1].trim();

        // Check if we already have a list here (don't duplicate if script runs twice?)
        // The script reads the file fresh each time, but `lines` contains existing text.
        // We should skip existing checklist items if we are regenerating.
        // Actually, the simplest is: filter out existing list items in the file reading phase?
        // Or just let the user handle partial duplication. 
        // Better: I will output the file fresh-ish, OR just append. 
        // User asked to "list them in that doc".

        if (monsterMap.has(title)) {
            const creatures = monsterMap.get(title);
            if (creatures.size > 0) {
                // We're expecting to insert new lines.
                // But wait, if I run this script twice, it will duplicate.
                // I won't solve idempotency perfectly now, just assumes I'm generating for the first time or overwriting specific sections.
                // Actually, I should check if the next lines are already list items.
                // Whatever, I'll just append.
                const sorted = Array.from(creatures).sort();
                sorted.forEach(c => {
                    newLines.push(`- [ ] ${c}`);
                });
                populatedCount++;
            }
        }
    }
    // Note: this naive approach keeps existing lines. If there were existing items, they remain.
    // That's probably fine.
});

// Remove OLD list items? The previous run added items.
// If I verify the file has content, I should probably STRIP old items before adding new ones.
// I will just strip checks for now to be clean.
const cleanedLines = [];
let skip = false;
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/^###\s+/)) {
        cleanedLines.push(line);
        // Find title
        const title = line.match(/^###\s+(.*)$/)[1].trim();
        if (monsterMap.has(title)) {
            const creatures = monsterMap.get(title);
            Array.from(creatures).sort().forEach(c => {
                cleanedLines.push(`- [ ] ${c}`);
            });
        }
        skip = true; // Skip subsequent lines until next header? 
        // No, we might delete "Region:" lines or empty lines.
        // The template has "**Region:** ..." lines. We MUST keep them.
    } else if (line.trim().startsWith('- [ ]')) {
        // Skip existing checkboxes
    } else {
        // Keep checking Region etc.
        cleanedLines.push(line);
    }
}

// Rewriting logic with 'cleanedLines' is safer to avoid duplication.
// But wait, my loop above (lines.forEach) was pushing to newLines.
// I'll swap to the stripping logic.

fs.writeFileSync(templatePath, cleanedLines.join('\n'));
console.log(`Updated sub_book_encounters.md. Populated sections: ${populatedCount}`);
