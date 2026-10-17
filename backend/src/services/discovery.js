import { chromium } from 'playwright';

/**
 * Normalizes a resource type from Playwright's request.resourceType()
 */
function normalizeResourceType(type, url) {
  const t = (type || '').toLowerCase();
  if (['document', 'stylesheet', 'script', 'image', 'font', 'xhr', 'fetch', 'subframe', 'media', 'websocket'].includes(t)) {
    return t;
  }
  // Fallbacks by URL extension
  if (/\.js(\?.*)?$/i.test(url)) return 'script';
  if (/\.css(\?.*)?$/i.test(url)) return 'stylesheet';
  if (/\.(png|jpe?g|gif|svg|webp|ico|avif)(\?.*)?$/i.test(url)) return 'image';
  if (/\.(woff2?|ttf|otf|eot)(\?.*)?$/i.test(url)) return 'font';
  if (/\.(json|xml)(\?.*)?$/i.test(url)) return 'fetch';
  return 'other';
}

/**
 * Discovers resources loaded by a web page during an actual browser session.
 * @param {string} targetUrl - URL to navigate to
 * @param {Object} options - { timeoutMs, maxResources }
 * @returns {Promise<{ resources: Array, navigationError?: string, redirectedUrl?: string }>}
 */
export async function discoverResources(targetUrl, options = {}) {
  const timeoutMs = options.timeoutMs || 20000;
  const maxResources = options.maxResources || 60;

  let browser = null;
  const discoveredMap = new Map();
  let rootUrl = targetUrl;
  let finalUrl = targetUrl;
  let navigationError = null;

  try {
    const rootParsed = new URL(targetUrl);
    const rootHostname = rootParsed.hostname.toLowerCase();

    // Launch Playwright in controlled headless mode
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
      ],
    });

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 NetScopeIPv6Auditor/1.0',
      viewport: { width: 1280, height: 800 },
      ignoreHTTPSErrors: true,
    });

    const page = await context.newPage();

    // Set page defaults
    page.setDefaultTimeout(timeoutMs);
    page.setDefaultNavigationTimeout(timeoutMs);

    // Track network events
    page.on('request', (request) => {
      if (discoveredMap.size >= maxResources) return;

      const reqUrl = request.url();
      // Skip non-http(s) schemes like data:, blob:, chrome:
      if (!reqUrl.startsWith('http://') && !reqUrl.startsWith('https://')) return;

      try {
        const parsed = new URL(reqUrl);
        const resourceHostname = parsed.hostname.toLowerCase();
        const isThirdParty =
          resourceHostname !== rootHostname &&
          !resourceHostname.endsWith(`.${rootHostname}`);

        // Try extracting initiator details
        const initiator = request.initiator() || null;
        let parentUrl = null;
        if (initiator && initiator.url) {
          parentUrl = initiator.url;
        } else if (discoveredMap.size > 0 && reqUrl !== rootUrl) {
          parentUrl = rootUrl;
        }

        const port = parsed.port
          ? parseInt(parsed.port, 10)
          : parsed.protocol === 'https:'
          ? 443
          : 80;

        discoveredMap.set(reqUrl, {
          url: reqUrl,
          hostname: resourceHostname,
          pathname: parsed.pathname || '/',
          protocol: parsed.protocol,
          port,
          resourceType: normalizeResourceType(request.resourceType(), reqUrl),
          method: request.method(),
          browserStatusCode: null,
          browserStatusText: null,
          initiator,
          parentUrl,
          isThirdParty,
          timing: {
            startTime: Date.now(),
            duration: 0,
          },
          discoveredAt: new Date(),
        });
      } catch (err) {
        // Ignore unparseable URLs
      }
    });

    page.on('response', (response) => {
      const resUrl = response.url();
      if (discoveredMap.has(resUrl)) {
        const item = discoveredMap.get(resUrl);
        item.browserStatusCode = response.status();
        item.browserStatusText = response.statusText();
        if (item.timing && item.timing.startTime) {
          item.timing.duration = Date.now() - item.timing.startTime;
        }
      }
    });

    page.on('requestfailed', (request) => {
      const failedUrl = request.url();
      if (discoveredMap.has(failedUrl)) {
        const item = discoveredMap.get(failedUrl);
        item.browserStatusCode = 0;
        item.browserStatusText = request.failure()?.errorText || 'REQUEST_FAILED';
      }
    });

    // Navigate to root page
    try {
      let response = null;
      try {
        response = await page.goto(targetUrl, {
          waitUntil: 'load',
          timeout: Math.min(timeoutMs, 12000),
        });
      } catch (_) {
        // Fallback to domcontentloaded if load timed out
        response = await page.goto(targetUrl, {
          waitUntil: 'domcontentloaded',
          timeout: timeoutMs,
        });
      }

      finalUrl = page.url();
      if (response) {
        // Ensure the main document is properly recorded
        const mainUrl = response.url();
        if (!discoveredMap.has(mainUrl)) {
          const parsed = new URL(mainUrl);
          const port = parsed.port ? parseInt(parsed.port, 10) : (parsed.protocol === 'https:' ? 443 : 80);
          discoveredMap.set(mainUrl, {
            url: mainUrl,
            hostname: parsed.hostname.toLowerCase(),
            pathname: parsed.pathname || '/',
            protocol: parsed.protocol,
            port,
            resourceType: 'document',
            method: 'GET',
            browserStatusCode: response.status(),
            browserStatusText: response.statusText(),
            initiator: { type: 'browser-navigation' },
            parentUrl: null,
            isThirdParty: false,
            timing: { startTime: Date.now(), duration: 0 },
            discoveredAt: new Date(),
          });
        }
      }

      // Allow async scripts/XHR/fetch requests to settle
      await page.waitForTimeout(2000);

      // Extract DOM referenced resources (scripts, links, stylesheets, images, iframes)
      try {
        const domElements = await page.evaluate(() => {
          const items = [];
          document.querySelectorAll('script[src], link[href], img[src], iframe[src]').forEach((el) => {
            const rawUrl = el.src || el.href;
            if (rawUrl && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))) {
              const tag = el.tagName.toLowerCase();
              let rType = 'other';
              if (tag === 'script') rType = 'script';
              else if (tag === 'link') {
                const rel = (el.getAttribute('rel') || '').toLowerCase();
                if (rel.includes('stylesheet')) rType = 'stylesheet';
                else if (rel.includes('font') || rel.includes('preload')) rType = 'font';
                else if (rel.includes('icon')) rType = 'image';
                else rType = 'other';
              } else if (tag === 'img') rType = 'image';
              else if (tag === 'iframe') rType = 'subframe';

              items.push({ url: rawUrl, resourceType: rType });
            }
          });
          return items;
        });

        for (const item of domElements) {
          if (discoveredMap.size >= maxResources) break;
          if (!discoveredMap.has(item.url)) {
            try {
              const parsed = new URL(item.url);
              const resourceHostname = parsed.hostname.toLowerCase();
              const isThirdParty =
                resourceHostname !== rootHostname &&
                !resourceHostname.endsWith(`.${rootHostname}`);
              const port = parsed.port
                ? parseInt(parsed.port, 10)
                : parsed.protocol === 'https:'
                ? 443
                : 80;

              discoveredMap.set(item.url, {
                url: item.url,
                hostname: resourceHostname,
                pathname: parsed.pathname || '/',
                protocol: parsed.protocol,
                port,
                resourceType: item.resourceType,
                method: 'GET',
                browserStatusCode: 200,
                browserStatusText: 'DOM-Observed',
                initiator: { type: 'html-element' },
                parentUrl: rootUrl,
                isThirdParty,
                timing: { startTime: Date.now(), duration: 0 },
                discoveredAt: new Date(),
              });
            } catch (_) {}
          }
        }
      } catch (_) {}
    } catch (navErr) {
      navigationError = navErr.message;
      // If root document wasn't added yet, add it as failed
      if (discoveredMap.size === 0) {
        try {
          const parsed = new URL(targetUrl);
          const port = parsed.port ? parseInt(parsed.port, 10) : (parsed.protocol === 'https:' ? 443 : 80);
          discoveredMap.set(targetUrl, {
            url: targetUrl,
            hostname: parsed.hostname.toLowerCase(),
            pathname: parsed.pathname || '/',
            protocol: parsed.protocol,
            port,
            resourceType: 'document',
            method: 'GET',
            browserStatusCode: 0,
            browserStatusText: navErr.message,
            initiator: { type: 'browser-navigation' },
            parentUrl: null,
            isThirdParty: false,
            timing: { startTime: Date.now(), duration: 0 },
            discoveredAt: new Date(),
          });
        } catch (_) {}
      }
    }

    await context.close();
  } catch (err) {
    navigationError = err.message;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (_) {}
    }
  }

  const resources = Array.from(discoveredMap.values());
  return {
    resources,
    navigationError,
    finalUrl,
  };
}
