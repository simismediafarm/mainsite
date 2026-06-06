export async function withBackoff<T>(
  operation: (signal?: AbortSignal) => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000,
  signal?: AbortSignal
): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    if (signal?.aborted) {
      throw new Error('Operation aborted');
    }
    try {
      return await operation(signal);
    } catch (error: any) {
      attempt++;
      if (attempt >= maxRetries) {
        throw error;
      }
      // Check if it's a non-retryable error (e.g. 400 Bad Request)
      if (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw error;
      }
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.warn(`[Backoff] Attempt ${attempt} failed. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('Unreachable code in withBackoff');
}
