https://grok.com/share/c2hhcmQtMg%3D%3D_9685ce74-e29d-448f-89b6-e76f3b72100e
Takess a file with the format
https://brettonw.github.io/YaleBrightStarCatalog/bsc5-short.json
and adds parsec from a file when HR and i matches
Save as index.html
<!DOCTYPE html>
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
        .output-container {
            display: none;
            margin-top: 20px;
        }
        .output-textarea {
            width: 100%;
            height: 200px;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <h1>Star Data Merger</h1>
    <div class="file-input">
        <label for="file1">Select First JSON File (RA/Dec Data):</label>
        <input type="file" id="file1" accept=".json">
    </div>
    <div class="file-input">
        <label for="file2">Select Second JSON File (Parallax Data):</label>
        <input type="file" id="file2" accept=".json">
    </div>
    <button id="processButton" disabled>Process Files</button>
    <button id="downloadMatchedButton" style="display: none;">Download Matched Output</button>
    <button id="downloadUnmatchedButton" style="display: none;">Download Unmatched Output</button>
    <p id="status">Please select both JSON files to proceed.</p>
    <div id="matchedOutputContainer" class="output-container">
        <p>If the matched download fails, you can copy the output JSON below:</p>
        <textarea id="matchedOutputJson" class="output-textarea" readonly></textarea>
    </div>
    <div id="unmatchedOutputContainer" class="output-container">
        <p>If the unmatched download fails, you can copy the output JSON below:</p>
        <textarea id="unmatchedOutputJson" class="output-textarea" readonly></textarea>
    </div>

    <script>
        function mergeStarData(file1Data, file2Data) {
            try {
                // Create a map of entries from file2 using the 'i' property for quick lookup
                const parallaxMap = {};
                file2Data.forEach(entry => {
                    parallaxMap[entry.i] = entry.p; // Store parallax (p) value keyed by i
                });

                // Initialize arrays for matched and unmatched entries
                const matchedData = [];
                const unmatchedData = [];

                // Process each entry in file1
                file1Data.forEach(entry => {
                    const hr = parseInt(entry.HR); // Convert HR to number for matching
                    if (parallaxMap[hr]) {
                        // If there's a match, include the 'p' property
                        matchedData.push({
                            ...entry,
                            P: parallaxMap[hr] // Add parallax as 'P'
                        });
                    } else {
                        // If no match, add to unmatched array without modification
                        unmatchedData.push({ ...entry });
                    }
                });

                return { matchedData, unmatchedData };
            } catch (error) {
                throw new Error(`Error merging data: ${error.message}`);
            }
        }

        // Get DOM elements
        const file1Input = document.getElementById('file1');
        const file2Input = document.getElementById('file2');
        const processButton = document.getElementById('processButton');
        const downloadMatchedButton = document.getElementById('downloadMatchedButton');
        const downloadUnmatchedButton = document.getElementById('downloadUnmatchedButton');
        const status = document.getElementById('status');
        const matchedOutputContainer = document.getElementById('matchedOutputContainer');
        const unmatchedOutputContainer = document.getElementById('unmatchedOutputContainer');
        const matchedOutputJson = document.getElementById('matchedOutputJson');
        const unmatchedOutputJson = document.getElementById('unmatchedOutputJson');

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

        // Process files,由用户点击按钮触发
        processButton.addEventListener('click', async () => {
            status.textContent = 'Processing files...';
            status.classList.remove('error');
            processButton.disabled = true;
            downloadMatchedButton.style.display = 'none';
            downloadUnmatchedButton.style.display = 'none';
            matchedOutputContainer.style.display = 'none';
            unmatchedOutputContainer.style.display = 'none';

            try {
                // Read file1
                const file1Text = await file1Input.files[0].text();
                const file1Data = JSON.parse(file1Text);

                // Read file2
                const file2Text = await file2Input.files[0].text();
                const file2Data = JSON.parse(file2Text);

                // Merge data
                mergedData = mergeStarData(file1Data, file2Data);

                // Display JSON in textareas as a fallback
                matchedOutputJson.value = JSON.stringify(mergedData.matchedData, null, 2);
                unmatchedOutputJson.value = JSON.stringify(mergedData.unmatchedData, null, 2);
                matchedOutputContainer.style.display = 'block';
                unmatchedOutputContainer.style.display = 'block';

                // Show download buttons and update status
                downloadMatchedButton.style.display = 'inline-block';
                downloadUnmatchedButton.style.display = 'inline-block';
                status.textContent = 'Processing complete! Click the download buttons to save the results.';
            } catch (error) {
                console.error('Processing error:', error);
                status.textContent = `Error: ${error.message}`;
                status.classList.add('error');
                processButton.disabled = false;
            }
        });

        // Handle download for matched data
        downloadMatchedButton.addEventListener('click', () => {
            if (!mergedData || !mergedData.matchedData) {
                status.textContent = 'Error: No matched data to download. Please process files again.';
                status.classList.add('error');
                console.error('No matched data available for download');
                return;
            }

            try {
                const jsonString = JSON.stringify(mergedData.matchedData, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'matched_output.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                status.textContent = 'Matched file downloaded successfully! If the download didn’t start, copy the JSON from the matched textarea.';
                status.classList.remove('error');
                console.log('Matched download triggered successfully');
            } catch (error) {
                console.error('Download error:', error);
                status.textContent = `Error initiating matched download: ${error.message}. Please copy the JSON from the matched textarea.`;
                status.classList.add('error');
            }
        });

        // Handle download for unmatched data
        downloadUnmatchedButton.addEventListener('click', () => {
            if (!mergedData || !mergedData.unmatchedData) {
                status.textContent = 'Error: No unmatched data to download. Please process files again.';
                status.classList.add('error');
                console.error('No unmatched data available for download');
                return;
            }

            try {
                const jsonString = JSON.stringify(mergedData.unmatchedData, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'unmatched_output.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                status.textContent = 'Unmatched file downloaded successfully! If the download didn’t start, copy the JSON from the unmatched textarea.';
                status.classList.remove('error');
                console.log('Unmatched download triggered successfully');
            } catch (error) {
                console.error('Download error:', error);
                status.textContent = `Error initiating unmatched download: ${error.message}. Please copy the JSON from the unmatched textarea.`;
                status.classList.add('error');
            }
        });
    </script>
</body>
</html>