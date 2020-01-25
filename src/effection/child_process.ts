import { monitor, Operation } from 'effection';
import { on } from '@effection/events';

import * as childProcess from 'child_process';
import { SpawnOptions, ForkOptions, ChildProcess } from 'child_process';

export { ChildProcess } from 'child_process'

type UseChild = (child: ChildProcess) => Operation;


// Killing all child processes started by this command is surprisingly
// tricky. If a process spawns another processes and we kill the parent,
// then the child process is NOT automatically killed. Instead we're using
// the `detached` option to force the child into its own process group,
// which all of its children in turn will inherit. By sending the signal to
// `-pid` rather than `pid`, we are sending it to the entire process group
// instead. This will send the signal to all processes started by the child
// process.
//
// More information here: https://unix.stackexchange.com/questions/14815/process-descendants
function* supervise(createChildProcess: () => ChildProcess, useChild: UseChild): Operation {
  let child = createChildProcess();

  yield monitor(function*() {
    let [error]: [Error] = yield on(child, "error");
    throw error;
  });

  yield monitor(function*() {
    let [code]: [number] = yield on(child, "exit");
    if(code !== 0) { throw new Error("child exited with non-zero exit code") }
  });

  try {
    return yield useChild(child);
  } finally {
    kill(child);
  }
}

function kill(child: ChildProcess) {
  try {
    process.kill(-child.pid, "SIGTERM");
  }  catch(e) {
    // do nothing, process is probably already dead
  }
}

export function spawnProcess(command: string, args: ReadonlyArray<string>, options: SpawnOptions, then: UseChild): Operation {
  let createChild = () => childProcess.spawn(command, args, { ...options, shell: true, detached: true });

  return supervise(createChild, then);
}

export function forkChildProcess(module: string, args: ReadonlyArray<string>, options: ForkOptions, then: UseChild): Operation {
  let createChild = () => childProcess.fork(module, args, Object.assign({}, options, {detached: true }));

  return supervise(createChild, then);
}
