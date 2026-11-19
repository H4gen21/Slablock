import { PrismaClient, type ItemState, type TamperStatus } from '@prisma/client';
import { deriveDiversifiedKey } from '../crypto/sun.js';

export interface SlabAssetRecord {
  tokenId: number;
  certId: string;
  tagUid: string;
  issuerId: string;
  cardName: string;
  cardSet: string;
  overallGrade: number;
  centeringGrade: number;
  surfaceGrade: number;
  cornersGrade: number;
  edgesGrade: number;
  currentState: ItemState;
  ipfsMetadataCid: string;
  currentOwnerWallet: string;
  nonce: number;
}

export interface PhysicalTagRecord {
  uid: string;
  diversifiedKey: string;
  lastCounter: number;
  tamperStatus: TamperStatus;
}

export class SlabLockStore {
  public prisma: PrismaClient;
  private tags = new Map<string, PhysicalTagRecord>();
  private slabsByTagUid = new Map<string, SlabAssetRecord>();
  private slabsByCertId = new Map<string, SlabAssetRecord>();
  private slabsByTokenId = new Map<number, SlabAssetRecord>();
  private nextTokenId = 105;

  constructor(masterKeyHex = process.env.NTAG_MASTER_KEY || '00112233445566778899AABBCCDDEEFF') {
    this.prisma = new PrismaClient();
    this.seedDefaults(masterKeyHex);
  }

  public seedDefaults(masterKeyHex: string): void {
    const defaultIssuer = '00000000-0000-4000-8000-000000000001';
    const defaultOwner = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

    const initialSeeds: Array<{
      tokenId: number;
      certId: string;
      tagUid: string;
      cardName: string;
      cardSet: string;
      overallGrade: number;
      centeringGrade: number;
      surfaceGrade: number;
      cornersGrade: number;
      edgesGrade: number;
      currentState: ItemState;
      ipfsMetadataCid: string;
      lastCounter: number;
    }> = [
      {
        tokenId: 1,
        certId: 'CERT-PKMN-2026-0001',
        tagUid: '04A1B2C3D4E501',
        cardName: '1st Edition Shadowless Holo Charizard #4',
        cardSet: '1999 Pokemon Base Set',
        overallGrade: 10.0,
        centeringGrade: 10.0,
        surfaceGrade: 10.0,
        cornersGrade: 10.0,
        edgesGrade: 10.0,
        currentState: 'SEALED',
        ipfsMetadataCid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
        lastCounter: 0
      },
      {
        tokenId: 2,
        certId: 'CERT-PKMN-2026-0002',
        tagUid: '04A1B2C3D4E502',
        cardName: '1st Edition Shadowless Pikachu #58',
        cardSet: '1999 Pokemon Base Set',
        overallGrade: 9.5,
        centeringGrade: 9.5,
        surfaceGrade: 9.5,
        cornersGrade: 10.0,
        edgesGrade: 9.0,
        currentState: 'UNSEALED',
        ipfsMetadataCid: 'QmZtmD2qtQgVPekm8a6ZububQ5D63Gzh9WAK7WeqBmyxyg',
        lastCounter: 5
      },
      {
        tokenId: 3,
        certId: 'CERT-PKMN-2026-0003',
        tagUid: '04A1B2C3D4E503',
        cardName: 'Pikachu Illustrator CoroCoro Promo',
        cardSet: '1998 Pokemon Japanese Promo',
        overallGrade: 9.0,
        centeringGrade: 9.0,
        surfaceGrade: 9.0,
        cornersGrade: 9.0,
        edgesGrade: 9.0,
        currentState: 'VOID',
        ipfsMetadataCid: 'QmPZ9gcCEpqKTo6aq61g2nXGUhM4iCL3ewB6LDXZCtioEB',
        lastCounter: 2
      },
      {
        tokenId: 104,
        certId: 'CERT-PKMN-2026-08921',
        tagUid: '04A1B2C3D4E5F6',
        cardName: 'Umbreon VMAX Alternate Art #215',
        cardSet: '2021 Pokemon Evolving Skies',
        overallGrade: 10.0,
        centeringGrade: 10.0,
        surfaceGrade: 9.5,
        cornersGrade: 10.0,
        edgesGrade: 10.0,
        currentState: 'SEALED',
        ipfsMetadataCid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
        lastCounter: 41
      }
    ];

    for (const seed of initialSeeds) {
      const uid = seed.tagUid.toUpperCase();
      const divKey = deriveDiversifiedKey(masterKeyHex, uid).toString('hex').toUpperCase();
      this.tags.set(uid, {
        uid,
        diversifiedKey: divKey,
        lastCounter: seed.lastCounter,
        tamperStatus: seed.currentState === 'UNSEALED' ? 'BREACHED' : 'INTACT'
      });

      const slab: SlabAssetRecord = {
        tokenId: seed.tokenId,
        certId: seed.certId,
        tagUid: uid,
        issuerId: defaultIssuer,
        cardName: seed.cardName,
        cardSet: seed.cardSet,
        overallGrade: seed.overallGrade,
        centeringGrade: seed.centeringGrade,
        surfaceGrade: seed.surfaceGrade,
        cornersGrade: seed.cornersGrade,
        edgesGrade: seed.edgesGrade,
        currentState: seed.currentState,
        ipfsMetadataCid: seed.ipfsMetadataCid,
        currentOwnerWallet: defaultOwner,
        nonce: 0
      };

      this.slabsByTagUid.set(uid, slab);
      this.slabsByCertId.set(seed.certId, slab);
      this.slabsByTokenId.set(seed.tokenId, slab);
    }
  }

  public getTagByUid(uid: string): PhysicalTagRecord | undefined {
    return this.tags.get(uid.toUpperCase());
  }

  public getSlabByTagUid(uid: string): SlabAssetRecord | undefined {
    return this.slabsByTagUid.get(uid.toUpperCase());
  }

  public getSlabByCertId(certId: string): SlabAssetRecord | undefined {
    return this.slabsByCertId.get(certId);
  }

  public getAllSlabs(): Array<SlabAssetRecord & { lastCounter: number; tamperStatus: TamperStatus }> {
    const results: Array<SlabAssetRecord & { lastCounter: number; tamperStatus: TamperStatus }> = [];
    for (const slab of this.slabsByTokenId.values()) {
      const tag = this.tags.get(slab.tagUid.toUpperCase());
      results.push({
        ...slab,
        lastCounter: tag?.lastCounter ?? 0,
        tamperStatus: tag?.tamperStatus ?? 'INTACT'
      });
    }
    return results;
  }

  public updateSlabOwner(tokenId: number, newOwnerWallet: string): SlabAssetRecord | undefined {
    const slab = this.slabsByTokenId.get(tokenId);
    if (!slab) return undefined;
    slab.currentOwnerWallet = newOwnerWallet;
    if (slab.currentState === 'IN_TRANSIT') {
      slab.currentState = 'SEALED';
    }
    slab.nonce += 1;
    return slab;
  }

  public updateTagCounter(uid: string, newCounter: number): void {
    const upper = uid.toUpperCase();
    const tag = this.tags.get(upper);
    if (tag) {
      tag.lastCounter = newCounter;
    }
    const slab = this.slabsByTagUid.get(upper);
    if (slab) {
      slab.nonce += 1;
    }
  }

  public createEncapsulatedSlab(params: {
    certId: string;
    tagUid: string;
    diversifiedKey: string;
    issuerId?: string;
    cardName: string;
    cardSet: string;
    overallGrade: number;
    centeringGrade: number;
    surfaceGrade: number;
    cornersGrade: number;
    edgesGrade: number;
    ipfsMetadataCid: string;
    recipientWallet: string;
  }): SlabAssetRecord {
    const uid = params.tagUid.toUpperCase();
    if (this.slabsByCertId.has(params.certId)) {
      throw new Error('ERR_CERT_ALREADY_REGISTERED');
    }
    if (this.tags.has(uid)) {
      throw new Error('ERR_TAG_ALREADY_REGISTERED');
    }

    const tokenId = this.nextTokenId++;
    this.tags.set(uid, {
      uid,
      diversifiedKey: params.diversifiedKey,
      lastCounter: 0,
      tamperStatus: 'INTACT'
    });

    const slab: SlabAssetRecord = {
      tokenId,
      certId: params.certId,
      tagUid: uid,
      issuerId: params.issuerId ?? '00000000-0000-4000-8000-000000000001',
      cardName: params.cardName,
      cardSet: params.cardSet,
      overallGrade: params.overallGrade,
      centeringGrade: params.centeringGrade,
      surfaceGrade: params.surfaceGrade,
      cornersGrade: params.cornersGrade,
      edgesGrade: params.edgesGrade,
      currentState: 'SEALED',
      ipfsMetadataCid: params.ipfsMetadataCid,
      currentOwnerWallet: params.recipientWallet,
      nonce: 0
    };

    this.slabsByTagUid.set(uid, slab);
    this.slabsByCertId.set(params.certId, slab);
    this.slabsByTokenId.set(tokenId, slab);

    return slab;
  }
}
