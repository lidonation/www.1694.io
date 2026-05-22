# Feature Spec: Governance Action Card Enrichment

**Status**: Draft
**Target Component**: Frontend (+ Backend — expose epoch params to proposal responses)

## 1. User Intent

- **As a** DRep or delegator browsing governance actions
- **I want to** see voting thresholds, ratification period, and expiration details directly on governance action cards
- **So that** I can assess a proposal's viability and urgency at a glance without navigating away

## 2. Functional Requirements

### 2.1 Voting Thresholds

Display the DRep voting threshold (DVT) and SPO voting threshold (PVT) required for ratification, derived from the current protocol parameters.

| Governance Type | DVT field | PVT field |
|---|---|---|
| `no_confidence` | `dvt_motion_no_confidence` | `pvt_motion_no_confidence` |
| `new_committee` | `dvt_committee_normal` | `pvt_committee_normal` |
| `new_constitution` | `dvt_update_to_constitution` | — |
| `hard_fork_initiation` | `dvt_hard_fork_initiation` | `pvt_hard_fork_initiation` |
| `parameter_change` | group-specific (`dvt_p_p_*`) | — |
| `treasury_withdrawals` | `dvt_treasury_withdrawal` | — |
| `info_action` | — | — (Info actions have no ratification threshold) |

For `parameter_change`, show all applicable `dvt_p_p_*` fields (network, economic, technical, gov groups) as a range or list.

Thresholds are displayed as percentages (e.g., `0.51` → `51%`).

Thresholds are fetched once per session from `GET /drep/epochs/latest/parameters` and cached client-side (React Query with a stale time of 1 epoch ≈ 5 days).

### 2.2 Ratification Period

Display the governance action lifetime as: **"Active for N epochs"** where N = `gov_action_lifetime` from the epoch params response.

If the proposal's `expirationEpoch` is known, also show: **"Expires epoch N"**.

### 2.3 Expiration & Lifecycle Status

Display the current lifecycle state of the proposal as a chip/badge:

| Condition | Label | Color |
|---|---|---|
| `ratifiedEpoch` is set | Ratified | green |
| `enactedEpoch` is set | Enacted | teal |
| `expiredEpoch` is set | Expired | red |
| `droppedEpoch` is set | Dropped | grey |
| None of the above | Active | blue |

If the proposal's `expirationEpoch` is known and status is Active, show the expiration epoch number: **"Expires: Epoch N"**.

### 2.4 Scope — Which Cards

The following components must be enriched:

1. **`DrepGovActionSubmitCard.tsx`** — shows submitted governance actions on a DRep's profile. Add lifecycle badge + threshold row + expiration epoch.
2. **`GovActionVoteCard.tsx`** — shows voting history table rows. Add lifecycle badge and expiration epoch (compact; thresholds optional for space).

### 2.5 Data Flow

The cards currently receive a `GovAction` object from the API. The `GovAction` type in `frontend/types/api.ts` already includes `enacted_epoch` and `expiration_epoch`. It must be extended with:

```ts
ratified_epoch?: number | null;
dropped_epoch?: number | null;
expired_epoch?: number | null;
governance_type?: string | null;
```

These fields are already in the backend `Proposal` entity and the `/proposals` service response. The existing DRep votes endpoint that produces `GovAction` data must be verified to include them; if not, the query must be updated to return these columns.

Protocol parameters are fetched independently via `GET /drep/epochs/latest/parameters` — no changes to the proposal endpoint are needed for thresholds.

## 3. Edge Cases & Error Handling

- If protocol params fetch fails, show thresholds as `—` (dash) with no error state for the card.
- If `expirationEpoch` is null, omit the expiration row rather than showing "Epoch null".
- `info_action` governance type has no DVT/PVT threshold — render a note: "No ratification threshold (Info Action)".
- `parameter_change` can span multiple DVT groups — if the action's description JSON doesn't identify the group, display all applicable `dvt_p_p_*` thresholds.
- Cards should not break if new governance types are introduced — fall back to displaying raw type string with no threshold row.

## 4. Technical Design

### Frontend

- **New hook**: `useEpochParamsQuery` — wraps `GET /drep/epochs/latest/parameters` with React Query; `staleTime: 5 * 24 * 60 * 60 * 1000` (5 days).
- **New utility**: `getThresholdsForType(governanceType, epochParams)` — pure function returning `{ dvt: number | null, pvt: number | null, label: string }`.
- **New atom component**: `GovernanceLifecycleBadge` — accepts lifecycle state, renders colored chip.
- Update `GovAction` type in `frontend/types/api.ts` with the missing fields listed in §2.5.

### Backend

- Verify the DRep votes query returns `governance_type`, `ratified_epoch`, `dropped_epoch`, `expired_epoch` alongside existing `enacted_epoch` and `expiration_epoch`. If not, update the relevant query.
- No new endpoints or migrations needed.

## 5. Required Test Cases (TDD)

### Unit — `getThresholdsForType` utility

- [ ] Returns `dvt_motion_no_confidence` (as %) for `no_confidence` type
- [ ] Returns `dvt_treasury_withdrawal` for `treasury_withdrawals` type
- [ ] Returns `null` DVT and PVT and an info-action note for `info_action`
- [ ] Returns all `dvt_p_p_*` fields for `parameter_change`
- [ ] Returns `{ dvt: null, pvt: null }` gracefully for an unknown governance type

### Component — `GovernanceLifecycleBadge`

- [ ] Renders "Ratified" (green) when `ratifiedEpoch` is set
- [ ] Renders "Expired" (red) when `expiredEpoch` is set
- [ ] Renders "Active" (blue) when no lifecycle epoch is set
- [ ] Renders "Dropped" (grey) when `droppedEpoch` is set

### Component — `DrepGovActionSubmitCard`

- [ ] Shows lifecycle badge
- [ ] Shows formatted threshold row when epoch params are available
- [ ] Shows `—` in threshold fields when epoch params fetch fails
- [ ] Does not render expiration row when `expirationEpoch` is null

### Integration — `useEpochParamsQuery`

- [ ] Fetches from `GET /drep/epochs/latest/parameters`
- [ ] Does not refetch within the stale window (5 days)
