export function injectLatency(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}
