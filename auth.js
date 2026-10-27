/* GatherUp auth — front-end only demo.
   Accounts live in this browser's localStorage. Passwords are salted + hashed
   (SHA-256), but with no server this is NOT real security. For production,
   move register/login to a backend and use secure, HTTP-only session cookies. */
(()=>{
const UK='gatherup_users',SK='gatherup_session';
const read=(store,key)=>{try{return JSON.parse(store.getItem(key))}catch(e){return null}};
const write=(store,key,val)=>{try{store.setItem(key,JSON.stringify(val))}catch(e){}};
const users=()=>read(localStorage,UK)||[];
const norm=e=>String(e||'').trim().toLowerCase();
const hex=buf=>Array.from(new Uint8Array(buf),x=>x.toString(16).padStart(2,'0')).join('');
const newSalt=()=>hex(crypto.getRandomValues(new Uint8Array(12)));

async function hash(pw,salt){
  const data=new TextEncoder().encode(salt+':'+pw);
  if(window.crypto&&crypto.subtle)return hex(await crypto.subtle.digest('SHA-256',data));
  let h=5381;for(const b of data)h=((h<<5)+h+b)>>>0;   // fallback for very old/insecure contexts
  return 'x'+h.toString(16);
}

function setSession(u,remember){
  const s={email:u.email,name:u.name};
  try{sessionStorage.removeItem(SK);localStorage.removeItem(SK)}catch(e){}
  write(remember?localStorage:sessionStorage,SK,s);
}

const Auth={
  current(){
    const s=read(sessionStorage,SK)||read(localStorage,SK);
    if(!s)return null;
    const u=users().find(x=>x.email===s.email);   // session is only valid if the account still exists
    return u?{email:u.email,name:u.name}:null;
  },
  async register({name,email,password}){
    email=norm(email);name=String(name).trim();
    if(users().some(u=>u.email===email))throw new Error('An account with this email already exists. Try logging in instead.');
    const salt=newSalt(),u={id:Date.now().toString(36),name,email,salt,hash:await hash(password,salt),created:new Date().toISOString()};
    write(localStorage,UK,[...users(),u]);
    setSession(u,false);
    return u;
  },
  async login({email,password,remember}){
    email=norm(email);
    const u=users().find(x=>x.email===email);
    if(!u||u.hash!==await hash(password,u.salt))throw new Error('Incorrect email or password.');
    setSession(u,remember);
    return u;
  },
  logout(){
    try{sessionStorage.removeItem(SK);localStorage.removeItem(SK)}catch(e){}
    location.replace('login.html');
  },
  guard(){if(!Auth.current())location.replace('login.html')}
};
window.Auth=Auth;

/* ---------- page wiring (login.html / register.html) ---------- */
const $=s=>document.querySelector(s);
if(document.body.classList.contains('auth')){
  if(Auth.current())location.replace('index.html');   // already signed in

  document.querySelectorAll('[data-peek]').forEach(b=>b.addEventListener('click',()=>{
    const inp=b.parentElement.querySelector('input'),show=inp.type==='password';
    inp.type=show?'text':'password';b.textContent=show?'Hide':'Show';
    b.setAttribute('aria-pressed',show);
  }));

  const err=m=>{const e=$('#err');e.textContent=m||''};
  const busy=(f,on)=>{const b=f.querySelector('[type=submit]');b.disabled=on;b.dataset.label=b.dataset.label||b.textContent;b.textContent=on?'Please wait…':b.dataset.label};

  const lf=$('#loginForm');
  if(lf)lf.addEventListener('submit',async e=>{
    e.preventDefault();err('');busy(lf,true);
    try{
      await Auth.login({email:lf.email.value,password:lf.password.value,remember:lf.remember.checked});
      location.replace('index.html');
    }catch(x){err(x.message);busy(lf,false);lf.password.focus()}
  });

  const rf=$('#regForm');
  if(rf)rf.addEventListener('submit',async e=>{
    e.preventDefault();err('');
    if(rf.password.value.length<8)return err('Password must be at least 8 characters.'),rf.password.focus();
    if(rf.password.value!==rf.confirm.value)return err('The two passwords don’t match.'),rf.confirm.focus();
    busy(rf,true);
    try{
      await Auth.register({name:rf.name.value,email:rf.email.value,password:rf.password.value});
      location.replace('index.html');
    }catch(x){err(x.message);busy(rf,false);rf.email.focus()}
  });
}
})();
