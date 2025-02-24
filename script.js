let articles = [];
let currentPage = 1;
const articlesPerPage = 15;
let currentFilter = null;
let currentFilterType = null;
let currentFilterValue = null;

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const tag = urlParams.get('tag');

    if (tag) {
        currentFilterType = 'tag';
        currentFilterValue = tag;
    }

    // 從 JSON 文件加載文章元數據
    fetch('content.json')
        .then(response => response.json())
        .then(data => {
            // console.log(data)
            articles = data.documents.items || [];
            document.getElementById('title').textContent = data.hero.title;
            document.getElementById('headtitle').textContent = data.siteTitle;
            //document.getElementById("adLink").href = data.ad1.link;
            //document.getElementById("adImg").src = data.ad1.image;
            //document.getElementById("adLink2").href = data.ad2.link;
            //document.getElementById("adImg2").src = data.ad2.image;

            createStickyImage(data.ad1, 'stickyImage', 'stickyImageContainer');
            createStickyImage(data.ad2, 'stickyImage2', 'stickyImageContainer');
            createStickyImage(data.ad1, 'stickyImage2', 'stickyImageContainer2');
            createStickyImage(data.ad2, 'stickyImage22', 'stickyImageContainer2');
            createAd3(data.ad3);
            createTagCloud('tagCloud', 'stickyImageContainer');
            createTagCloud('tagCloud2', 'stickyImageContainer2');

            document.documentElement.style.setProperty('--primary-color', data.color1);
            document.documentElement.style.setProperty('--secondary-color', data.color2);
            document.documentElement.style.setProperty('--text-color', data.color3);
            document.documentElement.style.setProperty('--background-color', data.color4);
            document.documentElement.style.setProperty('--accent-color', data.color5);
            if (tag) {
                filterArticles('tag', tag);
            } else {
                displayArticles(currentPage);
            }
            updatePagination();
            populateSidebar();
            updateFilterStatus();
        })
        .catch(error => console.error('Error loading articles:', error));
});

function createTagCloud(id, div) {
    const tagCloudContainer = document.createElement('div');
    tagCloudContainer.id = id;
    tagCloudContainer.className = 'bg-orange-300 p-4 rounded-lg shadow-md';
    tagCloudContainer.style.width = '100%';

    const tagCloudSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    tagCloudSvg.style.width = '100%';
    tagCloudSvg.style.height = 'auto';
    tagCloudSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    tagCloudContainer.appendChild(tagCloudSvg);

    const sidebar = document.getElementById(div);
    sidebar.insertBefore(tagCloudContainer, sidebar.firstChild);
    const baseWidth = 400; // 基準寬度
    const baseHeight = 300; // 基準高度
    tagCloudSvg.setAttribute('viewBox', `0 0 ${baseWidth} ${baseHeight}`);

    // 計算標籤頻率
    const tagCounts = {};
    articles.forEach(article => {
        article.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });

    const filter = [/SEO/i, /.*癌症.*/, /.*治療.*/, /.*醫學/, /醫藥/, /.*癌/];

    // 準備數據
    const words = Object.keys(tagCounts)
        .filter(tag => !filter.some(pattern => pattern.test(tag)))
        .map(tag => ({
        text: tag,
        size: Math.max(12, Math.min(40, 12 + tagCounts[tag] * 3))
    }));

    // 創建雲佈局
    d3.layout.cloud()
        .size([baseWidth, baseHeight])
        .words(words)
        .padding(5)
        .rotate(() => 0)
        .font("Arial")
        .fontSize(d => d.size)
        .spiral("archimedean")  // 使用阿基米德螺旋可能會有更好的分佈
        .on("end", draw)
        .start();

    function draw(words) {
        const color = d3.scaleOrdinal(d3.schemeCategory10);

        const cloud = d3.select(tagCloudSvg)
            .attr("viewBox", `0 0 ${baseWidth} ${baseHeight}`)
            .append("g")
            .attr("transform", `translate(${baseWidth/2},${baseHeight/2})`)
            .selectAll("text")
            .data(words)
            .enter().append("text")
            .style("font-size", d => `${d.size}px`)
            .style("font-family", "Arial, sans-serif")
            .style("font-weight", "bold")
            .style("cursor", "pointer")
            .style("fill", (d, i) => color(i))
            .style("cursor", "pointer")
            .attr("text-anchor", "middle")
            .attr("transform", d => `translate(${d.x},${d.y})`)
            .text(d => d.text)
            .on("click", (event, d) => filterArticles('tag', d.text));

        function resizeCloud() {
            const containerWidth = tagCloudContainer.clientWidth;
            const containerHeight = containerWidth * (baseHeight / baseWidth);

            // 計算縮放因子，但限制最小值和最大值
            //const scaleFactor = Math.min(Math.max(containerWidth / baseWidth, 0.5), 1.5);
            const scaleFactor = containerWidth / baseWidth;

            // 更新 SVG 大小
            tagCloudSvg.style.width = `${containerWidth}px`;
            tagCloudSvg.style.height = `${containerHeight}px`;
            tagCloudSvg.setAttribute("viewBox", `0 0 ${containerWidth} ${containerHeight}`)

            // 更新字體大小和位置，設置最小和最大字體大小
            /*alert(containerWidth)
            alert(scaleFactor)
            alert(containerHeight)
            alert(baseHeight)*/
            //cloud.style("font-size", d => `${Math.min(Math.max(d.size * scaleFactor, 10), 40)}px`)
            cloud.style("font-size", d => `${d.size * scaleFactor}px`)
                .attr("transform", d => `translate(${d.x * scaleFactor},${d.y * scaleFactor})`);

            // 更新整個雲的位置，確保居中
            d3.select(tagCloudSvg.querySelector('g'))
                .attr("transform", `translate(${containerWidth/2},${containerHeight/2})`);
        }

        // 添加視窗大小改變事件監聽器
        window.addEventListener('resize', resizeCloud);

        // 初始調用一次以設置正確的大小
        resizeCloud();
    }
}


function createStickyImage(adData, id, div) {
    if (adData.image && adData.image !== "") {
        const stickyImageContainer = document.getElementById(div);
        const stickyImageDiv = document.createElement('div');
        stickyImageDiv.id = id;
        stickyImageDiv.innerHTML = `
            <a href="${adData.link}" id="${id}Link" target="_blank">
                <img src="${adData.image}" id="${id}Img" alt="${adData.content}">
            </a>
        `;
        stickyImageContainer.appendChild(stickyImageDiv);
    }
}

function createAd3(adData) {
    if (adData.image && adData.image !== "") {
        const ad3Container = document.getElementById('ad3Container');
        ad3Container.removeAttribute("hidden")
        ad3Container.innerHTML = `
            <div id="ad3">
                <a href="${adData.link}" id="adLink3" target="_blank">
                    <img src="${adData.image}" id="adImg3" alt="${adData.content}">
                </a>
            </div>
        `;
    }
}

document.getElementById('homePage').addEventListener('click', function(e) {
    e.preventDefault();
    resetToHomePage();
});

function resetToHomePage() {
    currentPage = 1;
    currentFilter = null;
    currentFilterType = null;
    currentFilterValue = null;
    displayArticles(currentPage);
    updatePagination();
    updateFilterStatus();
    scrollToTop();
}

function displayArticles(page) {
    const articleContainer = document.getElementById('articles');
    articleContainer.innerHTML = '';

    const displayedArticles = currentFilter ? currentFilter : articles;

    if (displayedArticles.length === 0) {
        const noArticlesElement = document.createElement('div');
        noArticlesElement.textContent = "目前沒有文章";
        noArticlesElement.className = "no-articles"
        articleContainer.appendChild(noArticlesElement);
    } else {
        const start = (page - 1) * articlesPerPage;
        const end = start + articlesPerPage;

        for (let i = start; i < end && i < displayedArticles.length; i++) {
            const article = displayedArticles[i];
            const articleElement = document.createElement('a');
            articleElement.className = 'article';
            articleElement.href = `./documents/${article.no}.html`;
            articleElement.innerHTML = `
                <h2>${article.titles}</h2>
                <div class="article-meta">
                    日期: ${article.date} | 標籤: ${article.tags.join(', ')}
                </div>
            `;
            articleContainer.appendChild(articleElement);
        }
    }
    window.scrollTo(0, 0);
}

function updatePagination() {
    const totalArticles = currentFilter ? currentFilter.length : articles.length;
    const totalPages = Math.max(1, Math.ceil(totalArticles / articlesPerPage)); // 確保至少有1頁
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage >= totalPages;

    // 更新當前頁碼顯示
    document.getElementById('currentPage').textContent = `第 ${currentPage} 頁,共 ${totalPages} 頁`;
}

document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        displayArticles(currentPage);
        updatePagination();
    }
});

document.getElementById('nextPage').addEventListener('click', () => {
    const totalArticles = currentFilter ? currentFilter.length : articles.length;
    const totalPages = Math.ceil(totalArticles / articlesPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayArticles(currentPage);
        updatePagination();
    }
});

function populateSidebar() {
    const dateArchive = document.getElementById('dateArchive');
    const tagList = document.getElementById('tagList');
    const dates = new Set();
    const tags = new Set();

    articles.forEach(article => {
        const date = article.date.substring(0, 7); // 取得年/月
        dates.add(date);
        article.tags.forEach(tag => tags.add(tag));
    });

    dates.forEach(date => {
        const li = document.createElement('li');
        li.textContent = date;
        li.addEventListener('click', () => filterArticles('date', date));
        dateArchive.appendChild(li);
    });

    tags.forEach(tag => {
        const li = document.createElement('li');
        li.textContent = tag;
        li.addEventListener('click', () => filterArticles('tag', tag));
        tagList.appendChild(li);
    });
}

function filterArticles(type, value) {
    currentFilter = articles.filter(article => {
        if (type === 'date') {
            return article.date.startsWith(value);
        } else if (type === 'tag') {
            return article.tags.includes(value);
        }
    });

    currentFilterType = type;
    currentFilterValue = value;
    currentPage = 1;
    displayArticles(currentPage);
    updatePagination();
    updateFilterStatus();
}

function clearFilter() {
    currentFilter = null;
    currentFilterType = null;
    currentFilterValue = null;
    currentPage = 1;
    displayArticles(currentPage);
    updatePagination();
    updateFilterStatus();
    resetToHomePage();

    const currentUrl = new URL(window.location.href);
    currentUrl.search = '';
    window.history.pushState({}, '', currentUrl.toString());
}

function updateFilterStatus() {
    const filterStatus = document.getElementById('filterStatus');
    if (currentFilter) {
        let statusText = currentFilterType === 'date' ? '日期篩選: ' : '標籤篩選: ';
        statusText += currentFilterValue;
        filterStatus.innerHTML = `
            ${statusText} 
            <button onclick="clearFilter()">清除篩選</button>
        `;
    } else {
        filterStatus.innerHTML = '顯示所有文章';
    }
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

document.getElementById('backToTop').addEventListener('click', function(e) {
    e.preventDefault();
    scrollToTop();
});

function adjustSidebarHeight() {
    const sidebar = document.getElementById('sidebar');
    const sidebarContent = document.getElementById('sidebarContent');
    const stickyImageContainer = document.getElementById('stickyImageContainer');

    const availableHeight = sidebar.offsetHeight;
    const imageHeight = stickyImageContainer.offsetHeight;

    //sidebarContent.style.maxHeight = `${availableHeight - imageHeight}px`;
}

window.addEventListener('load', adjustSidebarHeight);
window.addEventListener('resize', adjustSidebarHeight);

document.addEventListener('click', (event) =>{ 
    const anchor = event.target.closest('a')
    if (anchor){
        event.preventDefault();
        console.log('detect_click\n');
        console.log(anchor.href);
        fetch('https://383a-104-199-172-31.ngrok-free.app/track_url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: anchor.href })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Fetch error:', error)
        })
        .finally(() => {
            window.open(anchor.href, '_blank'); // Navigate after tracking
        });
    }
});

async function translatePage() {
    const userLang = navigator.language || navigator.userLanguage;
    const targetLang = 'us';

    // Helper function to get a content hash for detecting changes
    const getContentHash = () => {
        const content = document.body.innerText;
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash;
    };

    // Function to check if content is stable
    const isContentStable = async () => {
        const initialHash = getContentHash();
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
        const finalHash = getContentHash();
        return initialHash === finalHash;
    };

    // Function to safely get class names as a string
    const getClassNames = (element) => {
        if (element.className && typeof element.className === 'string') {
            return element.className;
        }
        if (element.className && element.className.baseVal) {
            return element.className.baseVal;
        }
        return element.getAttribute('class') || '';
    };

    // Function to check if an element is likely to be dynamically updated
    const isDynamicContent = (node) => {
        const parent = node instanceof Text ? node.parentElement : node;
        if (!parent) return false;

        // Check for common dynamic content indicators
        const hasDataAttributes = Array.from(parent.attributes || []).some(attr => 
            attr.name.startsWith('data-') && 
            !attr.name.includes('translated')
        );
        
        const classNames = getClassNames(parent).toLowerCase();
        const hasLoadingClass = classNames.includes('loading');
        const isPlaceholder = parent.getAttribute('aria-busy') === 'true' ||
                            classNames.includes('placeholder');
        
        return hasDataAttributes || hasLoadingClass || isPlaceholder;
    };

    // Helper function to process text
    const processText = (text) => {
        if (typeof text !== 'string') return '';
        return text.trim()
            .replace(/\s+/g, ' ')
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"');
    };

    // Wait for content to stabilize
    const maxAttempts = 5;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        const stable = await isContentStable();
        if (stable) break;
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
    }

    // Collect text nodes
    const textMapping = new Map();
    
    try {
        // Use TreeWalker for text nodes
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    if (!node || !node.parentNode) return NodeFilter.FILTER_REJECT;
                    
                    const parent = node.parentNode;
                    if (parent.closest('[data-translated="true"]') ||
                        parent.tagName === 'SCRIPT' ||
                        parent.tagName === 'STYLE' ||
                        isDynamicContent(node)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        let node;
        while ((node = walker.nextNode())) {
            const text = processText(node.textContent);
            if (text) {
                textMapping.set(node, text);
            }
        }

        // Collect from specific elements
        document.querySelectorAll("h1, h2, h3, p, button, input[type='text'], textarea").forEach(el => {
            if (!el.closest('[data-translated="true"]') && !isDynamicContent(el)) {
                const text = processText(el.innerText || el.placeholder || '');
                if (text) {
                    textMapping.set(el, text);
                }
            }
        });

        if (textMapping.size === 0) return;

        const textContents = Array.from(textMapping.values());
        
        const res = await fetch("https://383a-104-199-172-31.ngrok-free.app/translate", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            mode: "cors",
            body: JSON.stringify({
                q: textContents,
                source: userLang,
                target: targetLang
            })
        });

        if (!res.ok) {
            throw new Error(`API Error (${res.status}): ${await res.text()}`);
        }

        const data = await res.json();
        
        if (!data.translatedText || typeof data.translatedText !== 'string') {
            throw new Error('Invalid API response format');
        }

        // Parse the translation response
        let translatedTexts;
        try {
            translatedTexts = JSON.parse(data.translatedText);
        } catch (e) {
            // If parsing fails, try to clean the response
            const cleaned = data.translatedText
                .replace(/^\[?|\]?$/g, '')
                .split(',')
                .map(item => `"${item.trim().replace(/^["']|["']$/g, '').replace(/"/g, '\\"')}"`)
                .join(',');
            translatedTexts = JSON.parse(`[${cleaned}]`);
        }

        if (!Array.isArray(translatedTexts)) {
            throw new Error('Translation result is not an array');
        }

        // Apply translations
        let i = 0;
        for (const [node, originalText] of textMapping.entries()) {
            // Skip if the node has been dynamically updated
            if (isDynamicContent(node)) continue;

            const translation = translatedTexts[i++] || originalText;
            
            try {
                if (node instanceof Text) {
                    node.textContent = translation;
                } else if (node instanceof HTMLElement) {
                    if (node.hasAttribute('placeholder')) {
                        node.placeholder = translation;
                    } else {
                        node.innerText = translation;
                    }
                }
                
                const parentElement = node instanceof Text ? node.parentElement : node;
                if (parentElement) {
                    parentElement.setAttribute('data-translated', 'true');
                }
            } catch (e) {
                console.error(`Error applying translation for: ${originalText}`, e);
            }
        }

        console.log("Translation completed successfully!");
    } catch (error) {
        console.error("Translation error:", error);
    }
}

// Improved debounce with content stability check
const debounce = (fn, delay) => {
    let timeoutId;
    let lastRun = 0;
    const minInterval = 2000; // Minimum time between runs

    return (...args) => {
        clearTimeout(timeoutId);
        
        const now = Date.now();
        if (now - lastRun < minInterval) {
            timeoutId = setTimeout(() => {
                lastRun = Date.now();
                fn(...args);
            }, delay);
        } else {
            lastRun = now;
            fn(...args);
        }
    };
};

const debouncedTranslate = debounce(translatePage, 1000);

// Enhanced MutationObserver with stability check
const observer = new MutationObserver((mutations) => {
    const significantChanges = mutations.some(mutation => {
        // Ignore changes to translated elements
        if (mutation.target.hasAttribute('data-translated')) return false;
        
        // Ignore style/class changes
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'style' || 
             mutation.attributeName === 'class')) return false;

        return true;
    });
    
    if (significantChanges) {
        console.log("Significant content changes detected, waiting for stability...");
        debouncedTranslate();
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true
});

// Initialize translation with a delay
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(translatePage, 1500); // Wait 1.5s after DOM content loaded
    });
} else {
    setTimeout(translatePage, 1500);
}