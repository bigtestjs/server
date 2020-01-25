import { send, Operation, Context } from 'effection';
import { on } from '@effection/events';
import { forkChildProcess } from '@effection/child_process';

interface TestFileServerOptions {
  files: [string];
  manifestPath: string;
  port: number;
};

export function* createTestFileServer(orchestrator: Context, options: TestFileServerOptions): Operation {
  // TODO: @precompile this should use node rather than ts-node when running as a compiled package
  let command = './bin/parcel-server.ts';
  let args = ['-p', `${options.port}`, '--out-file', 'manifest.js', '--global', '__bigtestManifest', options.manifestPath];
  let attrs = {
    execPath: 'ts-node',
    execArgv: [],
    stdio: ['pipe', 'pipe', 'pipe', 'ipc'] as Array<("pipe"|"ipc")>
  };

  yield forkChildProcess(command, args, attrs, function*(child) {

    let message: {type: string};
    do {
      [message] = yield on(child, "message");
    } while(message.type !== "ready");

    yield send({ ready: "test-files" }, orchestrator);

    yield on(child, "exit");
  });
}
