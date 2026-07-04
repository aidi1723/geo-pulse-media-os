# GEO-Pulse Design Brief

## Design Intent

- Product archetype: React operations dashboard for AI-assisted media matrix workflows.
- Primary use cases: monitor daily workflow health, select topics, generate copy, schedule distribution, review task artifacts, and audit account risk.
- Overall mood: focused, premium, and operational; rich enough for a product demo without becoming decorative.
- Keywords: command center, warm editorial surfaces, precise task control, calm automation.
- Non-goals: marketing landing page, playful illustration system, dense enterprise admin template.
- Best-fit screens: desktop and tablet dashboards first, with a usable single-column mobile fallback.

## Color System

- Background: warm off-white canvas with subtle depth.
- Background alt: slightly deeper warm band for app chrome.
- Surface: translucent warm white for panels and cards.
- Surface elevated: solid warm white for focused controls and content containers.
- Primary text: deep brown-black.
- Secondary text: muted warm gray-brown.
- Accent: burnt orange for primary commands and key moments.
- Accent contrast: warm white.
- Border: low-opacity brown.
- Success: teal.
- Warning: muted gold.
- Danger: burnt red.

Use accent sparingly for primary actions and critical highlights; use teal for health, progress, and selected operational states.

## Typography

- Sans family: system UI with PingFang SC and Microsoft YaHei fallbacks.
- Display family: Avenir Next or the same system stack.
- Mono family: SFMono-Regular, Consolas, monospace.
- Display style: compact, confident, and dashboard-scale.
- Heading style: direct, medium-heavy, no negative letter spacing.
- Body style: readable Chinese line height with muted secondary copy.
- Label style: small, uppercase only for eyebrows and system metadata.
- Tracking and casing rules: no negative tracking; use uppercase only for short metadata labels.

## Layout and Spacing

- Max content width: fill the app shell; keep internal panels constrained by grid columns.
- Grid or column pattern: persistent left navigation on desktop, main content plus right rail, single-column on smaller screens.
- Section spacing: 20-28px between major regions.
- Component spacing: 10-18px inside compact controls, 18-24px inside cards and panels.
- Preferred density: dashboard-like, moderately roomy, optimized for scanning repeated work.
- Mobile behavior: collapse shell, hero, studio, task board, and history into single-column sections with preserved tap targets.

## Shape and Surface

- Corner radius: 12-22px for operational components; avoid excessive pill shapes outside chips and badges.
- Border style: one-pixel low-contrast borders for most surfaces.
- Shadow style: soft warm shadow only on elevated cards and active selections.
- Blur or glass usage: restrained backdrop blur on the shell and major panels only.
- Texture, grain, or gradient usage: subtle gradients are allowed on background and primary buttons; avoid decorative orbs.

Elevation should clarify hierarchy. Repeated list rows and controls should stay flatter than panels.

## Components

### Buttons

- Default button: warm white surface, subtle border, clear hover and focus states.
- Primary button: orange gradient, warm white text, disabled state visibly muted.
- Secondary button: same as default with lower emphasis.
- Destructive button: use danger border/text if introduced.
- Hover and active feel: crisp 160-180ms movement; no layout shift.

### Inputs

- Input shell: warm white fill, 1px border, 14-16px radius.
- Focus treatment: visible teal outline and border.
- Placeholder tone: muted and instructional.
- Error state: danger border plus text message, not color alone.

### Cards and Panels

- Card background: translucent warm white.
- Border and shadow: shared semantic border and shadow tokens.
- Internal padding: 18-24px.
- Title and meta styling: titles compact and strong; metadata muted and smaller.

### Navigation

- Header or sidebar style: warm translucent sidebar, compact nav rows.
- Active state: light elevated surface with accent border and shadow.
- Divider usage: use borders only where they separate app regions.

### Tables, Lists, and Data

- Row density: compact but readable.
- Header treatment: small strong headings.
- Selection style: teal border and soft shadow.
- Empty state tone: concise and operational.

## Motion

- Transition speed: 160-240ms.
- Easing feel: soft but restrained.
- Reveal patterns: subtle fade and upward movement for panel changes.
- Hover energy: small lift on primary commands only.
- Loading tone: disable active controls and keep labels explicit.

## Content Tone

- Sentence case or title case: Chinese UI labels stay concise; English metadata can use title case when product-specific.
- Label tone: direct operational nouns.
- Empty state tone: brief next-action hint.
- Error tone: state what is unavailable and how to recover.
- CTA tone: command-oriented, such as "执行", "刷新", "创建", "回到".

## Implementation Notes

- Preferred token layer: CSS variables in `src/styles.css`.
- CSS variable naming: semantic roles such as `--bg`, `--panel`, `--accent`, `--border`, `--focus`.
- Tailwind or theme mapping: not used in this project.
- Things to avoid: page-local raw colors when a token exists, nested card stacks, text overlap, one-off mobile fixes that bypass shared layout.

## Do / Do Not

- Do keep the right rail scannable and action-oriented.
- Do fix repeated visual issues through shared tokens and component classes.
- Do preserve current routing, mock API behavior, and information architecture.
- Do not turn the dashboard into a landing page.
- Do not add heavy animation or decorative assets that distract from operational status.
