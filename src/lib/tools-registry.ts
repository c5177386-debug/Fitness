/**
 * Tool Registry — 程序化矩阵的核心
 * 每个工具只需在这里注册配置，加上一个内容 MDX 文件，即可自动生成页面。
 * 新增工具 = 加计算引擎 + 内容 MDX + 这里注册一行。
 */

export interface ToolConfig {
  slug: string;
  title: string;
  keyword: string;
  description: string;
  /** Character count */
  maxTitleLength?: number;
  /** Related tools for internal linking */
  relatedTools: string[];
  /** Engine module path (dynamically loaded) */
  engine: string;
  /** Form fields definition */
  fields: FieldDef[];
  /** Which result function to call */
  resultFn: string;
  /** Default units */
  defaultUnits: 'metric' | 'imperial';
}

export interface FieldDef {
  key: string;
  label: string;
  type: 'number' | 'select';
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  step?: number;
  default?: string | number;
}

export const tools: ToolConfig[] = [
  {
    slug: 'one-rep-max-calculator',
    title: 'One Rep Max Calculator',
    keyword: 'one rep max calculator',
    description:
      'Calculate your one rep max (1RM) using Epley and Brzycki formulas. Find your true maximum strength.',
    relatedTools: ['tdee-calculator', 'macro-calculator'],
    engine: '@/lib/calculators/one-rep-max',
    resultFn: 'calculateOneRepMax',
    defaultUnits: 'metric',
    fields: [
      {
        key: 'weight',
        label: 'Weight Lifted (kg)',
        type: 'number',
        placeholder: 'e.g. 80',
        min: 1,
        max: 500,
        step: 1,
      },
      {
        key: 'reps',
        label: 'Number of Reps',
        type: 'number',
        placeholder: 'e.g. 5',
        min: 1,
        max: 50,
        step: 1,
      },
    ],
  },
  {
    slug: 'tdee-calculator',
    title: 'TDEE Calculator',
    keyword: 'tdee calculator',
    description:
      'Estimate your Total Daily Energy Expenditure using Mifflin-St Jeor. Know how many calories you burn daily.',
    relatedTools: ['macro-calculator', 'body-fat-calculator', 'one-rep-max-calculator'],
    engine: '@/lib/calculators/tdee',
    resultFn: 'calculateTDEE',
    defaultUnits: 'metric',
    fields: [
      {
        key: 'gender',
        label: 'Gender',
        type: 'select',
        options: [
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
        ],
        default: 'male',
      },
      {
        key: 'weight',
        label: 'Weight (kg)',
        type: 'number',
        placeholder: 'e.g. 70',
        min: 20,
        max: 300,
        step: 0.5,
      },
      {
        key: 'height',
        label: 'Height (cm)',
        type: 'number',
        placeholder: 'e.g. 175',
        min: 100,
        max: 250,
        step: 1,
      },
      {
        key: 'age',
        label: 'Age',
        type: 'number',
        placeholder: 'e.g. 30',
        min: 10,
        max: 100,
        step: 1,
      },
      {
        key: 'activityLevel',
        label: 'Activity Level',
        type: 'select',
        options: [
          { value: 'sedentary', label: 'Sedentary (office job)' },
          { value: 'lightly-active', label: 'Lightly Active (1-3 days/week)' },
          { value: 'moderately-active', label: 'Moderately Active (3-5 days/week)' },
          { value: 'very-active', label: 'Very Active (6-7 days/week)' },
          { value: 'extra-active', label: 'Extra Active (physical job + training)' },
        ],
        default: 'moderately-active',
      },
    ],
  },
  {
    slug: 'water-intake-calculator',
    title: 'Water Intake Calculator',
    keyword: 'water intake calculator',
    description:
      'Find your daily water intake needs based on weight, exercise, and climate. Stay properly hydrated.',
    relatedTools: ['tdee-calculator', 'running-pace-calculator'],
    engine: '@/lib/calculators/water-intake',
    resultFn: 'calculateWaterIntake',
    defaultUnits: 'metric',
    fields: [
      {
        key: 'weight',
        label: 'Weight (kg)',
        type: 'number',
        placeholder: 'e.g. 70',
        min: 5,
        max: 300,
        step: 0.5,
      },
      {
        key: 'exerciseMinutes',
        label: 'Daily Exercise (minutes)',
        type: 'number',
        placeholder: 'e.g. 30',
        min: 0,
        max: 480,
        step: 5,
        default: 30,
      },
      {
        key: 'climate',
        label: 'Climate',
        type: 'select',
        options: [
          { value: 'normal', label: 'Normal / Temperate' },
          { value: 'hot', label: 'Hot & Dry' },
          { value: 'humid', label: 'Hot & Humid' },
        ],
        default: 'normal',
      },
    ],
  },
  // ── M2 tools ─────────────────────────────────────────────────────
  {
    slug: 'macro-calculator',
    title: 'Macro Calculator',
    keyword: 'macro calculator',
    description: 'Calculate your ideal protein, carbs, and fat intake based on your goal.',
    relatedTools: ['tdee-calculator', 'body-fat-calculator'],
    engine: '@/lib/calculators/macro',
    resultFn: 'calculateMacros',
    defaultUnits: 'metric',
    fields: [
      {
        key: 'gender',
        label: 'Gender',
        type: 'select',
        options: [
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
        ],
        default: 'male',
      },
      { key: 'age', label: 'Age', type: 'number', placeholder: 'e.g. 30', min: 10, max: 100 },
      { key: 'weight', label: 'Weight (kg)', type: 'number', placeholder: 'e.g. 70', min: 20, max: 300, step: 0.5 },
      { key: 'height', label: 'Height (cm)', type: 'number', placeholder: 'e.g. 175', min: 100, max: 250 },
      {
        key: 'activityLevel',
        label: 'Activity Level',
        type: 'select',
        options: [
          { value: 'sedentary', label: 'Sedentary (office job)' },
          { value: 'lightly-active', label: 'Lightly Active (1-3 days/week)' },
          { value: 'moderately-active', label: 'Moderately Active (3-5 days/week)' },
          { value: 'very-active', label: 'Very Active (6-7 days/week)' },
          { value: 'extra-active', label: 'Extra Active (physical job + training)' },
        ],
        default: 'moderately-active',
      },
      {
        key: 'goal',
        label: 'Goal',
        type: 'select',
        options: [
          { value: 'lose', label: 'Lose Fat' },
          { value: 'maintain', label: 'Maintain Weight' },
          { value: 'gain', label: 'Build Muscle' },
        ],
        default: 'maintain',
      },
      {
        key: 'dietStyle',
        label: 'Diet Style',
        type: 'select',
        options: [
          { value: 'balanced', label: 'Balanced' },
          { value: 'low-carb', label: 'Low Carb' },
          { value: 'keto', label: 'Keto' },
        ],
        default: 'balanced',
      },
    ],
  },
  {
    slug: 'body-fat-calculator',
    title: 'Body Fat Calculator',
    keyword: 'body fat calculator',
    description: 'Estimate your body fat percentage with the US Navy method, plus a BMI comparison.',
    relatedTools: ['tdee-calculator', 'macro-calculator'],
    engine: '@/lib/calculators/body-fat',
    resultFn: 'calculateBodyFat',
    defaultUnits: 'metric',
    fields: [
      {
        key: 'gender',
        label: 'Gender',
        type: 'select',
        options: [
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
        ],
        default: 'male',
      },
      { key: 'age', label: 'Age', type: 'number', placeholder: 'e.g. 30', min: 10, max: 100 },
      { key: 'weight', label: 'Weight (kg)', type: 'number', placeholder: 'e.g. 80', min: 20, max: 300, step: 0.5 },
      { key: 'height', label: 'Height (cm)', type: 'number', placeholder: 'e.g. 180', min: 100, max: 250 },
      { key: 'neck', label: 'Neck Circumference (cm)', type: 'number', placeholder: 'e.g. 38', min: 20, max: 80, step: 0.5 },
      { key: 'waist', label: 'Waist Circumference (cm)', type: 'number', placeholder: 'e.g. 85', min: 30, max: 250, step: 0.5 },
      { key: 'hip', label: 'Hip Circumference (cm, women)', type: 'number', placeholder: 'e.g. 95', min: 30, max: 250, step: 0.5 },
    ],
  },
  {
    slug: 'running-pace-calculator',
    title: 'Running Pace Calculator',
    keyword: 'running pace calculator',
    description: 'Calculate your pace, speed, and per-km splits for any race distance.',
    relatedTools: ['water-intake-calculator', 'target-heart-rate-calculator'],
    engine: '@/lib/calculators/running-pace',
    resultFn: 'calculatePace',
    defaultUnits: 'metric',
    fields: [
      {
        key: 'preset',
        label: 'Race Distance',
        type: 'select',
        options: [
          { value: '5', label: '5K' },
          { value: '10', label: '10K' },
          { value: '21.0975', label: 'Half Marathon (21.1K)' },
          { value: '42.195', label: 'Marathon (42.2K)' },
          { value: 'custom', label: 'Custom distance' },
        ],
        default: '10',
      },
      { key: 'distanceKm', label: 'Custom Distance (km)', type: 'number', placeholder: 'e.g. 7.5', min: 0.1, max: 500, step: 0.1 },
      { key: 'hours', label: 'Finish Time — Hours', type: 'number', placeholder: '0', min: 0, max: 100, default: 0 },
      { key: 'minutes', label: 'Finish Time — Minutes', type: 'number', placeholder: 'e.g. 50', min: 0, max: 59 },
      { key: 'seconds', label: 'Finish Time — Seconds', type: 'number', placeholder: 'e.g. 00', min: 0, max: 59 },
    ],
  },
  {
    slug: 'intermittent-fasting-calculator',
    title: 'Intermittent Fasting Calculator',
    keyword: 'intermittent fasting calculator',
    description: 'Build a daily fasting schedule matched to your wake time and chosen method.',
    relatedTools: ['tdee-calculator', 'macro-calculator'],
    engine: '@/lib/calculators/if-timer',
    resultFn: 'calculateSchedule',
    defaultUnits: 'metric',
    fields: [
      {
        key: 'method',
        label: 'Fasting Method',
        type: 'select',
        options: [
          { value: '14:10', label: '14:10 — Beginner friendly' },
          { value: '16:8', label: '16:8 — Most popular' },
          { value: '18:6', label: '18:6 — Intermediate' },
          { value: '20:4', label: '20:4 — Advanced' },
          { value: 'omad', label: 'OMAD — One meal a day' },
        ],
        default: '16:8',
      },
      { key: 'wakeHour', label: 'Wake Time — Hour', type: 'number', placeholder: 'e.g. 7', min: 0, max: 23, default: 7 },
      { key: 'wakeMinute', label: 'Wake Time — Minute', type: 'number', placeholder: 'e.g. 00', min: 0, max: 59, default: 0 },
    ],
  },
  {
    slug: 'target-heart-rate-calculator',
    title: 'Target Heart Rate Calculator',
    keyword: 'target heart rate calculator',
    description: 'Calculate your five training heart-rate zones with the Karvonen method.',
    relatedTools: ['running-pace-calculator', 'water-intake-calculator'],
    engine: '@/lib/calculators/heart-rate',
    resultFn: 'calculateHeartRate',
    defaultUnits: 'metric',
    fields: [
      { key: 'age', label: 'Age', type: 'number', placeholder: 'e.g. 30', min: 10, max: 100 },
      { key: 'restingHR', label: 'Resting Heart Rate (bpm)', type: 'number', placeholder: 'e.g. 60', min: 30, max: 120 },
    ],
  },
];

export function getToolBySlug(slug: string): ToolConfig | undefined {
  return tools.find((t) => t.slug === slug);
}

export function getToolByKeyword(keyword: string): ToolConfig | undefined {
  return tools.find((t) => t.keyword.toLowerCase() === keyword.toLowerCase());
}

/** Only return tools that have complete field definitions (M1-ready) */
export function getActiveTools(): ToolConfig[] {
  return tools.filter((t) => t.fields.length > 0);
}
