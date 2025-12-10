// script.js — fetches blog_post.md, splits by top-level H1 (# ) and renders tabs
(async function(){
  const mdPath = 'blog_post.md';
  const raw = await fetch(mdPath).then(r => {
    if (!r.ok) throw new Error('Could not load blog_post.md');
    return r.text();
  }).catch(err=>{
    const contentEl = document.getElementById('content');
    contentEl.innerHTML = '<p class="loading">Error loading article. Make sure blog_post.md is present.</p>';
    console.error(err);
  });
  if (!raw) return;

  // Split markdown into top-level sections by H1 headings.
  const parts = raw.split(/\n(?=# )/g); // split where a top-level heading starts
  const sections = parts.map(part => {
    const headerMatch = part.match(/^# (.+)/);
    const title = headerMatch ? headerMatch[1].trim() : 'Introduction';
    const html = marked.parse(part);
    return { title, html };
  });

  const tabsEl = document.getElementById('tabs');
  const contentEl = document.getElementById('content');

  function slugify(s){
    return s.toLowerCase().replace(/[^\w]+/g,'-').replace(/(^-|-$)/g,'');
  }

  // safe focus helper: use preventScroll when available
  function safeFocus(el){
    try {
      el.focus({ preventScroll: true });
    } catch (e) {
      // older browsers may not support options
      try { el.focus(); } catch (e2) { /* ignore */ }
    }
  }

  // Build tabs
  sections.forEach((sec, i) => {
    const btn = document.createElement('button');
    btn.className = 'tab';
    btn.type = 'button';
    btn.id = `tab-${i}`;
    btn.setAttribute('role','tab');
    btn.setAttribute('aria-selected','false');
    btn.setAttribute('aria-controls', `panel-${i}`);
    btn.dataset.index = i;
    btn.textContent = sec.title;
    btn.addEventListener('click', () => activateTab(i, true));
    btn.addEventListener('keydown', onTabKeydown);
    tabsEl.appendChild(btn);
  });

  // Panels are rendered into single content area; use innerHTML swapping.
  function activateTab(index, focus){
    const allTabs = tabsEl.querySelectorAll('.tab');
    allTabs.forEach((t, ti) => t.setAttribute('aria-selected', ti === index ? 'true' : 'false'));
    const sec = sections[index];
    const slug = slugify(sec.title);
    // update content
    contentEl.innerHTML = `<article id="panel-${index}" role="tabpanel" aria-labelledby="tab-${index}" data-slug="${slug}">${sec.html}</article>`;
    // update hash for deep linking
    history.replaceState(null, '', `#${slug}`);
    // Manage focus without causing vertical scroll/jump:
    // Focus the tab button (keep nav visible) and use preventScroll to avoid snapping.
    if (focus) {
      const tabBtn = tabsEl.querySelector(`.tab[data-index="${index}"]`);
      if (tabBtn) {
        safeFocus(tabBtn);
        // scroll the active tab into view within the horizontal tab bar (no vertical jump)
        try {
          tabBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        } catch (e) {
          // fallback for older browsers
          tabBtn.scrollIntoView(false);
        }
      }
    }
  }

  // keyboard navigation
  function onTabKeydown(e){
    const key = e.key;
    const tabs = Array.from(tabsEl.querySelectorAll('.tab'));
    const idx = tabs.indexOf(e.currentTarget);
    if (key === 'ArrowRight' || key === 'ArrowDown'){
      e.preventDefault();
      const nx = (idx + 1) % tabs.length;
      tabs[nx].focus();
      activateTab(nx, true);
    } else if (key === 'ArrowLeft' || key === 'ArrowUp'){
      e.preventDefault();
      const nx = (idx - 1 + tabs.length) % tabs.length;
      tabs[nx].focus();
      activateTab(nx, true);
    } else if (key === 'Home'){
      e.preventDefault();
      tabs[0].focus();
      activateTab(0, true);
    } else if (key === 'End'){
      e.preventDefault();
      tabs[tabs.length-1].focus();
      activateTab(tabs.length-1, true);
    }
  }

  // Activate initial tab (try to match hash)
  const hash = location.hash ? location.hash.slice(1) : '';
  let initial = 0;
  if (hash){
    const found = sections.findIndex(s => slugify(s.title) === hash);
    if (found >= 0) initial = found;
  }
  activateTab(initial, false);

})();