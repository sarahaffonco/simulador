import type { IOController } from "./types";

export function createInitialIO(): IOController {
  return {
    input: null,
    output: [],
  };
}

export function setInput(
  io: IOController,
  value: number
): IOController {
  if (!Number.isInteger(value) || value < 0 || value > 65535) {
    throw new Error("Valor de entrada inválido. Utilize um número de 0 a 65535.");
  }

  return {
    ...io,
    input: value,
  };
}

export function consumeInput(io: IOController) {
  if (io.input === null) {
    throw new Error("Nenhum valor disponível no teclado.");
  }

  return {
    value: io.input,
    io: {
      ...io,
      input: null,
    },
  };
}

export function sendOutput(
  io: IOController,
  value: number
): IOController {
  return {
    ...io,
    output: [...io.output, value],
  };
}