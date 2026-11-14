/* ==========================================================
   KOHA – js/app.js : giao diện, dữ liệu, điều hướng
   ========================================================== */
/* ===== HELPERS ===== */
const API='https://phimapi.com',$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const cache={};let hls=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const get=async p=>{const r=await fetch(API+p);if(!r.ok)throw Error('HTTP '+r.status);return r.json()};
function norm(j){const d=j.data||j;if(d.APP_DOMAIN_CDN_IMAGE)CDN=d.APP_DOMAIN_CDN_IMAGE.replace(/\/$/,'');
 const items=d.items||[];if(items[0]&&!imgSample)imgSample=items[0];items.forEach(m=>cache[m.slug]=m);return{items,total:d.params?.pagination?.totalPages||d.pagination?.totalPages||1}}
const store={get:k=>{try{return JSON.parse(localStorage.getItem(k))||[]}catch{return[]}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
let tt;function toast(t,ms=2200){const e=$('#toast');e.textContent=t;e.classList.add('o');clearTimeout(tt);tt=setTimeout(()=>e.classList.remove('o'),ms)}
const inList=s=>store.get('koha_list').some(m=>m.slug===s);
function toggleList(s){let l=store.get('koha_list');const m=cache[s];
 if(inList(s)){l=l.filter(x=>x.slug!==s);toast('Đã xóa khỏi danh sách của tôi')}
 else if(m){l.unshift({slug:s,name:m.name,origin_name:m.origin_name,poster_url:m.poster_url,thumb_url:m.thumb_url,year:m.year});toast('Đã thêm vào danh sách của tôi')}
 store.set('koha_list',l);$$(`.card[data-s="${s}"] .add,.mbtn[data-s="${s}"]`).forEach(b=>{b.classList.toggle('y',inList(s));if(b.classList.contains('mbtn'))b.textContent=inList(s)?'✓ Trong danh sách':'＋ Danh sách'})}

/* ===== CARD & ROW ===== */
const card=(m,rank)=>{const raw=rawOf(m);return `<article class="card" data-s="${esc(m.slug)}" tabindex="0" aria-label="${esc(m.name)}">${rank?`<b class="rank">${rank}</b>`:''}
 <div class="pz"><div class="sk"></div><img referrerpolicy="no-referrer" src="${esc(img(raw))}" data-raw="${esc(raw)}" alt="${esc(m.name)}" onload="this.classList.add('ld')" onerror="fx(this)">
 <div class="ov"><h4>${esc(m.name)}</h4><small>${esc([m.year,m.episode_current,m.quality].filter(Boolean).join(' • '))}</small>
 <div class="act"><span class="pl rip" aria-label="Xem">▶</span><button class="add ${inList(m.slug)?'y':''}" aria-label="Thêm vào danh sách">${'＋'}</button></div></div></div></article>`};
const rowHTML=(t,items,top,cls='')=>items.length?`<section class="row rv ${top?'top':''} ${cls}"><h2>${t}</h2><div class="rw"><button class="ar l" aria-label="Trước">‹</button><div class="track">${items.slice(0,top?10:20).map((m,i)=>card(m,top&&i+1)).join('')}</div><button class="ar r" aria-label="Sau">›</button></div></section>`:'';

/* ===== HOME ===== */
const ROWS=[['Hành động','/v1/api/the-loai/hanh-dong'],['Tình cảm','/v1/api/the-loai/tinh-cam'],['Kinh dị','/v1/api/the-loai/kinh-di'],['Hoạt hình','/v1/api/danh-sach/hoat-hinh'],['Phim Hàn','/v1/api/quoc-gia/han-quoc'],['Phim bộ nổi bật','/v1/api/danh-sach/phim-bo']];
let hero={i:0,list:[],t:0};
async function home(){
 const app=$('#app');app.innerHTML='<div class="empty">Đang tải…</div>';
 try{
  const {items}=norm(await get('/danh-sach/phim-moi-cap-nhat-v3?page=1'));
  hero.list=items.slice(0,5);
  const det=await Promise.all(hero.list.map(m=>get('/phim/'+m.slug).then(j=>j.movie).catch(()=>null)));
  app.innerHTML=`<section class="hero" id="hero" aria-roledescription="carousel">${hero.list.map((m,i)=>{const d=det[i]||m;const bg=rawOf(d,true);const sc=d.tmdb?.vote_average;
   return `<div class="slide" data-i="${i}"><div class="bg" data-raw="${esc(bg)}"></div><div class="hc">
   <div class="tags"><span class="tag h">${esc(d.quality||'HD')}</span>${d.year?`<span class="tag">${esc(d.year)}</span>`:''}${d.time?`<span class="tag">${esc(d.time)}</span>`:''}${sc?`<span class="tag">⭐ IMDb ${(+sc).toFixed(1)}</span>`:''}</div>
   <h1>${esc(m.name)}</h1><div class="tags" style="margin-bottom:12px"><span style="color:#f9c97a">${esc(m.origin_name||'')}</span></div>
   <p>${esc((d.content||'').replace(/<[^>]+>/g,''))}</p>
   <div class="hbtn"><button class="btn p mag" data-open="${esc(m.slug)}" data-play="1">▶ Xem ngay</button><button class="btn g mag" data-open="${esc(m.slug)}">ⓘ Thông tin</button></div></div></div>`}).join('')}
   <div class="dots">${hero.list.map((_,i)=>`<button data-d="${i}" aria-label="Slide ${i+1}"><i></i></button>`).join('')}</div></section>
   <div class="rows" id="rows"></div>`;
  heroGo(0);bindTracks();$$('.slide .bg').forEach(b=>pick(b.dataset.raw).then(u=>u&&(b.style.backgroundImage=`url('${u}')`)));
  const cont=store.get('koha_cont'),mine=store.get('koha_list'),rows=$('#rows');
  rows.insertAdjacentHTML('beforeend',rowHTML('Đang thịnh hành',items,true));
  if(cont.length){cont.forEach(m=>cache[m.slug]=m);rows.insertAdjacentHTML('beforeend',rowHTML('Tiếp tục xem',cont))}
  if(mine.length){mine.forEach(m=>cache[m.slug]=m);rows.insertAdjacentHTML('beforeend',rowHTML('Danh sách của tôi',mine))}
  observe();
  for(const [t,p] of ROWS){get(p).then(j=>{rows.insertAdjacentHTML('beforeend',rowHTML(t,norm(j).items));observe()}).catch(()=>{})}
 }catch(e){app.innerHTML=`<div class="empty">Không tải được dữ liệu (${esc(e.message)}).<br>Hãy kiểm tra mạng rồi <button class="btn g sm" onclick="home()">thử lại</button></div>`}
}
function heroGo(i){const n=hero.list.length;if(!n)return;hero.i=(i+n)%n;
 $$('.slide').forEach((s,k)=>s.classList.toggle('on',k===hero.i));
 $$('.dots button').forEach((b,k)=>{b.classList.remove('on','d');void b.offsetWidth;if(k<hero.i)b.classList.add('d');if(k===hero.i)b.classList.add('on')});
 clearTimeout(hero.t);hero.t=setTimeout(()=>heroGo(hero.i+1),6000)}
document.addEventListener('keydown',e=>{if(!$('#hero')||$('#md.o')||e.target.matches('input'))return;if(e.key==='ArrowRight')heroGo(hero.i+1);if(e.key==='ArrowLeft')heroGo(hero.i-1)});
let sx=0;document.addEventListener('touchstart',e=>sx=e.touches[0].clientX,{passive:true});
document.addEventListener('touchend',e=>{const h=e.target.closest?.('#hero');if(!h)return;const d=e.changedTouches[0].clientX-sx;if(Math.abs(d)>50)heroGo(hero.i+(d<0?1:-1))},{passive:true});
$('#app').addEventListener('mousemove',e=>{const h=e.target.closest('.hero');if(!h)return;const x=(e.clientX/innerWidth-.5)*-16,y=(e.clientY/innerHeight-.5)*-10;$('.slide.on .bg',h).style.translate=`${x}px ${y}px`});
addEventListener('scroll',()=>{$('#hd').classList.toggle('s',scrollY>40);const b=$('.slide.on .hc');if(b&&scrollY<innerHeight)b.style.translate=`0 ${scrollY*.12}px`},{passive:true});

/* ===== TRACKS: drag, arrows, reveal ===== */
function bindTracks(){document.addEventListener('click',e=>{const a=e.target.closest('.ar');if(!a)return;const t=$('.track',a.parentElement);t.scrollBy({left:(a.classList.contains('r')?1:-1)*t.clientWidth*.8,behavior:'smooth'})},{once:false,capture:false})}
let drag=null,moved=false;
document.addEventListener('pointerdown',e=>{const t=e.target.closest('.track');if(!t||e.pointerType==='touch')return;drag={t,x:e.clientX,l:t.scrollLeft};moved=false});
addEventListener('pointermove',e=>{if(!drag)return;const d=e.clientX-drag.x;if(Math.abs(d)>5){moved=true;drag.t.classList.add('dr')}if(moved)drag.t.scrollLeft=drag.l-d});
addEventListener('pointerup',()=>{if(drag)drag.t.classList.remove('dr');drag=null});
document.addEventListener('click',e=>{if(moved){e.stopPropagation();e.preventDefault();moved=false}},true);
let io;function observe(){io??=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}}),{threshold:.08});$$('.rv:not(.in)').forEach(el=>io.observe(el))}

/* ===== LIST VIEWS ===== */
let vw={path:'',page:1,title:''};
async function view(path,title,reset=true){
 if(path==='home'){hero.list=[];$$('.bn button,nav button').forEach(b=>b.classList.toggle('on',b.dataset.v==='home'));scrollTo(0,0);return home()}
 clearTimeout(hero.t);
 if(reset){vw={path,page:1,title};$('#app').innerHTML=`<div class="view"><h1>${esc(title)}</h1><div class="gr" id="gr"></div><div class="empty" id="st">Đang tải…</div></div>`;scrollTo(0,0)}
 $$('.bn button,nav>button').forEach(b=>b.classList.toggle('on',b.dataset.v===path));
 try{
  const sep=path.includes('?')?'&':'?';const {items,total}=norm(await get(path+sep+'page='+vw.page));
  $('#gr').insertAdjacentHTML('beforeend',items.map(m=>card(m)).join(''));
  const st=$('#st');st.innerHTML=!$('#gr').children.length?'Không tìm thấy phim phù hợp. Hãy thử từ khóa hoặc mục khác.':(vw.page<total?'<button class="btn g more" id="mr">Xem thêm</button>':'');
  const mr=$('#mr');if(mr)mr.onclick=()=>{vw.page++;view(path,title,false)};
 }catch(e){$('#st').innerHTML=`Không tải được dữ liệu (${esc(e.message)}). <button class="btn g sm" onclick="view(vw.path,vw.title,false)">Thử lại</button>`}
}
function showMine(){clearTimeout(hero.t);const l=store.get('koha_list');l.forEach(m=>cache[m.slug]=m);
 $('#app').innerHTML=`<div class="view"><h1>Danh sách của tôi</h1>${l.length?`<div class="gr">${l.map(m=>card(m)).join('')}</div>`:'<div class="empty">Chưa có phim nào. Bấm ＋ trên poster để lưu phim bạn muốn xem.</div>'}</div>`;scrollTo(0,0)}

/* ===== MODAL & PLAYER ===== */
async function openMovie(slug,autoplay,origin){
 const md=$('#md');md.classList.add('o');document.body.style.overflow='hidden';
 if(origin){const r=origin.getBoundingClientRect();md.firstElementChild?.style&&(md.firstElementChild.style.transformOrigin=`${r.left+r.width/2}px ${r.top+r.height/2}px`)}
 md.innerHTML='<div class="mi"><div class="empty">Đang tải…</div></div>';
 try{
  const j=await get('/phim/'+encodeURIComponent(slug)),m=j.movie;if(!m)throw Error('Không có dữ liệu');cache[slug]??=m;
  const eps=(j.episodes||[]).filter(s=>s.server_data?.length),nm=a=>(a||[]).map(x=>esc(x.name||x)).join(', ')||'—';
  const bg=rawOf(m,true);
  md.innerHTML=`<div class="mi"><div class="mh" id="mh"></div><button class="x" aria-label="Đóng" id="mx">✕</button>
  <div class="mb"><div class="tags"><span class="tag h">${esc(m.quality||'HD')}</span>${[m.lang,m.year,m.time,m.episode_current].filter(Boolean).map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</div>
  <h2 style="margin-top:10px">${esc(m.name)}</h2><div class="o2">${esc(m.origin_name||'')}</div>
  <div class="hbtn"><button class="btn p" id="pp">▶ Xem phim</button><button class="btn g mbtn" data-s="${esc(slug)}">${inList(slug)?'✓ Trong danh sách':'＋ Danh sách'}</button></div>
  <div class="inf"><div><p class="dsc">${esc((m.content||'').replace(/<[^>]+>/g,''))}</p></div><div><p><b>Diễn viên:</b> ${nm(m.actor)}</p><p><b>Đạo diễn:</b> ${nm(m.director)}</p><p><b>Thể loại:</b> ${nm(m.category)}</p><p><b>Quốc gia:</b> ${nm(m.country)}</p></div></div>
  <div id="pa">${eps.length?'':'<div class="empty">Phim này chưa có tập để phát.</div>'}</div>
  <h3 style="margin-top:26px">Phim tương tự</h3><div class="sim" id="sim"></div></div></div>`;
  pick(bg).then(u=>u&&$('#mh')&&($('#mh').style.backgroundImage=`url('${u}')`));$('#mx').onclick=closeModal;$('#pp').onclick=()=>{if(eps.length){player(eps,m);$('#pa').scrollIntoView({behavior:'smooth',block:'center'})}else toast('Chưa có nguồn phát')};
  if(autoplay&&eps.length)player(eps,m);
  const c=m.category?.[0]?.slug;if(c)get('/v1/api/the-loai/'+c).then(r=>{$('#sim').innerHTML=norm(r).items.filter(x=>x.slug!==slug).slice(0,8).map(x=>card(x)).join('')}).catch(()=>{});
 }catch(e){md.innerHTML=`<div class="mi"><div class="empty">Không tải được phim (${esc(e.message)}).</div></div>`}
}
function closeModal(){$('#md').classList.remove('o');$('#md').innerHTML='';document.body.style.overflow='';document.body.classList.remove('th');if(hls){hls.destroy();hls=null}}
function player(eps,m){let si=0,ei=0;const pa=$('#pa');
 pa.innerHTML=`<div class="ctl"><select id="sv" aria-label="Server">${eps.map((s,i)=>`<option value="${i}">${esc(s.server_name)}</option>`).join('')}</select><select id="mo" aria-label="Trình phát"><option value="e">Trình phát nhúng</option><option value="h">Trình phát KOHA (HLS)</option></select><button class="btn g sm" id="th">🎭 Chế độ rạp</button></div><div class="eps" id="ep"></div><div class="pw" id="pw"></div>`;
 const run=()=>{const e=eps[si].server_data[ei],pw=$('#pw');if(hls){hls.destroy();hls=null}
  $$('#ep button').forEach((b,i)=>b.classList.toggle('on',i===ei));
  if($('#mo').value==='h'&&e.link_m3u8){mountPlayer(pw,e.link_m3u8)}
  else pw.innerHTML=e.link_embed?`<iframe src="${esc(e.link_embed)}" allowfullscreen allow="autoplay; fullscreen"></iframe>`:'<div class="empty">Tập này chưa có nguồn phát.</div>';
  let c=store.get('koha_cont').filter(x=>x.slug!==m.slug);c.unshift({slug:m.slug,name:m.name,origin_name:m.origin_name,poster_url:m.poster_url,thumb_url:m.thumb_url,year:m.year,episode_current:e.name});store.set('koha_cont',c.slice(0,12))};
 const lst=()=>{$('#ep').innerHTML=eps[si].server_data.map((e,i)=>`<button data-i="${i}">${esc(e.name)}</button>`).join('');run()};
 $('#ep').onclick=e=>{const b=e.target.closest('button');if(b){ei=+b.dataset.i;run()}};
 $('#sv').onchange=e=>{si=+e.target.value;ei=0;lst()};$('#mo').onchange=run;$('#th').onclick=()=>document.body.classList.toggle('th');lst()}
document.addEventListener('keydown',e=>{if(!$('#md.o'))return;if(e.key==='Escape')return closeModal();
 const v=$('#pw video');if(!v||e.target.matches('input,select'))return;
 if(e.key===' '){e.preventDefault();v.paused?v.play():v.pause()}else if(e.key==='ArrowRight')v.currentTime+=10;else if(e.key==='ArrowLeft')v.currentTime-=10;
 else if(e.key==='f'||e.key==='F')fs();else if(e.key==='m'||e.key==='M')v.muted=!v.muted});
$('#md').addEventListener('click',e=>{if(e.target.id==='md')closeModal()});

/* ===== GLOBAL CLICKS ===== */
document.addEventListener('click',e=>{
 const rip=e.target.closest('.rip');if(rip){const r=rip.getBoundingClientRect(),s=document.createElement('i');s.className='rp';const z=Math.max(r.width,r.height);s.style.cssText=`width:${z}px;height:${z}px;left:${e.clientX-r.left-z/2}px;top:${e.clientY-r.top-z/2}px`;rip.appendChild(s);setTimeout(()=>s.remove(),600)}
 const add=e.target.closest('.add');if(add){e.stopPropagation();toggleList(add.closest('.card').dataset.s);return}
 const mb=e.target.closest('.mbtn');if(mb){toggleList(mb.dataset.s);return}
 const op=e.target.closest('[data-open]');if(op){openMovie(op.dataset.open,!!op.dataset.play,op);return}
 const c=e.target.closest('.card');if(c){openMovie(c.dataset.s,!!e.target.closest('.rip'),c);return}
 const d=e.target.closest('.dots button');if(d){heroGo(+d.dataset.d);return}
 const v=e.target.closest('[data-v]');if(v){e.preventDefault();$('#nav').classList.remove('o');view(v.dataset.v,v.dataset.t||'')}
 const g=e.target.closest('[data-g]');if(g){$('#nav').classList.remove('o');view(g.dataset.g,(g.dataset.p||'')+g.textContent)}
});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.classList?.contains('card'))openMovie(e.target.dataset.s)});
$('#bg').onclick=()=>$('#nav').classList.toggle('o');
$('#mine').onclick=showMine;$('#bm').onclick=showMine;$('#login').onclick=()=>toast('Đăng nhập chưa khả dụng trong bản demo');
$('#dd').innerHTML=[['hanh-dong','Hành động'],['tinh-cam','Tình cảm'],['kinh-di','Kinh dị'],['hai-huoc','Hài hước'],['co-trang','Cổ trang'],['vien-tuong','Viễn tưởng'],['phieu-luu','Phiêu lưu'],['tam-ly','Tâm lý'],['hinh-su','Hình sự'],['chien-tranh','Chiến tranh'],['than-thoai','Thần thoại'],['vo-thuat','Võ thuật']].map(([s,n])=>`<button data-g="/v1/api/the-loai/${s}">${n}</button>`).join('');

/* ===== SEARCH ===== */
const sb=$('#sb'),q=$('#q'),sug=$('#sug');let st;
const openS=()=>{sb.classList.add('o');q.focus()};
$('#sbt').onclick=()=>sb.classList.contains('o')&&q.value?view('/v1/api/tim-kiem?keyword='+encodeURIComponent(q.value),'Kết quả cho “'+q.value+'”'):openS();
$('#bs').onclick=openS;
q.addEventListener('input',()=>{clearTimeout(st);const v=q.value.trim();if(v.length<2){sug.classList.remove('o');return}
 st=setTimeout(async()=>{try{const {items}=norm(await get('/v1/api/tim-kiem?keyword='+encodeURIComponent(v)));
  sug.innerHTML=items.slice(0,6).map(m=>`<a data-open="${esc(m.slug)}"><img referrerpolicy="no-referrer" src="${esc(img(rawOf(m)))}" data-raw="${esc(rawOf(m))}" alt="" onerror="fx(this)"><div><div>${esc(m.name)}</div><small>${esc(m.origin_name||'')} ${m.year?'• '+esc(m.year):''}</small></div></a>`).join('')||'<div class="empty" style="padding:20px">Không có kết quả</div>';sug.classList.add('o')}catch{}},300)});
q.addEventListener('keydown',e=>{if(e.key==='Enter'&&q.value.trim()){sug.classList.remove('o');view('/v1/api/tim-kiem?keyword='+encodeURIComponent(q.value.trim()),'Kết quả cho “'+q.value.trim()+'”')}if(e.key==='Escape'){sug.classList.remove('o');sb.classList.remove('o')}});
document.addEventListener('click',e=>{if(!e.target.closest('#sb,#sug,#bs')){sug.classList.remove('o');if(!q.value)sb.classList.remove('o')}});

/* ===== CURSOR & MAGNETIC ===== */
if(matchMedia('(pointer:fine)').matches){const c=$('#cur');let x=0,y=0,tx=0,ty=0;
 addEventListener('mousemove',e=>{tx=e.clientX;ty=e.clientY;c.classList.toggle('h',!!e.target.closest('a,button,.card,input,select'));
  const m=e.target.closest('.mag');if(m){const r=m.getBoundingClientRect();m.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.25}px,${(e.clientY-r.top-r.height/2)*.35}px)`}
  const p=e.target.closest('.pz');if(p&&!matchMedia('(prefers-reduced-motion:reduce)').matches){const r=p.getBoundingClientRect(),dx=(e.clientX-r.left)/r.width-.5,dy=(e.clientY-r.top)/r.height-.5;p.style.transform=`perspective(700px) rotateY(${dx*12}deg) rotateX(${-dy*12}deg) scale(1.08)`}});
 document.addEventListener('mouseout',e=>{const m=e.target.closest('.mag');if(m)m.style.transform='';const p=e.target.closest('.pz');if(p)p.style.transform=''});
 (function f(){x+=(tx-x)*.18;y+=(ty-y)*.18;c.style.transform=`translate3d(${x}px,${y}px,0)`;requestAnimationFrame(f)})()}

/* ===== MENUS: thể loại / quốc gia / năm từ API ===== */
const arr=j=>Array.isArray(j)?j:(j?.data?.items||j?.data||j?.items||[]);
const btns=(l,pre,path)=>l.map(x=>`<button data-g="${path}${esc(x.slug)}" data-p="${pre}">${esc(x.name)}</button>`).join('');
$('#dc').innerHTML=btns([['trung-quoc','Trung Quốc'],['han-quoc','Hàn Quốc'],['nhat-ban','Nhật Bản'],['thai-lan','Thái Lan'],['au-my','Âu Mỹ'],['viet-nam','Việt Nam'],['dai-loan','Đài Loan'],['hong-kong','Hồng Kông'],['an-do','Ấn Độ']].map(([slug,name])=>({slug,name})),'Quốc gia: ','/v1/api/quoc-gia/');
const yrs=y=>y.slice(0,24).map(v=>{const n=typeof v==='object'?(v.year??v.name??v.slug):v;return `<button data-g="/v1/api/nam/${esc(n)}" data-p="Năm ">${esc(n)}</button>`}).join('');
$('#dy').innerHTML=yrs(Array.from({length:12},(_,i)=>2026-i));
(async()=>{
 try{const g=arr(await get('/the-loai'));if(g.length)$('#dd').innerHTML=btns(g,'Thể loại: ','/v1/api/the-loai/')}catch{}
 try{const c=arr(await get('/quoc-gia'));if(c.length)$('#dc').innerHTML=btns(c,'Quốc gia: ','/v1/api/quoc-gia/')}catch{}
 try{const y=arr(await get('/nam-phat-hanh'));if(y.length)$('#dy').innerHTML=yrs(y)}catch{}
})();

/* ===== START ===== */
home();
setTimeout(()=>$('#loader').classList.add('go'),1900);
setTimeout(()=>$('#loader').remove(),3000);
