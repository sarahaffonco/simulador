
import type { CPURegisters } from "./types";
import type { RAM } from "../memory/types";
import type { Cache } from "../cache/types";
import type { IOController } from "../io/types";

import { readCache, writeCache } from "../cache/cache";
import { decodeInstruction } from "../instructions/instructions";
import { Opcode } from "../instructions/types";
import { add, subtract } from "./alu";

import {
  consumeInput,
  sendOutput,
} from "../io/controller";

export interface CPUExecutionResult {
  registers: CPURegisters;
  memory: RAM;
  cache: Cache;
  halted: boolean;
  io: IOController;
}

export function executeInstruction(
  registers: CPURegisters,
  memory: RAM,
  cache: Cache,
  io: IOController
): CPUExecutionResult {
  const updatedRegisters = {
    ...registers,
    FLAGS: { ...registers.FLAGS },
  };

  let updatedMemory = memory;
  let updatedCache = cache;
  let updatedIO = {
    ...io,
    output: [...io.output],
  };

  let halted = false;

  // FETCH
  const fetchResult = readCache(
    updatedCache,
    updatedMemory,
    updatedRegisters.PC
  );

  updatedCache = fetchResult.cache;

  const instructionValue = fetchResult.value;

  updatedRegisters.MAR = updatedRegisters.PC;
  updatedRegisters.MDR = instructionValue;
  updatedRegisters.IR = instructionValue.toString();
  updatedRegisters.PC += 1;

  // DECODE
  const instruction = decodeInstruction(instructionValue);

  // EXECUTE
  switch (instruction.opcode) {
    case Opcode.LOAD: {
      const result = readCache(
        updatedCache,
        updatedMemory,
        instruction.operand
      );

      updatedCache = result.cache;
      updatedRegisters.MAR = instruction.operand;
      updatedRegisters.MDR = result.value;
      updatedRegisters.ACC = result.value;

      break;
    }

    case Opcode.STORE: {
      const result = writeCache(
        updatedCache,
        updatedMemory,
        instruction.operand,
        updatedRegisters.ACC
      );

      updatedCache = result.cache;
      updatedMemory = result.memory;

      updatedRegisters.MAR = instruction.operand;
      updatedRegisters.MDR = updatedRegisters.ACC;

      break;
    }

    case Opcode.ADD: {
      const readResult = readCache(
        updatedCache,
        updatedMemory,
        instruction.operand
      );

      updatedCache = readResult.cache;

      updatedRegisters.MAR = instruction.operand;
      updatedRegisters.MDR = readResult.value;

      const result = add(
        updatedRegisters.ACC,
        readResult.value
      );

      updatedRegisters.ACC = result.result;

      updatedRegisters.FLAGS = {
        zero: result.zero,
        negative: result.negative,
        carry: result.carry,
      };

      break;
    }

    case Opcode.SUB: {
      const readResult = readCache(
        updatedCache,
        updatedMemory,
        instruction.operand
      );

      updatedCache = readResult.cache;

      updatedRegisters.MAR = instruction.operand;
      updatedRegisters.MDR = readResult.value;

      const result = subtract(
        updatedRegisters.ACC,
        readResult.value
      );

      updatedRegisters.ACC = result.result;

      updatedRegisters.FLAGS = {
        zero: result.zero,
        negative: result.negative,
        carry: result.carry,
      };

      break;
    }

    case Opcode.IN: {
      const inputResult = consumeInput(updatedIO);

      updatedRegisters.ACC = inputResult.value;

      updatedRegisters.FLAGS = {
        ...updatedRegisters.FLAGS,
        zero: inputResult.value === 0,
        negative: (inputResult.value & 0x8000) !== 0,
      };

      updatedIO = inputResult.io;

      break;
    }

    case Opcode.OUT: {
      updatedIO = sendOutput(
        updatedIO,
        updatedRegisters.ACC
      );

      break;
    }

    case Opcode.HLT: {
      halted = true;
      break;
    }

    default: {
      throw new Error("Instrução não reconhecida.");
    }
  }

  return {
    registers: updatedRegisters,
    memory: updatedMemory,
    cache: updatedCache,
    io: updatedIO,
    halted,
  };
}
