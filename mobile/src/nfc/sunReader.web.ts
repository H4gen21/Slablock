export interface ParsedSunUrl {
  piccData: string;
  cmac: string;
  rawUrl?: string;
}

/**
 * Extracts `picc_data` (or `piccData` / `e`) and `cmac` (or `c`) query parameters
 * from an NXP NTAG 424 DNA Dynamic SUN NDEF URI record.
 */
export function parseSunNdefUrl(ndefUrl: string): ParsedSunUrl {
  const queryStart = ndefUrl.indexOf('?');
  if (queryStart === -1) {
    throw new Error('NDEF URL does not contain dynamic SUN query parameters.');
  }

  const queryString = ndefUrl.slice(queryStart + 1);
  const params = new URLSearchParams(queryString);

  const piccData =
    params.get('picc_data') || params.get('piccData') || params.get('e') || '';
  const cmac = params.get('cmac') || params.get('c') || '';

  if (!piccData || !cmac) {
    throw new Error('Missing picc_data or cmac in NTAG 424 DNA SUN URL.');
  }

  return {
    piccData: piccData.toUpperCase(),
    cmac: cmac.toUpperCase(),
    rawUrl: ndefUrl
  };
}

/**
 * Web-specific implementation of scanPhysicalNtag424 (avoids importing react-native-nfc-manager on Web).
 */
export async function scanPhysicalNtag424(): Promise<ParsedSunUrl> {
  throw new Error(
    'Web Browser Mode detected: Physical NFC ISO-14443-4 hardware is unavailable in desktop browsers. Use the Dev Demo Mode buttons below to simulate NTAG 424 DNA taps.'
  );
}

let charizardSimCounter = 10;
let pikachuSimCounter = 20;

/**
 * Generates simulated SUN payloads for the 3 Dev Demo Mode quick-trigger scenarios.
 */
export function buildDemoTapPayload(
  scenario: 'VALID_CHARIZARD_SEALED' | 'VALID_PIKACHU_SEALED' | 'REPLAY_ATTACK'
): ParsedSunUrl {
  switch (scenario) {
    case 'VALID_CHARIZARD_SEALED': {
      charizardSimCounter += 1;
      const piccData = `SIM:04A1B2C3D4E501:${charizardSimCounter}`;
      const cmac = '8E54A92B1C77F43D';
      return {
        piccData,
        cmac,
        rawUrl: `https://verify.slablock.io/tap?picc_data=${piccData}&cmac=${cmac}`
      };
    }
    case 'VALID_PIKACHU_SEALED': {
      pikachuSimCounter += 1;
      const piccData = `SIM:04A1B2C3D4E502:${pikachuSimCounter}`;
      const cmac = 'F4A1903BC8271E09';
      return {
        piccData,
        cmac,
        rawUrl: `https://verify.slablock.io/tap?picc_data=${piccData}&cmac=${cmac}`
      };
    }
    case 'REPLAY_ATTACK': {
      // Counter 1 is <= last authenticated counter on tag 04A1B2C3D4E502 (lastCounter >= 5)
      const piccData = 'SIM:04A1B2C3D4E502:1';
      const cmac = '8E54A92B1C77F43D';
      return {
        piccData,
        cmac,
        rawUrl: `https://verify.slablock.io/tap?picc_data=${piccData}&cmac=${cmac}`
      };
    }
  }
}
