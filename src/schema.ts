import { buildSchema } from 'graphql';

export const schema =  buildSchema(`
type Query {
  echo(text: String!): String
  agents: [Agent!]!
  manifest: [ManifestEntry!]!
  runs: [TestRun]!
}

type Agent {
  identifier: String!
  browser: Browser!
  os: OS!
  platform: Platform!
  engine: Engine!
}

type Browser {
  name: String!
  version: String!
}

type OS {
  name: String!
  version: String!
  versionName: String!
}

type Platform {
  type: String!
  vendor: String!
}

type Engine {
  name: String!
  version: String!
}

type ManifestEntry {
  path: String!
  test: Test!
}

type Identifier {
  path: [String!]!
}

type Test {
  id: Identifier!
  parent: Identifier!
  description: String!
  steps: [Step!]!
  assertions: [Assertion!]
}

type Step {
  id: Identifier!
  description: String!
}

type Assertion {
  id: Identifier!
  descritption: String!
}

type Mutation {
  runAll: [TestRun]!
}

type TestRun {
  id: ID!
  agent: Agent!
  manifest: [ManifestEntry]!
  results: [TestResult!]!
}

type TestResult {
  test: Test!
  steps: [StepResult!]!
  assertions: [AssertionResult!]
}

type StepResult {
  stepId: Identifier!
  description: String!
}

type AssertionResult {
  stepId: Identifier!
  description: String!
}
`);
