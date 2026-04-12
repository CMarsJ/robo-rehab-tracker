

## Plan: Preserve All BLE Records Without Downsampling

### Problem
The current code downsamples BLE records when they exceed 5,000, losing data from long therapy sessions. You want ALL records preserved.

### Why Not Multiple Columns
Adding `extra_date_2`, `extra_date_3`, etc. as columns would require ~28 columns for a 1-hour session (~140,000 records). This is impractical and inflexible. A much better approach is a **child table** that stores chunks -- same concept, but scalable to any session length.

### Proposed Approach: `session_ble_chunks` Table

A new table where each row holds up to 5,000 BLE records linked to the session:

```text
sessions (existing)              session_ble_chunks (new)
┌──────────┐                     ┌──────────────────────┐
│ id (PK)  │──────1:N──────────▶│ session_id (FK)      │
│ extra_date│ (first 5000)       │ chunk_index (0,1,2..)│
│ ...      │                     │ data (jsonb)         │
└──────────┘                     └──────────────────────┘
```

- `extra_date` keeps the first 5,000 records (backward compatible)
- Overflow goes into `session_ble_chunks` rows, each holding up to 5,000 records
- 1-hour session = ~28 chunks = 28 rows in the child table

### Steps

1. **Create migration** -- new `session_ble_chunks` table with columns: `id`, `session_id` (FK to sessions), `chunk_index` (integer), `data` (jsonb), `created_at`. Add RLS policy so users can only access their own session chunks. Unique constraint on `(session_id, chunk_index)`.

2. **Update `sessionService.ts`** -- remove downsampling logic. In `updateSessionWithTherapyData`:
   - Split `extra_date` array into chunks of 5,000
   - First chunk goes into `sessions.extra_date` (keeps backward compat)
   - Remaining chunks are inserted as rows in `session_ble_chunks`
   - Retry/fallback logic stays the same

3. **Update `getUserSessions` and any code reading `extra_date`** -- add a helper method `getFullExtraDate(sessionId)` that reads `sessions.extra_date` + all chunks from `session_ble_chunks`, ordered by `chunk_index`, and concatenates them into one array.

4. **Update TypeScript types** -- add `session_ble_chunks` to `types.ts` (auto-generated after migration).

5. **Fix `mqttService.ts` build error** -- the `mqtt` module import is broken; will stub or remove it to fix the build.

### Technical Details

**Migration SQL:**
```sql
CREATE TABLE public.session_ble_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  data jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, chunk_index)
);

ALTER TABLE public.session_ble_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own session chunks"
  ON public.session_ble_chunks FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.sessions WHERE id = session_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can view their own session chunks"
  ON public.session_ble_chunks FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.sessions WHERE id = session_id AND user_id = auth.uid())
  );
```

**Chunk save logic (pseudocode):**
```typescript
const CHUNK_SIZE = 5000;
const chunks = splitArray(extraDate, CHUNK_SIZE);
// chunks[0] → sessions.extra_date
// chunks[1..N] → session_ble_chunks rows
```

This preserves every single BLE record for sessions of any length without schema bloat.

