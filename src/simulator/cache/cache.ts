import type { Cache } from "./types";
import type { RAM } from "../memory/types";

import {
  readMemory,
  writeMemory,
} from "../memory/memory";

export const CACHE_SIZE = 4;

export function createInitialCache(): Cache {
  return {
    lines: Array(CACHE_SIZE).fill(null),
    nextToReplace: 0,
  };
}
export function readCache(
  cache: Cache,
  memory: RAM,
  address: number
) {
  const lineIndex = cache.lines.findIndex(
    (line) => line !== null && line.address === address
  );

  // Cache hit: o dado já está na cache.
  if (lineIndex !== -1) {
    const line = cache.lines[lineIndex]!;

    return {
      value: line.value,
      cache: {
        ...cache,
        lines: [...cache.lines],
      },
      hit: true,
    };
  }

  // Cache miss: busca o dado na RAM.
  const value = readMemory(memory, address);

  const updatedLines = [...cache.lines];

  updatedLines[cache.nextToReplace] = {
    address,
    value,
  };

  const updatedCache: Cache = {
    lines: updatedLines,
    nextToReplace: (cache.nextToReplace + 1) % CACHE_SIZE,
  };

  return {
    value,
    cache: updatedCache,
    hit: false,
  };
}
export function writeCache(
  cache: Cache,
  memory: RAM,
  address: number,
  value: number
) {
  // Write-through: atualiza a RAM imediatamente.
  const updatedMemory = writeMemory(
    memory,
    address,
    value
  );

  const lineIndex = cache.lines.findIndex(
    (line) => line !== null && line.address === address
  );

  const updatedLines = [...cache.lines];

  let nextToReplace = cache.nextToReplace;

  if (lineIndex !== -1) {
    // O endereço já existe na cache.
    updatedLines[lineIndex] = {
      address,
      value,
    };
  } else {
    // Write-allocate: adiciona o endereço à cache.
    updatedLines[nextToReplace] = {
      address,
      value,
    };

    nextToReplace = (nextToReplace + 1) % CACHE_SIZE;
  }

  return {
    memory: updatedMemory,
    cache: {
      lines: updatedLines,
      nextToReplace,
    },
    hit: lineIndex !== -1,
  };
}