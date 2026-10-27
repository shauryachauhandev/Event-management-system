const CATS={tech:'Tech',cult:'Cultural',sport:'Sports',work:'Workshop'};
const seed=[
 {id:1,title:'Hack the Campus 24h',cat:'tech',date:'2026-11-07',time:'09:00',venue:'Main Auditorium',cap:150,reg:112,desc:'A 24-hour team hackathon with mentors and prizes for the best campus problem solved.'},
 {id:2,title:'Diwali Cultural Night',cat:'cult',date:'2026-11-05',time:'18:30',venue:'Open Air Theatre',cap:400,reg:310,desc:'Dance, music and food stalls run by student clubs.'},
 {id:3,title:'Inter-College Cricket Cup',cat:'sport',date:'2026-11-14',time:'08:00',venue:'Sports Ground',cap:120,reg:120,desc:'Knockout tournament with eight college teams.'},
 {id:4,title:'DSA in C++ Bootcamp',cat:'work',date:'2026-11-02',time:'14:00',venue:'Lab 3, CSE Block',cap:60,reg:41,desc:'Hands-on session covering arrays, recursion and LeetCode practice.'},
 {id:5,title:'Open Mic Evening',cat:'cult',date:'2026-11-20',time:'17:00',venue:'Student Lounge',cap:80,reg:23,desc:'Poetry, stand-up and music. Sign up to perform or just listen.'},
 {id:6,title:'Web Dev with HTML, CSS & JS',cat:'work',date:'2026-11-10',time:'11:00',venue:'Lab 1, CSE Block',cap:50,reg:19,desc:'Build and host a small site from scratch in one afternoon.'}
];
const USER=Auth.current();
if(!USER)location.replace('login.html');
const UKEY=USER?USER.email:'';
let S;
try{S=JSON.parse(localStorage.getItem('gatherup'))}catch(e){}
if(!S||!S.events)S={events:seed,next:7};
S.regs=S.regs||{};
// registrations are kept per account; S.mine is always the signed-in user's list
S.mine=(S.regs[UKEY]||[]).filter(id=>S.events.some(e=>e.id===id));
const save=()=>{S.regs[UKEY]=S.mine;try{localStorage.setItem('gatherup',JSON.stringify(S))}catch(e){}};
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate=(d,t)=>new Date(d+'T'+t).toLocaleString('en-IN',{weekday:'short',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'});
const sorted=l=>[...l].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
let view='dash',q='',cat='all',editId=null;

function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2200)}

function card(e,mode){
  const full=e.reg>=e.cap,joined=S.mine.includes(e.id),pct=Math.min(100,Math.round(e.reg/e.cap*100));
  let btns='';
  if(mode==='manage')btns=`<button class="btn alt small" data-edit="${e.id}">Edit</button><button class="btn warn small" data-del="${e.id}">Delete</button>`;
  else btns=joined?`<button class="btn alt small" data-toggle="${e.id}">Cancel registration</button>`:`<button class="btn small" data-toggle="${e.id}" ${full?'disabled':''}>${full?'Event full':'Register'}</button>`;
  return `<article class="card" style="--cat:var(--c-${e.cat})">
    <span class="tag">${CATS[e.cat]}</span><h3>${esc(e.title)}</h3>
    <div class="meta">${fmtDate(e.date,e.time)} &middot; ${esc(e.venue)}</div>
    <p>${esc(e.desc||'')}</p>
    <div class="seats" aria-hidden="true"><i style="width:${pct}%"></i></div>
    <div class="row"><span class="meta">${e.reg} of ${e.cap} seats taken</span>${btns}</div></article>`;
}

const views={
 dash(){
  const ev=sorted(S.events),nx=ev[0],total=S.events.reduce((a,e)=>a+e.reg,0),cap=S.events.reduce((a,e)=>a+e.cap,0);
  const counts=Object.keys(CATS).map(k=>[k,S.events.filter(e=>e.cat===k).length]);
  const mx=Math.max(1,...counts.map(c=>c[1]));
  return `<div class="top"><h1>Overview</h1><button class="btn" data-new>Create event</button></div>
  <div class="stats">
   <div class="stat"><b>${S.events.length}</b><small>Events scheduled</small></div>
   <div class="stat"><b>${total}</b><small>Total registrations</small></div>
   <div class="stat"><b>${cap?Math.round(total/cap*100):0}%</b><small>Seats filled</small></div>
   <div class="stat"><b>${S.mine.length}</b><small>Your registrations</small></div>
  </div>
  ${nx?`<div class="next"><div><small>Happening next</small><h2>${esc(nx.title)}</h2><p>${fmtDate(nx.date,nx.time)} &middot; ${esc(nx.venue)}</p></div><button class="btn" style="background:#14193a;color:#fff" data-toggle="${nx.id}" ${S.mine.includes(nx.id)||nx.reg>=nx.cap?'disabled':''}>${S.mine.includes(nx.id)?'You’re registered':nx.reg>=nx.cap?'Event full':'Register now'}</button></div>`:''}
  <div class="bars"><h3 style="margin-bottom:8px">Events by category</h3>
  ${counts.map(([k,n])=>`<div class="bar"><span>${CATS[k]}</span><div class="track"><div class="fill" style="width:${n/mx*100}%;background:var(--c-${k})"></div></div><b>${n}</b></div>`).join('')}</div>`;
 },
 events(){
  const l=sorted(S.events).filter(e=>(cat==='all'||e.cat===cat)&&(e.title+e.venue+e.desc).toLowerCase().includes(q.toLowerCase()));
  return `<div class="top"><h1>All events</h1></div>
  <div class="filters"><input id="q" type="search" placeholder="Search by name or venue" value="${esc(q)}" aria-label="Search events">
  <select id="cat" aria-label="Category"><option value="all">All categories</option>${Object.entries(CATS).map(([k,v])=>`<option value="${k}" ${cat===k?'selected':''}>${v}</option>`).join('')}</select></div>
  ${l.length?`<div class="grid">${l.map(e=>card(e)).join('')}</div>`:`<div class="empty">No events match your search. Try a different word or category.</div>`}`;
 },
 mine(){
  const l=sorted(S.events.filter(e=>S.mine.includes(e.id)));
  return `<div class="top"><h1>My registrations</h1></div>
  ${l.length?`<div class="table"><table><thead><tr><th>Event</th><th>When</th><th>Venue</th><th></th></tr></thead><tbody>
  ${l.map(e=>`<tr><td><b>${esc(e.title)}</b></td><td>${fmtDate(e.date,e.time)}</td><td>${esc(e.venue)}</td><td><button class="btn warn small" data-toggle="${e.id}">Cancel</button></td></tr>`).join('')}</tbody></table></div>`
  :`<div class="empty">You haven’t registered for any events yet. Open All events to find one.</div>`}`;
 },
 manage(){
  const l=sorted(S.events);
  return `<div class="top"><h1>Manage events</h1><button class="btn" data-new>Create event</button></div>
  ${l.length?`<div class="grid">${l.map(e=>card(e,'manage')).join('')}</div>`:`<div class="empty">No events yet. Create your first event to get started.</div>`}`;
 }
};

function render(){
  document.querySelectorAll('#nav button').forEach(b=>b.setAttribute('aria-current',b.dataset.v===view));
  $('#view').innerHTML=views[view]();
}

$('#nav').onclick=e=>{const b=e.target.closest('button');if(b){view=b.dataset.v;render()}};
$('#view').addEventListener('input',e=>{if(e.target.id==='q'){q=e.target.value;const p=e.target.selectionStart;render();const i=$('#q');i.focus();i.setSelectionRange(p,p)}});
$('#view').addEventListener('change',e=>{if(e.target.id==='cat'){cat=e.target.value;render()}});
$('#view').addEventListener('click',e=>{
  const t=e.target.closest('button');if(!t)return;
  if(t.dataset.new!==undefined)openForm();
  else if(t.dataset.edit)openForm(+t.dataset.edit);
  else if(t.dataset.del){const ev=S.events.find(x=>x.id==t.dataset.del);if(confirm('Delete “'+ev.title+'”? This cannot be undone.')){S.events=S.events.filter(x=>x.id!==ev.id);S.mine=S.mine.filter(i=>i!==ev.id);save();render();toast('Event deleted')}}
  else if(t.dataset.toggle){
    const ev=S.events.find(x=>x.id==t.dataset.toggle);
    if(S.mine.includes(ev.id)){S.mine=S.mine.filter(i=>i!==ev.id);ev.reg=Math.max(0,ev.reg-1);toast('Registration cancelled')}
    else if(ev.reg<ev.cap){S.mine.push(ev.id);ev.reg++;toast('Registered for '+ev.title)}
    save();render();
  }
});

function openForm(id){
  editId=id||null;const f=$('#form');f.reset();
  $('#dlgTitle').textContent=id?'Edit event':'Create event';
  if(id){const e=S.events.find(x=>x.id===id);['title','cat','cap','date','time','venue','desc'].forEach(k=>f.elements[k].value=e[k])}
  $('#dlg').showModal();
}
$('#cancel').onclick=()=>$('#dlg').close();
$('#form').onsubmit=e=>{
  e.preventDefault();const f=e.target,d={};
  ['title','cat','date','time','venue','desc'].forEach(k=>d[k]=f.elements[k].value.trim());
  d.cap=+f.elements.cap.value;
  if(editId){const ev=S.events.find(x=>x.id===editId);if(d.cap<ev.reg){toast('Seats can’t be fewer than the '+ev.reg+' already registered');return}Object.assign(ev,d);toast('Event updated')}
  else{S.events.push({id:S.next++,reg:0,...d});toast('Event created')}
  save();$('#dlg').close();render();
};
if(USER){$('#uname').textContent=USER.name;$('#uemail').textContent=USER.email}
$('#logout').onclick=()=>Auth.logout();
render();
