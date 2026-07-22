# AI-Assisted Workflow Disclosure

This document discloses the cooperation between the engineer and the AI assistant (Antigravity) in completing the take-home challenge.

### 1. AI Tools Used & Rationale
* **Antigravity IDE Agent (Gemini 3.5 Flash):** Selected for its native pair-programming capabilities, active file manipulation, and automated browser testing integration.

### 2. AI-Generated vs. Human-Corrected Code
* **AI-Generated:** Playwright initial config structure, basic specification page object definitions, SQL relational validation schema drafts, and `.gitignore` file.
* **Human-Corrected & Rewritten:** 
  * The response waiting strategy: Rewrote the generated static timers into a dynamic polling text-stabilization utility.
  * Selector logic: Corrected the send button selector from `.last()` (which matched hidden cookie notice buttons) to `div.flex.gap-2 button`.
  * Initial Chat State: Corrected the pre-login initial message count assertion from `1` to `0` after inspecting DOM differences post-cookie-dismissal.

### 3. AI Hallucinations & Mistakes Caught
* The AI initially assumed that the chat container would start with a greeting bubble ("Hello! How can I help you today?") and assert on a count of 1. During execution, we verified that the landing page actually loads empty (0 bubbles) and only the suggested topics grid is visible. The initial greeting bubble is only rendered as the agent's response to an initial query.

### 4. Deliberately Built by Hand
* **UX Priority Rationale:** Curated the prioritization ranking in the UX review. AI tends to prioritize aesthetic nits (like spacing), whereas the engineer prioritized the critical Axios 500 sign-up defect which blocks the entire user onboarding funnel.
