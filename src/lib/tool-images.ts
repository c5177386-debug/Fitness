/**
 * Tool imagery layout — declarative placement of every generated image.
 * - hero:   top banner with title overlay
 * - visual: core result visualization, rendered right under the calculator
 * - slots:  images inserted within long-form content (after a block index)
 * - scene:  closing lifestyle image after the article
 *
 * M2 tools already have entries; their slots activate once content blocks exist.
 */

export interface ImageSpec {
  src: string;
  width: number;
  height: number;
  /** transparent-background object (rendered centered on a soft tinted panel) */
  object?: boolean;
}

export interface ImageSlot extends ImageSpec {
  /** insert after the content block with this index */
  after: number;
}

export interface ToolImagery {
  hero: string;
  visual?: ImageSpec;
  slots: ImageSlot[];
  scene?: ImageSpec;
  og: string;
}

const CONTENT = '/images/content';
const HEROES = '/images/heroes';
const OBJECTS = '/images/objects';
const OG = '/images/og';

export const toolImagery: Record<string, ToolImagery> = {
  'one-rep-max-calculator': {
    hero: `${HEROES}/hero-one-rep-max-calculator.webp`,
    og: `${OG}/og-one-rep-max-calculator.jpg`,
    visual: {
      src: `${OBJECTS}/one-rep-max-percentage-steps.png`,
      width: 1024,
      height: 1024,
      object: true,
    },
    slots: [
      { src: `${CONTENT}/one-rep-max-barbell.webp`, width: 1200, height: 800, after: 1 },
      { src: `${CONTENT}/one-rep-max-plates.webp`, width: 1200, height: 800, after: 7 },
      { src: `${CONTENT}/one-rep-max-goals.webp`, width: 1200, height: 800, after: 10 },
    ],
    scene: { src: `${CONTENT}/one-rep-max-journal.webp`, width: 1200, height: 800 },
  },

  'tdee-calculator': {
    hero: `${HEROES}/hero-tdee-calculator.webp`,
    og: `${OG}/og-tdee-calculator.jpg`,
    visual: { src: `${CONTENT}/tdee-energy.webp`, width: 1200, height: 800 },
    slots: [
      { src: `${CONTENT}/tdee-activity-ladder.webp`, width: 1200, height: 800, after: 7 },
      { src: `${CONTENT}/tdee-goals.webp`, width: 1200, height: 800, after: 10 },
    ],
    scene: { src: `${CONTENT}/tdee-weigh-in.webp`, width: 1200, height: 800 },
  },

  'water-intake-calculator': {
    hero: `${HEROES}/hero-water-intake-calculator.webp`,
    og: `${OG}/og-water-intake-calculator.jpg`,
    visual: {
      src: `${OBJECTS}/water-container-set.png`,
      width: 1024,
      height: 1024,
      object: true,
    },
    slots: [
      { src: `${CONTENT}/water-daily-infographic.webp`, width: 1200, height: 1500, after: 7 },
      { src: `${CONTENT}/water-urine-color-chart.webp`, width: 1200, height: 800, after: 10 },
    ],
    scene: { src: `${CONTENT}/water-exercise.webp`, width: 1200, height: 800 },
  },

  // ── M2 tools (imagery ready; pages activate when built) ──────────────
  'macro-calculator': {
    hero: `${HEROES}/hero-macro-calculator.webp`,
    og: `${OG}/og-macro-calculator.jpg`,
    visual: { src: `${CONTENT}/macro-groups.webp`, width: 1200, height: 800 },
    slots: [
      { src: `${CONTENT}/macro-protein.webp`, width: 1200, height: 800, after: 3 },
      { src: `${CONTENT}/macro-plate-ratio.webp`, width: 1200, height: 800, after: 7 },
    ],
    scene: { src: `${CONTENT}/macro-meal-prep.webp`, width: 1200, height: 800 },
  },

  'body-fat-calculator': {
    hero: `${HEROES}/hero-body-fat-calculator.webp`,
    og: `${OG}/og-body-fat-calculator.jpg`,
    visual: { src: `${CONTENT}/body-fat-range.webp`, width: 1200, height: 800 },
    slots: [
      { src: `${CONTENT}/body-fat-navy-method.webp`, width: 1200, height: 800, after: 3 },
      { src: `${CONTENT}/body-fat-measure.webp`, width: 1200, height: 800, after: 7 },
    ],
    scene: { src: `${CONTENT}/body-fat-caliper.webp`, width: 1200, height: 800 },
  },

  'running-pace-calculator': {
    hero: `${HEROES}/hero-running-pace-calculator.webp`,
    og: `${OG}/og-running-pace-calculator.jpg`,
    visual: { src: `${CONTENT}/running-pace-track.webp`, width: 1200, height: 800 },
    slots: [
      { src: `${CONTENT}/running-race-distances.webp`, width: 1200, height: 800, after: 3 },
      { src: `${CONTENT}/running-shoes.webp`, width: 1200, height: 800, after: 7 },
    ],
    scene: { src: `${CONTENT}/running-finish-line.webp`, width: 1200, height: 800 },
  },

  'intermittent-fasting-calculator': {
    hero: `${HEROES}/hero-intermittent-fasting-calculator.webp`,
    og: `${OG}/og-intermittent-fasting-calculator.jpg`,
    visual: { src: `${CONTENT}/if-eating-window.webp`, width: 1200, height: 800 },
    slots: [
      { src: `${CONTENT}/if-24h-ring.webp`, width: 1200, height: 800, after: 3 },
      { src: `${CONTENT}/if-methods.webp`, width: 1200, height: 800, after: 7 },
    ],
    scene: { src: `${CONTENT}/if-circadian.webp`, width: 1200, height: 800 },
  },

  'target-heart-rate-calculator': {
    hero: `${HEROES}/hero-target-heart-rate-calculator.webp`,
    og: `${OG}/og-target-heart-rate-calculator.jpg`,
    visual: { src: `${CONTENT}/heart-rate-zones.webp`, width: 1200, height: 800 },
    slots: [
      { src: `${CONTENT}/heart-rate-intensity.webp`, width: 1200, height: 800, after: 3 },
      { src: `${CONTENT}/heart-rate-devices.webp`, width: 1200, height: 800, after: 7 },
    ],
    scene: { src: `${CONTENT}/heart-rate-max-test.webp`, width: 1200, height: 800 },
  },
};
