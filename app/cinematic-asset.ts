/** User-selected world: 48239557 (13 September); approved curtain unchanged. */
export const cinematicAsset = {
  approved: true,
  world: '/video/world.mp4?v=48239557',
  curtain: '/video/curtain.mp4',
  duration: 12,
};

export function sceneTimes(progress: number) {
  const t = Math.max(0, Math.min(1, progress)) * 12;
  // Hold the landing while curtains close; swap only behind fully opaque fabric.
  const world = t < 2 ? t * .4 : t < 3.7 ? .8 : t < 8 ? 2 : 2 + (t - 8) / 4 * 5.9;
  const curtain = t < 2 ? 0 : t < 8 ? (t - 2) / 6 * 7.9 : 7.9;
  return { world, curtain, opening: t < 3.7, choice: t >= 11.5, transition: t > 2 && t < 8 };
}
