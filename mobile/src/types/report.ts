export type Side = 'FRONT' | 'BACK';
export type Region =
  | 'TOP_LEFT'
  | 'TOP_RIGHT'
  | 'BOTTOM_LEFT'
  | 'BOTTOM_RIGHT'
  | 'TOP'
  | 'BOTTOM'
  | 'LEFT'
  | 'RIGHT';

export interface Ding {
  id: string;
  side: Side;
  type: 'SURFACE' | 'CORNER' | 'EDGE';
  region: Region;
  note: string;
}

/** Scores are on a 0–1000 scale. 1000 means no measurable imperfection. */
export interface CornerScore {
  side: Side;
  region: Region;
  fray: number;
  fill: number;
  angle?: number;
}

export interface EdgeScore {
  side: Side;
  region: Region;
  fray: number;
  fill: number;
}

export interface GradeReport {
  /** ISO timestamp. */
  gradedAt: string;
  centering: {
    front: { l: number; r: number; t: number; b: number };
    back: { l: number; r: number; t: number; b: number };
  };
  /** Physical size in inches, e.g. 3.459 x 2.480. */
  dimensionsIn: { h: number; w: number };
  dings: Ding[];
  corners: CornerScore[];
  edges: EdgeScore[];
  stats: {
    pop: number;
    popAsOf: string;
    rank: number;
    rankOf: number;
    chron: number;
    chronOf: number;
  };
}
