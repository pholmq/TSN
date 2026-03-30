# Welcome to The Tychosium

The Tychosium is an interactive 3D simulator of the TYCHOS model. It allows you to visualize the motions of the planets, trace their paths over time, generate Ephemerides (lists of planetary positions), and discover and examine astronomical events such as conjunctions, oppositions, eclipses, Venus & Mercury solar transits, etc.

## Features

- **All planets of the Solar system** in the TYCHOS model configuration are arranged in an actual Euclidean space. The simulation also includes **Halley’s comet** and asteroid **Eros**.
- **9000+ stars** with Right Ascension, Declination, Magnitude, and Color temperature.
- **Search:** All stars, planets, comets, and asteroids that are included in the simulator can be searched and tracked.
- **Accurate scale and distances:** With **"Actual planet sizes"** checked, all celestial bodies are to scale and at correct relative distances. In the **Stars & Helpers** menu, the star distances can be adjusted. Default is `42633` (the TYCHOS model’s reduction factor for star distances), but if set to `1`, the official star distances are used. When **"Celestial sphere"** is checked, the stars are projected at a uniform distance that can be adjusted with **Sphere & Zodiac size**.
- **Planet camera:** When selecting **"Planet camera"**, the view is attached to Earth, with numerous location presets. It is also possible to view the universe from other planets.
- **Trace:** When activated, planetary motions and retrogrades can be visualized.
- **Constellations and Zodiac wheels:** In the **Stars & Helpers** menu, H.A. Rey’s beautiful constellation patterns can be activated. So can the Tropical and Sidereal zodiacs, as well as the Equinoxes & Solstices lines to study the Precession of the Equinoxes.
- **Perpetual calendar:** The simulation implements the astronomical year count (which includes the year "0"). It accounts for the Gregorian calendar reform and supports Julian astronomical dates.

---

## Basic Navigation

- **Rotate Camera:** Left-Click + Drag
- **Zoom:** Mouse Scroll Wheel
- **Change camera target:** Double-click on a planet
- **Hover over any celestial body** to see its current position

---

## Time & Main Controls (Top Right Menu)

The primary panel controls the flow of time in the simulator.

- **Question mark (?):** Opens this window.
- **Stripes and X:** Hides/Shows the main menu.
- **Reset:** Restores the simulator to the default start date (2000-06-21).
- **Today:** Sets today’s date.
- **Playback Controls:** - **Play/Pause (▶ / ⏸):** Starts or stops the progression of time.
  - **Step Back / Step Forward (⏮ / ⏭):** Click to step one unit of time, or click and hold to move through time continuously.
- **Date, Time (UTC), & Julian Day:** Manually enter specific dates or times. Press `Enter` to instantly jump to that exact moment.

---

## Speed Controls

- **1 sec/step equals:** Sets the multiplier for time progression. You can use `Up/Down` on your keyboard to add/remove increments. Negative numbers cause the simulation to move backwards.
- **Time Unit (Dropdown):** Choose the unit of time for each step/second (e.g., Seconds, Hours, Days, Solar Years, Sidereal Years).

---

## Main Menu

Directly below the time controls is the main menu, divided into expandable sections.

### Controls

Toggles for primary viewing modes and control panels.

- **Actual planet sizes:** Toggles between visually scaled-up planets and their true, realistic scale.
- **Planet camera:** Activates the Planet camera.
- **Camera follow:** Locks the camera to follow the planet that is currently the camera target.
- **Labels:** Shows or hides the names of planets and stars.
- **Orbits:** Toggles the visibility of planetary orbit lines.
- **Search:** Opens the **Search** tool to find and track specific stars or planets.
- **Positions:** Opens a live data panel showing the Right Ascension (RA), Declination (Dec), Distance, and Elongation of the planets.
- **Ephemerides:** Opens the Ephemerides generator to calculate historical or future planetary data over custom date ranges.

### Trace

Tool for drawing the paths that planets take through space over time.

> **Note:** To trace the Sun, you need to set the "1 sec/step equals" to 100 years or higher, since the trace shows the Sun's motion during a Great Year.

- **Trace On/Off:** Enables tracing.
- **Line width & Dotted line:** Customizes the appearance of the trace lines.
- **Trace length:** Determines how far back in time the trace tail extends.
- **Step length:** Adjusts the resolution/smoothness of the generated trace.
- **Planets:** Select which planets should be traced.

### Planets & Orbits

Adjust the visual representation of the solar system.

- **Planet sizes:** Slider to manually scale up planets for better visibility.
- **Orbits linewidth:** Adjusts the thickness of the orbit paths.
- **Arrows:** Shows directional arrows on the orbital paths.
- **Polar lines:** Toggles the visibility of polar axis lines on the Earth and the Sun.
- **Graticules:** Toggles a spherical coordinate grid over the Earth and the Sun.
- **Edit settings:** Opens advanced developer options for modifying object parameters.
- **Planets:** Select which planets, moons, comets, and asteroids to view.

### Stars & Helpers

Controls the fixed stars, constellation visibility, and Equinox/Zodiac markers.

- **Stars:** Toggles the visibility of the background starfield (Bright Star Catalogue).
- **Divide distances by:** Pulls the stars closer/further without changing their coordinate positions.
- **Celestial sphere:** Projects all stars onto a uniform sphere at an equidistant radius.
- **Constellations:** Draws H.A. Rey's classical constellations.
- **Equinoxes & Solstices:** Marks the Equinoxes and Solstices.
- **Sidereal Zodiac / Tropical Zodiac:** Displays the respective zodiacs around the solar system.
- **Sphere & Zodiac size:** Scales the radius of the celestial sphere, the constellations, and helpers.
