# Modern Football Stats

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-19.0.0-61DAFB.svg?style=flat&logo=react)
![Tailwind CSS](https://img.shields.io/badge/tailwindcss-4.0.0-38B2AC.svg?style=flat&logo=tailwind-css)
![Vite](https://img.shields.io/badge/vite-7.3.1-646CFF.svg?style=flat&logo=vite)
![Framer Motion](https://img.shields.io/badge/framer--motion-12.33.0-0055FF.svg?style=flat&logo=framer)

## Problem
Old football statistics viewers were often built on legacy, plain JavaScript stacks that resulted in slow performance, difficult maintenance, and dated user interfaces. Users struggled with non-responsive designs and clunky interactions when trying to find simple match data.

## Solution
This project modernizes the football statistics experience by rebuilding the entire application with a cutting-edge **React 19** and **Vite** stack. It introduces the "Night Captain" design system—a premium, OLED-optimized dark theme with glassmorphism effects and smooth **Framer Motion** animations. The result is a lightning-fast, highly responsive, and visually stunning application for browsing Finnish football data.

## Architecture

### Core Stack
*   **Framework**: [React 19](https://react.dev/) (Latest features, improved rendering)
*   **Build Tool**: [Vite 6+](https://vitejs.dev/) (Instant server start, optimized builds)
*   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) (Utility-first, zero-runtime CSS)
*   **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict typing for reliability)
*   **Animation**: [Framer Motion](https://www.framer.com/motion/) (Production-ready declarative animations)
*   **Icons**: [Lucide React](https://lucide.dev/) (Consistent, clean SVG icons)

### Key Components
*   `src/services/api.ts`: Typed data fetching layer with rate limiting and error handling for the SPL API.
*   `src/hooks/useMatchData.ts`: Custom hook orchestrating data fetching, processing, and state management.
*   `src/utils/dataProcessors.ts`: Pure functions for transforming raw API responses into UI-ready statistics (e.g., aggregating season stats).
*   `src/components/*`: Reusable, accessible UI components implementing the "Night Captain" design system.

## Quick Start

### Prerequisites
*   Node.js 20+
*   npm 10+

### Installation

```bash
# Clone the repository
git clone https://github.com/traali/football-stats.git
cd football-stats

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`.

### Building for Production

```bash
npm run build
```

This compiles the TypeScript code and bundles the application into the `dist` directory, ready for deployment.

## Attribution
Built by [Antigravity](https://google.deepmind.com/) for a modern football experience.
Data provided by [Suomen Palloliitto](https://www.palloliitto.fi/).
