# Welcome to The TYCHOSIUM

The Tychosium is an interactive 3D simulator of the TYCHOS model of our solar system. It allows you to visualize the intricate orbital mechanics of our nearby celestial bodies, trace their paths over time, generate Epemerides (lists of planetary positions), discover and examine astronomical events such as conjunctions and oppositions, elcipses, etc.

## Features

- **All planets of the Solar system** arranged in the TYCHOS model configuration in an actual Euclidian space. The simulation also includes Halleys comet and Eros.
- **9000+ stars** with Right Ascension, Declination, Magnitude and Color temperature.
- **Search** All stars, planets, comets and asteroids can be searched and tracked.
- **Accurate scale and distances** Whith `Actual planet` sizes checked all celectial bodies are to scale and at correct relative distances. In the `Stars & Helpers` menu, the Star distances can be adjusted. Default is `42633` - the reduction factor suggested in the TYCHOS model, but if set to `1` the official star distances are used. When `Celstial sphere` is checked, the stars are projected at a uniform distance that can be adjusted with `Sphere & Zodiac size`
- **Planet camera** When selecting `Planet camera` the camera is attched to Earth, with numerous location presets and its also possible to view the universe from other planets.
- **Trace** In the trace menu planetary motion and retogrades can be visualized
- **Constellations and Zodiac wheels** In the `Stars & Helpers` the H.A. Reys beatiful way to draw constellation can be turned on, plus the tropical and sidereal zodiac and the Equinoxes to study the Precession of the Equinoxes.
- **Perpetual calendar** The simulation allows for pratically and date and accunts for the Julian calendar and supports Julian astronomical dates.

---

## Basic Navigation

- **Rotate Camera:** Left-Click + Drag
- **Zoom:** Mouse Scroll Wheel
- **Change camera target:** Double click on a planet
- **Hoover any planet or star** to see its current position

---

## Time & Main Controls (Top Right Menu)

The primary panel controls the flow of time in the simulator.

- **Reset:** Restores the simulator to the default starting date (2000-06-21).
- **Today:** Sets todays date.
- **Playback Controls:** - **Play/Pause (▶ / ⏸):** Starts or stops the progression of time.
  - **Step Back / Step Forward (⏮ / ⏭):** Click to step one unit of time, or click and hold to move through time continuously.
- **Date, Time (UTC), & Julian Day:** Manually enter specific dates or times. Press `Enter` to instantly jump to that exact moment.

---

## Speed Controls

- **1 sec/step equals:** Sets the multiplier for time progression. You can use `Up/Down` on your keyboard and you can enter negative numbers which causes the simulation to go backwards
- **Time Unit (Dropdown):** Choose the unit of time for each step/second (e.g., Seconds, Hours, Days, Solar Years, Sidereal Years).

## Main Menu

Directly below the time controls is the main menu, divided into expandable sections.

### Controls

Toggles for primary viewing modes and control panels.

- **Actual planet sizes:** Toggles between visually scaled-up planets and their true, realistic scale.
- **Planet camera:** Activates the Planet camera.
- **Camera follow:** Locks the camera to follow the planet that is camera target.
- **Labels:** Shows or hides the names of planets and stars.
- **Orbits:** Toggles the visibility of planetary orbit lines.
- **Search:** Opens the **Search** tool to find and track specific stars or planets.
- **Positions:** Opens a live data panel showing the Right Ascension (RA), Declination (Dec), Distance, and Elongation of the planets.
- **Ephemerides:** Opens the Ephemerides generator that calculate historical or future planetary data over custom date ranges.

### Trace

Tool for drawing the paths that planets take through space over time.

**Note:** To trace the Sun you need to set the 1 sec/step equals to 100 years or higher, since the trace shows the Suns motion during a great year

- **Trace On/Off:** Enables tracing.
- **Line width & Dotted line:** Customizes the appearance of the trace lines.
- **Trace length:** Determines how far back in time the trace tail extends.
- **Step length:** Adjusts the resolution/smoothness of the generated trace.
- **Planets:** Select which planets that should be traced.

### Planets & Orbits

Adjust the visual representation of the solar system.

- **Planet sizes:** Slider to manually scale up planets for better visibility.
- **Orbits linewidth:** Adjusts the thickness of the orbit paths.
- **Arrows:** Shows directional arrows on the orbital paths.
- **Polar lines:** Toggles the visibility of polar axis lines on the Earth and the Sun.
- **Graticules:** Toggles a spherical coordinate grid over the Earth and the Sun.
- **Edit settings:** Opens advanced developer options for modifying object parameters.
- **Planets:** Select which planets, moons, comets and asteroids to view.

### Stars & Helpers

Controls the fixed stars, consellation visibility and Equinox and Zodiac markers.

- **Stars:** Toggles the visibility of the background starfield (Bright Star Catalogue).
- **Divide distances by:** Pulls the stars closer/further without changing their coordinate positions.
- **Celestial sphere:** Projects all stars onto a uniform sphere at an equidistant radius.
- **Constellations:** Draws H.A. Reys classical constellations.
- **Equinoxes & Solistices:** Marks the Equinoxes and Solistices.
- **Sidereal Zodiac / Tropical Zodiac:** Displays the respective zodiacs around the solar system.
- **Sphere & Zodiac size:** Scales the radius of the celestial sphere, the constellations and helpers..
