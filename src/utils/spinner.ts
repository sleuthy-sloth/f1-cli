/**
 * A minimal loading spinner -- no external dependencies.
 *
 * Writes a rotating character to stderr with a setInterval, then clears the
 * line when stopped. Writing to stderr keeps stdout clean for --json piping.
 */

const SPINNER_CHARS = ['|', '/', '-', '\\'];
const SPINNER_INTERVAL_MS = 100;

export class Spinner {
  private interval: ReturnType<typeof setInterval> | null = null;
  private idx = 0;
  private message: string;
  private active = false;

  constructor(message = 'Loading') {
    this.message = message;
  }

  start(): void {
    if (this.active) return;
    this.active = true;
    this.idx = 0;
    // Use stderr so JSON output on stdout stays clean
    process.stderr.write(`\r${SPINNER_CHARS[0]} ${this.message}`);
    this.interval = setInterval(() => {
      this.idx = (this.idx + 1) % SPINNER_CHARS.length;
      process.stderr.write(`\r${SPINNER_CHARS[this.idx]} ${this.message}`);
    }, SPINNER_INTERVAL_MS);
  }

  stop(): void {
    if (!this.active) return;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    // Clear the spinner line
    process.stderr.write('\r\x1b[K');
    this.active = false;
  }

  /** Wrap an async operation with start/stop. */
  static async with<T>(message: string, fn: () => Promise<T>): Promise<T> {
    const spinner = new Spinner(message);
    spinner.start();
    try {
      return await fn();
    } finally {
      spinner.stop();
    }
  }
}
