# LLM Response Validation Strategy

To validate non-deterministic, streaming AI agent responses at `ask.permission.ai` without introducing flaky test builds, we implement a hybrid validation strategy combining **dynamic text stabilization** with **multi-layered assertions**.

## Dynamic Waiting (Stabilization)
We avoid hardcoded pauses. Instead, we poll the response container (`div.flex.justify-start`) at 800ms intervals, ignoring initial placeholder states (e.g., `"Permission is typing..."`). We only proceed when the text content remains identical across consecutive checks, verified with a secondary 500ms safety check.

## What We Assert
1. **Semantic Relevancy (LLM Evaluation):** If `OPENAI_API_KEY` is present, the prompt and response are piped into **DeepEval's `AnswerRelevancyMetric`** to compute semantic alignment, asserting a score `≥ 0.7`.
2. **Structural Size (Fallback):** We assert the text length exceeds a minimum threshold (`> 50` characters) to verify the response isn't a blank bubble or a tiny crash fragment.
3. **Contextual Token Presence:** We inspect the response for core contextual tokens (e.g., `"permission"`, `"ASK"`, `"wallet"`) relevant to the selected topic.
4. **Server/API Sanitization:** We verify the text contains no operational error indicators (e.g., `"failed to fetch"`, `"rate limit"`, `"something went wrong"`).

## What We Deliberately Do NOT Assert
* **Exact String Equality:** AI outputs vary by temperature and runtime seeds. Asserting on exact phrases leads to high test flakiness.
* **Transient UI States:** We do not assert on transient visual frames during typing animations, as they are highly susceptible to network jitter.

## Why
This approach validates that the agent returns structured, grammatically relevant content while remaining resilient to the inherent non-determinism of streaming LLM outputs in CI environments.
