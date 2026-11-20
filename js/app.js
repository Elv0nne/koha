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
const card=m=>{const v=+(m.tmdb&&m.tmdb.vote_average);return `<a class="card" href="#/phim/${esc(m.slug)}"><div class="poster" data-t="${esc(m.name)}">${imgTag(m,false,'loading="lazy" ')}${m.episode_current?`<span class="tag">${esc(m.episode_current)}</span>`:''}${v>0?`<span class="rt">★ ${v.toFixed(1)}</span>`:''}</div><h3>${esc(m.name)}</h3><small>${esc([m.origin_name,m.year].filter(Boolean).join(' · '))}</small></a>`};
const pager=(base,p,t)=>t<=1?'':`<div class="pager"><a class="btn ${p<=1?'off':''}" href="${base}/${p-1}">Trước</a><span>Trang ${p}/${t}</span><a class="btn ${p>=t?'off':''}" href="${base}/${p+1}">Sau</a></div>`;
const fail=e=>app.innerHTML=`<div class="msg">Không tải được dữ liệu (${esc(e.message)}).<br>Kiểm tra mạng rồi <a class="btn" href="javascript:route()">thử lại</a></div>`;

/* ---------- Menu ---------- */
const TYPES=[['moi','Mới cập nhật'],['danh-sach/phim-le','Phim lẻ'],['danh-sach/phim-bo','Phim bộ'],['danh-sach/hoat-hinh','Hoạt hình'],['danh-sach/tv-shows','TV Shows']];
const GENRES=[['hanh-dong','Hành động'],['tinh-cam','Tình cảm'],['kinh-di','Kinh dị'],['hai-huoc','Hài hước'],['co-trang','Cổ trang'],['vien-tuong','Viễn tưởng'],['phieu-luu','Phiêu lưu'],['tam-ly','Tâm lý'],['hinh-su','Hình sự'],['chien-tranh','Chiến tranh'],['than-thoai','Thần thoại'],['vo-thuat','Võ thuật']];
const COUNTRIES=[['trung-quoc','Trung Quốc'],['han-quoc','Hàn Quốc'],['nhat-ban','Nhật Bản'],['thai-lan','Thái Lan'],['au-my','Âu Mỹ'],['viet-nam','Việt Nam'],['dai-loan','Đài Loan'],['hong-kong','Hồng Kông'],['an-do','Ấn Độ']];
const YEARS=Array.from({length:17},(_,i)=>[String(2026-i),String(2026-i)]);
const LABEL=Object.fromEntries([...GENRES,...COUNTRIES,...YEARS,['phim-le','Phim lẻ'],['phim-bo','Phim bộ'],['hoat-hinh','Hoạt hình'],['tv-shows','TV Shows']]);
function buildNav(cur){
  const chips=(kind,list)=>list.map(([s,n])=>`<a class="chip ${cur===kind+'/'+s?'on':''}" href="#/${kind}/${s}/1">${n}</a>`).join('');
  $('#nav').innerHTML=TYPES.map(([s,n])=>`<a href="#/${s}/1" class="${cur===s?'on':''}">${n}</a>`).join('')
    +`<details class="mm"><summary>Khám phá</summary><div class="panel"><h4>Thể loại</h4><div class="chs">${chips('the-loai',GENRES)}</div><h4>Quốc gia</h4><div class="chs">${chips('quoc-gia',COUNTRIES)}</div><h4>Năm phát hành</h4><div class="chs">${chips('nam',YEARS)}</div></div></details>`
    +`<a href="#/yeu-thich" class="${cur==='fav'?'on':''}">♡ Yêu thích</a>`;
}

/* ---------- Trang chủ ---------- */
let hl=[],hi=0;const dcache={};
const ROWS=[['Hành động','/v1/api/the-loai/hanh-dong','#/the-loai/hanh-dong/1'],['Tình cảm','/v1/api/the-loai/tinh-cam','#/the-loai/tinh-cam/1'],['Hoạt hình','/v1/api/danh-sach/hoat-hinh','#/danh-sach/hoat-hinh/1'],['Phim Hàn','/v1/api/quoc-gia/han-quoc','#/quoc-gia/han-quoc/1'],['Phim bộ','/v1/api/danh-sach/phim-bo','#/danh-sach/phim-bo/1'],['Kinh dị','/v1/api/the-loai/kinh-di','#/the-loai/kinh-di/1']];
const SK='<div class="card sk"><div class="poster"></div></div>'.repeat(8);
const rowHTML=(t,href,items,path)=>`<section class="row" ${path?`data-p="${path}"`:''}><div class="rh"><h2>${t}</h2><a href="${href}">Xem tất cả ›</a></div><div class="rw"><button class="ar l" aria-label="Cuộn trái">‹</button><div class="track">${items?items.slice(0,16).map(card).join(''):SK}</div><button class="ar r" aria-label="Cuộn phải">›</button></div></section>`;
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
      try{x.target.querySelector('.track').innerHTML=norm(await get(x.target.dataset.p)).items.slice(0,16).map(card).join('')}catch{x.target.remove()}
    }),{rootMargin:'300px'});
    document.querySelectorAll('.row[data-p]').forEach(r=>io.observe(r));
  }catch(e){fail(e)}
}
async function showHero(i){
  hi=(i+hl.length)%hl.length;const m=hl[hi],h=$('#hero');if(!h||!m)return;
  h.innerHTML=`${imgTag(m,true,'class="hbg" ')}<div class="hc"><h1>${esc(m.name)}</h1><div class="chips">${[m.quality,m.year,m.episode_current].filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join('')}</div><p class="desc" id="hd"></p><div class="hb"><a class="btn p" href="#/phim/${esc(m.slug)}">▶ Xem ngay</a><button class="btn" onclick="showHero(hi+1)">Phim khác ${hi+1}/${hl.length} ›</button></div></div>`;
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
/* Trang thông tin phim: chỉ giới thiệu, chưa hiện trình phát và danh sách tập */
async function detail(slug){
  app.innerHTML='<div class="msg">Đang tải…</div>';
  try{
    const j=await get('/phim/'+encodeURIComponent(slug)),m=j.movie;if(!m)throw Error('Không có dữ liệu phim');
    const eps=(j.episodes||[]).filter(s=>s.server_data&&s.server_data.length);
    const nm=a=>(a||[]).map(x=>esc(x.name||x)).join(', ')||'—';
    const isFav=()=>store.get('koha_fav').some(x=>x.slug===slug);
    app.innerHTML=`<div class="banner">${imgTag(m,true,'class="hbg" ')}</div><div class="detail"><div class="poster" data-t="${esc(m.name)}">${imgTag(m,false)}</div><div class="info">
      <h1>${esc(m.name)}</h1><div class="o">${esc(m.origin_name||'')}</div>
      <div class="chips">${[m.quality,m.lang,m.year,m.time,m.episode_current].filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join('')}</div>
      <p><b>Thể loại:</b> ${nm(m.category)}</p><p><b>Quốc gia:</b> ${nm(m.country)}</p><p><b>Đạo diễn:</b> ${nm(m.director)}</p><p><b>Diễn viên:</b> ${nm(m.actor)}</p>
      <p class="desc">${esc(strip(m.content))}</p>
      <div class="hb">${eps.length?`<a class="btn p" href="#/xem/${esc(slug)}">▶ Xem phim</a>`:'<span class="btn off">Chưa có tập để xem</span>'}<button class="btn" id="fav"></button></div></div></div>`;
    const fb=$('#fav'),paint=()=>fb.textContent=isFav()?'♥ Đã yêu thích':'♡ Yêu thích';paint();
    fb.onclick=()=>{let l=store.get('koha_fav');if(isFav())l=l.filter(x=>x.slug!==slug);else l.unshift({slug,name:m.name,origin_name:m.origin_name,poster_url:m.poster_url,thumb_url:m.thumb_url,year:m.year});store.set('koha_fav',l);paint();toast(isFav()?'Đã thêm vào yêu thích':'Đã xóa khỏi yêu thích')};
    const c0=m.category&&m.category[0]&&m.category[0].slug;
    if(c0)get('/v1/api/the-loai/'+c0).then(r=>{const it=norm(r).items.filter(x=>x.slug!==slug);if(it.length&&document.body.contains(fb))app.insertAdjacentHTML('beforeend',rowHTML('Phim cùng thể loại','#/the-loai/'+c0+'/1',it))}).catch(()=>{});
  }catch(e){fail(e)}
}

/* Trang xem phim: trình phát + danh sách tập + gợi ý tập tiếp / thông báo hết phim */
const ago=t=>{const m=(Date.now()-t)/60000|0;return m<1?'vừa xong':m<60?m+' phút trước':m<1440?(m/60|0)+' giờ trước':(m/1440|0)+' ngày trước'};
const overlay=n=>`${n?`<div class="nxp" id="nxp" hidden><div class="nh"><span>⏭ Tập tiếp theo</span><button id="nxc" aria-label="Đóng">✕</button></div><div class="ne">${esc(n.name)}</div><button class="btn p" id="nxg">Xem ngay</button></div>`:''}<div class="endc" id="endc" hidden><div class="nh"><span>🎉 Đã hết phim!</span><button id="endx" aria-label="Đóng">✕</button></div><p>Chúc các bạn xem phim vui vẻ ^^</p></div>`;
async function watch(slug){
  app.innerHTML='<div class="msg">Đang tải…</div>';
  try{
    const j=await get('/phim/'+encodeURIComponent(slug)),m=j.movie;if(!m)throw Error('Không có dữ liệu phim');
    const eps=(j.episodes||[]).filter(s=>s.server_data&&s.server_data.length);
    if(!eps.length){app.innerHTML=`<div class="msg">Phim này chưa có tập để phát.<br><br><a class="btn" href="#/phim/${esc(slug)}">← Thông tin phim</a></div>`;return}
    app.innerHTML=`<div class="wh"><a class="btn" href="#/phim/${esc(slug)}">← Thông tin phim</a><h1 id="wt"></h1><span class="resume" id="rs" hidden></span></div>
      <div class="pw" id="pw"></div>
      <div class="tb"><button id="pv">⏮ Tập trước</button><button id="nx">⏭ Tập tiếp</button><button id="dim">💡 Tắt đèn</button><button id="fl"></button></div>
      <div class="ctl"><select id="sv" aria-label="Server">${eps.map((s,i)=>`<option value="${i}">${esc(s.server_name)}</option>`).join('')}</select>
        <select id="mo" aria-label="Trình phát"><option value="h">Trình phát HLS (tự chuyển tập)</option><option value="e">Trình phát nhúng</option></select></div>
      <p class="hint">Gợi ý “Tập tiếp theo”, tự chuyển tập và thông báo hết phim chỉ hoạt động ở chế độ HLS.</p>
      <h2 class="s">Danh sách tập</h2><div class="eps" id="ep"></div>`;
    let si=0,ei=0,dismissed=false,et;
    const h0=store.get('koha_hist').find(x=>x.slug===slug);
    if(h0&&h0.episode_current){
      const k=eps[0].server_data.findIndex(e=>e.name===h0.episode_current);if(k>=0)ei=k;
      const rs=$('#rs');rs.hidden=false;rs.textContent='Bạn vừa xem '+h0.episode_current+(h0.t?' · '+ago(h0.t):'');
    }
    const isFav=()=>store.get('koha_fav').some(x=>x.slug===slug),paint=()=>$('#fl').textContent=isFav()?'🔖 Đang theo dõi':'🔖 Theo dõi';paint();
    $('#fl').onclick=()=>{let l=store.get('koha_fav');if(isFav())l=l.filter(x=>x.slug!==slug);else l.unshift({slug,name:m.name,origin_name:m.origin_name,poster_url:m.poster_url,thumb_url:m.thumb_url,year:m.year});store.set('koha_fav',l);paint();toast(isFav()?'Đã theo dõi phim':'Đã bỏ theo dõi')};
    $('#dim').onclick=()=>{const on=document.body.classList.toggle('dim');$('#dim').textContent=on?'💡 Bật đèn':'💡 Tắt đèn'};
    const run=async()=>{
      const list=eps[si].server_data,e=list[ei],pw=$('#pw');if(!pw)return;
      const next=list[ei+1];dismissed=false;clearTimeout(et);
      if(hls){hls.destroy();hls=null}
      $('#wt').textContent=m.name+' · '+e.name;
      document.querySelectorAll('#ep button').forEach((b,i)=>b.classList.toggle('on',i===ei));
      $('#pv').classList.toggle('off',ei<=0);$('#nx').classList.toggle('off',!next);
      if($('#mo').value==='h'&&e.link_m3u8){
        pw.innerHTML=`<video controls autoplay playsinline></video>${overlay(next)}`;
        const v=pw.firstChild,nxp=$('#nxp'),endc=$('#endc');
        const go=()=>{ei++;run()};
        if(nxp){$('#nxc').onclick=()=>{dismissed=true;nxp.hidden=true};$('#nxg').onclick=go}
        $('#endx').onclick=()=>endc.hidden=true;
        v.ontimeupdate=()=>{const left=v.duration-v.currentTime;if(!nxp||!(left>=0))return;nxp.hidden=dismissed||left>30};
        v.onended=()=>{
          if(next){toast('Đang chuyển sang '+next.name);go()}
          else{endc.hidden=false;et=setTimeout(()=>{endc.hidden=true},10000)}
        };
        try{
          await loadHls();
          if(Hls.isSupported()){
            hls=new Hls();hls.loadSource(e.link_m3u8);hls.attachMedia(v);
            hls.on(Hls.Events.ERROR,(_,d)=>{if(d.fatal){toast('Nguồn HLS lỗi, chuyển sang trình phát nhúng');$('#mo').value='e';run()}});
          }else v.src=e.link_m3u8;
        }catch{$('#mo').value='e';run();return}
      }else pw.innerHTML=e.link_embed?`<iframe src="${esc(e.link_embed)}" allowfullscreen allow="autoplay; fullscreen"></iframe>`:'<div class="msg">Tập này chưa có nguồn phát.</div>';
      let h=store.get('koha_hist').filter(x=>x.slug!==slug);
      h.unshift({slug,name:m.name,origin_name:m.origin_name,poster_url:m.poster_url,thumb_url:m.thumb_url,year:m.year,episode_current:e.name,t:Date.now()});store.set('koha_hist',h.slice(0,12));
    };
    const lst=()=>{$('#ep').innerHTML=eps[si].server_data.map((e,i)=>`<button data-i="${i}">${esc(e.name)}</button>`).join('');run()};
    $('#ep').onclick=ev=>{const b=ev.target.closest('button');if(b){ei=+b.dataset.i;run();window.scrollTo({top:0,behavior:'smooth'})}};
    $('#pv').onclick=()=>{if(ei>0){ei--;run()}};
    $('#nx').onclick=()=>{if(ei<eps[si].server_data.length-1){ei++;run()}};
    $('#sv').onchange=ev=>{si=+ev.target.value;ei=Math.min(ei,eps[si].server_data.length-1);lst()};
    $('#mo').onchange=run;lst();
  }catch(e){fail(e)}
}

/* ---------- Điều hướng bằng hash ---------- */
function route(){
  if(hls){hls.destroy();hls=null}
  const [kind='',a,b]=location.hash.replace(/^#\/?/,'').split('/').filter(Boolean).map(decodeURIComponent);
  window.scrollTo(0,0);document.body.classList.remove('dim');
  if(kind===''){buildNav('');return home()}
  if(kind==='phim'&&a){buildNav('');return detail(a)}
  if(kind==='xem'&&a){buildNav('');return watch(a)}
  if(kind==='yeu-thich'){buildNav('fav');return favs()}
  if(kind==='moi'){buildNav('moi');return list('moi','',+a||1)}
  if(kind==='tim-kiem'&&a){buildNav('');return list(kind,a,+b||1)}
  if(kind==='danh-sach'&&a){buildNav(kind+'/'+a);return list(kind,a,+b||1)}
  if(a){buildNav(kind+'/'+a);return list(kind,a,+b||1)}
  location.hash='#/';
}
document.addEventListener('click',e=>{
  const a=e.target.closest('.ar');
  if(a){const t=a.parentNode.querySelector('.track');t.scrollBy({left:(a.classList.contains('r')?1:-1)*t.clientWidth*.85,behavior:'smooth'})}
  else if(!e.target.closest('.mm')){const m=document.querySelector('.mm');if(m)m.removeAttribute('open')}
});
$('#sf').onsubmit=e=>{e.preventDefault();const q=$('#q').value.trim();if(q)location.hash='#/tim-kiem/'+encodeURIComponent(q)+'/1'};
addEventListener('hashchange',route);
route();
