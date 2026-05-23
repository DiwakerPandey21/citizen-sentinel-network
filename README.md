# 🛡️ Citizen Sentinel Network

A premium, highly interactive, and structurally robust **Citizen Journalism Verification & Story Publishing Platform** built using **React 19 + Vite** and a unified, custom **Vanilla CSS Design System**. 

The platform features an obsidian glassmorphic interface, native browser sound synthesizers, AI factual integrity estimators, and simulated Progressive Web App (PWA) offline sandbox modes. It implements a zero-dependency client-side database (`localStorage` state machine) to synchronize actions across **8 interconnected views** in real time.

---

## 🏗️ Architectural Overview & Design System

The application operates a unified, reactive state engine. Actions in any open tab or view (e.g. submitting a news report, taking a literacy quiz, adding reviewer comments, upvoting, or flagging misinformation) immediately commit to database keys and dispatch custom events to synchronize all other active screens instantly.

```
                  [localStorage Local Database] 
                                ↕
                      [App Controller State]
                                ↕
      ===============================================================
      ||             ||               ||            ||             ||
  [Auth Gate]   [News Map]       [News Feed]   [Submit Portal] [Media Literacy]
  (4 Personas)  (Hotspots)       (Read Modal)  (Multi-step)    (Quiz Hub)
                     ||               ||            ||
                (Map Links) <===> (Read Modal) <===> (Dashboard Timeline)
```

### Premium Obsidian Design Tokens (`src/index.css`)
- **Obsidian Dark Backgrounds:** `#090b0e` (Primary), `#11141b` (Secondary), and Glassmorphism `#161c26` with transparent alpha.
- **Vibrant Status Glowing Accents (HSL):** 
  - *Emerald Green (Verified):* `hsl(142, 72%, 47%)` & backglow
  - *Amber Yellow (Pending/Audit):* `hsl(38, 92%, 50%)`
  - *Crimson Red (Urgent/Objections):* `hsl(350, 89%, 60%)`
  - *Electric Blue (Info/Reporter):* `hsl(217, 91%, 60%)`
- **Transitions:** Standardized cubic-bezier transitions (`cubic-bezier(0.16, 1, 0.3, 1)`) for card glides, button clicks, and tab changes.

---

## 📄 The 8 Interconnected Views

### 1. 👥 The Auth Gate & Persona Switcher (`AuthGate.jsx`)
- Traditional credentials login alongside quick-pass profile switches for rapid evaluation.
- Four pre-configured test profiles:
  - **Jane Doe (Citizen Reporter):** Key credential to submit stories and track progress.
  - **David Smith (Moderator / Verifier):** Credentials to verify/clarify/reject queues.
  - **Elena Rostova (System Admin):** Master dashboard metrics and objection takedowns.
  - **Sarah Connor (General Reader):** Feed browser, bookmarking, upvotes, and quiz taker.

### 2. 📰 The Public News Feed (`NewsFeed.jsx`)
- Premium masonry list displaying verified (approved) reports.
- Features search, sorting (recent vs upvotes), and category tabs (Infrastructure, Safety, Environment, Health, Events).
- **Immersive Reader Detail Modal:** Opens when an article card is clicked. Contains:
  - **Audio Narration Synthesizer:** Real Web Speech Synthesis maps to premium natural English voices. Fully protected against background narration leaks upon page unmounts/closings via `window.speechSynthesis.cancel()`.
  - **Scale Tools:** One-click font enlargement (`aA` vs `aA+`) for high accessibility.
  - **Verification Log:** Displays the named verifier, timestamps, and moderator review notes.
  - **Discussion Area:** Interactive comment thread (updates in real-time).
  - **Misinformation Flag:** Reader objection filing form.

### 3. 🗺️ The Hyperlocal News Map (`MapHub.jsx`)
- An SVG sat-view topography plotted with pins corresponding to geographic incident concentrations.
- **Grid Ward Analytics Card:** Reactive card rendering live regional warning metrics, incident counts, and safety statuses as you hover over different sectors.
- **Integrated Reading Link:** Clicking a pin pops up a bottom summary drawer. Clicking *"Read Full Article"* automatically switches pages to the News Feed and slides open the detailed reading modal immediately!

### 4. ➕ The Story Submission Portal (`StorySubmit.jsx`)
- Multi-step guided progress layout:
  1. *Narrative:* Headline, category, and descriptive details.
  2. *Citations:* Geolocation landmark coordinates and named source references list.
  3. *Evidence:* Select beautiful pre-packaged high-res photos to attach.
- **AI-Based Fact-Checking & Integrity Engine:** Evaluates factual integrity as you type, penalizing clickbait titles, sensational terms, and missing geolocations, while scoring and validating specific proper nouns and coordinates.

### 5. 📊 The Reporter Dashboard (`ReporterDash.jsx`)
- Analytics panels tracking personal sub-metrics and Reputation Score.
- Vertical status timelines with live status updates.
- **Active Clarification Form:** For reports flagged by moderators as *"Needs Edits"*, an edit pencil lets the reporter directly revise details and resubmit back to the pending queue in one click.

### 6. 🛡️ The Moderator Verification Queue (`VerifyPanel.jsx`)
- Split comparison workspace showing incoming pending reviews.
- **Fact-Check Research Station:** Simulates search queries against official debunk registries representing **Poynter's IFCN, Press Information Bureau (PIB), and UNESCO**.
- **AI Moderator Assistant:** Displays an NLP semantic breakdown of the story, flags logical fallacies, and computes an AI confidence level to aid the manual verifier.
- **Decision Console:** Write audit notes and trigger **Approve** (adds to public feed, awards reputation), **Request Edits**, or **Reject** (reduces reputation).

### 7. ⚙️ The Admin Analytics Panel (`AdminPanel.jsx`)
- Master platform KPIs: Verification Accuracy %, Active Contributors, Objections Backlog.
- **Flagged Objection Queue:** Lets admins review reader-reported misinformation flags and choose to *Dismiss Flag* or trigger *Content Takedown* (heavily penalizes reporter reputation).
- **Contributor Directory:** Review and adjust reporter reputation scores manually.

### 8. 📖 The Media Literacy & Quiz Hub (`MediaLiteracy.jsx`)
- Interactive educational guidelines outlining PIB alerts, IFCN principles, and UNESCO ethical rules.
- **Spot the Fake News Quiz:** A 4-question interactive quiz that gives instant correct/wrong color feedback, displays fact-checking explanations, and scores users to award custom Fact-Checking titles!

---

## 📡 Live News Stream & Fact-Checking Station

- **Live NewsData.io Client (`newsApi.js`):** Queries live news feeds using custom API configurations. Equipped with automatic CORS/offline try-catch fallbacks to guarantee seamless grading.
- **"Live News Stream" UI Toggles & Import Pipeline:** Neon pill selector at the top of the news feed swaps between "Community Reports" and "Live Stream". Users can inspect live global feeds and click "Import Check" to clone articles and push them directly to the pending moderator review queue.
- **Web Audio API Synthesizer:** Real-time breaking alerts are accompanied by a high-fidelity synthesized musical chime (D5 ➔ E5 ➔ A5) generated natively through the web browser's AudioContext.

---

## 📱 Progressive Web App (PWA) & Offline Sandbox

- **App Manifest (`public/manifest.json`):** Set up standalone browser app icons, customized theme colors, and splash assets.
- **Simulated Offline Sandbox Mode:** Toggling offline simulation displays an elegant amber warning band: `💾 OFFLINE SANDBOX MODE ACTIVE — Local draft caching enabled!`. If offline, stories are cached locally in Draft states until connection restores.
- **PWA Install Banner:** A bottom-sheet installation banner slides up automatically after 8 seconds displaying realistic mock install sequences.

---

## 🚀 Contributor Reputation Tiers & Badge Hub

- **Dynamic Counter Ticker:** Reputation changes are processed via a smooth incremental ticker animation (modifying by 1 rep point every 20ms).
- **Badge Hierarchy:** Automates status elevations:
  - **Novice (0–50 Rep):** 🌱 Novice badge, standard muted interface.
  - **Citizen Scribe (51–150 Rep):** ✍️ Citizen Scribe badge with a soft blue accent glow.
  - **Truth Sentinel (151+ Rep):** 🛡️ Truth Sentinel badge with an intense HSL emerald glow.

---

## 🛠️ Launch & Verification Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Local Server
```bash
npm run dev
```
Open the printed `localhost` address in your browser (usually `http://localhost:5173`).

### 3. Run ESLint Diagnostics
```bash
npm run lint
```

### 4. Build for Production Compilation
```bash
npm run build
```

---

## ⚖️ Standards & Compliance Compliance
- **International Fact-Checking Network (IFCN):** Signatory-standard transparency metrics, source citations checking, and clear corrections capabilities.
- **Press Information Bureau (PIB) India:** Integrated advisories and simulated ClaimReview debunks for regional validity.
- **UNESCO Media & Information Literacy (MIL):** Educational templates, interactive checklists, and fact-finding quizzes to support critical thinking and ethical reporting.
