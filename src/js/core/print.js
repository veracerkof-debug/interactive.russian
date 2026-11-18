// ---------- печатная книга (только tools/print.py; в dist/index.html не входит) ----------
// Собирает из данных глав (lessons / bank / classic / tests) чистый текст для бумаги: теория, схемы (текстовый вид),
// задания тренажёра, упражнения в тетрадь, тесты на бумаге и — только в версии учителя — ключи.
// Настройки: window.PRINT_CFG = {ids:[…], teacher:bool, lite:bool}; TEACHER задаёт tools/print.py.
const PRC=window.PRINT_CFG||{ids:[],teacher:false,lite:true};
const prPlain=h=>String(h==null?'':h).replace(/\[\[\w+\|([^\]]+)\]\]/g,'$1');
function prRng(seed){let a=0;for(const c of String(seed))a=(a*31+c.charCodeAt(0))|0;return()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}}
const prShuf=(arr,rnd)=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
// интерактивная схема → статичный вид: кнопки становятся рамками, поля и подсказки убираются; пустое — заменяется пометкой
function prLab(id,chId){
 const f=LABS[id];let h='';
 try{h=f?f():''}catch(e){h=''}
 const box=document.createElement('div');box.innerHTML=h;
 box.querySelectorAll('script,style,input,select,textarea,.sr,[hidden]').forEach(x=>x.remove());
 box.querySelectorAll('button').forEach(b=>{const s=document.createElement('span');s.className='prbtn';s.innerHTML=b.innerHTML;b.replaceWith(s)});
 box.querySelectorAll('[data-term],[data-ch],[data-lesson],[data-word]').forEach(x=>{x.removeAttribute('data-term');x.removeAttribute('data-ch');x.removeAttribute('data-lesson');x.removeAttribute('data-word')});
 const txt=box.textContent.replace(/\s+/g,' ').trim();
 if(txt.length<25&&!box.querySelector('svg,table'))return `<div class="prlab prlabno">Интерактивная схема — в электронной версии учебника.</div>`;
 return `<div class="prlab">${box.innerHTML}<div class="prlabcap">Схема «${id}»: в электронной версии — интерактивная.</div></div>`;
}
function prTheory(ch,l){
 let h=prPlain(l.h).replace('{{table}}',ch.table||'').replace(/\{\{lab:(\w+)\}\}/g,(m,id)=>prLab(id,ch.id));
 let out=`<div class="prtheory">${h}</div>`;
 if(l.deep)out+=`<div class="prbox"><div class="prboxh">Тонкости</div>${prPlain(l.deep)}</div>`;
 if(PRC.lite!==false){
  if(l.lite)out+=`<div class="prbox"><div class="prboxh">Коротко («Проще»)</div>${prPlain(l.lite)}</div>`;
  if(l.easy)out+=`<div class="prbox"><div class="prboxh">Проще — на пальцах</div><p>${prPlain(l.easy)}</p></div>`;
  if(l.fix)out+=`<div class="prbox"><div class="prboxh">Если не получается</div><p>${prPlain(l.fix)}</p></div>`;
 }
 return out;
}
const prStars=n=>'★'.repeat(n)+'☆'.repeat(5-n);
const prOpts=it=>it.opts||['н','нн'];
function prBankLine(it,k){
 const gap=it.w.includes('_');
 return `<li><span class="prn">${k}.</span> ${esc(it.w).replace(/_/g,'…')} <span class="propts">(${prOpts(it).map(esc).join(' / ')})</span></li>`;
}
function prBank(ch){
 if(!ch.bank||!ch.bank.length)return {html:'',keys:''};
 let h='<h3 class="prh3">Задания тренажёра на бумаге</h3>',keys='',k=0;
 ch.lessons.forEach((l,i)=>{
  const items=ch.bank.filter(b=>b.l===i+1);if(!items.length)return;
  let ks=[];
  h+=`<h4 class="prh4">Урок ${i+1}. ${l.t}</h4><ol class="prbank">${items.map(it=>{k++;ks.push(k+'. '+esc(it.a));return prBankLine(it,k)}).join('')}</ol>`;
  keys+=`<p><b>Урок ${i+1}.</b> ${ks.join('; ')}</p>`;
 });
 return {html:`<section class="prsec">${h}</section>`,keys};
}
function prClassic(ch){
 if(!ch.classic||!ch.classic.length)return {html:'',keys:''};
 let h='<h3 class="prh3">Упражнения в тетрадь</h3>',keys='',cur=0;
 ch.classic.forEach(e=>{
  if(e.l!==cur){cur=e.l;h+=`<h4 class="prh4">${clLabel(ch,cur)}${cur<ch.lnames.length-1?'. '+ch.lnames[cur]:''}</h4>`}
  h+=`<div class="prex"><div class="prexh"><b>Упражнение ${e.n}</b><span class="prst" title="Сложность">${prStars(e.st)}</span>${e.os?`<span class="pros">особое · ${e.os}</span>`:''}</div>
  <p class="prtask">${prPlain(e.task)}</p>${e.obr?`<p class="probr"><b>Образец.</b> ${prPlain(e.obr)}</p>`:''}<p class="cbody prbody">${clBody(e.body)}</p></div>`;
  if(PRC.teacher&&e.key)keys+=`<div class="prkey"><b>${e.n}.</b> ${e.key}</div>`;
 });
 return {html:`<section class="prsec">${h}</section>`,keys};
}
// один вопрос теста — без случайности (порядок вариантов перемешан по зерну, чтобы верный не стоял первым)
function prTestQ(ch,s,idx){
 const rnd=prRng(ch.id+idx);
 let it=s.items?s.items[0]:{a:s.a,why:s.why};
 if(Array.isArray(it)&&s.k!=='sort')it={w:it[0],a:it[1],why:it[2]};
 const q=s.q[0],inl=q.includes('{w}');
 const text=q.replace('{w}',it.w||'').replace('{x}',it.x||'');
 let body='',ans='';
 if(s.k==='one'){const all=it.o||s.o,n=s.n||all.length;const o=prShuf([it.a,...prShuf(all.filter(x=>x!==it.a),rnd).slice(0,n-1)],rnd);
  body=`<ol class="prvar">${o.map(x=>`<li>${esc(x).replace(/_/g,'…')}</li>`).join('')}</ol>`;ans=it.a}
 else if(s.k==='many'){const o=prShuf(it.o||s.o,rnd);body=`<ul class="prvar prbox2">${o.map(x=>`<li>${esc(x).replace(/_/g,'…')}</li>`).join('')}</ul>`;ans=(it.a||s.a||[]).join('; ')}
 else if(s.k==='sort'){const its=prShuf(s.items,rnd).slice(0,s.n||6);body=`<p class="prcats">Группы: ${s.cats.map(esc).join(' · ')}</p><ol class="prvar prsort">${its.map(x=>`<li>${esc(x[0])} — ________</li>`).join('')}</ol>`;ans=its.map(x=>x[0]+' — '+x[1]).join('; ')}
 else{body='<p class="prline">Ответ: ______________________</p>';ans=Array.isArray(it.a)?it.a[0]:it.a}
 return {html:`<li class="prq"><div class="prqt">${esc(text).replace(/_/g,'…')}</div>${!inl&&it.w&&s.k!=='sort'?`<div class="prqw">${esc(it.w).replace(/_/g,'…')}</div>`:''}${body}</li>`,ans:esc(ans)};
}
function prTests(ch){
 if(!ch.tests||!ch.tests.length)return {html:'',keys:''};
 let h='<h3 class="prh3">Тесты</h3>',keys='';
 ch.lessons.forEach((l,i)=>{
  const sl=ch.tests.map((s,idx)=>[s,idx]).filter(x=>x[0].l===i+1);if(!sl.length)return;
  const qs=sl.map(([s,idx])=>prTestQ(ch,s,idx));
  h+=`<div class="prtest"><h4 class="prh4">Тест по уроку ${i+1}. ${l.t}</h4><p class="prname">Фамилия, имя ______________________ Оценка ____</p><ol class="prqs">${qs.map(q=>q.html).join('')}</ol></div>`;
  keys+=`<p><b>Тест, урок ${i+1}.</b> ${qs.map((q,j)=>(j+1)+') '+q.ans).join('; ')}</p>`;
 });
 return {html:`<section class="prsec">${h}</section>`,keys};
}
function prChapter(meta){
 const ch=CHAPTERS[meta.id];if(!ch)return '';
 const idx=meta.part.ch.indexOf(meta)+1;
 let h=`<article class="prch" id="pr-${meta.id}"><header class="prchh"><div class="prkick">Глава ${meta.part.n}.${idx} · ${meta.part.t}</div><h1>${meta.t}</h1><div class="prsub">${ch.s||meta.s||''}</div></header>`;
 ch.lessons.forEach((l,i)=>{h+=`<section class="prles" id="pr-${l.id}"><h2 class="prh2"><span class="prkick">Урок ${i+1}</span> ${l.t}</h2>${prTheory(ch,l)}</section>`});
 const b=prBank(ch),c=prClassic(ch),t=prTests(ch);
 h+=b.html+c.html+t.html;
 if(PRC.teacher){
  h+=`<section class="prsec prkeys"><h3 class="prh3">Ключи для учителя</h3>${c.keys?`<h4 class="prh4">Упражнения в тетрадь</h4>${c.keys}`:''}${b.keys?`<h4 class="prh4">Задания тренажёра</h4>${b.keys}`:''}${t.keys?`<h4 class="prh4">Тесты</h4>${t.keys}`:''}</section>`;
 }
 h+=`<div class="prsrc">По книгам: ${ch.src||''}</div></article>`;
 return h;
}
function prBook(){
 const metas=PRC.ids.map(id=>chById(id)).filter(m=>m&&CHAPTERS[m.id]);
 let h='';
 if(metas.length>1){
  h+=`<section class="prtitle"><h1>Русский язык</h1><div class="prsub">${PRC.teacher?'Печатная версия для учителя (с ключами)':'Печатная версия для ученика'}</div></section>`;
  h+=`<section class="prtoc"><h2 class="prh2">Содержание</h2><ol>${metas.map(m=>`<li><a href="#pr-${m.id}">${m.t}</a><span> — ${CHAPTERS[m.id].lessons.length} ${plural(CHAPTERS[m.id].lessons.length,'урок','урока','уроков')}</span></li>`).join('')}</ol></section>`;
 }
 h+=metas.map(prChapter).join('');
 return h;
}
document.title=(PRC.teacher?'Учебник (учитель, печать)':'Учебник (печать)');
document.getElementById('app').innerHTML=prBook();
