import * as http from 'http';
import { IncomingMessage, ServerResponse } from 'http';
import { Operation, fork, monitor } from 'effection';
import { on } from '@effection/events';

export { IncomingMessage } from 'http';

import { resumeOnCb } from './util';

export type RequestHandler = (req: IncomingMessage, res: Response) => Operation;

export type ReadyServer = (server: http.Server) => Operation;

export function* createServer(port: number, handler: RequestHandler, ready: ReadyServer): Operation {
  let server = http.createServer();

  yield listen(server, port);

  yield ready(server);

  try {
    while (true) {
      let [request, response]: [IncomingMessage, ServerResponse] = yield on(server, "request");
      yield fork(function* outerRequestHandler() {
        yield monitor(function* () {
          let [error]: [Error] = yield on(request, "error");
          throw error;
        });
        yield monitor(function* () {
          let [error]: [Error] = yield on(response, "error");
          throw error;
        });
        yield handler(request, new Response(response));
      });
    }
  } finally {
    server.close();
  }
}

export class Response {
  constructor(private inner: ServerResponse) {}

  writeHead(statusCode: number, headers?: http.OutgoingHttpHeaders): http.ServerResponse {
    return this.inner.writeHead(statusCode, headers);
  };

  end(body: string): Operation {
    return resumeOnCb((cb) => this.inner.end(body, cb));
  }
}

export function* listen(server: http.Server, port: number): Operation {

  let errors = yield fork(function* errorListener() {
    let [error]: [Error] = yield on(server, "error");
    throw error;
  })

  try {
    server.listen(port);
    yield on(server, "listening");
  } finally {
    errors.halt();
  }
}
