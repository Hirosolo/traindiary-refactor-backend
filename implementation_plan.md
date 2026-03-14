# System Performance Optimization Plan

This plan aims to improve the performance and responsiveness of both the backend and mobile/frontend applications by optimizing data access, reducing network overhead, and improving state management.

## Proposed Changes

### Backend (traindiary-refactor-backend)

#### [MODIFY] schema.sql
- **Indices Optimization**:
    - Add `CREATE INDEX idx_workout_sessions_user_id_date ON public.workout_sessions (user_id, scheduled_date);` (Speeds up fetching user's daily workout summaries)
    - Add `CREATE INDEX idx_user_meals_user_id_date ON public.user_meals (user_id, log_date);` (Speeds up fetching daily nutrition data for the dashboard)
    - Add `CREATE INDEX idx_user_metrics_user_id_date ON public.user_metrics (user_id, recorded_at);` (Optimizes queries retrieving weight and body metrics time series)
    - Add `CREATE INDEX idx_personal_records_user_id ON public.personal_records (user_id);` (Improves lookups for user's PRs without full table scans)
    - Add `CREATE INDEX idx_session_details_session_id ON public.session_details (session_id);` (Accelerates joining exercises to a specific workout session)
    - Add `CREATE INDEX idx_sessions_exercise_details_session_detail_id ON public.sessions_exercise_details (session_detail_id);` (Accelerates joining sets/reps to a specific exercise in a session)

#### [MODIFY] src/repositories/log.repository.ts
- **Batch Operations**: Implement batch logic for [create](file:///d:/Code/Web/traindiary-refactor-backend/src/repositories/log.repository.ts#326-353) and [update](file:///d:/Code/Web/traindiary-refactor-backend/src/repositories/log.repository.ts#409-437) operations. Replace individual SQL `INSERT`/`UPDATE` statements inside loops with a single bulk query (e.g., `INSERT ... ON CONFLICT` or `UPDATE ... FROM (VALUES ...)`) to drastically reduce database round trips and transaction overhead.
- **Ownership Checks**: Optimize ownership checks by fetching the owner in the same query as the data. Use `JOIN`s or `EXISTS` clauses to securely verify that the user owns the session/log simultaneously while fetching or updating the record, eliminating the need for separate validation queries.

#### [NEW] src/repositories/bulk.repository.ts
- **Centralized Bulk Handling**: Create a centralized repository for handling multi-entity bulk operations. This will provide a generic, reusable interface for bulk upserts of related entities, cleanly wrapping these complex multi-table operations in transactions to ensure data consistency during offline data synchronization.

---

### Frontend (traindiary-new-frontend)

#### [MODIFY] src/lib/api/workouts.ts & nutrition.ts
- **Optimistic Updates**: Implement optimistic updates for common actions (like logging a workout set or meal). This immediately updates the local UI state before the server responds, providing instant perceived feedback to the user, with fallback logic to revert the state if the API request ultimately fails.
- **Update Batching**: Enhance the batching of consecutive updates before sending to the backend. Introduce a debounce or queuing mechanism to collect multiple rapid user inputs (e.g., tweaking reps/weight up and down rapidly) into a single API payload that fires after the user stops interacting for a short duration.
- **Caching Solution**: Consider introducing a robust caching solution (e.g., TanStack Query) to replace manual localStorage management. This provides out-of-the-box features like query deduplication, background refetching (stale-while-revalidate), garbage collection, and simplified cache invalidation logic across the app.

## Verification Plan

### Automated Tests
- Run existing vitest/jest tests if available in either project.
- Backend: Run `npm run lint` and `npm run build` to ensure no syntax or type regressions.
- Frontend: Run `npm run lint` and `npm run build`.

### Manual Verification
- **Network Profiling**: Use Browser DevTools (Network tab) to verify the reduced number of API calls when performing bulk actions or rapid sequential updates.
- **Latency Check**: Verify that optimistic updates provide instant visual feedback in the UI before the network request completes.
- **Query Performance**: Verify that dashboard loading is visibly faster with the newly added database indexes, especially on accounts with large amounts of historical data.
