// Дымовой тест: все схемы «Причастия», все режимы тренажёра, упражнения, навигация, глоссарий, словари.
// Запуск: node tools/test/smoke.js   (нужен playwright: npm i -D playwright && npx playwright install chromium)
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const ROOT=path.resolve(__dirname,'../..');const T=path.join(ROOT,'dist','_smoke.html');const U='file://'+T;
const ok=[],fail=[];const check=(c,msg)=>(c?ok:fail).push(msg);
(async()=>{
 fs.writeFileSync(T,'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync(path.join(ROOT,'dist/index.html'),'utf8')+'</body></html>');
 const b=await chromium.launch();const errs=[];
 const p=await b.newPage({viewport:{width:400,height:900}});p.on('pageerror',e=>errs.push(e.message));
 // схемы
 await p.goto(U+'#ch-prichastie');
 for(const s of ['[data-parse="1"]','[data-matrix="прийти"]','[data-build="нести"]','[data-bf="2"]','[data-spr="4"]','[data-pair="2"]','[data-decl="строящийся"]','[data-dg="2"]','[data-new="1"]','[data-cm="3"]','[data-kpos="before"]'])
  {const el=await p.$(s);check(!!el,'схема: '+s);if(el)await el.click()}
 check(await p.evaluate(()=>document.querySelectorAll('.bterm').length)>50,'автоссылки терминов');
 // тренажёр
 await p.click('[data-tab="train"]');
 for(const m of ['pick','cols','err']){await p.click(`[data-trm="${m}"]`);await p.click('[data-trc="20"]');await p.click('[data-trgo]');let steps=0;
  for(let k=0;k<25;k++){
   if(await p.$('[data-trp]:not([disabled])')) await p.click('[data-trp]:not([disabled])');
   if(await p.$('[data-trp]:not([disabled])')&&!(await p.$('[data-trnext]'))) await p.click('[data-trp]:not([disabled])');
   if(await p.$('[data-tre]:not([disabled])')) await p.click('[data-tre]');
   while(await p.$('[data-trset]')) await p.click('[data-trset]');
   if(await p.$('[data-trcheck]:not([disabled])')) await p.click('[data-trcheck]');
   if(await p.$('[data-trnext]')){await p.click('[data-trnext]');steps++} else break;}
  check(steps>0,'тренажёр, режим '+m);await p.click('[data-trsetup]');}
 // упражнения и звёзды
 await p.click('[data-tab="classic"]');await p.click('[data-cls="5"]');const n5=await p.evaluate(()=>document.querySelectorAll('.clex').length);
 await p.click('[data-cls="0"]');const nAll=await p.evaluate(()=>document.querySelectorAll('.clex').length);
 check(nAll>=40&&n5>0&&n5<nAll,`упражнения: всего ${nAll}, ★★★★★ ${n5}`);
 // глава Н и НН
 await p.goto(U+'#ch-nn');await p.click('[data-tab="train"]');
 check((await p.evaluate(()=>document.querySelector('#trainer').innerText)).includes('в банке 89 '),'тренажёр «Н и НН»: 89 заданий');
 // оглавление → урок
 await p.goto(U+'#toc');await p.click('[data-ojump2="pr4"]');await p.waitForTimeout(500);
 check(await p.evaluate(()=>Math.abs(document.getElementById('pr4').getBoundingClientRect().top)<200),'переход к уроку из оглавления');
 check((await p.evaluate(()=>location.hash))==='#ch-prichastie/theory/pr4','урок в адресе: #ch-prichastie/theory/pr4');
 // «назад»: вкладка главы — запись истории; «назад» возвращает к теории, а не в оглавление
 await p.evaluate(()=>document.querySelector('[data-tab="train"]').click());check((await p.evaluate(()=>location.hash))==='#ch-prichastie/train','вкладка в адресе');
 await p.goBack();await p.waitForTimeout(200);check((await p.evaluate(()=>location.hash))==='#ch-prichastie/theory/pr4'&&!!await p.$('#pr4'),'«назад» после смены вкладки — к уроку');
 // навигатор главы
 await p.click('.fab');check(!!await p.$('.sheet.navs [data-nvgo]'),'навигатор главы');await p.goBack();await p.waitForTimeout(100);check(!await p.$('.sheet'),'«назад» закрывает навигатор');
 // термин → шторка → урок
 await p.click('#pr4 .bterm');check(!!await p.$('.sheet'),'шторка термина');
 if(await p.$('.sheet [data-tsee]')){await p.click('.sheet [data-tsee]');check(!!await p.$('[data-shback]'),'переход к связанному термину')}
 await p.click('[data-close]');
 await p.click('[data-outline]');check(await p.evaluate(()=>document.querySelectorAll('.otl [data-ojump]').length)>7,'содержание главы');await p.click('[data-close]');
 // глоссарий, словарик, словарь
 await p.goto(U+'#glossary');check(await p.evaluate(()=>document.querySelectorAll('.gterm').length)>100,'глоссарий');
 await p.fill('#gq','причаст');check(await p.evaluate(()=>document.querySelectorAll('.gterm').length)>2,'поиск в глоссарии');
 await p.goto(U+'#dict');check(await p.evaluate(()=>document.querySelectorAll('.dw').length)>250,'словарик правописания');
 await p.click('.wcloud [data-word="деревянный"]');
 for(let i=1;i<=5;i++)await p.click(`[data-wstep][data-to="${i}"]`);
 check(await p.evaluate(()=>document.querySelectorAll('.mword .m-root,.mword .m-suf,.mword .m-end').length)===3,'разбор по шагам');
 await p.goto(U+'#ch-prichastie');check(await p.evaluate(()=>document.querySelectorAll('.bktext .wl').length)>5,'ссылки на слова в примерах');
 // поиск
 await p.goto(U+'#toc');const tc=await p.$('.tch.rdy:not(.open) [data-tchap]');if(tc){await tc.click();check(await p.evaluate(()=>document.querySelectorAll('.tch.rdy.open .tles [data-ojump2]').length>0),'оглавление: глава раскрывается')}
 await p.goto(U+'#toc');await p.fill('#q','деревян');check(await p.evaluate(()=>document.querySelectorAll('#sres button').length)>1,'поиск на главной');
 // упражнения: номера, задание по номерам, ссылка, поиск номера
 const cnt=()=>p.evaluate(()=>document.querySelectorAll('.clex').length);
 await p.goto(U+'#ch-prichastie');await p.click('[data-tab="classic"]');
 check(await p.evaluate(()=>document.querySelectorAll('.clnav [data-clgo]').length)===await p.evaluate(()=>document.querySelectorAll('.clex').length),'карта номеров упражнений');
 await p.fill('.clnav [data-clform] input','12–15');await p.press('.clnav [data-clform] input','Enter');
 check(await cnt()===4&&(await p.evaluate(()=>location.hash))==='#ex-prichastie-12-15','задание «12–15»: только 4 упражнения и ссылка');
 await p.click('[data-clall]');await p.click('[data-cls="5"]');await p.click('.clnav [data-clgo="3"]');await p.waitForTimeout(100);
 check(await cnt()>=100,'переход к номеру снимает фильтры');
 await p.goto(U+'#ex-nn-4-6,10');await p.reload();check(await cnt()===4,'ссылка на упражнения 4–6, 10');
 await p.goto(U+'#toc');await p.fill('#q','5.6.12');check(await p.evaluate(()=>!!document.querySelector('[data-exgo="prichastie:12"]')),'поиск упражнения по номеру 5.6.12');
 await p.click('[data-exgo="prichastie:12"]');check(await cnt()===1,'переход из поиска к упражнению');
 await p.goto(U+'#ch-prichastie');await p.click('[data-tab="theory"]');
 // тесты «Причастия» и термины в упражнениях
 p.on('dialog',d=>d.accept());
 await p.goto(U+'#ch-prichastie');await p.click('[data-tab="classic"]');
 check(await p.evaluate(()=>document.querySelectorAll('.clex .bterm').length)>50,'термины кликабельны в упражнениях');
 await p.click('[data-tab="tests"]');check(await p.evaluate(()=>document.querySelectorAll('#tests [data-tsgo]').length)===8,'список тестов: 7 уроков + итоговый');
 for(const key of ['2','final']){
  await p.click(`#tests [data-tsgo="${key}"]`);let qn=0;
  for(let k=0;k<20;k++){
   if(!(await p.$('.tscard')))break;qn++;
   const kind=await p.evaluate(()=>document.querySelector('.tscard .ty').innerText);
   if(/вписать/i.test(kind))await p.fill('[data-tsform] input','а');
   else if(/разложить/i.test(kind)){const n=(await p.$$('.tssr')).length;for(let i=0;i<n;i++)await p.click(`[data-tss="${i}"]`)}
   else await p.click('[data-tsa="0"]');
   await p.click('[data-tsnext]');
  }
  check(!!(await p.$('.tsgrade'))&&qn===(key==='final'?12:6),`тест ${key==='final'?'итоговый':'по уроку '+key}: ${qn} вопросов, оценка`);
  await p.click('[data-tslist]');
 }
 check(await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('rus-uchebnik-v1'));return !!(s.tests&&s.tests['prichastie:final']&&s.tlog&&s.tlog.length===2)}),'результаты тестов сохраняются');
 // тесты «Н и НН»: список и прохождение
 await p.goto(U+'#ch-nn');await p.click('[data-tab="tests"]');check(await p.evaluate(()=>document.querySelectorAll('#tests [data-tsgo]').length)===7,'«Н и НН»: список тестов — 6 уроков + итоговый');
 for(const key of ['1','final']){
  await p.click(`#tests [data-tsgo="${key}"]`);let qn=0;
  for(let k=0;k<20;k++){
   if(!(await p.$('.tscard')))break;qn++;
   const kind=await p.evaluate(()=>document.querySelector('.tscard .ty').innerText);
   if(/вписать/i.test(kind))await p.fill('[data-tsform] input','н');
   else if(/разложить/i.test(kind)){const n=(await p.$$('.tssr')).length;for(let i=0;i<n;i++)await p.click(`[data-tss="${i}"]`)}
   else await p.click('[data-tsa="0"]');
   await p.click('[data-tsnext]');
  }
  check(!!(await p.$('.tsgrade'))&&qn===(key==='final'?12:6),`«Н и НН», тест ${key==='final'?'итоговый':'по уроку '+key}: ${qn} вопросов, оценка`);
  await p.click('[data-tslist]');
 }
 // банки тестов всех глав: данные согласованы (ответ среди вариантов, группы известны, в уроке не меньше 6 вопросов)
 await p.goto(U+'?selftest#toc');
 const tbad=await p.evaluate(()=>{const out=[];for(const c of Object.values(window.__T.CHAPTERS)){if(!c.tests)continue;
  c.lessons.forEach((_,i)=>{const n=c.tests.filter(s=>s.l===i+1).length;if(n<6)out.push(c.id+': урок '+(i+1)+' — '+n+' вопросов')});
  c.tests.forEach((s,j)=>{const id=c.id+'#'+j;if(!s.q||!s.q.length)out.push(id+' нет формулировки');
   const its=s.items||[null];its.forEach(it=>{let a=s.a,o=s.o;if(Array.isArray(it)){a=it[1]}else if(it){a=it.a!==undefined?it.a:a;o=it.o||o}
    if(s.k==='one'&&!(o||[]).includes(a))out.push(id+' ответ «'+a+'» не среди вариантов');
    if(s.k==='sort'&&!s.cats.includes(a))out.push(id+' группа «'+a+'» неизвестна');
    if(s.k==='type'&&!(a&&String(a).trim()))out.push(id+' пустой ответ')});
   if(s.k==='many'&&!(s.a||[]).every(x=>s.o.includes(x)))out.push(id+' ответ не среди вариантов')})}
  return out});
 check(!tbad.length,'банки тестов согласованы'+(tbad.length?': '+tbad.slice(0,5).join('; '):''));
 // механики тренажёра: каждое сгенерированное задание решаемо, верное решение засчитывается
 await p.goto(U+'?selftest#ch-prichastie');
 const mres=await p.evaluate(()=>{const {MECH,CHAPTERS,mGen,mAvail}=window.__T,out=[];
  const solve={hlw:t=>{t.sel=t.items.map((x,i)=>x.y?i:-1).filter(i=>i>=0)},hls:t=>{t.sel=t.u.map((x,i)=>x.y&&!x.pu?i:-1).filter(i=>i>=0)},cm:t=>{t.sel=[...t.need]},
   sx:t=>{t.u.forEach((x,i)=>{if(x.pu)return;const y=t.full?x.mem:(x.mem==='П'||x.mem==='С'?x.mem:'');if(y)t.mk[i]=y})},bw:t=>{t.sel=[...t.a]},
   mp:t=>{let pos=-1;t.b=[];t.a.slice(0,-1).forEach(([ty,x])=>{pos+=x.length;t.b.push(pos)});let s=0;t.a.forEach(([ty,x])=>{t.ty[s+'-'+(s+x.length-1)]=ty;s+=x.length})},
   gr:t=>{t.items.forEach((x,i)=>t.mk[i]=x.k)},pr:t=>{t.L.forEach(v=>t.pm[v]=t.a[v])},mx:t=>{t.mk=[...t.a]},gw:t=>{t.sel=t.a;t.rsel=t.r},nw:t=>{t.sel=t.a;t.rsel=t.r},
   gs:t=>{t.sel=t.a;t.rsel=t.r},gt:t=>{t.gaps.forEach((g,i)=>t.sel[i]=g.a)},tx:t=>{t.gaps.forEach((g,i)=>t.sel[i]=g.a)},fo:t=>{t.sel=t.sp[0]}};
  for(const id of ['prichastie','nn']){const c=CHAPTERS[id],les=c.lessons.map((_,i)=>i+1);
   for(const m of mAvail(c,les)){let ok=0,wrong=0;for(let k=0;k<30;k++){const t=mGen(c,m,les);if(MECH[m].grade(t).ok&&!(m==='cm'&&!t.need.length))wrong++; /* без запятых пустой ответ верен */
    solve[m](t);if(MECH[m].ready(t)&&MECH[m].grade(t).ok)ok++}out.push([id+':'+m,ok,wrong])}}
  return out});
 mres.forEach(([m,ok,wrong])=>check(ok===30&&wrong===0,`механика ${m}: верное решение засчитано ${ok}/30, пустое — ${wrong}`));
 // общий корпус: уровни доступа и полнота разметки
 const cor=await p.evaluate(()=>{const T=window.__T,u=T.CORPUS_S.map(s=>[s,T.corpusSents('prichastie',{}).length]);
  const units=[...T.CORPUS_S,...T.CORPUS_T.flatMap(x=>x.s)].map(s=>s.replace(/^#\S*\s+/,'').split(' ')); // предложения и связные тексты
  const unmarked=units.flat().filter(t=>!/^[,.!?:;—]/.test(t)&&!/\{(?:о;)?ч:(?:союз|част)(?:,(?:союз|част))*\}$/.test(t)&&!(/\{[^}]*[ПСОДБ][;}]/.test(t)&&/ч:/.test(t))).length; // у каждой единицы — член предложения и часть речи (союз и частица отдельно — не член предложения)
  const badComma=units.flat().filter(t=>/^,/.test(t)&&!/^,\{\S+\}$/.test(t)).length;
  const badOrth=units.flat().filter(t=>/ор:/.test(t)).filter(t=>{const m=t.match(/^(.+?)\{.*ор:([^:;}]+):([^:;}]+):([^;}]+)/);if(!m)return true;const words=m[1].split('_').map(w=>w.toLowerCase());
   return !words.includes(m[2].replace('_',m[3]).toLowerCase())||!m[4].split('|').every(k=>k in window.__T.ORTHO_R)}).length; // пропуск находится в слове, правила существуют                     // у каждой запятой — причина
  return {badOrth,all:T.CORPUS_S.length,pr:T.corpusSents('prichastie',{commas:true,has:u=>u.some(x=>x.ob)}).length,sushPos:T.corpusSents('sush',{pos:['прич']}).length,
   sushOb:T.corpusSents('sush',{}).filter(u=>u.some(x=>x.ob)).length,texts:T.CORPUS_T.length,textsNN:T.corpusTexts('nn',{orthOnly:true}).length,zvukiW:T.corpusWords('zvuki').length,unmarked,badComma}});
 const ord=await p.evaluate(()=>window.__T.orderCheck());
 check(ord==='',`порядок изучения: все главы и темы на месте${ord?' — нет: '+ord:''}`);
 const opo=await p.evaluate(()=>window.__T.oporyCheck());
 check(opo==='',`последовательное изучение: опоры глав и глоссарий (at, ch) согласованы с маршрутом${opo?' — '+opo.slice(0,300):''}`);
 check(cor.badOrth===0,'корпус: все орфограммы на месте и с известными правилами');
 check(cor.unmarked===0&&cor.badComma===0,`корпус: разметка полная (${cor.all} предложений)`);
 check(cor.texts===cor.textsNN,`корпус: связные тексты (${cor.texts}) доступны в теме «Н и НН» целиком`);
 check(cor.pr>=10&&cor.sushPos===0&&cor.sushOb===0&&cor.zvukiW===0,`корпус: уровни — «Причастие» ${cor.pr} предложений с оборотом, «Существительное» без причастий, «Звуки» без слов`);
 await p.click('[data-tab="train"]');if(await p.$('[data-trsetup]'))await p.click('[data-trsetup]');await p.click('[data-trm="all"]');await p.click('[data-trgo]');
 check(!!(await p.$('#trainer .card')),'серия «все виды вперемешку» запускается');

 // ---------- главная, кабинет, статистика на устройстве ----------
 {const ctx=await b.newContext({viewport:{width:400,height:900},acceptDownloads:true});const q=await ctx.newPage();q.on('pageerror',e=>errs.push('главная: '+e.message));
  const LS=()=>q.evaluate(()=>JSON.parse(localStorage.getItem('rus-uchebnik-v1')||'{}'));const hash=()=>q.evaluate(()=>location.hash);
  await q.goto(U);
  check(!!await q.$('.hm .hmcont')&&(await hash())==='#home','главная открывается по умолчанию (#home)');
  check((await q.innerText('.hmcont')).includes('Начать с первой главы'),'новый ученик: «Начать с первой главы»');
  await q.click('.hmbig[data-hgo="toc"]');check(!!await q.$('.tparts')&&(await hash())==='#toc','«Учебник» ведёт в содержание (#toc)');
  await q.click('.back[data-hgo="home"]');check(!!await q.$('.hm')&&(await hash())==='#home','«назад» из содержания — на главную');
  await q.fill('#q','деревян');check(await q.evaluate(()=>document.querySelectorAll('#sres button').length)>1,'поиск на главной странице');
  // старое сохранение без новых полей
  await q.evaluate(()=>localStorage.setItem('rus-uchebnik-v1',JSON.stringify({done:{pr1:true,'cl-prichastie-3':true},cards:{},view:'book',last:'pr2',tab:'theory',tests:{'prichastie:1':{best:4,last:4,tries:1,at:20000}}})));
  await q.goto(U+'#me');await q.reload();const oldMe=!!await q.$('.mech');
  await q.goto(U+'#home');await q.reload();
  check(oldMe&&(await q.innerText('.hmcont')).includes('Причастие')&&!!await q.$('[data-hun="prichastie"]'),'старое сохранение без новых полей открывается: «Продолжить», «Не доведено до конца», кабинет');
  await q.click('[data-hcont]');await q.waitForTimeout(150);check((await hash())==='#ch-prichastie/theory/pr2','«Продолжить» ведёт к уроку, на котором остановился');
  // ответы тренажёра → S.ans (первая попытка, по уроку)
  await q.goto(U+'#ch-prichastie/train');await q.click('[data-trm="pick"]');await q.click('[data-trgo]');
  for(let k=0;k<4;k++){await q.click('[data-trp]:not([disabled])');await q.click('[data-trnext]')}
  let s=await LS();const an=Object.values(s.ans||{}),sum=an.reduce((x,a)=>x+a.n,0);
  check(sum===4&&an.every(a=>/^[01]+$/.test(a.r)&&a.r.length===a.n&&a.ok<=a.n)&&Object.keys(s.ans).every(k=>/^pr\d$/.test(k)),`после 4 ответов в тренажёре в S.ans — 4 записи по урокам (${sum})`);
  check(s.at&&s.at.ch==='prichastie'&&s.at.tab==='train','место остановки запоминается (S.at)');
  // слабый урок: 8 ответов, меньше 70 % верных → «Стоит повторить» → тренажёр этого урока
  await q.goto(U+'?selftest#home');
  await q.evaluate(()=>{const T=window.__T,c=T.CHAPTERS.nn;for(let i=0;i<8;i++)T.statAns(c,2,i%2===0)});
  await q.goto(U+'#home');await q.reload();
  check(!!await q.$('[data-hrep="nn2"]'),'«Стоит повторить»: урок с ошибками появляется на главной');
  await q.click('[data-hrep="nn2"]');check((await hash())==='#ch-nn/train/nn2'&&!!await q.$('#trainer'),'«Повторить» открывает тренажёр этого урока');
  // заданное недавно
  await q.goto(U+'#ex-prichastie-12-15');await q.goto(U+'#home');await q.reload();
  check(!!await q.$('[data-hex="prichastie:12-15"]'),'«Заданное недавно»: открытая ссылка #ex-… запоминается');
  await q.click('[data-hex="prichastie:12-15"]');check((await hash())==='#ex-prichastie-12-15'&&await q.evaluate(()=>document.querySelectorAll('.clex').length)===4,'заданное открывается: только эти упражнения');
  // активное время: копится между действиями, перерыв от 5 минут не засчитывается
  const t0=new Date(2026,10,11,10,0,0).getTime(),DK='2026-11-11';let now=t0;
  const tick=async sec=>{now+=sec*1000;await q.clock.setFixedTime(now);await q.mouse.click(390,5)};
  await q.clock.setFixedTime(now);await q.goto(U+'?selftest#home');await q.reload();
  const tsec=()=>q.evaluate(k=>(window.__T.getS().time||{})[k]||0,DK);
  await tick(0);await tick(60);await tick(60);const tA=await tsec();
  await tick(360);const tB=await tsec();await tick(30);const tC=await tsec();
  check(tA===120,`время копится между действиями: 2 минуты → ${tA} с`);
  check(tB===120,`после 6 минут без действий время не прибавилось (${tB} с)`);
  check(tC===150,`после перерыва счёт идёт дальше (${tC} с)`);
  check(((await LS()).time||{})[DK]>=120,'время записано в localStorage (не чаще раза в 45 с)');
  await q.goto(U+'#home');await q.reload();check((await q.innerText('.hmweek')).includes('3 мин')&&!!await q.$('.hmday.on.td'),'«Моя неделя»: сегодняшний день отмечен, время показано');
  // серия «дни подряд»: считается из S.time; сегодня засчитан → happy; вчера был, сегодня нет → nudge; откат времени пересчитывает
  await q.goto(U+'?selftest#home');await q.reload();
  const sk=await q.evaluate(()=>{const T=window.__T,S=T.getS(),d=new Date(2026,10,11),k=n=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate()-n);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')};
   const run=(o,fn)=>{S.time=o;return T.streakInfo(d)};const r={};
   r.empty=run({});r.short=run({[k(0)]:30});r.three=run({[k(0)]:90,[k(1)]:90,[k(2)]:90});r.nudge=run({[k(1)]:90,[k(2)]:90});r.gap=run({[k(0)]:90,[k(2)]:90,[k(3)]:90,[k(4)]:90});r.old=run({[k(2)]:90});return r});
  check(sk.empty.n===0&&sk.empty.st==='calm'&&sk.short.n===0&&sk.short.st==='calm','серия: пусто или меньше минуты — 0, состояние «спокоен»');
  check(sk.three.n===3&&sk.three.st==='happy'&&sk.three.today,'серия: три дня подряд, сегодня засчитан — 3, «радуется»');
  check(sk.nudge.n===2&&sk.nudge.st==='nudge'&&!sk.nudge.today,'серия: вчера был, сегодня ещё нет — серия жива, «мягко напоминает»');
  check(sk.gap.n===1&&sk.gap.best===3&&sk.old.n===0&&sk.old.st==='calm','серия: пропуск обрывает счёт без штрафа, лучшая серия помнится, позавчера — уже не серия');
  await q.evaluate(()=>{const S=window.__T.getS(),d=new Date(),k=n=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate()-n);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')};S.time={[k(0)]:120,[k(1)]:120};window.__T.timeFlush()});
  await q.evaluate(()=>{const S=window.__T.getS();localStorage.setItem('rus-uchebnik-v1',JSON.stringify(S))});
  await q.goto(U+'#home');await q.reload();
  check(!!await q.$('.hmstreak svg.mk-happy')&&(await q.innerText('.hmstreak')).includes('2 дня подряд'),'главная: виджет серии и радостный маскот');
  await q.goto(U+'#me');await q.reload();check(!!await q.$('.hmstreak.me svg.mk'),'кабинет: виджет серии');
  await q.goto(U+'?selftest#home');await q.reload();
  await q.evaluate(()=>{const S=window.__T.getS();S.time={};localStorage.setItem('rus-uchebnik-v1',JSON.stringify(S))});
  await q.goto(U+'#home');await q.reload();
  check(!!await q.$('.hmstreak svg.mk-calm')&&!(await q.innerText('.hmstreak')).match(/\d+ (день|дня|дней) подряд/),'откат времени (S.time пуст): серия пересчитана, маскот спокоен');
  // профиль
  await q.click('.hmava');check((await hash())==='#me'&&!!await q.$('[data-meform]'),'кабинет открывается, без имени — форма профиля');
  await q.fill('[data-meform] [name=name]','Тимур');await q.fill('[data-meform] [name=sur]','Каримов');await q.fill('[data-meform] [name=cls]','7 Б');await q.press('[data-meform] [name=cls]','Enter');
  check((await q.innerText('.meprof')).includes('Тимур Каримов')&&(await LS()).prof.cls==='7 Б','профиль: имя, фамилия и класс сохраняются');
  // копия: текстом, файлом, загрузка обратно, стирание
  await q.click('[data-bk="text"]');const copy=await q.inputValue('#bkout');let cj={};try{cj=JSON.parse(copy)}catch(e){}
  check(cj.app==='rus-uchebnik'&&cj.v===1&&cj.by==='Тимур Каримов'&&cj.at>0&&cj.data&&cj.data.ans&&cj.data.tests,'копия как текст: {app,v,by,at,data}');
  await q.evaluate(()=>{const c=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){window.__dl=this.download;return c.call(this)}});
  const [dl]=await Promise.all([q.waitForEvent('download'),q.click('[data-bk="save"]')]);const dn=await q.evaluate(()=>window.__dl);
  check(!!dl&&/^uchebnik-Тимур-Каримов-2026-11-11\.json$/.test(dn),'«Сохранить копию»: скачивается файл '+dn);
  await q.click('[data-wipe="1"]');await q.click('[data-wipe="2"]');check(!!(await LS()).tests,'стирание: после двух шагов данные ещё на месте');
  await q.click('[data-wipe="3"]');s=await LS();
  check(!s.tests&&!s.ans&&!s.prof&&!s.time&&(await hash())==='#home'&&(await q.innerText('.hmcont')).includes('Начать с первой главы'),'«Стереть все данные»: данных нет, главная — как у нового ученика');
  await q.goto(U+'#me');await q.click('[data-bk="paste"]');await q.fill('#bkin','это не копия');await q.click('[data-bk="check"]');
  check(!!await q.$('.meerr')&&!await q.$('#bkpv'),'чужой текст вместо копии — понятная ошибка, данные не тронуты');
  await q.fill('#bkin',copy);await q.click('[data-bk="check"]');
  check((await q.innerText('#bkpv')).includes('Тимур Каримов'),'перед загрузкой показано, чья копия и что в ней');
  await q.click('[data-bk="apply"]');s=await LS();
  check(s.prof&&s.prof.name==='Тимур'&&s.tests&&s.tests['prichastie:1'].last===4&&s.ans&&s.ans.nn2.n===8&&s.done.pr1===true&&(await q.innerText('.hmtop')).includes('Тимур'),'копия загружается обратно: профиль, тесты, ответы, уроки');
  await q.goto(U+'#me');await q.click('[data-wipe="1"]');await q.click('[data-wipe="2"]');await q.click('[data-wipe="3"]');
  await q.goto(U+'#me');await q.setInputFiles('#bkfile',{name:'copy.json',mimeType:'application/json',buffer:Buffer.from(copy)});await q.waitForSelector('#bkpv');await q.click('[data-bk="apply"]');
  check((await LS()).prof.sur==='Каримов','копия загружается из файла');
  await ctx.close();}
 // ---------- маршрут: метки ступеней, «Следующая по маршруту», плашка опор, «Повторение ступени» ----------
 {const ctx=await b.newContext({viewport:{width:400,height:900}});const q=await ctx.newPage();q.on('pageerror',e=>errs.push('маршрут: '+e.message));q.on('dialog',d=>d.accept());
  const LS=()=>q.evaluate(()=>JSON.parse(localStorage.getItem('rus-uchebnik-v1')||'{}'));const hash=()=>q.evaluate(()=>location.hash);
  await q.goto(U+'?selftest#toc');
  check(await q.evaluate(()=>window.__T.stepsCheck())==='','ступени (STEPS) совпадают с порядком глав COURSE_ORDER');
  const nst=await q.evaluate(()=>window.__T.STEPS.length);
  // Г.2 (1): метка ступени у каждой главы в содержании
  const lab=await q.evaluate(()=>[...document.querySelectorAll('.tch')].map(x=>(x.querySelector('.cstep')||{}).textContent||''));
  check(lab.length>=40&&lab.every(t=>/^Ступень \d+ · \S/.test(t)),`содержание: у каждой из ${lab.length} глав метка ступени`);
  check(lab[0]==='Ступень 1 · Звуки'&&lab.includes('Ступень 14 · Нормы речи'),'метки: «Ступень 1 · Звуки» … «Ступень 14 · Нормы речи»');
  const nb=await q.evaluate(()=>document.querySelectorAll('.tstep [data-stepgo]').length);
  check(nb===nst,`содержание: кнопка «Повторить ступень» после каждой из ${nst} ступеней (${nb})`);
  // Г.2 (2): «Следующая по маршруту»
  await q.evaluate(()=>localStorage.clear());await q.goto(U+'#home');await q.reload();
  const nx=await q.innerText('.hmnext');
  check(!!await q.$('.hmnext [data-hnext]')&&nx.includes('Ступень 1 · Звуки')&&nx.includes('Слог и перенос'),'главная: «Следующая по маршруту» — вторая глава (первая — «С чего начать»)');
  await q.click('[data-hnext]');await q.waitForTimeout(150);check((await hash()).startsWith('#ch-slog'),'«Следующая по маршруту» открывает главу');
  await q.goto(U+'?selftest#home');
  await q.evaluate(()=>{const T=window.__T,S=T.getS();['zvuki','slog'].forEach(id=>T.CHAPTERS[id].lessons.forEach(l=>S.done[l.id]=true));S.last=T.CHAPTERS.slog.lessons[0].id;localStorage.setItem('rus-uchebnik-v1',JSON.stringify(S))});
  await q.reload();
  const nx2=await q.innerText('.hmnext');check(nx2.includes('Ударение')&&!nx2.includes('Слог и перенос'),'пройденные главы пропускаются: следующая — «Ударение»');
  // Г.2 (3): плашка опор
  await q.evaluate(()=>localStorage.clear());await q.goto(U+'#ch-slog');await q.reload();
  check(await q.evaluate(()=>{const e=document.querySelector('.needbox');return !!e&&e.innerText.includes('нужна тема «Звуки и буквы»')&&!!e.querySelector('[data-needgo="zvuki"]')}),'плашка: «Здесь нужна тема «Звуки и буквы» — повторить» со ссылкой');
  await q.click('.needbox [data-needgo="zvuki"]');await q.waitForTimeout(100);check((await hash()).startsWith('#ch-zvuki'),'ссылка плашки ведёт на главу-опору');
  await q.goto(U+'#ch-slog');await q.click('.needx');check(!await q.$('.needbox')&&(await LS()).needx.slog===1,'плашка закрывается, выбор запоминается (S.needx)');
  await q.reload();check(!await q.$('.needbox'),'закрытая плашка не возвращается');
  await q.evaluate(()=>localStorage.clear());await q.goto(U+'?selftest#ch-slog');
  await q.evaluate(()=>{const T=window.__T,S=T.getS();T.CHAPTERS.zvuki.lessons.forEach(l=>S.done[l.id]=true);localStorage.setItem('rus-uchebnik-v1',JSON.stringify(S))});
  await q.reload();check(!await q.$('.needbox'),'опора пройдена — плашки нет');
  await q.evaluate(()=>localStorage.clear());await q.goto(U+'#ch-glag');await q.reload();
  check(await q.evaluate(()=>{const e=document.querySelector('.needbox');return !!e&&e.innerText.includes('Здесь нужны темы')}),'несколько опор: «Здесь нужны темы …»');
  check(await q.evaluate(()=>!!document.querySelector('.chmain [data-tab="train"]')),'плашка не блокирует главу (вкладки на месте)');
  // Г.3: страница ступени
  await q.evaluate(()=>localStorage.clear());
  await q.goto(U+'#ch-proizn');await q.reload();
  check(await q.evaluate(()=>!!document.querySelector('.stend[data-stepgo="1"]')),'последняя глава ступени: кнопка «Повторить ступень»');
  await q.click('.stend');await q.waitForTimeout(100);
  check((await hash())==='#step-1'&&!!await q.$('#tests')&&!!await q.$('#trainer')&&(await q.innerText('.stepw')).includes('Звуки'),'страница #step-1: главы, тест и тренажёр ступени');
  await q.click('[data-stgo]');let qn=0;
  for(let k=0;k<30;k++){
   if(!(await q.$('.tscard')))break;qn++;
   const kind=await q.evaluate(()=>document.querySelector('.tscard .ty').innerText);
   if(/вписать/i.test(kind))await q.fill('[data-tsform] input','а');
   else if(/разложить/i.test(kind)){const n=(await q.$$('.tssr')).length;for(let i=0;i<n;i++)await q.click(`[data-tss="${i}"]`)}
   else await q.click('[data-tsa="0"]');
   await q.click('[data-tsnext]');
  }
  check(!!(await q.$('.tsgrade'))&&qn===15,`итоговый тест ступени: ${qn} вопросов, оценка`);
  let st=await LS();check(st.steps&&st.steps['1']&&st.steps['1'].tries===1&&st.steps['1'].best>=2&&st.tlog.some(x=>x.t==='step:1'),'результат теста ступени сохраняется (S.steps)');
  check(!st.tests||!Object.keys(st.tests).some(k=>/step/.test(k)),'тесты глав не затронуты тестом ступени');
  await q.click('[data-tslist]');check(!!await q.$('[data-stgo]')&&(await q.innerText('#tests')).includes('лучшая оценка'),'«К списку тестов» — ступень, лучшая оценка');
  // смешанный тренажёр ступени
  await q.goto(U+'#step-1');await q.reload();
  await q.click('[data-stc="10"]');await q.click('[data-sttr="1"]');let tn=0;
  for(let k=0;k<12;k++){
   if(await q.$('#trainer [data-trp]:not([disabled])'))await q.click('#trainer [data-trp]:not([disabled])');
   if(await q.$('#trainer [data-trnext]')){await q.click('#trainer [data-trnext]');tn++}else break}
  check(tn===10&&/серия закончена/i.test(await q.innerText('#trainer')),`смешанный тренажёр ступени: ${tn} заданий, итог серии`);
  st=await LS();const ids=Object.keys(st.ans||{});
  check(ids.length>=2,`ответы тренажёра ступени идут в статистику уроков (${ids.length} уроков)`);
  await q.click('#trainer [data-trgo]');check(!!await q.$('#trainer .card'),'«Новая серия» запускает ещё одну');
  await q.click('[data-trsetup]');check(!!await q.$('#trainer [data-sttr]'),'«Настройки» — снова выбор числа заданий');
  await q.click('.bpn [data-stepgo="2"]');check((await hash())==='#step-2','переход к следующей ступени');
  await q.goto(U+'#step-99');check(!!await q.$('.tparts'),'несуществующая ступень — содержание');
  await q.goto(U+'#step-1');await q.click('[data-stchap="zvuki"]');await q.waitForTimeout(100);check((await hash()).startsWith('#ch-zvuki'),'из ступени — в главу');
  // Г.4: «Проверить опоры» — входной мини-тест главы
  await q.evaluate(()=>localStorage.clear());await q.goto(U+'#ch-glag');await q.reload();
  check(await q.evaluate(()=>!!document.querySelector('.needbox [data-opcpage="glag"]')),'«Проверить опоры» в плашке опор');
  await q.evaluate(()=>localStorage.clear());await q.goto(U+'#ch-zvuki');await q.reload();
  check(!await q.$('[data-opcpage]'),'у главы без опор кнопки нет');
  await q.goto(U+'#ch-slog');await q.click('.needx');await q.reload();
  check(!!await q.$('.opcbtn[data-opcpage="slog"]'),'плашка закрыта — кнопка «Проверить опоры» остаётся');
  await q.goto(U+'#ch-glag');await q.reload();await q.click('.needbox [data-opcpage="glag"]');await q.waitForTimeout(100);
  check((await hash())==='#opc-glag'&&!!await q.$('#tests [data-opcgo]')&&!!await q.$('.stepw .stch'),'страница #opc-glag: опоры и кнопка «Начать»');
  await q.click('[data-opcgo]');let on=0;
  for(let k=0;k<12;k++){
   if(!(await q.$('.tscard')))break;on++;
   const kind=await q.evaluate(()=>document.querySelector('.tscard .ty').innerText);
   if(/вписать/i.test(kind))await q.fill('[data-tsform] input','я');
   else if(/разложить/i.test(kind)){const n=(await q.$$('.tssr')).length;for(let i=0;i<n;i++)await q.click(`[data-tss="${i}"]`)}
   else await q.click('[data-tsa="0"]');
   await q.click('[data-tsnext]');
  }
  check(!!(await q.$('.tsgrade'))&&on>=5&&on<=8,`мини-тест опор: ${on} вопросов (5–8), оценка`);
  check(await q.evaluate(()=>[...document.querySelectorAll('.tsm [data-ojump]')].every(b=>/^Повторить «.+», урок \d+/.test(b.innerText))),'разбор: «Повторить «глава», урок N»');
  let sp=await LS();check(sp.opc&&sp.opc.glag&&sp.opc.glag.tries===1&&Array.isArray(sp.opc.glag.weak)&&sp.tlog.some(x=>x.t==='opc:glag'),'результат сохраняется (S.opc)');
  check(!sp.tests||!Object.keys(sp.tests).some(k=>/opc/.test(k)),'тесты глав и ступеней не затронуты');
  await q.click('[data-tslist]');
  check(await q.evaluate(()=>{const t=document.getElementById('tests').innerText;return /прошлая оценка/.test(t)&&(/Повтори/.test(t)||/Опоры в порядке/.test(t))}),'после теста: оценка и список «Повтори» (или «Опоры в порядке»)');
  await q.reload();check((await hash())==='#opc-glag'&&!!await q.$('.stepw'),'#opc-<глава> открывается по адресу');
  await q.goto(U+'#opc-zvuki');check(!!await q.$('.tparts'),'#opc- у главы без опор — содержание');
  await q.goto(U+'#opc-glag');await q.click('[data-opcgochap]');await q.waitForTimeout(100);check((await hash()).startsWith('#ch-glag'),'«Начать главу» открывает саму главу');
  await q.evaluate(()=>localStorage.setItem('rus-uchebnik-v1',JSON.stringify({done:{pr1:true},cards:{},view:'book',steps:{},needx:{}})));
  await q.goto(U+'#opc-glag');await q.reload();check(!!await q.$('#tests [data-opcgo]'),'старое сохранение без S.opc открывается');
  await q.evaluate(()=>localStorage.setItem('rus-uchebnik-v1',JSON.stringify({done:{pr1:true},cards:{},view:'book'})));
  await q.goto(U+'#toc');await q.reload();check(!!await q.$('.tstep')&&!!await q.$('.tparts'),'старое сохранение без S.steps и S.needx открывается');
  await ctx.close();}
 errs.forEach(e=>fail.push('JS: '+e));
 ok.forEach(m=>console.log('  ✓ '+m));fail.forEach(m=>console.log('  ✗ '+m));
 console.log(fail.length?`Ошибок: ${fail.length}`:`Всё работает (${ok.length} проверок)`);
 fs.unlinkSync(T);await b.close();process.exit(fail.length?1:0);
})();
