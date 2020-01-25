import { createServer } from 'http';
import {
  server as WebSocketServer,
  connection as Connection,
  request as Request,
  IMessage as Message
} from 'websocket';

import { fork, monitor, Operation } from 'effection';
import { resumeOnCb } from './util';

import { on } from '@effection/events';

import { listen, ReadyServer } from './http';

export function* createSocketServer(port: number, handler: ConnectionHandler, ready: ReadyServer): Operation {
  let server = createServer();

  yield listen(server, port);

  yield ready(server);

  let socket = new WebSocketServer({
    httpServer: server
  });

  try {
    while (true) {
      let [request]: [Request] = yield on(socket, "request");
      let connection = request.accept(null, request.origin);

      let handleConnection = yield fork(function* setupConnection() {
        yield monitor(function*() {
          yield on(connection, "close");
          handleConnection.halt();
        })
        yield monitor(function*() {
          let [error]: [Error] = yield on(connection, "error");
          throw error;
        })

        try {
          yield handler(connection);
        } finally {
          connection.close();
        }
      });
    }
  } finally {
    server.close();
  }
}

export function sendData(connection: Connection, data: string): Operation {
  return resumeOnCb(cb => connection.send(data, cb));
}

export { Connection, Message }

type ConnectionHandler = (conn: Connection) => Operation;
