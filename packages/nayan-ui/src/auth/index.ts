import { requestAuth } from './bridge';

export type SignInProvider = 'google' | 'apple';

export interface SignInOptions {
  /** Google web OAuth client ID or Apple Services ID. */
  clientId: string;
  /** Provider-registered HTTPS callback on your backend. */
  redirectUri: string;
}

export interface SignInTransaction {
  provider: SignInProvider;
  redirectUri: string;
  /** Store with the pending session and consume it once on the backend. */
  state: string;
}

export type SignInRequest = SignInTransaction & {
  authorizationUrl: string;
  /** Match against the nonce claim of the verified ID token on your backend. */
  nonce: string;
} & ({ provider: 'google'; codeVerifier: string } | { provider: 'apple'; codeVerifier?: never });

export interface SignInCallback {
  /** HTTPS callback URL, including the query for Google. */
  url: string;
  /** Raw application/x-www-form-urlencoded POST body for Apple. */
  body?: string;
}

export type SignInCallbackResult = { status: 'success'; code: string } | { status: 'cancelled' } | { status: 'denied' };

async function request<T>(command: object): Promise<T> {
  const result = JSON.parse(await requestAuth(JSON.stringify(command))) as { ok: true; value: T } | { ok: false; error: string };
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

export const auth = {
  /** Create a fresh transaction before opening the authorization URL in the system browser. */
  createRequest(provider: SignInProvider, options: SignInOptions): Promise<SignInRequest> {
    return request({ action: 'createRequest', provider, options });
  },
  /** Parse the provider callback against the saved transaction. Exchange the code on your backend. */
  readCallback({ provider, redirectUri, state }: SignInTransaction, callback: SignInCallback): Promise<SignInCallbackResult> {
    return request({ action: 'readCallback', transaction: { provider, redirectUri, state }, callback });
  }
};
