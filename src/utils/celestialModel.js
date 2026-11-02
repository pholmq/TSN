// Single reader for src/settings/celestial-model.json.
import model from "../settings/celestial-model.json";
import miscSettings from "../settings/misc-settings.json";
import { validateAndReportCelestialModel } from "./validateCelestialModel";

// Runs as the application modules initialize, before the model is indexed.
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
    if (!Number.isNaN(n)) return n;
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

export const getCelestialSettings = () => objects.map(toSetting);

// Editor presentation is intentionally separate from the physical parentId
// graph.  TSOG still evaluates the flat objects[] model; these groups simply
// give people a readable, TYCHOS-oriented way to navigate it.
const EDITOR_GROUPS = [
  {
    name: "PVP Orbit",
    flattenBody: true,
    bodies: [{ id: "system-center", frames: [["PVP Orbit", ["system-center"]]] }],
  },
  {
    name: "Earth",
    flattenBody: true,
    bodies: [{
      id: "earth",
      frames: [["Earth", ["earth"]]],
      children: [{
        id: "moon",
        frames: [
        ["Lunar Nodal / Plane Frame", ["moon-node", "moon-plane", "moon-node-counterrotation"]],
        ["Lunar Apsidal Frame", ["moon-deferent-a"]],
        ["Lunar Modulation Frame", ["moon-solar-eccentric"]],
        ["Moon Orbit", ["moon"]],
        ],
      }],
    }],
  },
  {
    name: "Sun",
    flattenBody: true,
    bodies: [{
      id: "sun",
      frames: [["Sun-Mars Binary Frame", ["sun-mars-binary-frame"]], ["Sun Primary Frame", ["sun-primary-frame"]], ["Sun Deferent", ["sun-deferent"]], ["Sun", ["sun"]]],
      children: [
        { id: "venus", frames: [["Venus", ["venus-deferent", "venus-plane", "venus"]]] },
        { id: "mercury", frames: [["Mercury", ["mercury-deferent", "mercury-plane", "mercury"]]] },
      ],
    }],
  },
  {
    name: "Mars",
    flattenBody: true,
    bodies: [
      {
        id: "mars",
        frames: [["Mars", ["mars-deferent-e", "mars-deferent-s", "mars"]]],
        children: [
          { id: "phobos", frames: [["Phobos", ["phobos"]]] },
          { id: "deimos", frames: [["Deimos", ["deimos"]]] },
        ],
      },
    ],
  },
  {
    name: "Outer Planets",
    bodies: [
      { id: "jupiter", frames: [["Jupiter", ["jupiter-deferent", "jupiter"]]] },
      { id: "saturn", frames: [["Saturn", ["saturn-deferent", "saturn"]]] },
      { id: "uranus", frames: [["Uranus", ["uranus-deferent", "uranus"]]] },
      { id: "neptune", frames: [["Neptune", ["neptune-deferent", "neptune"]]] },
      { id: "pluto", frames: [["Pluto", ["pluto-deferent", "pluto-eccentric", "pluto"]]] },
    ],
  },
  {
    name: "Small Bodies",
    bodies: [
      { id: "halley", frames: [["Halleys", ["halley-deferent", "halley"]]] },
      { id: "eros", frames: [["Eros", ["eros-deferent-a", "eros-annual-centre-oscillation", "eros-deferent-b", "eros"]]] },
    ],
  },
];

export const getCelestialEditorGroups = (settings = getCelestialSettings()) => {
  const settingsByName = new Map(settings.map((setting) => [setting.name, setting]));
  const getSetting = (id) => {
    const object = byId.get(id);
    if (!object) throw new Error(`Editor references unknown object '${id}'`);
    const setting = settingsByName.get(object.name);
    if (!setting) throw new Error(`Editor references missing setting '${object.name}'`);
    return setting;
  };

  return EDITOR_GROUPS.map((group) => ({
    ...group,
    bodies: group.bodies.map(function buildBody(body) {
      const object = byId.get(body.id);
      return {
        id: body.id,
        name: object?.name || body.id,
        setting: getSetting(body.id),
        frames: body.frames.map(([name, ids]) => ({
          name,
          settings: ids.map(getSetting),
        })),
        children: (body.children || []).map(buildBody),
      };
    }),
  }));
};

// Presentation-only tree for editors and inspectors.  The model remains a
// flat objects[] array; this simply reconstructs its declared parentId graph.
// Keeping this here means UI code never needs to infer hierarchy from names.
export const getCelestialEditorTree = (settings = getCelestialSettings()) => {
  const settingsByName = new Map(settings.map((setting) => [setting.name, setting]));

  const buildEditorNode = (object) => ({
    id: object.id,
    name: object.name,
    carrier: Boolean(object.carrier),
    setting: settingsByName.get(object.name),
    children: (childrenOf.get(object.id) || []).map(buildEditorNode),
  });

  return (childrenOf.get(null) || []).map(buildEditorNode);
};

const buildNode = (object) => ({
  key: object.id,
  kind: "object",
  name: object.name,
  settingName: object.name,
  orbitScale: object.displayOrbitScale,
  hosts: object.hosts || [],
  operation: object.motionOperation,             // Extracted ONLY if present in JSON
  frameType: object.frameType || null,           // Extracted ONLY if present in JSON
  referenceFrame: object.referenceFrame || null, // Extracted ONLY if present in JSON
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
