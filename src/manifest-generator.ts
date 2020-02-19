import * as chokidar from 'chokidar';
import { Operation } from 'effection';
import { watchError, Mailbox } from '@effection/events';
import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import { promisify } from 'util';

const { writeFile } = fs.promises;

interface ManifestGeneratorOptions {
  delegate: Mailbox;
  files: [string];
  manifestPath: string;
};

function* writeManifest(options: ManifestGeneratorOptions) {
  let files = yield Promise.all(options.files.map((pattern) => promisify(glob)(pattern))).then((l) => l.flat());

  let manifest = "module.exports = [\n";

  for(let file of files) {
    let filePath = "./" + path.relative(path.dirname(options.manifestPath), file);
    manifest += `  { path: ${JSON.stringify(file)}, test: require(${JSON.stringify(filePath)}).default },\n`;
  }

  manifest += "];\n";

  yield writeFile(options.manifestPath, manifest);
}

export function* createManifestGenerator(options: ManifestGeneratorOptions): Operation {
  let watcher = chokidar.watch(options.files, { ignoreInitial: true });

  try {
    let events: Mailbox = yield Mailbox.watch(watcher, ['ready', 'add', 'unlink']);

    yield watchError(watcher);


    yield events.receive({ event: 'ready' });
    yield writeManifest(options);

    options.delegate.send({ status: 'ready' });

    while(true) {
      yield events.receive();
      yield writeManifest(options);

      options.delegate.send({ event: 'update' });
    }
  } finally {
    watcher.close();
  }
}