import { send, timeout, monitor, Operation, Context } from 'effection';
import { on } from '@effection/events';
import { spawnProcess } from '@effection/child_process';
import { Socket } from 'net';
import * as process from 'process';

interface AppServerOptions {
  dir?: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  port: number;
};

export function createAppServer(orchestrator: Context, options: AppServerOptions): Operation {
  let { command, args = [] } = options;

  let attrs = {
    cwd: options.dir,
    detached: true,
    env: { ...process.env, ...options.env }
  }

  return spawnProcess(command, args, attrs, function*(child) {

    yield awaitPortReachable(options.port, 10000);

    yield send({ ready: "app" }, orchestrator);

    yield on(child, "exit");
  });
}

function* awaitPortReachable(port: number, timeLimit: number): Operation {
  yield timebox(timeLimit, function*() {
    while (true) {
      try {
        return yield timebox(100, isReachable(port));
      } catch (e) {
        console.log(e);
        // we keep trying as long as we're within the timebox.
        continue;
      }
    };
  });
}

function* timebox(timeLimit: number, operation: Operation): Operation {
  yield monitor(function* timeoutListener() {
    yield timeout(timeLimit);
    throw new Error('Timeout limit exceeded');
  });
  return yield operation;
}

function* isReachable(port: number): Operation {
  let socket = new Socket();

  yield monitor(function* errorListener() {
    let [error]: [Error] = yield on(socket, 'error');
    throw error;
  })

  try {
    socket.connect(port, '127.0.0.1');
    yield on(socket, 'connect');
    return true;
  } finally {
    socket.destroy();
  }
}
