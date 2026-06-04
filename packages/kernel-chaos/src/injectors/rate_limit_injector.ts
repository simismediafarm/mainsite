export function shouldRateLimit(prob: number): boolean {
  return Math.random() < prob;
}
