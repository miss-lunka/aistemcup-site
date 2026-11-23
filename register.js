// Адрес веб-приложения Google Apps Script (см. backend/README.md). Пока пусто, заявки не отправляются.
const ENDPOINT = 'https://script.google.com/macros/s/AKfycbyvxiUvmp9-L_q3htuB-EnyzA8IxYPxduRHPBkkuwm1s7Sa9GbkSRrfK9YH8FNIhvfD/exec';

(function () {
  const f = document.getElementById('reg');
  if (!f) return;
  const lang = () => document.documentElement.lang === 'ru' ? 'ru' : 'kk';
  const M = {
    kk: {
      req: 'Осы өрісті толтырыңыз', choose: 'Біреуін таңдаңыз', iin: 'ЖСН 12 саннан тұрады', iinbad: 'ЖСН қате енгізілген, тексеріңіз',
      iindup: 'Бұл ЖСН өтінімде екі рет көрсетілген', phone: 'Нөмірді +7 7XX XXX XX XX түрінде енгізіңіз', email: 'Поштаны дұрыс енгізіңіз',
      url: 'Толық сілтеме енгізіңіз (https://…)', cons: 'Үш келісімді де белгілеңіз', sum: 'Белгіленген өрістерді түзетіңіз.',
      net: 'Өтінім жіберілмеді. Интернетті тексеріп, қайта көріңіз.', off: 'Өтінім қабылдау әлі қосылмаған. Кейінірек көріңіз.', send: 'Жіберілуде…'
    },
    ru: {
      req: 'Заполните это поле', choose: 'Выберите вариант', iin: 'ИИН состоит из 12 цифр', iinbad: 'ИИН введён с ошибкой, проверьте',
      iindup: 'Этот ИИН указан в заявке дважды', phone: 'Введите номер в виде +7 7XX XXX XX XX', email: 'Проверьте адрес почты',
      url: 'Введите полную ссылку (https://…)', cons: 'Отметьте все три согласия', sum: 'Исправьте отмеченные поля.',
      net: 'Заявка не отправилась. Проверьте интернет и попробуйте ещё раз.', off: 'Приём заявок ещё не подключён. Попробуйте позже.', send: 'Отправляем…'
    }
  };
  const t = k => M[lang()][k];

  // Контрольная цифра ИИН (алгоритм РК: веса 1..11, при остатке 10 — веса 3..11,1,2)
  function iinOk(s) {
    if (!/^\d{12}$/.test(s)) return false;
    const d = s.split('').map(Number);
    const w1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], w2 = [3, 4, 5, 6, 7, 8, 9, 10, 11, 1, 2];
    let c = w1.reduce((a, w, i) => a + w * d[i], 0) % 11;
    if (c === 10) { c = w2.reduce((a, w, i) => a + w * d[i], 0) % 11; if (c === 10) return false; }
    const mm = +s.slice(2, 4), dd = +s.slice(4, 6);
    return c === d[11] && mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31;
  }
  const urlOk = v => /^https?:\/\/[^\s.]+\.[^\s]{2,}/i.test(v);
  const digits = v => v.replace(/\D/g, '');
  function normPhone(v) {
    let x = digits(v);
    if (x.length === 11 && (x[0] === '8' || x[0] === '7')) x = x.slice(1);
    return x.length === 10 && x[0] === '7' ? x : null;
  }
  function fmtPhone(x) { return '+7 ' + x.slice(0, 3) + ' ' + x.slice(3, 6) + ' ' + x.slice(6, 8) + ' ' + x.slice(8); }

  // Маска ввода
  f.querySelectorAll("[data-v='iin']").forEach(i => i.addEventListener('input', () => { i.value = digits(i.value).slice(0, 12); }));
  f.querySelectorAll("[data-v='phone']").forEach(i => i.addEventListener('blur', () => { const p = normPhone(i.value); if (p) i.value = fmtPhone(p); }));

  // Второй ученик
  const s2 = document.getElementById('stu2'), add = document.getElementById('add2wrap');
  function setS2(on) {
    s2.hidden = !on; s2.disabled = !on; add.hidden = on;
    document.getElementById('bnm').textContent = on ? 6 : 5;
    document.getElementById('bnc').textContent = on ? 7 : 6;
    if (on) s2.querySelector('input').focus();
  }
  document.getElementById('add2').onclick = () => setS2(true);
  document.getElementById('rm2').onclick = () => { s2.querySelectorAll('input,select').forEach(e => { e.value = ''; clr(e); }); setS2(false); };

  function box(el) { return el.closest('.fld') || el.closest('.cons'); }
  function setErr(el, msg) { const b = box(el); if (!b) return; b.classList.add('bad'); const e = b.querySelector('.err'); if (e) e.textContent = msg; el.setAttribute && el.setAttribute('aria-invalid', 'true'); }
  function clr(el) { const b = box(el); if (!b) return; b.classList.remove('bad'); const e = b.querySelector('.err'); if (e) e.textContent = ''; el.removeAttribute && el.removeAttribute('aria-invalid'); }

  function check(el) {
    if (el.disabled || el.closest('fieldset[disabled]')) return true;
    const v = el.value.trim(), kind = el.dataset.v;
    if (el.type === 'checkbox' || el.type === 'radio') return true;
    if (el.required && !v) { setErr(el, el.tagName === 'SELECT' ? t('choose') : t('req')); return false; }
    if (v && kind === 'iin') { if (v.length !== 12) { setErr(el, t('iin')); return false; } if (!iinOk(v)) { setErr(el, t('iinbad')); return false; } }
    if (v && kind === 'phone' && !normPhone(v)) { setErr(el, t('phone')); return false; }
    if (v && kind === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { setErr(el, t('email')); return false; }
    if (v && kind === 'url' && !urlOk(v)) { setErr(el, t('url')); return false; }
    if (v && kind === 'urls' && !v.split(/\s+/).filter(Boolean).every(urlOk)) { setErr(el, t('url')); return false; }
    clr(el); return true;
  }
  f.addEventListener('focusout', e => { if (e.target.matches('input,select,textarea') && e.target.value) check(e.target); });
  f.addEventListener('input', e => { if (box(e.target) && box(e.target).classList.contains('bad')) check(e.target); });
  f.addEventListener('change', e => {
    if (e.target.type === 'radio') { const fs = e.target.closest('.rg'); fs.classList.remove('bad'); fs.querySelector('.err').textContent = ''; }
    if (e.target.type === 'checkbox') { document.querySelector('.cons').classList.remove('bad'); document.getElementById('cerr').textContent = ''; }
  });

  function validate() {
    let first = null;
    const mark = el => { if (!first) first = el; };
    f.querySelectorAll('input:not([type=radio]):not([type=checkbox]):not([name=website]),select,textarea').forEach(el => { if (!check(el)) mark(el); });
    f.querySelectorAll('.rg').forEach(fs => {
      if (!fs.querySelector('input:checked')) { fs.classList.add('bad'); fs.querySelector('.err').textContent = t('choose'); mark(fs.querySelector('input')); }
    });
    const iins = [...f.querySelectorAll("[data-v='iin']")].filter(i => !i.closest('fieldset[disabled]') && i.value.length === 12);
    iins.forEach((a, i) => iins.slice(i + 1).forEach(b => { if (a.value === b.value) { setErr(b, t('iindup')); mark(b); } }));
    const cb = [...f.querySelectorAll('.cons input[type=checkbox]')];
    if (cb.some(c => !c.checked)) { document.querySelector('.cons').classList.add('bad'); document.getElementById('cerr').textContent = t('cons'); mark(cb.find(c => !c.checked)); }
    return first;
  }

  const ferr = document.getElementById('ferr'), sub = document.getElementById('sub');
  if (!ENDPOINT) document.getElementById('offnote').hidden = false;
  function showTop(msg) { ferr.textContent = msg; ferr.hidden = false; }

  f.addEventListener('submit', async e => {
    e.preventDefault();
    ferr.hidden = true;
    const bad = validate();
    if (bad) { showTop(t('sum')); bad.focus(); bad.scrollIntoView({ block: 'center' }); return; }
    if (!ENDPOINT) { const o = document.getElementById('offnote'); o.scrollIntoView({ block: 'center' }); o.classList.remove('pulse'); void o.offsetWidth; o.classList.add('pulse'); return; }
    const data = {};
    new FormData(f).forEach((v, k) => { data[k] = String(v).trim(); });
    f.querySelectorAll("[data-v='phone']").forEach(i => { if (data[i.name]) data[i.name] = fmtPhone(normPhone(data[i.name])); });
    data.has2 = s2.disabled ? 'нет' : 'да';
    data.lang = lang();
    const label = sub.innerHTML;
    sub.disabled = true; sub.textContent = t('send');
    try {
      const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || 'fail');
      document.getElementById('appid').textContent = j.id;
      showDone(data);
      f.hidden = true;
      const d = document.getElementById('done'); d.hidden = false; d.focus(); d.scrollIntoView({ block: 'start' });
    } catch (err) {
      showTop(t('net')); ferr.scrollIntoView({ block: 'center' });
    } finally {
      sub.disabled = false; sub.innerHTML = label;
    }
  });

  // Предупреждение при уходе со страницы с несохранённой формой
  let dirty = false;
  f.addEventListener('input', () => { dirty = true; });
  window.addEventListener('beforeunload', e => { if (dirty && !f.hidden) { e.preventDefault(); e.returnValue = ''; } });

  function showDone(d) {
    const kk = lang() === 'kk';
    const rows = [
      [kk ? 'Команда' : 'Команда', d.team],
      [kk ? 'Бағыт' : 'Направление', f.querySelector('[name=dir]:checked').closest('.opt').querySelector(kk ? '.k' : '.r').textContent],
      [kk ? 'Мектеп' : 'Школа', d.school + ', ' + d.city],
      [kk ? 'Педагог' : 'Педагог', d.t_name],
      [kk ? 'Оқушылар' : 'Ученики', [d.s1_name, d.s2_name].filter(Boolean).join(', ')]
    ];
    const dl = document.getElementById('dsum'); dl.textContent = '';
    rows.forEach(([k, v]) => { const dt = document.createElement('dt'); dt.textContent = k; const dd = document.createElement('dd'); dd.textContent = v; dl.append(dt, dd); });
    document.querySelector('.rwrap').classList.add('isdone');
    dirty = false;
  }
  document.getElementById('cpy').onclick = async e => {
    const b = e.currentTarget, id = document.getElementById('appid').textContent;
    try { await navigator.clipboard.writeText(id); b.classList.add('ok'); setTimeout(() => b.classList.remove('ok'), 1800); } catch (_) {}
  };

  window.onLang = () => { f.querySelectorAll('.bad').forEach(b => { const el = b.querySelector('input,select,textarea'); if (el && !b.classList.contains('rg') && !b.classList.contains('cons')) check(el); }); };
})();
