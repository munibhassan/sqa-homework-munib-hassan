# Data-Layer Reasoning & Consistency Checks

Based on the observed ask.permission.ai flow, we infer a relational database structure designed to log chat operations and user signups.

## Inferred Database Schema

### `users` Table
* `id` (UUID, PK) - Unique identifier for registered users.
* `email` (VARCHAR, UNIQUE) - User's email address.
* `created_at` (TIMESTAMP) - User registration timestamp.
* `status` (VARCHAR) - Account status (e.g., `'active'`, `'pending'`).

### `conversations` Table
* `id` (UUID, PK) - Unique identifier for chat sessions.
* `user_id` (UUID, FK, NULLABLE) - Refers to `users.id`. Null for anonymous guest sessions.
* `created_at` (TIMESTAMP) - Time the chat session started.

### `messages` Table
* `id` (UUID, PK) - Unique identifier for messages.
* `conversation_id` (UUID, FK) - Refers to `conversations.id`.
* `sender_type` (VARCHAR) - Enum: `'user'` or `'agent'`.
* `content` (TEXT) - The message text.
* `created_at` (TIMESTAMP) - Timestamp when the message finished transmitting.
* `latency_ms` (INTEGER) - Round-trip time for agent response generation.

---

## SQL Verification Queries

### 1. Verify Message Writes & Latency Integrity
Confirms that user prompts and agent responses are correctly logged with sane timestamps and response latency.
```sql
SELECT 
    m1.conversation_id,
    m1.created_at AS prompt_time,
    m2.created_at AS response_time,
    m2.latency_ms
FROM messages m1
JOIN messages m2 ON m1.conversation_id = m2.conversation_id
WHERE m1.sender_type = 'user'
  AND m2.sender_type = 'agent'
  AND m2.created_at >= m1.created_at
  AND m2.latency_ms BETWEEN 100 AND 30000;
```

### 2. Audit Orphaned Messages
Identifies messages written to non-existent conversations to ensure referential integrity.
```sql
SELECT m.id, m.conversation_id
FROM messages m
LEFT JOIN conversations c ON m.conversation_id = c.id
WHERE c.id IS NULL;
```

### 3. Verify Session-to-User Association Post-Signup
Checks that guest sessions are correctly merged under the user profile post-registration.
```sql
SELECT c.id AS conversation_id, c.user_id, u.created_at AS user_created, c.created_at AS chat_created
FROM conversations c
JOIN users u ON c.user_id = u.id
WHERE c.created_at < u.created_at; -- Verifies retroactively associated guest conversations
```

---

## Downstream Pipeline Integrity Check
In the analytics data pipeline, we enforce a **Conversational Completeness Constraint**:
* Every guest or user conversation must have a matching 1:1 or 1:N pairing of `user` prompt to `agent` response. 
* *Data Integrity Rule:* If a conversation contains user prompts without any corresponding agent response (latency/timeout failure) or has trailing orphaned prompts, trigger a high-severity alert to identify API connection drops.
