#!/usr/bin/env python3
"""Печатная версия учебника: чистый HTML для бумаги / PDF (ROADMAP, «Текстовая версия»).

  python3 tools/print.py                      # все готовые главы одним файлом dist/print/uchebnik.html (ученик)
  python3 tools/print.py prichastie nn        # выбранные главы одним файлом dist/print/prichastie-nn.html
  python3 tools/print.py --each               # по файлу на каждую главу: dist/print/<id>.html
  python3 tools/print.py --teacher …          # версия учителя: с ключами (dist/print/teacher/…); на сайт не выкладывается
  python3 tools/print.py --no-lite …          # без блоков «Проще» (lite, easy, fix)
  python3 tools/print.py --out DIR …          # другая папка

Файл самодостаточен (без сети): данные глав + src/js/core/print.js, который при открытии собирает книгу:
теория (с «Тонкостями»), схемы в статичном виде (интерактивные кнопки — рамками), задания тренажёра, упражнения
в тетрадь, тесты на бумаге. Версия ученика, как и tools/build.py, вырезает поля key; ответов к тренажёру и тестам
в тексте книги нет, ключи — только в версии учителя, отдельным разделом в конце главы.
Печать: открыть файл в браузере → «Печать» / «Сохранить как PDF» (A4, поля заданы через @page).
"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build

SKIP = {'src/js/core/screens.js', 'src/js/core/home.js', 'src/js/core/steps.js', 'src/js/core/printhook.js'}
FILES = [p for p in build.JS if p not in SKIP] + ['src/js/core/print.js']
CSS = [p for p in build.CSS] + ['src/css/printbook.css']

def ready_ids():
    """Готовые главы в порядке оглавления: ready:1 в store.js (PARTS) и есть в сборке."""
    import re
    st = build.read('src/js/core/store.js')
    return [m.group(1) for m in re.finditer(r"\{id:'(\w+)'[^}]*?ready:1", st)]

def make(ids, teacher, lite):
    css = ''.join(build.read(p) for p in CSS)
    cfg = 'window.PRINT_CFG=%s;\n' % json.dumps({'ids': ids, 'teacher': teacher, 'lite': lite})
    js = cfg + build.js_for(teacher, FILES)
    return ('<!doctype html><html lang="ru" data-theme="light"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1"><title>Учебник (печать)</title>'
            '<style>\n' + css + '\n</style></head><body><div id="app"></div>\n<script>\n(()=>{\n' + js + '\n})();\n</script></body></html>\n')

def main(argv):
    teacher = '--teacher' in argv
    lite = '--no-lite' not in argv
    each = '--each' in argv
    out = os.path.join(build.ROOT, 'dist', 'print')
    if '--out' in argv:
        i = argv.index('--out'); out = os.path.abspath(argv[i + 1]); del argv[i:i + 2]
    ids = [a for a in argv if not a.startswith('--')]
    allids = ready_ids()
    for i in ids:
        if i not in allids: sys.exit('Нет готовой главы: ' + i)
    ids = ids or allids
    if teacher: out = os.path.join(out, 'teacher')
    build.check_js()
    jobs = [([i], i) for i in ids] if each else [(ids, '-'.join(ids) if len(ids) <= 3 else 'uchebnik')]
    for chosen, name in jobs:
        path = os.path.join(out, name + '.html')
        build.write(path, make(chosen, teacher, lite))
        print(os.path.relpath(path, build.ROOT), '(учитель, с ключами)' if teacher else '(ученик, без ключей)')

if __name__ == '__main__':
    main(sys.argv[1:])
