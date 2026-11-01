---
name: Meme City - Brainrot Escape
description: A deadpan municipal survival-horror escape game.
---

# Design System: Meme City - Brainrot Escape

## 1. Overview

**Creative North Star: "The Municipal Anomaly Office"**

A lone applicant is trapped in a windowless records office after midnight, reading impossible procedures while something moves between the desks. The interface behaves like the institution responsible for containing the anomaly: precise, unsympathetic, and convinced this is routine.

The visual direction combines Control's institutional unease, Papers, Please's procedural pressure, and the impersonal hierarchy of civic forms. Responsive motion communicates detection, authorization, and failure only. It never turns the run into a choreographed menu experience.

**Implemented stack:** TypeScript + Phaser 3.90 (Vite), 1152×720 canvas (FIT scale). All art is procedural — no image assets. Sprites are `Graphics.generateTexture` (`player` 30×30, `glancing-man` 44×56, `template-key` 24×24, `exit-door` 24×112, `pixel` 1×1) and the flashlight cone is a canvas radial gradient used as a RenderTexture mask.

**Key Characteristics:**
- Restrained institutional olive against near-black architecture
- Mono-forward administrative language (Courier New everywhere)
- Flat, rule-bound surfaces with minimal embellishment
- Motion reserved for changes the player must understand
- Accessibility controls presented as official run parameters

## 2. Colors

Resolution of the seed anchor oklch(0.300 0.071 120) into the sRGB olive chord below. Source of truth: `COLORS` in `src/theme.ts` (mirrored as OKLCH custom properties in `src/style.css` for the page shell).

### Core tokens

| Token | Hex | Use |
| --- | --- | --- |
| `void` | `#0B0C0B` | Screen frame, HUD bands, overlay backdrops, page shell |
| `floor` | `#151713` | Playfield carpet |
| `floorRaised` | `#1C1F19` | Furniture fills, raised floor variation |
| `floorLine` | `#2B3025` | 1px floor grid lines, stains' strokes |
| `wall` | `#363B30` | Room wall fill |
| `wallEdge` | `#59634A` | Wall trim, HUD divider rules |
| `ink` | `#E7EADF` | Primary reading text |
| `muted` | `#A4AA9A` | Secondary records, footers, decorative stencils |
| `olive` | `#738C50` | Authorization, titles, confirmed objectives, granted overlay |
| `oliveBright` | `#A4C477` | Olive emphasis (authorization flash, victory display) |
| `amber` | `#E0A34A` | Focus depletion, notices, caution hints |
| `red` | `#C45347` | Failure, containment breach, not-authorized door |
| `paper` | `#B9B9A7` | Scattered records on the floor |

### Named Rules

**The Rare Authorization Rule.** Olive occupies no more than ~10% of the playfield and HUD. It marks actionable or confirmed information, never general decoration.

**The One-Light Rule.** The room is near-black; the only luminous shape is the player's gaze cone plus a small ambient radius around the player (224px). Everything else vanishes into the `void` darkness layer at depth 12.

**Status-color pairing.** Every status color carries a text label (`OBSERVED — HOLDING`, `UNOBSERVED — MOVING`, `INTAKE TRIAL — HOLDING`). Color never carries a rule alone.

## 3. Typography

**Single family:** `"Courier New", Courier, monospace` (`FONT_FAMILY` in theme). Hierarchy comes from size, weight, opacity, and case — not additional families.

### Actual sizes (Phaser text styles in `Hud.ts` / `Room.ts`)

| Rank | Size | Usage |
| --- | --- | --- |
| Display (outcome titles, briefing headline) | 22–44px | Bold + per-line letter-spacing/size args |
| Ink (FORM 27-B header, body instructions) | 18px | Regular, upper case |
| Notice (in-room ticker) | 15px | Regular |
| Label (default HUD style) | 12px | Regular, upper case, keeper of meters and status lines |
| Fine print (procedure line, footer hints, floor stencils) | 10–11px | Regular, upper case |

Meters use ASCII blocks (`EYE CONTACT [====----]`) rather than progress bars — the meter is part of the record, not the chrome.

## 4. Elevation

The system is flat. Depth comes from Phaser render depth bands, not shadows:

| Depth band | Contents |
| --- | --- |
| 0–6 | Floor grid, stains, papers, stencils; exit-door panel (5), entities (6) |
| 11 | Floor stencils and room signage text |
| 12–13 | Lighting — darkness RenderTexture (12), grain TileSprite (13) |
| 14 | Template key pickup float |
| 25–31 | HUD — void bands (25), divider rules (25), text (30), notices (31) |
| 50–52 | Overlays — backdrop fill 0.92 (50), overlay container (51), overlay text (52) |

Overlays separate themselves with a solid `void` backdrop at 0.92 opacity and a divider rule — no blur, no glass.

## 5. Components

| Component | Purpose | Key tokens |
| --- | --- | --- |
| **Top band** (depth 25) | Void band + two 1px `wallEdge@0.7` rules bound the record — header, objectives, timer, key status, procedure line, enemy status, eye meter | `void`, `wallEdge`, `ink`, `muted` |
| **Objective record** (top-left) | Numbered list; collected key flips to `TEMPLATE KEY POSSESSED` | `ink`, `muted` |
| **Status line + eye meter** (top-right / center) | Enemy state sentence and `EYE CONTACT [====----]` | text color per state (`muted`/`amber`/`red`) |
| **Notices** (bottom ticker, depth 31) | One-line procedural notices ("INTAKE CLOSED.", "AUTHORIZATION UPDATED.") | `amber` / `olive` |
| **Run-parameter panel** (briefing/pause overlay) | Settings listed as filed parameters `[1]–[4]`, mirrored in the footer | `ink` |
| **Outcome overlay** | `ACCESS GRANTED` (oliveBright) vs `CONTAINMENT FAILURE` (red), filing time, `R — NEW RUN` | `oliveBright`, `red`, `amber` |
| **Exit door** | Recessed wall panel; red until authorized; olive `AUTHORIZED` stencil + door-piece glow when the key is held | `red`, `olive`, `oliveBright` |
| **Glancing Man** | 44×56 silhouette with a single pale eye — brightens when unobserved | `void`, `ink` |

## 6. Accessibility & Parameters

| Parameter | Key | Values | Default |
| --- | --- | --- | --- |
| Pressure | `1` | story (52px/s, 8s to blink) / standard (78px/s, 5.5s) / relentless (106px/s, 4s) | standard |
| Reduced motion | `2` | off (camera shake, 0.32s blink hold, moving grain) / on (no shake, 0.16s blink hold, still grain) | matches OS `prefers-reduced-motion` |
| Flash intensity | `3` | full / low / off | full |
| Screen effects | `4` | on / off | on |

All four cycle anywhere in play, appear in the pause overlay, and are permanently summarized in the footer (`PRESSURE STANDARD MOTION FULL FLASH FULL FX ON`).

## 7. Do's and Don'ts

### Do:

- **Do** keep the playfield dominant and make every persistent label useful to the current run.
- **Do** pair every gameplay color with text, shape, or motion so no rule depends on color alone.
- **Do** provide reduced motion, enemy-pressure, screen-effects, and flash-intensity controls.
- **Do** make administrative messages brief, deadpan, and immediately actionable.

### Don't:

- **Don't** use cartoon meme collage or comedy-game presentation.
- **Don't** use grungy VHS as a blanket aesthetic or familiar horror-game HUD clichés.
- **Don't** copy Five Nights at Freddy's jump-scare-first pacing or animatronic character presentation.
- **Don't** use excessive jump scares, glitch effects that obscure play, or decorative interface complexity.
- **Don't** add glassmorphism, gradient text, colored side-stripe borders, or ornamental card grids.
