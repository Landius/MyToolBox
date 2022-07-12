let defaultConfig;
// set default config by locale
if (chrome.i18n.getMessage('@@ui_locale') === 'zh_CN') {
    defaultConfig = {
        NEWTAB: {
            HIDENAV: false,
            SITES: [{ GROUP: '默认', NAME: '谷歌', URL: 'https://www.google.com' }],
            STYLE: ''
        },
        SEARCH: {
            PREFIX: '搜索『%s』',
            ENGINES: [
                { GROUP: '网页', NAME: '谷歌', URL: 'https://www.google.com/search?newwindow=1&q=%s' },
                { GROUP: '网页', NAME: '百度', URL: 'https://www.baidu.com/s?ie=UTF-8&wd=%s' },
                { GROUP: '网页', NAME: '维基', URL: 'https://zh.wikipedia.org/wiki/%s' },
                { GROUP: '开发', NAME: 'MDN', URL: 'https://developer.mozilla.org/zh-CN/search?q=%s' },
                { GROUP: '开发', NAME: 'Github', URL: 'https://github.com/search?q=%s' },
                { GROUP: '视频', NAME: '优酷', URL: 'http://www.soku.com/search_vNAMEeo/q_%s' },
                { GROUP: '视频', NAME: 'BiliBili', URL: 'http://search.bilibili.com/all?keyword=%s' },
                { GROUP: '视频', NAME: 'YouTube', URL: 'https://www.youtube.com/results?search_query=%s' },
                { GROUP: '购物', NAME: '淘宝', URL: 'https://s.taobao.com/search?q=%s' },
                { GROUP: '购物', NAME: '京东', URL: 'https://search.jd.com/Search?keyword=%s' },
                { GROUP: '购物', NAME: '什么值得买', URL: 'http://search.smzdm.com/?s=%s' }
            ]
        }
    };
} else {
    defaultConfig = {
        NEWTAB: {
            HIDENAV: false,
            SITES: [{ GROUP: 'default', NAME: 'google', URL: 'https://www.google.com' }],
            STYLE: ''
        },
        SEARCH: {
            PREFIX: 'Search『%s』',
            ENGINES: [
                { GROUP: 'Search', NAME: 'Google', URL: 'https://www.google.com/search?newwindow=1&q=%s' },
                { GROUP: 'Search', NAME: 'Wikipedia', URL: 'https://zh.wikipedia.org/wiki/%s' },
                { GROUP: 'Dev', NAME: 'MDN', URL: 'https://developer.mozilla.org/zh-CN/search?q=%s' },
                { GROUP: 'Dev', NAME: 'Github', URL: 'https://github.com/search?q=%s' },
                { GROUP: 'Dev', NAME: 'StackOverFlow', URL: 'https://stackoverflow.com/search?q=%s' },
                { GROUP: 'Video', NAME: 'YouTube', URL: 'https://www.youtube.com/results?search_query=%s' },
                { GROUP: 'Video', NAME: 'Vimeo', URL: 'https://vimeo.com/search?q=%s' }
            ]
        }
    };
}

// create toobar icon context menu
chrome.contextMenus.create({
    title: chrome.i18n.getMessage('option'),
    id: 'mytoolbox_cfg',
    contexts: ['browser_action'],
    onclick: openOptionsPage
});

function object2Data(object) {
    let data = {};
    const objectStr = JSON.stringify(obj);
    // Maximum item size is 8192 bytes, in utf-8 coding, each character takes 1 or 3 bytes
    const chunkSize = 8192 / 4;
    let i = 0;
    while (i * chunkSize < objectStr.length) {
        data[i] = objectStr.substring(i * chunkSize, (i + 1) * chunkSize);
        i++;
    }
    // add mark to the end of data
    data[i] = 'E.O.D';
    return data;
}

function data2Object(data) {
    let objectStr = '';
    for (let i = 0; data[i] !== 'E.O.D'; i++) {
        objectStr += data[i];
    }
    return JSON.parse(objectStr);
}

function createCM(config) {
    // create context menu
    var root = chrome.contextMenus.create({
        // note that %s in title will be replaced to selected text.
        title: config.SEARCH.PREFIX,
        id: 'searchBy',
        contexts: ['selection']
    });

    var engines = [];
    var extraEngines = [];
    for (var item of config.SEARCH.ENGINES) {
        if (item.GROUP.startsWith('*')) {
            extraEngines.push(item);
        } else {
            engines.push(item);
        }
    }

    var i = 0;

    // engines
    var groups = [];
    engines.forEach(engine => {
        const groupId = engine.GROUP;
        if (groups.includes(groupId) === false) {
            chrome.contextMenus.create({
                title: groupId,
                id: groupId,
                contexts: ['selection'],
                parentId: root
            });
            groups.push(groupId);
        }
        chrome.contextMenus.create({
            title: engine.NAME,
            id: i.toString(),
            contexts: ['selection'],
            parentId: groupId,
            onclick: search
        });
        i += 1;
    });

    // extra engines
    var extra = chrome.contextMenus.create({
        title: '...',
        id: 'extra_search',
        contexts: ['selection'],
        parentId: root
    });
    var extraGroups = [];
    extraEngines.forEach(engine => {
        const groupId = engine.GROUP;
        if (extraGroups.includes(groupId) === false) {
            chrome.contextMenus.create({
                title: groupId.replace('*', ''),
                id: groupId,
                contexts: ['selection'],
                parentId: extra
            });
            extraGroups.push(groupId);
        }
        chrome.contextMenus.create({
            title: engine.NAME,
            id: i.toString(),
            contexts: ['selection'],
            parentId: groupId,
            onclick: search
        });
        i += 1;
    });
}

function openOptionsPage() {
    const OptionPageUrl = './options.html';
    chrome.tabs.create({ url: OptionPageUrl, active: true });
}

function search(info, tab) {
    const search = cachedConfig.SEARCH.ENGINES[info.menuItemId];
    const url = search.URL.replace('%s', encodeURIComponent(info.selectionText));
    chrome.tabs.create({ url: url, index: tab.index + 1, active: true });
}

function init() {
    window.cachedConfig = null;
    const storage = chrome.storage.sync;
    storage.get(null, function (data) {
        if (data[0]) {
            // data isn't empty
            cachedConfig = data2Object(data);
        } else {
            cachedConfig = defaultConfig;
        }
        createCM(cachedConfig);
    });

    // add event listener
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        switch (request.cmd) {
            case 'get_emoji':
                sendResponse(emoji[Math.floor(Math.random() * emoji.length)]);
                break;
            case 'get_config':
                sendResponse(cachedConfig);
                break;
            case 'save_config':
                cachedConfig = request.config;
                chrome.contextMenus.removeAll();
                createCM(cachedConfig);
                storage.set(config2Data(request.config), sendResponse);
                break;
            case 'reset_config':
                cachedConfig = defaultConfig;
                storage.clear(sendResponse);
                break;
            case 'open_link':
                chrome.tabs.update(sender.tab.id, { url: request.url });
            default:
            // console.log(request, sender, sendResponse);
        }
    });
    // recreate context menu when storage change
    chrome.storage.onChanged.addListener(function (changes, areaName) {
        chrome.contextMenus.removeAll();
        storage.get(null, function (data) {
            if (data[0]) {
                // data isn't empty
                cachedConfig = data2Config(data);
            } else {
                cachedConfig = defaultConfig;
            }
            createCM(cachedConfig);
        });
    });
}

init();
