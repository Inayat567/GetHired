# GetHired 🚀
> **Autonomous Remote Job Discovery & Application Copilot**  
> *Local-first, privacy-respecting, developer-centric agentic job hunter.*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)

---

## ⚡ What is GetHired?

**GetHired** is an open-source copilot that eliminates the repetitive grind of searching, filtering, and writing cold emails for remote developer roles. 

Unlike spammy autofill bots that risk your accounts or trigger Cloudflare bot walls, GetHired:
1. **Scrapes clean public endpoints:** ATS APIs (Greenhouse, Lever), curated remote feeds (RemoteOK, Jobicy, WeWorkRemotely), and informal LinkedIn hiring posts.
2. **Filters deterministically first:** Instantly discards jobs outside your target regions (e.g. EU, UK, Canada, Australia, Worldwide), non-matching employment types, or roles with visa restrictions ("US Citizen Only", "W2 Only").
3. **Applies Semantic Multi-AI Scoring:** Choose between **OpenAI**, **Anthropic Claude**, **Google Gemini**, or **xAI Grok** to evaluate qualified jobs against your CV and generate high-conversion cold pitches.
4. **Local Web Dashboard & CLI:** Review jobs, upload CVs, adjust preferences, and test SMTP directly from your browser (`npm run ui`) or terminal (`npm run triage`).

---

## 🤖 Supported AI Providers & Models

| Provider | Supported & Latest Models |
| :--- | :--- |
| **OpenAI** | `gpt-4o-mini`, `gpt-4o`, `o3-mini`, `gpt-4.5-preview` |
| **Anthropic Claude** | `claude-3-5-sonnet-20241022`, `claude-3-5-haiku-20241022`, `claude-3-opus-20240229` |
| **Google Gemini** | `gemini-2.0-flash`, `gemini-1.5-pro`, `gemini-1.5-flash` |
| **xAI Grok** | `grok-2-latest`, `grok-2-1212`, `grok-beta` |

---

## 🌍 Supported Countries & Preferences

GetHired comes with flexible multi-country and compensation preferences:
* **Target Countries:** Belgium, Netherlands, Germany, Austria, Australia, Bulgaria, Canada, UK, European Union / EMEA, and Worldwide Remote.
* **Employment Types:** Full-time, Contract, Part-time.
* **Compensation Controls:** Set minimum monthly amount or hourly rate in USD (`$`) or EUR (`€`).
* **Timezone Tolerance:** Filter roles by allowable timezone gap (e.g. CET, UTC, EST, etc.).

---

## 🚀 Quickstart Guide

### 1. Clone & Install
```bash
git clone https://github.com/your-username/GetHired.git
cd GetHired
npm install
```

### 2. Launch the Web Dashboard UI
```bash
npm run ui
```
Open **`http://localhost:3000`** in your browser to:
1. Select your AI provider (**OpenAI, Claude, Gemini, Grok**) and enter your API Key.
2. Configure your SMTP outbound email credentials.
3. Drag & drop your `cv.pdf` and customize target countries and salaries.
4. Click **"Search & Evaluate Jobs Now"** to discover and review remote opportunities!

### 3. Setup Your Profile & CV
* Edit `candidate_profile.json` with your real technical achievements, core stack, and target roles.
* Edit `preferences.json` with your desired countries, employment types, and salary targets.
* Drop your ATS-friendly resume at `assets/cv.pdf`.

### 4. Run Discovery & Triage
```bash
# 1. Discover, filter, and score new jobs
npm run discover

# 2. Review matching jobs in interactive CLI triage
npm run triage

# 3. View database statistics
npm run stats
```

---

## 🎮 CLI Commands

| Command | Description |
| :--- | :--- |
| `npm run discover` | Scrapes all channels, runs deterministic filtering, and scores jobs with LLM |
| `npm run triage` | Opens interactive terminal card triage (Send Email, Open URL, Skip) |
| `npm run stats` | Displays summary of discovered, qualified, applied, and skipped jobs |
| `npm run test-smtp` | Verifies your outbound SMTP email credentials |
| `npm run linkedin-login`| Opens browser once to save authenticated session for post scraping |
| `npm test` | Runs deterministic filter unit tests |

---

## 🛡️ Anti-Ban & Privacy Guarantees

* **Zero Hardcoded Credentials:** Operates 100% BYOK (Bring-Your-Own-Key).
* **Local SQLite Storage:** Your search history, application statuses, and logs stay on your computer.
* **Headless Rate Limiting:** Browser-based scrapers include randomized delays and persistent context reuse.

---

## 📄 Documentation

For deep technical specifications and architecture diagrams, check [docs/overview.md](docs/overview.md).

## ⚖️ License

MIT License. Free for developers and contributors worldwide.
