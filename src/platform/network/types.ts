export interface FetchOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  referrer?: string;
  proxy?: boolean;
  responseType?: 'text' | 'json' | 'blob' | 'document';
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public url: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}
