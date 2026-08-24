export interface NexusMFEventMap {
  'dashboard:health-check': {
    status: 'healthy' | 'degraded' | 'offline';
    checkedAt: string;
  };
  'settings:theme-changed': {
    theme: 'light' | 'dark';
  };
  [eventType: string]: Record<string, unknown>;
}

export type NexusMFEventType = keyof NexusMFEventMap;

export interface NexusMFMessage<TType extends NexusMFEventType = NexusMFEventType> {
  id: string;
  timestamp: number;
  source: string;
  type: TType;
  payload: NexusMFEventMap[TType];
}

export type NexusMFMessageInput<TType extends NexusMFEventType = NexusMFEventType> = Omit<NexusMFMessage<TType>, 'id' | 'timestamp'> & {
  id?: string;
  timestamp?: number;
};

export interface NexusMFSubscribeOptions {
  source?: string;
  types?: readonly NexusMFEventType[];
}

export const NEXUS_MF_EVENT: string;
export const PROD_BASE_PATH: string;
export const ROUTER_BASENAME: string;
export function publish<TType extends NexusMFEventType>(message: NexusMFMessageInput<TType>): NexusMFMessage<TType> | undefined;
export function subscribe<TType extends NexusMFEventType>(handler: (message: NexusMFMessage<TType>) => void, options?: NexusMFSubscribeOptions): () => void;
