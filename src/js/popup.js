function renderSearchPage(){
    addSearchEngines();

    function addSearchEngines() {
      // seems that chrome.runtime.sendMessage is an async api
      chrome.runtime.sendMessage({ cmd: "get_config" }, function (config) {
        // add search engines to popup.html
        var rawHtml = [];
        var group_id = [];
        config.SEARCH.ENGINES.forEach(function (v) {
          if (v.NAME && v.URL) {
            if (group_id.includes(v.GROUP)) {
              group_id.forEach(function (value, num) {
                // find corrensponding ".op_card" to insert
                if (v.GROUP == value) {
                  rawHtml[num] = rawHtml[num].replace(
                    /<\/div>$/,
                    '<input type="button" class="btn" value="' +
                      v.NAME +
                      '" search_text="' +
                      v.URL +
                      '"></div>'
                  );
                }
              });
            } else {
              group_id.push(v.GROUP);
              rawHtml.push(
                '<div class="op_card"><input type="button" class="btn" value="' +
                  v.NAME +
                  '" search_text="' +
                  v.URL +
                  '"></div>'
              );
            }
          }
        });
        rawHtml.forEach(function (htmlStr) {
          document.getElementById("search-engine-area").innerHTML += htmlStr;
        });

        // add listener to btns
        var search_btn = document.getElementsByClassName("btn");
        for (var i = 0; i < search_btn.length; i++) {
          search_btn[i].addEventListener("click", search, false);
        }
        // press enter for instant search
        var search_box = document.getElementById("search_box");
        search_box.addEventListener("keyup", (e) => {
          if (
            e.key === "Enter" &&
            e.target.value !== "" &&
            search_btn.length > 0
          ) {
            search_btn[0].click();
          }
        });
      });
    }

    function search() {
      var key;
      var url;
      var search_text = this.getAttribute("search_text");
      if (search_text) {
        key = document.getElementById("search_box").value;
        if (key != "") {
          key = encodeURIComponent(key);
          url = search_text.replace("%s", key);
        } else {
          url = search_text.split("/")[0] + "//" + search_text.split("/")[2];
        }
      } else {
        url = this.getAttribute("href");
      }
      window.open(url);
      window.close();
    }
}

function renderExtPage(){
    chrome.management.getAll(result=>{
        // get ext info
        const exts= {};
        for(item of result){
            // exclude theme and search ext
            if(item.type !== 'extension' || item.id.includes('search.mozilla.org')) continue;
            exts[item.id] = {
                name: item.name,
                icon: item.icons && item.icons[0].url,
                enabled: item.enabled
            };
        }
        // concat html
        let rawHtml = '';
        for(id in exts){
            rawHtml += `<div class="ext-item">
                <input type="checkbox" class="ext-checkbox" data-enabled="${exts[id].enabled}" data-id="${id}">
                <span class="ext-name">${exts[id].name}</span>
            </div>`;
        }
        // mount
        // todo: handle "ext.mayDisable"
        const extPage = document.querySelector('#ext-page');
        extPage.innerHTML = rawHtml;
        for(checkbox of document.querySelectorAll('.ext-checkbox')){
            checkbox.checked = checkbox.dataset.enabled === 'true' ? true : false;
        }
        // handle click event
        extPage.addEventListener('click', e=>{
            const t = e.target;
            if(t.classList.contains('ext-checkbox')){
                // chrome.runtime.sendMessage({cmd: 'switch-ext-status', id: t.dataset.id});
                chrome.management.setEnabled(t.dataset.id, t.checked);
            }
        })
    });
}

function init(){
    // render
    renderSearchPage();
    // hide navbar if is firefox
    // firefox doesn't support setEnable for extension now (ref: https://bugzilla.mozilla.org/show_bug.cgi?id=1282982)
    const isFirefox = navigator.userAgent.includes('Firefox');
    if(isFirefox){
        document.querySelector('#nav').style.display = 'none';
    }else{
        renderExtPage();
    }
    // add nav btn listener
    document.querySelector('#nav').addEventListener('click', e=>{
        const t = e.target;
        if(t.classList.contains('nav-btn')){
            // set class
            for(child of t.parentElement.children){
                child.classList.remove('nav-btn-actived');
            }
            t.classList.add('nav-btn-actived');
            // switch page
            for(page of document.querySelectorAll('.page')){
                page.style.display = 'none';
            }
            switch (t.id) {
                case 'nav-search':
                    document.querySelector('#search-page').style.display = 'block';
                    document.querySelector('#search_box').focus();
                    break;
                case 'nav-ext':
                    document.querySelector('#ext-page').style.display = 'block';
                    break;
                case 'nav-opt':
                    chrome.tabs.create({url: './options.html', active: true});
            }
        }
    });
    // show search page by default
    document.querySelector('#nav-search').click();
}

init();