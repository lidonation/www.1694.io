# UI/UX 02 — Brand and logo

| | |
| --- | --- |
| Ticket | [#236](https://gitlab.2lovelaces.io/voltaire/www.1694.io/-/work_items/236) |
| Status | **Approved by Darlington on 15 November 2026**: direction (Ledger), typeface (set B) and the developed family below. The checks listed as not done in section 10 remain open |
| Brief | [`01-redesign-brief.md`](https://gitlab.2lovelaces.io/voltaire/www.1694.io/-/merge_requests/519), section 6 and decisions D4, D6, D7 |
| Penpot | File [1694.io 2.0](https://penpot.2lovelaces.io/?screen=workspace&team-id=d80f2735-27cc-8194-8008-648e6a3bb597&project-id=c3a5d485-2367-8175-8008-649c955fd040&file-id=567e025f-9099-812e-8008-f346ae1e37b3) (`567e025f-9099-812e-8008-f346ae1e37b3`), revision 5 |
| Exports | [`assets/brand/`](assets/brand/) |

Design-only. Nothing here changes application code; replacing the files the site uses today is implementation work.

## 1. Direction

1694.io is an independent public record of Cardano's representatives. The identity is civic and archival: a register, not a wallet. Three directions were explored (Penpot page `03 Logo directions`: Ledger, Bookplate, Citation). **Ledger** was chosen: the numerals 1694 standing on a ruled line, like an entry in a register.

## 2. The family

| Piece | What it is | Use it for |
| --- | --- | --- |
| **Wordmark** | `1694` in Source Serif 4 Semibold, `.io` smaller in Source Sans 3, on the ledger rule: a short thick accent segment, then a thin rule to the end | Primary logo. Header, documents, social cards |
| **Stacked** | `16` over `94.io`, left-aligned, on the same rule | Narrow or square spaces, footer |
| **Symbol** | `16` over `94` in white on a blue rounded tile, with the rule beneath | App icon, avatar, any square slot of 48 px or more |
| **Small symbol** | The same tile with larger numerals and no rule | Favicon and anything under 48 px |

The wordmark is the logo. The symbol never sits beside the wordmark, since both spell the same numerals.

All marks are drawn as outlines, so they do not depend on a font being installed.

Proportions, in units of the numeral type size S: numeral height 0.653 S; `.io` set at 0.6 S; accent segment 0.5 S wide and 0.075 S thick, 0.13 S below the baseline; thin rule 0.035 S thick, centred on the accent segment. The wordmark is 3.04 times as wide as it is tall. The tile's corner radius is 18% of its side.

## 3. Colour

| Role | Light | Dark | Used for |
| --- | --- | --- | --- |
| Ink | `#0B1430` | `#EEF1F8` | Numerals, thin rule |
| Brand blue | `#0033AD` | `#8FB0FF` | `.io`, symbol tile (the tile stays `#0033AD` in both themes) |
| Accent orange | `#FF640A` | `#FF8A47` | Accent segment of the rule |
| Surface | `#FFFFFF` | `#0B1020` | Background the logo was drawn for |

Brand blue `#0033AD` and accent orange `#FF640A` are the site's existing primary and secondary colours. Ink, the dark values and the dark surface are new and are proposals for #237 to adopt or adjust.

Contrast ratios, calculated from the hex values:

| Pair | Ratio |
| --- | --- |
| Ink on light surface | 18.2 : 1 |
| Brand blue on light surface | 10.1 : 1 |
| Ink on dark surface | 16.7 : 1 |
| Brand blue (dark value) on dark surface | 8.9 : 1 |
| Accent on dark surface | 8.1 : 1 |
| Accent on light surface | 3.0 : 1 |
| White numerals on the tile | 10.1 : 1 |
| Tile against the dark surface | 1.9 : 1 |

Two things follow. The orange accent on white is 3.0 : 1, which is enough for the decorative rule but not for text, so orange is not a text colour on light surfaces. The blue tile is faint against the dark surface; its white numerals carry it, and inside the dark-theme interface the wordmark is used, not the tile.

One-colour versions (all black, all white) exist for print, stamps and single-colour contexts. In the one-colour symbol the numerals are cut out of the tile.

## 4. Typeface

| Role | Face | Licence |
| --- | --- | --- |
| Headings, logo numerals | Source Serif 4 | SIL Open Font License 1.1 (Adobe) |
| Interface | Source Sans 3 | SIL Open Font License 1.1 (Adobe) |
| IDs and figures | Source Code Pro | SIL Open Font License 1.1 (Adobe) |
| Japanese | Noto Serif JP (headings), Noto Sans JP (interface) | SIL Open Font License 1.1 (Google) |
| Simplified Chinese | Noto Serif SC (headings), Noto Sans SC (interface) | SIL Open Font License 1.1 (Google) |

Coverage was checked against the font files: the Source faces contain the German and Vietnamese characters tested (including the full set of Vietnamese tone-marked vowels), and Swahili needs only basic Latin. Poppins, the current face, fails Vietnamese, Japanese and Chinese.

**Open point for #237:** none of these faces contains the ada sign (₳, U+20B3). The design system must name a fallback for that one character. Inter contains it.

The logo outlines were generated from Source Serif 4 (weight 600, optical size 60) and Source Sans 3 (weight 400). The OFL places no restriction on artwork made with the fonts.

## 5. Network label

Mainnet and preview are shown by a text label beside the logo and are never part of the logo. The label is a pill with the word **Mainnet** or **Preview** in Source Sans 3 Semibold. Mainnet is outlined in ink. Preview is filled with an orange tint and outlined in the accent colour. The word is always present, so the network is readable without colour and by a screen reader.

## 6. Clear space and minimum size

- **Clear space:** half the height of the numerals, on every side.
- **Wordmark:** at least 24 px tall on screen (73 px wide). Below that the thin rule is under one pixel.
- **Stacked:** at least 48 px tall.
- **Symbol:** 48 px and up. Under 48 px use the small symbol, down to 16 px.

These minimums are calculated from the geometry. They have not been judged by eye on real screens; see section 10.

## 7. Misuse

Do not stretch or squash the logo. Do not recolour the numerals or the `.io`. Do not remove the rule. Do not place it where it cannot be read; use the dark or white version on dark backgrounds. Do not set the name in another typeface. Do not build the network name into the mark. Do not pair it with the GovTool mark as if they were one logo.

## 8. Exports

In [`assets/brand/`](assets/brand/). SVGs are the masters; PNGs are transparent and cropped tight to the artwork with no padding, so apply the clear space in layout. The number in a PNG name is its width in pixels.

| File | Contents |
| --- | --- |
| `1694-wordmark-{light,dark,black,white}.svg`, `-800.png`, `-400.png` | Wordmark. `light` is for light backgrounds, `dark` for dark backgrounds |
| `1694-stacked-{light,dark,black,white}.svg`, `-600.png` | Stacked form |
| `1694-symbol.svg`, `-512`, `-192`, `-180`, `-96`, `-48.png` | Symbol in colour. 180 is the Apple touch icon size |
| `1694-symbol-{black,white}.svg`, `-512.png` | One-colour symbol, numerals cut out |
| `1694-symbol-small.svg`, `-32`, `-24`, `-16.png` | Small symbol |
| `1694-symbol-small-{black,white}.svg` | One-colour small symbol |
| `favicon.ico` | Small symbol at 16, 24 and 32 px |
| `build_logo.py` | Script that generated the outlines, exports and Penpot boards. Needs the two variable fonts from Google Fonts in `./fonts` |

## 9. Penpot source

Page `04 Logo family (Ledger)`, id `cc4a7e25-b5e9-4c12-aa90-78cf614c4c0e`.

| Board | Id |
| --- | --- |
| Ledger — logo family | `5f5b0354-46de-49b5-8ceb-720f3a7b8ad8` |
| Ledger — clear space and minimum size | `7d2c955d-5544-4315-ba88-437fb21343c5` |
| Ledger — colour, type and network label | `5f358e38-19a5-4758-aa28-f6f395f52b0f` |
| Ledger — misuse | `03df0fd5-4e4e-4d80-aa3e-27d54a830df6` |
| Ledger — in use | `bab44894-8c2c-4c6d-95f0-bcb2412b3dc4` |

The "in use" board shows the logo in a desktop header in light with the mainnet label and in dark with the preview label, a 375 px mobile menu, a footer, a browser tab at 16 px and a 96 px app icon. The marks on these boards are vector shapes, not yet Penpot components; #237 turns them into library components.

## 10. What has and has not been checked

| Check | Result |
| --- | --- |
| Glyph coverage of the chosen faces | Checked against the font files |
| Contrast ratios | Calculated from the hex values |
| SVG exports contain no live text | Checked: all 14 are outlines only |
| PNG exports are the stated sizes, non-empty and uncropped | Checked by measurement |
| Penpot boards written | Confirmed through the Penpot API: 5 boards, 228 objects |
| Visual review of the marks at real sizes, especially the favicon at 16 px | **Not done.** Nobody has looked at these yet. The marks were built and checked by geometry, not by eye |
| Penpot boards viewed as rendered | **Not done.** Penpot's export does not accept an access token |
| Distinctiveness against GovTool, Cardano and Intersect marks | **Not done.** Needs a person to compare them side by side |
| Trademark or prior-use search for the mark | **Not done** |

## 11. Legacy marks superseded

Once this identity is implemented, these stop being used as the 1694.io logo:

- `frontend/public/img/logos/mainnet-black.png`, `preview-black.png`, `sancho-black.png`, `voltaire-black.png`: the network-specific header logos, replaced by the wordmark plus the network label
- `frontend/public/img/logos/govtool-white.png` as used in the footer, and `frontend/public/svgs/govtool-1694-white.svg`
- `frontend/public/img/sancho-logo.png`, `frontend/public/svgs/sanchoapplogo.svg`
- `frontend/src/app/favicon.ico`

`govtool-logo.png`, `cardano-logo.png`, `intersect-logo.png` and `lido-logo.png` stay: they identify other organisations where the site links to them.
