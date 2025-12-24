(async function(){
  const sideLinks = Array.from(document.querySelectorAll('.side-link'));
  const views = {
    dash: document.getElementById('view-dash'),
    artworks: document.getElementById('view-artworks'),
    settings: document.getElementById('view-settings'),
  };
  const adminTitle = document.getElementById('adminTitle');
  const adminSub = document.getElementById('adminSub');

  function show(view){
    Object.entries(views).forEach(([k, el])=>{
      if(!el) return;
      el.style.display = (k === view) ? '' : 'none';
    });
    sideLinks.forEach(b=> b.classList.toggle('active', b.dataset.view === view));

    if(view === 'dash'){
      adminTitle.textContent = 'Özet';
      adminSub.textContent = 'Veri durumu ve hızlı metrikler';
    }else if(view === 'artworks'){
      adminTitle.textContent = 'Eserler';
      adminSub.textContent = 'Ekle • düzenle • sil';
    }else{
      adminTitle.textContent = 'Ayarlar';
      adminSub.textContent = 'Proje ayarları';
    }
  }

  sideLinks.forEach(btn=>{
    btn.addEventListener('click', ()=> show(btn.dataset.view));
  });

  // basit log
  const logKey = 'admin_log_demo';
  function log(msg){
    const now = new Date().toLocaleString();
    const arr = JSON.parse(localStorage.getItem(logKey) || '[]');
    arr.unshift(`${now} — ${msg}`);
    localStorage.setItem(logKey, JSON.stringify(arr.slice(0, 20)));
    renderLog();
  }
  function renderLog(){
    const box = document.getElementById('logBox');
    if(!box) return;
    const arr = JSON.parse(localStorage.getItem(logKey) || '[]');
    box.innerHTML = arr.map(x=>`<div class="log-line">${escapeHtml(x)}</div>`).join('');
  }

  // API
  async function apiList(){
    const r = await fetch('/api/artworks');
    if(!r.ok) throw new Error('Liste alınamadı');
    return r.json();
  }
  async function apiCreate(payload){
    const r = await fetch('/api/artworks', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    if(!r.ok) throw new Error('Kayıt eklenemedi (oturum?)');
    return r.json();
  }
  async function apiUpdate(id, payload){
    const r = await fetch(`/api/artworks/${id}`, {
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    if(!r.ok) throw new Error('Kayıt güncellenemedi (oturum?)');
    return r.json();
  }
  async function apiDelete(id){
    const r = await fetch(`/api/artworks/${id}`, {method:'DELETE'});
    if(!r.ok) throw new Error('Kayıt silinemedi (oturum?)');
    return r.json();
  }

  // UI refs
  const kpiTotal = document.getElementById('kpiTotal');
  const kpiFeatured = document.getElementById('kpiFeatured');
  const kpiCats = document.getElementById('kpiCats');

  const aRows = document.getElementById('aRows');
  const aSearch = document.getElementById('aSearch');
  const aCat = document.getElementById('aCat');
  const newBtn = document.getElementById('newBtn');

  const form = document.getElementById('aForm');
  const status = document.getElementById('aStatus');
  const resetBtn = document.getElementById('resetBtn');

  const inputs = {
    id: document.getElementById('id'),
    title: document.getElementById('title'),
    artist: document.getElementById('artist'),
    year: document.getElementById('year'),
    medium: document.getElementById('medium'),
    dimensions: document.getElementById('dimensions'),
    category: document.getElementById('category'),
    color_tag: document.getElementById('color_tag'),
    description: document.getElementById('description'),
    image_url: document.getElementById('image_url'),
    featured: document.getElementById('featured'),
  };

  const imgPrevWrap = document.getElementById('imgPrevWrap');
  const imgPrev = document.getElementById('imgPrev');

  let cache = [];

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  }

  function setStatus(text){
    if(!status) return;
    status.textContent = text || '';
  }

  function payloadFromForm(){
    return {
      title: inputs.title.value.trim(),
      artist: inputs.artist.value.trim(),
      year: parseInt(inputs.year.value,10),
      medium: inputs.medium.value.trim(),
      dimensions: inputs.dimensions.value.trim(),
      category: inputs.category.value,
      color_tag: inputs.color_tag.value,
      description: inputs.description.value.trim(),
      image_url: inputs.image_url.value.trim(),
      featured: !!inputs.featured.checked
    };
  }

  function fillForm(a){
    inputs.id.value = a?.id || '';
    inputs.title.value = a?.title || '';
    inputs.artist.value = a?.artist || '';
    inputs.year.value = a?.year || '';
    inputs.medium.value = a?.medium || '';
    inputs.dimensions.value = a?.dimensions || '';
    inputs.category.value = a?.category || 'Painting';
    inputs.color_tag.value = a?.color_tag || 'Monochrome';
    inputs.description.value = a?.description || '';
    inputs.image_url.value = a?.image_url || '';
    inputs.featured.checked = !!a?.featured;
    updatePreview();
  }

  function updatePreview(){
    const url = inputs.image_url.value.trim();
    if(url && /^https?:\/\/.+/i.test(url)){
      imgPrev.src = url;
      imgPrevWrap.style.display = '';
    }else{
      imgPrevWrap.style.display = 'none';
    }
  }
  inputs.image_url?.addEventListener('input', updatePreview);

  function renderKpis(){
    if(!kpiTotal) return;
    kpiTotal.textContent = String(cache.length);
    kpiFeatured.textContent = String(cache.filter(x=>x.featured).length);
    const cats = new Set(cache.map(x=>x.category));
    kpiCats.textContent = String(cats.size);
  }

  function getFiltered(){
    const q = (aSearch.value || '').trim().toLowerCase();
    const c = aCat.value || '';
    return cache.filter(x=>{
      const okQ = !q || (x.title||'').toLowerCase().includes(q) || (x.artist||'').toLowerCase().includes(q);
      const okC = !c || x.category === c;
      return okQ && okC;
    });
  }

  function renderRows(){
    if(!aRows) return;
    const list = getFiltered();
    aRows.innerHTML = list.map(x=>`
      <tr>
        <td>${x.id}</td>
        <td>${escapeHtml(x.title)}</td>
        <td>${escapeHtml(x.artist)}</td>
        <td>${x.year}</td>
        <td><span class="chip">${escapeHtml(x.category)}</span></td>
        <td>${x.featured ? '✓' : '—'}</td>
        <td class="t-right">
          <button class="btn btn-small btn-ghost" data-edit="${x.id}">Düzenle</button>
          <button class="btn btn-small btn-danger" data-del="${x.id}">Sil</button>
        </td>
      </tr>
    `).join('');

    aRows.querySelectorAll('[data-edit]').forEach(b=>{
      b.addEventListener('click', ()=>{
        const id = parseInt(b.dataset.edit,10);
        const item = cache.find(x=>x.id === id);
        fillForm(item);
        setStatus(`Düzenleniyor: #${id}`);
      });
    });

    aRows.querySelectorAll('[data-del]').forEach(b=>{
      b.addEventListener('click', async ()=>{
        const id = parseInt(b.dataset.del,10);
        if(!confirm(`#${id} silinsin mi?`)) return;
        try{
          setStatus('Siliniyor...');
          await apiDelete(id);
          log(`Silindi #${id}`);
          await refresh();
          setStatus('Silindi.');
          fillForm(null);
        }catch(e){
          setStatus(e.message || 'Hata');
        }
      });
    });
  }

  async function refresh(){
    cache = await apiList();
    renderKpis();
    renderRows();
    renderLog();
  }

  aSearch?.addEventListener('input', renderRows);
  aCat?.addEventListener('change', renderRows);

  newBtn?.addEventListener('click', ()=>{
    fillForm(null);
    setStatus('Yeni kayıt');
  });

  resetBtn?.addEventListener('click', ()=>{
    fillForm(null);
    setStatus('Sıfırlandı');
  });

  form?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    try{
      const p = payloadFromForm();
      if(!p.title || !p.artist || !p.image_url) return setStatus('Zorunlu alanlar eksik.');
      if(!/^https?:\/\/.+/i.test(p.image_url)) return setStatus('Görsel URL geçersiz.');

      const id = inputs.id.value ? parseInt(inputs.id.value,10) : null;
      setStatus('Kaydediliyor...');

      if(id){
        await apiUpdate(id, p);
        log(`Güncellendi #${id}`);
        setStatus('Güncellendi.');
      }else{
        const res = await apiCreate(p);
        log(`Eklendi #${res.id}`);
        setStatus('Eklendi.');
      }

      await refresh();
      fillForm(null);
    }catch(e){
      setStatus(e.message || 'Hata');
    }
  });

  // ilk açılış
  show('dash');
  await refresh();
})();
