import { EventEmitter } from 'events';
import { send, monitor, Operation } from 'effection';

type EventName = string | symbol;

/**
 * Takes an event emitter and event name and returns a yieldable
 * operation which resumes when the event occurrs.
 */
export function on(emitter: EventEmitter, eventName: EventName): Operation {
  return control => {
    let resume = (...args: unknown[]) => control.resume(args);
    emitter.on(eventName, resume);
    return () => emitter.off(eventName, resume);
  }
}

export function watch(emitter: EventEmitter, names: EventName | EventName[]): Operation {
  return ({ resume, context: { parent }}) => {
    for(let name of [].concat(names)) {
      let context = parent as any;
      let listener = (...args) => {
        context.spawn(send({ event: name, args: args }));
      }

      emitter.on(name, listener);
      context.ensure(() => {
        emitter.off(name, listener);
      });
    }
    resume(emitter);
  }
}

export function watchError(emitter: EventEmitter): Operation {
  return monitor(function*() {
    let [error]: [Error] = yield on(emitter, "error");
    throw error;
  });
}
