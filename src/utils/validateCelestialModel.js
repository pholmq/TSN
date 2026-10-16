const NUMERIC_FIELDS = new Set([
  "displayOrbitScale",
  "size",
  "actualSize",
  "startPos",
  "speed",
  "rotationStart",
  "rotationSpeed",
  "tilt",
  "tiltb",
  "orbitRadius",
  "orbitCentera",
  "orbitCenterb",
  "orbitCenterc",
  "orbitTilta",
  "orbitTiltb",
]);

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const parseInput = (input, label, errors) => {
  if (typeof input !== "string") return input;

  try {
    return JSON.parse(input);
  } catch (error) {
    errors.push(`${label} is not valid JSON: ${error.message}`);
    return null;
  }
};

/**
 * Validate a celestial model against the display settings.
 * Inputs may be parsed JavaScript values or raw JSON text. Raw text is accepted
 * so the same validator can report useful parse errors when loading a file.
 */
export const validateCelestialModelData = (modelInput, miscSettingsInput) => {
  const errors = [];
  const model = parseInput(modelInput, "celestial-model.json", errors);
  const miscSettings = parseInput(
    miscSettingsInput,
    "misc-settings.json",
    errors
  );

  if (errors.length > 0) return { valid: false, errors, model: null };

  if (!isObject(model)) {
    errors.push("celestial-model.json must contain a JSON object");
  } else {
    if (!Number.isInteger(model.schemaVersion) || model.schemaVersion < 1) {
      errors.push(
        "celestial-model.json must have a positive integer schemaVersion"
      );
    }
    if (typeof model.id !== "string" || model.id.trim() === "") {
      errors.push("celestial-model.json must have a non-empty root id");
    }
    if (typeof model.name !== "string" || model.name.trim() === "") {
      errors.push("celestial-model.json must have a non-empty root name");
    }
    if (!Array.isArray(model.objects) || model.objects.length === 0) {
      errors.push(
        "celestial-model.json must contain a non-empty objects array"
      );
    }
  }

  if (!Array.isArray(miscSettings)) {
    errors.push("misc-settings.json must contain a JSON array");
  }

  if (errors.length > 0) return { valid: false, errors, model };

  const byId = new Map();
  const byName = new Map();

  model.objects.forEach((object, index) => {
    const label = `celestial-model.json objects[${index}]`;

    if (!isObject(object)) {
      errors.push(`${label} must be an object`);
      return;
    }

    if (typeof object.id !== "string" || object.id.trim() === "") {
      errors.push(`${label} must have a non-empty string id`);
    } else if (byId.has(object.id)) {
      errors.push(`${label} has duplicate id "${object.id}"`);
    } else {
      byId.set(object.id, object);
    }

    if (typeof object.name !== "string" || object.name.trim() === "") {
      errors.push(`${label} must have a non-empty string name`);
    } else if (byName.has(object.name)) {
      errors.push(`${label} has duplicate name "${object.name}"`);
    } else {
      byName.set(object.name, object);
    }

    if (!Object.prototype.hasOwnProperty.call(object, "parentId")) {
      errors.push(
        `${label} must have a parentId field (use null for the root)`
      );
    } else if (
      object.parentId !== null &&
      typeof object.parentId !== "string"
    ) {
      errors.push(`${label} parentId must be a string or null`);
    }

    if (object.carrier !== undefined && typeof object.carrier !== "boolean") {
      errors.push(`${label} carrier must be a boolean when specified`);
    }

    if (
      object.hosts !== undefined &&
      (!Array.isArray(object.hosts) ||
        object.hosts.some((host) => typeof host !== "string"))
    ) {
      errors.push(`${label} hosts must be an array of strings when specified`);
    }

    NUMERIC_FIELDS.forEach((field) => {
      if (
        object[field] !== undefined &&
        (typeof object[field] !== "number" || !Number.isFinite(object[field]))
      ) {
        errors.push(`${label} field "${field}" must be a finite number`);
      }
    });

    if (
      object.displayOrbitScale !== undefined &&
      object.displayOrbitScale <= 0
    ) {
      errors.push(`${label} displayOrbitScale must be greater than zero`);
    }
  });

  // Parent references and cycles are checked after all IDs are indexed.
  model.objects.forEach((object) => {
    if (!isObject(object) || typeof object.id !== "string") return;
    if (
      object.parentId !== undefined &&
      object.parentId !== null &&
      !byId.has(object.parentId)
    ) {
      errors.push(
        `celestial-model.json object "${object.id}" references unknown parentId "${object.parentId}"`
      );
    }
  });

  model.objects.forEach((object) => {
    if (!isObject(object) || typeof object.id !== "string") return;

    const visited = new Set();
    let current = object;
    while (current && current.parentId != null && byId.has(current.parentId)) {
      if (visited.has(current.id)) {
        errors.push(
          `celestial-model.json contains a parent cycle at "${current.id}"`
        );
        break;
      }
      visited.add(current.id);
      current = byId.get(current.parentId);
    }
    if (current && visited.has(current.id)) return;
  });

  const miscByName = new Map();
  miscSettings.forEach((setting, index) => {
    const label = `misc-settings.json[${index}]`;
    if (
      !isObject(setting) ||
      typeof setting.name !== "string" ||
      setting.name.trim() === ""
    ) {
      errors.push(`${label} must be an object with a non-empty string name`);
      return;
    }
    if (miscByName.has(setting.name)) {
      errors.push(`${label} has duplicate name "${setting.name}"`);
    } else {
      miscByName.set(setting.name, setting);
    }
  });

  const modelNames = new Set(byName.keys());
  const miscNames = new Set(miscByName.keys());
  [...modelNames]
    .filter((name) => !miscNames.has(name))
    .sort()
    .forEach((name) => {
      errors.push(
        `"${name}" exists in celestial-model.json but not in misc-settings.json`
      );
    });
  [...miscNames]
    .filter((name) => !modelNames.has(name))
    .sort()
    .forEach((name) => {
      errors.push(
        `"${name}" exists in misc-settings.json but not in celestial-model.json`
      );
    });

  return { valid: errors.length === 0, errors, model };
};

/** Log configuration issues without hiding other application diagnostics. */
export const validateAndReportCelestialModel = (
  modelInput,
  miscSettingsInput
) => {
  const result = validateCelestialModelData(modelInput, miscSettingsInput);

  if (!result.valid) {
    console.error(
      `[celestial-model validation] Found ${
        result.errors.length
      } issue(s):\n${result.errors.map((error) => `  - ${error}`).join("\n")}`
    );
  }

  return result;
};
