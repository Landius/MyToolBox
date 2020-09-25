function localize(){
    const body = document.body;
    if(body.classList.contains('localized')) return;

    let html = body.innerHTML.replace(/__MSG_(.+)__/g, (match, p1)=>{
        return chrome.i18n.getMessage(p1);
    });

    body.innerHTML = html;
    body.classList.add('localized');
}

localize();