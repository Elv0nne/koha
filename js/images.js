/* ==========================================================
   KOHA – js/images.js : xử lý toàn bộ hình ảnh
   - Tự tìm đúng trường ảnh trong dữ liệu (poster, thumb, ...)
   - Ghép đường dẫn tương đối với nhiều CDN
   - Thử lần lượt nhiều nguồn + proxy, mỗi nguồn có timeout
   - Không để khung trống: lỗi hết thì hiện placeholder có tên phim
   - Bảng chẩn đoán: nhấn Shift+D (tự mở khi nhiều ảnh lỗi)
   Cần chạy trước app.js (dùng API, toast, ... lúc runtime).
   ========================================================== */
let CDN='https://phimimg.com',imgFails=0,imgSample=null;
const imgLog=[];
const IMG_HOSTS=['https://phimimg.com','https://img.phimapi.com'];
const IMG_PROXIES=[
  u=>API+'/image.php?url='+encodeURIComponent(u),
  u=>'https://wsrv.nl/?url='+encodeURIComponent(u),
  u=>'https://images.weserv.nl/?url='+encodeURIComponent(u)
];
const FIELDS_POSTER=['poster_url','thumb_url','poster','thumb','image','img','cover','backdrop'];
const FIELDS_WIDE=['thumb_url','poster_url','backdrop','cover','thumb','poster','image','img'];

/* Lấy đường dẫn ảnh gốc từ một phim. wide=true ưu tiên ảnh ngang (backdrop) */
function rawOf(m,wide){
  if(!m)return '';
  for(const k of (wide?FIELDS_WIDE:FIELDS_POSTER)){
    const v=m[k];
    if(typeof v==='string'&&v.trim())return v.trim();
    if(v&&typeof v==='object'&&typeof v.url==='string')return v.url;
  }
  return '';
}

/* Danh sách link sẽ thử, theo thứ tự ưu tiên */
function cands(raw){
  if(!raw)return [];
  raw=raw.replace(/^http:/,'https:');
  let base=[];
  if(/^\/\//.test(raw))base=['https:'+raw];
  else if(/^https?:/.test(raw)){
    base=[raw];
    try{const u=new URL(raw);IMG_HOSTS.forEach(h=>{if(u.origin!==h)base.push(h+u.pathname+u.search)})}catch{}
  }else{
    const p=raw.replace(/^\/+/,'');
    [CDN,...IMG_HOSTS.filter(h=>h!==CDN)].forEach(h=>{
      base.push(h+'/'+p);
      if(!p.startsWith('upload/'))base.push(h+'/upload/vod/'+p);
    });
  }
  const out=[...base];
  IMG_PROXIES.forEach(f=>base.slice(0,2).forEach(u=>out.push(f(u))));
  return [...new Set(out)];
}
const img=u=>cands(u)[0]||'';

/* Ảnh lỗi hết mọi nguồn -> placeholder có tên phim */
function imgFail(el){
  el.style.display='none';
  const sk=el.parentElement&&el.parentElement.querySelector('.sk');
  if(sk){sk.className='ph';sk.textContent=el.alt||'KOHA'}
  imgFails++;imgLog.push(el.dataset.raw||'(không có đường dẫn ảnh)');
  if(imgFails===6)imgDiag(true);
}
/* Gắn vào onerror của <img>: chuyển sang nguồn kế tiếp */
function fx(el){
  const l=cands(el.dataset.raw),n=(+el.dataset.n||0)+1;
  if(n<l.length){el.dataset.n=n;el.dataset.ts=Date.now();el.src=l[n]}else imgFail(el);
}
/* Tìm link ảnh dùng được (cho ảnh nền hero / modal). Trả về '' nếu không có */
function pick(r){
  return new Promise(res=>{
    const l=cands(r);let i=0;
    const go=()=>{
      if(i>=l.length)return res('');
      const im=new Image();let done=false;im.referrerPolicy='no-referrer';
      const end=ok=>{if(done)return;done=true;clearTimeout(to);ok?res(l[i]):(i++,go())};
      const to=setTimeout(()=>end(false),6000);
      im.onload=()=>end(true);im.onerror=()=>end(false);im.src=l[i];
    };
    go();
  });
}
/* Canh chừng: ảnh treo > 5s thì thử nguồn khác; ảnh thiếu đường dẫn thì báo lỗi ngay */
setInterval(()=>document.querySelectorAll('.pz img:not(.ld)').forEach(el=>{
  if(el.style.display==='none')return;
  if(!el.dataset.raw){imgFail(el);return}
  if(el.complete&&el.naturalWidth){el.classList.add('ld');return}
  const t=+el.dataset.ts||(el.dataset.ts=Date.now());
  if(Date.now()-t>5000)fx(el);
}),1500);

/* Bảng chẩn đoán: bấm vào bảng để sao chép nội dung và đóng */
function imgDiag(auto){
  let d=document.getElementById('diag');
  if(!d){d=document.createElement('pre');d.id='diag';document.body.appendChild(d)}
  const s=imgSample;
  d.textContent=[
    'KOHA - chẩn đoán ảnh'+(auto?' (tự mở vì nhiều ảnh lỗi)':''),
    'CDN: '+CDN,
    'Ảnh lỗi hoàn toàn: '+imgFails,
    'Trang chạy từ: '+location.protocol+'//'+(location.host||'(file)'),
    'Dữ liệu mẫu: '+(s?JSON.stringify(s).slice(0,700):'chưa có'),
    'Trường ảnh tìm thấy: '+(s?(rawOf(s)||'(KHÔNG CÓ)'):'-'),
    'Link sẽ thử:',...cands(s?rawOf(s):'').slice(0,6),
    '','Lỗi gần đây:',...imgLog.slice(-5),
    '','(Bấm vào bảng để sao chép và đóng)'
  ].join('\n');
  d.onclick=()=>{try{navigator.clipboard.writeText(d.textContent)}catch{}d.remove();if(typeof toast==='function')toast('Đã sao chép chẩn đoán')};
}
addEventListener('keydown',e=>{if(e.shiftKey&&e.key==='D'&&!e.target.matches('input,select'))imgDiag()});
