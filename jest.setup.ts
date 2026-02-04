// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;
import fetch, { Headers, Request, Response } from 'node-fetch';

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
}
