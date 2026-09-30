const menu = document.getElementById('menu');
const list = document.getElementById('list');
const box = document.getElementById('input');
const ival = document.getElementById('ival');
let items = [], sel = 0, mode = null;

function post(name, data) {
  return fetch(`https://${GetParentResourceName()}/${name}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data || {}),
  });
}

function render() {
  list.innerHTML = '';
  items.forEach((it, i) => {
    const el = document.createElement('div');
    el.className = 'item' + (i === sel ? ' sel' : '');
    el.innerHTML = `<div><div class="l"></div>${it.desc ? '<div class="d"></div>' : ''}</div><div class="r"></div>`;
    el.querySelector('.l').textContent = it.label || '';
    if (it.desc) el.querySelector('.d').textContent = it.desc;
    el.querySelector('.r').textContent = it.right || '';
    el.onclick = () => { sel = i; choose(); };
    list.appendChild(el);
  });
  const s = list.children[sel];
  if (s) s.scrollIntoView({ block: 'nearest' });
}

function choose() { if (items.length) post('select', { index: sel + 1 }); }

window.addEventListener('message', (e) => {
  const d = e.data;
  if (d.action === 'open') {
    mode = 'menu'; items = d.items || []; sel = 0;
    document.getElementById('title').textContent = d.title || '';
    box.classList.add('hidden'); menu.classList.remove('hidden'); render();
  } else if (d.action === 'input') {
    mode = 'input'; menu.classList.add('hidden');
    document.getElementById('ititle').textContent = d.title || '';
    ival.value = ''; ival.placeholder = d.placeholder || '';
    box.classList.remove('hidden'); setTimeout(() => ival.focus(), 50);
  } else if (d.action === 'close') {
    mode = null; menu.classList.add('hidden'); box.classList.add('hidden');
  }
});

document.addEventListener('keydown', (e) => {
  if (mode === 'menu') {
    if (e.key === 'ArrowDown') { sel = (sel + 1) % items.length; render(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { sel = (sel - 1 + items.length) % items.length; render(); e.preventDefault(); }
    else if (e.key === 'Enter') choose();
    else if (e.key === 'Escape' || e.key === 'Backspace') post('close');
  } else if (mode === 'input') {
    if (e.key === 'Enter') post('submit', { value: ival.value });
    else if (e.key === 'Escape') post('close');
  }
});
