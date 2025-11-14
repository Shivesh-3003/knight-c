import { stringToHex, pad } from 'viem';

export function stringToBytes32(str: string): `0x${string}` {
  return pad(stringToHex(str), { size: 32 });
}
