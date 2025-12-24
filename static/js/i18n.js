(function(){
  // i18n.js: simple toggle for elements with data-tr and data-en
  const STORAGE_KEY = 'digituval_lang';
  function setLang(lang){
    document.documentElement.lang = (lang==='en') ? 'en' : 'tr';
    // text nodes
    document.querySelectorAll('[data-tr]').forEach(el=>{
      const t = el.getAttribute('data-tr');
      const e = el.getAttribute('data-en');
      if(lang==='en' && e!==null){
        if(el.tagName==='INPUT' || el.tagName==='TEXTAREA'){
          el.placeholder = e;
        } else {
          el.textContent = e;
        }
      } else {
        if(el.tagName==='INPUT' || el.tagName==='TEXTAREA'){
          el.placeholder = t;
        } else {
          el.textContent = t;
        }
      }
    });
    // placeholders for elements with data-placeholder-tr / data-placeholder-en
    document.querySelectorAll('[data-placeholder-tr]').forEach(el=>{
      el.placeholder = (lang==='en' ? el.getAttribute('data-placeholder-en') : el.getAttribute('data-placeholder-tr'));
    });
    localStorage.setItem(STORAGE_KEY, lang);
    updateToggleUI(lang);
  }
  function updateToggleUI(lang){
    const tr = document.getElementById('lang-tr');
    const en = document.getElementById('lang-en');
    if(tr && en){
      tr.classList.toggle('active', lang==='tr');
      en.classList.toggle('active', lang==='en');
    }
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const saved = localStorage.getItem(STORAGE_KEY) || 'tr';
    setLang(saved);
    // bind toggle
    document.getElementById('lang-tr')?.addEventListener('click', ()=> setLang('tr'));
    document.getElementById('lang-en')?.addEventListener('click', ()=> setLang('en'));
  });
})();
