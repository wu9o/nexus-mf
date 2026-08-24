import type { SandboxMFEVersion } from './SandboxMFE';

export const REMOTE_MANIFEST_SCHEMA_VERSION = 1 as const;

export interface RemoteManifestEntry {
  name: string;
  version: string;
  entry: string;
  basename: string;
  scope?: string;
  exposedModule?: string;
  enabled?: boolean;
  fallbackVersions?: SandboxMFEVersion[];
  integrity?: string;
}

export interface RemoteManifest {
  schemaVersion: typeof REMOTE_MANIFEST_SCHEMA_VERSION;
  remotes: Record<string, RemoteManifestEntry>;
}

export interface LoadRemoteManifestOptions {
  timeout?: number;
  fetchImpl?: typeof fetch;
  /** Restrict remoteEntry origins to a trusted allowlist. */
  allowedOrigins?: readonly string[];
  /** Require HTTPS for all remoteEntry URLs. */
  requireHttps?: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const isVersion = (value: unknown): value is SandboxMFEVersion => (
  isRecord(value)
  && typeof value.version === 'string'
  && value.version.length > 0
  && typeof value.url === 'string'
  && value.url.length > 0
  && (value.integrity === undefined || isIntegrity(value.integrity))
);

const isIntegrity = (value: unknown): value is string => (
  typeof value === 'string' && /^(sha256|sha384|sha512)-[A-Za-z0-9+/]+={0,2}$/.test(value)
);

const validateRemoteUrl = (
  value: string,
  label: string,
  options: Pick<LoadRemoteManifestOptions, 'allowedOrigins' | 'requireHttps'>,
): void => {
  let parsed: URL;
  try {
    parsed = new URL(value, typeof window === 'undefined' ? 'http://localhost' : window.location.href);
  } catch {
    throw new Error(`[NexusMF] Invalid remote URL for ${label}.`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`[NexusMF] Remote URL must use http or https for ${label}.`);
  }
  if (options.requireHttps && parsed.protocol !== 'https:') {
    throw new Error(`[NexusMF] Remote URL must use HTTPS for ${label}.`);
  }
  if (options.allowedOrigins?.length && !options.allowedOrigins.includes(parsed.origin)) {
    throw new Error(`[NexusMF] Remote URL origin is not allowed for ${label}: ${parsed.origin}.`);
  }
};

const validateManifest = (
  value: unknown,
  options: Pick<LoadRemoteManifestOptions, 'allowedOrigins' | 'requireHttps'> = {},
): RemoteManifest => {
  if (!isRecord(value) || value.schemaVersion !== REMOTE_MANIFEST_SCHEMA_VERSION || !isRecord(value.remotes)) {
    throw new Error(`[NexusMF] Remote manifest must use schemaVersion ${REMOTE_MANIFEST_SCHEMA_VERSION}.`);
  }

  const remotes: Record<string, RemoteManifestEntry> = {};
  Object.entries(value.remotes).forEach(([key, rawEntry]) => {
    if (!isRecord(rawEntry) || typeof rawEntry.name !== 'string' || typeof rawEntry.version !== 'string' || typeof rawEntry.entry !== 'string' || typeof rawEntry.basename !== 'string') {
      throw new Error(`[NexusMF] Invalid remote manifest entry: ${key}.`);
    }

    validateRemoteUrl(rawEntry.entry, `${key}.entry`, options);

    const fallbackVersions = rawEntry.fallbackVersions ?? [];
    if (!Array.isArray(fallbackVersions) || !fallbackVersions.every(isVersion)) {
      throw new Error(`[NexusMF] Invalid fallbackVersions for remote: ${key}.`);
    }
    fallbackVersions.forEach((candidate, index) => validateRemoteUrl(candidate.url, `${key}.fallbackVersions[${index}]`, options));
    if (rawEntry.integrity !== undefined && !isIntegrity(rawEntry.integrity)) {
      throw new Error(`[NexusMF] Invalid integrity for remote: ${key}.`);
    }

    remotes[key] = {
      name: rawEntry.name,
      version: rawEntry.version,
      entry: rawEntry.entry,
      basename: rawEntry.basename,
      scope: typeof rawEntry.scope === 'string' ? rawEntry.scope : undefined,
      exposedModule: typeof rawEntry.exposedModule === 'string' ? rawEntry.exposedModule : './App',
      enabled: rawEntry.enabled !== false,
      fallbackVersions,
      integrity: typeof rawEntry.integrity === 'string' ? rawEntry.integrity : undefined,
    };
  });

  return { schemaVersion: REMOTE_MANIFEST_SCHEMA_VERSION, remotes };
};

export const loadRemoteManifest = async (
  url: string,
  { timeout = 5000, fetchImpl = fetch, allowedOrigins, requireHttps = false }: LoadRemoteManifestOptions = {},
): Promise<RemoteManifest> => {
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timeoutId = setTimeout(() => controller?.abort(), timeout);

  try {
    const response = await fetchImpl(url, controller ? { signal: controller.signal } : undefined);
    if (!response.ok) {
      throw new Error(`[NexusMF] Failed to load remote manifest (${response.status}): ${url}`);
    }
    return validateManifest(await response.json(), { allowedOrigins, requireHttps });
  } catch (error) {
    if (controller?.signal.aborted) {
      throw new Error(`[NexusMF] Timed out loading remote manifest: ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};
