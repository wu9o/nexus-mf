const PROD_BASE_PATH = 'https://wu9o.github.io/nexus-mf/';
const ROUTER_BASENAME = process.env.NODE_ENV === 'production' ? '/nexus-mf' : '/';
const NEXUS_MF_EVENT = 'nexus-mf:event';

const createMessageId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `nexus-mf-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const normalizeMessage = (message) => {
  if (!message || typeof message !== 'object' || typeof message.source !== 'string' || typeof message.type !== 'string') {
    throw new TypeError('[NexusMF] A message requires string `source` and `type` fields.');
  }

  return {
    id: message.id || createMessageId(),
    timestamp: message.timestamp || Date.now(),
    source: message.source,
    type: message.type,
    payload: message.payload && typeof message.payload === 'object' ? message.payload : {},
  };
};

const publish = (message) => {
  const normalizedMessage = normalizeMessage(message);
  if (typeof window === 'undefined') return normalizedMessage;

  window.dispatchEvent(new CustomEvent(NEXUS_MF_EVENT, { detail: normalizedMessage }));
  return normalizedMessage;
};

const subscribe = (handler, options = {}) => {
  if (typeof window === 'undefined') return () => {};

  const listener = (event) => {
    const message = event.detail;
    if (!message || typeof message.source !== 'string' || typeof message.type !== 'string') return;
    if (options.source && options.source !== message.source) return;
    if (options.types && !options.types.includes(message.type)) return;
    handler(message);
  };
  window.addEventListener(NEXUS_MF_EVENT, listener);

  return () => window.removeEventListener(NEXUS_MF_EVENT, listener);
};

module.exports = {
  PROD_BASE_PATH,
  ROUTER_BASENAME,
  NEXUS_MF_EVENT,
  publish,
  subscribe,
};
