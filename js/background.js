function config2Data(config) {
    var data = {};
    var configStr = JSON.stringify(config);
    // chrome.storage.sync.QUOTA_BYTES_PER_ITEM is not defined in firefox, thus use static value instead
    var chunkSize = 8192 - 1024;
    for(var i = 0; i*chunkSize < configStr.length; i++) {
        data[i] = configStr.substring(i*chunkSize, (i+1)*chunkSize);
    }
    return data;
}

function data2Config(data) {
    var configStr = '';
    for(var key in data){
        configStr += data[key];
    }
    return JSON.parse(configStr);
}

function createCM(config) {
    // create toobar icon context menu
    chrome.contextMenus.create({
        'title': chrome.i18n.getMessage('option'),
        'id': 'mytoolbox_cfg',
        'contexts': ['browser_action'],
        'onclick': openOptionsPage
    });
    // create context menu
    var root = chrome.contextMenus.create({
        // note that %s in title will be replaced to selected text.
        'title' : config.SEARCH.PREFIX,
        'id' : 'searchBy',
        'contexts' :['selection']
    });

    var groups = [];
    for (var i in config.SEARCH.ENGINES) {
        var group = config.SEARCH.ENGINES[i].GROUP;
        var parentId;
        if (group == '') {
            parentId = root;
        } else if (groups.includes(group)) {
            parentId = group;
        } else {
            parentId = chrome.contextMenus.create({
                'title' : group,
                'id' : group,
                'contexts' : ['selection'],
                'parentId' : root
            });
            groups.push(group);
        }  
        chrome.contextMenus.create({
            'title' : config.SEARCH.ENGINES[i].NAME,
            'id' : i.toString(),
            'contexts' :['selection'],
            'parentId' : parentId,
            'onclick' : search
        });
    }
}

function openOptionsPage(){
    var OptionPageUrl = './options.html';
    chrome.tabs.create({'url': OptionPageUrl, 'active': true});
}

function search(info, tab) {
    var search = cachedConfig.SEARCH.ENGINES[info.menuItemId];
    var url = search.URL.replace('%s', encodeURIComponent(info.selectionText));
    chrome.tabs.create({'url': url, 'index': tab.index+1, 'active': true});
}

function init() {
    var defaultConfig;
    // set default config by locale
    if(chrome.i18n.getMessage('@@ui_locale') === 'zh_CN'){
        defaultConfig = {
            'NEWTAB': {
                'HIDENAV': false,
                'SITES': [
                    {'GROUP':'默认','NAME':'谷歌','URL':'https://www.google.com'}
                ],
                'STYLE': ''
            },
            'SEARCH': {
                'PREFIX':'搜索『%s』',
                'ENGINES':[
                    {'GROUP':'网页','NAME':'谷歌','URL':'https://www.google.com/search?newwindow=1&q=%s'},
                    {'GROUP':'网页','NAME':'百度','URL':'https://www.baidu.com/s?ie=UTF-8&wd=%s'},
                    {'GROUP':'网页','NAME':'维基','URL':'https://zh.wikipedia.org/wiki/%s'},
                    {'GROUP':'开发','NAME':'MDN','URL':'https://developer.mozilla.org/zh-CN/search?q=%s'},
                    {'GROUP':'开发','NAME':'Github','URL':'https://github.com/search?q=%s'},
                    {'GROUP':'视频','NAME':'优酷','URL':'http://www.soku.com/search_vNAMEeo/q_%s'},
                    {'GROUP':'视频','NAME':'BiliBili','URL':'http://search.bilibili.com/all?keyword=%s'},
                    {'GROUP':'视频','NAME':'YouTube','URL':'https://www.youtube.com/results?search_query=%s'},
                    {'GROUP':'购物','NAME':'淘宝','URL':'https://s.taobao.com/search?q=%s'},
                    {'GROUP':'购物','NAME':'京东','URL':'https://search.jd.com/Search?keyword=%s'},
                    {'GROUP':'购物','NAME':'什么值得买','URL':'http://search.smzdm.com/?s=%s'}
                ]
            }
        };
    }else{
        defaultConfig = {
            'NEWTAB': {
                'HIDENAV': false,
                'SITES': [
                    {'GROUP':'default','NAME':'google','URL':'https://www.google.com'}
                ],
                'STYLE': ''
            },
            'SEARCH': {
                'PREFIX':'Search『%s』',
                'ENGINES':[
                    {'GROUP':'Search','NAME':'Google','URL':'https://www.google.com/search?newwindow=1&q=%s'},
                    {'GROUP':'Search','NAME':'Wikipedia','URL':'https://zh.wikipedia.org/wiki/%s'},
                    {'GROUP':'Dev','NAME':'MDN','URL':'https://developer.mozilla.org/zh-CN/search?q=%s'},
                    {'GROUP':'Dev','NAME':'Github','URL':'https://github.com/search?q=%s'},
                    {'GROUP':'Dev','NAME':'StackOverFlow','URL':'https://stackoverflow.com/search?q=%s'},
                    {'GROUP':'Video','NAME':'YouTube','URL':'https://www.youtube.com/results?search_query=%s'},
                    {'GROUP':'Video','NAME':'Vimeo','URL':'https://vimeo.com/search?q=%s'},
                ]
            }
        };
    }
    // add some emoji
    var emoji = [
        '(>_<)',
        '⊙▂⊙',
        'w(ﾟДﾟ)w',
        'ヾ(๑╹◡╹)ﾉ〃♡',
        '´◔ ‸◔`',
        'ヽ(･∀･)メ',
        'l(｡-ω-)l',
        '(๑•̀ㅂ•́)و✧',
        'o(*≧▽≦)ツ',
        'ヾ(≧▽≦*)o',
        '（；´д｀）ゞ',
        'o(≧口≦)o',
        'ヾ(´∀`o)+',
        '(＞﹏＜)',
        '(눈_눈)',
        '(＠_＠;)',
        '(๑´╹‸╹`๑)',
        '（＃￣～￣＃）',
        '(・-・*)',
        '(¯^¯ )',
        '<(ˉ^ˉ)>',
        'Σ(っ °Д °;)っ',
        'ʅ（´◔౪◔）ʃ',
        '<(￣ˇ￣)/',
        'v(￣︶￣)y',
        '(#｀-_ゝ-)',
        'o(￣ε￣*)',
        '(〃▔□▔)',
        '(°ー°〃)',
        '(๑-﹏-๑)',
        '(⊙﹏⊙)',
        '(´◔౪◔)۶',
        '( ´◔ ‸◔`)',
        '(ﾟДﾟ*)ﾉ',
        '(*￣3￣)╭',
        '_(:з」∠)_',
        '[]~(￣▽￣)~*',
        'φ(゜▽゜*)♪',
        '( σ˙ω˙)σ',
        '╰(￣▽￣)╭',
        '( ˘•ω•˘ )',
        '( ￣▽￣)〃',
        'o(*≧▽≦)ツ',
        'φ(≧ω≦*)♪',
        '(・-・*)',
        '(๑´ڡ`๑)',
        '≡￣﹏￣≡',
        '(￣∇￣;)',
        '(╯▽╰ )',
        '(●⁰౪⁰●)',
        'o(*￣▽￣*)ゞ',
        'థ ౪ థ',
        '(｡ŏ_ŏ)',
        'Ծ‸Ծ',
        'ヾ(๑╹◡╹)ﾉ〃♡',
        '（。－_－。）',
        '(¬_¬)',
        '(→_→)',
        '(_　_)。゜zｚＺ',
        '(ง •_•)ง',
        '٩( ˙ω˙ )و',
        '٩(๑`^´๑)۶',
        '╭( ･ㅂ･)و',
        '(° ͜ʖ ͡°)',
        '(⊙ˍ⊙)',
        'Σ(っ °Д °;)っ',
        'Σ(｀д′*ノ)ノ',
        '╰(*°▽°*)╯',
        '（´Д`）',
        'ヾ(●゜ⅴ゜)ﾉ',
        'ಠ_ಠ',
        '（¯﹃¯）',
        '(*Ծ﹏Ծ)ぐ',
        'Q_Q',
        'ಥ_ಥ',
        '┭┮﹏┭┮',
        'ヾ(｡>﹏<｡)ﾉﾞ',
        '(*^▽^*)',
        '︸_︸',
        'o(ﾟ∀ﾟ)o',
        '♪(^∇^*)',
        '(ρ_・).。',
        '{{{(>_<)}}}',
        '（￣ー￣）',
        '(°ー°〃)',
        '(*/ω＼*)',
        '（┬＿┬）',
        '（。人。）',
        '=￣ω￣=',
        '(๑¯∀¯๑)',
        'o(￣ˇ￣)o',
        'o(=•ェ•=)m',
        '╮（╯＿╰）╭',
        '( ・ิω・)ノิิิ',
        'Ψ(￣∀￣)Ψ',
        '(/￣ˇ￣)/',
        '<(*￣▽￣*)/',
        '~(￣▽￣)~*',
        '(￣▽￣)ノ',
        'ヾ(´･ω･｀)ﾉ',
        'ヾ(^▽^*)))',
        '(｡•ˇ‸ˇ•｡)',
        '(　ﾟ∀ﾟ) ﾉ♡',
        '(*￣∇￣)ノ',
        'o(*≧▽≦)ツ',
        '(～o￣3￣)～',
        '(/≧▽≦)/',
        '$_$',
        '(☆▽☆)',
        '╮(￣▽￣)╭',
        '٩(๑`^´๑)۶',
        '( ˘ ³˘)♥',
        '◕ˇε ˇ◕',
        '♪(´ε｀ )',
        '（づ￣3￣）づ╭❤～',
        'o(*￣3￣)o',
        '(っ´Ι`)っ',
        '(‧_‧？)',
        '◟(⁰𠆢⁰∗)',
        'ヽ(•̀﹏•́ )ゝ',
        '(σ｀д′)σ',
        '(。_。)',
        'ヾ（≧∇≦）〃',
        '╮(－_－)╭',
        '…（⊙＿⊙；）…',
        '＞﹏＜',
        '(☆＿☆)',
        '<(￣▽￣)/',
        'ಠ__ಠ',
        '(。﹏。*)',
        '~(～￣▽￣)～',
        '(๑′°︿°๑)',
        '(｡•ㅅ•｡)♡',
        '╮(╯▽╰)╭',
        '(^﹏^)〃',
        '(´･◡･｀)',
        'o(*￣▽￣*)o',
        '(☆ｗ☆)',
        '( ╯▽╰)',
        'p(#￣▽￣#)o',
        '٩(●˙▿˙●)۶',
        '(*￣▽￣)y',
        '(*￣︶￣)y',
        '(＾－＾)V',
        '@_@',
        '(。・_・)/~~~',
        'ヾﾉ｡ÒㅅÓ)ﾉｼ',
        'o(*˙▽˙*)/',
        '٩(๑`^´๑)۶',
        'X﹏X',
        '(*´∀`)ノ',
        '(￣︶￣)↗',
        'o(〃˙▽˙〃)o',
        '（～￣▽￣～）',
        'ლ(❤◡❤ლ)',
        '*(੭*ˊᵕˋ)੭*ଘ',
        '( ノ・ω・)ノ',
        '（￣︶￣）↗',
        '٩( ˙ω˙ )و',
        'ᕕ( ˙ω˙)ᕗ',
        'ᕕ( ˙꒳​˙)ᕗ',
        '(*ﾟｰﾟ)'
    ];
    window.cachedConfig = null;
    var storage = chrome.storage.sync;
    storage.get(null, function(data){
        if(data[0]){
            // data isn't empty
            cachedConfig = data2Config(data);
        }else{
            cachedConfig = defaultConfig;
        }
        createCM(cachedConfig);
    });
    // add event listener
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        switch(request.cmd) {
            case 'get_emoji':
                sendResponse(emoji[Math.floor(Math.random()*emoji.length)]);
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
                chrome.tabs.update(sender.tab.id, {'url': request.url});
            default:
                // console.log(request, sender, sendResponse);
        }
    });
    // recreate context menu when storage change
    chrome.storage.onChanged.addListener(function(changes, areaName){
        chrome.contextMenus.removeAll();
        storage.get(null, function(data){
            if(data[0]){
                // data isn't empty
                cachedConfig = data2Config(data);
            }else{
                cachedConfig = defaultConfig;
            }
            createCM(cachedConfig);
        });
    });
}

init();