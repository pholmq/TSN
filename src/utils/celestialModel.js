// celestialModel.js
//
// Single reader for src/settings/celestial-model.json.
//
// The model is one flat list, `objects`. Each object is a settings entry
// (name + numbers, exactly what celestial-settings.json used to hold) plus
// its place in the hierarchy:
//
//   id, name          unique. `name` is the settings / scene-graph name.
//   parentId          id of the parent object (null = root, e.g. SystemCenter).
//                     The scene tree is derived from this; list order decides
//                     sibling order, and is also the order of the settings list.
//   carrier           true for deferents / carrier stages (not a body itself).
//   displayOrbitScale factor applied to orbit values while "Actual planet
//                     sizes" is off (the Moon exaggeration).
//   hosts             helpers attached to the object's pivot ("ecliptic-grid").
//   twinOf            id of another object. Makes this a hidden physical-
//                     coordinate twin: no numbers of its own, it reuses the
//                     target's settings, is always invisible, uses actualSize.
//   modes             build only in these scenes ("live" = SolarSystem,
//                     "plot" = PlotSolarSystem). Default: all.
//
// Every other key is a numeric setting (size, startPos, speed, orbitRadius...).
//
// This file must NOT import the store (the store imports this file).

import model from "../settings/celestial-model.json";

export const celestialModel = model;

// Keys that describe structure, not settings.
const STRUCTURAL_KEYS = new Set([
  "id",
  "parentId",
  "carrier",
  "displayOrbitScale",
  "hosts",
  "twinOf",
  "modes",
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
  const p = o.parentId ?? null;
  if (p !== null && !byId.has(p)) {
    throw new Error(`celestial-model: "${o.id}" has unknown parentId "${p}"`);
  }
  if (o.twinOf != null) {
    const target = byId.get(o.twinOf);
    if (!target || target.twinOf != null) {
      throw new Error(
        `celestial-model: "${o.id}" twinOf "${o.twinOf}" is not a real object`
      );
    }
  }
  if (!childrenOf.has(p)) childrenOf.set(p, []);
  childrenOf.get(p).push(o);
});

// Cycle check: every object must reach a root
objects.forEach((o) => {
  const seen = new Set();
  for (let c = o; c; c = c.parentId != null ? byId.get(c.parentId) : null) {
    if (seen.has(c.id)) {
      throw new Error(`celestial-model: parentId cycle at "${c.id}"`);
    }
    seen.add(c.id);
  }
});

const isTwin = (o) => o.twinOf != null;
const realObjects = objects.filter((o) => !isTwin(o));
const realChildren = (o) =>
  (childrenOf.get(o.id) || []).filter((c) => !isTwin(c));

// The body a carrier belongs to: follow the carrier chain down to the first
// non-carrier (Moon deferent A -> Moon deferent B -> Moon).
const bodyOf = (o) => {
  let cur = o;
  while (cur.carrier) {
    const next = realChildren(cur)[0];
    if (!next) break;
    cur = next;
  }
  return cur;
};

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

/** Fresh flat settings list (what celestial-settings.json used to be). */
export const getCelestialSettings = () => realObjects.map(toSetting);

// ---------------------------------------------------------------------------
// Render tree
// ---------------------------------------------------------------------------

const treeCache = {};

const buildNode = (o, mode) => {
  if (o.modes && !o.modes.includes(mode)) return null;
  const source = isTwin(o) ? byId.get(o.twinOf) : o;
  return {
    key: o.id,
    kind: "object",
    name: o.name, // scene-graph object name (e.g. "Actual Moon")
    settingName: source.name, // settings entry that drives it
    actual: isTwin(o),
    orbitScale: o.displayOrbitScale, // number | undefined
    hosts: o.hosts || [],
    children: (childrenOf.get(o.id) || [])
      .map((c) => buildNode(c, mode))
      .filter(Boolean),
  };
};

/**
 * Nested render tree for a mode ("live" -> SolarSystem, "plot" -> PlotSolarSystem).
 * A synthetic group node is the root. Memoized: the model is static.
 */
export const buildRenderTree = (mode) => {
  if (!treeCache[mode]) {
    treeCache[mode] = {
      key: "root",
      kind: "group",
      name: model.name,
      children: (childrenOf.get(null) || [])
        .map((o) => buildNode(o, mode))
        .filter(Boolean),
    };
  }
  return treeCache[mode];
};

// ---------------------------------------------------------------------------
// Queries used by menus / search / physics helpers
// ---------------------------------------------------------------------------

/** { bodyId, bodyName, isMain, isReferenceFrame } for a settings name. */
export const getStageInfo = (settingName) => {
  const o = byName.get(settingName);
  if (!o || isTwin(o)) return null;
  const body = bodyOf(o);
  return {
    bodyId: body.id,
    bodyName: body.name,
    isMain: !o.carrier,
    isReferenceFrame: o.parentId == null,
  };
};

/** True for a body itself / a root frame; false for deferents/carriers. */
export const isMainStage = (settingName) => {
  const o = byName.get(settingName);
  return o ? !o.carrier : true;
};

/** Settings names of real bodies: not carriers, not roots (SystemCenter). */
export const getBodySettingNames = () =>
  realObjects
    .filter((o) => !o.carrier && o.parentId != null)
    .map((o) => o.name);

/**
 * Name of the scene object holding an object's physical coordinates.
 * e.g. "Moon" -> "Actual Moon" when the model has a twin for it;
 * otherwise the name itself.
 */
let twinMap = null;
export const getPhysicalTwinName = (name) => {
  if (!twinMap) {
    twinMap = new Map();
    objects.filter(isTwin).forEach((t) => {
      const target = byId.get(t.twinOf).name;
      if (!twinMap.has(target)) twinMap.set(target, t.name);
    });
  }
  return twinMap.get(name) ?? name;
};
