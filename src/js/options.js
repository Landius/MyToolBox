init().then(null).catch(init);

async function init() {
    window.$ = selector => document.querySelector(selector);
    window.$$ = selector => document.querySelectorAll(selector);
    await chrome.runtime.sendMessage({ cmd: 'get_config' }, config => {
        renderHTML(config);
    });
}

function renderHTML(config) {
    var main = $('#main');
    var enginesNode = $('#engines');
    var sitesNode = $('#sites');
    var engines = config.SEARCH.ENGINES;
    var sites = config.NEWTAB.SITES;
    // fill engines config
    $('#prefix').value = config.SEARCH.PREFIX;
    enginesNode.innerHTML = '';
    for (var i in engines) {
        addItem(enginesNode, engines[i]);
    }
    // fill sites config
    $('#hide-nav').checked = config.NEWTAB.HIDENAV;
    sitesNode.innerHTML = '';
    for (var j in sites) {
        addItem(sitesNode, sites[j]);
    }
    // fill style config
    $('#style-input').value = config.NEWTAB.STYLE;
    // fill about version
    $('#addon-version').innerText += browser.runtime.getManifest().version;
    // add event listener
    document.body.addEventListener('keydown', ev => {
        if (ev.key === 's' && ev.ctrlKey) {
            ev.preventDefault();
            saveConfig();
        }
    });
    main.onclick = null;
    main.onmousedown = null;
    main.onclick = e => {
        const t = e.target;
        if (t.classList.contains('delete-btn')) {
            t.parentElement.remove();
        } else {
            switch (t.id) {
                case 'new-engine':
                    var emptyItem = { GROUP: '', NAME: '', URL: '' };
                    addItem(enginesNode, emptyItem);
                    break;
                case 'new-site':
                    var emptyItem = { GROUP: '', NAME: '', URL: '' };
                    addItem(sitesNode, emptyItem);
                    break;
                case 'import-data':
                    importData();
                    break;
                case 'export-data':
                    exportData(config);
                    break;
                case 'save':
                    saveConfig();
                    break;
                case 'reset':
                    resetConfig();
                    break;
            }
        }
    };
    main.onmousedown = e => {
        if (e.target.classList.contains('item')) {
            dragToSort(e, e.target.parentElement);
        }
    };
}
function addItem(target, item) {
    var placeHolder = {
        group: chrome.i18n.getMessage('placeholder_group'),
        name: chrome.i18n.getMessage('placeholder_name'),
        url: chrome.i18n.getMessage('placeholder_url')
    };
    var itemElm = document.createElement('div');
    itemElm.classList.add('item');
    itemElm.innerHTML = `
		<input type="checkbox" class="enable-input"></input>
		<input type="text" class="group-input" placeholder="${placeHolder.group}"></input>
		<input type="text" class="name-input" placeholder="${placeHolder.name}"></input>
		<input type="url" class= "url-input" placeholder="${placeHolder.url}"></input>
		<i class="delete-btn material-icons">delete</i>
	`;
    itemElm.querySelector('.enable-input').checked = item.ENABLED || false;
    itemElm.querySelector('.group-input').value = item.GROUP;
    itemElm.querySelector('.name-input').value = item.NAME;
    itemElm.querySelector('.url-input').value = item.URL;
    target.appendChild(itemElm);
}
function saveText(txt, filename) {
    var a = document.getElementById('save_text');
    if (a == null) {
        a = document.createElement('a');
        a.setAttribute('id', 'save_text');
        a.style.display = 'none';
        document.body.appendChild(a);
    }
    var blobObj = new Blob([txt], { type: 'text/plain' });
    a.setAttribute('href', URL.createObjectURL(blobObj));
    a.setAttribute('download', filename);
    a.click();
}
function exportData(config) {
    var time = new Date();
    var filename =
        'Custom_Search_Config-' + time.getFullYear() + '-' + (time.getMonth() + 1) + '-' + time.getDate() + '.json';
    saveText(JSON.stringify(config), filename);
}
function importData() {
    var file = $('#file');
    if (file.onchange == null) {
        file.onchange = ev => {
            var pointer = ev.target.files[0];
            var reader = new FileReader();
            reader.readAsText(pointer);
            reader.onload = () => {
                try {
                    var importConfig = JSON.parse(reader.result);
                } catch (error) {
                    alert('Import failed, please check your json format...');
                }
                renderHTML(importConfig);
            };
        };
    }
    file.click();
}
function saveConfig() {
    var newConfig = {
        NEWTAB: { SITES: [] },
        SEARCH: { ENGINES: [] }
    };
    var engineItems = $$('#engines .item');
    var siteItems = $$('#sites .item');
    newConfig.SEARCH['PREFIX'] = $('#prefix').value;
    newConfig.NEWTAB['HIDENAV'] = $('#hide-nav').checked;
    newConfig.NEWTAB['STYLE'] = $('#style-input').value;
    [].forEach.call(engineItems, (v, i, a) => {
        var enabled = v.children[0].checked;
        var group = v.children[1].value;
        var name = v.children[2].value;
        var url = v.children[3].value;
        if (group == '' && name == '' && url == '') {
        } else {
            newConfig.SEARCH.ENGINES.push({ ENABLED: enabled, GROUP: group, NAME: name, URL: url });
        }
    });
    [].forEach.call(siteItems, (v, i, a) => {
        var enabled = v.children[0].checked;
        var group = v.children[1].value;
        var name = v.children[2].value;
        var url = v.children[3].value;
        if (group == '' && name == '' && url == '') {
        } else {
            newConfig.NEWTAB.SITES.push({ ENABLED: enabled, GROUP: group, NAME: name, URL: url });
        }
    });
    // Max storage size: 102400
    if (JSON.stringify(newConfig).length * 2 > 102400) {
        alert('config data should be smaller than 100kB');
        return;
    }
    renderHTML(newConfig);
    chrome.runtime.sendMessage({ cmd: 'save_config', config: newConfig }, function () {
        chrome.notifications.create(null, {
            type: 'basic',
            iconUrl: './images/logo128x128.png',
            title: 'CustomSearch',
            message: chrome.i18n.getMessage('save_success')
        });
    });
}
function resetConfig() {
    var choice = confirm(chrome.i18n.getMessage('confirm_reset'));
    if (choice) {
        chrome.runtime.sendMessage({ cmd: 'reset_config' }, function () {
            location.reload();
        });
    }
}
function dragToSort(event, container) {
    container.style.userSelect = 'none';
    var target = event.target;
    var itemHeight = target.offsetHeight;
    var itemList = container.querySelectorAll('.item');
    var currentIndex = 0;
    while (itemList[currentIndex] != target) {
        currentIndex++;
    }
    var targetIndex = currentIndex;
    var containerPadding = 5;
    var prevTop = targetIndex * itemHeight + containerPadding; // +5 to match the container's padding
    var prevMouseY = event.clientY;
    var prevScrollY = window.scrollY;
    var mouseMovement = 0;
    var scrollMovement = 0;
    var placeHolder = document.createElement('div');
    placeHolder.classList.add('item');
    placeHolder.style.height = itemHeight + 'px';
    target.id = 'target';
    target.style.top = prevTop + 'px';
    target.after(placeHolder);
    document.onmousemove = e => {
        mouseMovement = e.clientY - prevMouseY;
        handleMovement();
    };
    document.onscroll = e => {
        scrollMovement = window.scrollY - prevScrollY;
        handleMovement();
    };
    function handleMovement() {
        var movement = mouseMovement + scrollMovement;
        target.style.top = prevTop + movement + 'px';
        var offset = movement / itemHeight + targetIndex;
        var index;
        if (offset < 0) {
            index = -1;
        } else if (offset > itemList.length - 1) {
            index = itemList.length - 1;
        } else {
            index = Math.floor(offset);
        }
        if (currentIndex != index) {
            currentIndex = index;
            if (index == -1) {
                itemList[0].before(placeHolder);
            } else {
                itemList[index].after(placeHolder);
            }
        }
    }
    document.onmouseup = e => {
        container.style.userSelect = '';
        placeHolder.after(target);
        placeHolder.remove();
        target.id = '';
        target.style.top = '';
        document.onmousemove = null;
        document.onscroll = null;
        document.onmouseup = null;
    };
}
