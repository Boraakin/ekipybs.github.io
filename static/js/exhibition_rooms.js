(function(){
  // exhibition_rooms.js
  // Fetch artworks and populate 5 rooms with different selections.
  // Implements accessible accordion with smooth expand/collapse animations.

  const baseUrl = window.location.origin;

  function q(s, el=document){ return el.querySelector(s); }
  function qa(s, el=document){ return Array.from(el.querySelectorAll(s)); }

  function createArtNode(a){
    const wrap = document.createElement('a');
    wrap.className = 'room-item';
    wrap.href = baseUrl + '/artwork/' + a.id;
    wrap.title = a.title + ' — ' + a.artist;
    wrap.innerHTML = `
      <img loading="lazy" src="${a.image_url}" alt="${escapeHtml(a.title)}">
      <div class="meta">
        <div class="title">${escapeHtml(a.title)}</div>
        <div class="muted">${escapeHtml(a.artist)} • ${a.year}</div>
      </div>
    `;
    return wrap;
  }

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]; }); }

  function openPanel(panel){
    if(!panel) return;
    const header = document.querySelector('[aria-controls="'+panel.id+'"]');
    // close others
    qa('.room-panel.expanded').forEach(p=>{
      if(p===panel) return;
      collapsePanel(p);
    });
    panel.classList.add('expanded');
    header && header.setAttribute('aria-expanded','true');
    // set max-height to scrollHeight for transition
    panel.style.maxHeight = panel.scrollHeight + 'px';
  }
  function collapsePanel(panel){
    if(!panel) return;
    panel.classList.remove('expanded');
    const header = document.querySelector('[aria-controls="'+panel.id+'"]');
    header && header.setAttribute('aria-expanded','false');
    panel.style.maxHeight = 0;
  }

  function attachAccordion(){
    qa('.room-header').forEach(btn=>{
      const pid = btn.getAttribute('aria-controls');
      const panel = document.getElementById(pid);
      btn.addEventListener('click', ()=>{
        const isOpen = btn.getAttribute('aria-expanded') === 'true';
        if(isOpen){ collapsePanel(panel); }
        else{ openPanel(panel); adjustPanelMax(panel); }
      });
      // allow enter/space to toggle
      btn.addEventListener('keydown', e=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); btn.click(); }});
    });
  }

  // After content is injected, adjust maxHeight (useful when images load)
  function adjustPanelMax(panel){
    if(!panel) return;
    // wait for images to load a little
    setTimeout(()=>{
      panel.style.maxHeight = panel.scrollHeight + 'px';
    }, 120);
  }

  // choose artworks for rooms: preferentially by category; fallback to fill with unique items
  function allocateRooms(artworks){
    const byCat = {};
    artworks.forEach(a=>{ const c = a.category || 'Other'; (byCat[c] = byCat[c]||[]).push(a); });
    // shallow copy
    const remaining = artworks.slice();
    const taken = new Set();

    function pickByCategory(cat, n){
      const arr = byCat[cat] || [];
      const picks = [];
      for(const a of arr){ if(picks.length>=n) break; if(!taken.has(a.id)){ picks.push(a); taken.add(a.id); } }
      return picks;
    }

    function fillFromRemaining(n){
      const picks = [];
      for(const a of remaining){ if(picks.length>=n) break; if(!taken.has(a.id)){ picks.push(a); taken.add(a.id); } }
      return picks;
    }

    // room allocations: return map roomKey -> list
    const rooms = {};
    rooms.entrance = pickByCategory('Painting', 4).concat(fillFromRemaining(4)).slice(0,4);
    rooms.light = pickByCategory('Photography', 5).concat(fillFromRemaining(3)).slice(0,4);
    rooms.texture = pickByCategory('Sculpture', 6).concat(fillFromRemaining(2)).slice(0,4);
    rooms.rhythm = pickByCategory('Digital Art', 5).concat(fillFromRemaining(3)).slice(0,4);
    rooms.final = fillFromRemaining(5).slice(0,4);

    // ensure uniqueness and at least one item per room; if any room empty, refill
    Object.keys(rooms).forEach(k=>{
      if(!rooms[k] || rooms[k].length===0){ rooms[k] = fillFromRemaining(3); }
    });

    return rooms;
  }

  // populate DOM
  function renderRooms(map){
    Object.keys(map).forEach(key=>{
      const container = document.querySelector('.room-content[data-room="'+key+'"]');
      if(!container) return;
      const grid = document.createElement('div'); grid.className = 'room-grid';
      map[key].forEach(a=> grid.appendChild(createArtNode(a)));
      // clear and append
      container.innerHTML = '';
      container.appendChild(grid);
    });
  }

  // main
  document.addEventListener('DOMContentLoaded', ()=>{
    attachAccordion();
    // fetch artworks
    fetch('/api/artworks').then(r=>r.json()).then(all=>{
      // convert year maybe string -> keep as is
      const rooms = allocateRooms(all);
      renderRooms(rooms);
      // open first panel by default
      const firstPanel = document.getElementById('panel-1');
      if(firstPanel) openPanel(firstPanel);
      // adjust panels after images load
      const imgs = document.querySelectorAll('.room-content img');
      let loaded = 0; const total = imgs.length;
      if(total===0){ /* nothing */ }
      imgs.forEach(img=>{
        if(img.complete) loaded++; else img.addEventListener('load', ()=>{ loaded++; if(loaded===total){ qa('.room-panel.expanded').forEach(adjustPanelMax); } });
      });
      // final adjust
      setTimeout(()=> qa('.room-panel.expanded').forEach(adjustPanelMax), 300);
    }).catch(err=>{
      console.error('Could not load artworks for rooms', err);
    });
  });

})();
