#!/usr/bin/env python3
"""Повторы слов в заданиях главы — по местам и по леммам (PRINCIPLES §5.7).

Запуск: python3 tools/povtory.py <id главы> [порог=7] [--slovo лемма] [--adv]
(--adv — считать только материал режима «Углублённо»: src/chapters/<id>/adv.js — упражнения, тренажёр, тесты)
Нужен pymorphy3 (pip install pymorphy3). Место — одно задание тренажёра (условие и свои варианты; общий набор вариантов-ярлыков не считается),
одно упражнение (образец и материал, без задания и ключа), один слот теста (все его примеры).
Подписи цитат «(И. О. Фамилия, «Название»)» из счёта убраны. Печатает леммы, которые стоят
в «порог» и более местах, и сами места: Т12 — задание тренажёра № 12 (с единицы), №34 — упражнение,
т3.5 — тест урока 3, слот 5. С ключом --slovo печатает места одной леммы (с --kont — и обрывок текста вокруг).
Служебные слова и слова оформления (STOP) не считаются.

Е.4 (18.11.2026): закрытые классы по части речи (предлоги, союзы, частицы, местоимения, числительные, междометия)
слова-меры (MERY) и термины глоссария (названия `t:` в glossary.js) вне счёта. Ключ --json печатает {"lim":N,"osn":[...],"slova":{лемма:[места]}} — его читает
tools/check-chapter.js. Потолки: слова окружения — меньше 10 мест (в bsp и spp2 — не больше 14); слова-основы —
не больше 10; основы главы — строка «Леммы-основы: слово, слово» в docs/plans/<id>.md.
"""
import sys, re, json, subprocess, pathlib
import pymorphy3
ROOT = pathlib.Path(__file__).resolve().parent.parent
cid = sys.argv[1]; args = sys.argv[2:]
slovo = args[args.index('--slovo') + 1] if '--slovo' in args else None
porog = int(args[0]) if args and args[0].isdigit() else 7
JS = r"""
const fs=require('fs'),path=require('path'),vm=require('vm');const ROOT=process.argv[1],id=process.argv[2];
const dir=path.join(ROOT,'src/chapters',id);
const box={MECH:{},relab(){},queueMicrotask:f=>f(),console,document:{addEventListener(){},getElementById(){return null},querySelector(){return null},querySelectorAll(){return []}},shuffle:a=>a,pick1:a=>a[0],esc:s=>String(s),window:{},localStorage:{getItem(){return null},setItem(){}},S:{}};
vm.createContext(box);
const PRE=['src/js/core/store.js','src/data/corpus/levels.js','src/data/corpus/orthograms.js','src/data/corpus/sentences.js','src/data/corpus/words.js','src/data/corpus/texts.js'].map(f=>path.join(ROOT,f)).filter(f=>fs.existsSync(f));
const files=['lessons','bank','classic','labs','tests','workshop','index','adv'].map(f=>path.join(dir,f+'.js')).filter(f=>fs.existsSync(f));
const SRC=[...PRE,...files].map(f=>fs.readFileSync(f,'utf8')).join('\n;\n');
const pre=(/^const CHAPTERS\b/m.test(SRC)?'':'var CHAPTERS={};')+(/^const LABS\b/m.test(SRC)?'':'var LABS={};');
vm.runInContext(pre+SRC+'\n;globalThis.__C=CHAPTERS;globalThis.__A=(typeof CHAPTERS_ADV!=="undefined"?CHAPTERS_ADV:{});',box);let C=box.__C[id];const out=[];
if(process.argv[3]==='adv'){const A=box.__A[id]||{};C={bank:A.bank||[],classic:A.classic||[],tests:A.tests||[]}}
const oc={};(C.bank||[]).forEach(b=>{const k=(b.opts||[]).join('|');oc[k]=(oc[k]||0)+1});
(C.bank||[]).forEach((b,i)=>out.push(['Т'+(i+1),b.w+' '+(oc[(b.opts||[]).join('|')]>2?'':(b.opts||[]).join(' '))]));
(C.classic||[]).forEach(e=>out.push(['№'+e.n,(e.obr||'')+' '+(e.body||'')]));
const cnt={};(C.tests||[]).forEach(s=>{cnt[s.l]=(cnt[s.l]||0)+1;out.push(['т'+s.l+'.'+cnt[s.l],(s.items||[]).map(x=>Array.isArray(x)?x[0]:((x.w||'')+' '+(x.o||[]).join(' '))).join(' ')+' '+(s.cats||[]).join(' ')])});
console.log(JSON.stringify(out));
"""
places = json.loads(subprocess.run(['node', '-e', JS, str(ROOT), cid] + (['adv'] if '--adv' in args else []), capture_output=True, text=True, check=True).stdout)
STOP = set('''быть весь это этот тот такой который свой наш мой твой ваш его её их он она оно они мы вы ты я себя кто что как так там тут где
когда если чтобы потому или либо тоже также уже ещё еще только даже лишь вот ведь же бы ли не ни да нет но а и в во на с со к ко у о об от до по за из
под над при для без через между перед про один два три первый второй другой каждый самый очень можно нужно надо мочь стать сказать говорить
слово предложение текст пояснение набор часть сочетание пример группа ошибка правка оборот фраза вопрос задание вариант объявление запись
пропуск пропустить вставить вставлять поставить ставить ставиться расставить подчеркнуть выделить выписать определить объяснить указать найти записать
запятая тире двоеточие знак место буква суффикс приставка окончание корень
год день время человек раз чем всё после много какой среди есть писатель строка большой'''.split())
SIG = re.compile(r'\((?:[А-ЯЁ]\. ){1,2}[А-ЯЁ][А-Яа-яё-]+(?:, [^()]*)?\)')
MERY = set('метр сантиметр миллиметр километр килограмм грамм тонна литр гектар градус процент рубль копейка доллар минута секунда час неделя месяц век'.split())
CLOSED = {'PREP', 'CONJ', 'PRCL', 'NPRO', 'NUMR', 'INTJ', 'NUMB'}
m = pymorphy3.MorphAnalyzer(); lem = {}; closed = set()
def L(w):
    if w not in lem:
        p = m.parse(w)[0]; lem[w] = p.normal_form
        if not m.word_is_known(w): closed.add(p.normal_form)  # обрывки слов (суффиксы, части) — не слова окружения
        if p.tag.POS in CLOSED: closed.add(p.normal_form)
    return lem[w]
where = {}
for tag, txt in places:
    txt = SIG.sub(' ', txt.replace('<br>', ' ')).lower().replace('́', '')
    for l in {L(w) for w in re.findall(r'[а-яё]{3,}', txt)}:
        if l not in STOP and l not in MERY: where.setdefault(l, []).append(tag)
terms = set()
for t in re.findall(r"\bt:'([^']+)'", (ROOT / 'src/data/glossary.js').read_text(encoding='utf8')):
    for w in re.findall(r'[а-яё]{3,}', t.lower()): terms.add(L(w))
for k in closed | terms: where.pop(k, None)
if '--json' in args:
    note = ROOT / 'docs/plans' / (cid + '.md'); osn = []
    if note.exists():
        for mm in re.finditer(r'Леммы-основы:\s*([^\n]+)', note.read_text(encoding='utf8')):
            osn += [x.strip().lower() for x in re.split(r'[,;.]', mm.group(1)) if x.strip()]
    lim = 14 if cid in ('bsp', 'spp2') else 9
    print(json.dumps({'lim': lim, 'osn': osn, 'slova': {k: v for k, v in where.items() if len(v) >= 10}}, ensure_ascii=False))
elif slovo:
    print(slovo, len(where.get(slovo, [])), ' '.join(where.get(slovo, [])))
    if '--kont' in args:
        for tag, txt in places:
            t2 = SIG.sub(' ', txt.replace('<br>', ' ')).replace('́', '')
            for mm in re.finditer(r'[А-Яа-яЁё]{3,}', t2):
                if L(mm.group(0).lower()) == slovo:
                    print(f'  {tag}: …{t2[max(0, mm.start()-45):mm.end()+35]}…'); break
else:
    rows = sorted(((len(v), k, v) for k, v in where.items() if len(v) >= porog), reverse=True)
    for n, k, v in rows: print(f'{k} — {n}: ' + ' '.join(v))
    print(f'\nлемм в {porog} и более местах: {len(rows)}')
