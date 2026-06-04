import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

export const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    intents: 0,
    poe: 0,
    violations: 0
  });

  useEffect(() => {
    // Initial fetch
    fetch('http://localhost:4000/kernel/status')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'HEALTHY') {
          setMetrics({
            intents: data.metrics.total_intents,
            poe: data.metrics.total_poe,
            violations: data.metrics.total_violations
          });
        }
      })
      .catch(() => {});

    // SSE Subscription for live updates (works in Node using a polyfill if needed, but since it's React we might need an EventSource polyfill in Ink)
    // Actually, node-fetch or similar can be used for SSE. For simplicity, we'll poll status every 2 seconds instead in CLI.
    const interval = setInterval(() => {
      fetch('http://localhost:4000/kernel/status')
        .then(res => res.json())
        .then(data => {
          if (data.status === 'HEALTHY') {
            setMetrics({
              intents: data.metrics.total_intents,
              poe: data.metrics.total_poe,
              violations: data.metrics.total_violations
            });
          }
        })
        .catch(() => {});
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="green">
      <Box marginBottom={1}>
        <Text color="greenBright" bold>SIMIS Kernel Control Dashboard</Text>
      </Box>
      <Box flexDirection="row" justifyContent="space-between" width={50}>
        <Text>Total Intents:</Text>
        <Text color="cyan">{metrics.intents}</Text>
      </Box>
      <Box flexDirection="row" justifyContent="space-between" width={50}>
        <Text>PoE Certificates:</Text>
        <Text color="cyan">{metrics.poe}</Text>
      </Box>
      <Box flexDirection="row" justifyContent="space-between" width={50}>
        <Text>DECT Violations:</Text>
        <Text color={metrics.violations > 0 ? "red" : "green"}>{metrics.violations}</Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Press Ctrl+C to exit</Text>
      </Box>
    </Box>
  );
};
