(function(){
  // landing_canvas.js
  // Gentle particle + trails + mouse parallax for the hero area
  // Performance-minded: requestAnimationFrame, DPR scaling, resize handling, fewer particles on small screens

  const canvas = document.getElementById('landing-hero');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = 0, height = 0, dpr = 1;
  let particles = [];
  let animId = null;
  let mouse = {x: 0.5, y: 0.5};
  let px = 0, py = 0; // smoothed mouse for parallax
  let paused = false;

  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

  function setSize(){
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // compute particle count based on area — smaller on small screens
    const area = width * height;
    let base = Math.floor(area / (1600 * 900) * 60); // scale with area; 60 for ~1600x900
    base = clamp(base, 18, 90);
    if(width < 640) base = Math.floor(base * 0.45);
    if(width < 420) base = Math.floor(base * 0.6);
    initParticles(base);
  }

  function initParticles(n){
    particles = [];
    for(let i=0;i<n;i++){
      const p = {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15, // slow motion
        vy: (Math.random() - 0.5) * 0.15,
        size: 0.8 + Math.random() * 2.6,
        hue: 250 + Math.random() * 60, // cool purple/blue range
        alpha: 0.08 + Math.random() * 0.28,
        trail: []
      };
      particles.push(p);
    }
  }

  function onMouseMove(e){
    const r = canvas.getBoundingClientRect();
    mouse.x = clamp((e.clientX - r.left) / r.width, 0, 1);
    mouse.y = clamp((e.clientY - r.top) / r.height, 0, 1);
  }

  function update(){
    // smooth mouse for gentle parallax
    px += (mouse.x - px) * 0.06;
    py += (mouse.y - py) * 0.06;

    // motion
    for(const p of particles){
      // subtle attraction to center with noise
      const cx = width * 0.5 + (px - 0.5) * 40; // parallax shift
      const cy = height * 0.45 + (py - 0.5) * 30;
      const dx = (cx - p.x) * 0.0008;
      const dy = (cy - p.y) * 0.0009;
      p.vx += dx + (Math.random() - 0.5) * 0.02;
      p.vy += dy + (Math.random() - 0.5) * 0.02;

      // dampening
      p.vx *= 0.995;
      p.vy *= 0.995;

      p.x += p.vx;
      p.y += p.vy;

      // wrap gently
      if(p.x < -20) p.x = width + 20;
      if(p.x > width + 20) p.x = -20;
      if(p.y < -20) p.y = height + 20;
      if(p.y > height + 20) p.y = -20;

      // store trail
      p.trail.push({x: p.x, y: p.y, t: Date.now()});
      if(p.trail.length > 12) p.trail.shift();
    }
  }

  function draw(){
    // gentle fade to create trails
    ctx.fillStyle = 'rgba(4,6,10,0.18)'; // museum-dark fade
    ctx.fillRect(0,0,width,height);

    // subtle global vignette and soft light
    // draw particles
    for(const p of particles){
      // draw trail path
      for(let i=0;i<p.trail.length;i++){
        const pt = p.trail[i];
        const k = i / p.trail.length;
        const size = p.size * (0.4 + k*1.6);
        const alpha = p.alpha * (k*0.9);
        const grd = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, size*6);
        grd.addColorStop(0, `rgba(230,220,255,${alpha})`);
        grd.addColorStop(0.25, `rgba(180,160,255,${alpha*0.45})`);
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, size*3, 0, Math.PI*2);
        ctx.fill();
      }

      // focal particle
      const gx = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size*8);
      gx.addColorStop(0, `rgba(255,245,255,${p.alpha})`);
      gx.addColorStop(0.3, `rgba(200,170,255,${p.alpha*0.4})`);
      gx.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gx;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size*4, 0, Math.PI*2);
      ctx.fill();
    }

    // optional subtle overlay lines for depth (very low alpha)
    // not necessary on small screens
    if(width > 720){
      ctx.strokeStyle = 'rgba(200,180,255,0.02)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(width*0.12 + (px-0.5)*30, height*0.9);
      ctx.lineTo(width*0.9 + (py-0.5)*20, height*0.2);
      ctx.stroke();
    }
  }

  function loop(){
    if(paused){ animId = requestAnimationFrame(loop); return; }
    update();
    draw();
    animId = requestAnimationFrame(loop);
  }

  function handleResize(){
    setSize();
    // draw an immediate frame to avoid flicker
    ctx.fillStyle = 'rgba(4,6,10,1)';
    ctx.fillRect(0,0,width,height);
  }

  function handleVisibility(){
    paused = document.hidden;
  }

  // init
  function start(){
    setSize();
    canvas.addEventListener('mousemove', onMouseMove, {passive:true});
    window.addEventListener('resize', debounce(handleResize, 120));
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('orientationchange', handleResize);
    // stop on page hide/unload to free CPU
    window.addEventListener('pagehide', stop);
    window.addEventListener('blur', ()=>{ paused = true; });
    window.addEventListener('focus', ()=>{ paused = false; });
    loop();
  }

  function stop(){
    if(animId) cancelAnimationFrame(animId);
    animId = null;
  }

  // small debounce util
  function debounce(fn, wait){
    let t = null;
    return function(){
      clearTimeout(t);
      t = setTimeout(()=>fn.apply(this, arguments), wait);
    };
  }

  // start when DOM ready and canvas has size
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', start);
  } else start();

})();
