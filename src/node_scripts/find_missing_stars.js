// find_missing_stars.js
import fs from 'fs';

// Load files
const constellations = JSON.parse(fs.readFileSync('./src/settings/constellations.json', 'utf8'));
const bsc = JSON.parse(fs.readFileSync('./src/settings/BSC.json', 'utf8'));

// Create a Set of existing HIP numbers in BSC.json for fast lookup
const existingHips = new Set();
bsc.forEach(star => {
    if (star.HIP) existingHips.add(parseInt(star.HIP));
});

// Find missing HIPs
const missingHips = new Set();

constellations.constellations.forEach(c => {
    if (c.lines) {
        c.lines.forEach(line => {
            line.forEach(hipId => {
                if (!existingHips.has(hipId)) {
                    missingHips.add(hipId);
                }
            });
        });
    }
});

const missingArray = Array.from(missingHips).sort((a, b) => a - b);

console.log(`Found ${missingArray.length} missing stars.`);
console.log(`Missing HIP IDs:`);
console.log(missingArray.join(','));

// Write to file for the next step
fs.writeFileSync('missing_hips.txt', missingArray.join(','));
console.log('Saved list to missing_hips.txt');