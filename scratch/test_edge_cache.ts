import { InMemoryCdnProvider } from "../apps/api/src/distribution/InMemoryCdnProvider";

async function runSimulator() {
  console.log("=== Edge Cache Race Simulation ===");
  
  const cdn = new InMemoryCdnProvider();
  const themeId = "theme-1";
  const tag = `theme-${themeId}`;
  const url = `https://api.simis.io/v1/css/${themeId}`;

  // State in Origin DB
  let originState = "v1-content";

  // Simulate Origin Fetch with latency
  async function fetchFromOrigin(): Promise<string> {
    console.log(`[Edge] Cache MISS. Fetching from origin in-flight...`);
    const fetchedContent = originState; // Capture origin state at time of fetch
    await new Promise(r => setTimeout(r, 100)); // Simulate network latency
    return fetchedContent;
  }

  // 1. Initial State: Origin is at v1, CDN has v1
  originState = "v1-content";
  await cdn.set(url, { headers: {}, body: originState }, [tag]);
  console.log(`[CDN] Initial state: ${url} -> ${(await cdn.get(url))?.body}`);

  // 2. Promotion occurs: Origin moves to v2, CDN is purged
  console.log("\n[Origin] PROMOTION OCCURS (v1 -> v2)");
  originState = "v2-content";
  console.log(`[Origin] Purging tag: ${tag}`);
  await cdn.purge(tag);
  
  // 3. Client requests the artifact -> Cache MISS
  console.log("\n[Client] Requesting artifact...");
  let cacheHit = await cdn.get(url);
  if (!cacheHit) {
    // 4. Cache Miss In-Flight
    const fetchPromise = fetchFromOrigin().then(async (body) => {
      console.log(`[Edge] Fetch completed. Writing to cache: ${body}`);
      await cdn.set(url, { headers: {}, body }, [tag]);
      return body;
    });

    // 5. While in-flight, a ROLLBACK occurs on the origin!
    console.log("\n[Origin] ROLLBACK OCCURS WHILE FETCH IN-FLIGHT (v2 -> v1)");
    originState = "v1-content";
    console.log(`[Origin] Purging tag: ${tag}`);
    await cdn.purge(tag);

    // Wait for the in-flight fetch to complete
    const response = await fetchPromise;
    console.log(`[Client] Received: ${response}`);
  }

  // 6. Check final cache state
  console.log("\n[Check] Final CDN Cache State");
  const finalCache = await cdn.get(url);
  console.log(`[CDN] Current cached content: ${finalCache?.body}`);
  
  if (finalCache?.body !== originState) {
    console.log("🚨 RACE CONDITION DETECTED! CDN Cache is inconsistent with Origin!");
    console.log(`Origin: ${originState}, CDN: ${finalCache?.body}`);
    console.log("This demonstrates why eventual consistency in CDNs requires generation tokens or cache-control headers (like stale-while-revalidate) configured to ignore late-arriving sets if a purge occurred.");
  } else {
    console.log("✅ CDN Cache is consistent with Origin.");
  }
}

runSimulator().catch(console.error);
