/* ==========================================================
   KOHA – js/player.js : trình phát video tùy chỉnh (HLS)
   ========================================================== */
const fs=()=>document.fullscreenElement?document.exitFullscreen():$('#cp')?.requestFullscreen?.();
const fmt=t=>{t=Math.max(0,t|0);const h=t/3600|0,m=t%3600/60|0,s=t%60;return(h?h+':'+String(m).padStart(2,'0'):m)+':'+String(s).padStart(2,'0')};
function mountPlayer(box,src){
 box.innerHTML=`<div class="cp" id="cp"><video playsinline></video><div class="cb"><div class="pg"><i class="bf"></i><i class="pl2"></i><span class="pt">0:00</span></div>
 <div class="cr"><button data-c="pp" aria-label="Phát/Dừng">▶</button><button data-c="bk" aria-label="Lùi 10 giây">⟲10</button><button data-c="fw" aria-label="Tua 10 giây">10⟳</button><button data-c="mu" aria-label="Tắt tiếng">🔊</button><input type="range" id="vo" min="0" max="1" step=".05" value="1" aria-label="Âm lượng"><span id="tm">0:00 / 0:00</span><span style="flex:1"></span>
 <select id="spd" aria-label="Tốc độ">${[.5,.75,1,1.25,1.5,2].map(x=>`<option value="${x}" ${x===1?'selected':''}>${x}x</option>`).join('')}</select><select id="ql" aria-label="Chất lượng"><option value="-1">Tự động</option></select><button data-c="th" aria-label="Chế độ rạp">🎭</button><button data-c="fs" aria-label="Toàn màn hình">⛶</button></div></div></div>`;
 const cp=$('#cp',box),v=$('video',cp),pg=$('.pg',cp),bf=$('.bf',cp),pl=$('.pl2',cp),pt=$('.pt',cp),tm=$('#tm',cp),pp=$('[data-c=pp]',cp),mu=$('[data-c=mu]',cp);
 if(window.Hls&&Hls.isSupported()){hls=new Hls();hls.loadSource(src);hls.attachMedia(v);
  hls.on(Hls.Events.MANIFEST_PARSED,(_,d)=>{$('#ql',cp).innerHTML='<option value="-1">Tự động</option>'+d.levels.map((l,i)=>`<option value="${i}">${l.height?l.height+'p':'Mức '+(i+1)}</option>`).join('')})}
 else v.src=src;
 v.play().catch(()=>{});
 const tog=()=>v.paused?v.play():v.pause();let idle;
 const wake=()=>{cp.classList.remove('idle');clearTimeout(idle);idle=setTimeout(()=>!v.paused&&cp.classList.add('idle'),3000)};
 cp.addEventListener('mousemove',wake);cp.addEventListener('touchstart',wake,{passive:true});
 v.addEventListener('click',tog);v.addEventListener('dblclick',fs);
 v.addEventListener('play',()=>{pp.textContent='❚❚';wake()});v.addEventListener('pause',()=>{pp.textContent='▶';cp.classList.remove('idle')});
 v.addEventListener('timeupdate',()=>{const d=v.duration||0;pl.style.transform=`scaleX(${d?v.currentTime/d:0})`;tm.textContent=fmt(v.currentTime)+' / '+fmt(d)});
 v.addEventListener('progress',()=>{const d=v.duration||0;if(d&&v.buffered.length)bf.style.transform=`scaleX(${v.buffered.end(v.buffered.length-1)/d})`});
 const at=e=>{const r=pg.getBoundingClientRect();return Math.min(1,Math.max(0,(e.clientX-r.left)/r.width))};
 pg.addEventListener('pointermove',e=>{const f=at(e);pt.style.left=f*100+'%';pt.textContent=fmt(f*(v.duration||0))});
 pg.addEventListener('click',e=>{v.currentTime=at(e)*(v.duration||0)});
 cp.addEventListener('click',e=>{const c=e.target.closest('[data-c]')?.dataset.c;if(!c)return;
  if(c==='pp')tog();else if(c==='bk')v.currentTime-=10;else if(c==='fw')v.currentTime+=10;
  else if(c==='mu'){v.muted=!v.muted;mu.textContent=v.muted?'🔇':'🔊'}else if(c==='th')document.body.classList.toggle('th');else if(c==='fs')fs()});
 $('#vo',cp).oninput=e=>{v.volume=e.target.value;v.muted=false};
 $('#spd',cp).onchange=e=>v.playbackRate=+e.target.value;
 $('#ql',cp).onchange=e=>{if(hls)hls.currentLevel=+e.target.value};
}

