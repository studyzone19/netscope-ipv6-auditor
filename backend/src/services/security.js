import dns from 'dns/promises';
import net from 'net';

// CIDR matching helpers
function ipv4ToInt(ip) {
  return ip
    .split('.')
    .reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0);
}

function isIpv4InCidr(ip, cidr) {
  const [range, bits = '32'] = cidr.split('/');
  const mask = bits === '0' ? 0 : (~0 << (32 - parseInt(bits, 10))) >>> 0;
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(range) & mask);
}

const BLOCKED_IPV4_CIDRS = [
  '0.0.0.0/8',       // Current network
  '10.0.0.0/8',      // Private class A
  '100.64.0.0/10',   // Carrier-grade NAT
  '127.0.0.0/8',     // Loopback
  '169.254.0.0/16',  // Link-local / Cloud metadata
  '172.16.0.0/12',   // Private class B
  '192.0.0.0/24',    // IETF Protocol Assignments
  '192.0.2.0/24',    // TEST-NET-1
  '192.168.0.0/16',  // Private class C
  '198.18.0.0/15',   // Benchmarking
  '198.51.100.0/24', // TEST-NET-2
  '203.0.113.0/24',  // TEST-NET-3
  '224.0.0.0/4',     // Multicast
  '240.0.0.0/4',     // Reserved
  '255.255.255.255/32' // Broadcast
];

// Check if an IPv6 address is private, loopback, link-local, or cloud-metadata
function isBlockedIpv6(ip) {
  const normalized = ip.toLowerCase();

  // Loopback & unspecified
  if (normalized === '::1' || normalized === '::') return true;

  // IPv4-mapped IPv6 (::ffff:127.0.0.1 or ::ffff:7f00:1)
  if (normalized.startsWith('::ffff:')) {
    const v4Part = normalized.replace('::ffff:', '');
    if (net.isIPv4(v4Part)) {
      return isBlockedIpv4(v4Part);
    }
  }

  // Unique local address (fc00::/7 -> starts with fc or fd)
  if (/^f[cd][0-9a-f]{2}:/i.test(normalized)) return true;

  // Link-local (fe80::/10 -> starts with fe8, fe9, fea, feb)
  if (/^fe[89ab][0-9a-f]:/i.test(normalized)) return true;

  // Multicast (ff00::/8)
  if (/^ff[0-9a-f]{2}:/i.test(normalized)) return true;

  // Discard prefix (100::/64)
  if (normalized.startsWith('100::')) return true;

  return false;
}

export function isBlockedIpv4(ip) {
  for (const cidr of BLOCKED_IPV4_CIDRS) {
    if (isIpv4InCidr(ip, cidr)) return true;
  }
  return false;
}

export function isBlockedIp(ip) {
  if (net.isIPv4(ip)) {
    return isBlockedIpv4(ip);
  }
  if (net.isIPv6(ip)) {
    return isBlockedIpv6(ip);
  }
  return true; // Unknown IP format treated as blocked
}

// Blocked hostnames (cloud metadata, internal services)
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback',
  'metadata.google.internal',
  'metadata.aws',
  'instance-data',
  '169.254.169.254',
  'kubernetes.default',
  'kubernetes.default.svc',
]);

/**
 * Validates a target URL against SSRF, private IPs, and malicious schemes.
 * @param {string} inputUrl - The URL to validate
 * @param {Object} options - { allowLab: boolean, labPort: number }
 * @returns {Promise<{ isValid: boolean, error?: string, parsedUrl?: URL, resolvedIps?: string[] }>}
 */
export async function validateTargetUrl(inputUrl, options = {}) {
  const { allowLab = false, labPort = 5005 } = options;

  if (!inputUrl || typeof inputUrl !== 'string') {
    return { isValid: false, error: 'URL must be a non-empty string' };
  }

  let parsed;
  try {
    let urlToParse = inputUrl.trim();
    // Only prepend https:// if no URI scheme is provided (e.g. "example.com" or "example.com/path")
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(urlToParse)) {
      urlToParse = `https://${urlToParse}`;
    }
    parsed = new URL(urlToParse);
  } catch (err) {
    return { isValid: false, error: `Invalid URL format: ${err.message}` };
  }

  // Scheme restriction: only HTTP and HTTPS
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      isValid: false,
      error: `Disallowed protocol "${parsed.protocol}". Only http: and https: are allowed.`,
    };
  }

  // Disallow userinfo (e.g. http://user:pass@example.com)
  if (parsed.username || parsed.password) {
    return { isValid: false, error: 'URLs with embedded credentials are not permitted' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Controlled Lab special exemption
  if (allowLab && (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1')) {
    const port = parsed.port ? parseInt(parsed.port, 10) : (parsed.protocol === 'https:' ? 443 : 80);
    if (port === labPort) {
      return {
        isValid: true,
        parsedUrl: parsed,
        isLab: true,
        resolvedIps: ['127.0.0.1'],
      };
    }
  }

  // Check known blocked hostnames
  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    return {
      isValid: false,
      error: `Access to hostname "${hostname}" is blocked (private or internal network).`,
    };
  }

  // If hostname is directly an IP address
  if (net.isIP(hostname)) {
    if (isBlockedIp(hostname)) {
      return {
        isValid: false,
        error: `Destination IP ${hostname} belongs to a restricted/private subnet (SSRF protection).`,
      };
    }
    return {
      isValid: true,
      parsedUrl: parsed,
      resolvedIps: [hostname],
    };
  }

  // DNS Pre-flight check: resolve destination and verify all returned addresses are public
  try {
    let resolvedIps = [];

    try {
      const [ipv4Records, ipv6Records] = await Promise.allSettled([
        dns.resolve4(hostname),
        dns.resolve6(hostname),
      ]);
      if (ipv4Records.status === 'fulfilled') resolvedIps.push(...ipv4Records.value);
      if (ipv6Records.status === 'fulfilled') resolvedIps.push(...ipv6Records.value);
    } catch (_) {}

    // Fallback to OS getaddrinfo lookup if c-ares failed or returned nothing
    if (resolvedIps.length === 0) {
      try {
        const lookupResults = await dns.lookup(hostname, { all: true });
        resolvedIps = lookupResults.map((r) => r.address);
      } catch (_) {}
    }

    if (resolvedIps.length === 0) {
      return {
        isValid: false,
        error: `Domain "${hostname}" does not resolve to any A or AAAA records.`,
      };
    }

    for (const ip of resolvedIps) {
      if (isBlockedIp(ip)) {
        return {
          isValid: false,
          error: `Domain "${hostname}" resolved to blocked/private IP ${ip} (DNS Rebinding protection).`,
        };
      }
    }

    return {
      isValid: true,
      parsedUrl: parsed,
      resolvedIps,
    };
  } catch (dnsErr) {
    return {
      isValid: false,
      error: `DNS resolution failed for "${hostname}": ${dnsErr.message}`,
    };
  }
}
