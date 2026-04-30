import { createClient, DynamicallyClient } from './index';
import type { DynamicallyClientOptions } from './types';

export interface DynamicallyForNextOptions extends Partial<DynamicallyClientOptions> {
  revalidate?: number | false;
}

export function dynamicallyForNext(opts: DynamicallyForNextOptions = {}): DynamicallyClient {
  const baseUrl = opts.baseUrl ?? process.env.DYNAMICALLY_URL;
  const apiKey = opts.apiKey ?? process.env.DYNAMICALLY_API_KEY;
  const preview = opts.preview ?? process.env.DYNAMICALLY_PREVIEW === 'true';

  if (!baseUrl) {
    throw new Error(
      'dynamicallyForNext: set DYNAMICALLY_URL or pass baseUrl in options'
    );
  }

  return createClient({
    baseUrl,
    apiKey,
    preview,
    next: opts.revalidate !== undefined ? { revalidate: opts.revalidate } : { revalidate: 60 },
  });
}

export { DynamicallyClient };
