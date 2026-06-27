import { describe, it, expect } from 'vitest';

// Test the command resolution logic from the REPL
// We test the pure functions indirectly by simulating the command lookup

describe('REPL command resolution', () => {
  // Mirror the COMMANDS structure for testing
  const commands = [
    { name: 'schedule', aliases: ['sched'] },
    { name: 'standings', aliases: ['st'] },
    { name: 'results', aliases: ['r'] },
    { name: 'last', aliases: ['l'] },
    { name: 'today', aliases: ['t', 'next'] },
    { name: 'driver', aliases: ['d'] },
  ];

  function findCommand(input: string) {
    return commands.find(
      (c) => c.name === input || c.aliases.includes(input)
    );
  }

  it('finds commands by full name', () => {
    expect(findCommand('schedule')?.name).toBe('schedule');
    expect(findCommand('standings')?.name).toBe('standings');
    expect(findCommand('results')?.name).toBe('results');
    expect(findCommand('last')?.name).toBe('last');
    expect(findCommand('today')?.name).toBe('today');
    expect(findCommand('driver')?.name).toBe('driver');
  });

  it('finds commands by alias', () => {
    expect(findCommand('sched')?.name).toBe('schedule');
    expect(findCommand('st')?.name).toBe('standings');
    expect(findCommand('r')?.name).toBe('results');
    expect(findCommand('l')?.name).toBe('last');
    expect(findCommand('t')?.name).toBe('today');
    expect(findCommand('next')?.name).toBe('today');
    expect(findCommand('d')?.name).toBe('driver');
  });

  it('returns undefined for unknown commands', () => {
    expect(findCommand('foobar')).toBeUndefined();
    expect(findCommand('')).toBeUndefined();
    expect(findCommand('xyz')).toBeUndefined();
  });
});

describe('REPL tab completion', () => {
  // Mirror the completer logic
  const commandNames = ['schedule', 'standings', 'results', 'last', 'today', 'driver'];
  const aliases: Record<string, string[]> = {
    schedule: ['sched'],
    standings: ['st'],
    results: ['r'],
    last: ['l'],
    today: ['t', 'next'],
    driver: ['d'],
  };
  const metaCommands = ['help', 'clear', 'exit'];

  function complete(partial: string): string[] {
    const matches: string[] = [];
    for (const name of commandNames) {
      if (name.startsWith(partial)) matches.push('/' + name);
      for (const alias of aliases[name] || []) {
        if (alias.startsWith(partial)) matches.push('/' + alias);
      }
    }
    for (const meta of metaCommands) {
      if (meta.startsWith(partial)) matches.push('/' + meta);
    }
    return matches;
  }

  it('completes /s to /schedule and /standings', () => {
    const matches = complete('s');
    expect(matches).toContain('/schedule');
    expect(matches).toContain('/standings');
  });

  it('completes /h to /help', () => {
    const matches = complete('h');
    expect(matches).toContain('/help');
  });

  it('completes /n to /next (alias for today)', () => {
    const matches = complete('n');
    expect(matches).toContain('/next');
  });

  it('completes /e to /exit', () => {
    const matches = complete('e');
    expect(matches).toContain('/exit');
  });

  it('returns empty for no matches', () => {
    const matches = complete('xyz');
    expect(matches).toEqual([]);
  });
});
