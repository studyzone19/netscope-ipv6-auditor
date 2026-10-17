import { describe, it, expect } from 'vitest';
import { isBlockedIp, validateTargetUrl } from '../src/services/security.js';

describe('Security & SSRF Protection Service', () => {
  it('blocks private IPv4 addresses correctly', () => {
    expect(isBlockedIp('127.0.0.1')).toBe(true);
    expect(isBlockedIp('10.0.0.1')).toBe(true);
    expect(isBlockedIp('172.16.0.1')).toBe(true);
    expect(isBlockedIp('192.168.1.254')).toBe(true);
    expect(isBlockedIp('169.254.169.254')).toBe(true); // Cloud metadata
    expect(isBlockedIp('0.0.0.0')).toBe(true);
  });

  it('allows public IPv4 addresses', () => {
    expect(isBlockedIp('8.8.8.8')).toBe(false);
    expect(isBlockedIp('1.1.1.1')).toBe(false);
    expect(isBlockedIp('142.250.190.46')).toBe(false);
  });

  it('blocks private, link-local, and loopback IPv6 addresses', () => {
    expect(isBlockedIp('::1')).toBe(true);
    expect(isBlockedIp('::')).toBe(true);
    expect(isBlockedIp('fe80::1')).toBe(true); // Link-local
    expect(isBlockedIp('fc00::1')).toBe(true); // Unique local
    expect(isBlockedIp('fd12:3456:789a::1')).toBe(true); // Unique local
    expect(isBlockedIp('::ffff:127.0.0.1')).toBe(true); // IPv4-mapped loopback
    expect(isBlockedIp('::ffff:10.0.0.5')).toBe(true); // IPv4-mapped private
  });

  it('allows public global unicast IPv6 addresses', () => {
    expect(isBlockedIp('2606:4700:4700::1111')).toBe(false); // Cloudflare DNS
    expect(isBlockedIp('2001:4860:4860::8888')).toBe(false); // Google DNS
    expect(isBlockedIp('2404:6800:4002:81c::200e')).toBe(false);
  });

  it('rejects forbidden protocols like file, ftp, and javascript', async () => {
    const resFile = await validateTargetUrl('file:///etc/passwd');
    expect(resFile.isValid).toBe(false);
    expect(resFile.error).toMatch(/Disallowed protocol/);

    const resFtp = await validateTargetUrl('ftp://example.com/file');
    expect(resFtp.isValid).toBe(false);
  });

  it('rejects URLs containing embedded credentials', async () => {
    const res = await validateTargetUrl('https://admin:secret@example.com');
    expect(res.isValid).toBe(false);
    expect(res.error).toMatch(/credentials/);
  });

  it('blocks direct access to localhost without lab permission', async () => {
    const res = await validateTargetUrl('http://127.0.0.1:8080');
    expect(res.isValid).toBe(false);
    expect(res.error).toMatch(/SSRF/);
  });

  it('allows localhost strictly when allowLab is enabled on the designated port 5005', async () => {
    const res = await validateTargetUrl('http://127.0.0.1:5005', { allowLab: true, labPort: 5005 });
    expect(res.isValid).toBe(true);
    expect(res.isLab).toBe(true);
  });
});
