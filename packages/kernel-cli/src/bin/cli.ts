#!/usr/bin/env node
import { Command } from 'commander';
import React from 'react';
import { render } from 'ink';
import { Dashboard } from '../tui/dashboard.js';
const API_BASE = 'http://localhost:4000/kernel';

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

program.parse();
