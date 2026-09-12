# ⚔️ Life RPG — Turn Real Life into an Epic Game

> **Production-Quality, Fully Functional Full-Stack Web Application built for the TZPSv2 Hackathon Specification.**

Turn mundane real-life tasks into an engaging, non-linear RPG progression system with persistent database storage, server-authoritative progression, and gamified mechanics.

---

## 🌟 Features & 6 Concrete Core Systems (TZPSv2 Compliance)

### 1. User Authentication & Security (Concrete System #1)
- **Secure Signup & Login**: Passwords hashed with `bcryptjs` (salt rounds: 10).
- **Session Management**: Cryptographically signed JSON Web Tokens (JWT) stored in secure, `httpOnly`, `SameSite=Lax` cookies.
- **Strict Authorization**: Server-side middleware verifies user ownership on every single query (`WHERE user_id = ?`). Client user IDs are never trusted.
- **One-Click Instant Demo**: Instant guest adventurer creation for frictionless evaluation.

### 2. Real Persistent Database & Full CRUD (Concrete System #2)
- **ACID Database Persistence**: Powered by SQLite via Node.js built-in `node:sqlite` engine (`server/data/liferpg.db`).
- **Complete Quest Lifecycle**:
  - Create quest with category, difficulty, priority, due date.
  - Read quests with multi-dimensional filtering (Status, Category, Difficulty, Search).
  - Update active quests.
  - Delete/abandon quests.
  - Vanquish/complete quests with atomic reward disbursement.
- **Full Refresh & Logout Survival**: All character progress, inventory, streaks, and quests survive browser reloads and session logout.

### 3. Server-Authoritative RPG Progression Engine (Concrete System #3)
- **Non-Linear Leveling Curve**:
  $$\text{Required XP to level up} = \lfloor 100 \times \text{Level}^{1.6} \rfloor$$
  Each subsequent level strictly requires more XP than the previous level (Level 1 $\to$ 2: 100 XP, Level 2 $\to$ 3: 303 XP, Level 3 $\to$ 4: 580 XP, etc.).
- **Automatic Rollover**: Handles single and multi-level ups with accurate excess XP carry-over.
- **Anti-Cheat Atomic Protection**: Completed quests are updated in a database transaction with `is_completed = 0` checks, permanently preventing duplicate XP exploits.

### 4. Daily Streak Tracking Engine (Concrete System #4)
- **Consecutive Day Tracking**: Automatically detects activity timestamps (UTC ISO dates).
- **Streak Continuity**: Increments streak on consecutive days, preserves longest streak records, and resets to 1 if one or more days are missed.
- **Visual Flame Indicator**: Glowing animated HUD flame chip displaying current active streak.

### 5. 6 Character Attribute Pillars (Concrete System #5)
Real-life task categories directly map to core RPG attributes:
- 🧠 **Knowledge** (Coding, Study, Reading) $\to$ **INTELLECT**
- 🏋️ **Fitness** (Workouts, Health, Nutrition) $\to$ **STRENGTH**
- 🧘 **Mindfulness** (Meditation, Habits, Sleep) $\to$ **DISCIPLINE**
- 🎨 **Creativity** (Writing, Design, Music) $\to$ **CREATIVITY**
- 🤝 **Social** (Community, Networking, Family) $\to$ **CHARISMA**
- 🏃 **Vitality** (Chores, Organization, Admin) $\to$ **ENDURANCE**

Each attribute levels up independently (every 50 Attribute Points $\to$ +1 Attribute Level) with dedicated progress bars in the **Hero Dossier**.

### 6. Economy & Reward Emporium (Concrete System #6)
- **Gold Treasury**: Earn Gold coins by completing quests (scaled by difficulty: Trivial: 5G, Easy: 10G, Medium: 25G, Hard: 55G, Epic: 120G).
- **Shop Catalog**:
  - **Themes**: *Obsidian Forge*, *Cyberpunk Neon*, *Solarized Guild*, *Emerald Glade*, *Vaporwave Synth*.
  - **Hero Titles**: *Novice Adventurer*, *Code Wizard*, *Iron Will*, *Mindful Monk*, *Mythic Grandmaster*.
  - **Honor Badges**: *Genesis Hero*, *Dragon Slayer*, *Streak Sentinel*, *Grand Alchemist*.
- **Strict Balance Enforcement**: Atomic database transaction checks `gold >= cost`, deducts currency, registers ownership in `user_inventory`, and rejects overspending with HTTP 400.
- **Instant Equipping**: Equipping themes immediately recolors the entire web app via CSS custom properties.

---

## 🎨 Design Aesthetics & Tactile UX

- **Responsive**: Mobile-first responsive layout with collapsible navigation and touch-friendly controls.
- **Accessible (WCAG AA)**: Semantic HTML5 elements (`<header>`, `<main>`, `<article>`, `<section>`), visible `:focus-visible` outlines, high-contrast text, full keyboard navigation (Tab/Enter/Space).
- **Web Audio 8-Bit Synthesizer**: Native Web Audio API audio chimes for clicks, coins, quest completion, and equip sounds (toggleable mute state).
- **Visual Feedback**:
  - Floating numbers (`+65 XP`, `+25 Gold`, `+12 Intellect`) animating upward on quest completion.
  - Confetti particle explosion via `canvas-confetti` upon Level Up.
  - Shimmering XP progress bar.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Lucide React, Canvas Confetti |
| **Styling** | Vanilla CSS Design System with CSS Tokens & Themes |
| **Audio Engine** | Web Audio API (zero external audio files) |
| **Backend** | Node.js, Express (ES Modules) |
| **Database** | Persistent SQLite (via native `node:sqlite` engine) |
| **Auth** | JWT, httpOnly Secure Cookies, bcryptjs |
| **Testing** | Node.js native test runner (`node:test`, `node:assert`) |

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js `v20+` or `v22+` / `v26+`
- npm `v10+`

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd "IIT BHUBANEWAR"

# Install all workspace dependencies (root, server, client)
npm run install:all
```

### 2. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default configuration works out-of-the-box for local development.

### 3. Run Development Servers
In two terminal tabs (or concurrently):
```bash
# Terminal 1: Backend Server (runs on http://localhost:4000)
npm run dev:server

# Terminal 2: Frontend Vite Client (runs on http://localhost:5173)
npm run dev:client
```
Visit `http://localhost:5173` in your browser.

### 4. Run Production Build & Unified Server
```bash
# Build client static assets into client/dist
npm run build

# Start production Express server (serves both API and UI on http://localhost:4000)
npm start
```
Open `http://localhost:4000` in your browser.

---

## 🧪 Automated Testing

Run the full automated test suite covering the RPG progression engine, streak calculation, anti-cheat mechanisms, and complete end-to-end integration:

```bash
npm run test:server
```

Test coverage includes:
- ✅ Non-linear level progression curve validation
- ✅ Single & multi-level XP overflow calculations
- ✅ Streak increment and missed-day reset behavior
- ✅ Full user signup & session cookie validation
- ✅ Quest CRUD and atomic completion
- ✅ Prevention of duplicate XP exploitation
- ✅ Shop inventory, affordability checks, and theme/title equipping
- ✅ Data persistence across browser reloads

---

## 📁 Repository Structure

```
.
├── .env.example              # Environment variable template
├── .gitignore                # Git ignore configuration
├── package.json              # Root orchestration package
├── client/                   # React 18 + Vite TypeScript frontend
│   ├── index.html            # Entry HTML with typography & SEO
│   ├── src/
│   │   ├── components/       # Header, QuestCard, QuestModal, ShopModal, etc.
│   │   ├── context/          # AuthContext with theme syncing
│   │   ├── services/         # Typed API client
│   │   ├── styles/           # CSS themes (Obsidian, Cyberpunk, Solarized, etc.)
│   │   ├── types/            # Domain TypeScript interfaces
│   │   ├── utils/            # Web Audio sound engine
│   │   ├── App.tsx           # Main application board & controls
│   │   ├── index.css         # Global design tokens and animations
│   │   └── main.tsx          # React application root
│   └── vite.config.ts        # Vite config with API proxy
└── server/                   # Node.js Express backend
    ├── data/                 # SQLite database storage (liferpg.db)
    ├── src/
    │   ├── db/               # SQLite connection & schema initialization
    │   ├── middleware/       # Auth JWT middleware
    │   ├── routes/           # Auth, Quests, Character, Shop routes
    │   ├── utils/            # Non-linear RPG engine math & streaks
    │   ├── config.js         # Server configuration
    │   └── index.js          # Express app entry point
    └── test/                 # Test suites (unit + E2E integration)
```

---

## 🏆 Submission Statement (TZPSv2)

This project strictly adheres to all TZPSv2 hackathon requirements:
- **No Mock/Placeholder Data**: Every operation commits directly to SQLite with ACID guarantees.
- **Full Security Barrier**: Authorization middleware checks user ID on all queries.
- **Polished Presentation**: Distinct RPG aesthetics, animations, and sound design ready for competitive hackathon presentation.
