import 'module-alias/register';
import { main } from '@effection/node';
import { createParcelServer } from '../src/parcel-server';
import * as yargs from 'yargs';

yargs
  .command('$0 [files..]', 'run the parcel server', () => {}, (argv) => {
    main(createParcelServer(argv.files as string[], { port: argv.port as number }, {
      outDir: argv.outDir,
      outFile: argv.outFile,
      global: argv.global,
    }));
  })
  .option('port', {
    alias: 'p',
    type: 'number',
    describe: 'the port to run on',
  })
  .option('out-file', {
    alias: 'o',
    type: 'string',
    describe: 'set the output filename for the application entry point',
  })
  .option('out-dir', {
    alias: 'd',
    type: 'string',
    describe: 'set the output directory.'
  })
  .option('global', {
    type: 'string',
    describe: 'expose your module through a global variable',
  })
  .help()
  .argv
