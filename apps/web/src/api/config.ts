export const API_BASE_URL = "http://localhost:3131/api"

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "")

const DEFAULT_PROFILE_PICTURE = "default-profile-picture.png"

export function getProfilePictureUrl(profilePicture?: string | null) {
  if (!profilePicture || profilePicture === DEFAULT_PROFILE_PICTURE) {
    return `${API_ORIGIN}/public/images/${DEFAULT_PROFILE_PICTURE}`
  }

  return `${API_ORIGIN}/uploads/${encodeURIComponent(profilePicture)}`
}
