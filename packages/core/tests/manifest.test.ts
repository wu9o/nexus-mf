import { describe, expect, it, vi } from 'vitest';
import { loadRemoteManifest } from '../src/manifest';

describe('remote manifest', () => {
  it('loads and normalizes remote entries', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        schemaVersion: 1,
        remotes: {
          dashboard: {
            name: 'dashboard',
            version: '1.2.0',
            entry: 'https://cdn.example.com/dashboard/1.2.0/remoteEntry.js',
            basename: '/dashboard',
            fallbackVersions: [{
              version: '1.1.0',
              url: 'https://cdn.example.com/dashboard/1.1.0/remoteEntry.js',
            }],
          },
        },
      }),
    }) as unknown as typeof fetch;

    await expect(loadRemoteManifest('/remote-manifest.json', { fetchImpl })).resolves.toEqual({
      schemaVersion: 1,
      remotes: {
        dashboard: {
          name: 'dashboard',
          version: '1.2.0',
          entry: 'https://cdn.example.com/dashboard/1.2.0/remoteEntry.js',
          basename: '/dashboard',
          scope: undefined,
          exposedModule: './App',
          enabled: true,
          fallbackVersions: [{
            version: '1.1.0',
            url: 'https://cdn.example.com/dashboard/1.1.0/remoteEntry.js',
          }],
          integrity: undefined,
        },
      },
    });
    expect(fetchImpl).toHaveBeenCalledWith('/remote-manifest.json', expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it('rejects malformed entries before the host renders', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ schemaVersion: 1, remotes: { dashboard: { name: 'dashboard', entry: '/remoteEntry.js' } } }),
    }) as unknown as typeof fetch;

    await expect(loadRemoteManifest('/remote-manifest.json', { fetchImpl })).rejects.toThrow('Invalid remote manifest entry');
  });

  it('enforces schema, HTTPS, and trusted remote origins', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        schemaVersion: 1,
        remotes: {
          dashboard: {
            name: 'dashboard',
            version: '1.2.0',
            entry: 'https://cdn.example.com/dashboard/1.2.0/remoteEntry.js',
            basename: '/dashboard',
          },
        },
      }),
    }) as unknown as typeof fetch;

    await expect(loadRemoteManifest('/remote-manifest.json', {
      fetchImpl,
      allowedOrigins: ['https://cdn.example.com'],
      requireHttps: true,
    })).resolves.toMatchObject({ schemaVersion: 1 });

    await expect(loadRemoteManifest('/remote-manifest.json', {
      fetchImpl,
      allowedOrigins: ['https://other.example.com'],
      requireHttps: true,
    })).rejects.toThrow('origin is not allowed');
  });

  it('rejects a manifest with an unsupported schema version', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ schemaVersion: 2, remotes: {} }),
    }) as unknown as typeof fetch;

    await expect(loadRemoteManifest('/remote-manifest.json', { fetchImpl })).rejects.toThrow('schemaVersion 1');
  });
});
