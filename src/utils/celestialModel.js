// src/utils/celestialModel.js
import model from "../settings/celestial-model.json";
import miscSettings from "../settings/misc-settings.json";
import { validateAndReportCelestialModel } from "./validateCelestialModel";

validateAndReportCelestialModel(model, miscSettings);
export const celestialModel = model;

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
    if (!Number.isNaN(n)) return n;
  }
  return v;
};

const toSetting = (obj) => {
  const out = { name: obj.name };
  Object.keys(obj).forEach((k) => {
    if (k === "name" || STRUCTURAL_KEYS.has(k)) return;
    out[k] = toNumber(obj[k]);
  });
  return out;
};

const objects = model.objects;
const byId = new Map();
const byName = new Map();

objects.forEach((o) => {
  if (o.id == null || o.name == null) {
    throw new Error("celestial-model: every object needs an id and a name");
  }
  if (byId.has(o.id)) throw new Error(`celestial-model: duplicate id "${o.id}"`);
  if (byName.has(o.name)) throw new Error(`celestial-model: duplicate name "${o.name}"`);
  byId.set(o.id, o);
  byName.set(o.name, o);
});

const childrenOf = new Map();
objects.forEach((o) => {
  const parentId = o.parentId ?? null;
  if (parentId !== null && !byId.has(parentId)) {
    throw new Error(`celestial-model: "${o.id}" has unknown parentId "${parentId}"`);
  }
  if (!childrenOf.has(parentId)) childrenOf.set(parentId, []);
  childrenOf.get(parentId).push(o);
});

objects.forEach((o) => {
  const seen = new Set();
  for (let current = o; current; current = current.parentId != null ? byId.get(current.parentId) : null) {
    if (seen.has(current.id)) throw new Error(`celestial-model: parentId cycle at "${current.id}"`);
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

export const getCelestialSettings = () => objects.map(toSetting);

const buildNode = (object) => ({
  key: object.id,
  kind: "object",
  name: object.name,
  settingName: object.name,
  orbitScale: object.displayOrbitScale,
  hosts: object.hosts || [],
  operation: object.motionOperation,
  frameType: object.frameType || null,
  referenceFrame: object.referenceFrame || null, // <--- Exposed here
  children: (childrenOf.get(object.id) || []).map(buildNode),
});

const renderTree = {
  key: "root",
  kind: "group",
  name: model.name,
  children: (childrenOf.get(null) || []).map(buildNode),
};

export const buildRenderTree = () => renderTree;

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

export const isMainStage = (settingName) => {
  const object = byName.get(settingName);
  return object ? !object.carrier : true;
};

export const getBodySettingNames = () =>
  objects
    .filter((object) => !object.carrier && object.parentId != null)
    .map((object) => object.name);

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
      throw new Error(`celestial-model: scaled chain for "${name}" uses inconsistent displayOrbitScale values`);
    }
    current = parent;
    parent = current.parentId != null ? byId.get(current.parentId) : null;
  }

  return { scale, anchorName: parent?.name ?? null };
};