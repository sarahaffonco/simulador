
export interface CPUFlags {
  zero: boolean;
  negative: boolean;
  carry: boolean;
}

export interface CPURegisters {
  PC: number;
  IR: string | null;
  ACC: number;
  MAR: number;
  MDR: number;
  FLAGS: CPUFlags;
}

export type CPUStatus = "ready" | "running" | "halted" | "error";