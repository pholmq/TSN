# The TYCHOSIUM 💫

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-GPLv2-blue.svg)
![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react&logoColor=black)
![Three.js](https://img.shields.io/badge/Three.js-r162-black.svg?logo=three.js&logoColor=white)

**The TYCHOSIUM** is an interactive 3D astronomical simulation implementing the **TYCHOS model** of our solar system. It offers a unique perspective on celestial mechanics, featuring real-time orbital calculations, a comprehensive star catalog, and immersive visualization.

Built with modern web technologies to ensure performance and accuracy, this project aims to visualize the binary solar system concepts proposed by the Tychos model.

---

## 📑 Table of Contents
- [Features](#-features)
- [The TYCHOS Model](#-the-tychos-model)
- [Technical Stack](#-technical-stack)
- [Getting Started](#-getting-started)
- [Usage & Controls](#-usage--controls)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Features

### 🔭 Astronomical Simulation
* **TYCHOS Implementation:** Full realization of the Earth-centered binary system model.
* **Real-time Mechanics:** Accurate planetary motions with the ability to traverse time (past/future).
* **Celestial Bodies:** Includes the Sun, Moon, planets, major asteroids, and Halley's comet.
* **Star Catalog:** Integrated **Bright Star Catalog (BSC)** containing over 9,000 stars with accurate magnitude and color data.

### 🎨 3D Visualization
* **Dual Camera System:** Switch between a global "Orbit Camera" and a surface-level "Planet Camera".
* **Orbital Tracing:** Visualize complex planetary geometric paths (spirographs) over time.
* **Visual Aids:** Ecliptic grids, celestial sphere, zodiacal bands, and polar lines.
* **High-Fidelity Graphics:** Realistic textures and dynamic solar lighting using post-processing effects.

### 🎛️ Advanced Interaction
* **Time Travel:** Jump to specific historical or future dates instantly.
* **Perpetual calendar:** Julian/Gregorian dates and Supports Julian day.
* **Variable Speed:** Control simulation speed from real-time up to millennial steps.
* **Smart Search:** Search implementation to quickly locate stars by name/HR number.

---

## 💫 The TYCHOS Model

This simulation is distinct from standard heliocentric visualizers. It implements the TYCHOS model, which proposes:
* **Earth as Reference:** Earth remains relatively stationary at the center of the system.
* **Binary System:** The Sun and Mars are binary companions.
* **PVP Orbit:** The entire solar system rotates together with Earth in a specific pattern (Polaris-Vega-Polaris).

> 📖 **Learn more:** [tychos.space](https://www.tychos.space)

---

## 💻 Technical Stack

This project leverages the latest ecosystem for 3D web development.

| Category | Technology | Purpose |
|----------|------------|---------|
| **Core** | [React 18](https://reactjs.org/) | UI and Component Architecture |
| **3D Engine** | [Three.js](https://threejs.org/) | WebGL Rendering Engine |
| **Renderer** | [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/) | React renderer for Three.js |
| **Helpers** | [@react-three/drei](https://github.com/pmndrs/drei) | High-level 3D abstractions |
| **Effects** | [Postprocessing](https://github.com/pmndrs/postprocessing) | Bloom, glow, and visual effects |
| **State** | [Zustand](https://github.com/pmndrs/zustand) | Global state management |
| **GUI** | [Leva](https://github.com/pmndrs/leva) | Tweakable control panels |
| **Search** | [Fuse.js](https://fusejs.io/) | Fuzzy search for star catalogs |
| **Icons** | [React Icons](https://react-icons.github.io/react-icons/) | UI Iconography |

---

## 🌍 Getting Started

### Prerequisites
* **Node.js**: v16.0.0 or higher
* **Package Manager**: `npm` or `yarn`

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/pholmq/TSN.git](https://github.com/pholmq/TSN.git)
    cd TSN
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start development server**
    ```bash
    npm start
    ```
    Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Building for Production
To create an optimized build for deployment:
```bash
npm run build