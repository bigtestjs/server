export interface Test {
  description: string;
  steps: Iterable<Step>;
  assertions: Iterable<Assertion>;
  children: Iterable<Test>;
}

export interface Step {
  description: string;
  action: Action;
}

export interface Assertion {
  description: string;
  check: Check;
}

export interface Action {
  (context: Context): Promise<Context | void>;
}

export interface Check {
  (context: Context): void;
}

export type Context = Record<string, unknown>;

export interface Manifest {
  name: string;
  sources: string[];
  suite: Test;
}
