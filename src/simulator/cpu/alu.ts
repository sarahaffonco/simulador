
export interface ALUResult {
  result: number;
  zero: boolean;
  negative: boolean;
  carry: boolean;
}

const WORD_MAX = 0xFFFF;
const SIGN_BIT = 0x8000;

export function add(
  a: number,
  b: number
): ALUResult {
  const sum = a + b;

  const result = sum & WORD_MAX;

  return {
    result,
    zero: result === 0,
    negative: (result & SIGN_BIT) !== 0,
    carry: sum > WORD_MAX,
  };
}


export function subtract(
  a: number,
  b: number
): ALUResult {
  const result = (a - b) & WORD_MAX;

  return {
    result,
    zero: result === 0,
    negative: (result & SIGN_BIT) !== 0,
    carry: a >= b,
  };
}
