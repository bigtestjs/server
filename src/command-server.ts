import { Operation, Context, send } from 'effection';
import { createServer, IncomingMessage, Response } from './http';

interface CommandServerOptions {
  port: number;
};

export function* createCommandServer(orchestrator: Context, options: CommandServerOptions): Operation {
  function* handleRequest(req: IncomingMessage, res: Response): Operation {
    res.writeHead(200, {
      'X-Powered-By': 'effection'
    });
    yield res.end("Your wish is my command\n");
  }
  //TODO: pass server with message
  yield createServer(options.port, handleRequest, () => send({ ready: "command" }, orchestrator));
}
