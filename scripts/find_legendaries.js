const fs = require('fs');
const path = require('path');

const bestiaryDir = 'D:\\Code\\dnd-encounters-24\\5etools-v2.23.0\\data\\bestiary';
const outputDir = 'D:\\Code\\dnd-encounters-24\\data'; // Or just log to console

function scanBestiary() {
    const files = fs.readdirSync(bestiaryDir);
    const legendaryCreatures = [];

    files.forEach(file => {
        if (!file.startsWith('bestiary-') || file.includes('fluff')) return;

        try {
            const content = fs.readFileSync(path.join(bestiaryDir, file), 'utf8');
            const json = JSON.parse(content);

            if (!json.monster) return;

            json.monster.forEach(monster => {
                if (monster.legendary || monster.legendaryGroup) {
                    legendaryCreatures.push({
                        name: monster.name,
                        source: monster.source,
                        cr: monster.cr,
                        type: monster.type,
                        environment: monster.environment || [],
                        hasLegendaryActions: !!monster.legendary,
                        hasLegendaryGroup: !!monster.legendaryGroup,
                        isNpc: monster.isNpc,
                        isNamedCreature: monster.isNamedCreature
                    });
                }
            });
        } catch (e) {
            console.error(`Error processing ${file}: ${e.message}`);
        }
    });

    // Sort by CR (numerical value)
    legendaryCreatures.sort((a, b) => {
        const getCrVal = (cr) => {
            if (!cr) return 0;
            if (typeof cr === 'object') return parseFloat(cr.cr) || 0;
            if (cr.includes('/')) {
                const parts = cr.split('/');
                return parseFloat(parts[0]) / parseFloat(parts[1]);
            }
            return parseFloat(cr);
        };
        return getCrVal(a.cr) - getCrVal(b.cr);
    });

    fs.writeFileSync(path.join(outputDir, 'legendary_research_output.json'), JSON.stringify(legendaryCreatures, null, 2));
    console.log(`Wrote ${legendaryCreatures.length} legendary creatures to ${path.join(outputDir, 'legendary_research_output.json')}`);
}

scanBestiary();
