// Автоматическая проверка главы: node tools/check-chapter.js <id>
// Ловит то, что можно поймать машиной, до проверки человеком: синтаксис, повторы имён, формат данных,
// объём (теория, «Проще», тренажёр, упражнения, тесты), ключи, повторы слов, транскрипцию.
// ОШИБКА — сдавать нельзя; ВНИМАНИЕ — проверить и объяснить в отчёте главы.
const fs=require('fs'),path=require('path'),vm=require('vm'),cp=require('child_process');
const ROOT=path.resolve(__dirname,'..');const id=process.argv[2];
if(!id){console.log('Запуск: node tools/check-chapter.js <id главы>');process.exit(2)}
const dir=path.join(ROOT,'src/chapters',id);
if(!fs.existsSync(dir)){console.log('Нет папки '+dir);process.exit(2)}
const ERR=[],WARN=[];let B=[],X=[],T=[],NL=0,box=null;const err=m=>ERR.push(m),warn=m=>WARN.push(m);
const ORDER=['lessons','bank','classic','labs','tests','workshop','index','adv'];
const files=ORDER.map(f=>path.join(dir,f+'.js')).filter(f=>fs.existsSync(f));
for(const f of ['lessons'])if(!fs.existsSync(path.join(dir,f+'.js')))err(`нет файла ${f}.js`);

// 1. синтаксис каждого файла
for(const f of files){try{cp.execFileSync('node',['--check',f],{stdio:'pipe'})}catch(e){err(`синтаксис: ${path.relative(ROOT,f)}\n    ${String(e.stderr).split('\n').slice(0,5).join('\n    ')}`)}}
// 2. имена верхнего уровня не повторяют имена остального проекта
const DECL=/^(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/mg;
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):e.name.endsWith('.js')?[path.join(d,e.name)]:[]);
const other={};for(const f of walk(path.join(ROOT,'src')))if(!f.startsWith(dir+path.sep)){let m;const t=fs.readFileSync(f,'utf8');DECL.lastIndex=0;while((m=DECL.exec(t)))other[m[1]]=path.relative(ROOT,f)}
const mine={};for(const f of files){let m;const t=fs.readFileSync(f,'utf8');DECL.lastIndex=0;while((m=DECL.exec(t))){if(other[m[1]])err(`имя ${m[1]} уже есть в ${other[m[1]]} — нужен свой префикс`);if(mine[m[1]]&&mine[m[1]]!==f)err(`имя ${m[1]} объявлено дважды в главе`);mine[m[1]]=f}}
if(ERR.length){report();process.exit(1)}

// 3. загрузить главу в песочнице
box={MECH:{},relab(){},queueMicrotask:f=>f(),console,
 document:{addEventListener(){},getElementById(){return null},querySelector(){return null},querySelectorAll(){return []}},
 shuffle:a=>a,pick1:a=>a[0],esc:s=>String(s),window:{},localStorage:{getItem(){return null},setItem(){}},S:{}};
vm.createContext(box);
const PRE=['src/js/core/store.js','src/data/corpus/levels.js','src/data/corpus/orthograms.js','src/data/corpus/sentences.js','src/data/corpus/words.js','src/data/corpus/texts.js'].map(f=>path.join(ROOT,f)).filter(f=>fs.existsSync(f));
const SRC=[...PRE,...files].map(f=>fs.readFileSync(f,'utf8')).join('\n;\n');
const pre=(/^const CHAPTERS\b/m.test(SRC)?'':'var CHAPTERS={};')+(/^const LABS\b/m.test(SRC)?'':'var LABS={};');
try{vm.runInContext(pre+SRC+'\n;globalThis.__C=CHAPTERS;globalThis.__L=LABS;globalThis.__A=(typeof CHAPTERS_ADV!=="undefined"?CHAPTERS_ADV:{});',box,{filename:id})}catch(e){err('глава не загружается: '+e.message);report();process.exit(1)}
const C=box.__C[id];if(!C){err(`глава не зарегистрирована: нужно CHAPTERS.${id}=…`);report();process.exit(1)}
const L=C.lessons||[];NL=L.length;
const strip=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/\{\{lab:\w+\}\}/g,' ').replace(/\s+/g,' ').trim();

// 4. теория
if(NL<3||NL>8)warn(`уроков ${NL} (обычно 4–6)`);
L.forEach((l,i)=>{const n=`урок ${i+1} (${l.id})`;
 for(const k of ['t','hint','h','lite','deep','easy','fix'])if(!strip(l[k]))err(`${n}: пустое поле ${k}`);
 const h=strip(l.h).length,li=strip(l.lite).length;
 if(h<1500)warn(`${n}: теория h короткая — ${h} знаков (в образцах 3000–8000)`);
 if(li<350)err(`${n}: «Проще» (lite) — ${li} знаков: это должно быть полное объяснение для слабого ученика, а не одна фраза`);
 if(li&&h&&li/h>0.85)warn(`${n}: «Проще» почти не короче полной теории — это пересказ h?`);
 for(const m of String(l.h+l.lite+l.deep).matchAll(/\{\{lab:(\w+)\}\}/g))if(!box.__L[m[1]])err(`${n}: схема {{lab:${m[1]}}} не зарегистрирована в LABS`);
});
const labs=Object.keys(box.__L);if(labs.length<3)warn(`схем ${labs.length} (нужно не меньше 3–4, интерактивных)`);
const labSrc=fs.existsSync(path.join(dir,'labs.js'))?fs.readFileSync(path.join(dir,'labs.js'),'utf8'):'';
if(labs.length&&!/addEventListener\(\s*['"]click/.test(labSrc))warn('в labs.js нет обработчика нажатий: схемы не интерактивны');

// 5. тренажёр
B=C.bank||[];const byL={};
B.forEach((b,i)=>{const n=`тренажёр №${i+1}`;
 if(Array.isArray(b)){err(`${n}: элемент — массив; в конце bank.js нужно .map(x=>({id,w,a,why,l,opts,q})), как в src/chapters/udar/bank.js`);return}
 if(!b||typeof b!=='object'){err(`${n}: элемент ${b} — пропущена запятая между заданиями?`);return}
 const {w,a,why,l,opts:o}=b;if(!w||a==null||!why)err(`${n}: нет задания, ответа или пояснения`);
 if(!(l>=1&&l<=NL+1))err(`${n}: урок ${l} вне 1…${NL+1}`);
 if(o&&!o.includes(a))err(`${n} «${w}»: ответ «${a}» не среди вариантов`);
 if(o&&new Set(o).size!==o.length)err(`${n} «${w}»: повтор в вариантах`);
 byL[l]=(byL[l]||0)+1});
const dupB={};B.forEach(b=>{if(b&&!Array.isArray(b)){const k=b.w+'|'+(b.q||'');dupB[k]=(dupB[k]||0)+1}});for(const k in dupB)if(dupB[k]>1)warn(`тренажёр: задание «${k.split('|')[0]}» повторяется ${dupB[k]} раза`);
for(let l=1;l<=NL;l++)if((byL[l]||0)<10&&!(C.wk))warn(`тренажёр, урок ${l}: ${byL[l]||0} заданий (норма 15–25)`);

// 6. упражнения в тетрадь
X=C.classic||[];const ns=new Set();
X.forEach((e,i)=>{const n=`упражнение №${e.n??'?'}`;
 if(typeof e!=='object'||Array.isArray(e)){err(`упражнение [${i}]: не объект — пропущена запятая?`);return}
 if(!Number.isInteger(e.n))err(`${n}: нет номера n`);else if(ns.has(e.n))err(`${n}: номер повторяется`);ns.add(e.n);
 if(!(e.l>=1&&e.l<=NL+1))err(`${n}: урок ${e.l} вне 1…${NL+1}`);
 if(!(e.st>=1&&e.st<=5))err(`${n}: звёзды st=${e.st} (нужно 1–5)`);
 if(!strip(e.task))err(`${n}: нет задания task`);
 if(!strip(e.key))err(`${n}: нет ключа key`);
 else{const k=strip(e.key);if(k.length<20)warn(`${n}: очень короткий ключ «${k}»`);
  if(/^(пример|с пометками|составить|записать|работа со словар|отметить)[^.]*\.?$/i.test(k)||/для каждого\.?$/i.test(k))err(`${n}: ключ «${k.slice(0,60)}» — не ключ: нужен полный ответ или образец с критериями`)}
 if(e.st<=3&&!strip(e.obr)&&!e.os)warn(`${n}: ★${e.st} без образца obr`);
 if(!e.os&&strip(e.body).length<40&&!/сочин|составить|подобрать|найти в словар/i.test(e.task))warn(`${n}: мало материала (${strip(e.body).length} знаков) — упражнение меньше 5–7 минут?`)});
// оформление и длина предложений (решение владельца 06.11.2026, PRINCIPLES §4.12)
X.forEach(e=>{if(!e||!e.body)return;const n=`упражнение №${e.n}`;
 const tags=String(e.body).replace(/<br\s*\/?>|<…>|<...>/g,'').match(/<[^>]+>/g);if(tags)err(`${n}: в тексте упражнения техническая разметка ${tags[0]} — она видна ученику`);
 const parts=String(e.body).replace(/<br\s*\/?>/g,' ').split(/(?:^|\s)\d{1,2}[.)]\s/).map(x=>x.replace(/\([А-ЯЁ]\. .*?\)|Пояснения:.*$/g,'').trim()).filter(x=>x.length>8);
 if(parts.length>=5&&!e.os){const L=parts.map(x=>x.split(/\s+/).length),m=L.reduce((a,b)=>a+b,0)/L.length,sd=Math.sqrt(L.reduce((a,b)=>a+(b-m)**2,0)/L.length);
  if(sd/m<0.22)warn(`${n}: предложения почти одной длины (${Math.min(...L)}–${Math.max(...L)} слов) — нужны и короткие, и длинные (PRINCIPLES §4.12)`)}});
// место явления (решение владельца 06.11.2026 и 18.11.2026: «проверять, чтобы был рандом и разнообразие»):
// искомое — пропуск «..»/«_» в условии или знак, которого нет в условии, но есть в ключе (запятая, ;, :, тире);
// считаем относительную позицию слова в предложении и смотрим, равномерно ли оно разбросано по началу, середине и концу
{const SPL=/(?:^|\s)\d{1,2}[.)]\s/,CL=x=>x.replace(/\([А-ЯЁ]\. .*?\)|Пояснения:.*$/g,'').split(/\s+[—–]\s+(?=[а-яёА-ЯЁ«"(]|«)/)[0].trim();
 const pts=[],per=[];
 X.forEach(e=>{if(!e||!e.body||e.os)return;
  if(/\)[¹²³⁴]/.test(String(e.body)))return; // линейные схемы: «…» — не пропуск
  const bs=String(e.body).replace(/<br\s*\/?>/g,' ').split(SPL).map(x=>x.replace(/\([А-ЯЁ]\. .*?\)|Пояснения:.*$/g,'').trim()).filter(Boolean);
  const ks=String(e.key||'').replace(/<br\s*\/?>/g,' ').split(SPL).map(CL).filter(Boolean);
  const mine=[];
  bs.forEach((b,i)=>{const bt=b.split(/\s+/);if(bt.length<4)return;
   const gaps=[];const mnog=/многоточ/i.test(String(e.task||''));bt.forEach((t,j)=>{if(t.includes('>'))return;if(!mnog&&j===bt.length-1&&/[а-яё]…$/i.test(t))return;if(/\.\.|…|_/.test(t))gaps.push(j)});
   if(gaps.length){gaps.forEach(j=>mine.push(j/(bt.length-1)));return}
   const k=ks[i];if(!k||ks.length!==bs.length)return;const kt=k.split(/\s+/);
   const clean=t=>t.replace(/[,;:—–!?.«»"()]/g,'').toLowerCase();
   const kw=kt.filter(t=>clean(t)),bw=bt.filter(t=>clean(t));if(kw.length!==bw.length)return;
   kw.forEach((t,j)=>{if(/[,;:]$/.test(t)&&!/[,;:]$/.test(bw[j]))mine.push(j/(kw.length-1))});
  });
  mine.forEach(v=>pts.push(v));if(mine.length>=6)per.push([e.n,mine]);});
 const B3=v=>v<1/3?0:v<2/3?1:2,NM=['в начале','в середине','в конце'];
 if(pts.length>=40){const c=[0,0,0];pts.forEach(v=>c[B3(v)]++);const mx=Math.max(...c)/pts.length,mn=Math.min(...c)/pts.length;
  if(mx>0.55||mn<0.12)warn(`место явления: искомое ${NM[c.indexOf(Math.max(...c))]} предложения — ${(mx*100).toFixed(0)} % из ${pts.length} (в начале ${c[0]}, в середине ${c[1]}, в конце ${c[2]}); нужен разброс по всему предложению (норма: каждая треть 12–55 %)`);}
 per.forEach(([n,m])=>{const c=[0,0,0];m.forEach(v=>c[B3(v)]++);if(Math.max(...c)/m.length>=0.85)warn(`упражнение №${n}: всё искомое (${m.length}) ${NM[c.indexOf(Math.max(...c))]} предложений — менять позиции`)})}
const sorted=[...ns].sort((a,b)=>a-b);if(sorted.length&&sorted[sorted.length-1]!==sorted.length)warn('номера упражнений не идут подряд 1…N (пропуски допустимы, только если номер когда-то удалён)');
if(X.length<=B.length)err(`упражнений в тетрадь ${X.length}, заданий тренажёра ${B.length}: упражнений должно быть больше (решение владельца)`);

// 7. тесты
T=C.tests||[];const tl={};
T.forEach((s,i)=>{const n=`тест [${i}] урок ${s.l}`;tl[s.l]=(tl[s.l]||0)+1;
 if(!['one','many','type','sort'].includes(s.k))err(`${n}: вид ${s.k}`);
 if(!s.q||!s.q.length)err(`${n}: нет формулировки q`);
 const it=s.items||[];
 if(it.length&&it.length<6&&s.k!=='many')warn(`${n}: ${it.length} примеров в слоте (норма 6–12)`);
 if(s.k==='one'&&!it.length&&!(s.o&&s.a))err(`${n}: нет ни items, ни o+a`);
 it.forEach(x=>{if(Array.isArray(x)&&s.k==='one'&&s.o&&!s.o.includes(x[1]))err(`${n}: ответ «${x[1]}» к «${x[0]}» не среди вариантов`);
  if(!Array.isArray(x)&&x&&x.o&&x.a){const a=[].concat(x.a);a.forEach(v=>{if(!x.o.includes(v))err(`${n}: ответ «${v}» не среди вариантов`)})}
  if(Array.isArray(x)&&s.k==='sort'&&s.cats&&!s.cats.includes(x[1]))err(`${n}: категория «${x[1]}» не в cats`)})});
for(let l=1;l<=NL;l++)if((tl[l]||0)<8)err(`тесты, урок ${l}: ${tl[l]||0} слотов (нужно 8)`);

// место явления в тренажёре и тестах (расширение Д.4, 18.11.2026; tools/lib/mesto.js): искомое — пропуск «_»/«…» в предложении
// не короче 5 слов или ответ-строка, которая один раз встречается в предложении из условия; механики без позиции
// (определения, да/нет, выбор термина, сортировка, «___» в формулировке правила) не считаются
try{const M=require('./lib/mesto.js'),R=M.measure(C);['тренажёр','тесты'].forEach(nm=>M.warnings(R,nm).forEach(w=>warn(w)))}
catch(e){warn('место явления в тренажёре и тестах не проверено: '+e.message)}

// 8. повторы слов в заданиях (тренажёр, упражнения, тесты; без теории, подписей цитат, ключей).
// Е.4 (18.11.2026): считаются леммы (pymorphy3 через tools/povtory.py --json); предлоги, союзы, частицы, местоимения,
// числительные, слова-меры и термины глоссария вне нормы. Слова окружения — меньше 10 мест (bsp, spp2 — не больше 14);
// слова-основы (строка «Леммы-основы: …» в docs/plans/<id>.md) — не больше 10.
let rep=null;
try{rep=JSON.parse(cp.execFileSync('python3',['-I',path.join(ROOT,'tools/povtory.py'),id,'--json'],{stdio:['ignore','pipe','pipe'],maxBuffer:1<<26}).toString())}catch(e){rep=null}
if(rep){
 const bad=Object.entries(rep.slova).filter(([w,v])=>rep.osn.includes(w)?v.length>10:v.length>rep.lim).sort((a,b)=>b[1].length-a[1].length);
 if(bad.length)warn(`повторы слов в заданиях (по леммам; окружение — не больше ${rep.lim} мест, слово-основа — не больше 10; \`python3 tools/povtory.py ${id} 10\`): `+bad.slice(0,15).map(([w,v])=>w+' ×'+v.length).join(', '))
}else{
 warn('повторы слов: лемматизация недоступна (нужны python3 и pymorphy3) — проверьте `python3 tools/povtory.py '+id+' 10` отдельно');
}

// 9. транскрипция: школьная запись, как в «Звуках и буквах» — [й'], мягкость ', без [ъ] [ь] и без букв е ё ю я внутри скобок
const all=JSON.stringify([L,B,X,T]);
for(const m of all.matchAll(/\[([а-яё'́\- ]{2,})\]/g)){const t=m[1];if(!/[а-яё]/.test(t)||/ /.test(t.trim()))continue;
 const bad=[];if(/[еёюяъь]/.test(t))bad.push('буквы е/ё/ю/я/ъ/ь внутри транскрипции');
 if(/[чщй](?!')/.test(t))bad.push('ч, щ, й всегда с \' : [ч\'], [щ\'], [й\']');
 if(bad.length)warn(`транскрипция [${t}]: ${bad.join('; ')} — если это намеренно неверный пример (найти ошибку), сказать об этом в отчёте`)}

// 10. содержание: запрещённые темы для детей
const BAD=/(?<![а-яё])(водк|пив[оа]|вин[оа](?![а-яё]*(ват|вн))|пьян|курил|сигар|табак|убил|убийств|кров[ьи]|самоубий)/i;
const bm=strip(JSON.stringify([B,X,T])).match(BAD);if(bm)warn(`проверить содержание: «${bm[0]}…» — без сомнительного для детей (PRINCIPLES §6.4)`);

// 11. произведения, которые владелец убрал как неподходящие для детей (решение 05.11.2026); список пополнять
const BANNED=['«Ася»','«Барыня»'];
for(const w of BANNED)if(JSON.stringify([B,X,T]).includes(w))err(`цитата из ${w} — произведение убрано владельцем (PRINCIPLES §6.4), взять другое`);

// 12. последовательное изучение (PRINCIPLES §3а): опоры главы, блок «Что нужно знать», понятия из более поздних глав, ссылки на главы
let INFO=[];
try{const K=require('./lib/course.js').load(),g=require('./lib/graph.js').graphCheck(K,id,C);g.errs.forEach(e=>err('последовательность: '+e));g.warns.forEach(e=>warn('последовательность: '+e));INFO=g.info}
catch(e){err('проверка последовательности не выполнена: '+e.message)}

// 13. режим «Углублённо» (docs/plans/uglublenno.md): src/chapters/<id>/adv.js, если он есть
(()=>{const A=(box.__A||{})[id];if(!fs.existsSync(path.join(dir,'adv.js')))return;
 if(!A){err('adv.js не регистрирует CHAPTERS_ADV.'+id);return}
 const lid=new Set((C.lessons||[]).map(l=>l.id)),nl=(C.lessons||[]).length,txt=h=>String(h).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
 // теория: у каждого урока блок 1500+ знаков
 const th=A.theory||{};for(const k of Object.keys(th))if(!lid.has(k))err(`углублённо, теория: нет урока ${k}`);
 for(const l of C.lessons||[]){const t=th[l.id];if(!t){err(`углублённо, теория: нет блока для урока ${l.id}`);continue}const n=txt(t).length;if(n<1200)err(`углублённо, теория урока ${l.id}: ${n} знаков — меньше 1200`);else if(n<1500)warn(`углублённо, теория урока ${l.id}: ${n} знаков — норма от 1500`);if(/(^|[^а-яё])(ты|тебе|тебя|тобой)([^а-яё]|$)/i.test(txt(t)))warn(`углублённо, теория урока ${l.id}: обращение «ты»`);if(/ОГЭ|ЕГЭ|сертификат/i.test(txt(t)))err(`углублённо, теория урока ${l.id}: названия экзаменов (PRINCIPLES §5.10)`)}
 // ключи в adv.js — только в одинарных или двойных кавычках: сборка вырезает key из версии ученика только для них
 if(/\bkey\s*:\s*`/.test(fs.readFileSync(path.join(dir,'adv.js'),'utf8')))err('углублённо, упражнения: поле key записано в обратных кавычках — только \'…\' или "…" (иначе сборка не вырежет ключ из версии ученика)');
 // упражнения
 const cl=A.classic||[],baseN=new Set((C.classic||[]).map(e=>e.n)),seen=new Set();
 if(cl.length<14)err(`углублённо, упражнения: ${cl.length} — норма не меньше 14`);
 const per={};for(const e of cl){per[e.l]=(per[e.l]||0)+1;
  if(!Number.isInteger(e.n)||e.n<201)err(`углублённо, упражнение ${e.n}: номер n должен быть целым ≥ 201`);
  if(seen.has(e.n)||baseN.has(e.n))err(`углублённо, упражнение ${e.n}: номер уже занят`);seen.add(e.n);
  if(!(e.l>=1&&e.l<=nl))err(`углублённо, упражнение ${e.n}: нет урока ${e.l}`);
  if(e.st!==4&&e.st!==5)err(`углублённо, упражнение ${e.n}: st должен быть 4 или 5`);
  for(const f of ['task','body','key'])if(typeof e[f]!=='string'||e[f].trim().length<3)err(`углублённо, упражнение ${e.n}: нет поля ${f}`);
  if(typeof e.body==='string'&&e.body.length<60)warn(`углублённо, упражнение ${e.n}: мало материала (${e.body.length} знаков)`);
  if(Object.keys(e).pop()!=='key')err(`углублённо, упражнение ${e.n}: key должен быть последним полем`)}
 for(let i=1;i<=nl;i++)if((per[i]||0)<2)err(`углублённо, упражнения: в уроке ${i} меньше 2`);
 // тренажёр
 const bk=A.bank||[],baseId=new Set((C.bank||[]).map(b=>b.id)),bseen=new Set(),bper={};
 if(bk.length<18)err(`углублённо, тренажёр: ${bk.length} заданий — норма не меньше 18`);
 for(const b of bk){bper[b.l]=(bper[b.l]||0)+1;
  if(!b.id||bseen.has(b.id)||baseId.has(b.id))err(`углублённо, тренажёр ${b.id}: id пуст или повторяется`);bseen.add(b.id);
  if(!(b.l>=1&&b.l<=nl))err(`углублённо, тренажёр ${b.id}: нет урока ${b.l}`);
  for(const f of ['w','a','why','q'])if(typeof b[f]!=='string'||!b[f].trim())err(`углублённо, тренажёр ${b.id}: нет поля ${f}`);
  if(!Array.isArray(b.opts)||b.opts.length<2||new Set(b.opts).size!==b.opts.length)err(`углублённо, тренажёр ${b.id}: варианты пусты или повторяются`);
  else if(!b.opts.includes(b.a))err(`углублённо, тренажёр ${b.id}: ответа нет среди вариантов`)}
 for(let i=1;i<=nl;i++)if((bper[i]||0)<3)err(`углублённо, тренажёр: в уроке ${i} меньше 3 заданий`);
 // тесты: форма слота — как в tests.js главы
 const ts=A.tests||[],bt=C.tests||[],keys=new Set();bt.forEach(s=>Object.keys(s).forEach(k=>keys.add(k)));
 const tper={};for(const t of ts){tper[t.l]=(tper[t.l]||0)+1;if(!(t.l>=1&&t.l<=nl))err(`углублённо, тесты: нет урока ${t.l}`);
  for(const k of Object.keys(t))if(bt.length&&!keys.has(k))err(`углублённо, тесты: поле ${k} не встречается в tests.js главы`)}
 for(let i=1;i<=nl;i++)if((tper[i]||0)<6)err(`углублённо, тесты: в уроке ${i} меньше 6 слотов (тест урока — TEST_LEN вопросов)`);
 // тренажёр: верный вариант не должен быть самым длинным и не стоять первым слишком часто (ловушки — настоящие)
 {const lng=bk.filter(b=>Array.isArray(b.opts)&&b.opts.length>2&&b.opts.every(o=>o===b.a||o.length<b.a.length)).length,first=bk.filter(b=>Array.isArray(b.opts)&&b.opts[0]===b.a).length;
  if(bk.length&&lng/bk.length>.4)warn(`углублённо, тренажёр: верный вариант самый длинный в ${lng} из ${bk.length} заданий — выровнять длину вариантов`);
  void first}
 // повторы слов в материале adv.js (леммы; без теории)
 try{const rep=JSON.parse(cp.execFileSync('python3',['-I',path.join(ROOT,'tools/povtory.py'),id,'--adv','--json'],{stdio:['ignore','pipe','pipe'],maxBuffer:1<<26}).toString());
  const osn=new Set(rep.osn||[]),bad=Object.entries(rep.slova).filter(([w,v])=>osn.has(w)?v.length>10:v.length>rep.lim);
  if(bad.length)warn(`углублённо, повторы слов в adv.js (по леммам; окружение — не больше ${rep.lim} мест, слово-основа — не больше 10; \`python3 tools/povtory.py ${id} 7 --adv\`): `+bad.slice(0,15).map(([w,v])=>w+' ×'+v.length).join(', '))}catch(e){warn('углублённо: повторы слов не проверены (нужны python3 и pymorphy3)')}
 // дубли предложений: с другими файлами проекта и внутри adv.js
 try{const nrm=t=>String(t).replace(/<[^>]*>/g,' ').toLowerCase().replace(/ё/g,'е').replace(/[^а-я ]+/g,' ').replace(/\s+/g,' ').trim();
  const sents=h=>String(h).replace(/<br\s*\/?>/g,'. ').replace(/<[^>]*>/g,' ').split(/(?<=[.!?…»])\s+/).map(nrm).filter(x=>x.split(' ').length>=6);
  const mine=[];cl.forEach(e=>mine.push(...sents(e.body)));bk.forEach(b=>mine.push(...sents(b.w)));
  const cnt={};mine.forEach(x=>cnt[x]=(cnt[x]||0)+1);
  const inner=Object.entries(cnt).filter(([x,n])=>n>2).length;if(inner)warn(`углублённо: ${inner} предложений встречаются в adv.js больше двух раз`);
  const set=new Set(Object.keys(cnt));let outer=0;const own=path.join(dir,'adv.js');
  for(const f of walk(path.join(ROOT,'src/chapters'))){if(f===own)continue;const t=nrm(fs.readFileSync(f,'utf8'));for(const x of set)if(t.includes(x)){outer++;set.delete(x)}}
  if(outer)warn(`углублённо: ${outer} предложений adv.js уже есть в других файлах глав (дубли цитат: взять другие)`)}catch(e){warn('углублённо: дубли не проверены: '+e.message)}
 INFO.push(`углублённо: теория ${Object.keys(th).length} блоков, упражнений ${cl.length}, тренажёр ${bk.length}, слотов тестов ${ts.length}`)})();
report();process.exit(ERR.length?1:0);
function report(){
 console.log(`Глава ${id}: уроков ${NL||'?'}, схем ${Object.keys((box&&box.__L)||{}).length}, тренажёр ${B.length}, упражнений ${X.length}, слотов тестов ${T.length}`);
 if(ERR.length){console.log(`\nОШИБКИ (${ERR.length}) — сдавать нельзя:`);ERR.slice(0,80).forEach(e=>console.log('  ✗ '+e));if(ERR.length>80)console.log(`  … и ещё ${ERR.length-80}`)}
 if(WARN.length){console.log(`\nВНИМАНИЕ (${WARN.length}) — проверить и объяснить в отчёте:`);WARN.slice(0,60).forEach(e=>console.log('  ! '+e))}
 if(typeof INFO!=='undefined'&&INFO.length){console.log('\nМесто в маршруте (PRINCIPLES §3а):');INFO.forEach(e=>console.log('  · '+e))}
 if(!ERR.length)console.log('\nОшибок нет.');
}
