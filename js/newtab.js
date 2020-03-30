function handleClicking(){

	function search(e){
        // invoke searching
		var searchInput = document.getElementById('search-input').value;
		if(searchInput){
			if(e.target.id == 'google-btn'){
				searchInput = "https://www.google.com/search?newwindow=1&q=" + searchInput;
			}else{
				searchInput = "https://www.baidu.com/s?ie=UTF-8&wd=" + searchInput;
			}
			loading();
			location.href = searchInput;
		}
	}

	function loading(){
        // loading animation
		var div = document.getElementById('loading');
		div.style.backgroundImage = "url(/images/cat.gif)";
		div.style.backgroundColor = "#66ceff";
		div.style.display = "block";
	}

	document.getElementById('google-btn').addEventListener('click', search);
	document.getElementById('baidu-btn').addEventListener('click', search);
	document.body.addEventListener('click', (e)=>{
		if(e.target.tagName == "A"){
            e.preventDefault();
            var url = e.target.href;
			loading();
            chrome.runtime.sendMessage({'cmd': 'open_link', 'url': url});
		}
	});

    // show & hide navigation sites
	document.querySelector("body > div.header").addEventListener('click', ()=>{
		var navSites = document.querySelector("body > div.sites");
		if(navSites.style.display == 'none'){
			navSites.style.display = 'block';
		}else{
			navSites.style.display = 'none';
		}
	});
}

function getConfig(resolve, reject){
	chrome.runtime.sendMessage({cmd: 'get_config'}, function(config){
		if(config == undefined){
			reject();
		}else{
			resolve(config);
		}
	});
}

function renderHtml(config){
    rawHtml = {};
    HTML = '';
    if(config.NEWTAB.HIDENAV == true){
        document.querySelector(".sites").style.display = "none";
    }
    config.NEWTAB.SITES.forEach((v)=>{
      	if(rawHtml[v.GROUP]){
      	  rawHtml[v.GROUP] += ('<dd><a href="' + v.URL + '">' + v.NAME + '</a></dd>\n');
      	}else{
      	  rawHtml[v.GROUP] = ('<dd><a href="' + v.URL + '">' + v.NAME + '</a></dd>\n');
      	}
    });

    Object.keys(rawHtml).forEach(function(catalog){
    	HTML += ('<dl><dt>' + catalog + '</dt>' + rawHtml[catalog] + '</dl>');
    });

    document.querySelector('.sites').innerHTML = HTML;
}

function init(){
	new Promise(getConfig).then(function(config){
		renderHtml(config);
		handleClicking();
	}).catch(init);
}

init();