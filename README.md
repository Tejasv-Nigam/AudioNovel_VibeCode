# AudioNovel: Web Novel to Audiobook Engine

> **Note:** This is Version 1 of the application. More features and updates will be coming later!

AudioNovel is a modern, full-stack application that transforms any web novel chapter into a seamless, continuous audiobook. Built with React and Node.js, it bypasses anti-bot protections to scrape chapter text, synthesizes it into high-quality streaming audio using Google TTS, and automatically queues up the next chapter for an uninterrupted listening experience.

## ✨ Features

- **Continuous Listening**: Automatically fetches and plays the "Next Chapter" when the current audio finishes.
- **Smart Extraction Engine**: Powered by Puppeteer and Stealth plugins to bypass Cloudflare and cleanly extract core story text without ads or sidebars.
- **Premium User Interface**: A responsive, dark-mode native Glassmorphism design built purely with Vanilla CSS.
- **Persistent State**: Automatically saves your reading history, bookmarks, and listening statistics to your browser's local storage.
- **Playback Controls**: Adjust playback speed, skip forward/backward 10 seconds, and toggle continuous auto-play mode.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TypeScript, React Router, Lucide Icons, Vanilla CSS.
- **Backend**: Node.js, Express, TypeScript, Zod (validation).
- **Scraper**: Puppeteer, Puppeteer Extra (Stealth Plugin).
- **TTS Engine**: Google TTS API.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### 1. Clone & Install Dependencies

Open your terminal and navigate to the project directory.

**Backend Setup:**
```powershell
cd backend
npm install
```

**Frontend Setup:**
```powershell
cd frontend
npm install
```

### 2. Run the Development Servers

You will need two separate terminal windows to run both servers simultaneously.

> **Windows Users Note:** If you encounter a PowerShell Execution Policy error, simply use `npm.cmd` instead of `npm` to bypass the restriction.

**Terminal 1 (Backend):**
```powershell
cd backend
npm.cmd run dev
```

**Terminal 2 (Frontend):**
```powershell
cd frontend
npm.cmd run dev
```

The React frontend will now be available at `http://localhost:5173`. Paste a web novel URL into the dashboard and click "Start Reading"!

## 🐳 Docker Support (Optional)

You can run the entire application stack using Docker Compose:

```bash
docker-compose up --build
```
This will containerize both the frontend and backend, automatically exposing them on their respective ports.
