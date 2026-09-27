# VeritasAI: Analyst & Auditor Research Engine
> **Problem 3 — Take-Home Assignment Implementation**  
> Autonomous dual-agent research and independent verification system with persistent entity memory, live source retrieval, contradiction resolution, and iterative claim auditing.

---

## ⚡ Quick Start (< 5 Minutes)

### 1. Requirements
- Node.js 18+ (Node 20+ recommended)
- Optional: Python 3.10+ (if testing the auxiliary FastAPI backend)

### 2. Environment Variables
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```
Ensure your Gemini API key is configured:
```env
GEMINI_API_KEY="your-gemini-api-key"
# Optional overrides:
GEMINI_MODEL="gemini-3.8-flash"
PORT=3000
```

### 3. Installation
```bash
npm install
```

### 4. Start the Application
Run the unified full-stack application (Express API + Vite React UI on port 3000):
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🧠 Architecture Overview

VeritasAI implements genuine multi-agent orchestration rather than a single LLM call:

```
[User Question]
       │
       ▼
┌──────────────────┐
│   Planner Agent  │ ── Decomposes question, targets entities & sub-queries
└──────────────────┘
       │
       ├─────────────────────────┐
       ▼                         ▼
┌──────────────────┐     ┌──────────────────┐
│ Persistent Memory│     │ Parallel Search  │ ── Dispatches concurrent searches
│  Entity Store    │     │  & Page Fetcher  │ ── Extracts raw HTML & meta dates
└──────────────────┘     └──────────────────┘
       │                         │
       └───────────┬─────────────┘
                   ▼
┌──────────────────────────────────────┐
│  Evidence Extractor & Contradiction  │ ── Verbatim quotes, quality scores,
│           Detection Engine           │    flags numerical/temporal conflicts
└──────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│            Analyst Agent             │ ── Drafts cited synthesis [S1], [S2]
└──────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│      Claim Decomposition Unit        │ ── Isolates atomic factual claims
└──────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│      Independent Auditor Agent       │ ── Inspects RAW sources independently;
│  (Hostile, Never Trusts Analyst)     │    verdicts: SUPPORTED, UNSUPPORTED,
└──────────────────────────────────────┘    CONTRADICTED, UNCITED
                   │
         [Audit Passed?]
          /           \
      (YES)           (NO: Revision Loop)
        │                       │
        ▼                       ▼
┌──────────────────┐   ┌────────────────────────────────┐
│ Memory Ingestion │   │ Targeted Delta Web Search      │
│  & Final Report  │   │ & Analyst Auto-Correction      │
└──────────────────┘   └────────────────────────────────┘
```

---

## 🔬 Core Features & Compliance

1. **Independent Auditor Agent**: Never blindly trusts the Analyst. Opens and inspects the raw source text directly to verify textual entailment.
2. **CLAIM → EVIDENCE → SOURCE Lineage**: Every claim connects to one or more verbatim evidence excerpts, which connect to primary/secondary sources with domain quality scores (0–100).
3. **Contradiction Detection & Resolution**: If two credible sources disagree (e.g., Warby Parker 118 vs 125 stores), the system does not silently pick one; it investigates reporting periods (Q3 vs year-end) and corporate vs total footprint definitions.
4. **Cross-Session Persistent Memory**: Stores structured entities (`OpenAI`, `Stripe`, `Khosla Ventures`, etc.), facts, relationships, and audit statuses on disk (`data/research_memory.json`).
5. **Parallel Asynchronous Retrieval**: Searches and fetches web pages concurrently via `Promise.all` with timeout resilience, measuring parallel speedup (typically 2.2x–3.8x faster).
6. **Telemetry & Rupee Cost Tracking**: Tracks input tokens, output tokens, latencies per phase, and converts costs directly into Indian Rupees (**₹86.5 / USD**).
7. **8-Question Benchmark Suite**: Runs 8 progressively difficult test scenarios, including deliberate entity memory reuse from Q6 to Q7.
8. **Adversarial Experiment**: Proves behavioral shift when the Analyst is aware of an adversarial Auditor vs unaware (eliminates hallucinated citations, increases citation density).

---

## 🧪 Running the Benchmark & Experiments

### From the Web UI
1. Navigate to **Research Studio** to run custom queries or preset questions.
2. Click **8-Question Benchmark** in the top navigation to execute the full evaluation suite.
3. Click **Adversarial & Resilience** to run the side-by-side comparison and 5 failure injection tests.

### Running Unit Tests via CLI
```bash
npx tsx tests/orchestration.test.ts
```

### Auxiliary Python / FastAPI Backend
If you want to inspect or run the Python backend separately:
```bash
pip install -r backend/requirements.txt
uvicorn backend.main:app --port 8000 --reload
pytest backend/test_orchestration.py
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/research` | Submit research question with mode (`standard`, `adversarial_unaware`, `adversarial_audited`) |
| `GET` | `/api/research/:id` | Retrieve full research session |
| `GET` | `/api/research/:id/trace` | Retrieve step-by-step trace events with durations |
| `GET` | `/api/research/:id/sources` | Retrieve fetched sources with quality ratings |
| `GET` | `/api/research/:id/claims` | Retrieve extracted claims and auditor verdicts |
| `GET` | `/api/research/:id/audit` | Retrieve auditor summary and revision history |
| `GET` | `/api/research/:id/memory` | Retrieve entity memory hits for session |
| `GET` | `/api/research/:id/metrics` | Retrieve tokens, ₹ INR costs, and latency waterfall |
| `GET` | `/api/memory` | List all stored persistent entities |
| `POST` | `/api/memory/reset` | Reset persistent entity memory to baseline seed |
| `POST` | `/api/evaluation/run` | Execute the 8-question benchmark suite |
| `POST` | `/api/adversarial/run` | Execute the dual-condition adversarial experiment |
| `POST` | `/api/resilience/run` | Execute the 5 failure-injection test scenarios |
