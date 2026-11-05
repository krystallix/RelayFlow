# RelayFlow ⚡

Modern web-based relay logic CAD and circuit simulation tool engineered to Simurelay standards.

## Overview

RelayFlow is a high-performance schematic capture and simulation platform for electrical control systems, industrial relay logic, motor starters (DOL, Star-Delta, Forward/Reverse), interlocks, and sensor automation.

### Key Features
- **Schematic CAD Editor**: Infinite panning canvas with 30px grid snap, orthogonal and bezier wire routing, and magnetic alignment guides.
- **Relay Logic Simulation Engine**: Real-time graph solver computing potential propagation across DC (24V) and 3-Phase AC (L1, L2, L3, N, PE) networks.
- **True Phase-Sequence 3-Phase Motors**: Phase rotation detection automatically running motors Clockwise (CW) or Counter-Clockwise (CCW) with an internal SVG rotation indicator.
- **Splice-on-Click Wire Junctions**: Click any existing wire while drafting to splice it with a junction dot.
- **Monochrome Industrial CAD Aesthetic**: Uniform wire color rendering and clean monochrome UI icons.
- **Dual Format Serializer**: Native `.rflow` format and full compatibility import/export for `.smrl` (Simurelay).
- **Virtual Multimeter Probe HUD**: Real-time live potential/voltage HUD inspector when hovering terminals and wires.
- **Mini-Map Navigator**: Interactive viewport overview with draggable camera viewfinder.

## Tech Stack
- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **State Management**: Zustand with persistent storage
- **Styling**: Tailwind CSS, Lucide Icons
- **Testing**: Vitest

## Getting Started

### Installation
```bash
pnpm install
# or
npm install
```

### Development Server
```bash
pnpm dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run Tests
```bash
pnpm test
```

### Production Build
```bash
pnpm build
```

## Shortcuts
- `Ctrl + K` / `/`: Quick component search
- `Ctrl + N`: New schematic
- `Ctrl + D`: Duplicate selection
- `Ctrl + A`: Select all
- `R`: Rotate component 90° CW
- `Delete` / `Backspace`: Delete selected node or wire
- `Shift + Drag`: Marquee box selection
- `Space + Drag` / Middle Click: Pan canvas
- `Scroll Wheel`: Zoom in / out

## License
MIT
