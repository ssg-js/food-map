/** Best-effort cross-tab notification. Storage restrictions must not block logout. */
export function notifySessionChanged() {
  try {
    localStorage.setItem("food-map-session", String(Date.now()));
  } catch {
    // Other tabs still verify on focus/pageshow; no credentials are stored here.
  }
}
