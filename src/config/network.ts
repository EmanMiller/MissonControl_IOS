import { OPENCLAW_ORIGIN as OPENCLAW_ORIGIN_ENV } from './env.generated';

const OPENCLAW_ORIGIN_RAW = OPENCLAW_ORIGIN_ENV;
const API_PREFIX_RAW = '/api';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const ensureLeadingSlash = (value: string) => (value.startsWith('/') ? value : `/${value}`);

export const OPENCLAW_ORIGIN = trimTrailingSlash(OPENCLAW_ORIGIN_RAW);
export const API_PREFIX = ensureLeadingSlash(trimTrailingSlash(API_PREFIX_RAW));
export const API_BASE_URL = `${OPENCLAW_ORIGIN}${API_PREFIX}`;
export const SOCKET_URL = OPENCLAW_ORIGIN;

export const API_HEALTH_URLS = [
  `${API_BASE_URL}/health`,
  `${OPENCLAW_ORIGIN}/health`,
];
