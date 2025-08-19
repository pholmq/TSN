# The TYCHOSIUM

An interactive 3D astronomical simulation implementing the TYCHOS model of our solar system. Experience celestial mechanics from a unique perspective with real-time orbital calculations, comprehensive star catalogs, and immersive 3D visualization.

**Built with:** React 18 • Three.js • JavaScript ES6+ • WebGL

## 🌟 Features

### Astronomical Simulation
- **TYCHOS Model Implementation** - Alternative solar system model with Earth at the center
- **Real-time Orbital Mechanics** - Accurate planetary motions with customizable time controls
- **Comprehensive Celestial Bodies** - Sun, Moon, planets, asteroids, and Halley's comet
- **Bright Star Catalog (BSC)** - Over 9,000 stars with proper astronomical data
- **Coordinate Systems** - RA/Dec, Azimuth/Elevation, and Cartesian conversions

### Interactive 3D Visualization
- **Dual Camera System** - Orbit camera for overview, planetary camera for surface perspective
- **Orbital Tracing** - Visualize planetary paths through time
- **Celestial Sphere** - Complete with coordinate grids and zodiacal references
- **Realistic Textures** - High-quality planetary surfaces and atmospheric effects
- **Dynamic Lighting** - Proper solar illumination and glow effects

### Advanced Controls
- **Time Navigation** - Jump to any date from ancient times to future
- **Speed Controls** - From seconds to years per step
- **Search & Discovery** - Find and track specific stars and planets
- **Customizable Views** - Show/hide orbits, labels, helpers, and more
- **Settings Export/Import** - Save and share custom configurations

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/pholmq/TSN.git
cd TSN

# Install dependencies
npm install

# Start development server
npm start
```

The application will open at `http://localhost:3000`

### Building for Production

```bash
# Create optimized production build
npm run build

# Serve the build locally (optional)
npx serve -s build
```

## 🎮 Usage Guide

### Basic Navigation
- **Mouse Drag** - Rotate view around the solar system
- **Mouse Wheel** - Zoom in/out
- **Double-click** - Center camera on celestial object
- **Right-click** - Access object context menu

### Time Controls
- **Play/Pause** - Start/stop time progression
- **Step Forward/Back** - Move by selected time increment
- **Date Input** - Jump to specific date
- **Speed Multiplier** - Adjust simulation speed

### Advanced Features

#### Planet Camera
Experience the view from any planetary surface:
1. Enable "Planet camera" in controls
2. Set latitude, longitude, and height
3. Adjust viewing angle and direction
4. Observe stars and planets from surface perspective

#### Star Search
Find specific stars in the catalog:
1. Use search box in top-left
2. Search by name or HR number
3. Selected stars are highlighted with crosshair
4. View detailed astronomical data

#### Orbital Tracing
Visualize planetary paths:
1. Enable "Trace" in controls
2. Select planets to trace
3. Adjust trace length and detail
4. Watch orbital patterns unfold

## 🛠 Technical Architecture

### Core Technologies
- **React 18** - Modern component architecture with hooks
- **Three.js / React Three Fiber** - 3D graphics and rendering
- **Zustand** - Lightweight state management
- **Leva** - Real-time GUI controls

### Key Components

```
src/
├── components/           # React components
│   ├── Stars/           # Star rendering and interaction
│   ├── Planets/         # Planetary objects and orbits
│   ├── Cameras/         # Camera systems
│   ├── UI/              # User interface elements
│   └── Helpers/         # Coordinate grids and reference frames
├── utils/               # Utility functions
│   ├── celestial-functions.js  # Astronomical calculations
│   ├── time-date-functions.js  # Temporal calculations
│   └── coordinate-conversions.js
├── settings/            # Configuration files
│   ├── celestial-settings.json # Planetary parameters
│   ├── star-settings.json      # Star catalog data
│   └── BSC.json                # Bright Star Catalog
└── store.js            # State management
```

### Astronomical Calculations
The simulation includes sophisticated astronomical mathematics:
- **Coordinate Transformations** - Convert between celestial coordinate systems
- **Julian Day Calculations** - Accurate time representations
- **Orbital Mechanics** - Real planetary motion calculations
- **Star Positioning** - Proper RA/Dec to 3D coordinate conversion

## 🌌 The TYCHOS Model

This simulation implements the TYCHOS model, an alternative to the standard heliocentric model:

- **Earth as Reference** - Earth remains relatively stationary
- **Solar System Mobility** - The entire solar system follows a specific pattern
- **Binary Star System** - Considers the Sun-Earth system as binary companions
- **Observational Accuracy** - Maintains astronomical observation validity

Learn more about the TYCHOS model at [tychos.space](https://www.tychos.space)

## 🎯 Performance Optimization

### Star Rendering
- **GPU-based Picking** - Efficient mouse interaction with thousands of stars
- **Level-of-Detail** - Adaptive rendering based on magnitude
- **Instanced Rendering** - Optimized for large star catalogs

### Rendering Pipeline
- **Frame Limiting** - Demand-based rendering for efficiency
- **Selective Updates** - Components update only when necessary
- **Memory Management** - Proper cleanup and resource management

## 🔧 Configuration

### Customizing Celestial Objects
Edit `src/settings/celestial-settings.json` to modify:
- Orbital parameters
- Planetary sizes and positions
- Starting positions and speeds
- Orbital tilts and orientations

### Star Catalog
The Bright Star Catalog (`src/settings/BSC.json`) includes:
- Star positions (RA/Dec)
- Magnitudes and colors
- Proper motion data
- Distance measurements

### UI Customization
Modify `src/index.css` for:
- Color schemes
- Layout adjustments
- Responsive design tweaks

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm start

# Run tests
npm test

# Build for production
npm run build
```

## 📚 Resources

### Astronomical References
- [The TYCHOS Book](https://www.tychos.space/book)
- [Bright Star Catalog](http://tdc-www.harvard.edu/catalogs/bsc5.html)
- [IAU Constellation Guidelines](https://www.iau.org/public/themes/constellations/)

### Technical Documentation
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction)
- [Three.js Documentation](https://threejs.org/docs/)
- [Zustand State Management](https://github.com/pmndrs/zustand)

## 🐛 Known Issues

- Large time jumps may require model recalculation
- Star picking sensitivity varies with zoom level
- Mobile touch controls need optimization
- Some texture loading delays on slower connections

## 📋 Roadmap

### Upcoming Features
- [ ] VR/AR support for immersive viewing
- [ ] Enhanced mobile interface
- [ ] Historical astronomical events
- [ ] Multi-language support
- [ ] Educational guided tours

### Technical Improvements
- [ ] WebGL 2.0 optimizations
- [ ] Service worker for offline usage
- [ ] Progressive web app features
- [ ] Enhanced accessibility support

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Simon Shack** - Creator of the TYCHOS model
- **Bright Star Catalog** - Harvard-Smithsonian Center for Astrophysics
- **React Three Fiber Community** - For excellent 3D web tools
- **Contributors** - All who have helped improve this simulation

## 📞 Contact & Support

- **Website**: [tychos.space](https://www.tychos.space)
- **Documentation**: [Project Wiki](https://github.com/pholmq/TSN/wiki)
- **Issues**: [GitHub Issues](https://github.com/pholmq/TSN/issues)
- **Discussions**: [GitHub Discussions](https://github.com/pholmq/TSN/discussions)

---

**Experience the cosmos from a new perspective with The TYCHOSIUM! 🌌**