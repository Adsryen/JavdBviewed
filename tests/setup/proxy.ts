import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import tls from 'node:tls';

const DEFAULT_VITEST_PROXY_URL = 'http://172.23.64.1:17890';

export function getVitestProxyUrl(): string {
  return process.env.JAVDB_TEST_PROXY
    || process.env.VITEST_PROXY_URL
    || DEFAULT_VITEST_PROXY_URL;
}

const proxyUrl = getVitestProxyUrl();

for (const name of ['HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'http_proxy', 'https_proxy', 'all_proxy']) {
  process.env[name] = proxyUrl;
}

(globalThis as any).__JAVDB_VITEST_PROXY_URL__ = proxyUrl;

if (proxyUrl && process.env.JAVDB_TEST_PROXY_FETCH !== 'off') {
  installProxyFetch(proxyUrl);
}

function installProxyFetch(proxy: string): void {
  const originalFetch = globalThis.fetch?.bind(globalThis);

  globalThis.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const request = typeof Request !== 'undefined' && input instanceof Request ? input : null;
    const rawUrl = request?.url || String(input);

    if (!/^https?:\/\//i.test(rawUrl)) {
      if (!originalFetch) throw new TypeError(`Unsupported fetch URL: ${rawUrl}`);
      return originalFetch(input as RequestInfo, init);
    }

    const target = new URL(rawUrl);
    const method = init.method || request?.method || 'GET';
    const headers = mergeHeaders(request?.headers, init.headers);
    const body = await resolveFetchBody(request, init);
    const response = await fetchThroughProxy(new URL(proxy), target, {
      method,
      headers,
      body,
      signal: init.signal || request?.signal || null,
    }, 5);
    return response;
  };

  (globalThis as any).__JAVDB_VITEST_PROXY_FETCH_INSTALLED__ = true;
}

interface ProxyFetchOptions {
  method: string;
  headers: Record<string, string>;
  body?: string | Buffer;
  signal?: AbortSignal | null;
}

async function fetchThroughProxy(
  proxy: URL,
  target: URL,
  options: ProxyFetchOptions,
  redirectsLeft: number,
): Promise<Response> {
  const response = target.protocol === 'https:'
    ? await requestHttpsViaProxy(proxy, target, options)
    : await requestHttpViaProxy(proxy, target, options);

  const location = response.headers.get('location');
  if (location && redirectsLeft > 0 && [301, 302, 303, 307, 308].includes(response.status)) {
    const nextUrl = new URL(location, target);
    const nextOptions = response.status === 303
      ? { ...options, method: 'GET', body: undefined }
      : options;
    return fetchThroughProxy(proxy, nextUrl, nextOptions, redirectsLeft - 1);
  }

  return response;
}

function requestHttpViaProxy(proxy: URL, target: URL, options: ProxyFetchOptions): Promise<Response> {
  const client = proxy.protocol === 'https:' ? https : http;
  return requestWithClient(client, {
    hostname: proxy.hostname,
    port: Number(proxy.port || (proxy.protocol === 'https:' ? 443 : 80)),
    method: options.method,
    path: target.toString(),
    headers: withHostHeader(options.headers, target),
    signal: options.signal || undefined,
  }, options.body, target.toString());
}

async function requestHttpsViaProxy(proxy: URL, target: URL, options: ProxyFetchOptions): Promise<Response> {
  let tunnel: tls.TLSSocket | null = null;
  const agent = new https.Agent({
    keepAlive: false,
    createConnection: (_options, callback) => {
      void createHttpsTunnel(proxy, target, options.signal)
        .then(socket => {
          tunnel = socket;
          callback(null, socket);
        })
        .catch(callback);
      return undefined as unknown as tls.TLSSocket;
    },
  });

  try {
    return await requestWithClient(https, {
      hostname: target.hostname,
      port: Number(target.port || 443),
      method: options.method,
      path: `${target.pathname}${target.search}`,
      headers: withHostHeader(options.headers, target),
      agent,
      signal: options.signal || undefined,
    }, options.body, target.toString());
  } finally {
    agent.destroy();
    tunnel?.destroy();
  }
}

function createHttpsTunnel(proxy: URL, target: URL, signal?: AbortSignal | null): Promise<tls.TLSSocket> {
  return new Promise((resolve, reject) => {
    const proxyPort = Number(proxy.port || 80);
    const targetPort = Number(target.port || 443);
    const socket = net.connect({ host: proxy.hostname, port: proxyPort });
    let responseBuffer = Buffer.alloc(0);
    let settled = false;

    const cleanup = () => {
      signal?.removeEventListener('abort', onAbort);
      socket.removeListener('error', onError);
      socket.removeListener('data', onData);
    };

    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      socket.destroy();
      reject(error);
    };

    const onAbort = () => fail(new DOMException('The operation was aborted', 'AbortError'));
    const onError = (error: Error) => fail(error);
    const onData = (chunk: Buffer) => {
      responseBuffer = Buffer.concat([responseBuffer, chunk]);
      const headerEnd = responseBuffer.indexOf('\r\n\r\n');
      if (headerEnd === -1) return;

      const header = responseBuffer.slice(0, headerEnd).toString('latin1');
      const statusLine = header.split('\r\n')[0] || '';
      const statusCode = Number(statusLine.match(/^HTTP\/\d(?:\.\d)?\s+(\d+)/i)?.[1] || 0);
      if (statusCode < 200 || statusCode >= 300) {
        fail(new Error(`Proxy CONNECT failed: ${statusLine}`));
        return;
      }

      cleanup();
      const tlsSocket = tls.connect({
        socket,
        servername: target.hostname,
        ALPNProtocols: ['http/1.1'],
      });
      tlsSocket.once('secureConnect', () => {
        settled = true;
        resolve(tlsSocket);
      });
      tlsSocket.once('error', fail);
    };

    signal?.addEventListener('abort', onAbort, { once: true });
    socket.once('error', onError);
    socket.once('connect', () => {
      socket.write([
        `CONNECT ${target.hostname}:${targetPort} HTTP/1.1`,
        `Host: ${target.hostname}:${targetPort}`,
        'Proxy-Connection: Keep-Alive',
        '',
        '',
      ].join('\r\n'));
    });
    socket.on('data', onData);
  });
}

function requestWithClient(
  client: typeof http | typeof https,
  requestOptions: http.RequestOptions | https.RequestOptions,
  body: string | Buffer | undefined,
  url: string,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const req = client.request(requestOptions, res => {
      const chunks: Buffer[] = [];
      res.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      res.once('error', reject);
      res.once('end', () => {
        const headers = new Headers();
        for (const [key, value] of Object.entries(res.headers)) {
          if (Array.isArray(value)) {
            value.forEach(item => headers.append(key, item));
          } else if (typeof value !== 'undefined') {
            headers.set(key, String(value));
          }
        }
        resolve(new Response(Buffer.concat(chunks), {
          status: res.statusCode || 0,
          statusText: res.statusMessage || '',
          headers,
        }));
      });
    });

    req.once('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function withHostHeader(headers: Record<string, string>, target: URL): Record<string, string> {
  const hasHost = Object.keys(headers).some(key => key.toLowerCase() === 'host');
  return hasHost ? headers : { ...headers, Host: target.host };
}

function mergeHeaders(base?: Headers, override?: HeadersInit): Record<string, string> {
  const headers = new Headers(base);
  if (override) {
    new Headers(override).forEach((value, key) => headers.set(key, value));
  }
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

async function resolveFetchBody(request: Request | null, init: RequestInit): Promise<string | Buffer | undefined> {
  if (typeof init.body !== 'undefined' && init.body !== null) {
    return toRequestBody(init.body);
  }
  if (request && request.method !== 'GET' && request.method !== 'HEAD') {
    return Buffer.from(await request.clone().arrayBuffer());
  }
  return undefined;
}

async function toRequestBody(body: BodyInit): Promise<string | Buffer> {
  if (typeof body === 'string') return body;
  if (body instanceof URLSearchParams) return body.toString();
  if (body instanceof ArrayBuffer) return Buffer.from(body);
  if (ArrayBuffer.isView(body)) return Buffer.from(body.buffer, body.byteOffset, body.byteLength);
  if (typeof Blob !== 'undefined' && body instanceof Blob) {
    return Buffer.from(await body.arrayBuffer());
  }
  return Buffer.from(await new Response(body).arrayBuffer());
}
