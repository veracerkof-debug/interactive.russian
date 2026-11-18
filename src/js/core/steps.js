// ---------- маршрут: ступени, «Следующая по маршруту», плашка опор, «Повторение ступени» (#step-<n>) ----------
// Ступени (STEPS) и опоры глав (OPORY) заданы в levels.js. Ничего не блокируется: всё — подсказки и необязательные страницы.
// Поля S (только добавляются): S.needx {<глава>:1} — плашка «здесь нужна тема…» закрыта; S.steps {<n>:{best,last,tries,at}} — итоговый тест ступени.
// Тест и тренажёр ступени берут то, что уже есть в главах (tests и bank), ответов-ключей к упражнениям в тетрадь не используют.

// глава пройдена: сданы все её тесты или отмечены все уроки
const chDone=c=>!!c&&(chTestsDone(c)||c.lessons.every(l=>S.done[l.id]));
const stepLabel=id=>{const s=stepOf(id);return s?`Ступень ${s.n} · ${s.t}`:''};
const stepReady=s=>s.ch.filter(id=>CHAPTERS[id]);
const stepIsLast=id=>STEPS.some(s=>s.ch[s.ch.length-1]===id);

// следующая непройденная глава по маршруту: после той, где ученик сейчас («Продолжить»), по кругу; саму текущую не повторяем
function routeNext(){
 const k=homeCont(),f=firstCh(),cur=k?k.c.id:f?f.id:null,b=Math.max(0,COURSE_ORDER.indexOf(cur));
 for(let j=1;j<=COURSE_ORDER.length;j++){const id=COURSE_ORDER[(b+j)%COURSE_ORDER.length],c=CHAPTERS[id];
  if(id!==cur&&c&&!chDone(c))return chById(id)}
 return null;
}
function nextHTML(){
 const m=routeNext();if(!m)return '';const c=CHAPTERS[m.id],d=c.lessons.filter(l=>S.done[l.id]).length;
 return `<section class="hmsec hmnext" aria-label="Следующая по маршруту"><h2 class="hmh">Следующая по маршруту</h2><div class="hmlist">
 <button class="hmrow" data-hnext="${m.id}"><span class="b"><small class="hmstep">${stepLabel(m.id)}</small><b>${chNum(m)}. ${m.t}</b><small>${d?`пройдено уроков: ${d} из ${c.lessons.length}`:`${c.lessons.length} ${plural(c.lessons.length,'урок','урока','уроков')}`} · ${m.s}</small></span><span class="hmact">Открыть</span></button></div></section>`;
}
// открыть главу с первого непройденного урока
function openChFirst(id){const c=CHAPTERS[id];if(!c)return;const L=c.lessons.find(l=>!S.done[l.id])||c.lessons[0];openLesson(L.id)}

// мягкая плашка: опора главы (OPORY.need) ещё не пройдена; закрывается, ничего не блокирует
function needHTML(id){
 const o=OPORY[id];if(!o||(S.needx||{})[id])return '';
 const miss=o.need.filter(n=>CHAPTERS[n]&&chById(n)&&!chDone(CHAPTERS[n]));if(!miss.length)return '';
 const show=miss.slice(0,3),more=miss.length-show.length;
 return `<aside class="needbox" role="note"><div class="nb"><b>Здесь ${show.length>1?'нужны темы':'нужна тема'} ${show.map(n=>`«${chById(n).t}»`).join(', ')}${more?` и ещё ${more}`:''} — повторить.</b>
 <div class="nl">${show.map(n=>`<button class="linkbtn" data-needgo="${n}">${chById(n).t} ›</button>`).join('')}</div></div>
 <button class="needx" data-needx="${id}" aria-label="Закрыть подсказку"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></aside>`;
}

// блок «Повторить ступень» в содержании и в конце последней главы ступени
function stepBtnHTML(id,cls){
 const s=stepOf(id);if(!s||s.ch[s.ch.length-1]!==id||!stepTestable(s))return '';
 const r=(S.steps||{})[s.n];
 return `<button class="stbtn ${cls||''}" data-stepgo="${s.n}">${modeIco('tests',20)}<span class="b"><b>Повторить ступень ${s.n}</b><small>${s.t} · итоговый тест и смешанный тренажёр${r?` · тест: ${r.best}`:''}</small></span><span class="hmact">Повторить</span></button>`;
}
const stepTestable=s=>stepReady(s).some(id=>CHAPTERS[id].tests||(CHAPTERS[id].bank||[]).length);

// ---------- страница ступени ----------
const STEP_LEN=15;           // вопросов в итоговом тесте ступени
let STC=15;                  // заданий в смешанном тренажёре
// по кругу по главам и урокам: вопросы разных глав, не подряд из одной
function roundRobin(lists,n){const out=[];for(let r=0;out.length<n&&lists.some(a=>a[r]);r++)lists.forEach(a=>{if(a[r]&&out.length<n)out.push(a[r])});return out}
function stepTStart(n){
 const s=STEPS[n-1],lists=stepReady(s).filter(id=>CHAPTERS[id].tests).map(id=>{const c=CHAPTERS[id];
  return roundRobin(c.lessons.map((_,i)=>shuffle(c.tests.filter(x=>x.l===i+1))),9999).map(sl=>[id,sl])});
 const pick=shuffle(roundRobin(lists,STEP_LEN));
 TS={ch:null,step:n,key:'step',title:`Итоговый тест ступени ${n}`,qs:pick.map(([id,sl])=>{const B=tBuild(sl);B.ch=id;return B}),i:0,ans:[],t0:Date.now(),res:null};
}
// задание тренажёра годится, если верный ответ среди вариантов (у «Н и НН» набор по умолчанию — н/нн)
const stepItemOk=(c,b)=>b&&b.w&&b.a&&(b.opts?b.opts.includes(b.a):c.id==='nn'&&['н','нн'].includes(b.a));
function stepTrStart(n){
 const s=STEPS[n-1];
 const lists=stepReady(s).map(id=>{const c=CHAPTERS[id],m=chById(id);
  return shuffle((c.bank||[]).filter(b=>stepItemOk(c,b))).map(b=>Object.assign({},b,{c,cn:m.t}))}).filter(a=>a.length);
 const items=shuffle(roundRobin(lists,STC));
 TR.ch='step-'+n;TR.les=[];TR.mode='pick';TR.cnt=STC;
 TR.run=items.length?{tasks:items.map(it=>({k:'pick',it})),i:0,ok:0,tot:0,wrong:[],pool:items}:null;
}
function stepTrHTML(n){
 if(TR.run&&TR.ch==='step-'+n)return `<div class="study" id="trainer">${trRunHTML()}</div>`;
 const s=STEPS[n-1],cnt=stepReady(s).reduce((x,id)=>x+(CHAPTERS[id].bank||[]).filter(b=>stepItemOk(CHAPTERS[id],b)).length,0);
 return `<div class="study" id="trainer"><div class="blab"><div class="cap"><b>Смешанный тренажёр ступени</b><span class="bkhint">в банках глав ${cnt} заданий</span></div>
 <p class="bkhint">Задания по одному из всех глав ступени вперемешку. Ошибки можно повторить в конце серии.</p>
 <div class="tl">Сколько заданий</div><div class="seg" role="radiogroup">${[10,15,20,30].map(x=>`<button role="radio" data-stc="${x}" aria-pressed="${STC===x}">${x}</button>`).join('')}</div>
 <button class="bkldone" data-sttr="${n}" ${cnt?'':'disabled'}>Начать</button></div></div>`;
}
function stepTestsHTML(){
 const n=route.n,r=(S.steps||{})[n];
 if(TS&&TS.step===n&&TSV==='run')return `<div id="tests" class="bktext">${TS.res?tResHTML(null):tRunHTML(null)}</div>`;
 const s=STEPS[n-1],has=stepReady(s).some(id=>CHAPTERS[id].tests);
 const paused=TS&&TS.step===n&&!TS.res?`<div class="tsrow tspause"><div class="tsinfo"><b>Начатый тест</b><span>Отвечено ${TS.ans.filter((a,i)=>tAnswered(TS.qs[i],a)).length} из ${TS.qs.length}</span></div><button class="bkldone" data-stcont>Продолжить</button></div>`:'';
 return `<div id="tests" class="bktext"><div class="tsrow fin"><div class="tsinfo"><b>Итоговый тест ступени</b><span>${Math.min(STEP_LEN,stepReady(s).reduce((x,id)=>x+((CHAPTERS[id].tests||[]).length),0))} вопросов из тестов глав, в случайном порядке${r?` · лучшая оценка ${r.best} · попыток ${r.tries}`:' · ещё не пройден'}</span></div>
 <button class="${r?'ghost':'bkldone'}" data-stgo ${has?'':'disabled'}>${r?'Ещё раз':'Начать'}</button></div>${paused}</div>`;
}
function stepHTML(n){
 const s=STEPS[n-1],prev=STEPS[n-2],next=STEPS[n];
 const rows=s.ch.map(id=>{const m=chById(id),c=CHAPTERS[id];
  if(!c)return `<li class="stch soon"><span class="cn">${chNum(m)}</span><span class="cb"><span class="ct">${m.t}</span></span><span class="wait">скоро</span></li>`;
  const d=c.lessons.filter(l=>S.done[l.id]).length;
  return `<li class="stch"><button data-stchap="${id}"><span class="cn">${chNum(m)}</span><span class="cb"><span class="ct">${m.t}</span><span class="cs">${chDone(c)?'✓ пройдена':d?`пройдено уроков: ${d} из ${c.lessons.length}`:`${c.lessons.length} ${plural(c.lessons.length,'урок','урока','уроков')}`}</span></span><span class="lgo" aria-hidden="true">›</span></button></li>`}).join('');
 return `<div class="bkhbar"><div class="in"><button class="back" data-home>‹ Оглавление</button><span class="tools"><span class="where">Ступень ${n} из ${STEPS.length}</span></span></div></div><div class="wrap stepw">
 <header class="chhead"><div style="display:flex;flex-direction:column;gap:2px;min-width:0"><div class="kick">Повторение ступени ${n}</div><h2>${s.t}</h2><div class="sub">Итоговый тест и смешанный тренажёр по главам ступени. Ничего не блокируется: повторять можно в любое время.</div></div></header>
 <section class="stsec"><h3 class="hmh">Главы ступени</h3><ol class="stchs">${rows}</ol></section>
 <section class="stsec"><h3 class="hmh">Итоговый тест</h3>${stepTestsHTML()}</section>
 <section class="stsec"><h3 class="hmh">Смешанный тренажёр</h3>${stepTrHTML(n)}</section>
 <nav class="bpn">${prev?`<button data-stepgo="${prev.n}">‹ Ступень ${prev.n}</button>`:'<button disabled></button>'}${next?`<button data-stepgo="${next.n}">Ступень ${next.n} ›</button>`:'<button disabled></button>'}</nav></div>`;
}
// итог теста ступени: запись в S.steps и журнал попыток
function stepFinish(){
 const sc=TS.qs.map((B,i)=>tScore(B,TS.ans[i])),sum=sc.reduce((x,y)=>x+y,0),p=sum/TS.qs.length,g=tGrade(p);
 S.steps=S.steps||{};const r=S.steps[TS.step]||{best:0,tries:0};r.tries++;r.last=g;r.best=Math.max(r.best,g);r.at=today();S.steps[TS.step]=r;
 S.tlog=(S.tlog||[]).concat({t:'step:'+TS.step,g,p:Math.round(p*100),n:TS.qs.length,at:Date.now(),sec:Math.round((Date.now()-TS.t0)/1000)}).slice(-300);
 save();TS.res={sc,sum,p,g};
}

document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;const d=b.dataset;
 if(d.hnext){openChFirst(d.hnext);return}
 if(d.needgo){S.tab='theory';save();go({v:'ch',id:d.needgo});return}
 if(d.needx){S.needx=S.needx||{};S.needx[d.needx]=1;save();const bx=b.closest('.needbox');if(bx)bx.remove();return}
 if(d.stepgo){go({v:'step',n:+d.stepgo});TSV=TS&&TS.step===+d.stepgo?'run':'list';render();return}
 if(d.stchap){S.tab='theory';save();go({v:'ch',id:d.stchap});return}
 if(route.v!=='step')return;
 if('stgo' in d){stepTStart(route.n);TSV='run';tsRe();return}
 if('stcont' in d){TSV='run';tsRe();return}
 if(d.stc){STC=+d.stc;trRe();return}
 if(d.sttr){stepTrStart(+d.sttr);trRe(true);return}
});
