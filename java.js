/* script.js - lógica principal de la página APA Interactiva */

/* Helpers */
const qs = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));

/* Navegación entre secciones */
const navBtns = qsa('.nav-btn');
navBtns.forEach(b=>{
  b.addEventListener('click', ()=> {
    navBtns.forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    const sec = b.dataset.section;
    qsa('.page-section').forEach(p=>p.classList.remove('active'));
    qs('#'+sec).classList.add('active');
  });
});

/* Música toggle */
const musicSwitch = qs('#musicSwitch');
const bgMusic = qs('#bgMusic');
musicSwitch.addEventListener('change', ()=> {
  if(musicSwitch.checked){
    bgMusic.play().catch(()=>{ /* autoplay may be blocked */ });
  } else {
    bgMusic.pause();
    bgMusic.currentTime = 0;
  }
});

/* Levels logic */
let currentLevel = 0;
const allLevels = qsa('.level');
const totalLevels = allLevels.length;
const totalStarsEl = qs('#totalStars');
const nextLevelBtn = qs('#nextLevel');
const prevLevelBtn = qs('#prevLevel');

function showLevel(idx){
  allLevels.forEach(l=>l.classList.remove('active'));
  const node = allLevels[idx];
  node.classList.add('active');
  currentLevel = idx;
  prevLevelBtn.disabled = idx === 0;
  nextLevelBtn.textContent = (idx === totalLevels-1) ? 'Ir a evaluación' : 'Siguiente nivel →';
}
showLevel(0);

/* Utilities for scoring and persistence */
const STORAGE_KEY = 'apa_interactiva_progress';
function loadProgress(){
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : {stars: Array(totalLevels).fill(0)};
}
function saveProgress(state){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  updateStarsUI();
}
function updateStarsUI(){
  const state = loadProgress();
  // per-level stars
  allLevels.forEach((lv, i)=>{
    const sc = lv.querySelector('.stars-container');
    sc.innerHTML = '';
    const n = state.stars[i] || 0;
    for(let k=0;k<n;k++){
      const span = document.createElement('span');
      span.className='star'; span.textContent='⭐';
      sc.appendChild(span);
    }
  });
  // total
  const total = state.stars.reduce((a,b)=>a+b,0);
  totalStarsEl.textContent = total;
  // show congrats if all levels cleared with >=1 star
  if(state.stars.every(s=>s>0)){ openCongrats(); }
}

/* Simple answer checking functions (flexibles) */
function normalize(s){
  return s.trim().replace(/\s+/g,' ').replace(/[“”«»"]/g,'"').toLowerCase();
}

/* Level 1: multiple choice */
const lvl1 = qs('.level[data-level="1"]');
lvl1.querySelectorAll('.choices button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const ans = btn.dataset.answer;
    const fb = lvl1.querySelector('.feedback');
    if(ans === 'corta'){
      fb.className='feedback ok';
      fb.textContent = '✔ Correcto: es una cita corta.';
      awardStar(0);
    } else {
      fb.className='feedback err';
      fb.textContent = '❌ No es correcta. Observa que la cita tiene autor y año y es breve: cita corta.';
    }
  });
});

/* Level 2: exact-ish text match */
const lvl2 = qs('.level[data-level="2"]');
lvl2.querySelector('.check-btn').addEventListener('click', ()=>{
  const fb = lvl2.querySelector('.feedback');
  const input = qs('#lvl2-input').value;
  const norm = normalize(input);
  // allow slight variations like "(lópez, 2019)" or "López (2019)"
  if(/\b(l[oó]pez)\b/.test(norm) && /2019/.test(norm)){
    fb.className='feedback ok';
    fb.textContent = '✔ Correcto: citación válida.';
    awardStar(1);
  } else {
    fb.className='feedback err';
    fb.textContent = '❌ Revisa que incluyas el autor y el año: por ejemplo (López, 2019).';
  }
});

/* Level 3: reference order */
const lvl3 = qs('.level[data-level="3"]');
lvl3.querySelector('.check-btn').addEventListener('click', ()=>{
  const fb = lvl3.querySelector('.feedback');
  const input = normalize(qs('#lvl3-input').value);
  // check for author, year and editorial-like word
  const hasAuthor = /p[eé]rez/.test(input) || /perez/.test(input);
  const hasYear = /\(?.*20\d{2}\)?/.test(input);
  const hasTitle = input.includes('.') && !input.match(/^http/);
  if(hasAuthor && hasYear && hasTitle){
    fb.className='feedback ok';
    fb.textContent = '✔ Correcto: buena estructura de referencia.';
    awardStar(2);
  } else {
    fb.className='feedback err';
    fb.textContent = '❌ Revisa el orden: Autor (Año). Título. Editorial. Ejemplo: Pérez, J. (2020). Título. Editorial.';
  }
});

/* Level 4: choices */
const lvl4 = qs('.level[data-level="4"]');
lvl4.querySelectorAll('.choices button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const fb = lvl4.querySelector('.feedback');
    if(btn.dataset.answer === 'correct'){
      fb.className='feedback ok';
      fb.textContent = '✔ Correcto: formato apropiado.';
      awardStar(3);
    } else {
      fb.className='feedback err';
      fb.textContent = '❌ Esa opción no sigue el orden recomendado. Revisa Autor. (Año). Título. Fuente';
    }
  });
});

/* awardStar: give 1 star for level if not given yet */
function awardStar(levelIndex){
  const state = loadProgress();
  if(state.stars[levelIndex] < 1){
    state.stars[levelIndex] = 1;
    saveProgress(state);
    // small animation (optional)
  }
}

/* navigation buttons */
nextLevelBtn.addEventListener('click', ()=>{
  if(currentLevel < totalLevels-1){
    showLevel(currentLevel+1);
  } else {
    // go to evaluation
    qsa('.nav-btn').forEach(b=>b.classList.remove('active'));
    qs('.nav-btn[data-section="evaluacion"]').classList.add('active');
    qsa('.page-section').forEach(p=>p.classList.remove('active'));
    qs('#evaluacion').classList.add('active');
  }
});
prevLevelBtn.addEventListener('click', ()=> {
  if(currentLevel > 0) showLevel(currentLevel-1);
});

/* reset progress */
qs('#resetProgress').addEventListener('click', ()=>{
  if(confirm('¿Deseas reiniciar tu progreso?')){
    localStorage.removeItem(STORAGE_KEY);
    saveProgress({stars:Array(totalLevels).fill(0)});
  }
});

/* Modal congratulation */
const congrats = qs('#congratsModal');
const closeC = qs('#closeCongrats');
closeC.addEventListener('click', ()=> congrats.classList.add('hidden'));
function openCongrats(){
  congrats.classList.remove('hidden');
}

/* Initialize progress UI on load */
document.addEventListener('DOMContentLoaded', ()=>{
  if(!localStorage.getItem(STORAGE_KEY)){
    saveProgress({stars:Array(totalLevels).fill(0)});
  } else {
    updateStarsUI();
  }
});