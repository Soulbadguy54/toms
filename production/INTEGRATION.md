# Accepted two-video site integration

The user explicitly selected the uploaded 3f9c7ff4 world and 75b15655 curtain videos on 11 September 2026. Their exact bytes are served from public/video. Newer generated curtain versions are not used.

The fixed 16:9 frame preserves the full composition. Layer order is world canvas, semantic DOM navigation/logos/catalog links, WebGL-keyed curtain canvas. The key uses green dominance, covering the source's varying green brightness. No storyboard imagery is served.

GSAP ScrollTrigger drives a 12-unit timeline, seeking both source videos. Both decoded frames are committed together. The initial world section spans two timeline units; the world cut occurs only inside the curtain's fully opaque interval. Curtain playback ends before the main sign entrances. Final DOM links appear after source time 7.1s. Reverse scrolling follows the same mapping. Long-GOP source videos can impose seek latency; requested seeks are coalesced.

Mobile preserves uncropped video and provides separate accessible catalog links. Reduced-motion, WebGL failure and video failure fall back to the original landing artwork and usable catalog navigation. DOM text uses original brand images and real Russian text. Existing baked lettering/artifacts in the user-selected source videos remain; this integration does not erase video pixels with generated replacements.

Catalogs retain UT/Tom's brand sections, UT category selection, about/contact dialogs and Ozon search links. Ozon links are searches, not a claimed verified store URL. Contacts point users to seller questions; no invented email or phone.
