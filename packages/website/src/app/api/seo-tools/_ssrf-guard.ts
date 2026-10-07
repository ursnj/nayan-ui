import { lookup } from "node:dns/promises";

export class BlockedUrlError extends Error {}

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

const PRIVATE_IPV4_RANGES: Array<[string, string]> = [
  ["0.0.0.0", "0.255.255.255"],
  ["10.0.0.0", "10.255.255.255"],
  ["100.64.0.0", "100.127.255.255"], // CGNAT
  ["127.0.0.0", "127.255.255.255"], // loopback
  ["169.254.0.0", "169.254.255.255"], // link-local (incl. cloud metadata)
  ["172.16.0.0", "172.31.255.255"],
  ["192.0.0.0", "192.0.0.255"],
  ["192.168.0.0", "192.168.255.255"],
  ["198.18.0.0", "198.19.255.255"],
  ["224.0.0.0", "255.255.255.255"], // multicast/reserved
];

function isPrivateIPv4(ip: string): boolean {
  const n = ipv4ToInt(ip);
  return PRIVATE_IPV4_RANGES.some(([start, end]) => n >= ipv4ToInt(start) && n <= ipv4ToInt(end));
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  return (
    lower === "::1" ||
    lower === "::" ||
    lower.startsWith("fe80:") || // link-local
    lower.startsWith("fc") || // unique local
    lower.startsWith("fd") || // unique local
    lower.startsWith("::ffff:127.") ||
    lower.startsWith("::ffff:10.") ||
    lower.startsWith("::ffff:169.254.") ||
    lower.startsWith("::ffff:192.168.")
  );
}

/**
 * Resolves `hostname` and throws BlockedUrlError if it (or any of its
 * resolved addresses) points at loopback/link-local/private space —
 * mitigates SSRF via these user-supplied-URL fetch proxies. This re-resolves
 * DNS on every call (including every redirect hop), which narrows but does
 * not eliminate a DNS-rebinding race between this check and the outbound
 * fetch; there's no dependency-free way to pin the resolved IP to the
 * connection without a custom dispatcher.
 */
export async function assertPublicHttpUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new BlockedUrlError("Invalid URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new BlockedUrlError("Only http:// and https:// URLs are allowed");
  }
  const hostname = parsed.hostname;
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new BlockedUrlError("Requests to localhost are not allowed");
  }
  let records: Array<{ address: string; family: number }>;
  try {
    records = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new BlockedUrlError("Could not resolve host");
  }
  for (const { address, family } of records) {
    if (family === 4 && isPrivateIPv4(address)) {
      throw new BlockedUrlError("Requests to private/internal addresses are not allowed");
    }
    if (family === 6 && isPrivateIPv6(address)) {
      throw new BlockedUrlError("Requests to private/internal addresses are not allowed");
    }
  }
  return parsed;
}

/**
 * Like `fetch`, but validates the target (and every redirect hop) against
 * `assertPublicHttpUrl` before each request instead of letting the runtime
 * follow redirects blindly — a redirect to an internal address is a common
 * SSRF-filter bypass.
 */
export async function safeFetch(
  rawUrl: string,
  init: RequestInit = {},
  maxRedirects = 5,
): Promise<Response> {
  let currentUrl = rawUrl;
  for (let i = 0; i <= maxRedirects; i++) {
    const validated = await assertPublicHttpUrl(currentUrl);
    const res = await fetch(validated, { ...init, redirect: "manual" });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) return res;
      currentUrl = new URL(location, validated).toString();
      continue;
    }
    return res;
  }
  throw new BlockedUrlError("Too many redirects");
}
