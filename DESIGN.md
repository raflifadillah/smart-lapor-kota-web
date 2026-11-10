---
name: smart-lapor-kota-civic-tech-design
description: Design skill for Smart Lapor Kota, a mobile-first civic incident reporting and smart-city operations platform. Use when designing or refining citizen reporting, field crew task boards, work verification, government administration dashboards, GIS maps, incident tables, status tracking, notifications, and responsive civic-service interfaces. Follow the visual system and interaction patterns extracted from the supplied HTML/Tailwind source.
---

# Smart Lapor Kota — Design Skill

## 1. Purpose and product character

Smart Lapor Kota is a civic technology interface for reporting damage to public infrastructure and coordinating its resolution. The supplied implementation presents three connected role experiences:

1. **Citizen / Warga Incident Reporter** — citizens submit reports with a category, precise location, photo evidence, description, anonymity preference, and notification preferences. They can track progress and communicate with officers.
2. **Field Crew / Petugas Lapangan Task Board** — field teams review assigned tasks, understand urgency, update availability, upload after-work evidence, enter materials and notes, and submit official verification.
3. **Government Admin Dashboard GIS** — administrators monitor report volume and operational status, inspect incident locations on a GIS map, filter and manage incident records, and monitor SLA, broadcasts, and field-unit mobilization.

The experience should feel like a reliable public-service utility: official, calm, precise, transparent, and easy to use in the field. Avoid making it look like a generic social app or a dense enterprise ERP.

### Core design principles

- **Action first:** make the next useful action obvious for each role.
- **Location is essential:** show coordinates, landmarks, maps, and location confidence where relevant.
- **Evidence builds trust:** make photo evidence and before/after comparisons prominent.
- **Status must be legible:** distinguish submitted, assigned, in progress, and resolved states consistently.
- **Operational clarity:** prioritize urgent cases and field-team actions over decoration.
- **Mobile-first citizen experience:** reporting should work comfortably on a phone.
- **Dense but structured administration:** use clear hierarchy, filters, tables, and map overlays for operators.
- **Transparent communication:** make notification channels, timestamps, and update history visible.

## 2. Visual identity

### Overall visual language

Use a cool, light interface with deep navy as the institutional anchor, blue as the main interactive accent, and green as the positive/action-complete accent. The background is a very light blue-white. Cards are predominantly white or pale blue surfaces with rounded corners and subtle shadows.

The visual style is modern Material-inspired civic technology:
- Rounded cards and controls.
- Restrained shadows rather than heavy borders.
- Clear typographic hierarchy.
- Small uppercase labels for metadata and section context.
- Material Symbols Outlined icons.
- Compact status chips and data labels.
- Soft blue surface layers to separate sections without excessive lines.

Do not replace the navy-blue identity with the teal/green palette of an unrelated product. Green is a supporting status/action color, not the primary brand color.

## 3. Design tokens

The following values are extracted from the Tailwind configuration in the supplied source. Use them as the baseline tokens.

### 3.1 Color palette

| Token | Hex | Intended use |
|---|---:|---|
| `primary` | `#00152F` | Main institutional navy, primary text on light surfaces, main CTA |
| `primary-container` | `#0F2A4A` | Dark header, hero banner, dark emphasis surfaces |
| `on-primary` | `#FFFFFF` | Text/icons on primary |
| `on-primary-container` | `#7A92B7` | Muted text/icons on dark primary container |
| `primary-fixed` | `#D4E3FF` | Pale blue emphasis surface |
| `primary-fixed-dim` | `#B0C8F0` | Muted blue accent |
| `secondary` | `#32618E` | Main blue interactive accent, links, active controls |
| `secondary-container` | `#9ECAFD` | Soft blue emphasis and status backgrounds |
| `on-secondary` | `#FFFFFF` | Content on secondary |
| `secondary-fixed` | `#D0E4FF` | Selected filter/chip background |
| `secondary-fixed-dim` | `#9ECAFD` | Secondary accent |
| `on-secondary-fixed` | `#001D35` | Text on pale secondary surfaces |
| `on-secondary-fixed-variant` | `#144975` | Secondary text on pale surfaces |
| `tertiary` | `#00190E` | Deep green emphasis |
| `tertiary-container` | `#00301E` | Green success/verified surfaces |
| `tertiary-fixed` | `#6FFBBE` | Bright positive indicator |
| `tertiary-fixed-dim` | `#4EDEA3` | Green icon and completion accent |
| `on-tertiary` | `#FFFFFF` | Content on tertiary |
| `on-tertiary-container` | `#00A472` | Green text/accent on pale backgrounds |
| `background` | `#F8F9FF` | App/page background |
| `surface` | `#F8F9FF` | Default surface |
| `surface-bright` | `#F8F9FF` | Bright surface |
| `surface-container-lowest` | `#FFFFFF` | Cards and elevated white panels |
| `surface-container-low` | `#EFF4FF` | Soft section backgrounds, form fields |
| `surface-container` | `#E5EEFF` | Neutral chips and nested surfaces |
| `surface-container-high` | `#DCE9FF` | Secondary surface emphasis |
| `surface-container-highest` | `#D3E4FE` | Stronger surface contrast |
| `surface-variant` | `#D3E4FE` | Variant surface |
| `surface-dim` | `#CBDBF5` | Dimmed surface |
| `on-surface` | `#0B1C30` | Main text |
| `on-surface-variant` | `#43474E` | Supporting text |
| `outline` | `#74777F` | Input and component outlines |
| `outline-variant` | `#C4C6CF` | Subtle dividers and borders |
| `error` | `#BA1A1A` | Critical errors and emergency actions |
| `error-container` | `#FFDAD6` | Soft error/emergency background |
| `on-error` | `#FFFFFF` | Text/icons on error |
| `on-error-container` | `#93000A` | Text on error container |
| `inverse-surface` | `#213145` | Inverse/dark notification surface |
| `inverse-on-surface` | `#EAF1FF` | Text on inverse surface |
| `surface-tint` | `#485F82` | Surface tint |
| `inverse-primary` | `#B0C8F0` | Primary accent on inverse surface |

**Additional operational colors visible in the UI:**
- WhatsApp green: `#25D366`; dark WhatsApp green: `#075E54`; alternate green: `#128C7E`.
- Amber/yellow is used to distinguish medium-priority or warning GIS markers.
- Red is used for critical/high urgency and emergency.
- Blue is used for general/in-progress spatial markers.
- Emerald/green is used for completed/resolved states.

These operational colors should be accompanied by labels or icons; never communicate severity by color alone.

### 3.2 Typography

Use two font families, matching the source:

- **Plus Jakarta Sans:** display, headings, body copy, and most descriptive content.
- **Inter:** labels, compact metadata, small uppercase text, and tabular/code-like values.

| Style | Size / line height | Weight | Use |
|---|---|---:|---|
| Display large | 44 / 52 px | 800 | Large desktop hero metric or page statement |
| Display mobile | 32 / 40 px | 800 | Mobile display heading |
| Headline XL | 32 / 40 px | 700 | Main page title |
| Headline XL mobile | 26 / 34 px | 700 | Mobile page title |
| Headline large | 24 / 32 px | 700 | Major section heading |
| Headline medium | 20 / 28 px | 600 | Card title / subsection |
| Headline small | 16 / 24 px | 600 | Compact card title |
| Body large | 18 / 28 px | 400 | Introductory paragraph |
| Body medium | 15 / 24 px | 400 | Form content and standard body |
| Body small | 13 / 20 px | 400 | Supporting details |
| Label medium | 13 / 18 px | 600 | Field labels and buttons |
| Label small | 11 / 16 px | 600 | Status metadata and timestamps |
| Tabular code | 13 / 18 px | 500 | Ticket IDs, coordinates, numeric metadata |

Use tabular numerals for IDs, coordinates, counts, and timestamps where possible. Avoid long all-caps text. Uppercase labels should be short and used sparingly.

### 3.3 Spacing

The source defines the following spacing scale:

| Token | Value |
|---|---:|
| `space-xs` | 4 px |
| `space-sm` | 8 px |
| `space-md` | 16 px |
| `space-lg` | 24 px |
| `space-xl` | 40 px |
| `gutter-mobile` / `margin-mobile` | 16 px |
| `gutter` | 24 px |
| `margin` | 32 px |

Use 16 px horizontal margins on mobile. For larger screens, expand content gutters to approximately 24–32 px while maintaining a readable maximum content width.

### 3.4 Shape and elevation

- Default radius: 4 px.
- Large radius: 8 px.
- Extra-large radius: 12 px.
- Main card radius: commonly 16 px (`rounded-2xl`).
- Pill radius: fully rounded.
- Use soft shadows for cards, floating headers, and elevated CTAs.
- Use borders in `outline-variant` or `surface-container` only when a surface needs separation.
- Avoid stacking multiple heavy shadows or thick borders.

## 4. App shell and navigation

### 4.1 Shared mobile shell

The source uses a mobile-tab application shell:
- Fixed top header with dark navy background and slight transparency/blur.
- Header height around 64 px, plus safe-area inset.
- Main content scrolls beneath the header.
- Fixed bottom navigation with translucent light surface and blur.
- Bottom safe-area padding must be respected.
- Main content reserves bottom space so it is not obscured by navigation.

Header contents:
- Product emblem/logo.
- Small uppercase descriptor: `Smart City Civic Reporter`.
- Product title: `Smart Lapor Kota`.
- Notification action with unread indicator.
- User avatar/profile action.

Keep header labels compact and truncate gracefully on narrow devices.

### 4.2 Citizen bottom navigation

The citizen experience uses four primary destinations:
1. **Lapor Warga** — create or access citizen reports.
2. **Tugas Lapangan** — field task area when the role is authorized.
3. **Riwayat** — submitted report history.
4. **Profil** — user profile and preferences.

Use a clear active state: primary navy icon/text and stronger weight. Inactive destinations use `on-surface-variant`. Each item should have an icon and a short text label. Touch targets should be at least 44 × 44 px.

### 4.3 Role-aware navigation

Do not show every operational destination to every user by default. Keep the information architecture role-aware:
- Citizen: report, tracking/history, profile, notifications.
- Field crew: task board, task detail/verification, profile/status.
- Government administrator: overview, GIS, incident management, operations/broadcast, reports/settings.

The exact desktop navigation structure is not fully specified by the supplied code; preserve the role separation rather than inventing unnecessary destinations.

## 5. Citizen experience: report and track incidents

### 5.1 Greeting and emergency hotline

The citizen home starts with:
- A compact `Layanan Aktif 24/7` indicator.
- Friendly greeting: `Halo, Warga Peduli Kota!`
- A short explanation encouraging precise public-facility reports.
- A visible emergency hotline card for `Panggilan Darurat Siaga 112`.

Emergency callout design:
- Soft red background (`error-container` with transparency).
- Strong red icon block and call button.
- Clearly show hotline number and responsible service.
- Use a direct `tel:` action when supported.
- Keep emergency actions visually distinct from ordinary report submission.

Do not make the emergency hotline look like a standard low-priority link.

### 5.2 Incident tracker card

The report tracker is a central trust-building component. Include:
- Report/ticket ID (example format: `#LAP-2026-0882`).
- Incident category chip.
- Short incident title.
- Submission date/time.
- Current status chip.
- A vertical four-stage progress stepper.
- Latest field update and expected next step where available.
- Direct contact action for the responsible officer.

The demonstrated status sequence is:
1. **Diajukan** — report received and queued.
2. **Disposisi Resmi** — assigned to the responsible agency/team.
3. **Diproses Lapangan** — field team is handling the incident.
4. **Verifikasi Selesai** — repair completion is checked and documented.

Stepper states:
- Completed: green/dark-green circle with check icon.
- Current: blue circle with active/progress icon and stronger text.
- Pending: muted surface circle and reduced emphasis.
- Connect steps visually with a vertical guide line.
- Put timestamps at the right when space allows; wrap on narrow screens.
- Add one concise explanation under each step.

Do not imply a report is complete before the verification stage has actually been reached.

### 5.3 Notification and WhatsApp/SMS status

The tracker can show:
- Automatic notification status.
- Masked phone number.
- Live-sync state.
- Delivery log with channel and timestamp.
- Enabled channel chips for WhatsApp and SMS.
- Two-way WhatsApp survey/feedback card.

For channel indicators:
- Use WhatsApp green for WhatsApp-specific UI.
- Use blue for SMS.
- Include text such as `Aktif`, `Terkirim`, or `Gagal`, not color alone.
- Keep phone numbers masked in overview contexts.
- Show precise timestamps in logs.

Feedback pattern:
- Ask a single clear question.
- Offer compact rating choices (1–5 stars).
- Provide a separate free-text/reply action.
- Explain that responses are archived to the report/ticket when that is truly supported by the product.

### 5.4 New report hero CTA

Use a prominent dark navy card to introduce the reporting action:
- Small badge such as `Respon Cepat Warga`.
- Clear title: `Laporkan Kerusakan Fasilitas Publik`.
- One-sentence instruction: take a photo and mark the GPS point.
- Photo/report icon in a translucent tile.
- Contrasting blue action button that scrolls to or opens the form.

Keep the CTA concise and action-oriented.

### 5.5 Incident reporting form

The form is a structured, guided flow. Preserve this order:

**A. Category selection**
- Use selectable chips rather than a long dropdown when the number of categories is small.
- Categories shown in the source:
  - Jalan Berlubang
  - PJU Padam
  - Drainase & Banjir
  - Taman & Fasilitas Anak
  - Rambu Lalu Lintas Rusak
- Selected chip: dark navy background, white text, green-tinted selected icon.
- Unselected chip: pale blue surface, dark text, blue icon.
- Selection must be exclusive and visually obvious.

**B. GPS location**
- Label the coordinate/location field clearly.
- Show GPS state (e.g. `GPS Aktif`) as a compact chip.
- Use a map card with a visible incident pin.
- Show latitude and longitude in a compact overlay.
- Show location accuracy when available.
- Provide a `Gunakan Lokasi Presisi Saat Ini` action.
- Provide a landmark/description field such as “Depan halte bus, dekat persimpangan”.
- Do not fabricate coordinates or GPS accuracy. Use explicit loading, denied, unavailable, or error states when location cannot be obtained.

**C. Photo evidence**
- Allow up to three photos in the source design.
- Show accepted file types and maximum count.
- Use thumbnail previews with image crop (`object-cover`).
- Overlay file size and short photo description.
- Place a clear remove action on each thumbnail.
- Show an add-photo tile with camera icon and a short hint for another angle.
- Explain timestamp/EXIF geolocation only if the implementation actually records it and the user has consented where required.
- Provide file validation and upload error feedback.

**D. Incident description**
- Use a multi-line textarea.
- Show a live character counter with a 500-character maximum in the demonstrated implementation.
- Use a clear prompt encouraging a factual description: what happened, exact location/landmark, danger, and time/context.
- Keep the counter visible but secondary.

**E. Anonymity and contact preferences**
- Provide a clear anonymity toggle with a privacy icon and short explanation.
- Do not imply complete anonymity if technical or legal records can still identify a user; explain the actual privacy behavior.
- Provide a WhatsApp/SMS phone field when contact updates are enabled.
- Show verification status only after real verification.
- Use separate checkboxes for:
  - Automatic status updates via WhatsApp/SMS.
  - Follow-up survey and two-way WhatsApp dialogue.
- Explain why the phone number is requested and how it will be used.

**F. Submit**
- Use a full-width primary button.
- Use a send icon and direct action wording.
- Add one concise helper line describing where the report goes.
- On submit, show a loading state, prevent duplicate submission, validate required fields, and present a clear success/error result.
- A success state should show the report ID and next steps; do not rely only on a generic browser alert.

### 5.6 Citizen impact metrics

The home page can include two compact impact cards:
- Total completed reports.
- Average response time.

Use a simple icon tile, short label, and prominent numeric value. Numbers should be sourced from real system data. Do not use decorative charts when two values are enough.

### 5.7 Civic footer

The footer presents institutional trust:
- Government / PUPR identity.
- University or research partner identity when applicable.
- Copyright and platform context.
- Small icon badges.
- Subtle divider and centered copyright text.

Keep partner marks balanced; do not make institutional credits compete with the reporting action.

## 6. Field crew experience: task board and verification

### 6.1 Crew status bar

The field crew home begins with an identity/status card:
- Role label: `Petugas Lapangan Pemda`.
- Team/agency name (example: `Regu Alfa 03 • Dinas PUPR`).
- Availability state such as `Siaga Aktif`.
- Compact operational metrics below the identity row.

Status should be easy to understand and change. Use green for active/available and a neutral or warning treatment for unavailable/busy states. A status action must provide feedback and update the displayed state.

### 6.2 Filters and task feed

Use compact filter pills above the task list. They should allow field personnel to quickly narrow assignments by status, urgency, or category when those filters are available.

Task cards should surface, in order:
1. Priority/severity.
2. Incident title.
3. Report ID and time/location metadata.
4. Category and current task status.
5. Reporter verification indicator when relevant.
6. Evidence thumbnail.
7. Primary action.

The source includes examples:
- High urgency: pothole hazard.
- Medium urgency: streetlight/PJU issue.
- Resolved task: drainage cover.

Use a consistent card structure but vary severity treatment:
- Critical/high: red accent or red chip.
- Medium: amber accent/chip.
- In progress/general: blue accent.
- Resolved: green accent/chip.

Do not use full-card red backgrounds. Keep the title and key details readable.

### 6.3 Task actions

The main action should match the current task state, for example:
- View details.
- Start/continue handling.
- Upload completion evidence.
- Verify/submit work.

Use one visually dominant CTA per card and secondary actions as text or outlined buttons. Avoid presenting multiple equally prominent actions.

### 6.4 Work verification modal / bottom sheet

The source includes an interactive verification modal/slide-up sheet. It should contain:

- Modal header with incident title/ID and close control.
- Scrollable modal body.
- Before/after evidence comparison grid.
- Before image card (existing report evidence).
- After image card with upload dropzone.
- Material-used input.
- Field notes input.
- Official sign-off declaration.
- Footer CTA to submit verification.

Design requirements:
- Make the before/after comparison visually balanced.
- Label each side explicitly (`Sebelum` / `Sesudah`).
- Keep image aspect ratios consistent.
- Provide upload progress, validation, and retry states.
- Make material and field-note inputs easy to scan.
- The sign-off checkbox/declaration must be explicit and not preselected.
- The submit action should be disabled until required evidence and declarations are complete.
- Confirm successful submission and show the new task/report state.

### 6.5 Evidence lightbox

When a user taps a task photo:
- Open a full-screen or large overlay image viewer.
- Keep close control obvious and accessible.
- Preserve the ability to inspect the image without accidentally triggering task actions.
- Support swipe/keyboard navigation only if implemented.
- Provide image caption or evidence metadata where useful.

## 7. Government administrator experience: GIS dashboard

### 7.1 Dashboard header

Use a clear operational header with:
- Page title and concise context.
- Real-time/broadcast status when supported.
- Notification and primary admin actions.
- Dark navy identity consistent with the mobile shell.

The dashboard should prioritize monitoring and decision-making rather than decorative welcome content.

### 7.2 KPI cards

The source defines four KPI cards:
1. **Total Laporan Masuk**
2. **Menunggu Disposisi**
3. **Sedang Diproses Lapangan**
4. **Selesai Diperbaiki**

Each card should include:
- Short label.
- Large numeric value.
- Small supporting status/context when available.
- A restrained icon or visual marker.
- Consistent dimensions and alignment.

Use a four-column grid on wide desktop, reduce to two columns on tablet, and one or two columns on narrow mobile layouts. Keep the most urgent pending count easy to spot.

### 7.3 Interactive GIS spatial map

The map is a major dashboard feature, not a decorative illustration. Include:
- Map title and short operational context.
- Kecamatan selector.
- Severity filter.
- Map canvas.
- Incident markers.
- Active field-unit marker.
- Floating layer controls.
- Floating map legend.
- Optional route simulation/arterial route overlay when relevant.

Marker categories shown in the source:
- Severe road damage: red pin with ripple.
- Streetlight/PJU issue: amber pin.
- Blocked drainage: blue pin.
- Completed facility: emerald/green pin.
- Active field unit: distinct team/unit marker (example: Alfa 03).

Map interaction principles:
- Clicking a marker should expose a compact tooltip with incident title, category, status, and relevant action.
- Keep marker shapes and colors consistent across the map and incident table.
- Do not rely on color alone; pair markers with category icons, labels, or a legend.
- Prevent tooltip overlap from obscuring important map controls.
- Show map loading, no-data, and failed-location states.
- Include a visible legend and layer control; do not make map meaning dependent on hover alone.
- Keep map controls large enough for touch when the dashboard is used on tablets.

### 7.4 Incident management data table

The source includes a management table with:
- Section title.
- Filters and search row.
- Action bar.
- Incident rows.
- Footer and pagination.

The example records cover:
- High urgency / critical.
- Pending disposition.
- Drainage in progress.
- Resolved facility repair.
- Fallen tree branch.

Recommended table information hierarchy:
- Report ID.
- Incident title/category.
- Location or district.
- Severity.
- Current status.
- Submission/update time.
- Assigned agency/team.
- Action menu/detail link.

Use:
- Compact status chips.
- Search and filters above the table.
- Clear sort affordances for sortable columns.
- Sticky header for long tables where useful.
- Pagination with current page and total count.
- Responsive horizontal scrolling or a card-list transformation on smaller screens.

Do not squeeze every column into a phone viewport. For mobile, prioritize ID, title, status, severity, and a details action.

### 7.5 Live telemetry / operations summary

The source ends the admin dashboard with a telemetry summary bento row:
1. SLA distribution progress ring (example visual: 87.5% completed within SLA).
2. Emergency broadcast channel.
3. Field crews and mobilized units.

Design guidance:
- Use a progress ring only when the metric benefits from a circular visualization.
- Show the exact percentage and explain what the SLA denominator/time window means.
- Broadcast panel should clearly distinguish sent, queued, failed, and scheduled messages.
- Field-unit panel should show team/unit identity and operational state.
- Keep the three panels visually related but not identical.

## 8. Status, severity, and feedback system

Use consistent semantic labels throughout citizen, crew, and admin screens.

### Suggested status mapping based on source terminology

| Status | Meaning | Visual treatment |
|---|---|---|
| Diajukan | Submitted / received | Neutral or pale blue |
| Menunggu Disposisi | Awaiting assignment | Amber or neutral warning |
| Disposisi Resmi | Assigned to agency/team | Blue |
| Diproses Lapangan | Work underway | Blue with active indicator |
| Verifikasi Selesai | Work completion verified | Green |
| Ditolak / Perlu Revisi | Rejected or needs correction | Red or amber depending on reason |

Severity mapping:
- Critical/high: red.
- Medium: amber.
- Normal/low: blue or neutral.
- Resolved: green status treatment, not a severity level.

Use a status chip with text and optionally an icon. Do not use a pulsing animation for every status; reserve motion for a live/active state that genuinely needs attention.

## 9. Interaction and motion

The source demonstrates several small interactions:
- Category chip selection.
- Live character counter.
- Active task/status control.
- Modal or bottom-sheet verification.
- Evidence lightbox.
- Filter pills.
- GIS marker/tooltip interactions.
- Fixed navigation and scroll-to-form CTA.

Interaction rules:
- Provide visible selected, pressed, focused, disabled, loading, success, and error states.
- Use short transitions for hover/press feedback (roughly 150–250 ms).
- Use subtle scale feedback for primary mobile taps; do not over-animate.
- Use pulse only for live status, active GPS marker, or urgent attention.
- Respect `prefers-reduced-motion`.
- Keep all actions keyboard-accessible where the platform supports it.
- Never make hover the only way to reveal important information.

## 10. Responsive behavior

### Mobile (primary citizen target)
- Single-column content.
- 16 px side gutters.
- Fixed 64 px top header and fixed bottom navigation.
- Full-width forms and buttons.
- Compact chips that wrap naturally.
- Map and evidence cards sized for touch.
- Safe-area top/bottom insets.
- Avoid horizontal page overflow.
- Keep critical actions within easy reach.

### Tablet
- Use two-column layouts for KPI cards and selected content sections.
- Allow the field crew board to show more task metadata without making cards too dense.
- Keep GIS controls accessible and touch-friendly.

### Desktop (admin-oriented)
- Expand dashboard KPI cards to four columns.
- Use a larger GIS canvas with the incident table nearby or below it.
- Use wider gutters and a clear content max-width.
- Keep filters and table actions aligned on one toolbar row where possible.
- Maintain the same color, typography, and status semantics as mobile.

## 11. Accessibility and public-service usability

- Use readable contrast, especially for small metadata on pale blue surfaces.
- Do not use 10–11 px text for essential instructions; reserve it for secondary metadata.
- Ensure interactive targets are at least 44 × 44 px on touch devices.
- Use explicit labels for form fields; placeholders are not labels.
- Provide accessible names for icon-only buttons.
- Ensure keyboard focus is visible.
- Pair severity colors with text and icons.
- Do not rely on animation to communicate an important state.
- Use plain Indonesian language for citizen-facing instructions.
- Keep emergency information prominent and unambiguous.
- Explain privacy and location permissions before collecting sensitive information.
- Make errors actionable: explain what needs correction and how to fix it.

## 12. Content and language style

The source uses Indonesian labels and civic-service terminology. Preserve this tone:
- Official but approachable.
- Direct, respectful, and easy for residents to understand.
- Short action labels.
- Clear timestamps and ticket identifiers.
- Avoid technical jargon in citizen-facing copy.
- Technical GIS/telemetry terminology may be used in the admin area when the audience is an operator.

Preferred wording examples:
- `Laporkan Kerusakan Fasilitas Publik`
- `Titik Koordinat Lokasi Kejadian`
- `Patokan / Deskripsi Lokasi Spesifik`
- `Bukti Foto Kerusakan Fasilitas`
- `Deskripsi Keluhan / Kronologi`
- `Kirim Laporan Resmi Sekarang`
- `Progres Penanganan Lapangan`
- `Hubungi Petugas Lapangan`
- `Menunggu Disposisi`
- `Diproses Lapangan`
- `Verifikasi Selesai`

## 13. Privacy, trust, and data integrity

This is a civic reporting product. Design should reinforce trust:
- Mask phone numbers in summary views.
- Clearly explain anonymous-report behavior.
- Ask permission before accessing GPS or camera/photos.
- Do not claim EXIF geotagging, cryptographic verification, Meta verification, real-time sync, or successful SMS/WhatsApp delivery unless the backend truly supports it.
- Distinguish mock/demo data from real operational data.
- Show timestamps and report IDs consistently.
- Make the responsible agency/team visible when appropriate.
- Avoid exposing reporter identity or personal contact details to unauthorized roles.

## 14. Implementation guidance

The supplied code uses:
- HTML and Tailwind CSS utility classes.
- Tailwind theme extensions for colors, typography, radius, and spacing.
- Material Symbols Outlined for icons.
- Plus Jakarta Sans and Inter via Google Fonts.
- Fixed mobile header and bottom navigation.
- CSS safe-area helpers (`env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`).
- Small JavaScript interactions for category selection and live character count.

When implementing:
- Convert repeated patterns into reusable components: `AppHeader`, `BottomNavigation`, `StatusChip`, `IncidentTracker`, `ProgressStepper`, `CategoryChip`, `LocationPicker`, `PhotoEvidenceUploader`, `ReportForm`, `TaskCard`, `VerificationSheet`, `MapMarker`, `MapLegend`, `KpiCard`, `IncidentTable`, and `TelemetryPanel`.
- Keep the semantic token names rather than scattering raw hex values through the UI.
- Use real map/GIS and geolocation services for production; a static map background is only a visual placeholder.
- Validate uploads, form fields, phone numbers, GPS permissions, and network failures.
- Use server-side authorization for role-specific pages and actions.
- Treat client-side visibility as presentation only, not as a security boundary.
- Keep report status transitions auditable and timestamped.

## 15. Component inventory

| Component | Main role | Key content |
|---|---|---|
| Shared app header | All roles | Brand, page title, notification, profile |
| Citizen greeting | Citizen | Welcome, 24/7 status, intro |
| Emergency hotline card | Citizen | Hotline number, call action |
| Incident tracker | Citizen | Ticket ID, status, progress stepper |
| Notification channel panel | Citizen | WhatsApp/SMS state, delivery log |
| Feedback/survey card | Citizen | Rating and reply action |
| Report CTA banner | Citizen | New report action |
| Category chips | Citizen | Incident category selector |
| GPS/map picker | Citizen | Pin, coordinates, accuracy, landmark |
| Photo evidence uploader | Citizen | Thumbnails, add/remove, file details |
| Description field | Citizen | Incident narrative and character counter |
| Privacy/contact controls | Citizen | Anonymous mode, phone, consent options |
| Civic impact cards | Citizen | Completed reports, response time |
| Crew status card | Field crew | Team identity, availability, metrics |
| Task filters | Field crew | Status/urgency/category filters |
| Task card | Field crew | Priority, incident, location, evidence, CTA |
| Verification sheet | Field crew | Before/after, materials, notes, sign-off |
| Evidence lightbox | Field crew/admin | Large evidence preview |
| Admin KPI cards | Admin | Report and workflow counts |
| GIS map | Admin | Incidents, units, layers, legend |
| Incident data table | Admin | Search, filters, records, pagination |
| SLA telemetry panel | Admin | SLA progress visualization |
| Broadcast panel | Admin | Emergency communications state |
| Field unit panel | Admin | Team and mobilization status |
| Institutional footer | All roles | Government/partner identity and copyright |

## 16. Do and don't

### Do
- Keep navy as the institutional foundation.
- Use blue for interactive and operational emphasis.
- Use green for successful/verified/completed states.
- Keep citizen reporting form steps in a logical order.
- Make GPS and photo evidence central to incident quality.
- Show ticket IDs, timestamps, and progress clearly.
- Keep field crew actions practical and fast.
- Make GIS markers consistent with table statuses.
- Use responsive layouts and safe-area spacing.
- Preserve the role-specific nature of each interface.

### Don't
- Do not turn the UI into a generic social feed.
- Do not use bright colors everywhere.
- Do not make status depend on color alone.
- Do not hide the emergency hotline among ordinary actions.
- Do not put every admin table column on mobile.
- Do not show fake GPS accuracy, delivery confirmation, or live data as real.
- Do not overuse animation, gradients, or glass effects.
- Do not expose citizen personal data in public or unauthorized views.
- Do not replace the source palette with unrelated branding.

## 17. Prompt template for design-generation tools

Use the following prompt when generating a new screen that must follow this skill:

> Design a [SCREEN NAME] for Smart Lapor Kota, a civic incident reporting and smart-city operations platform. Follow the Smart Lapor Kota design system: light blue-white background (#F8F9FF), institutional navy (#00152F / #0F2A4A), interactive blue (#32618E), pale blue surfaces (#EFF4FF, #E5EEFF, #DCE9FF), and green success accent (#4EDEA3). Use Plus Jakarta Sans for headings/body and Inter for labels/metadata. Use rounded cards (approximately 16 px), subtle shadows, clear status chips, Material Symbols Outlined icons, and a mobile-first responsive layout. The screen is for the [CITIZEN / FIELD CREW / GOVERNMENT ADMIN] role. Prioritize [PRIMARY TASK], show the required data and actions clearly, include loading/empty/error/success states, and maintain accessible contrast and touch targets. Keep the interface official, calm, trustworthy, precise, and easy to use. Do not invent backend capabilities or display mock values as live data.

## 18. Source coverage and limitations

This skill is derived from the supplied HTML/Tailwind source, which visibly contains:
- Citizen reporting and incident-tracking interface.
- Field crew task board and work-verification flow.
- Government admin dashboard with GIS, incident table, and telemetry panels.

The source demonstrates visual patterns and sample content, not a complete production specification. Backend behavior, actual map provider, full desktop navigation, authentication rules, data model, and real notification/geolocation integrations must be confirmed separately before implementation.
