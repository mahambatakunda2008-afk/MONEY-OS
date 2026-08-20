export function assertDecimal(value: string): void {
  if (!/^\d+(?:\.\d+)?$/.test(value)) {
    throw new Error(`Invalid non-negative decimal: ${value}`);
  }
}

export function compareDecimal(a: string, b: string): number {
  assertDecimal(a);
  assertDecimal(b);

  const [ai, af = ""] = a.split(".");
  const [bi, bf = ""] = b.split(".");
  const scale = Math.max(af.length, bf.length);
  const left = BigInt(ai + af.padEnd(scale, "0"));
  const right = BigInt(bi + bf.padEnd(scale, "0"));

  return left < right ? -1 : left > right ? 1 : 0;
}

export function addDecimal(a: string, b: string): string {
  assertDecimal(a);
  assertDecimal(b);

  const [ai, af = ""] = a.split(".");
  const [bi, bf = ""] = b.split(".");
  const scale = Math.max(af.length, bf.length);
  const total = BigInt(ai + af.padEnd(scale, "0")) + BigInt(bi + bf.padEnd(scale, "0"));
  const raw = total.toString().padStart(scale + 1, "0");

  if (scale === 0) return raw;
  return `${raw.slice(0, -scale)}.${raw.slice(-scale)}`.replace(/\.0+$/, "");
}
