// Single reader for src/settings/celestial-model.json.
//
// The model is one flat list, `objects`. Each object is a settings entry
// (name + numeric settings) plus its place in the hierarchy:
//
//   id, name          unique object ID and scene/settings name
//   parentId          parent object ID (null = model root)
//   carrier           true for deferents / carrier stages
//   displayOrbitScale factor applied to orbit values while "Actual planet
//                     sizes" is off (currently used for the Moon's display scale)
//   hosts             helpers attached to the object's pivot (e.g. "ecliptic-grid")
//
// This file must NOT import the store (the store imports this file).

import model from "../settings/celestial-model.json";
import miscSettings from "../settings/misc-settings.json";
import { validateAndReportCelestialModel } from "./validateCelestialModel";

// Runs as the application modules initialize, before the model is indexed.
// A malformed JSON module itself is reported by the bundler before runtime.
validateAndReportCelestialModel(model, miscSettings);

export const celestialModel = model;

// Keys that describe structure, not settings.
const STRUCTURAL_KEYS = new Set([
  "id",
  "parentId",
  "carrier",
  "displayOrbitScale",
  "hosts",
]);

const toNumber = (v) => {
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (!Number.isNaN(n)) return n; // e.g. "877" exported from the Leva editor
  }
  return v;
};

// Object -> flat settings entry ({ name, size, startPos, ... }).
const toSetting = (obj) => {
  const out = { name: obj.name };
  Object.keys(obj).forEach((k) => {
    if (k === "name" || STRUCTURAL_KEYS.has(k)) return;
    out[k] = toNumber(obj[k]);
  });
  return out;
};

// ---------------------------------------------------------------------------
// Index + validation
// ---------------------------------------------------------------------------

const objects = model.objects;
const byId = new Map();
const byName = new Map();

objects.forEach((o) => {
  if (o.id == null || o.name == null) {
    throw new Error("celestial-model: every object needs an id and a name");
  }
  if (byId.has(o.id))
    throw new Error(`celestial-model: duplicate id "${o.id}"`);
  if (byName.has(o.name)) {
    throw new Error(`celestial-model: duplicate name "${o.name}"`);
  }
  byId.set(o.id, o);
  byName.set(o.name, o);
});

const childrenOf = new Map(); // parentId (or null) -> objects, in list order
objects.forEach((o) => {
  const parentId = o.parentId ?? null;
  if (parentId !== null && !byId.has(parentId)) {
    throw new Error(
      `celestial-model: "${o.id}" has unknown parentId "${parentId}"`
    );
  }
  if (!childrenOf.has(parentId)) childrenOf.set(parentId, []);
  childrenOf.get(parentId).push(o);
});

// Cycle check: every object must reach a root.
objects.forEach((o) => {
  const seen = new Set();
  for (
    let current = o;
    current;
    current = current.parentId != null ? byId.get(current.parentId) : null
  ) {
    if (seen.has(current.id)) {
      throw new Error(`celestial-model: parentId cycle at "${current.id}"`);
    }
    seen.add(current.id);
  }
});

const bodyOf = (object) => {
  let current = object;
  while (current.carrier) {
    const next = (childrenOf.get(current.id) || [])[0];
    if (!next) break;
    current = next;
  }
  return current;
};

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

/** Fresh flat settings list (the format consumed by the settings store). */
export const getCelestialSettings = () => objects.map(toSetting);

// ---------------------------------------------------------------------------
// Render tree
// ---------------------------------------------------------------------------

const buildNode = (object) => ({
  key: object.id,
  kind: "object",
  name: object.name,
  settingName: object.name,
  orbitScale: object.displayOrbitScale,
  hosts: object.hosts || [],
  children: (childrenOf.get(object.id) || []).map(buildNode),
});

/**
 * Nested render tree for either the visible scene or the invisible plot scene.
 * Both scenes now use the same real objects; the plot scene is hidden by Pobj.
 */
const renderTree = {
  key: "root",
  kind: "group",
  name: model.name,
  children: (childrenOf.get(null) || []).map(buildNode),
};

// The visible and hidden plot scenes share this same hierarchy.
export const buildRenderTree = () => renderTree;

// ---------------------------------------------------------------------------
// Queries used by menus / search / physical-position helpers
// ---------------------------------------------------------------------------

/** { bodyId, bodyName, isMain, isReferenceFrame } for a settings name. */
export const getStageInfo = (settingName) => {
  const object = byName.get(settingName);
  if (!object) return null;
  const body = bodyOf(object);
  return {
    bodyId: body.id,
    bodyName: body.name,
    isMain: !object.carrier,
    isReferenceFrame: object.parentId == null,
  };
};

/** True for a body itself / a root frame; false for deferents/carriers. */
export const isMainStage = (settingName) => {
  const object = byName.get(settingName);
  return object ? !object.carrier : true;
};

/** Settings names of real bodies: not carriers, not roots (SystemCenter). */
export const getBodySettingNames = () =>
  objects
    .filter((object) => !object.carrier && object.parentId != null)
    .map((object) => object.name);

/**
 * Return the scale and unscaled anchor for an object's physical position.
 *
 * The scaled Moon stages all use the same displayOrbitScale. Its nearest
 * ancestor without that scale is Earth, so the physical Moon position is
 * Earth + (display Moon - Earth) / scale. Returns null scale for ordinary
 * unscaled objects.
 */
export const getPhysicalPositionInfo = (name) => {
  const object = byName.get(name);
  if (!object) return null;

  const scale = Number(object.displayOrbitScale);
  if (!Number.isFinite(scale) || scale === 0) {
    return { scale: null, anchorName: null };
  }

  let current = object;
  let parent = current.parentId != null ? byId.get(current.parentId) : null;

  while (parent && parent.displayOrbitScale != null) {
    const parentScale = Number(parent.displayOrbitScale);
    if (parentScale !== scale) {
      throw new Error(
        `celestial-model: scaled chain for "${name}" uses inconsistent displayOrbitScale values`
      );
    }
    current = parent;
    parent = current.parentId != null ? byId.get(current.parentId) : null;
  }

  return { scale, anchorName: parent?.name ?? null };
};
