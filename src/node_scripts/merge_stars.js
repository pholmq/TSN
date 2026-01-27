const fs = require('fs');
const path = require('path');

// --- Configuration ---
const INPUT_FILE = 'vizier_data.xml';
const BSC_PATH = path.join('..', 'settings', 'BSC.json');
const BACKUP_PATH = path.join('..', 'settings', 'BSC.json.backup');

// --- Helper Functions ---

// Convert Decimal Degrees to "HHh MMm SS.s"
function degToHMS(deg) {
    if (isNaN(deg)) return null;
    const hrs = deg / 15;
    const h = Math.floor(hrs);
    const m = Math.floor((hrs - h) * 60);
    const s = ((hrs - h) * 60 - m) * 60;
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${s.toFixed(2)}s`;
}

// Convert Decimal Degrees to "+DD° MM' SS""
function degToDMS(deg) {
    if (isNaN(deg)) return null;
    const absDeg = Math.abs(deg);
    const d = Math.floor(absDeg);
    const m = Math.floor((absDeg - d) * 60);
    const s = ((absDeg - d) * 60 - m) * 60;
    const sign = deg >= 0 ? '+' : '-';
    return `${sign}${String(d).padStart(2, '0')}° ${String(m).padStart(2, '0')}' ${s.toFixed(1)}"`;
}

// Convert B-V Color Index to Kelvin
function bvToK(bv) {
    const val = parseFloat(bv);
    if (isNaN(val)) return 5778; // Default to Sun (G2V)
    // Approximate formula for Main Sequence stars
    return Math.round(4600 * ((1 / (0.92 * val + 1.7)) + (1 / (0.92 * val + 0.62))));
}

// --- Main Logic ---

try {
    console.log(`Reading ${INPUT_FILE}...`);
    const xmlContent = fs.readFileSync(INPUT_FILE, 'utf8');

    // 1. Extract the CSV portion from the XML CDATA block
    const startTag = '<DATA><CSV headlines="3" colsep=";"><![CDATA[';
    const endTag = ']]></CSV></DATA>';
    
    const startIndex = xmlContent.indexOf(startTag);
    const endIndex = xmlContent.indexOf(endTag);

    if (startIndex === -1 || endIndex === -1) {
        throw new Error('Could not find CSV data block in the XML file.');
    }

    const csvContent = xmlContent.substring(startIndex + startTag.length, endIndex);
    const lines = csvContent.split('\n');

    // 2. Load existing BSC data
    console.log(`Loading existing BSC data from ${BSC_PATH}...`);
    const bscData = JSON.parse(fs.readFileSync(BSC_PATH, 'utf8'));
    const existingHips = new Set(bscData.map(s => s.HIP ? parseInt(s.HIP) : null));

    const newStars = [];

    // 3. Parse and Convert
    console.log('Parsing new stars...');
    
    lines.forEach(line => {
        const trimmed = line.trim();
        // Skip headers, empty lines, and separators
        if (!trimmed || trimmed.startsWith('HIP') || trimmed.startsWith('-')) return;

        const cols = trimmed.split(';');
        
        // CSV Structure: HIP;Vmag;RAICRS;DEICRS;Plx;B-V;recno
        const hip = parseInt(cols[0]);
        const vmag = parseFloat(cols[1]);
        let raDeg = parseFloat(cols[2]);
        let deDeg = parseFloat(cols[3]);
        const plx = parseFloat(cols[4]);
        const bv = parseFloat(cols[5]);

        // Fix for HIP 55203 (Missing in this specific VizieR dataset)
        // Data from SIMBAD
        if (hip === 55203 && isNaN(raDeg)) {
            console.log('  -> Patching missing coordinates for HIP 55203');
            raDeg = 169.5468; // 11h 18m
            deDeg = 31.5307;  // +31° 31'
        }

        // Validate
        if (isNaN(hip)) return;
        if (existingHips.has(hip)) {
            console.log(`  -> Skipping HIP ${hip} (Already exists)`);
            return;
        }

        // Conversions
        // Parallax (mas) to Distance (Parsecs). d = 1000 / p
        // If plx is negative or 0, default to a far distance (e.g. 1000 pc)
        const distPc = (plx > 0) ? (1000 / plx).toFixed(1) : "1000";

        newStars.push({
            "N": "",             // Name (empty for these dimmer stars)
            "HIP": String(hip),
            "HR": "",            // HR ID (usually empty for >6.5 mag)
            "RA": degToHMS(raDeg) || "00h 00m 00s",
            "Dec": degToDMS(deDeg) || "+00° 00' 00\"",
            "V": isNaN(vmag) ? "6.0" : String(vmag),
            "K": bvToK(bv),
            "P": distPc
        });
    });

    // 4. Save
    if (newStars.length > 0) {
        console.log(`Found ${newStars.length} new stars.`);
        
        // Backup
        fs.writeFileSync(BACKUP_PATH, JSON.stringify(bscData, null, 2));
        console.log(`Backup saved to ${BACKUP_PATH}`);

        // Merge and Write
        const updatedData = [...bscData, ...newStars];
        fs.writeFileSync(BSC_PATH, JSON.stringify(updatedData, null, 2));
        console.log(`SUCCESS: Appended ${newStars.length} stars to ${BSC_PATH}`);
    } else {
        console.log('No new stars found to add.');
    }

} catch (err) {
    console.error("Error:", err.message);
}