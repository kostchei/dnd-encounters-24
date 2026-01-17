# Adding New Adventure Data

This guide documents the process for integrating new monster lists from adventure modules (e.g., *Waterdeep: Dragon Heist*, *Baldur's Gate: Descent into Avernus*) into the encounter generation system.

## 1. Prepare the Source Data
Create a raw text file in the `data/` directory (e.g., `data/waterdeep dragon heist` or `data/baldurs_gate_descent_into_avernus`).

The expected format for the raw file is a text dump where each monster entry starts with its Challenge Rating (CR) on a line (or preceding the name), followed by the Name, and then other metadata.
*Example:*
```text
0
Crawling Claw
Legacy
...
1/8
Flying Dagger
...
```

## 2. Generate the Encounter JSON
You need a script to parse this raw text file and "enrich" it with stats (HP, AC, etc.) from the 5etools bestiary data.

A script `tools/process_waterdeep.js` was created for Waterdeep. You can copy and adapt this script for new adventures.

**Steps to adapt:**
1.  Copy `tools/process_waterdeep.js` to a new file, e.g., `tools/process_baldurs_gate.js`.
2.  Update the `SOURCE_FILE` constant to point to your new raw data file.
3.  Update the `OUTPUT_FILE` constant to the desired output name (e.g., `data/baldurs_gate_encounters.json`).
4.  Update the `Adventures` tag in the `outputList.push` object (e.g., `["Baldur's Gate: Descent into Avernus"]`).
5.  Update the `Region` tag to specify where these monsters should appear (e.g., `["Cities", "Dungeons"]`).
6.  Run the script:
    ```bash
    node tools/process_new_adventure.js
    ```
    This will generate the enriched JSON file in `data/`.

## 3. Register the New JSON for Merging
The `tools/merge_monster_lists.js` script combines all source JSONs into the master `enriched_monster_list.json`.

1.  Open `tools/merge_monster_lists.js`.
2.  Import your new JSON file at the top:
    ```javascript
    const BALDURS_PATH = path.join(__dirname, '../data/baldurs_gate_encounters.json');
    ```
3.  Add it to the `filesToMerge` array:
    ```javascript
    const filesToMerge = [PHANDELVER_PATH, ICEWIND_PATH, ICESPIRE_PATH, WATERDEEP_PATH, BALDURS_PATH];
    ```

## 4. Run the Merge
Execute the merge script to update the master list:
```bash
node tools/merge_monster_lists.js
```
This updates `src/data/enriched_monster_list.json`.

## 5. Update Region Monster Tables
Finally, run the script that maps the enriched list to the region-specific tables used by the application:
```bash
node update_region_monsters.js
```
This updates `src/data/region_monsters.json`.

## Summary of Commands
```bash
# 1. Generate specific encounter file
node tools/process_your_adventure.js

# 2. Merge into master list
node tools/merge_monster_lists.js

# 3. Update region tables
node update_region_monsters.js
```
