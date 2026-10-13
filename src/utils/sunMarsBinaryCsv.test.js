import { Vector3 } from "three";
import {
  createSunMarsBinaryDiagnostics,
  updateSunMarsBinaryDiagnostics,
} from "./sunMarsBinaryState";
import {
  formatSunMarsBinaryCsv,
  SUN_MARS_BINARY_CSV_FIELDS,
  sunMarsBinaryDiagnosticsToRow,
} from "./sunMarsBinaryCsv";

test("flattens all three binary reference centres into one row", () => {
  const diagnostics = createSunMarsBinaryDiagnostics();
  updateSunMarsBinaryDiagnostics(
    diagnostics,
    new Vector3(10, 0, 0),
    new Vector3(0, 0, 0),
    new Vector3(110, 0, 0),
    new Vector3(-140, 0, 0)
  );

  const row = sunMarsBinaryDiagnosticsToRow(
    "2000-06-21",
    "00:00:00",
    diagnostics
  );

  expect(row.earth_sun_radius).toBeCloseTo(100, 12);
  expect(row.pvp_sun_radius).toBeCloseTo(110, 12);
  expect(row.midpoint_center_x).toBeCloseTo(-15, 12);
  expect(row.midpoint_opposition_error_deg).toBeCloseTo(0, 12);
  expect(Object.keys(row)).toEqual(SUN_MARS_BINARY_CSV_FIELDS);
});

test("formats a conventional CSV with a stable header", () => {
  const diagnostics = createSunMarsBinaryDiagnostics();
  updateSunMarsBinaryDiagnostics(
    diagnostics,
    new Vector3(),
    new Vector3(),
    new Vector3(100, 0, 0),
    new Vector3(-150, 0, 0)
  );
  const row = sunMarsBinaryDiagnosticsToRow(
    "2000-06-21",
    "00:00:00",
    diagnostics
  );
  const csv = formatSunMarsBinaryCsv([row]);

  expect(csv.split("\n")[0]).toBe(SUN_MARS_BINARY_CSV_FIELDS.join(","));
  expect(csv).toContain("2000-06-21,00:00:00");
  expect(csv.endsWith("\n")).toBe(true);
});
