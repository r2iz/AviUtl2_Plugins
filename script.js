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
        currentLang: 'ja', // ★ 新しい状態: 現在の言語 ('ja' or 'en')
    },
    
    // ★ 翻訳データ
    i18n: {
        en: {
            nav: {
                logo: 'AviUtl2 Hub', // ★ 追加
                plugins: 'Plugins', // ★ 追加
                scripts: 'Scripts', // ★ 追加
                install: 'How to Install', // ★ 追加
                info: 'Submit Info', // ★ 追加
            },
            hero: {
                plugins_title: 'Plugins',
                plugins_subtitle: 'Discover the latest plugins',
                scripts_title: 'Scripts',
                scripts_subtitle: 'Find useful scripts',
                install_title: 'How to Install',
                install_subtitle: 'Basic installation steps for plugins and scripts',
                info_title: 'Submit Information',
                info_subtitle: 'Tell us about new plugins and scripts',
            },
            common: {
                search: 'Search...',
                detail: 'Details',
                download: 'Download',
                no_description: 'No description available.',
                no_items: 'No items found.',
                reload: 'Reload Data',
                no_info_title: 'No Information Available',
                no_info_text: 'No detailed information provided.\nPlease check the author\'s site separately.', // ★ 改行コードを含む
                close: 'Close',
                tag_filter: 'Tag Filter',
                error_title: 'An Error Occurred',
                error_prefix: 'Detail: ',
            },
            footer: {
                description: 'This is an unofficial hub created by me to collect AviUtl2 information. For bugs or info, contact me on social media!', // ★ 以前の長い説明文
                short_description: 'This is an unofficial site that compiles AviUtl2 scripts and plugins.\nIt is updated irregularly.', // ★ 新しい短い説明文
                copyright: '&copy; 2025 AviUtl2 Hub. All Rights Reserved.',
                affiliation: 'This site is not affiliated with the official AviUtl developers.',
                mobile_warning: 'This site is optimized for PC viewing. You can proceed, but are you sure you want to enter?',
                info_form_text: 'If you find a plugin or script not listed on this site, or if there are any errors in the information, please feel free to submit information using the form below.',
                info_form_button: 'Go to Submission Form',
            }
        },
        ja: {
            nav: {
                logo: 'AviUtl2 Hub', // ★ 追加
                plugins: 'プラグイン', // ★ 追加
                scripts: 'スクリプト', // ★ 追加
                install: '導入方法', // ★ 追加
                info: '情報提供', // ★ 追加
            },
            hero: {
                plugins_title: 'プラグイン',
                plugins_subtitle: '最新のプラグインを見つけよう',
                scripts_title: 'スクリプト',
                scripts_subtitle: '便利なスクリプトを探そう',
                install_title: '導入方法',
                install_subtitle: 'プラグインとスクリプトの基本的な導入手順',
                info_title: '情報提供',
                info_subtitle: '新しいプラグインやスクリプトの情報を教えてください',
            },
            common: {
                search: '検索...',
                detail: '詳細',
                download: 'Download',
                no_description: '説明がありません。',
                no_items: 'アイテムが見つかりませんでした。',
                reload: 'データを再読み込み',
                no_info_title: '情報がありません',
                no_info_text: '詳細情報が提供されていません。\n作者のサイトなどを別途ご確認ください。', // ★ 改行コードを含む
                close: '閉じる',
                tag_filter: 'タグフィルタ',
                error_title: 'エラーが発生しました',
                error_prefix: '詳細: ',
            },
            footer: {
                description: 'このサイトは、俺がAviUtl2の情報を集めるために作った非公式ハブだよ。不具合や情報提供はSNSまで！', // ★ 以前の長い説明文
                short_description: 'AviUtl2のスクリプトとプラグインをまとめた非公式サイトです。\n不定期に更新しています。', // ★ 新しい短い説明文
                copyright: '&copy; 2025 AviUtl2 Hub. All Rights Reserved.',
                affiliation: 'This site is not affiliated with the official AviUtl developers.',
                mobile_warning: 'このサイトはPCでの表示に最適化されています。表示はできますが、本当に入りますか？',
                info_form_text: 'このサイトに掲載されていないプラグインやスクリプト、または情報に誤りがある場合など、お気軽に下記のフォームから情報をお寄せください。',
                info_form_button: '情報提供フォームへ',
            }
        }
    },

    // DOM要素
    elements: {
        app: document.getElementById('app'),
        loader: document.getElementById('loader'),
        navLinks: document.querySelectorAll('.nav-link'),
        // ★ 言語切り替えボタンのグループとボタン要素を追加
        langToggleBtnGroup: null,
        langBtns: null, 
    },

    // ★ アイテムから現在の言語のタグリストを取得するヘルパー
    getTranslatedTags(item) {
        const lang = this.state.currentLang;
        // enが選択されており、tags_enフィールドがあればそれを使用
        if (lang === 'en' && item.tags_en) {
            return item.tags_en.split(',').map(tag => tag.trim());
        }
        // jaの場合、またはtags_enが存在しない場合はtagsを使用
        return item.tags ? item.tags.split(',').map(tag => tag.trim()) : [];
    },

    // ★ 現在の言語に対応するすべてのユニークな表示用タグを取得（タグフィルタ用）
    getAllDisplayTags() {
        const currentItems = this.state.currentPage === 'plugins' ? this.state.plugins : this.state.scripts;
        const displayTags = new Set();

        currentItems.forEach(item => {
            // 現在の言語に応じたタグリストを取得
            const itemTags = this.getTranslatedTags(item); 
            itemTags.forEach(tag => displayTags.add(tag));
        });
        return displayTags;
    },

    // 初期化
    async init() {
        // デフォルト言語の設定
        this.state.currentLang = 'ja'; 
        
        // ★ 新しいDOM要素の取得
        this.elements.langToggleBtnGroup = document.getElementById('lang-toggle-btn-group');
        this.elements.langBtns = document.querySelectorAll('.lang-btn');
        // ★ init時に全てのnavLinksを再取得し直す（ロゴリンクもdata-i18nを持つようにするため）
        this.elements.navLinks = document.querySelectorAll('.nav-link');


        // モバイルデバイスからのアクセスをチェック
        const isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            // ★ 翻訳キーを使用
            const confirmMessage = this.i18n[this.state.currentLang].footer.mobile_warning;
            if (!window.confirm(confirmMessage)) {
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

        // ★ 言語切り替えボタンのイベントリスナー
        if (this.elements.langToggleBtnGroup) {
            this.elements.langBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    this.switchLanguage(btn.dataset.lang);
                });
            });
        }
        
        // 初期ロード時にボタンのスタイルを更新
        this.updateLangButtonStyles();

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

    // ★ 言語切り替えロジック（ローディングを伴う）
    switchLanguage(newLang) {
        if (this.state.currentLang === newLang) return; // 変更がない場合は何もしない

        // 1. ローディング画面を表示
        this.state.isLoading = true;
        this.elements.loader.style.opacity = '1';
        this.elements.loader.style.pointerEvents = 'auto';

        // 2. ページ全体をフェードアウト
        const appElement = this.elements.app;
        appElement.style.transition = 'opacity 0.3s ease-out';
        appElement.style.opacity = '0';

        // 3. アニメーションが終わるのを待ってから言語を切り替え、再描画
        setTimeout(() => {
            this.state.currentLang = newLang;
            
            // 翻訳とコンテンツの再描画を実行
            // render()内で translatePage()が呼ばれ、その中で updateLangButtonStyles()も呼ばれる
            this.render(); 
            // フィルタリングも再実行 (translatePage -> renderItems)

            // 4. ローディング画面を隠し、コンテンツをフェードイン
            this.state.isLoading = false;
            this.elements.loader.style.opacity = '0';
            this.elements.loader.style.pointerEvents = 'none';

            appElement.style.transition = 'opacity 0.5s ease-out';
            appElement.style.opacity = '1';
            
        }, 300); // フェードアウトの時間に合わせる
    },

    // ★ 言語ボタンのスタイルを更新する関数
    updateLangButtonStyles() {
        const currentLang = this.state.currentLang;
        this.elements.langBtns.forEach(btn => {
            const isSelected = btn.dataset.lang === currentLang;
            
            // 選択中のスタイル：背景色あり、文字は白（デフォルト）
            btn.classList.toggle('bg-white/30', isSelected);
            btn.classList.toggle('text-white', isSelected);
            
            // 未選択のスタイル：背景色なし（透明）、文字はグレー、ホバーは薄い白
            btn.classList.toggle('bg-transparent', !isSelected);
            btn.classList.toggle('text-gray-300', !isSelected);
            btn.classList.toggle('hover:bg-white/20', !isSelected); // ホバーは未選択時のみ適用
        });
    },

    // モーダル操作
    showModal() {
        const modal = document.getElementById('custom-modal');
        if (modal) {
            // hiddenを外し、flexで表示
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            
            // アニメーションのために少し遅延させる
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                // モーダルコンテンツにアクセスするためにクエリセレクタでglassmorphismクラスを持つ要素を探す
                const modalContent = modal.querySelector('.glassmorphism');
                if (modalContent) {
                    modalContent.classList.remove('scale-95');
                }
            }, 10);
        }
    },

    hideModal() {
        const modal = document.getElementById('custom-modal');
        if (modal) {
            // アニメーションを先に実行
            modal.classList.add('opacity-0');
            // モーダルコンテンツにアクセスするためにクエリセレクタでglassmorphismクラスを持つ要素を探す
            const modalContent = modal.querySelector('.glassmorphism');
            if (modalContent) {
                modalContent.classList.add('scale-95');
            }
            
            // アニメーションが終わってからhiddenを追加
            setTimeout(() => {
                modal.classList.remove('flex');
                modal.classList.add('hidden');
            }, 300); // CSSのtransition-durationに合わせて300ms
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
        
        // navLinksを更新（ロゴも含む）
        this.elements.navLinks.forEach(link => {
            link.classList.toggle('text-white', link.dataset.page === this.state.currentPage);
            link.classList.toggle('text-gray-300', link.dataset.page !== this.state.currentPage);
        });

        if (this.state.error) {
            // ★ エラーメッセージの翻訳は行わず、取得したメッセージをそのまま表示
            this.elements.app.innerHTML = this.templates.error(this.state.error);
            return;
        }

        let content = '';
        const lang = this.state.currentLang;
        const dict = this.i18n[lang];

        switch (this.state.currentPage) {
            case 'plugins':
                // ★ 翻訳キーを使用
                content = this.templates.itemsPage.call(this, dict.hero.plugins_title, dict.hero.plugins_subtitle, this.state.plugins);
                break;
            case 'scripts':
                // ★ 翻訳キーを使用
                content = this.templates.itemsPage.call(this, dict.hero.scripts_title, dict.hero.scripts_subtitle, this.state.scripts);
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
            this.updateTagStyles();
            this.updateViewModeButtons();
            this.updateTagModeButtons();
        }
        
        // ★ ページ切り替え時に翻訳を実行 (ローディング後のフェードイン前に実行される)
        this.translatePage();
    },

    // ★ ページ全体を翻訳する関数
    translatePage() {
        const lang = this.state.currentLang;
        const dict = this.i18n[lang];

        // 1. data-i18n属性を持つ要素を更新 (ナビゲーションリンク、フッター、モーダルボタンなど)
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n; // 例: 'nav.plugins'
            const [section, subkey] = key.split('.');
            if (dict[section] && dict[section][subkey]) {
                
                // ★ common.no_info_text, footer.description, footer.short_description, common.no_info_title は改行処理が必要な場合があるのでinnerHTMLを使用
                if (key === 'common.no_info_text' || key === 'footer.description' || key === 'footer.short_description' || key === 'common.no_info_title') {
                    // 改行コード \n を <br> に変換して適用
                    el.innerHTML = dict[section][subkey].replace(/\n/g, '<br>');
                } else {
                    el.textContent = dict[section][subkey];
                }
            }
        });

        // 2. 特殊な要素（プレースホルダーなど）を更新
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.placeholder = dict.common.search;
        }
        
        // 3. モーダル内のタイトルを更新 (data-i18nで処理されるため、手動処理は削除)
        // const modalTitle = document.querySelector('#custom-modal h3');
        // if (modalTitle) modalTitle.textContent = dict.common.no_info_title;

        // 4. ページのメインコンテンツが翻訳を反映するために再描画が必要な場合、ここで行う
        if (this.state.currentPage === 'plugins' || this.state.currentPage === 'scripts') {
            // ★ タグフィルタリストを再描画するためにrenderItemsを呼び出す
            this.renderItems(); 
            this.updateTagStyles(); // スタイルも再適用
        } else if (this.state.currentPage === 'info') {
             // infoPageの動的コンテンツを更新
            const infoTextEl = document.querySelector('.info-page-text');
            const infoBtnEl = document.querySelector('.info-page-button');
            // infoPageのp要素はtemplateでinnerHTMLが設定済みのため、ここでは不要
            if (infoBtnEl) infoBtnEl.textContent = dict.footer.info_form_button;
        }

        // ★ 言語ボタンのスタイルを更新（選択状態を反映）
        this.updateLangButtonStyles();
    },


    renderItems() {
        const currentItems = this.state.currentPage === 'plugins' ? this.state.plugins : this.state.scripts;
        const filteredItems = currentItems.filter(item => {
            // ★ 検索対象を日本語/英語両方のフィールドにする場合は、ここでロジックを拡張
            const searchMatch = (item.name?.toLowerCase() || '').includes(this.state.filters.search.toLowerCase()) ||
                                 (item.description?.toLowerCase() || '').includes(this.state.filters.search.toLowerCase()) ||
                                 (item.name_en?.toLowerCase() || '').includes(this.state.filters.search.toLowerCase()) || // 英語名も検索対象に追加
                                 (item.description_en?.toLowerCase() || '').includes(this.state.filters.search.toLowerCase()); // 英語説明も検索対象に追加

            // ★ タグフィルタリングロジックを修正
            // 選択されたフィルタタグとアイテムのタグ（現在の言語）を比較
            const itemDisplayTags = new Set(this.getTranslatedTags(item)); // 現在の言語のタグリストを取得

            let tagMatch = false;
            if (this.state.filters.tags.size === 0) {
                tagMatch = true;
            } else {
                if (this.state.tagMode === 'or') {
                    // モード1: 選択したフィルタタグが、アイテムの表示タグリストに一つでも含まれていればOK
                    tagMatch = [...this.state.filters.tags].some(selectedTag => itemDisplayTags.has(selectedTag));
                } else {
                    // モード2: 選択したフィルタタグが、アイテムの表示タグリストにすべて含まれていればNG
                    tagMatch = [...this.state.filters.tags].every(selectedTag => itemDisplayTags.has(selectedTag));
                }
            }
            return searchMatch && tagMatch;
        });
        
        const itemsListElement = document.getElementById('items-list');
        const tagFiltersElement = document.getElementById('tag-filters');
        
        if (itemsListElement) {
            itemsListElement.className = this.state.viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4';
            // ★ no_itemsを翻訳
            itemsListElement.innerHTML = filteredItems.length > 0 ? filteredItems.map(item => this.templates.itemCard(item, this.state.viewMode)).join('') : `<p class="text-gray-400 col-span-full text-center py-10">${this.i18n[this.state.currentLang].common.no_items}</p>`;
        }

        // ★ タグフィルタリストの再描画 (言語切り替え対応)
        if (tagFiltersElement) {
            const displayTags = this.getAllDisplayTags();
            tagFiltersElement.innerHTML = [...displayTags].sort().map(tag => {
                // 選択状態を反映
                const isSelected = this.state.filters.tags.has(tag);
                const baseClasses = 'tag-filter text-xs py-1 px-3 rounded-full border transition-colors';
                const selectedClasses = isSelected 
                    ? 'bg-white/20 border-white/40 text-white' 
                    : 'bg-white/05 border-white/10 text-gray-300 hover:bg-white/20';
                    
                // data-tagには表示用テキスト（翻訳済）を格納
                return `<button data-tag="${tag}" class="${baseClasses} ${selectedClasses}">${tag}</button>`;
            }).join('');
            this.updateTagStyles(); // スタイルを再適用
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
                // タグの選択状態が変更されたら、スタイルとアイテムリストを更新
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

            // 詳細ボタンの処理
            const detailBtn = e.target.closest('.detail-link');
            if (detailBtn) {
                e.preventDefault();
                const url = detailBtn.dataset.url;
                if (url && url !== '#' && url !== '') {
                    // URLがある場合は新しいタブで開く
                    window.open(url, '_blank');
                } else {
                    // URLがない場合はカスタムモーダルを表示
                    this.showModal();
                }
            }
            
            // ダウンロードボタンの処理
            const downloadBtn = e.target.closest('.download-link');
            if (downloadBtn) {
                e.preventDefault();
                const url = downloadBtn.dataset.url;
                if (url && url !== '#' && url !== '') {
                    // URLがある場合は新しいタブで開く
                    window.open(url, '_blank');
                } else {
                    // URLがない場合はカスタムモーダルを表示 (ダウンロード情報なし)
                    this.showModal();
                }
            }
        });
        
        // モーダルを閉じるボタン
        const modalCloseBtn = document.getElementById('modal-close-btn');
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', () => this.hideModal());
        }
        
        // モーダルの背景クリックで閉じる
        const customModal = document.getElementById('custom-modal');
        if (customModal) {
             customModal.addEventListener('click', (e) => {
                // モーダル内のコンテンツ自体ではないことを確認
                if (e.target === customModal) {
                    this.hideModal();
                }
            });
        }
    },

    updateTagStyles() {
        // renderItemsでスタイルはほぼ設定されているが、ここではhoverの再適用などを行う
        document.querySelectorAll('.tag-filter').forEach(tagEl => {
            const tag = tagEl.dataset.tag;
            // 選択時と未選択時のクラスはrenderItemsで設定されているため、ここではホバーのみを扱う
            tagEl.classList.add('hover:bg-white/20');
        });
    },

    updateViewModeButtons() {
        const gridBtn = document.getElementById('view-grid');
        const listBtn = document.getElementById('view-list');
        if (gridBtn && listBtn) {
            // 選択時: 濃いグレーの背景、白い文字
            gridBtn.classList.toggle('bg-white/20', this.state.viewMode === 'grid');
            gridBtn.classList.toggle('text-white', this.state.viewMode === 'grid');
            
            // 未選択時: 薄いグレーの背景、薄い文字
            gridBtn.classList.toggle('bg-black/30', this.state.viewMode !== 'grid');
            gridBtn.classList.toggle('text-gray-400', this.state.viewMode !== 'grid');
            
            // 選択時: 濃いグレーの背景、白い文字
            listBtn.classList.toggle('bg-white/20', this.state.viewMode === 'list');
            listBtn.classList.toggle('text-white', this.state.viewMode === 'list');
            
            // 未選択時: 薄いグレーの背景、薄い文字
            listBtn.classList.toggle('bg-black/30', this.state.viewMode !== 'list');
            listBtn.classList.toggle('text-gray-400', this.state.viewMode !== 'list');
        }
    },

    updateTagModeButtons() {
        const orBtn = document.getElementById('tag-mode-or');
        const andBtn = document.getElementById('tag-mode-and');
        if (orBtn && andBtn) {
            // 選択時: 濃いグレーの背景、白い文字
            orBtn.classList.toggle('bg-white/20', this.state.tagMode === 'or');
            orBtn.classList.toggle('text-white', this.state.tagMode === 'or');
            
            // 未選択時: 薄いグレーの背景、薄い文字
            orBtn.classList.toggle('bg-black/30', this.state.tagMode !== 'or');
            orBtn.classList.toggle('text-gray-400', this.state.tagMode !== 'or');
            
            // 選択時: 濃いグレーの背景、白い文字
            andBtn.classList.toggle('bg-white/20', this.state.tagMode === 'and');
            andBtn.classList.toggle('text-white', this.state.tagMode === 'and');
            
            // 未選択時: 薄いグレーの背景、薄い文字
            andBtn.classList.toggle('bg-black/30', this.state.tagMode !== 'and');
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
            const lang = App.state.currentLang;
            const dict = App.i18n[lang];

            // ★ タグフィルタリストの生成はrenderItemsに移動。ここでは枠組みのみ
            // renderItems内で、this.getAllDisplayTags()を使用してタグが生成される

            return `
                ${App.templates.hero(title, subtitle)}
                <div class="flex flex-col md:flex-row gap-8">
                    <div class="w-full md:w-3/4">
                        <div class="glassmorphism p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-24 z-10">
                            <div class="relative w-full sm:w-auto flex-grow">
                                <input id="search-input" type="text" placeholder="${dict.common.search}" value="${App.state.filters.search}" class="w-full bg-black/30 border border-white/10 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all text-white">
                                <svg class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" /></svg>
                            </div>
                            <div class="flex items-center gap-2">
                                <button id="view-grid" class="p-2 rounded-lg transition-colors hover:bg-white/10 border border-white/10">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm4 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm1 3a1 1 0 100 2h4a1 1 0 100-2H8z" clip-rule="evenodd" /></svg>
                                </button>
                                <button id="view-list" class="p-2 rounded-lg transition-colors hover:bg-white/10 border border-white/10">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm2-1a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-1-1H5zM5 8a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm0 3a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h8a1 1 0 100-2H6z" clip-rule="evenodd" /></svg>
                                </button>
                            </div>
                            </div>
                        <div id="items-list" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            </div>
                        
                        <div class="mt-8 text-center">
                            <button id="reload-button" class="bg-white/10 text-gray-300 font-semibold py-2 px-6 rounded-lg border border-white/10 hover:bg-white/20 transition-colors flex items-center mx-auto">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                </svg>
                                ${dict.common.reload}
                            </button>
                        </div>

                    </div>
                    <div class="w-full md:w-1/4">
                        <div class="glassmorphism p-4 sticky top-[100px]">
                            <div class="flex justify-between items-center mb-3 border-b border-white/20 pb-2">
                                <h3 class="text-lg font-semibold text-white">${dict.common.tag_filter}</h3>
                                
                                <div class="flex items-center gap-1 text-sm rounded-lg bg-black/30 p-1 border border-white/10">
                                    <button id="tag-mode-or" class="py-1 px-3 rounded-md transition-colors hover:bg-white/10">OR</button>
                                    <button id="tag-mode-and" class="py-1 px-3 rounded-md transition-colors hover:bg-white/10">AND</button>
                                </div>
                            </div>

                            <div class="flex flex-wrap gap-2" id="tag-filters">
                                </div>
                        </div>
                    </div>
                </div>
            `;
        },
        // itemCardからアイコンと詳細情報なしのロジックを削除
        itemCard(item, viewMode) {
            // ★ getTranslatedTagsヘルパーを使用してタグを取得
            const translatedTags = App.getTranslatedTags(item);
            const tagsHtml = translatedTags
                .map(tag => `<span class="text-xs bg-gray-700/50 px-2 py-0.5 rounded-full text-gray-300">${tag}</span>`)
                .join('');
            
            const lang = App.state.currentLang;
            const dict = App.i18n[lang];

            // ★ 翻訳された名前と説明文を決定
            // item.name_en や item.description_en フィールドが存在することを期待します。
            const itemName = (lang === 'en' && item.name_en) ? item.name_en : item.name;
            const itemDescription = (lang === 'en' && item.description_en) ? item.description_en : item.description;

            const detailUrl = item.rel_link || '#'; 
            const downloadUrl = item.url || '#'; 

            if (viewMode === 'list') {
                return `
                    <div class="glassmorphism p-4 flex items-start space-x-4 hover:border-gray-500/50 transition-all border border-transparent">
                        <div class="flex-grow">
                            <h3 class="text-lg font-bold text-white mb-1">${itemName}</h3>
                            <p class="text-sm text-gray-300 line-clamp-2">${itemDescription || dict.common.no_description}</p>
                            <div class="flex flex-wrap gap-2 mt-2">
                                ${tagsHtml}
                            </div>
                        </div>
                        <div class="flex-shrink-0 self-center flex space-x-2">
                            <a href="${detailUrl}" data-url="${detailUrl}" class="detail-link bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm whitespace-nowrap border border-white/20">
                                ${dict.common.detail}
                            </a>
                            <a href="${downloadUrl}" data-url="${downloadUrl}" class="download-link bg-white hover:bg-gray-200 text-black font-semibold py-2 px-4 rounded-lg transition-colors text-sm whitespace-nowrap border border-white/20">
                                ${dict.common.download}
                            </a>
                        </div>
                    </div>
                `;
            }

            // Grid View
            return `
                <div class="glassmorphism p-6 flex flex-col hover:border-gray-500/50 transition-all border border-transparent">
                    <h3 class="text-xl font-bold text-white leading-tight mb-2">${itemName}</h3>
                    <p class="text-gray-300 mb-4 flex-grow line-clamp-3">${itemDescription || dict.common.no_description}</p>
                    <div class="flex flex-wrap gap-2 mb-4">
                        ${tagsHtml}
                    </div>
                    <div class="flex space-x-2 mt-auto">
                        <a href="${detailUrl}" data-url="${detailUrl}" class="detail-link flex-1 text-center bg-white/10 hover:bg-white/20 text-white font-semibold py-2 rounded-lg transition-colors border border-white/20">
                            ${dict.common.detail}
                        </a>
                        <a href="${downloadUrl}" data-url="${downloadUrl}" class="download-link flex-1 text-center bg-white hover:bg-gray-200 text-black font-semibold py-2 rounded-lg transition-colors border border-white/20">
                            ${dict.common.download}
                        </a>
                    </div>
                </div>
            `;
        },
        installPage() {
            const lang = App.state.currentLang;
            const dict = App.i18n[lang];

            return `
                ${App.templates.hero(dict.hero.install_title, dict.hero.install_subtitle)}\
                <div class="glassmorphism p-6 sm:p-10 max-w-4xl mx-auto">
                    <div class="markdown-body">
                        ${marked.parse(App.howToInstallMarkdown)}
                    </div>
                </div>
            `;
        },
        infoPage() {
            const lang = App.state.currentLang;
            const dict = App.i18n[lang];

            return `
                ${App.templates.hero(dict.hero.info_title, dict.hero.info_subtitle)}
                <div class="text-center max-w-2xl mx-auto">
                    <div class="glassmorphism p-8">
                        <p class="text-lg mb-6 info-page-text">
                            ${dict.footer.info_form_text}
                        </p>
                        <a href="${App.config.googleFormURL || 'https://forms.gle/XXXXXXXXXXXXXXXX'}" target="_blank" rel="noopener noreferrer" class="btn btn-primary inline-block text-white font-bold py-3 px-8 rounded-lg text-lg bg-white/10 hover:bg-white/20 transition-colors border border-white/20">
                            <span class="info-page-button">${dict.footer.info_form_button}</span>
                        </a>
                    </div>
                </div>
            `;
        },
        error(message) {
            const lang = App.state.currentLang;
            const dict = App.i18n[lang];

            return `
                <div class="text-center py-20">
                    <h2 class="text-2xl font-bold text-red-400">${dict.common.error_title}</h2>
                    <p class="mt-4 text-gray-300 font-mono bg-black/30 p-4 rounded-lg inline-block">${dict.common.error_prefix} ${message}</p>
                </div>
            `;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});