
const KEY = 'ufa_app';
function loadData(){ try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch { return {}; } }
function saveData(obj){ sessionStorage.setItem(KEY, JSON.stringify(obj)); }
function getValue(id){ const el=document.getElementById(id); return el ? (el.value ?? '').trim() : ''; }
function showError(id, msg){ const span = document.getElementById(id); if(span){ span.textContent = msg; span.classList.remove('hidden'); } }
function clearError(id){ const span = document.getElementById(id); if(span){ span.textContent=''; span.classList.add('hidden'); } }
function emailValid(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function phoneValid(v){ return /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(v); }

window.addEventListener('DOMContentLoaded', () => {
  const data = loadData();
  document.querySelectorAll('[data-name]').forEach(el => {
    const name = el.getAttribute('data-name');
    if (data[name] != null){
      if (el.type === 'checkbox') el.checked = !!data[name];
      else el.value = data[name];
    }
    el.addEventListener('change', () => {
      const v = (el.type === 'checkbox') ? el.checked : el.value;
      data[name] = v;
      saveData(data);
    });
  });
});

function validatePage1(){
  let ok=true;
  const req = [
    ['firstName','First name is required.'],
    ['lastName','Last name is required.'],
    ['email','Valid email is required.','email'],
    ['phone','Valid phone is required.','phone'],
    ['address','Address is required.'],
    ['city','City is required.'],
    ['state','State is required.'],
    ['position','Please select a position.']
  ];
  req.forEach(([name,msg,type])=>{
    clearError('err-'+name);
    const val = getValue(name);
    if(!val || (type==='email' && !emailValid(val)) || (type==='phone' && !phoneValid(val))){
      showError('err-'+name, msg); ok=false;
    }
  });
  if(ok) window.location.href = 'page2.html';
}

function validatePage2(){
  let ok=true;
  clearError('err-degree');
  if(!getValue('degree')){ showError('err-degree','Please choose your highest degree.'); ok=false; }
  if(ok) window.location.href = 'page3.html';
}

function validatePage3(){
  let ok=true;
  clearError('err-license');
  const v = getValue('licenseReq');
  if(!v){ showError('err-license','Please answer the driver’s license question.'); ok=false; }
  if(ok) window.location.href = 'page4.html';
}

function validatePage4(){ window.location.href = 'page5.html'; }

function submitApp(e){
  e.preventDefault();
  const data = loadData();
  const must = ['firstName','lastName','email','phone','address','city','state','position','degree','licenseReq'];
  for(const k of must){
    if(!data[k]){ alert('Please complete all required fields before submitting. Missing: '+k); return; }
  }
  document.getElementById('success').classList.remove('hidden');
  document.getElementById('submitBtn').setAttribute('disabled','true');
}
