// script.js — fetches blog_post.md, splits by top-level H1 (# ) and renders tabs
(async function(){
  const mdPath = 'blog_post.md';
  const contentEl = document.getElementById('content');
  const tabsEl = document.getElementById('tabs');

  // helper: slugify titles for deep links
  function slugify(s){
    return String(s).toLowerCase().replace(/[^\w]+/g,'-').replace(/(^-|-$)/g,'');
  }

  // safe focus helper: use preventScroll when available
  function safeFocus(el){
    if (!el) return;
    try {
      el.focus({ preventScroll: true });
    } catch (e) {
      try { el.focus(); } catch (e2) { /* ignore */ }
    }
  }

  // Load markdown
  let raw;
  try {
    const resp = await fetch(mdPath);
    if (!resp.ok) throw new Error('Could not load blog_post.md: ' + resp.status);
    raw = await resp.text();
  } catch (err) {
    console.error(err);
    contentEl.innerHTML = '<p class="loading">Error loading article. Make sure blog_post.md is present.</p>';
    return;
  }

  // Split markdown into top-level sections by H1 headings.
  const parts = raw.split(/\n(?=# )/g);
  const sections = parts.map(part => {
    const headerMatch = part.match(/^# (.+)/);
    const title = headerMatch ? headerMatch[1].trim() : 'Introduction';
    const html = marked.parse(part);
    return { title, html, slug: slugify(title) };
  });

  // Demo content (iframe)
  const demoVideoUrl = "https://www.youtube.com/embed/3R3MU5pYVmM";
  const demoHtml = `
    <h1>Demo</h1>
    <div class="video-wrapper">
      <iframe src="${demoVideoUrl}" title="Grow-a-gatchi demo" frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen></iframe>
    </div>
  `;

  // Ensure the static demo button exists (it should be in index.html)
  const staticDemoBtn = tabsEl.querySelector('.tab[data-demo="true"]');

  // Build dynamic tabs (one per top-level section)
  sections.forEach((sec, i) => {
    const btn = document.createElement('button');
    btn.className = 'tab';
    btn.type = 'button';
    btn.id = `tab-${i}`;
    btn.setAttribute('role','tab');
    btn.setAttribute('aria-selected','false');
    btn.setAttribute('aria-controls', `panel-${i}`);
    btn.dataset.sectionIndex = String(i); // mark which section this tab shows
    btn.textContent = sec.title;
    tabsEl.appendChild(btn);
  });

  // Now gather the final list of tabs (demo first if present, then dynamic ones)
  const tabs = Array.from(tabsEl.querySelectorAll('.tab'));

  // Centralized activation function: accepts a tab element
  function activateTabElement(tabBtn, { focus = true } = {}){
    if (!tabBtn) return;
    // update aria-selected on all tabs
    tabs.forEach(t => t.setAttribute('aria-selected', t === tabBtn ? 'true' : 'false'));

    // Render the appropriate content
    if (tabBtn.dataset.demo === 'true'){
      contentEl.innerHTML = `<article id="panel-demo" role="tabpanel" aria-labelledby="${tabBtn.id}" data-slug="demo">${demoHtml}</article>`;
      history.replaceState(null, '', '#demo');
    } else if (typeof tabBtn.dataset.sectionIndex !== 'undefined'){
      const idx = Number(tabBtn.dataset.sectionIndex);
      const sec = sections[idx];
      contentEl.innerHTML = `<article id="panel-${idx}" role="tabpanel" aria-labelledby="${tabBtn.id}" data-slug="${sec.slug}">${sec.html}</article>`;
      history.replaceState(null, '', `#${sec.slug}`);
    } else {
      contentEl.innerHTML = '<p class="loading">Unknown tab.</p>';
    }

    if (focus){
      safeFocus(tabBtn);
      // bring active tab into view horizontally without causing page jump
      try {
        tabBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } catch(e){
        tabBtn.scrollIntoView(false);
      }
    }
  }

  // Attach event handlers to each tab (click + keyboard)
  tabs.forEach((btn, index) => {
    btn.addEventListener('click', (ev) => {
      activateTabElement(btn, { focus: true });
    });

    btn.addEventListener('keydown', (e) => {
      const key = e.key;
      if (key === 'ArrowRight' || key === 'ArrowDown'){
        e.preventDefault();
        const nx = (index + 1) % tabs.length;
        activateTabElement(tabs[nx], { focus: true });
      } else if (key === 'ArrowLeft' || key === 'ArrowUp'){
        e.preventDefault();
        const nx = (index - 1 + tabs.length) % tabs.length;
        activateTabElement(tabs[nx], { focus: true });
      } else if (key === 'Home'){
        e.preventDefault();
        activateTabElement(tabs[0], { focus: true });
      } else if (key === 'End'){
        e.preventDefault();
        activateTabElement(tabs[tabs.length - 1], { focus: true });
      }
    });
  });

  // Decide initial tab using URL hash if present
  const hash = location.hash ? location.hash.slice(1) : '';
  let initialTab = null;
  if (hash === 'demo' && staticDemoBtn) {
    initialTab = staticDemoBtn;
  } else if (hash){
    const found = sections.findIndex(s => s.slug === hash);
    if (found >= 0){
      initialTab = tabs.find(t => t.dataset.sectionIndex === String(found));
    }
  }

  // Fallback: prefer the first section tab if present, otherwise demo
  if (!initialTab){
    initialTab = tabs.find(t => typeof t.dataset.sectionIndex !== 'undefined') || staticDemoBtn || tabs[0];
  }

  // Activate initial tab without focusing to avoid jump at load
  activateTabElement(initialTab, { focus: false });

})();