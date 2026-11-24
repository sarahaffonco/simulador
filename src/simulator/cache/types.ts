export interface CacheLine {
  address: number;
  value: number;
}

export interface Cache {
  lines: (CacheLine | null)[];
  nextToReplace: number;
}