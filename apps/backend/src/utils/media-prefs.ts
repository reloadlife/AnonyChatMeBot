import type { MediaType } from "~/controllers/message.controller"
import type { UserModel } from "~/db/schema"

export const ALL_MEDIA_TYPES: MediaType[] = [
  "photo",
  "video",
  "voice",
  "audio",
  "document",
  "sticker",
  "animation",
]

/**
 * Parses the stored JSON column into a Set of allowed types.
 * null → all types allowed (returns null to distinguish from explicit empty set).
 */
export function parseAllowedMediaTypes(raw: string | null): Set<MediaType> | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return null
    return new Set(parsed.filter((t): t is MediaType => ALL_MEDIA_TYPES.includes(t as MediaType)))
  } catch {
    return null
  }
}

/** Returns true if the given media type is accepted by this user. */
export function isMediaTypeAllowed(user: UserModel, mediaType: MediaType): boolean {
  const allowed = parseAllowedMediaTypes(user.allowed_media_types)
  if (!allowed) return true // null = all allowed
  return allowed.has(mediaType)
}

/**
 * Toggles a media type in the allowed set and returns the new JSON string.
 * If all types end up allowed, returns null (removes restriction).
 */
export function toggleMediaType(current: string | null, type: MediaType): string | null {
  const allowed = parseAllowedMediaTypes(current) ?? new Set(ALL_MEDIA_TYPES)
  if (allowed.has(type)) {
    allowed.delete(type)
  } else {
    allowed.add(type)
  }
  // If all types are allowed, store null (no restriction)
  if (ALL_MEDIA_TYPES.every((t) => allowed.has(t))) return null
  return JSON.stringify([...allowed])
}
