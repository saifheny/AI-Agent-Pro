

const SearchPlugin = {
  name: 'search',

  async search(query, type = 'general') {
    console.log(`[SearchPlugin] Searching for: ${query} (Type: ${type})`);

    const results = [];


    const promises = [];

    if (type === 'general' || type === 'news') {
      promises.push(this.searchDuckDuckGo(query));
      promises.push(this.searchGoogle(query));
      promises.push(this.searchBing(query));
      promises.push(this.searchWikipedia(query));
    }

    if (type === 'scientific' || type === 'research') {
      promises.push(this.searchArxiv(query));
      promises.push(this.searchPubMed(query));
      promises.push(this.searchWikipedia(query));
    }

    if (type === 'coding' || type === 'tech') {
      promises.push(this.searchDuckDuckGo(query + ' programming solution site:stackoverflow.com OR site:github.com'));
    }

    const settled = await Promise.allSettled(promises);
    return settled.flatMap(result => result.status === 'fulfilled' ? result.value : []).filter(r => r && r.content).slice(0, 12);
  },

  async searchGoogle(query) {
    return this.searchThroughJina(`https://www.google.com/search?q=${encodeURIComponent(query)}`, 'Google');
  },

  async searchBing(query) {
    return this.searchThroughJina(`https://www.bing.com/search?q=${encodeURIComponent(query)}`, 'Bing');
  },

  async searchThroughJina(searchUrl, source) {
    try {
      const response = await fetch(`https://s.jina.ai/http://${searchUrl.replace(/^https?:\/\//, '')}`, {
        headers: { Accept: 'text/plain' }
      });
      if (!response.ok) return [];
      return this.extractMarkdownResults(await response.text(), source);
    } catch (e) {
      return [];
    }
  },

  extractMarkdownResults(markdown, source) {
    const seen = new Set();
    const results = [];
    const matches = markdown.matchAll(/\[([^\]]{4,180})\]\((https?:\/\/[^\s)]+)\)/g);
    for (const match of matches) {
      const title = match[1].replace(/\s+/g, ' ').trim();
      const url = match[2];
      if (seen.has(url) || /google\.com\/search|bing\.com\/search/.test(url)) continue;
      const nearby = markdown.slice(match.index + match[0].length, match.index + match[0].length + 420);
      const content = nearby.split('\n').map(line => line.replace(/^[-*#>\s]+/, '').trim()).filter(Boolean).slice(0, 3).join(' ');
      if (title && content) {
        seen.add(url);
        results.push({ title, url, content, source });
      }
      if (results.length === 5) break;
    }
    return results;
  },


  async searchDuckDuckGo(query) {
    try {


      const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

      const response = await fetch(proxyUrl);
      const data = await response.json();
      const html = data.contents;

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const results = [];

      const links = doc.querySelectorAll('.result__a');
      const snippets = doc.querySelectorAll('.result__snippet');

      links.forEach((link, i) => {
        if (i < 5) {
          results.push({
            title: link.textContent.trim(),
            url: link.href,
            content: snippets[i] ? snippets[i].textContent.trim() : '',
            source: 'DuckDuckGo'
          });
        }
      });

      return results;
    } catch (e) {
      console.error('DuckDuckGo search failed', e);
      return [];
    }
  },

  async searchWikipedia(query) {
    try {
      const url = `https://ar.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
      const response = await fetch(url);
      const data = await response.json();

      return (data.query.search || []).map(r => ({
        title: r.title,
        url: `https://ar.wikipedia.org/wiki/${encodeURIComponent(r.title)}`,
        content: r.snippet.replace(/<[^>]*>/g, ''),
        source: 'Wikipedia'
      }));
    } catch (e) {
      return [];
    }
  },

  async searchArxiv(query) {
    try {
      const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=3`;
      const response = await fetch(url);
      const text = await response.text();

      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'text/xml');
      const entries = xml.querySelectorAll('entry');
      const results = [];

      entries.forEach(entry => {
        results.push({
          title: entry.querySelector('title').textContent.trim(),
          url: entry.querySelector('id').textContent.trim(),
          content: entry.querySelector('summary').textContent.trim(),
          source: 'arXiv'
        });
      });

      return results;
    } catch (e) {
      return [];
    }
  },

  async searchPubMed(query) {
    try {

      const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmode=json`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      const ids = searchData.esearchresult.idlist;

      if (!ids || ids.length === 0) return [];

      const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.slice(0, 3).join(',')}&retmode=json`;
      const summaryRes = await fetch(summaryUrl);
      const summaryData = await summaryRes.json();

      const results = [];
      for (const id of ids.slice(0, 3)) {
        const item = summaryData.result[id];
        if (item) {
          results.push({
            title: item.title,
            url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
            content: item.source + ' (' + item.pubdate + ')',
            source: 'PubMed'
          });
        }
      }
      return results;
    } catch (e) {
      return [];
    }
  },

  filterResults(results) {

    return results.filter(r => {
      if (!r.title || r.title.length < 5) return false;
      if (!r.content || r.content.length < 10) return false;
      const spamKeywords = ['buy', 'cheap', 'discount', 'free download', 'torrent'];
      return !spamKeywords.some(k => r.title.toLowerCase().includes(k) || r.content.toLowerCase().includes(k));
    });
  }
};

window.SearchPlugin = SearchPlugin;
