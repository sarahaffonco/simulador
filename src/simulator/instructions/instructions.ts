
import { Opcode, type Instruction } from "./types";

export function encodeInstruction(
    instruction: Instruction
): number {
    const { opcode, operand } = instruction;

    if (
        !Number.isInteger(operand) ||
        operand < 0 ||
        operand > 255
    ) {
        throw new Error(
            "Operando inválido. Utilize um valor entre 0 e 255."
        );
    }

    if (!Object.values(Opcode).includes(opcode)) {
        throw new Error("Opcode inválido.");
    }

    return (opcode << 8) | operand;
}

export function decodeInstruction(
    value: number
): Instruction {
    if (
        !Number.isInteger(value) ||
        value < 0 ||
        value > 65535
    ) {
        throw new Error(
            "Instrução inválida. Esperado um valor de 16 bits."
        );
    }

    const opcode = (value >> 8) & 0xff;
    const operand = value & 0xff;

    const validOpcodes: number[] = Object.values(Opcode);

    if (!validOpcodes.includes(opcode)) {
        throw new Error("Código de operação desconhecido.");
    }

    return {
        opcode: opcode as Opcode,
        operand,
    };
}
