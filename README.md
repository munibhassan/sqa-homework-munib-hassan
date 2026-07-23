# Playwright Test Suite — ask.permission.ai

This repository contains the automated QA suite and analytical artifacts for the pre-login experience of the Permission Agent.

## Setup

```bash
# Clone the repository
git clone <repo-url>
cd sqa-homework-munib-hassan

# Install dependencies
npm install

# (Optional) Configure environment keys for LLM evaluations (DeepEval fallbacks to structural checks if empty)
# Create a .env file in the root directory:
# OPENAI_API_KEY=your_openai_api_key_here
# CONFIDENT_API_KEY=your_confident_api_key_here

# Run the test suite on all browsers
npx playwright test

# Open the HTML test report
npx playwright show-report artifacts/report
```

---

## Test Strategy (TL;DR)
* **What is covered:** Suggested topic pill visibility, click-to-stream pill interactions, free-text query submission, keypress controls (Enter/Shift+Enter), responsive mobile viewport layout, and Sign-Up/Log-In page redirections (8 tests total).
* **What is skipped:** Multi-turn post-login message flows and deep wallet transactional states.
* **Why:** Focus is kept on the core pre-login experience to satisfy the maximum 8-test limit, prioritizing wait strategies, responsive viewport scaling, and redirection routes.

---

## Key Decisions
* **Playwright Framework:** Selected for its built-in auto-waiting, native mobile viewport emulation, and fast execution speeds.
* **Custom Polling Stabilization:** Avoided static waits (`page.waitForTimeout`). Created a dynamic text length polling helper (`utils/stabilization.ts`) that asserts on stabilized output stream lengths.
* **Typing Indicator Bypass:** Programmatically ignored initial placeholder states (e.g. `"Permission is typing..."`) during streaming stabilization.
* **Isolated Selectors:** Avoided fragile class matching. Targeted layout-specific wrappers like `div.flex.justify-start` (agent bubbles) and scoped input buttons to `div.flex.gap-2 button`.
* **DeepEval LLM Evaluation:** Integrated Confident AI's `AnswerRelevancyMetric` with a runtime fallback to verify answer semantics if `OPENAI_API_KEY` is present.
* **Graceful Environment Fallback:** Designed tests to gracefully run structural size/sanitization checks when OpenAI credentials are absent, preventing CI pipeline blockages.
* **Cookie Dismissal Workflow:** Resolved landing page blockages by dismissing the OneTrust notice and reloading the page, which triggers correct suggested-topics loading.

---

## AI Disclosure
An AI assistant cooperated in code generation and review. For details, see [ai-workflow.md](file:///C:/Users/Munib/source/repos/sqa-homework-munib-hassan/artifacts/ai-workflow.md).

---

## Next Steps (1–2 Days Horizon)
1. **GitHub Actions CI/CD Integration:** Configure a runner to execute tests on pull requests, gating releases based on test reports.
2. **Visual Regression Testing:** Wire in Playwright screenshot comparison tests to detect pixel changes on mobile viewports.
3. **DeepEval Evals at Scale:** Build a separate regression testing script with a fixed "golden dataset" of prompts to run LLM evaluations in parallel.

---

## Submission Checklist

- [x] Repo named `sqa-homework-munib-hassan` and default branch is `main`
- [x] README includes exact Setup + run commands
- [x] README word count ≤ 500 (excluding commands/checkboxes)
- [x] Max 8 tests; all 4 required behaviors covered
- [x] `artifacts/assertions.md` included (≤ 300 words)
- [x] `artifacts/ux-review.md` included (≤ 400 words)
- [x] `artifacts/data-checks.md` included (≤ 300 words + SQL)
- [x] `artifacts/ai-workflow.md` included (≤ 300 words)
- [x] `artifacts/report/` included
- [x] `artifacts/demo.mp4` included (narrated video, 60–90 seconds)
- [x] Commit history shows how the work evolved
