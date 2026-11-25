export type SpeciesId = 'spring' | 'summer' | 'autumn' | 'winter';

export type SeasonKey = 'spring' | 'summer' | 'autumn' | 'winter';

export type LeafShape = 'rounded' | 'tropical' | 'maple' | 'needle';

export type FlowerStyle = 'sakura' | 'hibiscus' | 'mapleBlossom' | 'camellia';

export type FruitStyle = 'cherry' | 'hibiscusPod' | 'acorn' | 'camelliaNut';

export type Point = {
  x: number;
  y: number;
};

export type LeafSpec = {
  id: number;
  appearDay: number;
  fallDay: number;
  t: number;
  side: number;
  baseAngle: number;
  maxLen: number;
};

export type BranchTwigSpec = {
  appearDay: number;
  fromT: number;
  dx: number;
  dy: number;
  w: number;
};

export type BranchSpec = {
  id: string;
  appearDay: number;
  fullDay: number;
  trunkT: number;
  side: -1 | 1;
  dx: number;
  dy: number;
  cdx: number;
  cdy: number;
  w0: number;
  w1: number;
  twigs?: BranchTwigSpec[];
};

export type ComputedBranch = {
  start: Point;
  ctrl: Point;
  end: Point;
  g: number;
  w0: number;
  w1: number;
  twigs: {
    origin: Point;
    end: Point;
    w: number;
  }[];
};

export type TreeSkeleton = {
  trunkScaleH: number;
  trunkScaleW: number;
  p0: Point;
  p1: Point;
  p2: Point;
  p3: Point;
  pLeadCtrl: Point;
  pTip: Point;
  pointOnTrunk: (t: number) => Point;
  branches: Record<string, ComputedBranch>;
  winterBow: number;
};

export type CanopyClusterSpec = {
  id: string;
  branchId: string;
  branchT: number;
  ox: number;
  oy: number;
  r: number;
  appearDay: number;
  fallDay: number;
  layer: 'back' | 'mid' | 'front';
  toneOffset: number;
  leafAngles: number[];
};

export type BlossomNodeSpec = {
  id: string;
  branchId: string;
  branchT: number;
  ox: number;
  oy: number;
  scale: number;
  rot: number;
  dayOffset: number;
  hasBerry?: boolean;
};

export type FoliagePalette = {
  back: string;
  mid1: string;
  mid2: string;
  front1: string;
  front2: string;
  vein: string;
};

export type BarkPalette = {
  dark: string;
  light: string;
};

export type ClusterGrowthState = {
  visible: boolean;
  grow: number;
  fold: number;
  droop: number;
  shrink: number;
  opacity: number;
  fallingProgress: number | null;
};

export type EnvironmentState = {
  dayOfYear: number;
  seasonKey: SeasonKey;
  seasonEn: string;
  seasonJa: string;
  badgeClass: string;
  springFactor: number;
  summerFactor: number;
  autumnFactor: number;
  winterFactor: number;
  autumnWarmth: number;
  snowLevel: number;
  streamFrozen: boolean;
  skyFrom: string;
  skyTo: string;
  sunColor: string;
  farMountain: string;
  midMountain: string;
  hillTop: string;
  hillMid: string;
  hillDeep: string;
  sunX: number;
  sunY: number;
  sunOpacity: number;
  moonX: number;
  moonY: number;
  moonOpacity: number;
  twilightFactor: number;
  nightFactor: number;
  showPetals: boolean;
  showSummerShimmer: boolean;
  showFireflies: boolean;
  showAutumnLeaves: boolean;
  showSnowfall: boolean;
  showButterfly: boolean;
};

export type SpeciesBloomSchedule = {
  budStart: number;
  flowerStart: number;
  flowerWitherStart: number;
  flowerEnd: number;
  fruitStart: number;
  fruitEnd: number;
};

export type SpeciesConfig = {
  id: SpeciesId;
  labelJa: string;
  labelEn: string;
  shortTag: string;
  descTheme: string;
  leafShape: LeafShape;
  flowerStyle: FlowerStyle;
  fruitStyle: FruitStyle;
  isEvergreen: boolean;
  trunkHeightScale: number;
  trunkThicknessScale: number;
  sproutColors: {
    stem: string;
    cotyledon: string;
    cotyledonStroke: string;
    leaf: string;
    leafStroke: string;
    tipLeaf: string;
  };
  branches: BranchSpec[];
  clusters: CanopyClusterSpec[];
  blossoms: BlossomNodeSpec[];
  bloomSchedule: SpeciesBloomSchedule;
  getBarkPalette: (cd: number, env: EnvironmentState) => BarkPalette;
  getFoliagePalette: (cd: number, toneOffset: number, env: EnvironmentState) => FoliagePalette;
  getClusterGrowth: (cd: number, cluster: CanopyClusterSpec, env: EnvironmentState) => ClusterGrowthState;
};

export type GrowthStageMeta = {
  stageEn: string;
  stageJa: string;
  desc: string;
};

export type SeagullAgent = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  dir: 1 | -1;
  cruiseSpeed: number;
  baseY: number;
  flapPhase: number;
  flapRate: number;
  glideCooldown: number;
  turnCooldown: number;
  isGliding: boolean;
  scale: number;
  baseOpacity: number;
  seed: number;
};
