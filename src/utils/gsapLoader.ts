// GSAP Loader utility to prevent multiple imports
let gsapPromise: Promise<typeof import('gsap')> | null = null;

export async function loadGsap() {
  if (!gsapPromise) {
    gsapPromise = import('gsap');
  }
  return gsapPromise;
}

export async function loadScrollTrigger() {
  const gsap = await loadGsap();
  const { ScrollTrigger } = await import('gsap/ScrollTrigger');
  gsap.default.registerPlugin(ScrollTrigger);
  return { gsap: gsap.default, ScrollTrigger };
}

// For components that need immediate GSAP access (like HeroSection)
export const gsapImport = () => import('gsap').then(module => module.default);