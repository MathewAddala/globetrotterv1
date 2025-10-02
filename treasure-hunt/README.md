
# GlobeTrotter v2 (React)

This is a React port of the original GlobeTrotter project. All core logic and UI are preserved, but the code is now organized as a React app. All libraries (Three.js, OrbitControls, MapLibre GL, Anime.js) are loaded globally via CDN in `index.html`.

## How to Run

1. Make sure you have Node.js and npm installed.
2. In this folder, run:

```powershell
npm install
npm run dev
```

3. Open the local URL shown in the terminal.

## Features
- Interactive 3D globe (Three.js)
- Random treasure selection (India, International, Jackpot, or random land)
- Animated globe spin and vortex effect
- Map view with marker for found treasure
- Responsive UI

## Notes
- All external JS libraries are loaded via CDN in `index.html` for simplicity.
- If you want to use npm packages for these libraries, you can refactor imports accordingly.
