// ---------- режим «Углублённо» (решение владельца 18.11.2026) ----------
// Третий режим рядом с «Проще»; режимы взаимоисключающие (S.easy / S.adv). Материал главы — в src/chapters/<id>/adv.js:
// CHAPTERS_ADV.<id>={theory:{<id урока>:html}, classic:[{n:201+,l,st:4–5,task,body,key}], bank:[как в bank.js], tests:[как в tests.js]}.
// Режим подменяет данные главы на месте (c.classic, c.bank, c.tests), поэтому все экраны, статистика и счётчики работают без правок:
//  · упражнения в тетрадь — готовые ★4–5 + новые из adv.js (номера n ≥ 201, постоянные);
//  · тренажёр — банк adv.js (если пуст — обычный); тесты — слоты adv.js (если пусты — обычные), результаты хранятся отдельно (ключ с «~a»);
//  · теория — основной текст + блок «Углублённо» (adv.theory) + «Тонкости» раскрыты.
// Главы без adv.js в этом режиме не меняются (плашка «готовится»).
const advHas=id=>!!CHAPTERS_ADV[id];
function advApply(){
 for(const id in CHAPTERS){
  const c=CHAPTERS[id],A=CHAPTERS_ADV[id];if(!A)continue;
  if(!c._b)c._b={classic:c.classic,bank:c.bank,tests:c.tests};
  const b=c._b;
  if(S.adv){
   c.classic=[...(b.classic||[]).filter(e=>e.st>=4),...(A.classic||[])];
   c.bank=(A.bank&&A.bank.length)?A.bank:b.bank;
   c.tests=(A.tests&&A.tests.length)?A.tests:b.tests;
   c.advTests=!!(A.tests&&A.tests.length);
  }else{c.classic=b.classic;c.bank=b.bank;c.tests=b.tests;c.advTests=false}
 }
}
function advToggle(){S.adv=!S.adv;if(S.adv)S.easy=false;save();advApply()}
function advTheory(ch,l){const A=CHAPTERS_ADV[ch.id];return S.adv&&A&&A.theory&&A.theory[l.id]?`<div class="bins advbox"><div class="h">Углублённо</div>${A.theory[l.id]}</div>`:''}
advApply();
