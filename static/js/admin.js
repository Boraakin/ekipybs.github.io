(function(){
  // admin.js - admin panel behaviors: view switching, artwork CRUD, exhibition editor, data import/export
  function q(s, el=document){ return el.querySelector(s); }
  function qa(s, el=document){ return Array.from(el.querySelectorAll(s)); }

  // view switching
  function setupViews(){
    const side = qa('.side-link');
    side.forEach(btn=> btn.addEventListener('click', ()=>{
      const view = btn.dataset.view;
      // toggle active class
      side.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      // hide all views
      qa('.view').forEach(v=> v.style.display = 'none');
      const v = document.getElementById('view-'+view);
      if(v) v.style.display = 'block';
      // update header
      const title = q('#adminTitle'); const sub = q('#adminSub');
      if(title) title.textContent = btn.textContent.trim();
      if(sub) sub.textContent = '';
    }));
  }

  // artworks CRUD
  async function loadArtworks(){
    const rows = q('#aRows'); if(!rows) return;
    rows.innerHTML = '';
    try{
      const res = await fetch('/api/artworks');
      const data = await res.json();
      // populate table
      data.forEach(a=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${a.id}</td>
          <td>${escapeHtml(a.title)}</td>
          <td>${escapeHtml(a.artist)}</td>
          <td>${a.year||''}</td>
          <td>${escapeHtml(a.category)}</td>
          <td>${a.featured? '✔' : ''}</td>
          <td>
            <button class="btn btn-ghost small edit" data-id="${a.id}">Düzenle</button>
            <button class="btn btn-danger small del" data-id="${a.id}">Sil</button>
          </td>
        `;
        rows.appendChild(tr);
      });
      // attach actions
      qa('.edit').forEach(b=> b.addEventListener('click', e=> loadIntoForm(parseInt(b.dataset.id,10))));
      qa('.del').forEach(b=> b.addEventListener('click', e=> deleteArtwork(parseInt(b.dataset.id,10))));
      // KPIs
      q('#kpiTotal').textContent = data.length;
      q('#kpiFeatured').textContent = data.filter(x=>x.featured).length;
      q('#kpiCats').textContent = Array.from(new Set(data.map(x=>x.category))).length;
    }catch(err){ console.error(err); }
  }

  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]; }); }

  async function loadIntoForm(id){
    try{
      const res = await fetch('/api/artworks');
      const list = await res.json();
      const a = list.find(x=> x.id === id);
      if(!a) return;
      q('#id').value = a.id;
      q('#title').value = a.title||'';
      q('#artist').value = a.artist||'';
      q('#year').value = a.year||'';
      q('#medium').value = a.medium||'';
      q('#dimensions').value = a.dimensions||'';
      q('#category').value = a.category||'';
      q('#color_tag').value = a.color_tag||'';
      q('#image_url').value = a.image_url||'';
      q('#description').value = a.description||'';
      q('#featured').checked = !!a.featured;
      showPreview(a.image_url);
      q('#formMode').textContent = 'Düzenle';
      q('#formTitle').textContent = 'Eser Güncelle';
      q('#aStatus').textContent = '';
    }catch(err){ console.error(err); }
  }

  function showPreview(url){
    const wrap = q('#imgPrevWrap'); const img = q('#imgPrev');
    if(!wrap || !img) return;
    if(!url){ wrap.style.display='none'; img.src=''; return; }
    img.src = url; img.onload = ()=>{ wrap.style.display='block'; };
    img.onerror = ()=>{ wrap.style.display='none'; };
  }

  async function deleteArtwork(id){
    if(!confirm('Eseri silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;
    try{
      const res = await fetch('/api/artworks/'+id, { method: 'DELETE' });
      if(res.ok){ await loadArtworks(); log('Silindi: '+id); }
    }catch(err){ console.error(err); }
  }

  async function submitArtworkForm(e){
    e.preventDefault();
    const id = q('#id').value;
    const payload = {
      title: q('#title').value,
      artist: q('#artist').value,
      year: parseInt(q('#year').value||0,10),
      medium: q('#medium').value,
      dimensions: q('#dimensions').value,
      category: q('#category').value,
      color_tag: q('#color_tag').value,
      description: q('#description').value,
      image_url: q('#image_url').value,
      featured: q('#featured').checked
    };
    try{
      let res;
      if(id){
        res = await fetch('/api/artworks/'+id, { method: 'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      } else {
        res = await fetch('/api/artworks', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      }
      const j = await res.json();
      if(j && j.ok){
        q('#aStatus').textContent = 'Kaydedildi.';
        resetForm();
        await loadArtworks();
        log(id? ('Güncellendi: '+id) : ('Oluşturuldu: '+ (j.id || 'yeni')));
      } else {
        q('#aStatus').textContent = 'Hata: ' + (j && j.error || 'Sunucu hatası');
      }
    }catch(err){ console.error(err); q('#aStatus').textContent = 'Hata.'; }
  }

  function resetForm(){
    q('#aForm').reset(); q('#id').value=''; q('#formMode').textContent='Yeni'; q('#formTitle').textContent='Eser Kaydı'; q('#imgPrevWrap').style.display='none'; q('#aStatus').textContent='';
  }

  function log(txt){
    const box = q('#logBox'); if(!box) return;
    const el = document.createElement('div'); el.className='log-line'; el.textContent = (new Date()).toLocaleString() + ' — ' + txt; box.prepend(el);
  }

  // Exhibition editor
  async function loadExhibition(){
    try{
      const res = await fetch('/api/exhibition');
      const ex = await res.json();
      if(!ex) return;
      q('#ex_title').value = ex.title || '';
      q('#ex_date_range').value = ex.date_range || '';
      q('#ex_cover').value = ex.cover_image_url || '';
      q('#ex_statement').value = ex.statement || '';
    }catch(err){ console.error(err); }
  }

  async function saveExhibition(e){
    e.preventDefault();
    const payload = {
      title: q('#ex_title').value,
      date_range: q('#ex_date_range').value,
      statement: q('#ex_statement').value,
      cover_image_url: q('#ex_cover').value
    };
    try{
      const res = await fetch('/api/exhibition', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      const j = await res.json();
      if(j && j.ok){ q('#exStatus').textContent='Kaydedildi.'; log('Sergi güncellendi'); }
      else q('#exStatus').textContent='Hata';
    }catch(err){ console.error(err); q('#exStatus').textContent='Hata'; }
  }

  // Data export/import
  async function exportData(){
    q('#exportStatus').textContent='Dışa aktarılıyor...';
    try{
      const res = await fetch('/api/export');
      if(!res.ok) throw new Error('Sunucu hatası');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'export.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      q('#exportStatus').textContent='İndirildi.';
      log('Veri dışa aktarıldı.');
    }catch(err){ console.error(err); q('#exportStatus').textContent='Hata'; }
  }

  async function importData(){
    const file = q('#importFile').files[0];
    if(!file){ alert('Lütfen bir JSON dosyası seçin.'); return; }
    if(!confirm('İçe aktarım mevcut veriyi SİLEREK üzerine yazacaktır. Devam edilsin mi?')) return;
    q('#importStatus').textContent='İçe aktarılıyor...';
    try{
      const txt = await file.text();
      const json = JSON.parse(txt);
      const res = await fetch('/api/import', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(json) });
      const j = await res.json();
      if(j && j.ok){ q('#importStatus').textContent='Tamamlandı.'; log('Veri içe aktarıldı.'); await loadArtworks(); loadExhibition(); }
      else { q('#importStatus').textContent='Hata: ' + (j && j.error || 'Sunucu hatası'); }
    }catch(err){ console.error(err); q('#importStatus').textContent='Hata'; }
  }

  // init
  document.addEventListener('DOMContentLoaded', ()=>{
    setupViews();
    loadArtworks();
    // bindings
    const newBtn = q('#newBtn'); if(newBtn) newBtn.addEventListener('click', e=>{ e.preventDefault(); resetForm(); });
    const aForm = q('#aForm'); if(aForm) aForm.addEventListener('submit', submitArtworkForm);
    const resetBtn = q('#resetBtn'); if(resetBtn) resetBtn.addEventListener('click', e=>{ e.preventDefault(); resetForm(); });
    const imgUrl = q('#image_url'); if(imgUrl) imgUrl.addEventListener('input', ()=> showPreview(imgUrl.value));

    // exhibition
    const exForm = q('#exForm'); if(exForm) exForm.addEventListener('submit', saveExhibition);
    const exReset = q('#exReset'); if(exReset) exReset.addEventListener('click', e=>{ e.preventDefault(); loadExhibition(); });
    loadExhibition();

    // data tools
    const exportBtn = q('#exportBtn'); if(exportBtn) exportBtn.addEventListener('click', e=>{ e.preventDefault(); exportData(); });
    const importBtn = q('#importBtn'); if(importBtn) importBtn.addEventListener('click', e=>{ e.preventDefault(); importData(); });
  });

})();
