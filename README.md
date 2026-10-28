# Autonomous AI Agent V4 (React + TypeScript)

A full-stack bilingual (Mongolian / English) Autonomous AI Agent and Engineering Studio rewritten from the Python `ai-engineer-course` repository into a modern React SPA with an Express full-stack API, Tailwind CSS, and `@google/genai` integration.

## Key Features & Business Logic Ported

1. **Bilingual Mongolian/English Interface**:
   - Automatic language detection (`detectLanguage`) detecting Cyrillic (`mn`) vs Latin (`en`).
   - Explicit commands and toggles (`/lang mn`, `/lang en`, `/lang auto`).
   - Bilingual system instructions ensuring appropriate responses and tone.

2. **Safe Mathematical Calculator**:
   - Zero `eval()` safe AST recursive descent tokenizer & parser.
   - Computes arithmetic locally (`1250 * 24 + 3600 = 33,600`) without unnecessary API calls.
   - Returns strict verification status: `PASS` for verified local arithmetic computations.
   - Non-arithmetic inputs (e.g. "Make a 7 day plan with 60 minutes each day") are correctly handled by the AI agent rather than misclassified as calculation.

3. **Grounded Knowledge Base (knowledge/)**:
   - Reads real `.txt` and `.md` documents directly from `knowledge/` (e.g. `ai_engineering_notes.txt`).
   - Safe path resolution preventing directory traversal attacks (`../` is strictly blocked).
   - Injects actual document excerpts into reasoning prompts for faithful summarization and Q&A.
   - Built-in Knowledge Base viewer and note editor.

4. **Multi-Agent 3-Role Workflow**:
   - Optional Planner -> Executor -> Verifier multi-step workflow.
   - Role 1 (Planner): Generates actionable steps and identifies risks.
   - Role 2 (Executor): Executes task text reasoning following the plan.
   - Role 3 (Verifier): Audits draft for unsupported claims or test gaps, generating final answer.

5. **Dual Memory Management**:
   - **V4 Conversation History**: Dedicated store with explicit opt-in confirmation per turn to maintain strict boundaries.
   - **AI Assistant Key-Value Memory**: `/санах <key> <val>`, `/ой`, `/мартах <key>` storage.

6. **Verified Markdown Reports Generator**:
   - Explicit user consent to generate reports in `reports/` (`agent_v4_report_YYYYMMDD_HHMMSS.md`).
   - Standardized format with Timestamp, Model/Tool, Status (`PASS`, `NEEDS_REVIEW`, `FAIL`), User Request, and Result.
   - View, copy, and download reports from the interactive UI.

7. **Automated Acceptance & Diagnostics Suite**:
   - Interactive runner executing all 7 acceptance checks from the specification.
   - Real-time diagnostic cards for API key, model status, files, memory records, and uptime.

## Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React
- **Backend & Middleware**: Express, tsx, Node.js, Vite Dev Server
- **AI Engine**: `@google/genai` (`gemini-3.8-flash` with `gemini-3.1-flash-lite` fallback)

## Running the Application
```bash
npm install
npm run dev
```
Dev server listens on port 3000 (`http://0.0.0.0:3000`).
