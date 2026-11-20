// ---------- главная (#home) и кабинет «Мои результаты» (#me) ----------
// Главная — про действие: «Продолжить», «Учебник», заданное, что повторить; цифры — вторым планом, время — последним.
// Расчёты — в stats.js. Клики — по data-h*, data-me*, data-bk, data-wipe (свой обработчик внизу файла).
const HI={
 chev:'<svg class="hch" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
 user:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.2-3.6 4-5.4 7.5-5.4s6.3 1.8 7.5 5.4"/></svg>',
 ok:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'};
const chNum=m=>`${m.part.n}.${m.part.ch.indexOf(m)+1}`;
const initials=()=>{const p=S.prof||{};return ((p.name||'').trim().charAt(0)+(p.sur||'').trim().charAt(0)).toUpperCase()};
const avaHTML=cls=>{const i=initials();return `<span class="${cls}${i?'':' no'}" aria-hidden="true">${i?esc(i):HI.user}</span>`};
function greet(){const h=new Date().getHours(),n=((S.prof||{}).name||'').trim();
 const g=h>=5&&h<12?'Доброе утро':h>=12&&h<18?'Добрый день':h>=18&&h<23?'Добрый вечер':'Здравствуй';
 return n?`${g}, ${esc(n)}!`:g+'!'}
const dateLine=()=>{try{return new Date().toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'})}catch(e){return ''}};

// где остановился: {c,meta,tab,l,L} или null (новый ученик)
function homeCont(){
 let ch=null,tab='theory',l=0;
 if(S.at&&CHAPTERS[S.at.ch]){ch=S.at.ch;tab=S.at.tab;l=+S.at.l||0}
 else if(S.last&&LES[S.last]){ch=LES[S.last].ch}
 if(!ch)return null;
 const c=CHAPTERS[ch];if(!chTabs(c).some(x=>x[0]===tab))tab='theory';
 if(tab==='theory'&&S.last&&LES[S.last]&&LES[S.last].ch===ch)l=LES[S.last].n;
 if(!c.lessons[l-1])l=0;
 return {c,meta:chById(ch),tab,l,L:l?c.lessons[l-1]:null};
}
const firstCh=()=>ALLCH.find(m=>CHAPTERS[m.id]);
const CONT_GO={theory:'Читать дальше',train:'Открыть тренажёр',classic:'К упражнениям',tests:'К тестам'};
const CONT_TAB={theory:'теория',train:'тренажёр',classic:'упражнения в тетрадь',tests:'тесты'};
function contHTML(){
 const k=homeCont();
 if(!k){const m=firstCh();if(!m)return '';const c=CHAPTERS[m.id];
  return `<button class="hmcont" style="--pc:${m.part.c}" data-hcont><span class="hmk">С чего начать</span><span class="hmnum" aria-hidden="true">${chNum(m)}</span>
  <span class="t">${m.t}</span><span class="s">Урок 1 из ${c.lessons.length}. ${c.lessons[0].t}</span>
  <span class="hmcta">Начать с первой главы${HI.chev}</span></button>
  <p class="hmnote">Можно начать и с любой другой темы — она найдётся в учебнике или через поиск.</p>`}
 const {c,meta,tab,l,L}=k,v=L?lessonLevel(L.id):null;
 return `<button class="hmcont" style="--pc:${meta.part.c}" data-hcont><span class="hmk">Продолжить</span><span class="hmnum" aria-hidden="true">${chNum(meta)}</span>
 <span class="t">${meta.t}</span><span class="s">${L?`Урок ${l} из ${c.lessons.length}. ${L.t}`:`Вся глава · ${c.lessons.length} ${plural(c.lessons.length,'урок','урока','уроков')}`}</span>
 <span class="hmwhere">${modeIco(tab,16)}<span>${CONT_TAB[tab]}</span>${v&&v.lv>1?`<span class="hmdot"></span>${stepsHTML(v.lv)}<span>${v.word}</span>`:''}</span>
 <span class="hmcta">${CONT_GO[tab]}${HI.chev}</span></button>`;
}
// ---------- серия «дни подряд» и маскот ----------
// Маскот «Ёшка» — минималистичный, в духе Мелеты и Notion: круг и несколько тонких линий, без украшений и букв.
// Состояния: happy (сегодня занимались) — глаза-дуги и улыбка; nudge (серия идёт, сегодня ещё нет) — глаза-точки и ровный рот;
// calm (серии нет) — закрытые глаза и лёгкая улыбка. Цвет — токены темы: светлая и тёмная.
function mascotHTML(st){
 const L=d=>`<path class="mk-l" d="${d}"/>`,D=(x,y)=>`<circle class="mk-d" cx="${x}" cy="${y}" r="3.4"/>`;
 const f=st==='happy'?L('M30 46q5-8 10 0')+L('M60 46q5-8 10 0')+L('M36 63q14 16 28 0')
  :st==='nudge'?D(36,46)+D(64,46)+L('M40 68h20')
  :L('M30 46q5 6 10 0')+L('M60 46q5 6 10 0')+L('M41 66q9 6 18 0');
 return `<svg class="mk mk-${st}" viewBox="0 0 100 100" width="76" height="76" role="img" aria-label="${st==='happy'?'Ёшка радуется':st==='nudge'?'Ёшка ждёт':'Ёшка спокоен'}">
 <circle class="mk-ring" cx="50" cy="50" r="46"/>${f}</svg>`;
}
const dayWord=n=>plural(n,'день','дня','дней');
function streakHTML(me){
 const k=streakInfo();
 const head=k.today?`${k.n} ${dayWord(k.n)} подряд`:k.alive?`${k.n} ${dayWord(k.n)} подряд`:'Дни занятий подряд';
 const msg=k.st==='happy'?(k.n>1?'Сегодня день засчитан. Так держать — без спешки.':'Сегодня день засчитан. Хорошее начало.')
  :k.st==='nudge'?'Сегодня ещё не занимались. Несколько минут — и день засчитается; не получится — ничего страшного.'
  :'Серия начнётся с первого дня занятий. Пропуски не страшны: счёт можно начать заново в любой день.';
 return `<section class="hmsec hmbox hmstreak${me?' me':''}" aria-label="Дни занятий подряд"><div class="hmsk">${mascotHTML(k.st)}
 <div class="b"><h2 class="hmh">${head}</h2><p class="hmnote">${msg}</p>
 ${me&&k.best>1?`<p class="hmnote">Больше всего подряд за последние месяцы: ${k.best} ${dayWord(k.best)}.</p>`:''}
 <p class="hmnote sm">День засчитывается, когда набралась минута активных занятий. Это не оценка.</p></div></div></section>`;
}
// подпись автора: компактная строка (главная) или карточка (содержание, кабинет); ссылки открываются только по нажатию
const AUTH={name:'Александр Ким',tg:'Alxdrkm',mail:'kim.alexandr.alexandrovich@gmail.com'};
// проекты автора: значки Deixis и Melete — их настоящие логотипы (встроены в файл, без сети); остальные — встроенные SVG; ссылки открываются только по нажатию
const PROJ=[
 {t:'Интерактивный русский',d:'Этот учебник: теория, упражнения, словари и интерактивные задания в одном месте.',u:'https://veracerkof-debug.github.io/interactive.russian/',c:'#c2693a',g:'<path d="M8 20V7h8M8 13.5h6M8 20h8"/><path d="M9.5 4h.01M14.5 4h.01" stroke-width="2.4"/>',me:1},
 {t:'Библиотека Филолога 2.0',d:'Сборник нужной литературы в одной группе Telegram — архив, который дорабатывается для удобной работы.',u:'https://t.me/+Nfi89Owq-VE3Zjhi',c:'#2f7fb0',g:'<path d="M4 5h4v14H4zM10 5h4v14h-4z"/><path d="m16 6 3.5-1 3 13-3.5 1z"/>'},
 {t:'Deixis',d:'Трансляция презентации или текста на любой другой экран с управлением с телефона.',u:'https://veracerkof-debug.github.io/deixis-app/',c:'#6b5bb0',im:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALQAAAC0CAAAAAAYplnuAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAACYktHRAD/h4/MvwAAAAd0SU1FB+oKFwI4K0TSdBYAAAUoSURBVHja7ZtriFVVFIDXOLdxGl9jmSg+mEIksawGaYJMMHsaTFZqasWkQ5JQREnhH6MXaKGRYUHawwonQ0GSpCTU0CiJEmmisMweioMa5ljTaPP4+nHvzKy5cx/nnnuOyx/r+3XP3mvv893Fupd97t5XxHEcx3Ecx3Ecx3Ecx3Ecx3Ecx3Ecx3Ecx3FipiS2mWdcKyJNb1i/wYIo+QWgbZi1R0HcCAAPW3sUxIak9OfWHoVQ2ZqU7hgVw+T9YpK+rzw1/5y40hID+0jxtbVJcK6mm8uinz2m8qjveTk3njtET/nJnkw3WssEZR6KiZFPH0951OuLefEkJmqqOnWmf458/lgyvbDXMmzc5JhyE20i/qAXq6yFgnBbb2cOx7f+jY5NadJMtTbKz7Cz6dKvWyvl53EA9BfI8YS1U14aAdpX6lTfau2UjxoAPh7ZoaTfsZbKx1oAZsoOJX2qv7VVbiqaAZoSUq/rY6a1Vm7qAFguUnlGSW+01srNboDOcSKyRUm3DLD2ysV4AHaKiMzR9XFeL/VWADBfROTC00p6q7VYDhJHAU4mH8XfU9JnK63VslMLwOrkRa+F00Jrtex8BMCVyYvEcSX9mbVaVka0AeztunxNSbcPj+420T651CVERN7sumxQXaWz48pUsRwA+Htg12XJryrVX1jLZeEGANb1NCxX0p1jrfUysx6Amp6GSfr740lrvYwMagH4Tjc1KulvI7tRlB/EuRUi6mMoIvKBel09PoZEFc1egDMX6aYqXR9PWwtmYCIAG3o3fqmkf7A2zMDLAEzr3fioTvVV1op9KDsBcDDth5nh7Up6ubVjH2YBsDS9ebuSPmTt2IdPANpGpDfX6fq4zloyjdEdAFv6tA9uVdKvWFumsQyAO/p2bFbSR+PaAQxHySGAI6V9e+7W9TGt8JljZDoAz2Xo6X9KSZ9fhxIaADqrMnW9raT/vMBaVDG0FWB7xr6bdX3MsDZVPAJA5oeT0iYl/b61qWIfwImyzJ2rlfTpcmvVbq4BYGWW3hpdH/dYu3azBoDLs3UfVNKbrV27SG6FZ39yfUFJtw6ytk0xH4C6rP0TdH08YG2bYgdAc0X2gP1Kepu1bZJLOyH3vttTSvq/i619RUTkeQCqc0SM1Rt0i6x9RUT6HQbYlzNmj5LeaS0sInI7AItzxixW0h0jrY0ltWD+d0jOmGFtyvoxa+OurfB380RtU9JfWSuLPAHAlDxR9+uv6iprZ/ke4Md8UQNblPTSIPPGSXI1tCRv3EYlvd9aei3A2UvyxtXq+phg6zzgNMCm/IFl6nwhz9pKPwjALQEi1ynpA7bSewB+C/JzxjRdH9UBBsRGcit8WZDQfkeU9EuW0i8CtI8OFLtKSf9ueOot0VTACnmyro/r7aTvBIIfmzmgpNfYSW8FaAp6gO0ZJX2sNOCgyBnZBrAiaPh4XR83WUkvhdTRn2B8o6TfspL+CWBX8PglSvqvsuDjomQqkDr6E4xR+oBhrY30eug++hOMXUq6oYBx0TG4BeDVQoY8pKT/qShkZFQsAmBSIUOG6lPK94a+cxGHhOtFRJprC6rNY2N6Xs/9MPy9w3IFRXJmSNhbh98jqw89MkX/u2JKZ3aSW+FF8ek5l55dtDNt+Z8sMxO6PIquDpHErJgSmo0xHcVnmt0hbx420wui2OWeEuyRJyrpkgUROEtJyD/ghpSeXhWFdNh//YWUjuBjKCIyOfha3HEcx3Ecx3Ecx3Ecx3Ecx3Ecx3Gcc8b/AwkMvRHowvwAAAAASUVORK5CYII=',g:'<rect x="3" y="5" width="18" height="11" rx="2"/><path d="M9 20h6M12 16v4"/><path d="m10.5 8.5 3.5 2-3.5 2z"/>'},
 {t:'Melete',d:'Приложение для музыканта: все нужные инструменты в одном месте, без рекламы и без трекинга.',u:'https://veracerkof-debug.github.io/melete-app/show/',c:'#3f8f6b',im:'data:image/png;base64,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',g:'<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>'}
];
const projIco=p=>p.im?`<span class="pico img"><img src="${p.im}" alt="" width="48" height="48"></span>`:`<span class="pico" style="--pc:${p.c}"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p.g}</svg></span>`;
function aboutHTML(){
 return `<div class="bkhbar"><div class="in"><button class="back" data-hgo="home">‹ Главная</button><span class="tools"><button class="ibtn" data-hgo="toc">${ico('book',18)}Учебник</button></span></div></div>
 <div class="wrap about"><header class="chhead"><div style="display:flex;flex-direction:column;gap:2px;min-width:0"><h2>Об авторе</h2><div class="sub">${AUTH.name}</div></div></header>
 <section class="auth card"><p class="an">${AUTH.name}</p><p>Литератор, магистрант первого курса; преподаёт русский язык. «Интерактивный русский» написан и выстроен автором с помощью Claude (Anthropic): сбор, проверка и оформление материала.</p><p>Учебник бесплатный; данные ученика хранятся только на его устройстве. Нашли ошибку или есть предложение? Напишите — отвечу.</p><p class="al">${authLinks()}</p><p class="am">${AUTH.mail}</p></section>
 <div class="kick" style="margin-top:14px">Другие проекты</div><div class="projs">${PROJ.map(p=>`<a class="proj" href="${p.u}" target="_blank" rel="noopener noreferrer">${projIco(p)}<span class="b"><b>${p.t}${p.me?' · вы здесь':''}</b><small>${p.d}</small></span></a>`).join('')}</div></div>`;
}
const authLinks=()=>`<a href="https://t.me/${AUTH.tg}" target="_blank" rel="noopener noreferrer">Telegram&nbsp;@${AUTH.tg}</a><span class="hmdot"></span><a href="mailto:${AUTH.mail}">Написать на почту</a>`;
function authorHTML(full){
 if(!full)return `<footer class="auth line" aria-label="Об авторе"><p>Автор учебника — <b>${AUTH.name}</b></p><p class="al">${authLinks()}</p></footer>`;
 return `<section class="auth card" aria-label="Об авторе"><span class="kick">Об авторе</span>
 <p class="an">${AUTH.name}</p>
 <p>Учитель русского языка. Учебник написан и выстроен автором — с помощью Claude (Anthropic), который помогал со сбором, проверкой и оформлением материала.</p>
 <p>Нашли ошибку или есть предложение? Напишите — отвечу.</p>
 <p class="al">${authLinks()}<span class="hmdot"></span><button class="linkbtn" data-hgo="about">Другие проекты автора</button></p><p class="am">${AUTH.mail}</p></section>`;
}
// «Сегодня»: серия, маскот и неделя в одной спокойной карточке
function todayHTML(){
 const k=streakInfo(),wk=weekDays(0),wt=wk.reduce((s,x)=>s+x.sec,0);
 const head=k.alive||k.today?`${k.n} ${dayWord(k.n)} подряд`:'Дни занятий подряд';
 const msg=wt?`<b>${fmtDur(wt)}</b> за неделю`:k.st==='nudge'?'Сегодня хватит нескольких минут':'Дни отметятся здесь сами';
 return `<section class="hmsec hmbox hmstreak hmweek hmtoday" aria-label="Дни занятий подряд">
 <div class="hmsk">${mascotHTML(k.st)}<div class="b"><h2 class="hmh">${head}</h2><p class="hmnote hmtime">${msg}</p></div>
 <div class="hmdays" role="img" aria-label="Дни занятий на этой неделе: ${wk.filter(x=>x.on).map(x=>x.wd).join(', ')||'пока нет'}">${wk.map(x=>`<span class="hmday${x.on?' on':''}${x.today?' td':''}${x.fut?' fut':''}" title="${x.wd}: ${x.sec?fmtDur(x.sec):'—'}"><i>${x.on?HI.ok:''}</i><small>${x.wd}</small></span>`).join('')}</div></div></section>`;
}
function homeHTML(){
 const ready=ALLCH.filter(m=>CHAPTERS[m.id]),nles=ready.reduce((s,m)=>s+CHAPTERS[m.id].lessons.length,0);
 const hasName=!!((S.prof||{}).name||'').trim(),dl=dateLine();
 let h=`<div class="wrap hm" id="hmwrap"><header class="hmtop"><div class="hmhi"><h1>${greet()}</h1><div class="sub">${dl}${hasName?'':`${dl?'<span class="hmdot"></span>':''}<button class="linkbtn" data-hgo="me" data-hname>Указать имя</button>`}</div></div>
 <button class="hmava" data-hgo="me" aria-label="Мои результаты и профиль" title="Мои результаты">${avaHTML('ava')}</button></header>
 <div class="hmgrid"><div class="hmcol">${contHTML()}
 <input class="bsearch" id="q" type="search" placeholder="Найти тему, урок, термин или слово" autocomplete="off" aria-label="Поиск по учебнику">
 <div class="sres" id="sres"></div>
 <section class="hmbook" aria-label="Учебник">
  <button class="hmbig" data-hgo="toc">${ico('book',24)}<span class="b"><b>Учебник</b><small>${ready.length} ${plural(ready.length,'глава','главы','глав')} · ${nles} ${plural(nles,'урок','урока','уроков')}</small></span>${HI.chev}</button>
  <div class="hmref" role="group" aria-label="Словари и термины">
   <button data-view="gloss">${ico('gloss',20)}<b>Термины</b></button>
   <button data-view="dict">${ico('dict',20)}<b>Словарь</b></button>
   <button data-view="cards">${ico('cards',20)}<b>Карточки</b></button></div>
 </section></div><div class="hmcol">${nextHTML()}`;
 // одним списком: заданное, что повторить, что не доведено — не больше четырёх строк
 const rows=[];
 recentList().slice(0,1).forEach(x=>{const m=chById(x.ch),list=clParse(CHAPTERS[x.ch],String(x.r).replace(/,/g,', '));if(!list.length)return;
  const dn=list.filter(n=>S.done['cl-'+x.ch+'-'+n]).length;
  rows.push(`<button class="hmrow" data-hex="${x.ch}:${x.r}"><span class="b"><b>${m.t}, ${list.length>1?'упражнения':'упражнение'} ${clFmt(list)}</b><small>задано · ${list.length>1?`сделано ${dn} из ${list.length}`:dn?'сделано':'в тетрадь'}</small></span><span class="hmact">Открыть</span></button>`)});
 weakLessons(1).forEach(w=>{const L=LES[w.id],m=chById(L.ch);
  const why=w.g===ST.WEAK_G?'тест пока не сдан':`${w.bad} ${plural(w.bad,'ошибка','ошибки','ошибок')} в последних ${w.of} ответах`;
  rows.push(`<button class="hmrow" data-hrep="${w.id}"><span class="b"><b>${m.t}, урок ${L.n}</b><small>повторить · ${why}</small></span><span class="hmact">Повторить</span></button>`)});
 unfinished(1).forEach(u=>{const m=chById(u.c.id);
  rows.push(`<button class="hmrow" data-hun="${u.c.id}"><span class="b"><b>${m.t}</b><small>не доведено · осталось: ${leftText(u.left)}</small></span><span class="hmact">К тестам</span></button>`)});
 if(rows.length)h+=`<section class="hmsec hmmore2"><h2 class="hmh">Дальше</h2><div class="hmlist">${rows.slice(0,2).join('')}</div></section>`;
 h+=todayHTML();
 return (h+`</div></div>${authorHTML(false)}</div>`).replace(' id="hmwrap"',rows.length?' data-rows="1"':'');
}

// ---------- кабинет ----------
let ME={edit:false,bk:'',pv:null,err:'',wipe:0};
const fmtAt=at=>{if(!at)return 'дата не указана';try{return new Date(at).toLocaleString('ru-RU',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})}catch(e){return ''}};
const dShort=d=>{try{return d.toLocaleDateString('ru-RU',{day:'numeric',month:'short'}).replace('.','')}catch(e){return ''}};
function meProfHTML(){
 const p=S.prof||{},full=profName();
 if(ME.edit||!full)return `<section class="mec meprof"><form class="mepf" data-meform>
  <h2 class="hmh">${full?'Профиль':'Как тебя зовут?'}</h2>
  ${full?'':'<p class="hmnote">Имя появится на главной и в копии данных. Оно хранится только на этом устройстве.</p>'}
  <div class="mef"><label>Имя<input name="name" value="${esc(p.name||'')}" maxlength="40" autocomplete="off" autocapitalize="words" enterkeyhint="next"></label>
  <label>Фамилия<input name="sur" value="${esc(p.sur||'')}" maxlength="40" autocomplete="off" autocapitalize="words" enterkeyhint="next"></label>
  <label class="cl">Класс<input name="cls" value="${esc(p.cls||'')}" maxlength="8" autocomplete="off" placeholder="7 Б" enterkeyhint="done"></label></div>
  <div class="mebtns"><button type="submit" class="bkldone">Сохранить</button>${full?'<button type="button" class="ghost" data-meedit="0">Отмена</button>':''}</div></form></section>`;
 return `<section class="mec meprof"><div class="mepv">${avaHTML('ava big')}<div class="b"><div class="nm">${esc(full)}</div><div class="sub">${p.cls?esc(p.cls)+' класс':'класс не указан'}</div></div>
  <button class="ghost mesm" data-meedit="1">Изменить</button></div></section>`;
}
function meTopicsHTML(){
 const chs=ALLCH.filter(m=>CHAPTERS[m.id]),st=chs.filter(m=>chStarted(CHAPTERS[m.id])),rest=chs.filter(m=>!st.includes(m));
 let h=`<section class="mesec"><h2 class="hmh">Мои темы</h2>`;
 if(!st.length)h+=`<div class="mec meempty"><p>Здесь появятся темы, которыми ты занимаешься: ступень по каждому уроку и оценки за тесты.</p><button class="bkldone" data-hgo="toc">Открыть учебник</button></div>`;
 else h+=`<p class="hmnote melegend">${stepsHTML(1)} начато <span class="hmdot"></span> ${stepsHTML(2)} знакомо: в тренажёре не меньше ${ST.FAM_N} ответов, большинство верных <span class="hmdot"></span> ${stepsHTML(3)} уверенно: тест по уроку на 4 или 5. Глава освоена, когда сданы все её тесты.</p>`;
 st.forEach(m=>{const c=CHAPTERS[m.id],fin=chTestsDone(c),all=tAll(c),pass=all.filter(k=>tPassed(c,k)).length,fr=c.tests?tRes(c,'final'):null;
  h+=`<article class="mec mech" style="--pc:${m.part.c}"><header><span class="cn">${chNum(m)}</span><b>${m.t}</b><span class="st${fin?' ok':''}">${fin?'освоена':c.tests?`тестов сдано: ${pass} из ${all.length}`:''}</span></header>
  <ol class="mel">${c.lessons.map((l,i)=>{const v=lessonLevel(l.id);
   return `<li><button class="merow${v.weak?' weak':''}" data-ojump2="${l.id}" aria-label="Урок ${i+1}. ${esc(l.t)}: ${v.word}${v.g?', тест: '+v.g:''}${v.weak?', стоит повторить':''}"><span class="ln">${i+1}</span><span class="lb"><span class="lt">${l.t}</span>
   <span class="ls">${stepsHTML(v.lv)}<span>${v.word}</span>${c.tests?`<span class="hmdot"></span><span>${v.g?'тест: <b>'+v.g+'</b>':'тест не написан'}</span>`:''}${v.weak?'<span class="mewk">стоит повторить</span>':''}</span></span></button></li>`}).join('')}</ol>
  ${c.tests?`<button class="mefin" data-hun="${m.id}"><span>Итоговый тест: ${fr?`<b>${fr.last}</b>`:'не написан'}</span><span class="hmact">${fin?'Тесты':'К тестам'}</span></button>`:''}</article>`});
 if(st.length&&rest.length)h+=`<div class="menew"><span class="hmnote">Ещё не начато</span><div class="chips">${rest.map(m=>`<button class="chipc sm" data-ch="${m.id}">${m.t}</button>`).join('')}</div></div>`;
 return h+'</section>';
}
function meTimeHTML(){
 const W=[0,1,2,3].map(o=>weekDays(o)),mx=Math.max(1,...W.flat().map(x=>x.sec)),tot=W.flat().reduce((s,x)=>s+x.sec,0);
 return `<section class="mesec"><h2 class="hmh">Время</h2><div class="mec metime">
 ${tot?W.map((w,o)=>{const s=w.reduce((a,x)=>a+x.sec,0);
  return `<div class="mewk4"><span class="wl">${o===0?'эта неделя':o===1?'прошлая':dShort(w[0].d)+' – '+dShort(w[6].d)}</span>
  <span class="wb" role="img" aria-label="${fmtDur(s)}">${w.map(x=>`<i class="${x.sec?'':'z'}${x.today?' td':''}" title="${x.wd}, ${dShort(x.d)}: ${x.sec?fmtDur(x.sec):'—'}"><u style="height:${x.sec?Math.max(8,Math.round(x.sec/mx*100)):0}%"></u></i>`).join('')}</span>
  <span class="wt">${s?fmtDur(s):'—'}</span></div>`}).join('')+`<div class="mewd" aria-hidden="true"><span></span><span class="wb">${WD.map(d=>`<i>${d}</i>`).join('')}</span><span></span></div>`
  :'<p class="hmnote">Здесь будет видно, сколько времени ушло на занятия за последние четыре недели.</p>'}
 <p class="hmnote">Считается только время, когда ты что-то делаешь: читаешь, отвечаешь, листаешь. Перерыв дольше пяти минут не идёт в счёт. Время — не оценка.</p></div></section>`;
}
function meNoteHTML(){
 const rows=ALLCH.map(m=>[m,CHAPTERS[m.id]]).filter(([m,c])=>c&&c.classic&&clDoneN(c)),tot=rows.reduce((s,[m,c])=>s+clDoneN(c),0);
 return `<section class="mesec"><h2 class="hmh">Упражнения в тетрадь</h2><div class="mec menote">
 <p class="menb"><b>${tot}</b><span>отмечено сделанными<small>по твоим отметкам — проверяет их учитель</small></span></p>
 ${rows.length?`<div class="menl">${rows.map(([m,c])=>`<button data-ch="${m.id}" data-tabto="classic"><span>${m.t}</span><span>${clDoneN(c)} из ${c.classic.length}</span></button>`).join('')}</div>`:''}</div></section>`;
}
function meDataHTML(){
 const pv=ME.pv;
 let h=`<section class="mesec" id="medata"><h2 class="hmh">Мои данные</h2><div class="mec medata">
 <p class="hmnote">Всё, что ты сделал в учебнике, хранится только на этом устройстве. Копия нужна, чтобы перенести результаты на другой телефон или компьютер — и на всякий случай.</p>
 <div class="mebtns"><button class="bkldone" data-bk="save">Сохранить копию</button><button class="ghost" data-bk="load">Загрузить копию</button></div>
 <input type="file" id="bkfile" accept=".json,application/json,text/plain" hidden>
 <div class="melinks"><button class="linkbtn" data-bk="text" aria-expanded="${ME.bk==='text'}">Показать как текст</button><button class="linkbtn" data-bk="paste" aria-expanded="${ME.bk==='paste'}">Вставить текст копии</button></div>`;
 if(ME.bk==='text')h+=`<div class="mebox"><p class="hmnote">Если файл не сохраняется, скопируй этот текст целиком и отправь себе — например, в сообщении.</p>
  <textarea id="bkout" readonly rows="5" aria-label="Текст копии">${esc(bkText())}</textarea><div class="mebtns"><button class="ghost" data-bk="copy">Скопировать</button><button class="ghost" data-bk="close">Скрыть</button></div></div>`;
 if(ME.bk==='paste')h+=`<div class="mebox"><p class="hmnote">Вставь сюда текст копии целиком.</p>
  <textarea id="bkin" rows="5" aria-label="Текст копии" placeholder='{"app":"rus-uchebnik", …}' autocomplete="off" autocapitalize="off" spellcheck="false"></textarea><div class="mebtns"><button class="ghost" data-bk="check">Проверить копию</button><button class="ghost" data-bk="close">Отмена</button></div></div>`;
 if(ME.err)h+=`<p class="meerr" role="alert">${esc(ME.err)}</p>`;
 if(pv)h+=`<div class="mebox mepvw" id="bkpv" role="group" aria-label="Копия данных"><b>${pv.by?esc(pv.by):'Копия без имени'}</b>
  <p>Сохранена: ${fmtAt(pv.at)}.<br>В ней: ${pv.sum.lessons} ${plural(pv.sum.lessons,'начатый урок','начатых урока','начатых уроков')}, ${pv.sum.tests} ${plural(pv.sum.tests,'сданный тест','сданных теста','сданных тестов')}, время занятий — ${fmtDur(pv.sum.time)}.</p>
  <p class="hmnote">Данные на этом устройстве будут заменены данными из копии.</p>
  <div class="mebtns"><button class="bkldone" data-bk="apply">Заменить мои данные</button><button class="ghost" data-bk="cancel">Отмена</button></div></div>`;
 h+=`<div class="mewipe">${ME.wipe===0?'<button class="linkbtn mered" data-wipe="1">Стереть все данные</button>'
  :ME.wipe===1?`<div class="mebox"><b>Стереть все данные на этом устройстве?</b><p class="hmnote">Пропадут пройденные уроки, оценки за тесты, карточки, время и профиль. Если копии нет — лучше сначала её сохранить.</p>
   <div class="mebtns"><button class="ghost" data-wipe="0">Не стирать</button><button class="ghost mered" data-wipe="2">Да, стереть</button></div></div>`
  :`<div class="mebox"><b>Точно стереть? Вернуть данные будет нельзя.</b>
   <div class="mebtns"><button class="ghost" data-wipe="0">Не стирать</button><button class="bkldone mered2" data-wipe="3">Стереть навсегда</button></div></div>`}</div>`;
 return h+'</div></section>';
}
function meHTML(){
 return `<div class="bkhbar"><div class="in"><button class="back" data-hgo="home">‹ Главная</button><span class="tools"><button class="ibtn" data-hgo="toc">${ico('book',18)}Учебник</button></span></div></div>
 <div class="wrap me"><header class="chhead"><div style="display:flex;flex-direction:column;gap:2px;min-width:0"><h2>Мои результаты</h2><div class="sub">Что уже получается и к чему стоит вернуться.</div></div></header>
 <div class="megrid"><div class="mecol">${meProfHTML()}${meTopicsHTML()}</div><div class="mecol">${streakHTML(true)}${meTimeHTML()}${meNoteHTML()}${meDataHTML()}${authorHTML(true)}</div></div></div>`;
}
function meRe(focus){const y=window.scrollY;render();window.scrollTo(0,y);if(focus){const el=document.querySelector(focus);if(el){el.focus({preventScroll:true});el.scrollIntoView({block:'nearest'})}}}
function meBind(){
 const f=document.getElementById('bkfile');if(!f)return;
 f.addEventListener('change',()=>{const file=f.files&&f.files[0];if(!file)return;
  if(file.size>5e6){ME.pv=null;ME.err='Файл слишком большой — это не копия данных учебника.';meRe();return}
  const rd=new FileReader();rd.onload=()=>bkPreview(String(rd.result||''));rd.onerror=()=>{ME.err='Не удалось прочитать файл.';meRe()};rd.readAsText(file)});
}
function bkPreview(text){const r=bkRead(text);ME.pv=r.ok?r:null;ME.err=r.ok?'':r.err;if(r.ok)ME.bk='';meRe(r.ok?'#bkpv [data-bk="apply"]':null)}
function bkDownload(){
 const text=bkText(),name=bkName();
 try{const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;a.style.display='none';document.body.append(a);a.click();
  setTimeout(()=>{a.remove();URL.revokeObjectURL(url)},1500);toast('Копия сохранена: '+name)}
 catch(e){ME.bk='text';ME.err='Файл сохранить не получилось. Ниже — та же копия текстом.';meRe('#bkout')}
}
function bkCopy(){
 const ta=document.getElementById('bkout');if(!ta)return;const done=()=>toast('Скопировано');
 const old=()=>{ta.focus();ta.select();try{document.execCommand('copy')?done():toast('Выделено — осталось скопировать')}catch(e){toast('Выделено — осталось скопировать')}};
 if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(ta.value).then(done,old);else old();
}
// переходы с главной
function goTrainLes(chId,n){const c=CHAPTERS[chId];route={v:'ch',id:chId};CLR=null;
 if(!nvHas(c,'train',n)){openLesson(c.lessons[n-1].id);return}
 S.tab='train';trSync();TR.les=[n];TR.run=null;save();go({v:'ch',id:chId,l:c.lessons[n-1].id})}
function goCont(){
 const k=homeCont();
 if(!k){const m=firstCh();if(m)openLesson(CHAPTERS[m.id].lessons[0].id);return}
 const {c,tab,l,L}=k;
 if(tab==='theory'){if(L)openLesson(L.id);else{S.tab='theory';save();go({v:'ch',id:c.id})}return}
 if(tab==='train'&&l){goTrainLes(c.id,l);return}
 route={v:'ch',id:c.id};CLR=null;S.tab=tab;
 if(tab==='train'){trSync();if(!TR.run)TR.les=c.lessons.map((_,i)=>i+1)}
 if(tab==='classic'){CLF=l;CLU=false;CLO=false}
 if(tab==='tests')TSV=TS&&TS.ch===c.id&&!TS.res?'run':'list';
 save();go({v:'ch',id:c.id,l:L?L.id:undefined});
}
document.addEventListener('submit',e=>{const f=e.target;if(!f.matches('[data-meform]'))return;e.preventDefault();
 S.prof={name:f.name.value.trim().slice(0,40),sur:f.sur.value.trim().slice(0,40),cls:f.cls.value.trim().replace(/\s*класс$/i,'').slice(0,8)};
 ME.edit=false;save();meRe();if(profName())toast('Сохранено')});
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;const d=b.dataset;
 if(d.hgo){if(d.hgo==='me'){ME={edit:'hname' in d,bk:'',pv:null,err:'',wipe:0}}
  if(d.hgo==='toc'){S.view='book';save()}
  go({v:d.hgo});if('hname' in d){const i=document.querySelector('[data-meform] input');if(i)i.focus()}return}
 if('hcont' in d){goCont();return}
 if(d.hrep){const L=LES[d.hrep];if(L)goTrainLes(L.ch,L.n);return}
 if(d.hex){const [id,r]=d.hex.split(':'),c=CHAPTERS[id];if(!c)return;const list=clParse(c,r.replace(/,/g,', '));route={v:'ch',id};CLR=list.length?list:null;S.tab='classic';save();go({v:'ch',id});return}
 if(d.hun){const c=CHAPTERS[d.hun];if(!c)return;route={v:'ch',id:c.id};CLR=null;S.tab=c.tests?'tests':'theory';TSV=TS&&TS.ch===c.id&&!TS.res?'run':'list';save();go({v:'ch',id:c.id});return}
 if(d.meedit!==undefined){ME.edit=d.meedit==='1';meRe(ME.edit?'[data-meform] input':null);return}
 if(d.bk){const k=d.bk;ME.err='';
  if(k==='save'){bkDownload();return}
  if(k==='load'){const f=document.getElementById('bkfile');if(f){f.value='';f.click()}return}
  if(k==='text'||k==='paste'){ME.bk=ME.bk===k?'':k;ME.pv=null;meRe(ME.bk==='text'?'#bkout':ME.bk==='paste'?'#bkin':null);return}
  if(k==='close'){ME.bk='';meRe();return}
  if(k==='copy'){bkCopy();return}
  if(k==='check'){const t=document.getElementById('bkin');bkPreview(t?t.value:'');return}
  if(k==='cancel'){ME.pv=null;meRe();return}
  if(k==='apply'){if(!ME.pv)return;bkApply(ME.pv.data);ME={edit:false,bk:'',pv:null,err:'',wipe:0};go({v:'home'});toast('Данные из копии загружены');return}
  return}
 if(d.wipe!==undefined){const k=+d.wipe;
  if(k===3){wipeAll();ME={edit:false,bk:'',pv:null,err:'',wipe:0};go({v:'home'});toast('Все данные стёрты');return}
  ME.wipe=k;meRe(k?'.mewipe .mebox [data-wipe="0"]':null);return}
});
