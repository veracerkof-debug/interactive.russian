// ---------- печать из приложения (Ctrl+P / «Печать») ----------
// Закрытые блоки («Проще», «Тонкости», образцы) перед печатью раскрываем, после — возвращаем как было.
// Чистая вёрстка — @media print в src/css/print.css; книга целиком — tools/print.py.
let PR_OPEN=null;
window.addEventListener('beforeprint',()=>{PR_OPEN=[...document.querySelectorAll('details')].filter(d=>!d.open);PR_OPEN.forEach(d=>d.open=true)});
window.addEventListener('afterprint',()=>{if(PR_OPEN)PR_OPEN.forEach(d=>d.open=false);PR_OPEN=null});
