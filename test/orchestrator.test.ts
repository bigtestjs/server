import { describe, beforeEach, it } from 'mocha';
import * as expect from 'expect';

import { Response } from 'node-fetch';

import { actions } from './helpers';

describe("orchestrator", () => {
  beforeEach(async () => {
    await actions.startOrchestrator();
  });

  describe('connecting to the command server', () => {
    let response: Response;
    let body: string;
    beforeEach(async () => {
      response = await actions.get('http://localhost:24102?query={echo(text:"Hello World")}');
      body = await response.json();
    });

    it('responds successfully', () => {
      expect(response.ok).toEqual(true);
    });

    it('echos a response', () => {
      expect(body).toEqual({ data: { echo: "Hello World" } });
    });
  });
});
