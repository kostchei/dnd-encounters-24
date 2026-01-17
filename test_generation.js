const { generateNewEncounter } = require('./src/new_encounter_system.js');

// Mock state and setters
const mockSetters = {
    setEncounterDistance: () => { },
    setEncounterList: () => { },
    setMonsterStats: () => { },
    setTotalXp: () => { },
    setDifficultyMultiplier: () => { },
    setTrivial: () => { },
    setEasy: () => { },
    setMedium: () => { },
    setHard: () => { },
    setDeadly: () => { }
};

// Monsters to check
const targetMonsters = [
    { name: "Thessalhydra", region: "calimshan", cr: 4 },
    { name: "Fleecemane Lion", region: "calimshan", cr: 3 },
    { name: "Ambitious Assassin", region: "cities", cr: 5 },
    { name: "Yestabrod", region: "dungeon", cr: 4 },
    { name: "Gar Shatterkeel", region: "moonshae", cr: 9 },
    { name: "Auril (First Form)", region: "icewind", cr: 9 },
    { name: "Aphemia", region: "heartlands", cr: 5 }
];

console.log("Starting verification...");

let foundCount = 0;
const maxAttempts = 500; // Try enough times to hit the random chance

targetMonsters.forEach(target => {
    let found = false;
    console.log(`Looking for ${target.name} in ${target.region} (CR ${target.cr})...`);

    for (let i = 0; i < maxAttempts; i++) {
        // Generate encounter for specific region and CR (party level roughly matches CR)
        // We mock party level to match CR for higher chance of selection if logic uses CR
        const partyLevel = target.cr;

        // Note: generateNewEncounter logic might be complex, we just need to see if it *can* return the monster.
        // We might need to adjust inputs to force specific CR buckets if possible, 
        // or just rely on random chance if it pulls from the region bucket correctly.
        // Looking at the region_monsters.json, they are in specific CR keys.

        // We need to verify if generateNewEncounter reads from region_monsters.json
        // For this test, we might just assume it does if we see the name in the output list.

        // However, generateNewEncounter returns void and calls setters.
        // We need to intercept the setEncounterList call.

        let generatedList = [];
        const spySetEncounterList = (list) => {
            generatedList = list;
        };

        // We need to require the module fresh or mock the state better if it has internal state.
        // But let's try calling it.

        // We need to look at how generateNewEncounter works. 
        // It takes (region, terrain, partyLevel, partySize, difficulty, ...)
        // terrain is often ignored or derived.

        try {
            generateNewEncounter(
                target.region,
                "check_code_for_terrain_defaults", // terrain
                partyLevel, // partyLevel
                4, // partySize
                'Medium', // difficulty
                { ...mockSetters, setEncounterList: spySetEncounterList }
            );
        } catch (e) {
            // If it fails due to missing DOM or whatever, we might need a simpler check.
            // But let's assume it's pure JS logic mostly.
        }

        if (generatedList.some(m => m.Name === target.name)) {
            found = true;
            console.log(`  SUCCESS: Found ${target.name}!`);
            foundCount++;
            break;
        }
    }

    if (!found) {
        console.log(`  FAILURE: Could not generate ${target.name} after ${maxAttempts} attempts.`);
    }
});

console.log(`\nVerification complete. Found ${foundCount}/${targetMonsters.length} target monsters.`);
