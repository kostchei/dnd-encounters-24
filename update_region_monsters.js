const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const OUT_FILE = path.join(__dirname, 'src/data/region_monsters.json');

const FILE_MAP = {
    'Encounter spreadsheet - Calimshan.csv': 'calimshan',
    'Encounter spreadsheet - Cities.csv': 'cities',
    'Encounter spreadsheet - Dungeons.csv': 'dungeon',
    'Encounter spreadsheet - Heartlands.csv': 'heartlands',
    'Encounter spreadsheet - IceWind Dale.csv': 'icewind',
    'Encounter spreadsheet - Moonshae.csv': 'moonshae'
};

function parseCSVLine(line) {
    // Simple split by comma. 
    // If we need to handle quotes, this will be insufficient, but for the current files it seems okay.
    return line.split(',').map(item => item.trim());
}

function parseCSV(filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split(/\r?\n/);

    const regionData = {};

    lines.forEach((line, index) => {
        if (!line || line.trim() === '') return;

        const parts = parseCSVLine(line);
        if (parts.length === 0) return;

        // Header check
        if (index === 0 && parts[0].toLowerCase() === 'cr') return;

        const cr = parts[0];
        if (!cr) return;

        // Monsters are the rest
        const monsters = parts.slice(1).filter(m => m.length > 0);

        if (monsters.length > 0) {
            regionData[cr] = monsters;
        }
    });

    return regionData;
}

function main() {
    console.log('Starting Region Monsters Update (Vanilla JS)...');

    let fullData = {};
    if (fs.existsSync(OUT_FILE)) {
        try {
            fullData = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
        } catch (e) {
            console.warn('Could not parse existing JSON, starting fresh.');
        }
    }

    for (const [filename, jsonKey] of Object.entries(FILE_MAP)) {
        const filePath = path.join(DATA_DIR, filename);
        if (fs.existsSync(filePath)) {
            console.log(`Processing ${filename} -> ${jsonKey}`);
            const regionData = parseCSV(filePath);
            fullData[jsonKey] = regionData;
        } else {
            console.warn(`Warning: File ${filename} not found.`);
        }
    }

    fs.writeFileSync(OUT_FILE, JSON.stringify(fullData, null, 4));
    console.log(`Successfully updated ${OUT_FILE}`);
}

main();
