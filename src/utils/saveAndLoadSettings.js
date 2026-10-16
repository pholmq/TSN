import { useSettingsStore } from "../store";
import miscSettings from "../settings/misc-settings.json";
import { celestialModel } from "./celestialModel";
import { validateCelestialModelData } from "./validateCelestialModel";

// These fields define the model hierarchy/display scaling, not editable orbit
// settings. They are preserved from the model file when saving and cannot be
// changed by importing a settings file into an already-running scene.
const STRUCTURAL_FIELDS = new Set([
  "id",
  "name",
  "parentId",
  "carrier",
  "displayOrbitScale",
  "hosts",
]);

const hasOwn = (object, key) =>
  Object.prototype.hasOwnProperty.call(object, key);

const normalizeExportValue = (value, templateValue, objectName, fieldName) => {
  if (typeof templateValue !== "number") return value;

  if (typeof value === "string") {
    const trimmed = value.replace(/\u200B/g, "").trim();
    if (trimmed === "") {
      throw new Error(`"${objectName}.${fieldName}" must be a number`);
    }
    value = Number(trimmed);
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`"${objectName}.${fieldName}" must be a finite number`);
  }

  return value;
};

/** Build a celestial-model.json document using current editable settings. */
export const createCelestialModelDocument = (settings) => {
  const settingsByName = new Map(
    settings.map((setting) => [setting.name, setting])
  );

  const objects = celestialModel.objects.map((modelObject) => {
    const currentSetting = settingsByName.get(modelObject.name);
    if (!currentSetting) {
      throw new Error(
        `No current settings were found for model object "${modelObject.name}"`
      );
    }

    const savedObject = {};
    Object.keys(modelObject).forEach((key) => {
      if (STRUCTURAL_FIELDS.has(key)) {
        savedObject[key] = modelObject[key];
      } else {
        const value = hasOwn(currentSetting, key)
          ? currentSetting[key]
          : modelObject[key];
        savedObject[key] = normalizeExportValue(
          value,
          modelObject[key],
          modelObject.name,
          key
        );
      }
    });
    return savedObject;
  });

  return { ...celestialModel, objects };
};

const getModelCompatibilityErrors = (importedModel) => {
  const errors = [];

  if (importedModel.schemaVersion !== celestialModel.schemaVersion) {
    errors.push(
      `Unsupported schemaVersion ${importedModel.schemaVersion}; this app expects ${celestialModel.schemaVersion}`
    );
  }
  if (importedModel.id !== celestialModel.id) {
    errors.push(
      `Model id "${importedModel.id}" does not match the current model id "${celestialModel.id}"`
    );
  }
  if (importedModel.name !== celestialModel.name) {
    errors.push(
      `Model name "${importedModel.name}" does not match the current model name "${celestialModel.name}"`
    );
  }

  const currentByName = new Map(
    celestialModel.objects.map((object) => [object.name, object])
  );
  const importedByName = new Map(
    importedModel.objects.map((object) => [object.name, object])
  );

  celestialModel.objects.forEach((currentObject) => {
    const importedObject = importedByName.get(currentObject.name);
    if (!importedObject) return; // Name-set validation reports this separately.

    const currentKeys = Object.keys(currentObject).sort();
    const importedKeys = Object.keys(importedObject).sort();
    if (JSON.stringify(currentKeys) !== JSON.stringify(importedKeys)) {
      errors.push(
        `Object "${currentObject.name}" does not use the current celestial-model schema (its fields differ)`
      );
    }

    ["id", "name", "parentId", "carrier", "displayOrbitScale", "hosts"].forEach(
      (field) => {
        if (
          JSON.stringify(currentObject[field]) !==
          JSON.stringify(importedObject[field])
        ) {
          errors.push(
            `Object "${currentObject.name}" has a different ${field}; settings loading cannot change the scene hierarchy`
          );
        }
      }
    );
  });

  // The name checks above normally guarantee matching sets. This also keeps
  // diagnostics clear if a file contains valid but unfamiliar object names.
  importedModel.objects.forEach((object) => {
    if (!currentByName.has(object.name)) {
      errors.push(`Object "${object.name}" is not part of the current model`);
    }
  });

  return errors;
};

const makeTimestamp = () => {
  const now = new Date();
  const twoDigits = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}${twoDigits(now.getMonth() + 1)}${twoDigits(
    now.getDate()
  )}_${twoDigits(now.getHours())}${twoDigits(now.getMinutes())}`;
};

export const saveSettingsAsJson = (settings) => {
  try {
    const modelDocument = createCelestialModelDocument(settings);
    const validation = validateCelestialModelData(modelDocument, miscSettings);
    if (!validation.valid) {
      throw new Error(validation.errors.join("\n"));
    }

    const jsonString = JSON.stringify(modelDocument, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `TS_celestial-model_${makeTimestamp()}.json`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error("Error saving celestial model settings:", error);
    alert(`Error saving settings: ${error.message}`);
    return false;
  }
};

export const loadSettingsFromFile = async () => {
  try {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";

    const file = await new Promise((resolve) => {
      input.onchange = () => resolve(input.files?.[0] || null);
      input.oncancel = () => resolve(null);
      input.click();
    });

    if (!file) return false;

    const fileContents = await file.text();
    const validation = validateCelestialModelData(fileContents, miscSettings);
    if (!validation.valid) {
      throw new Error(validation.errors.join("\n"));
    }

    const importedModel = validation.model;
    const compatibilityErrors = getModelCompatibilityErrors(importedModel);
    if (compatibilityErrors.length > 0) {
      throw new Error(compatibilityErrors.join("\n"));
    }

    const currentSettings = useSettingsStore.getState().settings;
    const currentSettingsByName = new Map(
      currentSettings.map((setting) => [setting.name, setting])
    );
    const importedByName = new Map(
      importedModel.objects.map((object) => [object.name, object])
    );
    const updateSetting = useSettingsStore.getState().updateSetting;

    // Validation and compatibility checks are complete before any state is
    // changed, so a bad file cannot leave the settings partially updated.
    celestialModel.objects.forEach((modelObject) => {
      const currentSetting = currentSettingsByName.get(modelObject.name);
      const importedObject = importedByName.get(modelObject.name);
      if (!currentSetting || !importedObject) return;

      const update = { ...currentSetting };
      Object.keys(modelObject).forEach((key) => {
        if (!STRUCTURAL_FIELDS.has(key) && hasOwn(importedObject, key)) {
          update[key] = importedObject[key];
        }
      });
      updateSetting(update);
    });

    return true;
  } catch (error) {
    console.error("Error loading celestial model settings:", error);
    alert(`Error loading settings: ${error.message}`);
    return false;
  }
};
