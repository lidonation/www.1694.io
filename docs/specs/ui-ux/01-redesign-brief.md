# UI/UX 01 — Current-state audit and redesign brief

| | |
| --- | --- |
| Ticket | [#235](https://gitlab.2lovelaces.io/voltaire/www.1694.io/-/work_items/235) |
| Status | **Decisions D1–D8 answered by Darlington on 15 November 2026** and applied below (section 9). The follow-up items they raised were settled the same day (section 9.1) |
| Code baseline | `dev` at `ad5c1f47` (15 November 2026). Frontend is unchanged from the ticket baseline `0b8d7313` apart from a health-check route |
| Design source | Penpot file [1694.io 2.0](https://penpot.2lovelaces.io/?screen=workspace&team-id=d80f2735-27cc-8194-8008-648e6a3bb597&project-id=c3a5d485-2367-8175-8008-649c955fd040&file-id=567e025f-9099-812e-8008-f346ae1e37b3) (`567e025f-9099-812e-8008-f346ae1e37b3`), pages `00 Read me`, `01 Sitemap`, `02 Journeys (low-fi)` |
| Legacy reference | Penpot file `1694.io` (`2fdc6c89-2a55-808b-8008-64ac1da47b7d`), revision 8, read-only reference |
| Scope guide | [Statement of work](https://docs.google.com/document/d/15EbJvUP-yqMH27n3WHYrmeN0IBqz_g-Wtpddtqv-YCw/edit), last modified 4 November 2026. This brief does not amend it |

This is a design-only document. It proposes; it does not change application code.

## 1. What 1694.io is for

1694.io is the public record of Cardano's delegated representatives: who they are, what they have said, how they have voted and who delegates to them. It sits beside GovTool. GovTool is where governance transactions and proposal discussion happen; 1694.io is where people research and follow the representatives.

The overhaul covers the service that exists today: DRep identity and discovery, activity, notes, wallet ownership and the handoffs to GovTool. A grants directory, project and team profiles and new social workflows are roadmap work and appear in this brief only in the roadmap lane (section 8).

## 2. Users and their jobs

| User | Has | Primary job | Enters at | Leaves at |
| --- | --- | --- | --- | --- |
| Visitor | No wallet connected | Find a DRep and judge whether they are active and credible; learn what a DRep is | Home, a shared profile link, search engine | A profile they trust, or GovTool to act |
| Delegator | Wallet connected, holds ada | Choose a DRep, delegate, then follow what that DRep does | Directory or a profile link | Delegation confirmed; later, the DRep's timeline or their own voter page |
| DRep owner | Wallet connected, controls a DRep ID | Claim the profile, keep metadata current, publish notes | Own profile, "Claim profile", or the campaign call to action | Profile updated on chain, or a note published and visible on the timeline |

## 3. Current-state audit

### 3.1 Route inventory

Every page under `frontend/src/app/[locale]/`. Decision is a proposal: **Redesign** (keep the function, redraw it), **Retain** (keep as is, restyle through the shared system only), **Archive** (keep reachable, read-only, out of primary navigation), **Defer** (not in this phase).

| # | Route | What it is today | Proposed decision | Ticket |
| --- | --- | --- | --- | --- |
| 1 | `/` | CIP-1694 long read streamed from the CIPs repository, with GitHub comments and a table of contents | **Redesign** as a new landing page (D1). The CIP reader moves to `/learn/cip-1694` | #237 |
| 2 | `/dreps` | "Learn about DReps" overview with become-a-DRep and campaign calls to action | **Redesign** as the Learn › DReps page | #237 |
| 3 | `/dreps/list` | Directory: metrics, search, filter chips, sortable table, pagination | **Redesign** | #239 |
| 4 | `/dreps/[id]` | Profile tab: identity, status chips, metadata, claim, delegate, edit | **Redesign** | #240 |
| 5 | `/dreps/[id]/timeline` | Activity by epoch; filters for voting activity, delegations and notes; separate mobile and desktop renderers | **Redesign** | #241 |
| 6 | `/dreps/[id]/votes` | Vote cards with links out to GovTool and AdaStat | **Redesign** | #241 |
| 7 | `/dreps/[id]/delegators` | Delegator cards linking to voter pages | **Redesign** | #240 |
| 8 | `/dreps/notes` | Feed of notes, loads in both scroll directions | **Defer** (D5). Stays reachable by URL, unlinked and unchanged this phase; notes are designed on the timeline | — |
| 9 | `/dreps/workflow/notes/new` | New note form: text, link, file, visibility | **Redesign** | #242 |
| 10 | `/dreps/workflow/notes/[id]/update` | Edit note; the new-note form redirects here after creation | **Redesign** | #242 |
| 11 | `/dreps/workflow/profile/new` | Claim / start profile; resolves the DRep ID and routes to the update steps | **Redesign** | #238, #240 |
| 12 | `/dreps/workflow/profile/update/step1`–`step4` | Four-step metadata edit ending in an on-chain update | **Redesign** | #240 |
| 13 | `/dreps/workflow/profile/success` | Completion page, with transaction hash when one exists | **Redesign** | #240 |
| 14 | `/proposals` | Archive of the 2025 Cardano budget cycle, sourced from Catalyst Explorer, with a staleness warning | **Redesign**, kept in primary navigation (D2). Designed to hold more than one budget cycle | #245 |
| 15 | `/proposals/[id]` | Budget proposal detail with comments, poll results and a DRep voting section | **Redesign** (D2) | #245 |
| 16 | `/voters/[id]` | Voter wallet stats and delegation history | **Redesign** in the profile family | #240 |
| 17 | `/voters/[id]/impact` | Governance actions the voter's delegation contributed to | **Redesign** in the profile family | #241 |
| 18 | Not found, loading | Plain 404 that prints the URL; skeleton loaders | **Redesign** in the shell | #237 |

Overlays, which are not routes but need designs:

| Overlay | What it is today | Ticket |
| --- | --- | --- |
| Login | Two paths: connect and authenticate with a browser wallet, or upload / generate a login file | #238 |
| Wallet list | "Connect Your Wallet" chooser | #238 |
| GovTool username | "Add your GovTool username" | #238 |
| Save GovTool token | Offers to store a GovTool token so the user does not sign again | #238 |
| Not a DRep | Error with a link to GovTool | #238 |
| Transaction and action modals | Progress and result of a signed transaction | #238 |
| Notification drawer | Per-user notifications with read / unread; logged-out and empty states | #237 |
| Owner side bar | Shown to the owner on their profile | #240 |

### 3.2 Navigation today

- Header: logo → `/`; **CIP** → `/`; **DReps** → `/dreps/list` (agreed in #232, live 15 November); **Proposals** → `/proposals`; **Voltaire** dropdown of external links (GovTool, Cardano, Proposal Discussion Forum, Intersect, Catalyst Explorer, Cardano CIPs, Lido Nation); wallet button; notifications.
- Mobile: the same items in a slide-in menu.
- Footer: GovTool, Lido Nation, Catalyst Explorer, Cardano CIPs; three social icons.
- Breadcrumbs on every inner page.

### 3.3 Findings

Severity: **High** blocks a primary job or misleads; **Medium** causes friction; **Low** is polish.

| # | Finding | Severity | Evidence |
| --- | --- | --- | --- |
| F1 | The home page is a specification document. It does not say what 1694.io is or lead to a DRep. The directory, the product's main job, is one click away under a label that assumes the visitor knows what a DRep is | High | `app/[locale]/page.tsx` |
| F2 | The site has no mark of its own. The header "logo" is a network image (`mainnet-black.png`, `preview-black.png`), and the footer shows the GovTool logo | High | `Header.tsx`, `Footer.tsx` |
| F3 | Browser title and description still read "Voltaire DRep Campaign Module" / "Town Halls and Campaigns for Voltaire DReps" | Medium | `app/[locale]/layout.jsx` |
| F4 | Network context is carried only by the logo image. There is no text label, so preview and mainnet are indistinguishable without the image or to a screen reader beyond "1694 logo" | High | `Header.tsx` |
| F5 | The notes feed (`/dreps/notes`) is not linked from the header, mobile menu, footer or profile tabs. It is reachable only by URL | High | no inbound link in `components/` |
| F6 | The owner side bar has five entries (Profile, Notes, Gov Tools, Guides, FAQs) and all five link to `#` | High | `DrepProfileBar.tsx` |
| F7 | German exists as a URL prefix only. `messages/de.json` and `messages/en.json` each hold one key and no component reads translations, so every label is hard-coded English | High — six languages are now required (D4) and none exists in the code | `frontend/messages/`, no `useTranslations` usage |
| F8 | Delegation is a local wallet transaction on the profile, while registering as a DRep and viewing a governance action hand off to GovTool. Nothing on screen tells the user which kind of action they are about to take | Medium — delegation stays local (D3); the design must label local and external actions | `DynamicDRepProfileCard.tsx`, `BecomeADRepButton.tsx`, `ViewExternalGovAction.tsx` |
| F9 | "Proposals" in primary navigation leads to a frozen 2025 budget archive | Medium — the section stays (D2) and must say which cycle it shows | `app/[locale]/proposals/page.tsx` |
| F10 | The shell is assembled per section: the home and voter pages render their own header and footer, DRep pages share a layout. Breadcrumb links are built three different ways (with locale, with a leading slash, without) | Medium | `voters/[voterId]/layout.tsx`, `dreps/layout.tsx`, breadcrumb callers |
| F11 | Layout switches on a JavaScript `isMobile` flag, and the timeline has separate mobile and desktop components. There is no tablet behaviour | Medium | `Header.tsx`, `DrepTimelineMobile.tsx`, `DrepTimelineDesktop.tsx` |
| F12 | Two styling systems run side by side (MUI in 65 files, utility classes in 195) with 82 distinct hard-coded hex colours outside the theme. Active navigation uses `orange-500`, which is not a theme colour | Medium | `frontend/src` |
| F13 | Footer: the Instagram icon links to `#`; the icon drawn as GitHub opens a GitLab address | Low | `Footer.tsx` |
| F14 | The directory heading is "Available DReps" at display size above a dense table that mixes IDs, names, several status chips and three numeric columns in one row | Medium | `dreps/list/page.tsx`, `DRepsTable.tsx` |
| F15 | The legacy Penpot file is desktop-only (every board 1920 px wide), has no prototype links, no tokens and six named components. It has no boards for timeline, votes, delegators, voter impact, the proposals list or login | Medium | legacy file revision 8 |

### 3.4 What can be reused

- **Palette and type.** The legacy Penpot colour styles (primary, secondary, complementary, destructive scales; surface; additional) match the `@theme` values in `frontend/src/assets/styles/globals.css` one for one, and the type is Poppins in both. These become the starting tokens for #237 rather than a new invented palette; #236 may adjust them with the identity.
- **Existing behaviours to preserve.** URL-driven directory state (`s`, `page`, `sort`, `order`, `on_chain`, `include_retired`, `campaign`, `type`); copy-ID feedback; cursor-paged timeline; notes loading in both directions; note visibility (Everyone, Delegators only, Myself); note reactions and comments; the four-step metadata edit.
- **Components worth carrying forward as patterns:** status chip, copy-to-clipboard ID holder, pagination, breadcrumbs, filter chips, metric card, tab group, skeleton loaders.

## 4. Proposed sitemap

```
1694.io
├── Home                         /                     new landing: what this is, find a DRep, recent activity, learn
├── DReps                        /dreps/list           directory (primary navigation, as agreed in #232)
│   └── DRep                     /dreps/[id]
│       ├── Profile              /dreps/[id]
│       ├── Timeline             /dreps/[id]/timeline
│       ├── Votes                /dreps/[id]/votes
│       └── Delegators           /dreps/[id]/delegators
├── Proposals                    /proposals            budget proposals by cycle (D2)
│   └── Proposal                 /proposals/[id]
├── Learn
│   ├── About DReps              /dreps                kept, linked from the directory (#232)
│   └── CIP-1694                 /learn/cip-1694       moved from / (D1)
├── Voter                        /voters/[id]          reached from delegator lists and the wallet menu
│   └── Impact                   /voters/[id]/impact
├── Account (wallet menu)
│   ├── My DRep profile → edit   /dreps/workflow/profile/…
│   ├── Write a note → edit      /dreps/workflow/notes/…   notes appear on the DRep timeline (D5)
│   └── My voter page            /voters/[id]
└── External
    └── GovTool, Cardano, Intersect, Catalyst Explorer, CIPs, Lido Nation
```

Header: **logo · DReps · Proposals · Learn · network label · language · theme · wallet / account · notifications**. External links move to the footer.

One URL changes: the CIP reader moves from `/` to `/learn/cip-1694`. Links to the old in-page anchors (`/#summary`, `/#specifications` and so on) need a redirect, which is an implementation requirement to carry into the handoff. The standalone notes feed at `/dreps/notes` is left as it is and is not linked.

## 5. Journeys

Low-fidelity flows are drawn in the Penpot file, page `02 Journeys (low-fi)`.

**Visitor — find and assess a DRep.** Home → directory (search, filter) → profile → timeline or votes → governance action opens in GovTool. Back from a profile returns to the directory with search, filters and page intact. Alternate entry: a shared profile link lands directly on the profile, with a route up to the directory.

**Delegator — choose and follow.** Directory or profile → connect wallet (login) → delegate → transaction progress → confirmed, profile shows "You delegate to this DRep" → later: the DRep's timeline, or own voter page. Cancel at the wallet prompt returns to the profile unchanged. Failure offers retry.

**DRep owner — claim, edit, publish.** Own profile → connect and verify ownership → claim → metadata steps 1–4 → review → sign and submit → success with transaction reference → profile. Separately: new note → saved, redirected to edit → published → visible on the DRep's timeline. Leaving a form with unsaved changes asks first.

### What stays on 1694.io and what opens GovTool

| Action | Today | Proposed |
| --- | --- | --- |
| Register as a DRep | Opens GovTool | Opens GovTool, unchanged |
| View a governance action | Opens GovTool or AdaStat | Opens GovTool or AdaStat, unchanged; labelled as external with the network named |
| Proposal discussion | Opens GovTool | Opens GovTool, unchanged |
| Vote on a governance action | Not offered here | Opens GovTool |
| Delegate to a DRep | Local wallet transaction | Stays local (D3), with a confirmation step that names the DRep and the network |
| Update DRep metadata | Local, four steps ending in a transaction | Stays local; it is the existing owner function |
| Claim a profile, publish notes, react, comment | Local | Stays local |
| Budget poll vote and comments | Local, published back to GovTool | Stays local (D2); closed cycles show results read-only |

Every handoff carries the current network to the matching GovTool environment and opens in a new tab, so back is simply closing the tab. External links are marked with text and an icon, not colour alone.

## 6. Brand direction for the logo ticket (#236)

Approved as the starting point (D6):

- **Role.** An independent public record. Civic and archival in character: closer to a register or a library than to a wallet or an exchange.
- **Name.** "1694" is both the CIP and Voltaire's birth year. The mark should stand on the numerals themselves; the `.io` is secondary.
- **Relationship to GovTool.** Clearly a different product. No reuse of the GovTool mark or its lockup.
- **Network.** Mainnet and preview are a separate text label beside the mark, never a variant of the mark.
- **Qualities.** Legible at 16 px, works in one colour, holds up on white and on the dark footer.
- **Avoid.** Generic blockchain motifs (hexagons, nodes, chain links); ballot-box clichés; anything that reads as an official Cardano or Intersect body.
- **Starting palette.** Existing primary blue `#0033AD` and secondary orange `#FF640A`. The logo exploration may propose changes; the design system ticket then adopts the result. Every colour needs a light and a dark value (D7), and the mark must hold on both.
- **Type.** A new typeface is chosen in #236. Poppins, the current one, has no Japanese or Chinese glyphs and no Vietnamese subset, so it cannot carry the six languages (D4). The replacement is a family, or a matched set, covering English, Japanese, Swahili, Simplified Chinese, German and Vietnamese, with the licence for every face recorded in #236.

## 7. Coverage matrix

Viewports: **375, 768, 1280** px. Themes: **light and dark** (D7). Languages: **English, Japanese, Swahili, Chinese, German, Vietnamese** (D4).

How the three axes combine, so the matrix stays reviewable:

- Every screen and state below is designed in English, in light and dark, at all three viewports.
- Every screen's default state is rendered in all six languages at 375 and 1280 px in light. Dark is rendered in English and one of Japanese or Chinese.
- Shell, navigation, buttons, chips, tabs and form labels are rendered in all six languages in both themes, since those are where length and line-height differences break layouts.
- Long-content stress on every identity component: 64-character DRep IDs, 80-character names, missing name and image, nine-digit ada amounts.

Interface strings are translated from files kept in the repository (`frontend/messages/<locale>.json`), reviewed through merge requests like any other change. Chinese means Simplified Chinese. DRep-authored content (names, bios, notes, rationales, proposal text) is shown in the language it was written in; whether and how to translate it is deferred until the Nostr architecture is settled.

State columns: **L** loading · **E** empty · **Er** error / source unavailable · **P** partial or stale data · **S** success · **Perm** permission variants (visitor / connected / owner).

| Screen | Ticket | L | E | Er | P | S | Perm | Screen-specific states |
| --- | --- | :-: | :-: | :-: | :-: | :-: | :-: | --- |
| Header, footer, mobile menu | #237 | – | – | – | – | – | ✓ | mainnet / preview label; language switcher; theme switch; wallet disconnected, connecting, connected |
| Home | #237 | ✓ | – | ✓ | ✓ | – | – | recent activity unavailable |
| Learn › About DReps | #237 | – | – | – | – | – | ✓ | — |
| Learn › CIP-1694 | #237 | ✓ | – | ✓ | – | – | – | source repository unreachable |
| Language and theme behaviour | #237 | – | – | – | – | – | – | first visit follows browser language and system theme; choice persists; unsupported language falls back to English |
| Not found, section loading | #237 | ✓ | – | ✓ | – | – | – | unknown DRep ID |
| Notification drawer | #237 | ✓ | ✓ | ✓ | – | – | ✓ | logged out; read / unread |
| Login, wallet list | #238 | ✓ | ✓ | ✓ | – | ✓ | – | no wallet installed; wrong network; signature declined; login-file upload and generate |
| GovTool username, save token, not-a-DRep | #238 | ✓ | – | ✓ | – | ✓ | – | — |
| Transaction progress | #238 | ✓ | – | ✓ | – | ✓ | – | submitted, confirmed, failed, cancelled |
| Account menu | #238 | – | – | – | – | – | ✓ | holder only; DRep owner; several claimed profiles |
| Directory | #239 | ✓ | ✓ | ✓ | ✓ | – | – | first load vs next page; filters applied; no matches; missing names and images; special DRep types |
| DRep profile | #240 | ✓ | – | ✓ | ✓ | – | ✓ | claimed / unclaimed; retired; scripted; voting option; delegated-to-you; incomplete metadata |
| Delegators | #240 | ✓ | ✓ | ✓ | ✓ | – | – | very large lists |
| Voter profile | #240 | ✓ | ✓ | ✓ | ✓ | – | ✓ | never delegated; own page |
| Profile edit steps 1–4, review, success | #240 | ✓ | – | ✓ | – | ✓ | ✓ | validation; unsaved draft; retry; cancel; signed vs confirmed |
| Timeline | #241 | ✓ | ✓ | ✓ | ✓ | – | ✓ | filters; newer / older; loading another batch; empty epochs |
| Votes | #241 | ✓ | ✓ | ✓ | ✓ | – | – | missing governance-action reference |
| Voter impact | #241 | ✓ | ✓ | ✓ | ✓ | – | – | — |
| GovTool handoff | #241 | – | – | – | – | – | – | mainnet / preview destination; external marker |
| Budget proposals list and detail | #245 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | cycle selector; closed cycle (read-only results) vs open cycle; stale warning; poll vote and comment as a DRep |
| Note on the timeline, note detail | #242 | ✓ | ✓ | ✓ | – | – | ✓ | visibility: everyone / delegators only / myself; reactions; comments |
| New / edit note | #242 | ✓ | – | ✓ | – | ✓ | ✓ | validation; link and file attachment; unsaved changes; redirect after create |

"–" means not applicable to that screen.

## 8. Roadmap lane — not in this phase

Recorded so that they are not drawn as available features: grants directory across programmes; project and team profiles; cross-source identity matching; project progress updates; new social features beyond existing notes, reactions and comments. The home page may describe the direction in words; it must not show these as navigation or as working entry points.

## 9. Decisions

Answered by Darlington on 15 November 2026.

| # | Question | Decision |
| --- | --- | --- |
| D1 | What the home page is | New landing page at `/`. The CIP-1694 reader moves under Learn |
| D2 | The budget proposals section | Kept as a live section in primary navigation. The record will be updated for later rounds and prepared for the 2027 cycle |
| D3 | Delegation | Stays on 1694.io as a local transaction and is designed properly |
| D4 | Languages | Full coverage in English, Japanese, Swahili, Chinese, German and Vietnamese |
| D5 | Where notes live | On the DRep timeline only for now. The standalone feed waits until there are enough notes |
| D6 | Brand direction in section 6 | Approved as the starting point for #236 |
| D7 | Themes | Light and dark, both in this phase |
| D8 | Owner side bar | Replaced by the account menu and in-page owner actions |

### 9.1 Follow-up items and how they were settled

Raised by the decisions above; settled by Darlington on 15 November 2026.

| # | Item | Outcome |
| --- | --- | --- |
| O1 | Poppins cannot set Japanese or Chinese and has no Vietnamese subset | Find a new typeface in #236 |
| O2 | The code has one translation key and no component reads translations | Translations are kept in the repository and managed through git for now. Translating DRep-authored content is deferred until the Nostr architecture is final |
| O3 | Which Chinese | Simplified |
| O4 | Budget proposals is now a full redesign | New ticket [#245](https://gitlab.2lovelaces.io/voltaire/www.1694.io/-/work_items/245), placed before the validation ticket. The validation ticket #243 is renumbered UI/UX 10 |
| O5 | Scope of 2027-cycle support | Design the existing proposals screens so they can hold another cycle. Sourcing data for later rounds is separate work outside this ticket set |
| O6 | Tickets #236–#243 said "English/German" and assumed one theme | Updated on 15 November 2026 to match D1–D8 |

## 10. Screen lists for the remaining tickets

- **#236 Logo and identity** — symbol, wordmark, horizontal and stacked lockups, favicon, monochrome, light and dark backgrounds, network label, usage sheet; shown in header, footer, mobile menu and at 16 px.
- **#237 Design system, home and shell** — tokens (colour with light and dark values, type for six languages, spacing, radius, elevation), core components, header with language and theme switches, footer, mobile menu, breadcrumbs, notification drawer, new home landing, Learn › About DReps, Learn › CIP-1694, not found, loading.
- **#238 Wallet, ownership, account** — login (wallet and login file), wallet list, wrong network, GovTool username, save token, not-a-DRep, transaction progress, account menu, permission matrix.
- **#239 Directory** — heading and metrics, search, filters, sort, table and narrow-screen list, pagination, every state in the matrix.
- **#240 Profiles and editing** — DRep profile, delegators, voter profile, claim, edit steps, review, success.
- **#241 Activity and GovTool** — timeline, votes, voter impact, governance reference card, external handoff pattern.
- **#242 Notes** — note card on the timeline, note detail, reactions and comments, new and edit note, visibility, attachments. The standalone feed is deferred.
- **#245 Budget proposals** — list with cycle selector, metrics, search, filters, sort and download; proposal page with comments, poll results and poll response; open and closed cycles.
- **#243 Validation and handoff** — assembled prototype for the three journeys plus the budget proposals journey, render review at 375 / 768 / 1280 in both themes and six languages as set out in section 7, spec index.

## 11. What has and has not been checked

| Check | Result | Method |
| --- | --- | --- |
| Route and overlay inventory | Done | Read of `frontend/src/app` and `frontend/src/components` at `ad5c1f47` |
| Findings F1–F15 | Done from source | Code read; not walked in a browser on the live site |
| Legacy Penpot inventory | Done | Penpot API, file revision 8 |
| Low-fi flows written to Penpot | Done, structure confirmed through the Penpot API | Not visually inspected in Penpot; open the file to review |
| Live walk-through of mainnet and preview, including back / cancel | Not run | To be done with the first rendered screens |
| Copy review in six languages | Not run | Needs the interface strings extracted and translation files added to the repository |
| Accessibility review | Not run | Belongs to rendered screens (#237 onward) |
