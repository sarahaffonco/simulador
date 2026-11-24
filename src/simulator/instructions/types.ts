
export const Opcode = {
  LOAD: 1,
  STORE: 2,
  ADD: 3,
  SUB: 4,
  IN: 5,
  OUT: 6,
  HLT: 7,
} as const;

export type Opcode = (typeof Opcode)[keyof typeof Opcode];

export interface Instruction {
  opcode: Opcode;
  operand: number;
}
