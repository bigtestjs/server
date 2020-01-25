import { watch } from 'fs';
import { main, fork, monitor, send, receive, Operation, Context } from 'effection';
import { on } from '@effection/events';

import { spawnProcess } from '../src/effection/child_process';

import { interruptable } from './interruptable';

main(interruptable(function* () {
  let [ cmd, ...args ] = process.argv.slice(2);
  try {
    while (true) {
      let child = yield fork(launch(cmd, args));
      yield startWatching(child);

      yield receive("restart", child);
      child.halt();
    }
  } catch (err) {
    console.error(err);
  }
}));

function launch(cmd: string, args: string[]): Operation {
  return spawnProcess(cmd, args, { stdio: 'inherit' }, function*(child) {
    return yield on(child, 'exit');
  });
}

function startWatching(child: Context): Operation {
  return monitor(function* changes() {
    let watcher = watch('src', { recursive: true });
    try {
      while (true) {
        yield on(watcher, "change");
        console.log('change detected, restarting....');
        yield send("restart", child);
      }
    } finally {
      watcher.close();
    }
  })
}
