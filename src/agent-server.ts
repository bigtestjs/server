import { ChildProcess, forkChildProcess } from '@effection/child_process';
import { on } from '@effection/events';
import { Context, Operation, send } from 'effection';

interface AgentServerOptions {
  port: number;
};

export function createAgentServer(orchestrator: Context, options: AgentServerOptions): Operation {

  // TODO: @precompile we want this to use a precompiled agent server when used as a package
  let command = './bin/parcel-server.ts';
  let args = ['-p', `${options.port}`, 'agent/index.html', 'agent/harness.ts'];
  let stdio: Array<("pipe"|"ipc")> = ['pipe', 'pipe', 'pipe', 'ipc'];
  let attrs = {
    execPath: 'ts-node',
    execArgv: [],
    stdio
  };

  return forkChildProcess(command, args, attrs, function* (child: ChildProcess) {
    let message: {type: string};
    do {
      [message] = yield on(child, "message");
    } while(message.type !== "ready");

    yield send({ ready: "agent"}, orchestrator);

    return yield on(child, "exit");
  });
}
