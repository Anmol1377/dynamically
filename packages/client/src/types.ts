export type DynamicallyFetcher = typeof fetch;

export interface DynamicallyClientOptions {
  baseUrl: string;
  apiKey?: string;
  preview?: boolean;
  fetch?: DynamicallyFetcher;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
}

export interface PageSummary {
  slug: string;
  title: string;
  updatedAt: string;
}

export interface PageContent<TSections = Record<string, Record<string, unknown>>> {
  slug: string;
  title: string;
  status: 'draft' | 'published';
  updatedAt: string;
  sections: TSections;
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export class DynamicallyApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  constructor(status: number, body: ApiErrorBody) {
    super(body.error.message);
    this.name = 'DynamicallyApiError';
    this.status = status;
    this.code = body.error.code;
    this.details = body.error.details;
  }
}
