# Feature Spec: Delegation Transfer (Undelegation) Events

**Status**: Ready for Dev
**Target Component**: Queue-Backend / Indexer

## 1. User Intent
- **As a** DRep
- **I want to** see an event on my timeline when a delegator leaves my DRep to delegate to someone else.
- **So that** I have an accurate historical log of my active delegators and know when someone retracts their delegation.

## 2. Functional Requirements
1. The blockchain only emits a single `VoteDelegation` certificate containing the *new* DRep ID. There is no explicit "Undelegation" certificate.
2. The Rust Indexer must remain entirely stateless. It should extract the raw `delegation` event and insert it into `drep_timeline_event` for the new DRep without doing any state lookups (removing the `resolve_previous_drep` logic).
3. The NestJS `queue-backend` (`TimelineWatcherWorker`) will process new `delegation` events from the timeline table.
4. Before triggering the full sync, the worker will check the `drep_delegators` table to see if the `stake_address` was previously delegated to a *different* DRep.
5. If a previous delegation exists, the worker will synthesize and insert an `undelegation` event into the `drep_timeline_event` table for the *previous* DRep.
6. The synthesized `undelegation` event will share the same `tx_hash`, `epoch`, and `slot` as the new delegation event, but will use a different `tx_index` modifier (e.g., `tx_index + 1000` or modifying the unique constraint) to avoid Postgres unique constraint violations.

## 3. Edge Cases & Error Handling
- **First Time Delegation**: If there is no previous DRep in the `drep_delegators` table, no undelegation event should be generated.
- **Redelegation to Same DRep**: If the delegator submits a delegation to the *same* DRep they are already delegated to, no undelegation event should be generated.
- **Rollbacks**: The Rust Indexer handles rollbacks by deleting timeline events newer than the rollback slot. Since synthesized undelegation events share the same `slot`, they will be automatically deleted alongside the new delegation events.

## 4. Technical Design
- **Rust Indexer**: Remove `resolve_previous_drep`, remove `DELEGATION_CACHE`, and remove `previous_drep` and `stake_address` columns from the DB schema setup (or just leave them NULL). The indexer inserts raw `delegation` events with `drep_id = target_drep`.
- **Database Schema**: Update the unique constraint on `drep_timeline_event` from `(tx_hash, tx_index)` to `(tx_hash, tx_index, event_type)` OR simply add an offset to the synthesized event's `tx_index` to prevent conflicts.
- **Queue Backend**: Update `TimelineWatcherWorker` to implement the `drep_delegators` lookup and insertion of `undelegation` events. Extend the `DrepTimelineEvent` entity `eventType` to include `'undelegation'`.

## 5. Required Test Cases (TDD)
- [ ] Test 1: Given a stake key with no prior delegation, processing a `VoteDelegation` generates 0 extra events.
- [ ] Test 2: Given a stake key delegated to DRep A, processing a `VoteDelegation` to DRep B successfully synthesizes an `undelegation` event for DRep A in the timeline.
- [ ] Test 3: The synthesized event does not violate unique constraints and shares the correct timestamp/slot.
