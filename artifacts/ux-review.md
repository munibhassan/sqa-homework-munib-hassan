# UX Audit Report: Desktop & Mobile Exploration

This audit compares the pre-login landing experience against the post-signup interface across desktop and emulated mobile (Pixel 5, 375x812) viewports.

## Core Differences & Findings
* **Layout Structure:** On desktop post-signup, the chat space is flanked by a sticky left navigation sidebar and a right referral panel. On mobile, the sidebar collapses into a top-left hamburger drawer, and the referral panel is hidden to maintain a single-column layout.
* **Onboarding Chat State:** Pre-login displays a suggested topics grid with an empty history. Post-signup displays an active, immediate agent greeting bubble ("Hello! How can I help you today?...").
* **Functional Friction:** A severe API defect exists where the registration form throws a `500 AxiosError` on submit, but silently commits the record.

---

## Prioritized Improvements

### 1. Fix the 500 Sign-Up Form Defect [Priority: Critical]
* **Observation:** Submitting registration throws a `500 Internal Server Error` on the frontend, leaving the user stuck on the form. However, the record is successfully created in the database, allowing subsequent manual login.
* **Impact:** High user churn. Users assume sign-up failed, attempt to re-register, face "Email already in use" errors, and abandon the product.
* **Proposed Change:** Correct the registration API response logic. Ensure a successful status is returned, triggering automatic login and dashboard redirection.

### 2. Persist Guest Conversation Post-Signup [Priority: High]
* **Observation:** Any query sent pre-login is cleared and lost upon signing up/logging in.
* **Impact:** Disrupts user flow. Users who ask questions pre-login must re-type them once authenticated, increasing friction.
* **Proposed Change:** Cache pre-login chat sessions in local storage and merge them with the user’s database history upon successful signup redirection.

### 3. Expose Referral Panel on Mobile [Priority: Medium]
* **Observation:** The referral link panel is entirely hidden on mobile viewports.
* **Impact:** Limits organic user growth. Mobile users cannot access their referral link or invite friends.
* **Proposed Change:** Move the referral banner/link inside the mobile hamburger menu drawer or add a collapsible "Refer & Earn" widget at the top of the chat area.
