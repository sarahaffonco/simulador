
import type { CPURegisters } from "./types";

export const INITIAL_REGISTERS: CPURegisters = {
  PC: 0,
  IR: null,
  ACC: 0,
  MAR: 0,
  MDR: 0,
  FLAGS: {
    zero: false,
    negative: false,
    carry: false,
  },
};

export function createInitialRegisters(): CPURegisters {
  return {
    ...INITIAL_REGISTERS,
    FLAGS: {
      ...INITIAL_REGISTERS.FLAGS,
    },
  };
}

export function updateRegisters(
  current: CPURegisters,
  updates: Partial<Pick<CPURegisters, "PC" | "IR" | "ACC" | "MAR" | "MDR">>
): CPURegisters {
  return {
    ...current,
    ...updates,
  };
}

export function updateFlags(
  current: CPURegisters,
  flags: Partial<CPURegisters["FLAGS"]>
): CPURegisters {
  return {
    ...current,
    FLAGS: {
      ...current.FLAGS,
      ...flags,
    },
  };
}

