(function(){
  // gallery.js - client-side combined filtering for Gallery page
  const qEl = document.getElementById('q');
  const catEl = document.getElementById('cat');
  const tagEl = document.getElementById('tag');
  const sortEl = document.getElementById('sort');
  const clearBtn = document.getElementById('clear');
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');
  const placeholder = 'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?auto=format&fit=crop&w=1600&q=80';

  function items(){ return Array.from(grid.querySelectorAll('.art-card')); }

  function normalize(s){ return String(s||'').toLowerCase().trim(); }

  function applyFilters(){
    const q = normalize(qEl?.value);
    const cat = (catEl?.value||'').trim();
    const tag = (tagEl?.value||'').trim();
    const sort = sortEl?.value || 'year_desc';

    let list = items().filter(el=>{
      const title = el.dataset.title || '';
      const artist = el.dataset.artist || '';
      const category = (el.dataset.category||'').trim();
      const coltag = (el.dataset.tag||'').trim();
      const matchesQ = !q || title.includes(q) || artist.includes(q);
      const matchesCat = !cat || category === cat;
      const matchesTag = !tag || coltag === tag;
      return matchesQ && matchesCat && matchesTag;
    });

    // show/hide
    items().forEach(el=> el.style.display = list.includes(el) ? '' : 'none');

    // sorting
    if(list.length>1){
      if(sort === 'year_desc'){
        list.sort((a,b)=> parseInt(b.dataset.year||0) - parseInt(a.dataset.year||0));
      } else if(sort === 'title_asc'){
        list.sort((a,b)=> (a.dataset.title||'').localeCompare(b.dataset.title||''));
      }
      // reorder in DOM
      list.forEach(el => grid.appendChild(el));
    }

    // show empty
    const anyVisible = items().some(el=> el.style.display !== 'none');
    empty.style.display = anyVisible ? 'none' : '';
  }

  function resetFilters(){
    if(qEl) qEl.value = '';
    if(catEl) catEl.value = '';
    if(tagEl) tagEl.value = '';
    if(sortEl) sortEl.value = 'year_desc';
    applyFilters();
  }

  // image fallback
  function watchImages(){
    items().forEach(el=>{
      const img = el.querySelector('img');
      if(!img) return;
      img.onerror = ()=>{ img.src = placeholder; };
      // if src empty
      if(!img.src) img.src = placeholder;
    });
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    qEl?.addEventListener('input', applyFilters);
    catEl?.addEventListener('change', applyFilters);
    tagEl?.addEventListener('change', applyFilters);
    sortEl?.addEventListener('change', applyFilters);
    clearBtn?.addEventListener('click', e=>{ e.preventDefault(); resetFilters(); });
    watchImages();
    applyFilters();
  });
})();
