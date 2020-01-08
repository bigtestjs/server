import * as globWatcher from 'glob-watcher';
import { receive, Sequence, Execution } from 'effection';
import { watch } from '@effection/events';
import { ChildProcess, fork as forkProcess } from '@effection/child_process';

interface TestFileWatcherOptions {
  files: [string],
  manifestPath: string,
};


function globWatcherController(files: [string]) {
  return (execution) => {
    let watcher = globWatcher(files);

    execution.atExit(() => watcher.close());
    execution.resume(watcher);
  }
}


export function* createTestFileWatcher(orchestrator: Execution, options: TestFileWatcherOptions): Sequence {
  let watcher = yield globWatcherController(options.files);

  yield watch(watcher, 'add');
  yield watch(watcher, 'unlink');

  while(true) {
    yield receive();
    console.log("change detected!");
  }
}
