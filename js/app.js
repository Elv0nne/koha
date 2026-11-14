/* KOHA Lite – js/app.js (JS thuần, không thư viện; hls.js chỉ nạp khi cần) */
const API='https://phimapi.com',$=s=>document.querySelector(s),app=$('#app');
let cdn='https://phimimg.com',hls=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const strip=s=>String(s||'').replace(/<[^>]+>/g,'');
const get=async p=>{const r=await fetch(API+p);if(!r.ok)throw Error('HTTP '+r.status);return r.json()};
const store={get:k=>{try{return JSON.parse(localStorage.getItem(k))||[]}catch{return[]}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
let tt;const toast=t=>{const e=$('#toast');e.textContent=t;e.style.display='block';clearTimeout(tt);tt=setTimeout(()=>e.style.display='none',2000)};

/* ---------- Ảnh: đường dẫn tương đối ghép với CDN; lỗi thì thử /upload/vod/, rồi proxy phimapi, rồi hiện tên phim ---------- */
const raw=(m,wide)=>(wide?m.thumb_url||m.poster_url:m.poster_url||m.thumb_url)||'';
const imgUrl=u=>!u?'':/^https?:/.test(u)?u:cdn+'/'+u.replace(/^\//,'');
function imgErr(el){
  const n=+el.dataset.n||0,r=el.dataset.raw||'';el.dataset.n=n+1;
  if(!r)return noimg(el);
  if(n===0&&!/^https?:|^upload/.test(r))el.src=cdn+'/upload/vod/'+r.replace(/^\//,'');
  else if(n<2)el.src=API+'/image.php?url='+encodeURIComponent(imgUrl(r));
  else noimg(el);
}
function noimg(el){el.removeAttribute('src');el.style.display='none';el.parentNode.classList.add('noimg')}
const imgTag=(m,wide,cls='')=>{const r=raw(m,wide);return r?`<img ${cls}src="${esc(imgUrl(r))}" data-raw="${esc(r)}" alt="${esc(m.name)}" decoding="async" onerror="imgErr(this)">`:''};

/* ---------- Dữ liệu ---------- */
function norm(j){
  const d=j.data||j;if(d.APP_DOMAIN_CDN_IMAGE)cdn=d.APP_DOMAIN_CDN_IMAGE.replace(/\/$/,'');
  const p=d.params?.pagination||d.pagination||{};
  return{items:d.items||[],total:p.totalPages||(p.totalItems&&p.totalItemsPerPage?Math.ceil(p.totalItems/p.totalItemsPerPage):1)};
}
const card=m=>`<a class="card" href="#/phim/${esc(m.slug)}"><div class="poster" data-t="${esc(m.name)}">${imgTag(m,false,'loading="lazy" ')}${m.episode_current?`<span class="tag">${esc(m.episode_current)}</span>`:''}</div><h3>${esc(m.name)}</h3><small>${esc([m.origin_name,m.year].filter(Boolean).join(' · '))}</small></a>`;
const pager=(base,p,t)=>t<=1?'':`<div class="pager"><a class="btn ${p<=1?'off':''}" href="${base}/${p-1}">Trước</a><span>Trang ${p}/${t}</span><a class="btn ${p>=t?'off':''}" href="${base}/${p+1}">Sau</a></div>`;
const fail=e=>app.innerHTML=`<div class="msg">Không tải được dữ liệu (${esc(e.message)}).<br>Kiểm tra mạng rồi <a class="btn" href="javascript:route()">thử lại</a></div>`;

/* ---------- Menu ---------- */
const TYPES=[['moi','Mới cập nhật'],['danh-sach/phim-le','Phim lẻ'],['danh-sach/phim-bo','Phim bộ'],['danh-sach/hoat-hinh','Hoạt hình'],['danh-sach/tv-shows','TV Shows']];
const GENRES=[['hanh-dong','Hành động'],['tinh-cam','Tình cảm'],['kinh-di','Kinh dị'],['hai-huoc','Hài hước'],['co-trang','Cổ trang'],['vien-tuong','Viễn tưởng'],['phieu-luu','Phiêu lưu'],['tam-ly','Tâm lý'],['hinh-su','Hình sự'],['chien-tranh','Chiến tranh'],['than-thoai','Thần thoại'],['vo-thuat','Võ thuật']];
const COUNTRIES=[['trung-quoc','Trung Quốc'],['han-quoc','Hàn Quốc'],['nhat-ban','Nhật Bản'],['thai-lan','Thái Lan'],['au-my','Âu Mỹ'],['viet-nam','Việt Nam'],['dai-loan','Đài Loan'],['hong-kong','Hồng Kông'],['an-do','Ấn Độ']];
const YEARS=Array.from({length:17},(_,i)=>[String(2026-i),String(2026-i)]);
const LABEL=Object.fromEntries([...GENRES,...COUNTRIES,...YEARS,['phim-le','Phim lẻ'],['phim-bo','Phim bộ'],['hoat-hinh','Hoạt hình'],['tv-shows','TV Shows']]);
function buildNav(cur){
  const sel=(label,kind,list)=>`<select aria-label="${label}" onchange="this.value&&(location.hash='#/${kind}/'+this.value+'/1')"><option value="">${label}</option>${list.map(([s,n])=>`<option value="${s}" ${cur===kind+'/'+s?'selected':''}>${n}</option>`).join('')}</select>`;
  $('#nav').innerHTML=TYPES.map(([s,n])=>`<a href="#/${s}${s==='moi'?'/1':'/1'}" class="${cur===s?'on':''}">${n}</a>`).join('')
    +sel('Thể loại','the-loai',GENRES)+sel('Quốc gia','quoc-gia',COUNTRIES)+sel('Năm','nam',YEARS)
    +`<a href="#/yeu-thich" class="${cur==='fav'?'on':''}">♡ Yêu thích</a>`;
}

/* ---------- Trang chủ ---------- */
let hl=[],hi=0;const dcache={};
const ROWS=[['Hành động','/v1/api/the-loai/hanh-dong','#/the-loai/hanh-dong/1'],['Tình cảm','/v1/api/the-loai/tinh-cam','#/the-loai/tinh-cam/1'],['Hoạt hình','/v1/api/danh-sach/hoat-hinh','#/danh-sach/hoat-hinh/1'],['Phim Hàn','/v1/api/quoc-gia/han-quoc','#/quoc-gia/han-quoc/1'],['Phim bộ','/v1/api/danh-sach/phim-bo','#/danh-sach/phim-bo/1'],['Kinh dị','/v1/api/the-loai/kinh-di','#/the-loai/kinh-di/1']];
const rowHTML=(t,href,items,path)=>`<section class="row" ${path?`data-p="${path}"`:''}><div class="rh"><h2>${t}</h2><a href="${href}">Xem tất cả</a></div><div class="track">${items?items.slice(0,16).map(card).join(''):''}</div></section>`;
let io;
async function home(){
  app.innerHTML='<div class="msg">Đang tải…</div>';
  try{
    const {items}=norm(await get('/danh-sach/phim-moi-cap-nhat-v3?page=1'));
    hl=items.slice(0,5);
    const hist=store.get('koha_hist');
    app.innerHTML=`<section class="hero" id="hero"></section>`
      +(hist.length?rowHTML('Xem gần đây','#/yeu-thich',hist):'')
      +rowHTML('Mới cập nhật','#/moi/1',items)
      +ROWS.map(([t,p,h])=>rowHTML(t,h,null,p)).join('');
    showHero(0);
    io?.disconnect();
    io=new IntersectionObserver(es=>es.forEach(async x=>{
      if(!x.isIntersecting)return;io.unobserve(x.target);
      try{x.target.querySelector('.track').innerHTML=norm(await get(x.target.dataset.p)).items.slice(0,16).map(card).join('')}catch{}
    }),{rootMargin:'300px'});
    document.querySelectorAll('.row[data-p]').forEach(r=>io.observe(r));
  }catch(e){fail(e)}
}
async function showHero(i){
  hi=(i+hl.length)%hl.length;const m=hl[hi],h=$('#hero');if(!h||!m)return;
  h.innerHTML=`${imgTag(m,true,'class="hbg" ')}<div class="hc"><h1>${esc(m.name)}</h1><div class="chips">${[m.quality,m.year,m.episode_current].filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join('')}</div><p class="desc" id="hd"></p><div class="hb"><a class="btn p" href="#/phim/${esc(m.slug)}">▶ Xem ngay</a><button class="btn" aria-label="Phim trước" onclick="showHero(hi-1)">‹</button><button class="btn" aria-label="Phim sau" onclick="showHero(hi+1)">›</button></div></div>`;
  try{const d=dcache[m.slug]??=(await get('/phim/'+m.slug)).movie;if(hl[hi]===m&&$('#hd'))$('#hd').textContent=strip(d.content).slice(0,220)}catch{}
}

/* ---------- Danh sách ---------- */
async function list(kind,slug,page){
  let path,title,base;
  if(kind==='moi'){path=`/danh-sach/phim-moi-cap-nhat-v3?page=${page}`;title='Mới cập nhật';base='#/moi'}
  else if(kind==='tim-kiem'){path=`/v1/api/tim-kiem?keyword=${encodeURIComponent(slug)}&page=${page}`;title=`Kết quả cho “${slug}”`;base='#/tim-kiem/'+encodeURIComponent(slug)}
  else{path=`/v1/api/${kind}/${slug}?page=${page}`;title=({'the-loai':'Thể loại','quoc-gia':'Quốc gia','nam':'Năm'}[kind]?({'the-loai':'Thể loại: ','quoc-gia':'Quốc gia: ','nam':'Năm '}[kind]):'')+(LABEL[slug]||slug);base=`#/${kind}/${slug}`}
  app.innerHTML='<div class="msg">Đang tải…</div>';
  try{
    const {items,total}=norm(await get(path));
    app.innerHTML=`<h1 class="t">${esc(title)}</h1>`+(items.length?`<div class="grid">${items.map(card).join('')}</div>${pager(base,page,total)}`:'<div class="msg">Không có phim phù hợp. Hãy thử từ khóa hoặc mục khác.</div>');
  }catch(e){fail(e)}
}
function favs(){const l=store.get('koha_fav');app.innerHTML='<h1 class="t">Phim yêu thích</h1>'+(l.length?`<div class="grid">${l.map(card).join('')}</div>`:'<div class="msg">Chưa có phim nào. Bấm “♡ Yêu thích” ở trang phim để lưu.</div>')}

/* ---------- Chi tiết + trình phát ---------- */
let hlsP;const loadHls=()=>hlsP??=new Promise((ok,no)=>{if(window.Hls)return ok();const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.13/hls.min.js';s.onload=ok;s.onerror=no;document.head.appendChild(s)});
async function detail(slug){
  app.innerHTML='<div class="msg">Đang tải…</div>';
  try{
    const j=await get('/phim/'+encodeURIComponent(slug)),m=j.movie;if(!m)throw Error('Không có dữ liệu phim');
    const eps=(j.episodes||[]).filter(s=>s.server_data?.length),nm=a=>(a||[]).map(x=>esc(x.name||x)).join(', ')||'—';
    const isFav=()=>store.get('koha_fav').some(x=>x.slug===slug);
    app.innerHTML=`<div class="detail"><div class="poster" data-t="${esc(m.name)}">${imgTag(m,false)}</div><div class="info">
      <h1>${esc(m.name)}</h1><div class="o">${esc(m.origin_name||'')}</div>
      <div class="chips">${[m.quality,m.lang,m.year,m.time,m.episode_current].filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join('')}</div>
      <p><b>Thể loại:</b> ${nm(m.category)}</p><p><b>Quốc gia:</b> ${nm(m.country)}</p><p><b>Đạo diễn:</b> ${nm(m.director)}</p><p><b>Diễn viên:</b> ${nm(m.actor)}</p>
      <p class="desc">${esc(strip(m.content))}</p><button class="btn" id="fav"></button></div></div>
      <h2 class="s">Xem phim</h2>${eps.length?`<div class="ctl"><select id="sv" aria-label="Server">${eps.map((s,i)=>`<option value="${i}">${esc(s.server_name)}</option>`).join('')}</select><select id="mo" aria-label="Trình phát"><option value="e">Trình phát nhúng</option><option value="h">HLS (m3u8)</option></select></div><div class="eps" id="ep"></div><div class="pw" id="pw"></div>`:'<div class="msg">Phim này chưa có tập nào để phát.</div>'}`;
    const fb=$('#fav'),paint=()=>fb.textContent=isFav()?'♥ Đã yêu thích':'♡ Yêu thích';paint();
    fb.onclick=()=>{let l=store.get('koha_fav');if(isFav())l=l.filter(x=>x.slug!==slug);else l.unshift({slug,name:m.name,origin_name:m.origin_name,poster_url:m.poster_url,thumb_url:m.thumb_url,year:m.year});store.set('koha_fav',l);paint();toast(isFav()?'Đã thêm vào yêu thích':'Đã xóa khỏi yêu thích')};
    if(!eps.length)return;
    let si=0,ei=0;
    const run=async()=>{
      const e=eps[si].server_data[ei],pw=$('#pw');if(hls){hls.destroy();hls=null}
      document.querySelectorAll('#ep button').forEach((b,i)=>b.classList.toggle('on',i===ei));
      if($('#mo').value==='h'&&e.link_m3u8){
        pw.innerHTML='<video controls autoplay playsinline></video>';const v=pw.firstChild;
        try{await loadHls();if(Hls.isSupported()){hls=new Hls();hls.loadSource(e.link_m3u8);hls.attachMedia(v)}else v.src=e.link_m3u8}catch{v.src=e.link_m3u8}
      }else pw.innerHTML=e.link_embed?`<iframe src="${esc(e.link_embed)}" allowfullscreen allow="autoplay; fullscreen"></iframe>`:'<div class="msg">Tập này chưa có nguồn phát.</div>';
      let h=store.get('koha_hist').filter(x=>x.slug!==slug);h.unshift({slug,name:m.name,origin_name:m.origin_name,poster_url:m.poster_url,thumb_url:m.thumb_url,year:m.year,episode_current:e.name});store.set('koha_hist',h.slice(0,12));
    };
    const lst=()=>{$('#ep').innerHTML=eps[si].server_data.map((e,i)=>`<button data-i="${i}">${esc(e.name)}</button>`).join('');run()};
    $('#ep').onclick=ev=>{const b=ev.target.closest('button');if(b){ei=+b.dataset.i;run()}};
    $('#sv').onchange=ev=>{si=+ev.target.value;ei=0;lst()};$('#mo').onchange=run;lst();
  }catch(e){fail(e)}
}

/* ---------- Điều hướng bằng hash ---------- */
function route(){
  if(hls){hls.destroy();hls=null}
  const [kind='',a,b]=location.hash.replace(/^#\/?/,'').split('/').filter(Boolean).map(decodeURIComponent);
  window.scrollTo(0,0);
  if(kind===''){buildNav('');return home()}
  if(kind==='phim'&&a){buildNav('');return detail(a)}
  if(kind==='yeu-thich'){buildNav('fav');return favs()}
  if(kind==='moi'){buildNav('moi');return list('moi','',+a||1)}
  if(kind==='tim-kiem'&&a){buildNav('');return list(kind,a,+b||1)}
  if(kind==='danh-sach'&&a){buildNav(kind+'/'+a);return list(kind,a,+b||1)}
  if(a){buildNav(kind+'/'+a);return list(kind,a,+b||1)}
  location.hash='#/';
}
$('#sf').onsubmit=e=>{e.preventDefault();const q=$('#q').value.trim();if(q)location.hash='#/tim-kiem/'+encodeURIComponent(q)+'/1'};
addEventListener('hashchange',route);
route();
