function localize(){
    const head = document.head;
    const body = document.body;

    if(body.hasAttribute('localized')) return;

    for(item of [head, body]){
        item.innerHTML = item.innerHTML.replace(/__MSG_(.+)__/g, (match, p1)=>{
            return chrome.i18n.getMessage(p1);
        });
    }

    body.setAttribute('localized', '');
}

localize();