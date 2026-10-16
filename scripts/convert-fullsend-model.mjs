/**
 * Experimental, reproducible first-pass migration from the current
 * full-send declarative model (schema v3) to TSOG's flat objects[] tree.
 *
 * This intentionally translates only parent/child transform stages. It does
 * not claim numerical equivalence for specialised relative-frame or lunar
 * operators; those are explicit generic-engine work items.
 *
 * Usage: node scripts/convert-fullsend-model.mjs <full-send-root>
 */
import fs from "node:fs";
import path from "node:path";

const sourceRoot = process.argv[2];
if (!sourceRoot) throw new Error("Usage: node scripts/convert-fullsend-model.mjs <full-send-root>");

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const sourceModel = readJson(path.join(sourceRoot, "src/settings/celestial-model.json"));
const sourceMisc = readJson(path.join(sourceRoot, "src/settings/misc-settings.json"));
const miscByName = new Map(sourceMisc.map((entry) => [entry.name, entry]));
const bodyById = new Map(sourceModel.bodies.map((body) => [body.id, body]));
const objects = [];
const misc = [];
const numeric = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const copyMotion = (motion) => Object.fromEntries(Object.entries(motion || {})
  .filter(([, value]) => typeof value === "number" || typeof value === "string")
  .map(([key, value]) => [key, numeric(value)]));

const addStage = ({ motion, parentId, carrier = true, name, id, hosts, extra = {} }) => {
  const stage = { ...copyMotion(motion), id: id || motion?.id, name: name || motion?.name,
    parentId, ...(carrier ? { carrier: true } : {}), ...extra };
  if (!stage.id || !stage.name) throw new Error("Every migrated stage needs id and name");
  if (hosts) stage.hosts = hosts;
  objects.push(stage);
  misc.push(miscByName.get(stage.name) ? { ...miscByName.get(stage.name) } : {
    name: stage.name, color: "gray", type: carrier ? "deferent" : "planet", visible: false,
  });
  return stage.id;
};
const frame = (id, name, parentId) => addStage({ id, name, parentId, carrier: true,
  motion: { id, name, size: 0, startPos: 0, speed: 0, orbitRadius: 0,
    orbitCentera: 0, orbitCenterb: 0, orbitCenterc: 0, orbitTilta: 0, orbitTiltb: 0 } });
const motion = (bodyId, key) => bodyById.get(bodyId).motion[key];
const body = (bodyId, parentId, key = "orbit", extra = {}) =>
  addStage({ motion: motion(bodyId, key), parentId, carrier: false, extra });
const carrier = (bodyId, parentId, key) => addStage({ motion: motion(bodyId, key), parentId });

const root = addStage({ motion: sourceModel.referenceFrame.motion.origin, parentId: null, carrier: false });
const earth = body("earth", root, "orbit", { hosts: ["ecliptic-grid"] });

const moonNode = carrier("moon", earth, "node");
const moonPlane = carrier("moon", moonNode, "plane");
const sourceNode = motion("moon", "node");
const moonCounter = addStage({ parentId: moonPlane, carrier: true, motion: {
  id: "moon-node-counterrotation", name: "Moon Node Counterrotation", size: 0,
  startPos: -numeric(sourceNode.startPos), speed: -numeric(sourceNode.speed), orbitRadius: 0,
  orbitCentera: 0, orbitCenterb: 0, orbitCenterc: 0, orbitTilta: 0, orbitTiltb: 0,
} });
const moonA = carrier("moon", moonCounter, "deferentA");
body("moon", moonA);

const binaryFrame = frame("sun-mars-binary-frame", "Sun-Mars Binary Frame", earth);
const sunPrimaryFrame = frame("sun-primary-frame", "Sun Primary Frame", binaryFrame);
const sunCarrier = carrier("sun", sunPrimaryFrame, "carrier");
const sun = body("sun", sunCarrier);
const addSunChain = (bodyId, keys) => {
  let parent = sun;
  keys.slice(0, -1).forEach((key) => { parent = carrier(bodyId, parent, key); });
  body(bodyId, parent, keys.at(-1));
};
[
  ["jupiter", ["deferent", "orbit"]], ["saturn", ["deferent", "orbit"]],
  ["uranus", ["deferent", "orbit"]], ["neptune", ["deferent", "orbit"]],
  ["halley", ["deferent", "orbit"]],
  ["pluto", ["deferent", "eccentric", "eccentricCounterrotation", "orbit"]],
  ["mars", ["parentRelativeCarrier", "secondary", "orbit"]],
  ["venus", ["parentRelativeCarrier", "secondary", "plane", "orbit"]],
  ["mercury", ["parentRelativeCarrier", "secondary", "plane", "orbit"]],
  ["eros", ["parentRelativeCarrier", "secondary", "orbit"]],
].forEach(([bodyId, keys]) => addSunChain(bodyId, keys));
const mars = objects.find((entry) => entry.id === "mars");
body("phobos", mars.id);
body("deimos", mars.id);

const targetRoot = process.cwd();
fs.writeFileSync(path.join(targetRoot, "src/settings/celestial-model.json"), `${JSON.stringify({
  schemaVersion: 4, id: "tychos-tsog-migration", name: "TYCHOS TSOG migration experiment",
  description: "First-pass structural migration from full-send-binary-tychos.", objects,
}, null, 2)}\n`);
fs.writeFileSync(path.join(targetRoot, "src/settings/misc-settings.json"), `${JSON.stringify(misc, null, 2)}\n`);
console.log(`Wrote ${objects.length} structural stages to TSOG schema v4.`);
