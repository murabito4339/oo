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

export type SeasonMeta = {
  seasonEn: string;
  seasonJa: string;
  desc: string;
  bgFrom: string;
  bgTo: string;
  sunColor: string;
  badgeClass: string;
};