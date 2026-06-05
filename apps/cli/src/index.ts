#!/usr/bin/env node
import { Command } from 'commander';
import inquirer from 'inquirer';

const program = new Command();

program
  .name('simis-ops')
  .description('SIMIS Unified Control Tower CLI Operations')
  .version('3.1.0');

// Shared utility to dispatch commands to API Gateway
async function dispatchCommand(type: string, scope: Record<string, any>, mode: string = 'execute') {
  const token = process.env.SIMIS_OPS_KEY || 'development_override';

  const payload = {
    source: 'cli',
    actor: 'simis_cli_admin',
    type,
    scope,
    mode,
    priority: 'standard'
  };

  try {
    const res = await fetch('http://localhost:4000/api/admin/command', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SIMIS-OPS-KEY': token
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.error(`Failed to dispatch command: ${err.message}`);
  }
}

// System Command Sub-tree
const system = program.command('system').description('System operations');
system.command('status').action(() => dispatchCommand('SYSTEM.HEALTHCHECK', {}, 'execute'));

// Queue Command Sub-tree
const queue = program.command('queue').description('Queue control operations');
queue.command('replay <jobId>').action((jobId) => dispatchCommand('QUEUE.REPLAY', { jobId }, 'execute'));
queue.command('pause').action(() => dispatchCommand('QUEUE.PAUSE', {}, 'execute'));
queue.command('resume').action(() => dispatchCommand('QUEUE.RESUME', {}, 'execute'));

// Cache Command Sub-tree
const cache = program.command('cache').description('Cache management operations');
cache.command('invalidate <pattern>').action(async (pattern) => {
  const { mode } = await inquirer.prompt([
    {
      type: 'list',
      name: 'mode',
      message: 'Select execution mode for destructive cache invalidation:',
      choices: ['dry-run', 'execute']
    }
  ]);
  await dispatchCommand('CACHE.INVALIDATE', { pattern }, mode);
});

// Crawler Command Sub-tree
const crawler = program.command('crawler').description('Crawler trigger');
crawler.command('trigger <sourceId>').action(async (sourceId) => {
  const { mode } = await inquirer.prompt([
    {
      type: 'list',
      name: 'mode',
      message: 'Select execution mode:',
      choices: ['dry-run', 'execute']
    }
  ]);
  await dispatchCommand('CRAWLER.TRIGGER', { sourceId }, mode);
});

// Entity Command Sub-tree
const entity = program.command('entity').description('Entity reprocess operations');
entity.command('reprocess <entityId>').action(async (entityId) => {
  const { mode } = await inquirer.prompt([
    {
      type: 'list',
      name: 'mode',
      message: 'Select execution mode for Entity Reprocessing:',
      choices: ['dry-run', 'execute']
    }
  ]);
  await dispatchCommand('ENTITY.REPROCESS', { entityId }, mode);
});

program.parse(process.argv);
