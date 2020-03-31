function addSearchEngines(){
    // seems that chrome.runtime.sendMessage is an async api
    chrome.runtime.sendMessage({cmd: 'get_config'}, function(config){
        // add search engines to popup.html
        var rawHtml = [];
        var group_id = [];
        config.SEARCH.ENGINES.forEach(function(v){
            if (v.NAME && v.URL){
                  if (group_id.includes(v.GROUP)) {
                      group_id.forEach(function(value, num){
                            // find corrensponding ".op_card" to insert
                            if (v.GROUP == value) {
                                rawHtml[num] = rawHtml[num].replace(/<\/div>$/, ('<input type="button" class="btn" value="' +v.NAME+ '" search_text="' +v.URL+ '"></div>'));
                            }
                  });
                } else {
                    group_id.push(v.GROUP);
                    rawHtml.push('<div class="op_card"><input type="button" class="btn" value="' +v.NAME+ '" search_text="' +v.URL+ '"></div>');
                }
            }
    });
    rawHtml.forEach(function(htmlStr){
      document.getElementById('search-engine-area').innerHTML += htmlStr;
    });

    // add listener to btns
    var search_btn = document.getElementsByClassName("btn");
    for (var i = 0; i < search_btn.length; i++) {
        search_btn[i].addEventListener('click', search, false);
    }
  });
}

function search() {
    var key;
    var url;
    var search_text = this.getAttribute('search_text');
    if (search_text) {
        key = document.getElementById("search_box").value;
        if (key != "") {
            key = encodeURIComponent(key);
            url = search_text.replace('%s', key);
        } else {
            url = search_text.split('/')[0] + '//' + search_text.split('/')[2];
        }
    } else {
        url = this.getAttribute('href');
    }
    window.open(url);
    window.close();
}
addSearchEngines();
chrome.runtime.sendMessage({cmd: 'get_emoji'}, function(emoji){
  document.getElementById('search_box').placeholder = emoji;
});