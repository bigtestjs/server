import { watch } from 'fs';
import { spawn } from 'child_process';
import { main, fork, join, monitor, send, receive, Operation, Context } from 'effection';
import { on } from '@effection/events';

function* start(): Operation {
  let [ cmd, ...args ] = process.argv.slice(2);

  let supervisor: Context = yield fork(function*() {
    yield monitor(function* changes() {
      let watcher = watch('src', { recursive: true });
      try {
        while (true) {
          yield on(watcher, "change");
          console.log('change detected, restarting....');
          send("restart", supervisor);
        }
      } finally {
        watcher.close();
      }
    })

    do {
      let proc = yield fork(launch(cmd, args));
      yield receive("restart");
      proc.halt();
    } while (true);
  });
}

function* launch(cmd: string, args: string[]): Operation {
  let child = spawn(cmd, args, { stdio: 'inherit'});

  yield fork(function*() {
    let errors = yield fork(function*() {
      let [ error ] = yield on(child, "error");
      throw error;
    });

    try {
      let [ code ] = yield on(child, 'exit');
      errors.halt();

      if (code > 0) {
        throw new Error(`exited with code ${code}`)
      }
    } finally {
      child.kill();
    }
  })
}

main(function* () {
  let child = yield fork(start);

  yield monitor(function*() {
    yield on(process, 'SIGINT');
    console.log('');
    child.halt();
  });

  try {
    yield join(child);
  } catch (err) {
    console.error(err);
  }
});
