#!/usr/bin/env node

/**
 * Vindicate NYC CLI
 */

import { Command } from 'commander';

const program = new Command();

program
  .name('vindicate')
  .description('Vindicate NYC - Financial recovery and legal case management CLI')
  .version('0.1.0');

program
  .command('calculate')
  .description('Run financial calculations')
  .option('-i, --income <amount>', 'Monthly gross income')
  .option('-f, --family-size <size>', 'Family size', '1')
  .option('-s, --state <state>', 'State code', 'NY')
  .action((options) => {
    console.log('Running calculation with options:', options);
    // TODO: Implement calculation command
  });

program
  .command('dispute')
  .description('Generate dispute letter')
  .option('-t, --type <type>', 'Dispute type (fcra, fdcpa, validation)')
  .option('-o, --output <path>', 'Output file path')
  .action((options) => {
    console.log('Generating dispute letter with options:', options);
    // TODO: Implement dispute command
  });

program
  .command('status')
  .description('Check case status')
  .argument('[case-id]', 'Case ID to check')
  .action((caseId) => {
    if (caseId) {
      console.log(`Checking status for case: ${caseId}`);
    } else {
      console.log('Listing all cases...');
    }
    // TODO: Implement status command
  });

program.parse();
