
import type { RAM } from "../memory/types";
import { RAM_SIZE, writeMemory } from "../memory/memory";
import { encodeInstruction } from "./instructions";
import type { Instruction } from "./types";

export function loadProgram(
  memory: RAM,
  program: Instruction[],
  startAddress: number = 0
): RAM {
  if (
    !Number.isInteger(startAddress) ||
    startAddress < 0 ||
    startAddress >= RAM_SIZE
  ) {
    throw new Error("Endereço inicial inválido.");
  }

  if (startAddress + program.length > RAM_SIZE) {
    throw new Error("O programa ultrapassa o limite da memória RAM.");
  }

  let updatedMemory = [...memory];

  program.forEach((instruction, index) => {
    const encodedInstruction = encodeInstruction(instruction);

    updatedMemory = writeMemory(
      updatedMemory,
      startAddress + index,
      encodedInstruction
    );
  });

  return updatedMemory;
}
