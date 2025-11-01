![MIT License](https://img.shields.io/badge/License-MIT-green.svg)

# GlobeTrotter

GlobeTrotter is a pirate-themed 3D treasure hunt game built with React and Three.js. This application invites users to spin a globe, discover real-world locations, and find treasure—or a pre-looted chest—all within a three-spin limit.

This project was built as an interactive, gamified web application that leverages several modern web technologies to create a dynamic user experience.

## Features

- **Interactive 3D Globe**: Spin a realistic 3D globe to select a random destination (powered by Three.js).
- **Satellite Map View**: Automatically fly to and zoom in on your destination with a high-resolution satellite map (powered by MapLibre GL JS).
- **Dynamic Treasure System**:
  - Find high-value treasures at World Wonders.
  - Discover the 2000-point jackpot at KL University.
  - Stumble upon humorous "looted" messages at many locations.
- **3-Spin Limit**: Each player gets three spins per game to achieve the highest score.
- **Dynamic Image Fetching**: Treasure cards feature unique images for each location, fetched dynamically from the Pixabay API and cached in the browser's local storage.
- **Polished Animations**: The UI features a vortex transition, staggered card reveals, and a "coin blast" animation on scoring (powered by Anime.js).
- **Local Leaderboard**: High scores are saved to the browser's localStorage to track top captains.
- **Secret Modal**: A hidden modal on the home screen reveals a clue to the jackpot's location.

## Technology Stack

- **Frontend**: React 19
- **Build Tool**: Vite
- **3D Globe**: Three.js
- **2D Map**: MapLibre GL JS
- **Animations**: Anime.js
- **External APIs**:
  - Pixabay API (for location images)
  - MapTiler API (for satellite map tiles)

## Getting Started

Follow these instructions to get a local copy up and running.

### Prerequisites

You must have [Node.js](https://nodejs.org/) (which includes npm) installed on your system.

### Installation

**Clone the Repository**

```bash
git clone https://github.com/MathewAddala/globetrotterv1.git
```

**Navigate to the Project**

```bash
cd globetrotterv1/treasure-hunt
```

**Install Dependencies**

```bash
npm install
```

### Environment Setup

This project requires API keys to function correctly.

**Create an Environment File**

Create a new file in the `treasure-hunt` root directory (the same folder as `package.json`) and name it `.env`.

**Add API Keys**

Open the `.env` file and add your Pixabay API key. You can get a free key from the [Pixabay website](https://pixabay.com/api/docs/).

```
# Get your free API key from pixabay.com
VITE_PIXABAY_API_KEY="YOUR_API_KEY_HERE"
```

**Note**: The MapTiler API key is already included in the source code for this version.

## Running the Application

**Start the Development Server**

```bash
npm run dev
```

This command will start the Vite development server.

**View in Browser**

Open your browser and navigate to the local URL shown in your terminal (usually `http://localhost:5173`).

## Testing on a Local Network

To test the application on other devices (like a mobile phone) on your same network:

1. Ensure your laptop and mobile device are connected to the same Wi-Fi network or mobile hotspot.
2. The `vite.config.js` file is already configured with `host: true` to allow network access.
3. When you run `npm run dev`, the terminal will display a "Network" URL (e.g., `http://192.168.1.10:5173`).
4. Open this Network URL on your mobile device's browser to play the game.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

---

### MIT License

Copyright (c) 2025 Mathew Addala

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
