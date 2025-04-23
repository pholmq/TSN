import { useSettingsStore } from "../store";

export const saveSettingsAsJson = (settings) => {
  // Define the properties to include in the JSON
  const allowedProperties = [
    "name",
    "size",
    "actualSize",
    "startPos",
    "speed",
    "rotationSpeed",
    "tilt",
    "tiltb",
    "orbitRadius",
    "orbitCentera",
    "orbitCenterb",
    "orbitCenterc",
    "orbitTilta",
    "orbitTiltb",
  ];

  // Filter settings to include only the allowed properties
  const filteredSettings = settings.map((item) => {
    const filteredItem = {};
    allowedProperties.forEach((prop) => {
      if (item.hasOwnProperty(prop)) {
        filteredItem[prop] = item[prop];
      }
    });
    return filteredItem;
  });

  // Convert filtered settings to JSON string with indentation
  const jsonString = JSON.stringify(filteredSettings, null, 2);

  // Create a Blob with the JSON content
  const blob = new Blob([jsonString], { type: "application/json" });

  // Create a temporary URL for the Blob
  const url = URL.createObjectURL(blob);

  // Generate timestamp for filename (YYYYMMDD_HHMM)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const timestamp = `${year}${month}${day}_${hours}${minutes}`;

  // Create a temporary anchor element to trigger the download
  const link = document.createElement("a");
  link.href = url;
  link.download = `TS_settings_${timestamp}.txt`; // Set the filename with timestamp
  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const loadSettingsFromFile = async () => {
  try {
    // Create file input element
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt";

    // Wrap file selection in a promise
    const file = await new Promise((resolve) => {
      input.onchange = (e) => resolve(e.target.files[0]);
      input.click();
    });

    if (!file) return; // User cancelled

    // Read file contents
    const fileContents = await file.text();
    const parsedSettings = JSON.parse(fileContents);

    // Validate the file structure
    if (!Array.isArray(parsedSettings)) {
      throw new Error("Invalid file format: Expected an array of settings");
    }

    const requiredProperties = ["name"]; // Minimum required property
    const validSettings = parsedSettings.filter((item) => {
      return (
        item &&
        typeof item === "object" &&
        requiredProperties.every((prop) => prop in item)
      );
    });

    if (validSettings.length === 0) {
      throw new Error("No valid settings found in the file");
    }

    // Update Zustand store with each setting
    const { updateSetting } = useSettingsStore.getState();
    validSettings.forEach((setting) => {
      updateSetting(setting);
    });

    return true; // Success
  } catch (error) {
    console.error("Error loading settings:", error);
    alert(`Error loading settings: ${error.message}`);
    return false;
  }
};

