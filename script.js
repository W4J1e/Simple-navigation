// DOM元素
const appBody = document.getElementById('app-body');
const themeToggle = document.getElementById('theme-toggle');
const categoryTabs = document.getElementById('category-tabs');
const linksGrid = document.getElementById('links-grid');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchEngineToggle = document.getElementById('search-engine-toggle');
const currentSearchEngine = document.getElementById('current-search-engine');

// 初始状态
let darkMode = true;
let currentSearch = 'bing';
let links = [
    { name: 'GitHub', url: 'https://github.com', icon: 'fab fa-github', category: '开发'},
    { name: '微博', url: 'https://weibo.com', icon: 'fab fa-weibo', category: '社交'},
    { name: '知乎', url: 'https://zhihu.com', icon: 'fab fa-zhihu', category: '社交'},
    { name: '多吉云', url: 'https://www.dogecloud.com/?iuid=2384', icon: 'fa fa-cloud', category: '开发'},
    { name: '联合早报', url: 'https://www.zaobao.com', icon: 'fas fa-newspaper', category: '新闻'},
    { name: '腾讯云', url: 'https://cloud.tencent.com/act/cps/redirect?redirect=11529&cps_key=d921b4e5fecc726bd40354300d05f538', iconUrl: 'https://cloud.tencent.com/favicon.ico', category: '开发'},
    { name: '哔哩哔哩', url: 'https://bilibili.com', iconUrl: 'https://www.bilibili.com/favicon.ico', category: '娱乐' },
    { name: '可画', url: 'https://www.canva.cn/', iconUrl: 'https://static.canva.cn/static/images/favicon.ico', category: '娱乐' },  
    { name: '程序员工具箱', url: 'https://tool.lu/', iconUrl: 'https://tool.lu/favicon.ico', category: '开发'},   
    { name: 'LonelyGod', url: 'https://hin.cool', iconUrl: 'https://hin.cool/favicon.ico', category: '开发'}       
];

// 初始化
function init() {
    // 加载保存的设置
    loadSettings();
    
    // 初始化事件监听
    initEventListeners();
    
    // 初始化分类标签
    initCategoryTabs();
    
    // 渲染链接网格
    renderLinksGrid();
}

// 初始化事件监听
function initEventListeners() {
    // 主题切换
    themeToggle.addEventListener('click', toggleTheme);
    
    // 分类标签点击
    categoryTabs.addEventListener('click', handleCategoryTabClick);
    
    // 搜索功能
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // 搜索引擎切换
    searchEngineToggle.addEventListener('click', toggleSearchEngine);
}

// 切换主题
function toggleTheme() {
    darkMode = !darkMode;
    themeToggle.innerHTML = darkMode ? '<i class="fa fa-moon-o"></i>' : '<i class="fa fa-sun-o"></i>';
    
    if (darkMode) {
        appBody.classList.add('bg-dark');
        appBody.classList.remove('bg-light');
    } else {
        appBody.classList.add('bg-light');
        appBody.classList.remove('bg-dark');
    }
    
    // 保存主题设置
    localStorage.setItem('darkMode', darkMode);
}

// 初始化分类标签
function initCategoryTabs() {
    // 获取所有分类
    const categories = ['all'];
    links.forEach(link => {
        if (!categories.includes(link.category)) {
            categories.push(link.category);
        }
    });
    
    // 清空现有标签
    categoryTabs.innerHTML = '';
    
    // 添加新标签
    categories.forEach(category => {
        const tab = document.createElement('button');
        tab.className = `category-tab bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full whitespace-nowrap transition-all`;
        if (category === 'all') {
            tab.classList.add('bg-primary');
        }
        tab.dataset.category = category;
        tab.textContent = category === 'all' ? '全部' : category;
        categoryTabs.appendChild(tab);
    });
}

// 处理分类标签点击
function handleCategoryTabClick(e) {
    if (e.target.classList.contains('category-tab')) {
        // 移除所有标签的活跃状态
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.remove('bg-primary');
            tab.classList.add('bg-white/10');
        });
        
        // 添加当前标签的活跃状态
        e.target.classList.remove('bg-white/10');
        e.target.classList.add('bg-primary');
        
        // 过滤链接
        const category = e.target.dataset.category;
        renderLinksGrid(category);
    }
}

// 渲染链接网格
function renderLinksGrid(filterCategory = 'all') {
    linksGrid.innerHTML = '';
    
    let filteredLinks = links;
    if (filterCategory !== 'all') {
        filteredLinks = links.filter(link => link.category === filterCategory);
    }
    
    if (filteredLinks.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'col-span-full text-center text-white/80 py-12';
        emptyState.innerHTML = `
            <div class="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                <i class="fa fa-folder-open-o text-2xl"></i>
            </div>
            <h3 class="font-medium text-xl">暂无链接</h3>
        `;
        linksGrid.appendChild(emptyState);
        return;
    }
    
    filteredLinks.forEach(link => {
        const linkCard = document.createElement('div');
        linkCard.className = 'link-card bg-white/10 backdrop-blur-md rounded-xl p-5 text-white text-center hover:bg-white/20 transition-all duration-300 scale-hover group card-shadow cursor-pointer';
        
        let iconHtml;
        if (link.useFavicon) {
            try {
                const url = new URL(link.url);
                iconHtml = `<img src="https://${url.hostname}/favicon.ico" alt="${link.name}图标" class="w-8 h-8 object-contain">`;
            } catch (e) {
                iconHtml = `<i class="fa ${link.icon || 'fa-link'} text-2xl"></i>`;
            }
        } else {
                            if (link.iconUrl) {
                                iconHtml = `<img src="${link.iconUrl}" class="w-full h-full p-2 object-contain" alt="icon">`;
                            } else {
                                iconHtml = `<i class="${link.icon || 'fa fa-link'} text-4xl"></i>`;
                            }
        }
        
        linkCard.innerHTML = `
            <div class="w-20 h-20 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center group-hover:bg-primary/30 transition-all">
                ${iconHtml}
            </div>
            <h3 class="font-medium truncate">${link.name}</h3>
            <p class="text-xs text-white/60 mt-1 truncate">${new URL(link.url).hostname.replace('www.', '')}</p>
        `;
        
        // 添加点击事件
        linkCard.addEventListener('click', () => {
            window.open(link.url, '_blank');
        });
        
        linksGrid.appendChild(linkCard);
    });
}

// 加载保存的设置
function loadSettings() {
    // 加载主题设置
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
        darkMode = savedDarkMode === 'true';
        if (darkMode) {
            appBody.classList.add('bg-dark');
            appBody.classList.remove('bg-light');
            themeToggle.innerHTML = '<i class="fa fa-moon-o"></i>';
        } else {
            appBody.classList.add('bg-light');
            appBody.classList.remove('bg-dark');
            themeToggle.innerHTML = '<i class="fa fa-sun-o"></i>';
        }
    }
    
    // 加载搜索引擎设置
    const savedSearchEngine = localStorage.getItem('searchEngine');
    if (savedSearchEngine) {
        currentSearch = savedSearchEngine;
        updateSearchEngineUI();
    }
}

// 执行搜索
function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;
    
    let searchUrl;
    if (currentSearch === 'bing') {
        searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
    } else {
        searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }
    
    window.open(searchUrl, '_blank');
}

// 切换搜索引擎
function toggleSearchEngine() {
    currentSearch = currentSearch === 'bing' ? 'google' : 'bing';
    updateSearchEngineUI();
    localStorage.setItem('searchEngine', currentSearch);
}

// 更新搜索引擎UI
function updateSearchEngineUI() {
    currentSearchEngine.textContent = currentSearch === 'bing' ? '必应' : '谷歌';
    const icon = document.getElementById('search-engine-icon');
    icon.className = currentSearch === 'bing' ? 'fa fa-bing text-xl' : 'fa fa-google text-xl';
}

// 确保DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', init);