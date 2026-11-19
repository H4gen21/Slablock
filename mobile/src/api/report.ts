import { SLABS } from '../data/demo';
import type { GradeReport } from '../types/report';

/**
 * Returns the grade report for a token, or null when none is available.
 *
 * TODO: fetch from ipfs://<ipfsMetadataCid>/report.json. This will become
 * async once the report is pinned alongside the token metadata.
 */
export function getReport(tokenId: number): GradeReport | null {
  return SLABS.find((s) => s.tokenId === tokenId)?.report ?? null;
}
