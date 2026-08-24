import { describe, expect, it, vi } from 'vitest';
import { createStyleLifecycle } from '../src/styleLifecycle';

describe('style lifecycle', () => {
  it('marks remote styles and removes them after the final owner releases', async () => {
    const first = createStyleLifecycle('dashboard:1.0.0');
    const second = createStyleLifecycle('dashboard:1.0.0');
    const style = document.createElement('style');
    style.textContent = '.remote { color: red; }';
    document.head.appendChild(style);

    await vi.waitFor(() => {
      expect(style.getAttribute('data-nexus-mf-style-key')).toBe('dashboard:1.0.0');
    });

    first.release();
    expect(style.isConnected).toBe(true);
    second.release();
    expect(style.isConnected).toBe(false);
  });
});
