(function(){
  const q = document.getElementById('q');
  const cat = document.getElementById('cat');
  const tag = document.getElementById('tag');
  const sort = document.getElementById('sort');
  const clear = document.getElementById('clear');
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');

  if(!grid) return;
  const cards = Array.from(grid.querySelectorAll('.art-card'));

  function apply(){
    const query = (q.value || '').trim().toLowerCase();
    const c = cat.value || '';
    const t = tag.value || '';
    const s = sort.value;

    let list = cards.filter(el=>{
      const title = el.dataset.title || '';
      const artist = el.dataset.artist || '';
      const okQ = !query || title.includes(query) || artist.includes(query);
      const okC = !c || el.dataset.category === c;
      const okT = !t || el.dataset.tag === t;
      return okQ && okC && okT;
    });

    // sıralama
    if(s === 'year_desc'){
      list.sort((a,b)=> (parseInt(b.dataset.year,10)||0) - (parseInt(a.dataset.year,10)||0));
    }else if(s === 'title_asc'){
      list.sort((a,b)=> (a.dataset.title||'').localeCompare(b.dataset.title||''));
    }

    // ekrana bas
    cards.forEach(el=> el.style.display = 'none');
    list.forEach(el=> el.style.display = '');
    empty.style.display = list.length ? 'none' : '';
  }

  [q, cat, tag, sort].forEach(el=>{
    el.addEventListener('input', apply);
    el.addEventListener('change', apply);
  });

  clear.addEventListener('click', ()=>{
    q.value = '';
    cat.value = '';
    tag.value = '';
    sort.value = 'year_desc';
    apply();
  });

  apply();
})();
