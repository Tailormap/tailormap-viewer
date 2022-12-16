/* eslint-disable no-bitwise */

/**
 * Implementation of Xorshift32, a PRNG, with slight modifications to allow
 * mixing in entropy. It is used to lightly obfuscate the contents of bookmark
 * fragments, and as a slight checksum to handle any typos.
 *
 * @remarks
 *
 * Note that this is not a cryptographically secure PRNG at all, and the
 * changes made to it are unlikely to make it any more secure. Its only use is
 * to decrease the chances of any typos being recognized as invalid data, as
 * well as any length changes.
 */
export class Xorshift {
  private a = 0;

  constructor(initId: string, initLength: number) {
    this.a = initLength;

    for (let i = 0; i < initId.length; i++) {
        this.a = this.a * 31 + initId.charCodeAt(i);
    }
  }

  private tick(): number {
    let x = this.a;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return this.a = x;
  }

  public encode(val: number): number {
    this.tick();
    this.a ^= val;
    return this.a & 0xFF;
  }

  public decode(encoded: number): number {
    this.tick();
    const val = (this.a ^ encoded) & 0xFF;
    this.a ^= val;
    return val;
  }
}
