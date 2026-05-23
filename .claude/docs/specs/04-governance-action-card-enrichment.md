# Feature Spec: Governance Action Card Enrichment

**Status**: Implemented
**Target Components**: Frontend cards + Backend DRep votes query

---

## 1. User Intent

- **As a** DRep or delegator browsing governance actions
- **I want to** see voting thresholds, vote counts, ratification period, and expiration details directly on governance action cards
- **So that** I can assess a proposal's viability and urgency at a glance without navigating away

---

## 2. Functional Requirements

### 2.1 Voting Thresholds

Display the DRep voting threshold (DVT) and SPO voting threshold (PVT) required for ratification, derived from the current protocol parameters.

| Governance Type | DVT field | PVT field |
|---|---|---|
| `no_confidence` | `dvt_motion_no_confidence` | `pvt_motion_no_confidence` |
| `new_committee` | `dvt_committee_normal` | `pvt_committee_normal` |
| `new_constitution` | `dvt_update_to_constitution` | — |
| `hard_fork_initiation` | `dvt_hard_fork_initiation` | `pvt_hard_fork_initiation` |
| `parameter_change` | group-specific (`dvt_p_p_*`), show minimum | — |
| `treasury_withdrawals` | `dvt_treasury_withdrawal` | — |
| `info_action` | — | Render "No ratification threshold" note |

Thresholds are displayed as percentages (`0.51` → `51%`). Fetched once per session from `GET /drep/epochs/latest/parameters` via `useEpochParamsQuery` (staleTime: 5 days).

### 2.2 Ratification Period

Show `gov_action_lifetime` from epoch params as **"Active N epochs"** — visible inline text, not just a tooltip.

Show expiration epoch as **"Expires Ep. N"**. Derive voting start epoch as `expiration_epoch − gov_action_lifetime`.

### 2.3 Expiration & Lifecycle Status

Badge rendered by `GovernanceLifecycleBadge`:

| Condition | Label | Token |
|---|---|---|
| `enacted_epoch` set | Enacted | `bg-primary-300 text-white` |
| `ratified_epoch` set | Ratified | `bg-complementary-300 text-white` |
| `expired_epoch` set | Expired | `bg-extra_red text-white` |
| `dropped_epoch` set | Dropped | `bg-gray-800 text-white` |
| none | Active | `bg-success text-zinc-800` |

Priority order: enacted > ratified > expired > dropped > active.

### 2.4 Vote Counts & Progress Bar (`GovActionVoteCard` only)

Show aggregate DRep vote counts (yes / no / abstain) as:
- Count badges with percentages: `Yes 51 · 20.5%`, `No 20 · 7.8%`, `Abstain 9`
- Segmented progress bar: green (yes) / red (no) / teal (abstain) with a threshold marker line
- "✓ Threshold met" indicator when yes% ≥ DVT threshold

### 2.5 Content Overlay (`ProposalContentOverlay`)

All proposal content (abstract, rationale, vote rationale) is removed from card bodies and moved to a dedicated reading overlay:

- **Mobile**: slides up as a bottom sheet (92vh, rounded top corners)
- **Desktop**: centered modal (max-width `sm`, max 80vh)
- Content sections: Abstract → Proposal Rationale → Vote Rationale (fetched from external anchor URL via `useGetExternalMetadata`)
- Footer: Copy Hash + external links (GovTool / Cardanoscan)

### 2.6 Scope — Which Cards

| Component | Mode | Changes |
|---|---|---|
| `DrepVoteTimelineCard` | minimal | Vote badge · date · title (2-line) · type chip · lifecycle · threshold · expiry · "Read" button → overlay |
| `DrepVoteTimelineCard` | normal | Vote badge · date · title · meta strip (type/lifecycle/threshold/epochs) · footer (hash + "Read Rationale" + "Add Rationale" if owner + GovTool) |
| `GovActionVoteCard` | card (was table row) | Vote badge · type · lifecycle · title · epoch stat chips · vote count bar · expandable "Details & Rationale" toggle |
| `DrepGovActionSubmitCard` | card | Type chip (design tokens) · date · action name · `GovernanceMetaRow` (badge + threshold + epochs) · GovTool link |

---

## 3. Data Flow

### Frontend

**`GovAction` type** (`frontend/types/api.ts`) extended with:
```ts
governance_type: string | null;
ratified_epoch: number | null;
dropped_epoch: number | null;
expired_epoch: number | null;
drep_yes_count?: number;
drep_no_count?: number;
drep_abstain_count?: number;
```

**Shared utilities** (`src/lib/governanceThresholds.ts`):
- `getThresholdsForType(governanceType, epochParams): GovernanceThresholds`
- `getLifecycleStatus({ ratified_epoch, enacted_epoch, expired_epoch, dropped_epoch }): LifecycleStatus`
- Types: `EpochParams`, `GovernanceThresholds`, `LifecycleStatus`

**Hooks**:
- `useEpochParamsQuery` — `GET /drep/epochs/latest/parameters`, staleTime 5 days
- `useGetProposalMetadataByHashQuery` — fetches off-chain proposal metadata by hash

### Backend

**`dRep.repository.ts`** — `getDRepGovActionsVotes` query updated to:
1. Return lifecycle epoch fields: `ratified_epoch`, `enacted_epoch`, `dropped_epoch`, `expired_epoch`, `expiration_epoch`
2. Return governance type: `governance_type`
3. LEFT JOIN a grouped subquery for aggregate DRep vote counts per proposal:

```sql
LEFT JOIN (
  SELECT
    proposal_id,
    COUNT(*) FILTER (WHERE LOWER(vote) = 'yes')     AS drep_yes_count,
    COUNT(*) FILTER (WHERE LOWER(vote) = 'no')      AS drep_no_count,
    COUNT(*) FILTER (WHERE LOWER(vote) = 'abstain') AS drep_abstain_count
  FROM proposal_votes
  WHERE LOWER(voter_role) = 'drep'
  GROUP BY proposal_id
) vc ON p.id = vc.proposal_id
```

**`proposals.service.ts`** — `getProposalById` returns full lifecycle epochs + vote breakdown by role (drep / spo / constitutional_committee) via grouped count query. Used by `DrepGovActionSubmitCard`.

---

## 4. Component Architecture

### Atom components

| File | Purpose |
|---|---|
| `GovernanceLifecycleBadge.tsx` | Colored chip for lifecycle status; accepts `minimal` prop for smaller variant |
| `GovernanceMetaRow.tsx` | Compact strip: lifecycle badge · threshold · "Active N epochs" · "Expires Ep. N" · "No ratification threshold" for info actions |
| `ProposalContentOverlay.tsx` | Bottom-sheet (mobile) / modal (desktop) for reading proposal abstract, rationale, and vote rationale |
| `DrepVoteTimelineCard.tsx` | Timeline card; two modes (minimal / normal); both open `ProposalContentOverlay` for content |
| `DrepGovActionSubmitCard.tsx` | Submitted-action card; uses design-system tokens, `GovernanceMetaRow` |

### Molecule / page components

| File | Purpose |
|---|---|
| `GovActionVoteCard.tsx` | Standalone vote card (replaces table row); vote counts + progress bar + expandable rationale |
| `dreps/[drepid]/votes/page.tsx` | Switched from `<table>` layout to `flex flex-col gap-3` card list |

---

## 5. Design Constraints

- **No new color tokens** — all styling uses existing design system tokens (`bg-success`, `bg-extra_red`, `bg-complementary-*`, `bg-primary-*`, `bg-secondary-*`, `bg-extra_gray`, `bg-general-*`)
- **Mobile-first** — all rows use `flex-wrap`; footer items wrap to a second line rather than colliding; minimal card strips inline content to 4 rows maximum
- **No inline content on cards** — abstract and rationale text live exclusively in the overlay; cards show only stats and title
- **URL-only filter** — descriptions matching `/^(https?:\/\/\S+|proposal\s+as\s+pdf\s*:)/i` are suppressed from all card surfaces and the overlay

---

## 6. Edge Cases & Error Handling

- Protocol params fetch fails → thresholds render as nothing (component silently omits threshold row)
- `expirationEpoch` null → expiration row omitted
- `info_action` type → "No ratification threshold" italic note replaces threshold text
- `parameter_change` with multiple DVT groups → `getThresholdsForType` returns minimum of all `dvt_p_p_*` values, labelled "DRep (varies by group)"
- Unknown governance type → no threshold row rendered; raw type string shown in type chip
- Vote count subquery returns 0 counts → `VoteBar` component renders nothing (guards on `total === 0`)
- `ProposalContentOverlay` with no content → renders "No proposal content available." placeholder
- External vote rationale URL fails → overlay shows "Could not load external rationale." (no error propagated to card)

---

## 7. Test Cases

### Unit — `getThresholdsForType`

- [x] Returns `dvt_motion_no_confidence` (as %) for `no_confidence` type
- [x] Returns `dvt_treasury_withdrawal` for `treasury_withdrawals` type
- [x] Returns `{ dvt: null, isInfoAction: true }` for `info_action`
- [x] Returns minimum of all `dvt_p_p_*` fields for `parameter_change`
- [x] Returns `{ dvt: null, pvt: null }` gracefully for unknown type

### Unit — `getLifecycleStatus`

- [x] Returns `'enacted'` when `enacted_epoch` is set (highest priority)
- [x] Returns `'ratified'` when only `ratified_epoch` is set
- [x] Returns `'expired'` when only `expired_epoch` is set
- [x] Returns `'dropped'` when only `dropped_epoch` is set
- [x] Returns `'active'` when no epoch fields are set

### Component — `GovernanceLifecycleBadge`

- [x] Renders "Ratified" with `bg-complementary-300` when `ratifiedEpoch` is set
- [x] Renders "Expired" with `bg-extra_red` when `expiredEpoch` is set
- [x] Renders "Active" with `bg-success` when no lifecycle epoch is set
- [x] Renders "Dropped" with `bg-gray-800` when `droppedEpoch` is set
- [x] Accepts `minimal` prop and renders smaller padding/text

### Component — `GovernanceMetaRow`

- [x] Shows "No ratification threshold" italic for info actions
- [x] Shows "Active N epochs" as visible text (not tooltip-only)
- [x] Shows "Expires Ep. N" (not bare "Epoch N")
- [x] Omits threshold and expiration rows when values are null

### Component — `DrepVoteTimelineCard` (minimal)

- [x] Renders 4 rows: vote+date / title / meta chips / Read button
- [x] Title clamped to 2 lines
- [x] Opens `ProposalContentOverlay` on Read click
- [x] No inline description or rationale text

### Component — `DrepVoteTimelineCard` (normal)

- [x] Footer uses `flex-wrap` — no horizontal overflow on mobile
- [x] "Add Rationale" button shown only to vote owner on non-final proposals
- [x] Opens `ProposalContentOverlay` on "Read Rationale" click
- [x] Hash copy chip renders without text-wrapping issue

### Component — `GovActionVoteCard`

- [x] Renders as `<div>` (not `<tr>`) — page uses card list not table
- [x] Vote badge always at top-left regardless of content length
- [x] `VoteBar` renders only when total vote count > 0
- [x] Threshold marker renders at correct percentage position
- [x] "✓ Threshold met" shown when yes% ≥ DVT
- [x] Expandable section collapsed by default
- [x] URL-only abstract suppressed

### Integration — `useEpochParamsQuery`

- [x] Fetches from `GET /drep/epochs/latest/parameters`
- [x] Does not refetch within stale window (5 days)

### Integration — Backend vote count subquery

- [x] `drep_yes_count`, `drep_no_count`, `drep_abstain_count` returned on each vote record
- [x] Counts reflect all DRep voters for the proposal, not only the queried DRep
- [x] COALESCE ensures 0 is returned when no votes exist for a role
