const CENTER_FIELDS = [
  "center_x",
  "center_y",
  "center_z",
  "sun_dx",
  "sun_dy",
  "sun_dz",
  "mars_dx",
  "mars_dy",
  "mars_dz",
  "sun_radius",
  "mars_radius",
  "radius_ratio",
  "opposition_angle_deg",
  "opposition_error_deg",
];

const CENTERS = [
  ["earth", "legacyEarthPivot"],
  ["pvp", "pvpSystemCenter"],
  ["midpoint", "geometricMidpoint"],
];

export const SUN_MARS_BINARY_CSV_FIELDS = [
  "date",
  "time",
  "sun_world_x",
  "sun_world_y",
  "sun_world_z",
  "mars_world_x",
  "mars_world_y",
  "mars_world_z",
  "sun_mars_separation",
  ...CENTERS.flatMap(([prefix]) =>
    CENTER_FIELDS.map((field) => `${prefix}_${field}`)
  ),
];

const vectorFields = (row, prefix, name, vector) => {
  row[`${prefix}_${name}_x`] = vector.x;
  row[`${prefix}_${name}_y`] = vector.y;
  row[`${prefix}_${name}_z`] = vector.z;
};

const addCenter = (row, prefix, state) => {
  vectorFields(row, prefix, "center", state.centerWorld);
  row[`${prefix}_sun_dx`] = state.sunFromCenter.x;
  row[`${prefix}_sun_dy`] = state.sunFromCenter.y;
  row[`${prefix}_sun_dz`] = state.sunFromCenter.z;
  row[`${prefix}_mars_dx`] = state.marsFromCenter.x;
  row[`${prefix}_mars_dy`] = state.marsFromCenter.y;
  row[`${prefix}_mars_dz`] = state.marsFromCenter.z;
  row[`${prefix}_sun_radius`] = state.sunRadius;
  row[`${prefix}_mars_radius`] = state.marsRadius;
  row[`${prefix}_radius_ratio`] = state.radiusRatio;
  row[`${prefix}_opposition_angle_deg`] = state.oppositionAngleDeg;
  row[`${prefix}_opposition_error_deg`] = state.oppositionErrorDeg;
};

export const sunMarsBinaryDiagnosticsToRow = (
  date,
  time,
  diagnostics
) => {
  if (!diagnostics?.valid) return null;

  const row = { date, time };
  vectorFields(row, "sun", "world", diagnostics.sample.sunWorld);
  vectorFields(row, "mars", "world", diagnostics.sample.marsWorld);
  row.sun_mars_separation = diagnostics.legacyEarthPivot.separation;
  CENTERS.forEach(([prefix, key]) => addCenter(row, prefix, diagnostics[key]));
  return row;
};

const csvCell = (value) => {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const formatSunMarsBinaryCsv = (rows) => {
  const lines = [SUN_MARS_BINARY_CSV_FIELDS.join(",")];
  rows.forEach((row) => {
    lines.push(
      SUN_MARS_BINARY_CSV_FIELDS.map((field) => csvCell(row[field])).join(",")
    );
  });
  return `${lines.join("\n")}\n`;
};
