export async function readApiErrorMessage(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  try {
    const data: unknown = await response.json();

    if (typeof data === "object" && data !== null && "message" in data) {
      const { message } = data as { message: unknown };

      if (typeof message === "string" && message) {
        return message;
      }
    }
  } catch {
    // Error responses are not guaranteed to carry a JSON body.
  }

  return fallbackMessage;
}
