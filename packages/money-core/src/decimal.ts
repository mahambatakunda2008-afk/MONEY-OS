export function assertDecimal(value: string): void {
  if (!/^\d+(?:\.\d+)?$/.test(value)) {
    throw new Error(`Invalid non-negative decimal: ${value}`);
  }
}

function scaledPair(a: string, b: string): { left: bigint; right: bigint; scale: number } {
  assertDecimal(a);
  assertDecimal(b);
  const [ai, af = ""] = a.split(".");
  const [bi, bf = ""] = b.split(".");
  const scale = Math.max(af.length, bf.length);
  return {
    left: BigInt(ai + af.padEnd(scale, "0")),
    right: BigInt(bi + bf.padEnd(scale, "0")),
    scale,
  };
}

function formatScaled(value: bigint, scale: number): string {
  if (value < 0n) throw new Error("Decimal result cannot be negative");
  const raw = value.toString().padStart(scale + 1, "0");
  if (scale === 0) return raw;
  return `${raw.slice(0, -scale)}.${raw.slice(-scale)}`
    .replace(/\.0+$/, "")
    .replace(/(\.\d*?)0+$/, "$1");
}

export function compareDecimal(a: string, b: string): number {
  const { left, right } = scaledPair(a, b);
  return left < right ? -1 : left > right ? 1 : 0;
}

export function addDecimal(a: string, b: string): string {
  const { left, right, scale } = scaledPair(a, b);
  return formatScaled(left + right, scale);
}

export function subtractDecimal(a: string, b: string): string {
  const { left, right, scale } = scaledPair(a, b);
  if (left < right) throw new Error(`Decimal subtraction would be negative: ${a} - ${b}`);
  return formatScaled(left - right, scale);
}
