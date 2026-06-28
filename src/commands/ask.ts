import { parseNaturalLanguage } from '../nlu.js';

/**
 * Run the NLU parser on a question string and execute the result.
 * This is the CLI equivalent of typing a question in the REPL.
 */
export async function askCommand(question: string): Promise<void> {
  const result = await parseNaturalLanguage(question, false);

  if (!result) {
    // No NLU match -- try to interpret as a driver name
    const { driverCommand } = await import('./driver.js');
    await driverCommand(question, false);
    return;
  }

  if (result.handled) {
    // NLU handler already produced output
    return;
  }

  if (result.command) {
    // Dynamically import and run the mapped command
    const commandMap: Record<string, (args: string[], json: boolean) => Promise<void>> = {
      schedule: (args, json) => import('./schedule.js').then((m) => m.scheduleCommand(json, args[0] ? parseInt(args[0], 10) : undefined)),
      standings: (args, json) => import('./standings.js').then((m) => m.standingsCommand(args[0] ? parseInt(args[0], 10) : undefined, json)),
      results: (args, json) => import('./results.js').then((m) => m.resultsCommand(args[0] ? parseInt(args[0], 10) : undefined, args[1] ? parseInt(args[1], 10) : undefined, json)),
      last: (_args, json) => import('./last.js').then((m) => m.lastCommand(json)),
      today: (_args, json) => import('./today.js').then((m) => m.todayCommand(json)),
      weekend: (_args, json) => import('./weekend.js').then((m) => m.weekendCommand(undefined, json)),
      driver: (args, json) => import('./driver.js').then((m) => m.driverCommand(args.join(' ') || undefined, json)),
      circuit: (args, json) => import('./circuit.js').then((m) => m.circuitCommand(args.join(' ') || undefined, json)),
      laps: (args, json) => import('./laps.js').then((m) => m.lapsCommand(args[0] ? parseInt(args[0], 10) : undefined, args[1] ? parseInt(args[1], 10) : undefined, json)),
    };

    const handler = commandMap[result.command];
    if (handler) {
      await handler(result.args, false);
    } else {
      console.log(`Command "${result.command}" is not available in ask mode.`);
    }
  }
}
