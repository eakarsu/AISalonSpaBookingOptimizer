# Audit Note — AISalonSpaBookingOptimizer

## Original audit recommendations (batch_07.md §23)

**Missing AI endpoints:** `/service-demand-forecast`, `/stylist-workload-balance`, `/commission-optimization`, `/retail-recommend`, `/appointment-conflict-detection`.

**Missing non-AI features:** real-time online booking availability, automatic reminders, loyalty automation, gift-card inventory, supplier reorder, staff absence coverage.

**Custom suggestions:** smart service bundling, stylist skill tagging, dynamic service pricing, client LTV scoring, inventory automation, waitlist fulfillment AI.

## Implemented this pass (3 mechanical)
1. `POST /api/ai/service-demand-forecast` — N-day demand by service with peak/soft periods + staffing/promo recs.
2. `POST /api/ai/stylist-workload-balance` — overloaded vs underutilized + rebalance actions.
3. `POST /api/ai/appointment-conflict-detection` — overbooking / buffer / double-book detection with resolutions.

All three reuse `queryOpenRouter`, `parseAIJson`, `persistAIResult`, `authMiddleware`, `aiRateLimiter`. Syntax-checked.

## Backlog (prioritized)
1. `POST /api/ai/commission-optimization` (mechanical follow-up).
2. `POST /api/ai/retail-recommend` (mechanical — combines `product-recommend` with service context).
3. Online booking availability service (mechanical CRUD).
4. Reminder automation (NEEDS-CREDS — Twilio/SendGrid).
5. Supplier reorder automation (mechanical, NEEDS supplier API decisions).

## Apply pass 3 (frontend)

LEFT-AS-IS. The 7 original endpoints (`/stylist-match`, `/duration-predict`, `/product-recommend`, `/rebook-suggest`, `/waitlist-optimize`, `/rebook-queue`, `/reminder-message`) are exposed via helpers in `client/src/services/api.js` and consumed in feature pages. The 3 endpoints added in apply pass 2 each have a dedicated route + page: `/ai/service-demand-forecast` -> `ServiceDemandForecastPage.js`, `/ai/stylist-workload-balance` -> `StylistWorkloadBalancePage.js`, `/ai/appointment-conflict-detection` -> `AppointmentConflictPage.js`, all registered in `client/src/App.js`. JWT Bearer auth carried by the shared axios api instance. No changes needed.
