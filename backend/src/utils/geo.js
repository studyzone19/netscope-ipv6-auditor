// Lightweight geolocation and ASN resolver helper for measurement context

/**
 * Resolves geolocation and ASN metadata for an IP address.
 * Uses public IP-API with a fast timeout and graceful fallback to offline classification.
 */
export async function getIpGeoContext(ip) {
  if (!ip || ip === '127.0.0.1' || ip === '::1') {
    return {
      country: 'Localhost',
      city: 'Local Loopback',
      org: 'Local Network',
      asn: 'AS0',
    };
  }

  // Quick offline classification for well-known prefixes
  if (ip.startsWith('142.250.') || ip.startsWith('142.251.') || ip.startsWith('2404:6800:') || ip.startsWith('2001:4860:')) {
    return {
      country: 'Global / Regional Anycast',
      city: 'Google Edge Network',
      org: 'Google LLC',
      asn: 'AS15169',
    };
  }

  if (ip.startsWith('104.16.') || ip.startsWith('104.17.') || ip.startsWith('104.18.') || ip.startsWith('2606:4700:')) {
    return {
      country: 'Global Anycast',
      city: 'Cloudflare Edge',
      org: 'Cloudflare Inc.',
      asn: 'AS13335',
    };
  }

  if (ip.startsWith('185.199.') || ip.startsWith('140.82.') || ip.startsWith('2606:50c0:')) {
    return {
      country: 'United States',
      city: 'Fastly / GitHub CDN',
      org: 'GitHub, Inc. / Fastly',
      asn: 'AS54113',
    };
  }

  // Attempt lightweight online lookup with 1.5s timeout
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);

    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,org,as`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        return {
          country: data.country || 'Unknown',
          city: data.city || 'Edge Node',
          org: data.org || 'Internet Service Provider',
          asn: data.as || 'Unknown ASN',
        };
      }
    }
  } catch (_) {
    // Fail silently to keep measurement speed fast
  }

  return {
    country: 'International Anycast',
    city: 'Edge Node',
    org: 'Authoritative Host',
    asn: 'BGP Routed',
  };
}
