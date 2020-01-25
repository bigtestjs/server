import { main } from 'effection';
import * as yargs from 'yargs';

import { interruptable } from './interruptable';

import { createParcelServer } from '../src/parcel-server';

yargs
  .command('$0 [files..]', 'run the parcel server', () => {}, (argv) => {
    main(interruptable(createParcelServer(argv.files as string[], { port: argv.port as number }, {
        outFile: argv.outFile,
        global: argv.global,
    })));
  })
  .option('port', {
    alias: 'p',
    demandOption: true,
    type: 'number',
    describe: 'the port to run on',
  })
  .option('out-file', {
    alias: 'o',
    type: 'string',
    describe: 'set the output filename for the application entry point',
  })
  .option('global', {
    type: 'string',
    describe: 'expose your module through a global variable',
  })
  .help()
  .argv
