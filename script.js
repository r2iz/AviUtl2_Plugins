// ===================================================================================
// アプリケーション本体
// ===================================================================================
const App = {
    // 状態管理
    state: {
        currentPage: 'plugins',
        plugins: [],
        scripts: [],
        allTags: new Set(),
        isLoading: true,
        error: null,
        filters: {
            search: '',
            tags: new Set(),
        },
        viewMode: 'grid', // 'grid' or 'list'
        tagMode: 'or', // 新しいタグ選択モード: 'or' or 'and'
    },

    // DOM要素
    elements: {
        app: document.getElementById('app'),
        loader: document.getElementById('loader'),
        navLinks: document.querySelectorAll('.nav-link'),
    },

    // 初期化
    async init() {
        // モバイルデバイスからのアクセスをチェック
        const isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            const confirmMessage = "このサイトはPCでの表示に最適化されています。表示はできますが、本当に入りますか？";
            if (!window.confirm(confirmMessage)) {
                // キャンセルが押された場合の処理
                // ここで別のページにリダイレクトすることも可能
                // 例: window.location.href = 'https://example.com';
                return; // 処理を中断
            }
        }
        
        this.config = await this.fetchConfig();
        this.howToInstallMarkdown = await this.fetchMarkdown('how_to_install.md');

        this.elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.dataset.page;
                if (page) {
                    this.navigate(page);
                }
            });
        });

        window.addEventListener('popstate', () => {
            this.navigate(this.getCurrentPageFromURL(), false);
        });

        this.fetchData().then(() => {
            const page = this.getCurrentPageFromURL();
            this.navigate(page, false);
        });
        this.addEventListeners(); // イベントリスナーは一度だけ追加
    },

    async fetchConfig() {
        try {
            const res = await fetch('config.json');
            if (!res.ok) throw new Error('config.jsonが見つかりません。');
            return await res.json();
        } catch (error) {
            console.error('設定ファイルの読み込みに失敗しました:', error);
            this.state.error = '設定ファイルが見つからないか、読み込みに失敗しました。';
            this.state.isLoading = false;
            this.render();
            return null;
        }
    },

    async fetchMarkdown(file) {
        try {
            const res = await fetch(file);
            if (!res.ok) throw new Error(`${file}の読み込みに失敗しました。`);
            return await res.text();
        } catch (error) {
            console.error('Markdownファイルの読み込みに失敗しました:', error);
            this.state.error = '導入方法のコンテンツが読み込めませんでした。';
            this.state.isLoading = false;
            this.render();
            return '';
        }
    },

    getCurrentPageFromURL() {
        const hash = window.location.hash.replace('#', '');
        return ['plugins', 'scripts', 'install', 'info'].includes(hash) ? hash : 'plugins';
    },

    // ページ遷移
    navigate(page, pushState = true) {
        // 同じページなら何もしない
        if (this.state.currentPage === page) {
            return;
        }

        const appElement = this.elements.app;
        
        // 現在のコンテンツをフェードアウトさせる
        appElement.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
        appElement.style.opacity = '0';
        appElement.style.transform = 'translateY(-10px)';

        // アニメーションが終わるのを待ってから次の処理へ
        setTimeout(() => {
            this.state.currentPage = page;
            if (pushState) {
                history.pushState({ page }, '', `#${page}`);
            }
            
            // 新しいページを描画
            this.render();
            
            // 新しいコンテンツをフェードインさせる
            appElement.style.transition = 'none'; // 一旦トランジションを無効化
            appElement.style.opacity = '0';
            appElement.style.transform = 'translateY(10px)';
            
            // 描画が完了してからアニメーションを有効化して実行
            setTimeout(() => {
                appElement.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
                appElement.style.opacity = '1';
                appElement.style.transform = 'translateY(0)';
                window.scrollTo(0, 0);
            }, 50); // 少しだけ遅らせることでアニメーションが実行される
        }, 300); // ここはフェードアウトにかかる時間と同じにする
    },

    // microCMSからデータを取得
    async fetchData() {
        this.state.isLoading = true;
        this.render();

        if (!this.config?.microCMSServiceDomain || this.config.microCMSServiceDomain === 'YOUR_SERVICE_DOMAIN') {
            this.state.error = 'microCMSの設定が完了していません。config.jsonを編集してください。';
            this.state.isLoading = false;
            this.render();
            return;
        }

        const headers = { 'X-MICROCMS-API-KEY': this.config.microCMSApiKey };
        const baseUrl = `https://${this.config.microCMSServiceDomain}.microcms.io/api/v1`;

        try {
            const [pluginsRes, scriptsRes] = await Promise.all([
                fetch(`${baseUrl}/plugins?limit=100`, { headers }),
                fetch(`${baseUrl}/scripts?limit=100`, { headers }),
            ]);

            if (!pluginsRes.ok) {
                const errorData = await pluginsRes.json();
                throw new Error(`プラグインの取得に失敗しました: ${errorData.message}`);
            }
            if (!scriptsRes.ok) {
                const errorData = await scriptsRes.json();
                throw new Error(`スクリプトの取得に失敗しました: ${errorData.message}`);
            }

            const pluginsData = await pluginsRes.json();
            const scriptsData = await scriptsRes.json();
            
            this.state.plugins = pluginsData.contents;
            this.state.scripts = scriptsData.contents;
            
            const tags = new Set();
            [...this.state.plugins, ...this.state.scripts].forEach(item => {
                const itemTags = item.tags ? item.tags.split(',').map(tag => tag.trim()) : [];
                itemTags.forEach(tag => tags.add(tag));
            });
            this.state.allTags = tags;

            this.state.error = null;
        } catch (error) {
            console.error('Fetch error:', error);
            this.state.error = error.message;
        } finally {
            this.state.isLoading = false;
            this.render();
        }
    },

    // レンダリング
    render() {
        if (this.state.isLoading) {
            this.elements.loader.style.opacity = '1';
            this.elements.loader.style.pointerEvents = 'auto';
        } else {
            this.elements.loader.style.opacity = '0';
            this.elements.loader.style.pointerEvents = 'none';
        }
        
        this.elements.navLinks.forEach(link => {
            link.classList.toggle('text-white', link.dataset.page === this.state.currentPage);
            link.classList.toggle('text-gray-300', link.dataset.page !== this.state.currentPage);
        });

        if (this.state.error) {
            this.elements.app.innerHTML = this.templates.error(this.state.error);
            return;
        }

        let content = '';
        switch (this.state.currentPage) {
            case 'plugins':
                content = this.templates.itemsPage.call(this, 'プラグイン', '最新のプラグインを見つけよう', this.state.plugins);
                break;
            case 'scripts':
                content = this.templates.itemsPage.call(this, 'スクリプト', '便利なスクリプトを探そう', this.state.scripts);
                break;
            case 'install':
                content = this.templates.installPage.call(this);
                break;
            case 'info':
                content = this.templates.infoPage.call(this);
                break;
        }
        this.elements.app.innerHTML = content;
        
        // ページ遷移後にアイテムリストだけを再描画する
        if (this.state.currentPage === 'plugins' || this.state.currentPage === 'scripts') {
            this.renderItems();
        }
    },

    renderItems() {
        const currentItems = this.state.currentPage === 'plugins' ? this.state.plugins : this.state.scripts;
        const filteredItems = currentItems.filter(item => {
            const searchMatch = (item.name?.toLowerCase() || '').includes(this.state.filters.search.toLowerCase()) ||
                                 (item.description?.toLowerCase() || '').includes(this.state.filters.search.toLowerCase());
            const itemTags = new Set(item.tags ? item.tags.split(',').map(tag => tag.trim()) : []);

            let tagMatch = false;
            if (this.state.filters.tags.size === 0) {
                tagMatch = true;
            } else {
                if (this.state.tagMode === 'or') {
                    // モード1: 選択したタグを一つでも含んでいればOK
                    tagMatch = [...this.state.filters.tags].some(tag => itemTags.has(tag));
                } else {
                    // モード2: 選択したタグをすべて含んでいなければNG
                    tagMatch = [...this.state.filters.tags].every(tag => itemTags.has(tag));
                }
            }
            return searchMatch && tagMatch;
        });
        
        const itemsListElement = document.getElementById('items-list');
        if (itemsListElement) {
            itemsListElement.className = this.state.viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4';
            itemsListElement.innerHTML = filteredItems.length > 0 ? filteredItems.map(item => this.templates.itemCard(item, this.state.viewMode)).join('') : '<p class="text-gray-400 col-span-full text-center py-10">アイテムが見つかりませんでした。</p>';
        }
    },

    // イベントリスナーの追加
    addEventListeners() {
        document.getElementById('app').addEventListener('input', (e) => {
            if (e.target.id === 'search-input') {
                this.state.filters.search = e.target.value;
                this.renderItems();
            }
        });

        document.getElementById('app').addEventListener('click', (e) => {
            const tagEl = e.target.closest('.tag-filter');
            if (tagEl) {
                const tag = tagEl.dataset.tag;
                if (this.state.filters.tags.has(tag)) {
                    this.state.filters.tags.delete(tag);
                } else {
                    this.state.filters.tags.add(tag);
                }
                this.updateTagStyles();
                this.renderItems();
            }
            
            const viewGridBtn = e.target.closest('#view-grid');
            if (viewGridBtn) {
                this.state.viewMode = 'grid';
                this.updateViewModeButtons();
                this.renderItems();
            }
            
            const viewListBtn = e.target.closest('#view-list');
            if (viewListBtn) {
                this.state.viewMode = 'list';
                this.updateViewModeButtons();
                this.renderItems();
            }

            const reloadBtn = e.target.closest('#reload-button');
            if (reloadBtn) {
                this.fetchData();
            }

            const tagModeOrBtn = e.target.closest('#tag-mode-or');
            if (tagModeOrBtn) {
                this.state.tagMode = 'or';
                this.updateTagModeButtons();
                this.renderItems();
            }
            
            const tagModeAndBtn = e.target.closest('#tag-mode-and');
            if (tagModeAndBtn) {
                this.state.tagMode = 'and';
                this.updateTagModeButtons();
                this.renderItems();
            }
        });
    },

    updateTagStyles() {
        document.querySelectorAll('.tag-filter').forEach(tagEl => {
            const tag = tagEl.dataset.tag;
            tagEl.classList.toggle('bg-blue-500', this.state.filters.tags.has(tag));
            tagEl.classList.toggle('border-blue-500', this.state.filters.tags.has(tag));
            tagEl.classList.toggle('text-white', this.state.filters.tags.has(tag));
            tagEl.classList.toggle('bg-white/10', !this.state.filters.tags.has(tag));
            tagEl.classList.toggle('border-white/10', !this.state.filters.tags.has(tag));
            tagEl.classList.toggle('hover:bg-white/20', !this.state.filters.tags.has(tag));
            tagEl.classList.toggle('text-gray-300', !this.state.filters.tags.has(tag));
        });
    },

    updateViewModeButtons() {
        const gridBtn = document.getElementById('view-grid');
        const listBtn = document.getElementById('view-list');
        if (gridBtn && listBtn) {
            gridBtn.classList.toggle('bg-blue-600/50', this.state.viewMode === 'grid');
            gridBtn.classList.toggle('text-white', this.state.viewMode === 'grid');
            gridBtn.classList.toggle('bg-black/30', this.state.viewMode !== 'grid');
            gridBtn.classList.toggle('text-gray-400', this.state.viewMode !== 'grid');
            
            listBtn.classList.toggle('bg-blue-600/50', this.state.viewMode === 'list');
            listBtn.classList.toggle('text-white', this.state.viewMode === 'list');
            listBtn.classList.toggle('bg-black/30', this.state.viewMode !== 'list');
            listBtn.classList.toggle('text-gray-400', this.state.viewMode !== 'list');
        }
    },

    updateTagModeButtons() {
        const orBtn = document.getElementById('tag-mode-or');
        const andBtn = document.getElementById('tag-mode-and');
        if (orBtn && andBtn) {
            orBtn.classList.toggle('bg-blue-600/50', this.state.tagMode === 'or');
            orBtn.classList.toggle('bg-black/30', this.state.tagMode !== 'or');
            orBtn.classList.toggle('text-white', this.state.tagMode === 'or');
            orBtn.classList.toggle('text-gray-400', this.state.tagMode !== 'or');
            
            andBtn.classList.toggle('bg-blue-600/50', this.state.tagMode === 'and');
            andBtn.classList.toggle('bg-black/30', this.state.tagMode !== 'and');
            andBtn.classList.toggle('text-white', this.state.tagMode === 'and');
            andBtn.classList.toggle('text-gray-400', this.state.tagMode !== 'and');
        }
    },


    // HTMLテンプレート
    templates: {
        hero(title, subtitle) {
            return `
                <section class="text-center py-16 sm:py-24">
                    <h1 class="text-4xl sm:text-6xl font-bold tracking-tighter text-white">${title}</h1>
                    <p class="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">${subtitle}</p>
                </section>
            `;
        },
        itemsPage(title, subtitle, items) {
            const currentItems = this.state.currentPage === 'plugins' ? this.state.plugins : this.state.scripts;
            const currentTags = new Set();
            currentItems.forEach(item => {
                const itemTags = item.tags ? item.tags.split(',').map(tag => tag.trim()) : [];
                itemTags.forEach(tag => currentTags.add(tag));
            });

            return `
                ${App.templates.hero(title, subtitle)}
                <div class="flex flex-col md:flex-row gap-8">
                    <div class="w-full md:w-3/4">
                        <div class="glassmorphism p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-24 z-10">
                            <div class="relative w-full sm:w-auto flex-grow">
                                <input id="search-input" type="text" placeholder="検索..." value="${App.state.filters.search}" class="w-full bg-black/30 border border-white/10 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                                <svg class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" /></svg>
                            </div>
                            <div class="flex items-center gap-2">
                                <button id="view-grid" class="${App.state.viewMode === 'grid' ? 'bg-blue-600/50 text-white' : 'bg-black/30 text-gray-400'} p-2 rounded-lg transition-colors hover:bg-blue-600/40"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg></button>
                                <button id="view-list" class="${App.state.viewMode === 'list' ? 'bg-blue-600/50 text-white' : 'bg-black/30 text-gray-400'} p-2 rounded-lg transition-colors hover:bg-blue-600/40"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg></button>
                            </div>
                        </div>
                        
                        <div id="items-list" class="${App.state.viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4'}">
                            ${/* itemsはrenderItems()で動的に追加 */ ''}
                        </div>
                    </div>
                    <aside class="w-full md:w-1/4">
                        <div class="glassmorphism p-5 sticky top-24">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="font-bold text-lg text-white">タグ一覧</h3>
                                <div>
                                    <button id="tag-mode-or" class="text-xs font-medium px-2 py-1 rounded ${App.state.tagMode === 'or' ? 'bg-blue-600/50 text-white' : 'bg-black/30 text-gray-400'}">OR</button>
                                    <button id="tag-mode-and" class="text-xs font-medium px-2 py-1 rounded ${App.state.tagMode === 'and' ? 'bg-blue-600/50 text-white' : 'bg-black/30 text-gray-400'}">AND</button>
                                </div>
                                <button id="reload-button" title="データを再読み込み" class="text-gray-400 hover:text-white transition-transform duration-300 hover:rotate-180">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>
                                </button>
                            </div>
                            <div class="flex flex-wrap gap-2">
                                ${[...currentTags].sort().map(tag => `
                                    <button class="tag-filter text-xs font-medium px-3 py-1 rounded-full transition-all duration-200 border
                                        ${App.state.filters.tags.has(tag)
                                            ? 'bg-blue-500 border-blue-500 text-white'
                                            : 'bg-white/10 border-white/10 hover:bg-white/20 text-gray-300'}"
                                        data-tag="${tag}">
                                        ${tag}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </aside>
                </div>
            `;
        },
        itemCard(item, viewMode) {
            const itemTags = item.tags ? item.tags.split(',').map(tag => tag.trim()) : [];
            const tagsHtml = itemTags.map(tag => `<span class="bg-gray-700/50 text-gray-300 text-xs px-2 py-1 rounded">${tag}</span>`).join('') || '';

            if (viewMode === 'grid') {
                return `
                <div class="item-card glassmorphism h-full">
                    <div class="content p-6 flex flex-col h-full">
                        <h3 class="text-lg font-bold text-white mb-2">${item.name}</h3>
                        <p class="text-sm text-gray-300 flex-grow mb-4">${item.description}</p>
                        <div class="flex flex-wrap gap-2 mb-4">
                            ${tagsHtml}
                        </div>
                        <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary mt-auto w-full text-center text-white font-semibold py-2 px-4 rounded-lg">
                            ダウンロード
                        </a>
                    </div>
                </div>
                `;
            } else { // list view
                return `
                <div class="item-card glassmorphism">
                    <div class="content p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div class="flex-grow">
                            <h3 class="text-lg font-bold text-white">${item.name}</h3>
                            <p class="text-sm text-gray-300 mt-1">${item.description}</p>
                            <div class="flex flex-wrap gap-2 mt-3">
                                ${tagsHtml}
                            </div>
                        </div>
                        <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary w-full sm:w-auto text-center text-white font-semibold py-2 px-4 rounded-lg flex-shrink-0">
                            ダウンロード
                        </a>
                    </div>
                </div>
                `;
            }
        },
        installPage() {
            return `
                ${App.templates.hero('導入方法', 'プラグインとスクリプトの基本的な導入手順')}
                <div class="glassmorphism p-6 sm:p-10 max-w-4xl mx-auto">
                    <div class="markdown-body">
                        ${marked.parse(App.howToInstallMarkdown)}
                    </div>
                </div>
            `;
        },
        infoPage() {
            return `
                ${App.templates.hero('情報提供', '新しいプラグインやスクリプトの情報を教えてください')}
                <div class="text-center max-w-2xl mx-auto">
                    <div class="glassmorphism p-8">
                        <p class="text-lg mb-6">
                            このサイトに掲載されていないプラグインやスクリプト、または情報に誤りがある場合など、お気軽に下記のフォームから情報をお寄せください。
                        </p>
                        <a href="${App.config.googleFormURL}" target="_blank" rel="noopener noreferrer" class="btn btn-primary inline-block text-white font-bold py-3 px-8 rounded-lg text-lg">
                            情報提供フォームへ
                        </a>
                    </div>
                </div>
            `;
        },
        error(message) {
            return `
                <div class="text-center py-20">
                    <h2 class="text-2xl font-bold text-red-400">エラーが発生しました</h2>
                    <p class="mt-4 text-gray-300 font-mono bg-black/30 p-4 rounded-lg inline-block">${message}</p>
                </div>
            `;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});