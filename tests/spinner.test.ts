import { describe, it, expect, vi, afterEach } from 'vitest';
import { Spinner } from '../src/utils/spinner.js';

describe('Spinner', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts and stops without error', () => {
    const spinner = new Spinner('Loading');
    const writeSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    spinner.start();
    expect(writeSpy).toHaveBeenCalled();
    spinner.stop();
    // Stop should clear the line
    expect(writeSpy).toHaveBeenCalledWith('\r\x1b[K');
  });

  it('wraps an async operation and returns its result', async () => {
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const result = await Spinner.with('Testing', async () => 42);
    expect(result).toBe(42);
  });

  it('stops even if the wrapped operation throws', async () => {
    const writeSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    await expect(
      Spinner.with('Testing', async () => {
        throw new Error('boom');
      })
    ).rejects.toThrow('boom');
    // Should have cleared the line despite the error
    expect(writeSpy).toHaveBeenCalledWith('\r\x1b[K');
  });

  it('does not start twice', () => {
    const spinner = new Spinner('Loading');
    const writeSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    spinner.start();
    const firstCallCount = writeSpy.mock.calls.length;
    spinner.start(); // should be a no-op
    expect(writeSpy.mock.calls.length).toBe(firstCallCount);
    spinner.stop();
  });
});
