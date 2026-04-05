import Hashids from "hashids"

const MIN_LENGTH = 8

function make(salt: string) {
  return new Hashids(salt, MIN_LENGTH)
}

/** Encodes a numeric DB user ID into a short opaque string. */
export function encodeId(salt: string, id: number): string {
  return make(salt).encode(id)
}

/** Decodes a hashid back to a numeric DB user ID. Returns null if invalid or empty. */
export function decodeId(salt: string, hash: string): number | null {
  const ids = make(salt).decode(hash)
  return ids.length === 1 ? (ids[0] as number) : null
}
