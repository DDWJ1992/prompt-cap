#!/usr/bin/env node
/**
 * prompt-cap CLI entry
 */
import {
  cmdSetup,
  cmdStatus,
  cmdSet,
  cmdResume,
  cmdRemove,
  cmdWire,
  cmdUnwire,
  cmdDoctor,
  cmdInject,
  cmdCapture,
  printHelp,
} from '../lib/commands.js';

const [cmd, ...args] = process.argv.slice(2);

switch (cmd) {
  case 'setup':
    cmdSetup(args);
    break;
  case 'wire':
    cmdWire();
    break;
  case 'unwire':
    cmdUnwire();
    break;
  case 'status':
    cmdStatus();
    break;
  case 'doctor':
    cmdDoctor();
    break;
  case 'set':
    cmdSet(args);
    break;
  case 'resume':
    cmdResume(args);
    break;
  case 'inject':
    cmdInject(args);
    break;
  case 'capture':
    await cmdCapture();
    break;
  case 'remove':
    cmdRemove(args);
    break;
  case 'help':
  case '--help':
  case '-h':
  case undefined:
    printHelp();
    break;
  default:
    console.error(`unknown command: ${cmd}`);
    printHelp();
    process.exitCode = 1;
}
