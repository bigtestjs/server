import { fork, join, monitor, Operation, Context } from 'effection';

export function* interruptable(operation: Operation): Operation {
  let context: Context = yield fork(operation);

  yield monitor(({ ensure }) => {
    let halt = () => context.halt();
    process.on('SIGINT', halt);
    ensure(() => process.off('SIGINT', halt));
  });

  return yield join(context);
}
