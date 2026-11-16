# UI/UX 03 — Design system, home and shell

| | |
| --- | --- |
| Ticket | [#237](https://gitlab.2lovelaces.io/voltaire/www.1694.io/-/work_items/237) |
| Status | **In progress, draft.** Foundation colours approved by Darlington on 15 November 2026. Components and shell (sections 3 and 4) are drafted and not yet reviewed. The home and Learn pages are not yet designed |
| Depends on | [`01-redesign-brief.md`](01-redesign-brief.md) (decisions D1–D8), [`02-brand-and-logo.md`](https://gitlab.2lovelaces.io/voltaire/www.1694.io/-/merge_requests/520) (identity, typeface) |
| Penpot | File [1694.io 2.0](https://penpot.2lovelaces.io/?screen=workspace&team-id=d80f2735-27cc-8194-8008-648e6a3bb597&project-id=c3a5d485-2367-8175-8008-649c955fd040&file-id=567e025f-9099-812e-8008-f346ae1e37b3) (`567e025f-9099-812e-8008-f346ae1e37b3`), revision 9, pages `05 Foundations`, `06 Components`, `07 Shell` |
| Tokens | [`assets/tokens.json`](assets/tokens.json) |

Design-only. The token map in section 2.5 describes how the proposed system relates to the existing code; changing the code is later work.

## 1. Progress

| Part | State |
| --- | --- |
| Foundations: colour roles, type scale, spacing, radius, grid | Colours approved; rest drafted |
| Core components (buttons, inputs, tabs, badges, cards, tables, pagination, alerts, menus, modal, loading / empty / error) | Drafted in light and dark, section 3 |
| Shell: header, mobile menu, footer, breadcrumbs, notification drawer, language and theme switches | Drafted in light and dark, section 4 |
| Home landing, Learn › About DReps, Learn › CIP-1694, not found, loading | Not started |
| Rendered review at 375, 768 and 1280 px in both themes and six languages | Not started |

## 2. Foundations

### 2.1 Colour roles

Components refer to roles, never to raw colours. Every role has a light and a dark value. "Ratio" is the contrast against the surface the role sits on, calculated from the hex values; the target is 4.5 : 1 for text and 3 : 1 for control outlines and focus.

| Role | Light | Dark | Ratio light / dark | Use |
| --- | --- | --- | --- | --- |
| `surface.page` | `#F6F7FB` | `#0B1020` | – | Page background |
| `surface.raised` | `#FFFFFF` | `#141B31` | – | Cards, tables, menus, modals |
| `surface.sunken` | `#EDF0F7` | `#070B17` | – | Wells, table header, code |
| `border.subtle` | `#DDE2EC` | `#232C45` | – | Dividers, card outlines |
| `border.control` | `#6B7690` | `#7C89A6` | 4.5 / 4.9 on `surface.raised` | Input and button outlines |
| `text.primary` | `#0B1430` | `#EEF1F8` | 17.0 / 16.7 on `surface.page` | Body text, headings |
| `text.secondary` | `#4F5A70` | `#A3AEC4` | 6.5 / 8.5 on `surface.page` | Supporting text, captions |
| `action.primary` | `#0033AD` | `#8FB0FF` | 9.4 / 8.9 on `surface.page` | Primary buttons, links, selected |
| `action.primary-hover` | `#001F68` | `#B5CBFF` | 14.1 / 11.7 on `surface.page` | Hover and pressed |
| `action.on-primary` | `#FFFFFF` | `#0B1020` | 10.1 / 8.9 on `action.primary` | Text on primary buttons |
| `accent` | `#FF640A` | `#FF8A47` | 2.8 / 8.1 on `surface.page` | Ledger rule, highlights; never text on light |
| `accent.text` | `#993C06` | `#FF8A47` | 6.5 / 8.1 on `surface.page` | Accent-coloured text |
| `focus.ring` | `#0033AD` | `#8FB0FF` | 9.4 / 8.9 on `surface.page` | 2 px focus outline with 2 px offset |
| `status.success` | `#1A6B38` | `#6FDF8E` | 6.6 / 10.3 on `surface.raised` | Confirmed, active |
| `status.success-bg` | `#E4F5EA` | `#10291A` | – | Success badge and alert fill |
| `status.warning` | `#7A4F00` | `#FFC14C` | 7.1 / 10.5 on `surface.raised` | Stale, pending, preview network |
| `status.warning-bg` | `#FFF3D1` | `#2E2200` | – | Warning badge and alert fill |
| `status.danger` | `#B3261E` | `#FF8A80` | 6.5 / 7.5 on `surface.raised` | Errors, failed, retired |
| `status.danger-bg` | `#FCEBEA` | `#3A1414` | – | Error badge and alert fill |
| `status.info` | `#146C82` | `#A0D3E0` | 6.0 / 10.5 on `surface.raised` | Source, freshness, external |
| `status.info-bg` | `#E2F2F6` | `#082C35` | – | Info badge and alert fill |

Status text on its own tinted background was also checked: success, warning, danger and info each reach at least 5.2 : 1 in light and 7.1 : 1 in dark.

The accent orange is 2.8 : 1 on the light page, so it is used for the ledger rule and highlights only. Orange text uses `accent.text`.

Status is never shown by colour alone: every badge and alert carries a word, and where space allows an icon.

### 2.2 Type

| Style | Face | Weight | Desktop size / line | Mobile size / line | Use |
| --- | --- | --- | --- | --- | --- |
| `display` | Source Serif 4 | 600 | 48 / 56 | 34 / 40 | Home hero only |
| `heading.1` | Source Serif 4 | 600 | 36 / 44 | 28 / 36 | Page title |
| `heading.2` | Source Serif 4 | 600 | 28 / 36 | 24 / 32 | Section title |
| `heading.3` | Source Sans 3 | 600 | 22 / 30 | 20 / 28 | Card and panel title |
| `heading.4` | Source Sans 3 | 600 | 18 / 26 | 18 / 26 | Sub-heading, table group |
| `body.large` | Source Sans 3 | 400 | 18 / 28 | 18 / 28 | Lead paragraph |
| `body` | Source Sans 3 | 400 | 16 / 24 | 16 / 24 | Default text |
| `body.small` | Source Sans 3 | 400 | 14 / 20 | 14 / 20 | Tables, secondary text |
| `label` | Source Sans 3 | 600 | 14 / 20 | 14 / 20 | Buttons, tabs, form labels |
| `caption` | Source Sans 3 | 400 | 12 / 16 | 12 / 16 | Metadata; smallest size allowed |
| `mono` | Source Code Pro | 400 | 14 / 20 | 14 / 20 | DRep IDs, hashes, ada amounts |

- 12 px is the smallest size used anywhere.
- Japanese and Simplified Chinese use Noto Serif JP / SC and Noto Sans JP / SC at the same sizes, with body line height raised to 1.7.
- **Ada sign.** The Source faces do not contain ₳ (U+20B3). Noto Sans does (checked against the font file) and is the named fallback in the sans and mono stacks, so the sign renders from a known face rather than whatever the device supplies.
- Figures in tables and amounts use tabular numerals.

### 2.3 Spacing and radius

Spacing scale, in px: 4, 8, 12, 16, 24, 32, 48, 64, 96.

| Radius | Value | Use |
| --- | --- | --- |
| `radius.small` | 4 px | Badges, inputs inside tables |
| `radius.medium` | 8 px | Cards, inputs, menus |
| `radius.large` | 12 px | Modals, hero panels |
| `radius.pill` | pill | Buttons, chips, network label |

### 2.4 Grid and reference widths

| Width | Columns | Margins | Gutters |
| --- | --- | --- | --- |
| Mobile, 375 px | 4 | 16 px | 16 px |
| Tablet, 768 px | 8 | 32 px | 24 px |
| Desktop, 1280 px | 12 | 40 px | 24 px |

Content is capped at 1200 px. Layouts reflow between these widths with CSS; nothing depends on detecting a device, which is how the current header and timeline switch today.

### 2.5 Map to the existing code

The current system lives in [`globals.css`](../../../frontend/src/assets/styles/globals.css) (Tailwind `@theme` colours) and [`theme.ts`](../../../frontend/src/assets/theme.ts) (MUI). It has one theme, numbered colour scales and Poppins.

| Proposed role | Closest existing token | Note |
| --- | --- | --- |
| `surface.page` | new (replaces the body gradient) | new value |
| `surface.raised` | white | same value in light |
| `surface.sunken` | extra_gray #F3F5FF | new value |
| `border.subtle` | destructive-200 | new value |
| `border.control` | destructive-300 | new value |
| `text.primary` | titles #242232 | new value |
| `text.secondary` | destructive-300 | new value |
| `action.primary` | primary-300 | same value in light |
| `action.primary-hover` | primary-400 | same value in light |
| `action.on-primary` | white | same value in light |
| `accent` | secondary-300 | same value in light |
| `accent.text` | secondary-400 | same value in light |
| `focus.ring` | primary-300 | same value in light |
| `status.success` | success #6FDF8E | new value |
| `status.success-bg` | new | new value |
| `status.warning` | extra_yellow | new value |
| `status.warning-bg` | new | new value |
| `status.danger` | extra_red #FF4D4D | new value |
| `status.danger-bg` | new | new value |
| `status.info` | complementary-300 | new value |
| `status.info-bg` | complementary-100 / -400 | new value |

Other points for implementation:

- `--font-primary` (Poppins) and the MUI `fontFamily` are replaced by the three stacks in `tokens.json`.
- MUI sets every font weight to 400; the new scale needs 400 and 600.
- MUI buttons use a 50 px radius, which matches `radius.pill`.
- The `destructive` scale in `globals.css` is a neutral grey scale despite its name; errors use `extra_red`. The roles above name them for what they do.
- `general` and `extra` duplicate the `secondary` scale and have no role here.
- Active navigation currently uses Tailwind's `orange-500`, which is not a theme colour; it becomes `action.primary` with an underline, not colour alone.

## 3. Components

Drawn on Penpot page `06 Components`, once per theme. Every state listed is drawn.

| Component | Variants and states | Rules |
| --- | --- | --- |
| Button | Primary, secondary, text; default, hover, focus, disabled | 40 px tall, pill. One primary button per view. A button that opens another site says so in its label and carries the ↗ mark, with the destination and network named beneath |
| Form field | Default, focus, error, disabled | Label above, always visible. Error text sits under the field and says how to fix it; the outline thickens as well as changing colour |
| Search | Default | Pill, placeholder names what can be searched |
| Filter chip | Applied | Shows the filter and its value, with a remove control |
| Tabs | Selected, unselected | Selected is marked by weight and an underline, not colour alone |
| Status badge | Success, danger, neutral, warning, info | Always a word plus a mark. Used for Active, Retired, Not claimed, stale data, data source, "You delegate to this DRep" |
| Network label | Mainnet, Preview | Text pill beside the logo, as defined in the brand spec |
| Alert | Info, warning, danger, success | Title plus one sentence. Carries source and freshness messages |
| Table | Header, row, row with missing name | IDs and figures in the mono face. A missing name reads "No name provided" in secondary text |
| Pagination | Previous, pages, current, next | 40 px targets, with a text summary of page and page size |
| Menu | Default, selected item | 44 px rows |
| Modal | Confirmation | Title as a question, what changes, the network, primary action, cancel |
| Loading, empty, error | Skeleton, empty with a way forward, error with retry | Every data view uses these three |

Focus is a 2 px ring in `focus.ring`, offset 2 px, on every interactive component.

## 4. Shell

Drawn on Penpot page `07 Shell`, once per theme.

| Part | What is drawn |
| --- | --- |
| Header, 1280 px | Logo, network label, DReps · Proposals · Learn, language switch, theme switch, wallet, notifications. Signed out on mainnet; signed in on preview with an unread count |
| Header, 768 px | Logo, network label, Connect wallet, menu button |
| Header, 375 px | Logo, network label, menu button |
| Mobile menu, 375 px | Navigation in 48 px rows, language, theme, Connect wallet, external links |
| Language menu | English, Deutsch, Kiswahili, Tiếng Việt, 日本語, 简体中文, each in its own name |
| Account menu | My DRep profile, Claim or edit profile, Write a note, My voter page, Disconnect. Replaces the owner side bar (D8) |
| Notification drawer | Signed in with read and unread items, all read, signed out |
| Breadcrumbs | Links, with the current page as plain text |
| Header in six languages | The 1280 px header with navigation and wallet labels in each language |
| Footer, 1280 and 375 px | Stacked logo, Explore, Elsewhere (external, marked ↗), Project. Dark in both themes |

Behaviour:

- The selected navigation item is marked by an underline and weight.
- The header switches to the menu button below 1024 px.
- The language and theme switches show the current choice as text. A first visit follows the browser language and the system theme; the choice then persists. An unsupported language falls back to English.
- Unread notifications are marked with the word "Unread" and a bar, not by tint alone.

Open points:

- **Icons.** No icon set is chosen. The menu and notification buttons are placeholders. An icon set and its licence need a decision before the screens are final.
- **Copy.** All text on these boards is working copy. The German, Swahili, Vietnamese, Japanese and Chinese labels are unreviewed draft translations used to test length.
- **Footer wording.** The footer line and the "Project" links are placeholders to be confirmed.

## 5. Penpot source

| Board | Id |
| --- | --- |
| Foundations — colour roles | `9085d7ce-0f18-4189-aafb-79a3d72ab1dc` |
| Foundations — type scale | `68886f90-d1a7-4844-8546-e76203ea78a0` |
| Foundations — spacing, radius and grid | `b12675e5-c8fe-4149-a370-f65e2f97ca27` |
| Components — light | `1fe48323-f060-48c7-aec6-b3a7c03a322b` |
| Components — dark | `33c28c06-f2ea-4248-8437-7272958566a6` |
| Shell — light | `9c4b5da1-e587-4dd5-8c84-f2c32939ed84` |
| Shell — dark | `e9389c79-b17f-481d-b4d1-a6440c63dfb6` |

Page ids: `05 Foundations` `7ea5c827-a84b-421a-8f26-4df44445b5c9`, `06 Components` `2a7d01f3-dbd4-4552-bca6-e97e9a501ff3`, `07 Shell` `5699e559-4090-40a6-927e-6df463291b18`.

The component and shell boards are drawn shapes, not yet reusable Penpot components with variants; converting them is still to do.

The boards document the values. They are not yet Penpot colour styles, typographies or tokens; those are created with the component library.

## 6. What has and has not been checked

| Check | Result |
| --- | --- |
| Contrast of every text, control and status role in both themes | Calculated from the hex values; all meet their targets |
| Ada sign fallback | Noto Sans checked against the font file |
| Penpot boards written | Confirmed through the Penpot API: 3 boards, 313 objects |
| Colours judged by eye | Approved by Darlington from the foundation sheets, 15 November 2026 |
| Component and shell boards written | Confirmed through the Penpot API: 4 boards, 1,012 objects |
| Header fits at 1280 px in all six languages | Estimated from character counts: at least 340 px spare in every language. Not measured with the real fonts |
| Component and shell boards reviewed by eye | **Not done** |
| Penpot boards viewed as rendered | **Not done** |
| Type scale tested with real Japanese, Chinese and Vietnamese text in layouts | **Not done**; belongs with the shell and components |
