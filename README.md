# The Tychosium — Native Binary Research Branch

![License](https://img.shields.io/badge/license-GPLv2-blue.svg)
![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react&logoColor=black)
![Three.js](https://img.shields.io/badge/Three.js-r162-black.svg?logo=three.js&logoColor=white)

**The Tychosium** is an interactive 3D astronomical simulation implementing the
TYCHOS model of the solar system. This branch began as a focused attempt to fix
the Moon's declination by representing its node and orbital plane explicitly.

That small task grew into a broader research project: building a reproducible
ephemeris-analysis pipeline, auditing coordinate-reference conventions,
reorganizing the code around the relationships proposed by TYCHOS, and refining
the numerical settings in collaboration with TYCHOS creator Simon Shack.

The result is a unified, body-centric and explicitly parent-relative model. It
retains the interactive Tychosium application while making its astronomical
structure easier to understand, test and refine. Calibration remains in
progress; the present values are a research baseline, not a final ephemeris.

> The comparisons below measure agreement with JPL apparent true-of-date
> coordinates. They are empirical software diagnostics and do not by themselves
> prove a physical interpretation.

## From a lunar correction to a system-wide investigation

The original lunar implementation did not explicitly express the Moon's nodal
motion and inclined orbital plane. Introducing `Moon Node` and `Moon Plane`
substantially improved its declination and exposed a more general architectural
question: should geometric stages be represented as independent scene objects,
or as named motion components owned by real celestial bodies?

The investigation subsequently included:

- an explicit lunar node and plane;
- automated TYCHOS/JPL comparisons over dense time grids;
- separate treatment of ICRF and apparent true-of-date reference products;
- Mercury and Venus solar-companion planes;
- an explicit asymmetric Sun–Mars primary/companion system;
- parent-relative handling of Mars, Mercury, Venus and Eros;
- preservation of Phobos and Deimos beneath Mars;
- unified settings, hierarchy and editor metadata in one model document; and
- iterative numerical refinement with values supplied by the TYCHOS author.

Structural migrations were tested for numerical equivalence before orbital
refinements were evaluated. This separation made it possible to tell whether a
result came from reorganizing the code or from changing astronomical parameters.

## Hierarchy: before and now

The following diagrams are conceptual summaries rather than every internal
Three.js transform.

### Former implementation

```text
Earth / scene reference
├─ Moon chain
├─ Sun
│  ├─ Jupiter
│  ├─ Saturn
│  ├─ Uranus
│  ├─ Neptune
│  ├─ Pluto
│  └─ Halley
├─ Mars absolute chain
│  ├─ Phobos
│  └─ Deimos
├─ Mercury absolute chain
├─ Venus absolute chain
└─ Eros absolute chain
```

Mars, Mercury, Venus and Eros were effectively independent Earth-level
transform chains. Their definitions contained annual motion already present in
the Sun's path. Although this could reproduce the intended visible geometry, the
parent relationships proposed by TYCHOS were not expressed directly in the
astronomical data model. A reader could not infer the full conceptual system
from the code hierarchy alone.

### Current implementation

```text
SystemCenter                         (PVP geometric reference)
└─ Earth                             (PVP path / terrestrial reference)
   ├─ Moon
   │  ├─ Node motion
   │  ├─ Orbital plane
   │  └─ Main lunar orbit
   └─ Sun–Mars Binary Frame
      └─ Sun Primary
         ├─ Mars Junior Companion
         │  ├─ Phobos
         │  └─ Deimos
         ├─ Venus Senior Solar Companion
         ├─ Mercury Junior Solar Companion
         ├─ Jupiter
         ├─ Saturn
         ├─ Uranus
         ├─ Neptune
         ├─ Pluto
         ├─ Halley
         └─ Eros
```

This remains a Tychonic arrangement: Earth follows its PVP path, the Sun is
positioned relative to Earth, and the solar subsystem is organized beneath the
Sun. `SystemCenter` is a geometric reference associated with the PVP path, not a
physical body, barycentre or proposed cause of motion.

The Sun–Mars relationship is intentionally asymmetric. It encodes the TYCHOS
primary/junior-companion structure; it does not add a conventional gravitational
barycentre, equal binary radii or forced opposition.

## Why the new organization is useful

- **The code describes the conceptual model.** Mercury and Venus are solar
  companions, Mars is the junior Sun companion, the outer planets and minor
  bodies are Sun-hosted, and natural satellites inherit their host bodies.
- **Parent motion is inherited.** A Sun-hosted body receives the Sun's world
  position and contributes its own relative geometry rather than repeating a
  complete Earth-level solar carrier.
- **Real bodies and geometric terms are distinct.** Nodes, planes and deferents
  remain independently adjustable motion components, but they are properties of
  a body rather than fictitious celestial bodies.
- **Settings are auditable.** Hierarchy, numerical motion components, editor
  groups and render instructions live in one schema-v3 document:
  `src/settings/celestial-model.json`.
- **Experiments are safer.** Stable component IDs, import validation, automated
  tests and archived baselines allow one parameter family to be investigated
  without silently changing unrelated geometry.

The current world-position pattern is:

```text
body world position
  = inherited parent world position
  + parent-relative centre / carrier
  + local deferent, plane and orbit geometry
```

Eros retains a separate annual harmonic inherited from its former geometry. The
common annual remainder formerly carried by Mars, Mercury and Venus was removed
after a dedicated experiment; its historical values and measured effects remain
documented in [`edits/binary_tychos.md`](edits/binary_tychos.md).

## Ephemeris comparison: original vs current

The tables compare the original classic Tychosium with the current branch over:

- `2000-06-21 00:00:00` through `2026-06-21 00:00:00`;
- 75,969 samples at three-hour intervals; and
- JPL Earth apparent, true-equator/equinox-of-date, airless RA/Dec.

Each value is `mean (RMS)` in degrees. Signed mean values show bias direction.
Percentage changes in mean use the absolute bias, so movement toward zero counts
as improvement. Lower RMS and lower angular separation are better.

### Right ascension

| Body | Original mean (RMS) | Current mean (RMS) | Mean change | RMS change |
|---|---:|---:|---:|---:|
| Moon | −0.809089° (2.223721°) | −0.243878° (1.118789°) | 69.9% better | 49.7% better |
| Sun | −0.006269° (0.254408°) | 0.009528° (0.054706°) | 52.0% worse | 78.5% better |
| Mercury | −0.079242° (2.274010°) | −0.014186° (2.567510°) | 82.1% better | 12.9% worse |
| Venus | −0.429095° (0.802943°) | 0.023022° (0.428305°) | 94.6% better | 46.7% better |
| Mars | 0.103560° (0.507825°) | 0.221051° (0.552511°) | 113.5% worse | 8.8% worse |
| Jupiter | −0.086418° (0.346365°) | −0.071695° (0.330077°) | 17.0% better | 4.7% better |
| Saturn | −0.092129° (0.674754°) | −0.081173° (0.681177°) | 11.9% better | 1.0% worse |
| Uranus | −0.314422° (0.332687°) | 0.025783° (0.151998°) | 91.8% better | 54.3% better |
| Neptune | 0.031032° (0.048885°) | 0.049033° (0.060077°) | 58.0% worse | 22.9% worse |
| Pluto | −4.067577° (4.872981°) | −4.054771° (4.862810°) | 0.3% better | 0.2% better |

### Declination

| Body | Original mean (RMS) | Current mean (RMS) | Mean change | RMS change |
|---|---:|---:|---:|---:|
| Moon | −0.017217° (3.538500°) | −0.011961° (0.370266°) | 30.5% better | 89.5% better |
| Sun | −0.077357° (0.102623°) | 0.003903° (0.014145°) | 95.0% better | 86.2% better |
| Mercury | 0.363899° (1.431316°) | 0.204947° (1.005876°) | 43.7% better | 29.7% better |
| Venus | −0.100396° (0.243192°) | 0.042374° (0.221878°) | 57.8% better | 8.8% better |
| Mars | −0.285433° (0.442256°) | −0.261285° (0.343347°) | 8.5% better | 22.4% better |
| Jupiter | −0.281976° (0.314929°) | −0.264183° (0.289047°) | 6.3% better | 8.2% better |
| Saturn | −0.042712° (0.161762°) | −0.026352° (0.172020°) | 38.3% better | 6.3% worse |
| Uranus | 0.048105° (0.062971°) | 0.030291° (0.053997°) | 37.0% better | 14.3% better |
| Neptune | −0.078423° (0.096471°) | 0.043428° (0.045518°) | 44.6% better | 52.8% better |
| Pluto | 2.694487° (2.715907°) | 2.688729° (2.709348°) | 0.2% better | 0.2% better |

### Angular separation

| Body | Original mean (RMS) | Current mean (RMS) | Mean change | RMS change |
|---|---:|---:|---:|---:|
| Moon | 3.852038° (4.132757°) | 0.949483° (1.127079°) | 75.4% better | 72.7% better |
| Sun | 0.242307° (0.269093°) | 0.048500° (0.053584°) | 80.0% better | 80.1% better |
| Mercury | 2.161945° (2.597335°) | 2.111046° (2.648538°) | 2.4% better | 2.0% worse |
| Venus | 0.680673° (0.810587°) | 0.358906° (0.457984°) | 47.3% better | 43.5% better |
| Mars | 0.552903° (0.648968°) | 0.526245° (0.621506°) | 4.8% better | 4.2% better |
| Jupiter | 0.416447° (0.459890°) | 0.396866° (0.430288°) | 4.7% better | 6.4% better |
| Saturn | 0.562904° (0.664593°) | 0.572329° (0.673577°) | 1.7% worse | 1.4% worse |
| Uranus | 0.318582° (0.333708°) | 0.143470° (0.157240°) | 55.0% better | 52.9% better |
| Neptune | 0.099549° (0.107537°) | 0.068421° (0.073787°) | 31.3% better | 31.4% better |
| Pluto | 4.953708° (5.310194°) | 4.946189° (5.298340°) | 0.2% better | 0.2% better |

The strongest overall gains currently appear in the Moon, Sun, Venus and
Uranus. Neptune also improves substantially in total angular separation despite
its isolated RA statistic moving in the opposite direction. Mercury's mean RA
bias and declination improve, but its angular RMS remains close to the original.
Saturn is slightly worse overall, and Pluto is essentially unchanged.

## Research status

Refinement is still in progress. Current priorities include:

- reducing Mercury's remaining periodic RA error without sacrificing its
  improved bias and declination;
- investigating Mars RA bias within the asymmetric companion geometry;
- determining whether Saturn's small regression is parameter-related or a
  tradeoff in the current interval;
- validating improvements on independent historical intervals;
- studying Mercury and Venus transit-relative observables separately from
  whole-orbit JPL agreement; and
- determining whether Eros's remaining annual harmonic has a simpler native
  geometric expression.

Settings changes should be evaluated with the same interval, cadence and
reference product before conclusions are drawn. The analysis workflow uses
`apparent-of-date` by default for this research because it has proven the more
useful comparison product for the current TYCHOS exports.

Detailed implementation notes are available in:

- [`edits/binary_tychos.md`](edits/binary_tychos.md)
- [`edits/edit_settings_instructions.md`](edits/edit_settings_instructions.md)
- [`edits/README_handoff.md`](edits/README_handoff.md)

## Configuration

The astronomical source of truth is:

```text
src/settings/celestial-model.json
```

It contains the real-body hierarchy, parent relationships, named motion
components, numerical parameters, editor organization and internal render tree.
The **Edit Settings** panel can export a complete reusable schema-v3 model and
load it again for runtime testing. Saving from the browser downloads a file; it
does not overwrite the repository automatically.

## Getting started

```bash
git clone https://github.com/pholmq/TSN.git
cd TSN
npm install
npm start
```

Open `http://localhost:3000` in a browser.

Run the software validation gates with:

```bash
npm test -- --watchAll=false --runInBand
npm run build
```

See [`edits/README.md`](edits/README.md) for ephemeris export, JPL download and
analysis commands.

## Technology

- React 18
- Three.js and React Three Fiber
- Zustand
- Leva
- Python/NumPy analysis tools

## Acknowledgments

- Simon Shack for creating the TYCHOS model and contributing settings,
  conceptual guidance and continuing refinements.
- Tycho Brahe and the many historical astronomers whose observations continue
  to motivate investigation.
- Yale University Observatory for the Bright Star Catalog.
- The open-source React, Three.js and scientific-Python communities.

Learn more about the TYCHOS model at [tychos.space](https://www.tychos.space).

## License

This project is licensed under the GNU General Public License v2.0. See
[`LICENSE`](LICENSE).
