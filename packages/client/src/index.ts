import {
  DynamicallyApiError,
  type ApiErrorBody,
  type DynamicallyClientOptions,
  type PageContent,
  type PageSummary,
} from './types';

export class DynamicallyClient {
  private baseUrl: string;
  private apiKey?: string;
  private preview: boolean;
  private fetcher: typeof fetch;
  private nextOpts?: DynamicallyClientOptions['next'];

  constructor(opts: DynamicallyClientOptions) {
    if (!opts.baseUrl) throw new Error('DynamicallyClient: baseUrl is required');
    this.baseUrl = opts.baseUrl.replace(/\/+$/, '');
    this.apiKey = opts.apiKey;
    this.preview = Boolean(opts.preview);
    this.fetcher = opts.fetch ?? fetch;
    this.nextOpts = opts.next;
  }

  async getPages(): Promise<PageSummary[]> {
    const res = await this.request('/api/v1/pages');
    const body = (await res.json()) as { pages: PageSummary[] };
    return body.pages;
  }

  async getPage<TSections = Record<string, Record<string, unknown>>>(
    slug: string
  ): Promise<PageContent<TSections>> {
    const path = `/api/v1/pages/${encodeURIComponent(slug)}${this.preview ? '?preview=true' : ''}`;
    const res = await this.request(path);
    return (await res.json()) as PageContent<TSections>;
  }

  private async request(path: string): Promise<Response> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;

    const init: RequestInit & { next?: DynamicallyClientOptions['next'] } = { headers };
    if (this.nextOpts) init.next = this.nextOpts;

    const res = await this.fetcher(`${this.baseUrl}${path}`, init);
    if (!res.ok) {
      let body: ApiErrorBody;
      try {
        body = (await res.json()) as ApiErrorBody;
      } catch {
        body = { error: { code: 'UNKNOWN', message: `HTTP ${res.status}` } };
      }
      throw new DynamicallyApiError(res.status, body);
    }
    return res;
  }
}

export function createClient(opts: DynamicallyClientOptions): DynamicallyClient {
  return new DynamicallyClient(opts);
}

export { DynamicallyApiError };
export type {
  DynamicallyClientOptions,
  PageContent,
  PageSummary,
  DynamicallyFetcher,
} from './types';
