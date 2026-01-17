const fs = require('fs');
const path = require('path');

const filePath = 'D:\\Code\\dnd-encounters-24\\5etools-v2.23.0\\data\\adventure\\adventure-qftis.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

function traverse(node, depth = 0) {
    if (!node) return;
    const indent = '  '.repeat(depth);
    if (node.name) {
        console.log(`${indent}${node.name} (${node.type})`);
    }

    if (node.entries && Array.isArray(node.entries)) {
        node.entries.forEach(e => traverse(e, depth + 1));
    }
    if (node.sections) {
        node.sections.forEach(s => traverse(s, depth + 1));
    }
    // data array
    if (Array.isArray(node)) {
        node.forEach(n => traverse(n, depth));
    }
}

// 5etools structure usually has { data: [ ... ] }
if (data.data) {
    traverse(data.data);
} else {
    traverse(data);
}
