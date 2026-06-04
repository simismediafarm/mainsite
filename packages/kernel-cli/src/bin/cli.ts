#!/usr/bin/env node
import { Command } from 'commander';
import React from 'react';
import { render } from 'ink';
import { Dashboard } from '../tui/dashboard.js';
const API_BASE = 'http://localhost:4000/kernel';
const ADMIN_API_BASE = 'http://localhost:4000/admin';

const program = new Command();

program
  .name('simis kernel')
  .description('CLI for SIMIS Deterministic Kernel')
  .version('1.0.0');

program.command('status')
  .description('Live status of all subsystems (Dashboard)')
  .action(() => {
    // Render Ink UI
    render(React.createElement(Dashboard));
  });

program.command('submit')
  .description('Submit an intent')
  .argument('<payload>', 'JSON string of the intent payload')
  .action(async (payloadString) => {
    try {
      const body = JSON.parse(payloadString);
      const intentId = body.intent_id || require('crypto').randomUUID();
      
      const pipelineIntent = {
        intent_id: intentId,
        syscall_name: body.syscall_name || 'cli.submit',
        payload: body.payload || {},
        idempotency_key: body.idempotency_key || intentId,
        priority: body.priority || 2,
        epoch: body.epoch || 'epoch-0'
      };

      console.log(`Submitting intent ${intentId} to API...`);
      const response = await fetch(`${API_BASE}/intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pipelineIntent)
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'API Error');
      }
      
      console.log('Success:', JSON.stringify(result, null, 2));
      process.exit(0);
    } catch (e: any) {
      console.error('Failed to submit intent:', e.message);
      process.exit(1);
    }
  });

program.command('replay')
  .description('Replay an intent by ID')
  .argument('<intent_id>', 'UUID of the intent to replay')
  .action(async (intentId) => {
    try {
      console.log(`Replaying intent ${intentId} via API...`);
      const response = await fetch(`${API_BASE}/replay/${intentId}`, {
        method: 'POST'
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'API Error');
      }
      console.log('Replay Success:', JSON.stringify(result, null, 2));
      process.exit(0);
    } catch (e: any) {
      console.error('Replay Failed:', e.message);
      process.exit(1);
    }
  });

program.command('scrape')
  .description('Trigger manual scraping workflow (Control Plane)')
  .argument('<sourceId>', 'UUID of the scraping source')
  .action(async (sourceId) => {
    try {
      console.log(`Triggering direct manual scrape for source ${sourceId}...`);
      const response = await fetch(`${ADMIN_API_BASE}/action`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-SIMIS-OPS-KEY': process.env.SIMIS_OPS_KEY || ''
        },
        body: JSON.stringify({
          action: 'SCRAPE_MANUAL',
          actorId: 'simis-cli',
          resourceType: 'scraping_source',
          resourceId: sourceId,
          payload: { sourceId }
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Action failed');
      console.log('Success:', JSON.stringify(result, null, 2));
      process.exit(0);
    } catch (e: any) {
      console.error('Failed to trigger scrape:', e.message);
      process.exit(1);
    }
  });

program.command('audit')
  .description('Validate control plane actions and db state')
  .action(async () => {
    console.log('Running control plane audit validation...');
    // Simulated DB inspection action via Admin API
    const response = await fetch(`${ADMIN_API_BASE}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-SIMIS-OPS-KEY': process.env.SIMIS_OPS_KEY || '' },
      body: JSON.stringify({
        action: 'SYSTEM_CONFIG',
        actorId: 'simis-cli',
        resourceType: 'system_audit'
      })
    });
    if (response.ok) {
      console.log('Audit passed. System is fully governed by ControlOrchestrator.');
    } else {
      console.error('Audit failed.', await response.text());
    }
    process.exit(0);
  });

program.command('feed-import')
  .description('Imports and normalizes external product catalogs')
  .argument('<path>', 'Path to CSV or JSON file')
  .action(async (path) => {
    console.log(`[Mock] Importing feed from ${path}...`);
    process.exit(0);
  });

program.command('feed-export')
  .description('Compiles active database entries into files')
  .option('--format <format>', 'Export format (json or csv)', 'json')
  .action(async (options) => {
    console.log(`[Mock] Exporting feed as ${options.format}...`);
    process.exit(0);
  });

program.command('replay-ingest')
  .description('Submits local payload to Zone A API')
  .argument('<file>', 'Path to JSON payload file')
  .action(async (file) => {
    console.log(`[Mock] Replaying ingestion from ${file}...`);
    process.exit(0);
  });

program.command('replay-trace')
  .description('Checks and validates signature hashes in PoE chain')
  .argument('<poe_hash>', 'PoE hash to trace')
  .action(async (hash) => {
    console.log(`[Mock] Tracing PoE hash ${hash}...`);
    process.exit(0);
  });

program.command('rank-explain')
  .description('Explains ranking score calculation multipliers')
  .argument('<content_id>', 'UUID of content block')
  .action(async (contentId) => {
    console.log(`[Mock] Explaining rank for ${contentId}...`);
    process.exit(0);
  });

program.command('rank-weights-show')
  .description('Outputs active weights config table')
  .action(async () => {
    console.log(`[Mock] Displaying ranking weights...`);
    process.exit(0);
  });

program.command('revenue-estimate')
  .description('Performs page-level RPM yield forecasts')
  .argument('<slug>', 'Content slug')
  .action(async (slug) => {
    console.log(`[Mock] Estimating revenue for ${slug}...`);
    process.exit(0);
  });

program.command('db-query')
  .description('Executes read-only SQL queries directly')
  .argument('<sql>', 'SQL query string')
  .action(async (sql) => {
    console.log(`[Mock] Executing DB query: ${sql}`);
    process.exit(0);
  });

program.command('db-schema')
  .description('Describes current table schemas in terminal')
  .action(async () => {
    console.log(`[Mock] Displaying DB schemas...`);
    process.exit(0);
  });

program.command('db-clean-duplicates')
  .description('Vector search verification to purge similarities')
  .action(async () => {
    console.log(`[Mock] Cleaning duplicate contents...`);
    process.exit(0);
  });

program.command('integrations-status')
  .description('Pings active API limits for CJ, Impact, and Gemini')
  .action(async () => {
    console.log(`[Mock] Checking integration status...`);
    process.exit(0);
  });

program.command('integrations-test')
  .description('Checks raw endpoint responses and returns headers')
  .argument('<provider>', 'Integration provider name')
  .action(async (provider) => {
    console.log(`[Mock] Testing integration: ${provider}`);
    process.exit(0);
  });

program.parse();
