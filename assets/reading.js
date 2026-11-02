// Only enhances navigation. The complete book is readable without JavaScript.
const toc = document.querySelector('.toc');
const small = matchMedia('(max-width: 900px)');
const adapt = () => { toc.open = !small.matches; };
adapt();
small.addEventListener('change', adapt);
const links = [...document.querySelectorAll('.toc a')];
links.forEach(link => link.addEventListener('click', () => {
  if (small.matches) toc.open = false;
}));
const chapters = [...document.querySelectorAll('.chapter')];
let pending = false;
function update() {
  const atEnd = scrollY + innerHeight >= document.documentElement.scrollHeight - 5;
  const current = atEnd ? chapters.at(-1) : [...chapters].reverse().find(s => s.getBoundingClientRect().top <= 180);
  links.forEach(link => {
    if (current && link.hash === `#${current.id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  document.querySelector('#current').textContent = current ? current.querySelector('.chapter-label').textContent : '全7章';
  pending = false;
}
addEventListener('scroll', () => { if (!pending) { pending = true; requestAnimationFrame(update); } }, { passive: true });
addEventListener('resize', update);
addEventListener('load', update);
update();
