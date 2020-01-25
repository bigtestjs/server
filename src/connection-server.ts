import { fork, timeout, send, Operation, Context } from 'effection';
import { on } from '@effection/events';

import { createSocketServer, Connection, Message, sendData } from './ws';

interface ConnectionServerOptions {
  port: number;
  proxyPort: number;
  testFilePort: number;
};

export function* createConnectionServer(orchestrator: Context, options: ConnectionServerOptions): Operation {
  function* handleConnection(connection: Connection): Operation {
    console.log('connection established');
    yield fork(function* heartbeat() {
      while (true) {
        yield timeout(10000);
        yield sendData(connection, JSON.stringify({type: "heartbeat"}));
      }
    })

    yield fork(sendData(connection, JSON.stringify({
      type: "open",
      url: `http://localhost:${options.proxyPort}`,
      manifest: `http://localhost:${options.testFilePort}/manifest.js`
    })));

    try {
      while (true) {
        let [message]: [Message] = yield on(connection, "message");
        console.log(`mesage = `, message);
      }
    } finally {
      console.log('connection closed');
    }
  }

  yield createSocketServer(options.port, handleConnection, () => {
    return send({ ready: "connection" }, orchestrator)
  });
}
