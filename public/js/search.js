const FrontendSearch = {
  index: null,
  searchInput: null,
  searchResults: null,

  async init(indexUrl) {
    try {
      const response = await fetch(indexUrl);
      this.index = await response.json();
      this.searchInput = document.getElementById('search-input');
      this.searchResults = document.getElementById('search-results');

      if (this.searchInput && this.searchResults) {
        this.bindEvents();
      }
    } catch (error) {
      console.error('Failed to load search index:', error);
    }
  },

  bindEvents() {
    this.searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      if (query.length >= 2) {
        this.search(query);
      } else {
        this.hideResults();
      }
    });

    this.searchInput.addEventListener('focus', () => {
      if (this.searchInput.value.trim().length >= 2) {
        this.searchResults.classList.add('active');
      }
    });

    document.addEventListener('click', (e) => {
      if (!this.searchInput.contains(e.target) && !this.searchResults.contains(e.target)) {
        this.hideResults();
      }
    });

    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideResults();
      }
    });
  },

  search(query) {
    if (!this.index || !this.index.manuals) {
      return;
    }

    const queryLower = query.toLowerCase();
    const results = this.index.manuals.filter((manual) => {
      return (
        manual.title?.toLowerCase().includes(queryLower) ||
        manual.brand?.toLowerCase().includes(queryLower) ||
        manual.model?.toLowerCase().includes(queryLower) ||
        manual.category?.toLowerCase().includes(queryLower)
      );
    }).slice(0, 10);

    this.showResults(results, query);
  },

  showResults(results, query) {
    if (results.length === 0) {
      this.searchResults.innerHTML = '<div class="search-result-item">未找到结果</div>';
    } else {
      this.searchResults.innerHTML = results
        .map((manual) => {
          const title = this.highlight(manual.title, query);
          return `<div class="search-result-item" onclick="window.location.href='${manual.url}'">
            <div><strong>${title}</strong></div>
            <div style="color: #6b7280; font-size: 12px;">${manual.brand} - ${manual.model}</div>
          </div>`;
        })
        .join('');
    }

    this.searchResults.classList.add('active');
  },

  hideResults() {
    this.searchResults.classList.remove('active');
  },

  highlight(text, query) {
    if (!text) return '';
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FrontendSearch;
}
