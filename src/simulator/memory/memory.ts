
import type { RAM } from "./types";

export const RAM_SIZE = 256;

export const WORD_MAX = 65535;

export function createInitialMemory(): RAM {
  return Array(RAM_SIZE).fill(0);
}

export function readMemory(
  memory: RAM,
  address: number
): number {
  if (
    !Number.isInteger(address) ||
    address < 0 ||
    address >= RAM_SIZE
  ) {
    throw new Error("Endereço de memória inválido.");
  }

  return memory[address];
}

export function writeMemory(
  memory: RAM,
  address: number,
  value: number
): RAM {
  if (
    !Number.isInteger(address) ||
    address < 0 ||
    address >= RAM_SIZE
  ) {
    throw new Error("Endereço de memória inválido.");
  }

  if (
    !Number.isInteger(value) ||
    value < 0 ||
    value > WORD_MAX
  ) {
    throw new Error("Valor inválido. A memória aceita valores de 0 a 65535.");
  }

  const updatedMemory = [...memory];

  updatedMemory[address] = value;

  return updatedMemory;
}
