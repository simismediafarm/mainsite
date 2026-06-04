"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const API_BASE = 'http://localhost:4000/kernel';
async function runTest() {
    console.log('Starting 100 parallel intents system closure test...');
    const promises = [];
    const intentIds = [];
    for (let i = 0; i < 100; i++) {
        const id = (0, crypto_1.randomUUID)();
        intentIds.push(id);
        promises.push(fetch(`${API_BASE}/intent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                intent_id: id,
                syscall_name: 'test.parallel',
                payload: { count: i },
                priority: 2
            })
        }).then(res => res.json()));
    }
    console.log('Waiting for 100 intents to execute...');
    const results = await Promise.all(promises);
    let successCount = 0;
    const liveHashes = new Map();
    for (let i = 0; i < results.length; i++) {
        const res = results[i];
        if (res.success) {
            successCount++;
            liveHashes.set(res.result.intent_id, res.result.execution_hash);
        }
        else {
            console.error(`Intent failed:`, res);
        }
    }
    console.log(`Successfully executed ${successCount}/100 intents.`);
    console.log('Now verifying replay equivalence (live_hash === replay_hash)...');
    let matchCount = 0;
    let mismatchCount = 0;
    // Replay them all
    const replayPromises = intentIds.map(id => fetch(`${API_BASE}/replay/${id}`, { method: 'POST' }).then(res => res.json()));
    const replayResults = await Promise.all(replayPromises);
    for (let i = 0; i < replayResults.length; i++) {
        const res = replayResults[i];
        if (res.success) {
            const intentId = intentIds[i];
            const liveHash = liveHashes.get(intentId);
            const replayHash = res.result.poe?.execution_hash || res.result.execution_hash;
            if (liveHash === replayHash) {
                matchCount++;
            }
            else {
                mismatchCount++;
                console.error(`Mismatch for ${intentId}: live=${liveHash} replay=${replayHash}`);
            }
        }
    }
    console.log(`\n--- SYSTEM CLOSURE REPORT ---`);
    console.log(`Live Intents Executed: ${successCount}`);
    console.log(`Replays Executed: ${replayResults.filter((r) => r.success).length}`);
    console.log(`Hashes Matched: ${matchCount}`);
    console.log(`Hashes Mismatched: ${mismatchCount}`);
    if (matchCount === 100 && mismatchCount === 0) {
        console.log(`\n✅ TEST PASSED: Full Deterministic Closure Achieved.`);
        process.exit(0);
    }
    else {
        console.log(`\n❌ TEST FAILED.`);
        process.exit(1);
    }
}
runTest().catch(console.error);
