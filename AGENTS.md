# Website creation rules

When creating or editing this website, use the installed UI/UX skills when
their scope applies:

- `ui-ux-pro-max` for product-specific UX, visual direction, responsive layout,
  accessibility, and final UI review.
- `design` and `ui-styling` for page composition, visual hierarchy, components,
  typography, colour, and interaction states.
- `design-system` for reusable tokens, components, and consistent UI patterns.
- `brand` for brand identity, approved logo use, and visual consistency.
- `banner-design` for site banners and campaign-style visual blocks.
- `slides` only for presentation deliverables, not normal web pages.

For any cinematic website motion or a Higgsfield motion brief, also use
`motion-handoff-toms`. It requires one approved Video Handoff Pack before any
Higgsfield prompt and forbids asset generation, video submission, retries, or
splitting a normal request into clips.

Apply only the skills relevant to the requested work. Existing brand assets,
character references, and approved layouts remain the source of truth.

## Latest user decisions

- Continue the existing site; do not run image or video generation.
- The latest cinematic requirement supersedes the original five-video plan:
  exactly one continuous 5–8-second film, generated manually by the user.
- Preserve the separately uploaded landing start frame unchanged. It is an
  approved standalone image, not a storyboard panel.
- Old generated clips are not approved. Keep them out of public assets.
- Leave cinematic-asset.ts disabled until the user supplies and accepts the
  single film. Never activate an arbitrary video just because a file exists.
- UI text, original logo overlays, and catalog links belong in DOM. Never claim
  full cinematic completion before testing the accepted video and final poses.

## Accepted assembly — 11 September 2026 (supersedes earlier film count)
- User explicitly selected TWO uploaded videos for the finished website:
  public/video/world.mp4 (3f9c7ff4) and public/video/curtain.mp4 (75b15655).
- Use these exact sources. Do not substitute the newer curtain generation.
- Compose world → semantic DOM branding/catalog links → keyed curtain video.
- GSAP controls a shared seek timeline; hide the world cut under fully closed curtains.
- Never generate new media or reuse storyboard panels for this integration.

## Accepted world replacement — 13 September 2026
- public/video/world.mp4 now uses the uploaded 48239557-0dc4-4930-80ce-bca5e4431810 film.
- Keep the existing curtain video unchanged.
- The second scene has wooden signs without catalog buttons. Use only clickable original logo overlays, centered inside the wooden faces; no visible “Открыть каталог” labels.
- Reveal the second-scene heading, clickable logos, and returning navigation with a short staggered fade; reverse scrolling fades them out.
- Do not show the lower-left scroll/status pill (“Листайте вниз…” / “Два бренда…”). Keep only the lower-right catalog/start control.
- The landing headline and “Для любимых семейных традиций” sit together on one enlarged cream cloud-shaped DOM background. The small wooden sign in the landing video carries the DOM text “Вкус начинается дома”, optically centered inside its inner face.
- Clicking either brand logo opens a translucent placeholder dialog over the current cinematic frame. Do not open the unfinished full catalog pages until the user requests their implementation.
- On the second brand-choice screen, hide the “Продукты” navigation button. Keep “О нас” visible and clickable; the full-frame choice layer must not intercept its pointer events.
- Never display landing-start.png as a loading poster. Show the real world video from its first frame and initialize scroll control from video metadata so cold-cache visits remain interactive.
- Hide the lower-right control on the first screen and during the transition. Show only “В начало” after the second brand-choice screen is ready.
- Align “Вкус начинается дома” to the actual angled sign face in the accepted world video, including its slight counter-clockwise perspective.
- Keep a 2D chroma-key compositor fallback so missing or delayed WebGL never disables the scroll journey.
- Apply edge-aware chroma keying to the curtain layer: soft green despill plus a restrained one-pixel matte expansion in both WebGL and the 2D fallback. Preserve thin rope detail while removing green fringing from curtains and characters.

## Accepted frame sequences — 19 September 2026
- Replace video playback with the user-supplied original video frames (not storyboard panels).
- Archive mapping: 01 UT entrance, 02 landing/world, 03 about-screen reveal, 04 Tom’s book page turn, 05 Tom’s entrance, 06 keyed curtain.
- Original 1280×720 WebP frames live under public/frames at 24 fps. Preserve all supplied frames.
- Main scroll controls the world and curtain frame indices. Logos start their corresponding brand entrance; return reverses it. Do not open the old catalog placeholder dialog on logo clicks.
- Bound decoded image memory and prefetch nearby frames. Preserve the displayed frame on a network delay. Respect reduced motion.

## Interaction corrections — 20 September 2026
- “О нас” opens information only. Plane, tomato brothers, Pepper and crow hotspots on the landing reveal the projector scene on click/tap/keyboard; hover plays locally masked motion from supplied world frames.
- Show a playable sample video inside the lowered projector screen (existing world.mp4 for now).
- Choice uses UT entrance frame 0001 as its canonical composition; change to it behind fully closed curtains. Brand entrance starts on the displayed pixels. Register Tom’s small source-camera offset and taper it out at the start.
- “Назад” from either book or projector returns with a quick dissolve, never reverse playback of the full entrance.
