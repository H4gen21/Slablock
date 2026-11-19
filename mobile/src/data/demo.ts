import type { VerifiedCertificateData } from '../components/CertificateInspectionView';
import type { DemoTriggerScenario } from '../components/DevDemoBottomSheet';
import { buildDemoTapPayload, type ParsedSunUrl } from '../nfc/sunReader';
import type { Tone } from '../theme/tokens';
import type {
  CornerScore,
  EdgeScore,
  GradeReport,
  Region,
  Side
} from '../types/report';

export interface SlabItem extends VerifiedCertificateData {
  key: string;
  short: string;
  tone: Tone;
  checked: string;
  /** ISO timestamp of when the grading authority graded the card. */
  gradedAt: string;
  /** Banner body on the detail screen. Describes the current state only. */
  stateNote?: string;
  /** Print variation shown on the report, e.g. "Shadowless · Holo". */
  variation?: string;
  /** Seeded by the demo flag rather than scanned by the user. */
  demo?: boolean;
}

const CORNER_REGIONS: Region[] = ['TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_RIGHT'];
const EDGE_REGIONS: Region[] = ['TOP', 'BOTTOM', 'LEFT', 'RIGHT'];
const SIDES: Side[] = ['FRONT', 'BACK'];

/** All 8 corners at 1000, with the given ones replaced. Front corners carry an angle. */
function corners(overrides: CornerScore[] = []): CornerScore[] {
  return SIDES.flatMap((side) =>
    CORNER_REGIONS.map(
      (region) =>
        overrides.find((o) => o.side === side && o.region === region) ?? {
          side,
          region,
          fray: 1000,
          fill: 1000,
          ...(side === 'FRONT' ? { angle: 1000 } : {})
        }
    )
  );
}

/** All 8 edges at 1000, with the given ones replaced. */
function edges(overrides: EdgeScore[] = []): EdgeScore[] {
  return SIDES.flatMap((side) =>
    EDGE_REGIONS.map(
      (region) =>
        overrides.find((o) => o.side === side && o.region === region) ?? {
          side,
          region,
          fray: 1000,
          fill: 1000
        }
    )
  );
}

const CARD_DIMENSIONS = { h: 3.459, w: 2.48 };

const CHARIZARD_REPORT: GradeReport = {
  gradedAt: '2026-11-14T03:20:00Z',
  centering: {
    front: { l: 52, r: 48, t: 51, b: 49 },
    back: { l: 49, r: 51, t: 51, b: 49 }
  },
  dimensionsIn: CARD_DIMENSIONS,
  dings: [],
  corners: corners(),
  edges: edges(),
  stats: { pop: 3, popAsOf: '2026-11-19', rank: 1, rankOf: 3, chron: 2, chronOf: 3 }
};

const PIKACHU_REPORT: GradeReport = {
  gradedAt: '2026-11-12T07:45:00Z',
  centering: {
    front: { l: 55, r: 45, t: 52, b: 48 },
    back: { l: 49, r: 51, t: 51, b: 49 }
  },
  dimensionsIn: CARD_DIMENSIONS,
  dings: [
    {
      id: 'D1',
      side: 'FRONT',
      type: 'EDGE',
      region: 'BOTTOM',
      note: 'Minor whitening, bottom edge'
    },
    {
      id: 'D2',
      side: 'BACK',
      type: 'CORNER',
      region: 'TOP_LEFT',
      note: 'Soft corner, top left'
    }
  ],
  corners: corners([{ side: 'BACK', region: 'TOP_LEFT', fray: 972, fill: 988 }]),
  edges: edges([{ side: 'FRONT', region: 'BOTTOM', fray: 981, fill: 994 }]),
  stats: { pop: 113, popAsOf: '2026-11-19', rank: 3, rankOf: 113, chron: 68, chronOf: 113 }
};

const UMBREON_REPORT: GradeReport = {
  gradedAt: '2026-11-03T09:10:00Z',
  centering: {
    front: { l: 51, r: 49, t: 51, b: 49 },
    back: { l: 51, r: 49, t: 51, b: 49 }
  },
  dimensionsIn: CARD_DIMENSIONS,
  dings: [],
  corners: corners(),
  edges: edges(),
  stats: { pop: 41, popAsOf: '2026-11-19', rank: 7, rankOf: 41, chron: 12, chronOf: 41 }
};

const ILLUSTRATOR_REPORT: GradeReport = {
  gradedAt: '2026-10-28T02:30:00Z',
  centering: {
    front: { l: 54, r: 46, t: 60, b: 40 },
    back: { l: 52, r: 48, t: 53, b: 47 }
  },
  dimensionsIn: { h: 3.457, w: 2.481 },
  dings: [
    {
      id: 'D1',
      side: 'FRONT',
      type: 'SURFACE',
      region: 'TOP_RIGHT',
      note: 'Small indent near the art box'
    },
    {
      id: 'D2',
      side: 'FRONT',
      type: 'EDGE',
      region: 'RIGHT',
      note: 'Edge chipping along the right side'
    },
    {
      id: 'D3',
      side: 'BACK',
      type: 'CORNER',
      region: 'BOTTOM_RIGHT',
      note: 'Light wear, bottom right corner'
    }
  ],
  corners: corners([{ side: 'BACK', region: 'BOTTOM_RIGHT', fray: 961, fill: 975 }]),
  edges: edges([{ side: 'FRONT', region: 'RIGHT', fray: 958, fill: 970 }]),
  stats: { pop: 1, popAsOf: '2026-11-19', rank: 1, rankOf: 1, chron: 1, chronOf: 1 }
};

export interface ActivityEvent {
  id: string;
  tone: Tone;
  title: string;
  subtitle: string;
  time: string;
}

export interface ScenarioOption {
  scenario: DemoTriggerScenario;
  title: string;
  subtitle: string;
  badge: string;
  tone: Tone;
  payload: () => ParsedSunUrl;
}

export function fakeSig(seed = '9a8b'): VerifiedCertificateData['claimSignature'] {
  const padded = seed.padEnd(64, 'a1b2c3d4e5f60718');
  const r = `0x${padded.slice(0, 64)}`;
  const s = `0x${padded.split('').reverse().join('').slice(0, 64)}`;
  return {
    r,
    s,
    v: 27,
    signature: `${r}${s.slice(2, 18)}`,
    deadline: Math.floor(Date.now() / 1000) + 120
  };
}

/** Demo recipient wallet (Hardhat account #2), shown as 0x3C44…93BC. */
export const DEMO_RECIPIENT = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';

/** Mock wallet set by the header "Connect wallet" pill (owner of the demo slabs). */
export const DEMO_WALLET_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

/** Demo slabs. Only loaded into the collection when the demo flag is on. */
export const SLABS: SlabItem[] = [
  {
    key: 'charizard',
    short: 'Charizard #4',
    tone: 'emerald',
    checked: '2m ago',
    gradedAt: '2026-11-14T03:20:00Z',
    stateNote:
      'Encapsulated at grading and registered on-chain. Chip counter is at #11.',
    demo: true,
    verified: true,
    tagUid: '04A1B2C3D4E501',
    readCounter: 11,
    tokenId: 1,
    certId: 'CERT-PKMN-2026-0001',
    cardName: '1st Edition Shadowless Holo Charizard #4',
    cardSet: '1999 Pokémon Base Set',
    overallGrade: 10.0,
    subGrades: {
      centering: 10.0,
      surface: 10.0,
      corners: 10.0,
      edges: 10.0
    },
    variation: 'Shadowless · Holo',
    report: CHARIZARD_REPORT,
    ipfsMetadataCid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    onChainState: 'SEALED',
    ownerAddress: DEMO_WALLET_ADDRESS,
    issuerAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    claimSignature: fakeSig('9a8b7c6d')
  },
  {
    key: 'pikachu',
    short: 'Pikachu #58',
    tone: 'emerald',
    checked: '14m ago',
    gradedAt: '2026-11-12T07:45:00Z',
    stateNote:
      'Encapsulated at grading and registered on-chain. Chip counter is at #21.',
    demo: true,
    verified: true,
    tagUid: '04A1B2C3D4E502',
    readCounter: 21,
    tokenId: 2,
    certId: 'CERT-PKMN-2026-0002',
    cardName: '1st Edition Shadowless Pikachu #58',
    cardSet: '1999 Pokémon Base Set',
    overallGrade: 9.5,
    subGrades: {
      centering: 9.5,
      surface: 10.0,
      corners: 9.5,
      edges: 9.5
    },
    variation: 'Shadowless',
    report: PIKACHU_REPORT,
    ipfsMetadataCid: 'QmZtmD2qtQgVPekm8a6ZububQ5D63Gzh9WAK7WeqBmyxyg',
    onChainState: 'SEALED',
    ownerAddress: DEMO_WALLET_ADDRESS,
    issuerAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    claimSignature: fakeSig('11223344')
  },
  {
    key: 'umbreon',
    short: 'Umbreon VMAX',
    tone: 'emerald',
    checked: '1h ago',
    gradedAt: '2026-11-03T09:10:00Z',
    stateNote:
      'Encapsulated at grading and registered on-chain. Chip counter is at #41.',
    demo: true,
    verified: true,
    tagUid: '04A1B2C3D4E5F6',
    readCounter: 41,
    tokenId: 104,
    certId: 'CERT-PKMN-2026-08921',
    cardName: 'Umbreon VMAX Alternate Art #215',
    cardSet: '2021 Pokémon Evolving Skies',
    overallGrade: 10.0,
    subGrades: {
      centering: 10.0,
      surface: 10.0,
      corners: 10.0,
      edges: 10.0
    },
    variation: 'Alternate Art',
    report: UMBREON_REPORT,
    ipfsMetadataCid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    onChainState: 'SEALED',
    ownerAddress: DEMO_WALLET_ADDRESS,
    issuerAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    claimSignature: fakeSig('55667788')
  },
  {
    key: 'illustrator',
    short: 'Illustrator Promo',
    tone: 'amber',
    checked: '3h ago',
    gradedAt: '2026-10-28T02:30:00Z',
    stateNote:
      'Custody transfer to 0x3C44…93BC started. Waiting for the recipient to tap the slab.',
    demo: true,
    verified: true,
    tagUid: '04A1B2C3D4E503',
    readCounter: 2,
    tokenId: 3,
    certId: 'CERT-PKMN-2026-0003',
    cardName: 'Pikachu Illustrator CoroCoro Promo',
    cardSet: '1998 Pokémon Japanese Promo',
    overallGrade: 9.0,
    subGrades: {
      centering: 9.0,
      surface: 9.0,
      corners: 9.0,
      edges: 9.0
    },
    report: ILLUSTRATOR_REPORT,
    ipfsMetadataCid: 'QmPZ9gcCEpqKTo6aq61g2nXGUhM4iCL3ewB6LDXZCtioEB',
    onChainState: 'IN_TRANSIT',
    ownerAddress: DEMO_WALLET_ADDRESS,
    issuerAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    claimSignature: fakeSig('9900aabb')
  }
];

export const SCENARIOS: ScenarioOption[] = [
  {
    scenario: 'VALID_CHARIZARD_SEALED',
    title: 'Charizard #4 (grade 10, sealed)',
    subtitle: 'Valid chip tap, counter #12',
    badge: 'Sealed',
    tone: 'emerald',
    payload: () => buildDemoTapPayload('VALID_CHARIZARD_SEALED')
  },
  {
    scenario: 'VALID_PIKACHU_SEALED',
    title: 'Pikachu #58 (grade 9.5, sealed)',
    subtitle: 'Valid chip tap, counter #22',
    badge: 'Sealed',
    tone: 'emerald',
    payload: () => buildDemoTapPayload('VALID_PIKACHU_SEALED')
  },
  {
    scenario: 'REPLAY_ATTACK',
    title: 'Replayed URL (counter mismatch)',
    subtitle: 'Stale counter 1 against recorded counter 5',
    badge: 'Replay',
    tone: 'rose',
    payload: () => buildDemoTapPayload('REPLAY_ATTACK')
  }
];

/** Demo activity. Only shown when the demo flag is on. */
export const SEED_EVENTS: ActivityEvent[] = [
  {
    id: 'demo_evt_1',
    tone: 'amber',
    title: 'Transfer started • Illustrator Promo',
    subtitle: 'Waiting for 0x3C44…93BC to tap the slab',
    time: '1m ago'
  },
  {
    id: 'demo_evt_2',
    tone: 'emerald',
    title: 'Charizard #4 scanned',
    subtitle: 'Counter #11 matched the on-chain record',
    time: '2m ago'
  },
  {
    id: 'demo_evt_3',
    tone: 'emerald',
    title: 'Pikachu #58 scanned',
    subtitle: 'Counter #21 matched the on-chain record',
    time: '14m ago'
  },
  {
    id: 'demo_evt_4',
    tone: 'rose',
    title: 'Replay attempt blocked on Pikachu #58',
    subtitle: 'Incoming counter 1 ≤ last counter 5',
    time: '42m ago'
  }
];

export interface ApiErrorResult {
  isError: true;
  code: string;
  message: string;
  usedFallback?: boolean;
}

export interface ApiSuccessResult {
  isError: false;
  data: SlabItem;
  usedFallback?: boolean;
}

export type VerifyResult = ApiSuccessResult | ApiErrorResult;

let charizardCounter = 11;
let pikachuCounter = 21;

function scannedCopy(base: SlabItem, counter: number, sigSeed: string): SlabItem {
  return {
    ...base,
    demo: false,
    readCounter: counter,
    checked: 'Just now',
    stateNote: `Chip counter #${counter} matched the on-chain record.`,
    claimSignature: fakeSig(sigSeed)
  };
}

export function mockVerify(
  input: DemoTriggerScenario | ParsedSunUrl
): VerifyResult {
  const scenario: DemoTriggerScenario =
    typeof input === 'string'
      ? input
      : input.piccData.endsWith(':1')
        ? 'REPLAY_ATTACK'
        : input.piccData.includes('04A1B2C3D4E502')
          ? 'VALID_PIKACHU_SEALED'
          : 'VALID_CHARIZARD_SEALED';

  if (scenario === 'REPLAY_ATTACK') {
    return {
      isError: true,
      code: 'ERR_REPLAY_ATTACK',
      message:
        'Read counter 1 is less than or equal to last authenticated counter (5).'
    };
  }

  if (scenario === 'VALID_PIKACHU_SEALED') {
    pikachuCounter += 1;
    const base = SLABS.find((s) => s.key === 'pikachu')!;
    return {
      isError: false,
      data: scannedCopy(base, pikachuCounter, `b2c3${pikachuCounter}`)
    };
  }

  charizardCounter += 1;
  const base = SLABS.find((s) => s.key === 'charizard')!;
  return {
    isError: false,
    data: scannedCopy(base, charizardCounter, `9a8b${charizardCounter}`)
  };
}
