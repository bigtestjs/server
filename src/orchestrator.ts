import { fork, send, receive, Operation, Context } from 'effection';

import { createProxyServer } from './proxy';
import { createCommandServer } from './command-server';
import { createConnectionServer } from './connection-server';
import { createAgentServer } from './agent-server';
import { createAppServer } from './app-server';
import { createTestFileWatcher } from './test-file-watcher';
import { createTestFileServer } from './test-file-server';

type OrchestratorOptions = {
  appPort: number;
  appCommand: string;
  appArgs?: string[];
  appEnv?: Record<string, string>;
  appDir?: string;
  proxyPort: number;
  commandPort: number;
  connectionPort: number;
  agentPort: number;
  delegate?: Context;
  testFiles: [string];
  testManifestPath: string;
  testFilePort: number;
}

export function* createOrchestrator(options: OrchestratorOptions): Operation {
  let orchestrator = yield ({ resume, context: { parent }}) => resume(parent);

  console.log('[orchestrator] starting');

  yield fork(createProxyServer(orchestrator, {
    port: options.proxyPort,
    targetPort: options.appPort,
    inject: `<script src="http://localhost:${options.agentPort}/harness.js"></script>`,
  }));

  yield fork(createCommandServer(orchestrator, {
    port: options.commandPort,
  }));

  yield fork(createConnectionServer(orchestrator, {
    port: options.connectionPort,
    proxyPort: options.proxyPort,
    testFilePort: options.testFilePort,
  }));

  yield fork(createAgentServer(orchestrator, {
    port: options.agentPort,
  }));

  yield fork(createAppServer(orchestrator, {
    dir: options.appDir,
    command: options.appCommand,
    args: options.appArgs,
    env: options.appEnv,
    port: options.appPort,
  }));

  yield fork(createTestFileWatcher(orchestrator, {
    files: options.testFiles,
    manifestPath: options.testManifestPath,
  }));

  // wait for manifest before starting test file server
  yield receive({ ready: "manifest" }, orchestrator);

  yield fork(createTestFileServer(orchestrator, {
    files: options.testFiles,
    manifestPath: options.testManifestPath,
    port: options.testFilePort,
  }));

  yield all([
    receive({ ready: "proxy" }, orchestrator),
    receive({ ready: "command" }, orchestrator),
    receive({ ready: "connection" }, orchestrator),
    receive({ ready: "agent" }, orchestrator),
    receive({ ready: "app" }, orchestrator),
    receive({ ready: "test-files" }, orchestrator)
  ]);

  console.log("[orchestrator] running!");

  if(options.delegate) {
    yield send({ ready: "orchestrator" }, options.delegate);
  }

  try {
    while(true) {
      yield receive(orchestrator);
    }
  } finally {
    console.log("[orchestrator] shutting down!");
  }
}

function* all(operations: Operation[]): Operation {
  for (let operation of operations) {
    yield fork(operation);
  }
}
