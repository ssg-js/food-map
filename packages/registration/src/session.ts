let token = "";
export function setSessionToken(value: string) {
  token = value;
}
export function sessionHeaders(): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
