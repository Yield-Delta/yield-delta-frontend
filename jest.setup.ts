// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;
import fetch, { Headers, Request, Response } from 'node-fetch';

// Mock wagmi modules to avoid ESM issues
jest.mock('wagmi', () => ({
  useWriteContract: jest.fn(() => ({
    writeContractAsync: jest.fn(),
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
  })),
  useAccount: jest.fn(() => ({
    address: '0x1234567890123456789012345678901234567890',
    isConnected: true,
    isConnecting: false,
    isReconnecting: false,
    isDisconnected: false,
    status: 'connected',
  })),
  useWaitForTransactionReceipt: jest.fn(() => ({
    data: undefined,
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
  })),
  useChainId: jest.fn(() => 1328),
  useBalance: jest.fn(() => ({
    data: {
      value: BigInt(5000000000000000000), // 5 ETH
      formatted: '5',
      symbol: 'SEI',
      decimals: 18,
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
  })),
  useReadContract: jest.fn(() => ({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
  })),
  WagmiProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('viem', () => ({
  parseUnits: jest.fn((value: string) => BigInt(parseFloat(value) * 1e18)),
  formatUnits: jest.fn((value: bigint) => (Number(value) / 1e18).toString()),
  parseEther: jest.fn((value: string) => BigInt(parseFloat(value) * 1e18)),
  formatEther: jest.fn((value: bigint) => (Number(value) / 1e18).toString()),
}));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
  })),
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    forEach: jest.fn(),
    entries: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    toString: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

// Polyfill fetch API for Node.js environment
// The 'whatwg-fetch' polyfill is not needed here since Jest's jsdom environment includes 'fetch'.
// If you have issues with fetch in your tests, you might need to configure Jest differently
// or use a more specific polyfill. For now, we'll rely on the built-in fetch.

// Mock Next.js request/response for API testing
interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

interface ResponseOptions {
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
}

global.Request = global.Request || class Request {
  private _url: string;
  private _method: string;
  private _headers: Map<string, string>;
  private _body?: string;

  constructor(url: string, options: RequestOptions = {}) {
    this._url = url;
    this._method = options.method || 'GET';
    this._headers = new Map(Object.entries(options.headers || {}));
    this._body = options.body;
  }

  get url(): string {
    return this._url;
  }

  get method(): string {
    return this._method;
  }

  get headers(): Map<string, string> {
    return this._headers;
  }

  get body(): string | undefined {
    return this._body;
  }

  json() {
    return Promise.resolve(JSON.parse(this._body || '{}'));
  }
}

global.Response = global.Response || class Response {
  private _body: string;
  private _status: number;
  private _statusText: string;
  private _headers: Map<string, string>;

  constructor(body: string, options: ResponseOptions = {}) {
    this._body = body;
    this._status = options.status || 200;
    this._statusText = options.statusText || 'OK';
    this._headers = new Map(Object.entries(options.headers || {}));
  }

  get body(): string {
    return this._body;
  }

  get status(): number {
    return this._status;
  }

  get statusText(): string {
    return this._statusText;
  }

  get headers(): Map<string, string> {
    return this._headers;
  }

  json() {
    return Promise.resolve(JSON.parse(this._body));
  }

  // Static method to create a JSON response - used by NextResponse.json()
  static json(data: any, init?: ResponseOptions): Response {
    const body = JSON.stringify(data);
    return new Response(body, {
      ...init,
      status: init?.status || 200,
      headers: {
        'content-type': 'application/json',
        ...init?.headers,
      },
    });
  }
}
