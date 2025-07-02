https://github.com/frostoven/BSC5P-JSON-XYZ/tree/primary/catalogs
bsc5p_radec.json
bsc5p_names.json

The program below merges the bsc5p_radec.json and bsc5p_names.json into a new file where HIP number and name(s) are included. 
Save as index.html and open in a browser
<script type="text/javascript">
        var gk_isXlsx = false;
        var gk_xlsxFileLookup = {};
        var gk_fileData = {};
        function filledCell(cell) {
          return cell !== '' && cell != null;
        }
        function loadFileData(filename) {
        if (gk_isXlsx && gk_xlsxFileLookup[filename]) {
            try {
                var workbook = XLSX.read(gk_fileData[filename], { type: 'base64' });
                var firstSheetName = workbook.SheetNames[0];
                var worksheet = workbook.Sheets[firstSheetName];

                // Convert sheet to JSON to filter blank rows
                var jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false, defval: '' });
                // Filter out blank rows (rows where all cells are empty, null, or undefined)
                var filteredData = jsonData.filter(row => row.some(filledCell));

                // Heuristic to find the header row by ignoring rows with fewer filled cells than the next row
                var headerRowIndex = filteredData.findIndex((row, index) =>
                  row.filter(filledCell).length >= filteredData[index + 1]?.filter(filledCell).length
                );
                // Fallback
                if (headerRowIndex === -1 || headerRowIndex > 25) {
                  headerRowIndex = 0;
                }

                // Convert filtered JSON back to CSV
                var csv = XLSX.utils.aoa_to_sheet(filteredData.slice(headerRowIndex)); // Create a new sheet from filtered array of arrays
                csv = XLSX.utils.sheet_to_csv(csv, { header: 1 });
                return csv;
            } catch (e) {
                console.error(e);
                return "";
            }
        }
        return gk_fileData[filename] || "";
        }
        </script><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Star Data Merger</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 20px auto;
            padding: 20px;
            text-align: center;
        }
        .file-input {
            margin: 10px;
        }
        button {
            padding: 10px 20px;
            margin: 10px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
        button:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
        }
        #status {
            margin-top: 20px;
            color: #333;
        }
        .error {
            color: red;
        }
        #outputContainer {
            display: none;
            margin-top: 20px;
        }
        #outputJson {
            width: 100%;
            height: 200px;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <h1>Star Data Merger</h1>
    <div class="file-input">
        <label for="file1">Select First JSON File:</label>
        <input type="file" id="file1" accept=".json">
    </div>
    <div class="file-input">
        <label for="file2">Select Second JSON File:</label>
        <input type="file" id="file2" accept=".json">
    </div>
    <button id="processButton" disabled>Process Files</button>
    <button id="downloadButton" style="display: none;">Download Output</button>
    <p id="status">Please select both JSON files to proceed.</p>
    <div id="outputContainer">
        <p>If the download fails, you can copy the output JSON below:</p>
        <textarea id="outputJson" readonly></textarea>
    </div>

    <script>
        function mergeStarData(file1Data, file2Data) {
            try {
                // Create a map of HIP and NAME entries from file2 using the 'i' property
                const entryMap = {};
                file2Data.forEach(entry => {
                    // Extract HIP entry (first element in 'n' array starting with 'HIP ')
                    const hip = entry.n.find(name => name.startsWith('HIP ')) || null;
                    // Extract NAME entries (all elements starting with 'NAME '), removing the prefix
                    const names = entry.n
                        .filter(name => name.startsWith('NAME '))
                        .map(name => name.replace(/^NAME /, '')) || [];
                    entryMap[entry.i] = { hip, names };
                });

                // Merge data from file1 with HIP and NAME entries
                return file1Data.map(entry => ({
                    ...entry,
                    hip: entryMap[entry.i]?.hip || null, // Add HIP entry or null if not found
                    name: entryMap[entry.i]?.names || [] // Add NAME entries or empty array if not found
                }));
            } catch (error) {
                throw new Error(`Error merging data: ${error.message}`);
            }
        }

        // Get DOM elements
        const file1Input = document.getElementById('file1');
        const file2Input = document.getElementById('file2');
        const processButton = document.getElementById('processButton');
        const downloadButton = document.getElementById('downloadButton');
        const status = document.getElementById('status');
        const outputContainer = document.getElementById('outputContainer');
        const outputJson = document.getElementById('outputJson');

        let mergedData = null;

        // Enable process button when both files are selected
        function checkFilesSelected() {
            processButton.disabled = !(file1Input.files.length && file2Input.files.length);
            status.textContent = processButton.disabled
                ? 'Please select both JSON files to proceed.'
                : 'Ready to process files.';
            status.classList.remove('error');
        }

        file1Input.addEventListener('change', checkFilesSelected);
        file2Input.addEventListener('change', checkFilesSelected);

        // Process files when the button is clicked
        processButton.addEventListener('click', async () => {
            status.textContent = 'Processing files...';
            status.classList.remove('error');
            processButton.disabled = true;
            downloadButton.style.display = 'none';
            outputContainer.style.display = 'none';

            try {
                // Read file1
                const file1Text = await file1Input.files[0].text();
                const file1Data = JSON.parse(file1Text);

                // Read file2
                const file2Text = await file2Input.files[0].text();
                const file2Data = JSON.parse(file2Text);

                // Merge data
                mergedData = mergeStarData(file1Data, file2Data);
                console.log('Merged data:', mergedData);

                // Display JSON in textarea as a fallback
                outputJson.value = JSON.stringify(mergedData, null, 2);
                outputContainer.style.display = 'block';

                // Show download button and update status
                downloadButton.style.display = 'inline-block';
                status.textContent = 'Processing complete! Click "Download Output" to save the result.';
            } catch (error) {
                console.error('Processing error:', error);
                status.textContent = `Error: ${error.message}`;
                status.classList.add('error');
                processButton.disabled = false;
            }
        });

        // Handle download
        downloadButton.addEventListener('click', () => {
            if (!mergedData) {
                status.textContent = 'Error: No data to download. Please process files again.';
                status.classList.add('error');
                console.error('No merged data available for download');
                return;
            }

            try {
                const jsonString = JSON.stringify(mergedData, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'output.json';
                document.body.appendChild(a); // Append to body to ensure visibility
                a.click();
                document.body.removeChild(a); // Clean up
                URL.revokeObjectURL(url);
                status.textContent = 'File downloaded successfully! If the download didn’t start, copy the JSON from the textarea below.';
                status.classList.remove('error');
                console.log('Download triggered successfully');
            } catch (error) {
                console.error('Download error:', error);
                status.textContent = `Error initiating download: ${error.message}. Please copy the JSON from the textarea below.`;
                status.classList.add('error');
            }
        });
    </script>
</body>
</html>


