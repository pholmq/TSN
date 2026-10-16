# TSOG migration experiment

This branch is an isolated experiment based on Patrik's `TSOG_Work` engine.
It does not modify the accepted `full-send-binary-tychos` baseline.

## First structural integration

`scripts/convert-fullsend-model.mjs` converts the active full-send schema-v3
model into TSOG's schema-v4 `objects[]` / `parentId` representation. It writes
both `src/settings/celestial-model.json` and its matching display catalogue.

The generated tree contains 41 stages, including:

- Earth, Moon node, Moon plane and explicit node counterrotation;
- the Earth-hosted Sun--Mars binary frame and Sun primary frame;
- Sun-hosted Mercury, Venus, Mars, outer planets, Pluto, Halley and Eros;
- Mars-hosted Phobos and Deimos; and
- Pluto's ordered deferent, eccentric and counterrotation stages.

This proves that TSOG's flat list can encode the current *structural* tree. A
flat JSON list is still a hierarchy because `parentId` defines its tree.

## Not yet an equivalence claim

This first pass deliberately uses TSOG's ordinary generic circle/centre/tilt
evaluator for every generated stage. It has not yet ported the specialised
semantics of the full-send model:

- Sun-relative frame anchoring used by Mars, Mercury, Venus and Eros;
- Eros annual centre harmonic evaluation;
- the complete current lunar solar-coupled / equant geometry; and
- any future generic operation required by numerical comparison.

Therefore the buildable structural tree is an integration checkpoint, not an
accepted astronomical replacement. The next step is to introduce documented,
generic motion-operation types into TSOG and validate each one against identical
dates in the full-send baseline.
