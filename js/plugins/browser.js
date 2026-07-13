

const BrowserPlugin = {
  name: 'browser',
  currentUrl: '',
  pageContent: '',

  async navigate(url) {
    try {
      const normalized = this.normalizeUrl(url);
      this.currentUrl = normalized;

      // Try the source itself first (works for CORS-enabled open sources such
      // as Wikimedia), then use reader-friendly public fallbacks for ordinary
      // public pages. No API key or user data is sent by this feature.
      const candidates = [
        { url: normalized, type: 'html' },
        { url: `https://r.jina.ai/${normalized}`, type: 'text' },
        { url: `https://api.allorigins.win/raw?url=${encodeURIComponent(normalized)}`, type: 'html' }
      ];

      let lastError;
      for (const candidate of candidates) {
        try {
          const response = await fetch(candidate.url, {
            headers: { Accept: 'text/html, text/plain, application/xhtml+xml' },
            signal: AbortSignal.timeout(12000)
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const raw = await response.text();
          const page = this.toReadablePage(raw, normalized, candidate.type);
          if (page.text) return page;
        } catch (error) {
          lastError = error;
        }
      }
      throw lastError || new Error('No readable content returned');
    } catch (e) {
      return { error: 'Failed to load page: ' + e.message };
    }
  },

  normalizeUrl(value) {
    const source = String(value || '').trim();
    const candidate = /^https?:\/\//i.test(source) ? source : `https://${source}`;
    const parsed = new URL(candidate);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Only public HTTP(S) links are supported');
    return parsed.href;
  },

  toReadablePage(raw, originalUrl, type) {
    const value = String(raw || '').trim();
    if (!value) return { url: originalUrl, title: '', text: '' };
    if (type === 'text' || !/<(?:html|body|article|main|p)[\s>]/i.test(value)) {
      const lines = value.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
      const titleLine = lines.find(line => /^#{1,2}\s+/.test(line));
      return {
        url: originalUrl,
        title: titleLine ? titleLine.replace(/^#{1,2}\s+/, '') : new URL(originalUrl).hostname,
        text: value.replace(/\s+/g, ' ').trim().slice(0, 7000)
      };
    }

    const doc = new DOMParser().parseFromString(value, 'text/html');
    doc.querySelectorAll('script, style, iframe, nav, footer, aside, noscript, svg').forEach(el => el.remove());
    const content = doc.querySelector('article, main, [role="main"], .mw-parser-output') || doc.body;
    return {
      url: originalUrl,
      title: doc.title || new URL(originalUrl).hostname,
      text: (content?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 7000)
    };
  },

  async performAction(action, target) {
    
    console.log(`[BrowserPlugin] Action: ${action} on ${target}`);
    return `Action ${action} on ${target} simulated. Content updated.`;
  }
};

window.BrowserPlugin = BrowserPlugin;
