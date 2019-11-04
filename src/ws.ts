import { createServer } from 'http';
import {
  server as WebSocketServer,
  connection as WebSocketConnection,
  request as Request,
  IMessage as Message
} from 'websocket';

import { fork, Sequence, Operation, Execution } from 'effection';
import { getCurrentExecution, resumeOnCb, EventEmitter } from './util';

import { listen, ReadyCallback } from './http';

export function* createSocketServer(port: number, handler: ConnectionHandler, ready: ReadyCallback = x=>x): Sequence {
  let server = createServer();

  yield listen(server, port);

  ready(server);

  let socket = new WebSocketServer({
    httpServer: server
  });

  new EventEmitter(socket).forkOn("request", function* requestHandler(request: Request) {
    let connection = request.accept(null, request.origin);
    let emitter = new EventEmitter(connection);
    let handle = fork(function* setupConnection() {
      emitter.forkOn("error", function*(error) { handle.throw(error) });
      emitter.forkOn("close", function*() { handle.halt() });
      try {
        yield handler(new Connection(connection));
        handle.halt();
      } finally {
        connection.close();
      }
    })
  });

  try {
    yield;
  } finally {
    server.close();
  }
}

type ConnectionEvent = "message" | "frame" | "close" | "error" | "drain" | "pause" | "resume" | "ping" | "pong";

class Connection extends EventEmitter<WebSocketConnection, ConnectionEvent> {
  send(data: String): Operation {
    return resumeOnCb((cb) => this.inner.send(data, cb));
  }
}

export { Connection, Message }

type ConnectionHandler = (conn: Connection) => Operation;