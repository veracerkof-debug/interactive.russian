// Место явления в тренажёре и тестах (Д.4, расширение 18.11.2026). Используется check-chapter.js.
// Искомое видно машине только двумя способами:
//   gap — пропуск «_», «..», «…» внутри предложения (пропущенная буква, знак, слово);
//   key — ответ (строка) в тексте предложения: «Найти однородные члены: «…»» → a = «дрозды и соловьи»
//         (ответ находится в условии ровно один раз — позиция ответа и есть позиция искомого).
// Механики без позиции (определения, «да/нет», выбор термина, сортировка, подстановка «___» в формулу правила)
// не считаются: точка берётся только там, где предложение не меньше 5 слов и искомое в нём однозначно.
// measure(C) → { bank: [{pos, grp, via}], tests: [{pos, grp, via}] }, pos — доля 0…1 от начала к концу предложения.
const MIN_TOK=5;
const INSTR=/(пропуск|нужн|вставь|выбер|какой|какая|какое|какие|какую|каким|как (?:пишется|писать|правильно)|поставить|определи|укажи|знак|букв|написани|верно|правильн|в каком|пишется|слитно|раздельно|дефис|найти|подчерк|отметь|выдел)/i;
// пропуск: «_» в слове или отдельный «…»/«..» (слово с многоточием на конце — оборванная речь, не пропуск)
const isGapTok=t=>!t.includes('>')&&!/_{3,}/.test(t)&&(/(?<!_)_{1,2}(?!_)/.test(t)||/^[«"(]*(?:…|\.\.+)[»")]*[.,!?;:]*$/.test(t));
// не предложение, а запись механики: схема со скобками и индексами, «вписать слово в определение»
const NOT_SENT=/[¹²³⁴→]|^\s*\[|\(одно слово|\(вписать|\(одно |(?:^|\s)\d\)\s|(?:—|называется|называются|это)\s+(?:…|\.\.)/i;
const plain=s=>String(s).replace(/<br\s*\/?>/g,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const norm=t=>t.replace(/[,;:—–!?.«»"()…]/g,'').toLowerCase().replace(/ё/g,'е');
// отрезать формулировку задания перед двоеточием («Нужна ли запятая на месте пропуска: …»)
function dropInstr(p){const i=p.indexOf(': ');if(i>0){const pre=p.slice(0,i);if(INSTR.test(pre)&&!isGapTok(pre)&&pre.split(' ').length>=2)return p.slice(i+2)}return p}
const SPLIT=/(?<=[.!?…»"])\s+(?=[«"(]?[А-ЯЁ_])/;
function gapPositions(w){const out=[];if(NOT_SENT.test(plain(w)))return out;
 plain(w).split(SPLIT).forEach(piece=>{const p=dropInstr(piece.trim());const tk=p.split(' ').filter(Boolean);
  if(tk.length<MIN_TOK||NOT_SENT.test(p))return;
  const idx=[];tk.forEach((t,j)=>{if(!isGapTok(t))return;if(j===tk.length-1&&/[а-яё]…[»"]?$/i.test(t))return;idx.push(j)});
  if(idx.length&&idx.length<=tk.length/2)idx.forEach(j=>out.push(j/(tk.length-1)))});
 return out}
// ответ-строка внутри предложения: предложение — текст в «…» (≥5 слов) или то, что после формулировки; ответ ≤5 слов, один раз
function keyPosition(w,a,quotedOnly){if(typeof a!=='string')return null;
 const at=norm(a).split(/\s+/).filter(Boolean);if(!at.length||at.length>5||norm(a).replace(/\s/g,'').length<3)return null;
 const t=plain(w);if(NOT_SENT.test(t))return null;
 const hit=s=>{const st=s.split(/\s+/).map(norm).filter(Boolean);if(st.length<MIN_TOK)return null;
  const hits=[];for(let i=0;i+at.length<=st.length;i++)if(at.every((x,k)=>st[i+k]===x))hits.push(i);
  return hits.length===1&&at.length<st.length-1?(hits[0]+(at.length-1)/2)/(st.length-1):null};
 for(const m of t.matchAll(/«([^»]+)»/g)){if(m[1].split(' ').length<MIN_TOK)continue;const r=hit(m[1]);if(r!=null)return r}
 // предложение без кавычек — только если в условии нет формулировки вопроса или задания
 if(quotedOnly||/[«»?]|[—:]\s*$|\s—\s/.test(t))return null;
 const hits=[];t.split(SPLIT).forEach(sn=>{const p=dropInstr(sn.trim());if(INSTR.test(sn)&&p===sn.trim())return;const r=hit(p);if(r!=null)hits.push(r)});
 return hits.length===1?hits[0]:null}
function measure(C){const res={bank:[],tests:[]};
 (C.bank||[]).forEach((b,i)=>{if(!b||Array.isArray(b)||!b.w)return;const grp=`урок ${b.l}, ${b.id||'№'+(i+1)}`;
  const g=gapPositions(b.w);
  if(g.length){g.forEach(pos=>res.bank.push({pos,grp,l:b.l,via:'gap'}));return}
  const k=keyPosition(b.w,b.a,true);if(k!=null)res.bank.push({pos:k,grp,l:b.l,via:'key'})});
 (C.tests||[]).forEach((s,i)=>{if(!s||s.k==='sort'||s.k==='many')return;const grp=`тест [${i}], урок ${s.l}, ${s.k}`;
  (s.items||[]).forEach(x=>{let w,a;if(Array.isArray(x)){w=x[0];a=x[1]}else if(x&&typeof x==='object'){w=x.w;a=x.a}else return;
   if(typeof w!=='string')return;
   const g=gapPositions(w);if(g.length){g.forEach(pos=>res.tests.push({pos,grp,l:s.l,via:'gap'}));return}
   if(s.k==='one'){const k=keyPosition(w,a,false);if(k!=null)res.tests.push({pos:k,grp,l:s.l,via:'key'})}})});
 return res}
// Предупреждения: по блоку целиком (≥30 точек: каждая треть 12–55 %) и по группе (урок банка ≥10 точек / слот теста ≥6 точек: не ≥85 % в одной трети)
function warnings(res,name){const out=[],B3=v=>v<1/3?0:v<2/3?1:2,NM=['в начале','в середине','в конце'];
 const pts=res[name==='тренажёр'?'bank':'tests'];
 if(pts.length>=30){const c=[0,0,0];pts.forEach(p=>c[B3(p.pos)]++);const mx=Math.max(...c)/pts.length,mn=Math.min(...c)/pts.length;
  if(mx>0.55||mn<0.12)out.push(`место явления, ${name}: искомое ${NM[c.indexOf(Math.max(...c))]} предложения — ${(mx*100).toFixed(0)} % из ${pts.length} (в начале ${c[0]}, в середине ${c[1]}, в конце ${c[2]}); нужен разброс по всему предложению (норма: каждая треть 12–55 %)`)}
 const by={};pts.forEach(p=>{const key=name==='тренажёр'?'урок '+p.l:p.grp;(by[key]=by[key]||[]).push(p)});
 const need=name==='тренажёр'?10:6;
 Object.entries(by).forEach(([g,m])=>{if(m.length<need)return;const c=[0,0,0];m.forEach(p=>c[B3(p.pos)]++);
  if(Math.max(...c)/m.length>=0.85)out.push(`место явления, ${name}, ${g}: всё искомое (${m.length}) ${NM[c.indexOf(Math.max(...c))]} предложений — менять позиции`)});
 return out}
module.exports={measure,warnings,gapPositions,keyPosition};
