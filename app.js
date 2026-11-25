/* Orientações Monitores · Rua do Lazer — interações */

/* >>> Link do Microsoft Forms (Confirmação de ciência). Cole o link de compartilhamento entre as aspas. <<< */
const FORMS_URL = 'https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=rpNU8pgc10GKMwvnX1_mA0btzhzJXDREtYuhuTDUKNdUQU9TVkY4WDVITjBHUkZRQjlRWVMzUVk4Wi4u';

(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const slides = $$('.slide');
  const total = slides.length;
  let current = 0;

  /* ---------- atraso escalonado das animações ---------- */
  slides.forEach(s => $$('.reveal', s).forEach((el, i) => el.style.setProperty('--i', i)));

  /* ---------- sumário ---------- */
  const tocList = $('#tocList');
  slides.forEach((s, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<button><span>${String(i + 1).padStart(2, '0')}</span>${s.dataset.title}</button>`;
    li.firstChild.addEventListener('click', () => { go(i); toggleToc(false); });
    tocList.appendChild(li);
  });

  function go(i) {
    i = Math.max(0, Math.min(total - 1, i));
    slides.forEach((s, k) => {
      s.classList.toggle('is-active', k === i);
      s.classList.toggle('is-prev', k < i);
      s.setAttribute('aria-hidden', k === i ? 'false' : 'true');
      if (k === i) { s.inert = false; } else { s.inert = true; }
    });
    // reinicia animações ao voltar a um slide
    if (i !== current) {
      const s = slides[i];
      s.classList.remove('is-active'); void s.offsetWidth; s.classList.add('is-active');
      const inner = $('.slide-inner', s); if (inner) inner.scrollTop = 0;
    }
    current = i;
    $('#counter').textContent = `${i + 1} / ${total}`;
    $('#progressBar').style.width = `${((i + 1) / total) * 100}%`;
    $$('#tocList button').forEach((d, k) => d.classList.toggle('on', k === i));
    $('#prev').disabled = i === 0;
    $('#next').disabled = i === total - 1;
  }
  const next = () => go(current + 1);
  const prev = () => go(current - 1);
  $('#next').addEventListener('click', next);
  $('#prev').addEventListener('click', prev);
  $$('[data-next]').forEach(b => b.addEventListener('click', next));
  $$('[data-go]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); go(+b.dataset.go); }));

  // ao recarregar a página, sempre começa na capa (limpa qualquer #/n antigo do endereço)
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);

  /* ---------- teclado ---------- */
  document.addEventListener('keydown', e => {
    if ($('#lightbox').classList.contains('open')) {
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowRight') lbStep(1);
      if (e.key === 'ArrowLeft') lbStep(-1);
      return;
    }
    if (e.key === 'Escape') toggleToc(false);
    if (e.target.closest('input,textarea')) return;
    if (['ArrowRight', 'PageDown'].includes(e.key) || (e.key === ' ' && !e.target.closest('button'))) { e.preventDefault(); next(); }
    if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); prev(); }
    if (e.key === 'Home') go(0);
    if (e.key === 'End') go(total - 1);
    if (e.key.toLowerCase() === 'f') toggleFull();
    if (e.key.toLowerCase() === 'm') toggleToc();
  });

  /* ---------- gesto de deslizar (mobile) ---------- */
  let sx = 0, sy = 0, st = 0;
  const deck = $('#deck');
  deck.addEventListener('touchstart', e => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; st = Date.now(); }, { passive: true });
  deck.addEventListener('touchend', e => {
    const t = e.changedTouches[0]; const dx = t.clientX - sx; const dy = t.clientY - sy;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && Date.now() - st < 700) dx < 0 ? next() : prev();
  }, { passive: true });

  /* ---------- tela cheia ---------- */
  const fullBtn = $('#btnFull');
  const canFull = document.fullscreenEnabled || document.webkitFullscreenEnabled;
  if (!canFull) fullBtn.hidden = true;
  function toggleFull() {
    if (!canFull) return;
    const isFull = document.fullscreenElement || document.webkitFullscreenElement;
    if (isFull) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen).call(document.documentElement);
  }
  fullBtn.addEventListener('click', toggleFull);
  const onFull = () => {
    const on = !!(document.fullscreenElement || document.webkitFullscreenElement);
    $('use', fullBtn).setAttribute('href', on ? '#i-min' : '#i-max');
    fullBtn.title = on ? 'Sair da tela cheia (F)' : 'Tela cheia (F)';
  };
  document.addEventListener('fullscreenchange', onFull);
  document.addEventListener('webkitfullscreenchange', onFull);

  /* ---------- sumário ---------- */
  const toc = $('#toc');
  function toggleToc(force) {
    const open = force ?? !toc.classList.contains('open');
    toc.classList.toggle('open', open);
    toc.setAttribute('aria-hidden', String(!open));
  }
  $('#btnToc').addEventListener('click', () => toggleToc());
  toc.addEventListener('click', e => { if (e.target === toc || e.target.closest('[data-close]')) toggleToc(false); });

  /* ---------- toast ---------- */
  let toastT;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /* ---------- lightbox ---------- */
  const lb = $('#lightbox');
  let lbList = [], lbIdx = 0;
  const imgOf = el => (el.getAttribute('style').match(/url\(([^)]+)\)/) || [])[1];
  $$('.photo').forEach(p => p.addEventListener('click', () => {
    const g = p.dataset.gallery;
    lbList = g ? $$(`.photo[data-gallery="${g}"]`) : [p];
    lbIdx = lbList.indexOf(p);
    showLb();
    lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
  }));
  function showLb() {
    const p = lbList[lbIdx];
    $('#lbImg').src = imgOf(p);
    $('#lbImg').alt = p.dataset.caption || '';
    $('#lbCap').textContent = (p.dataset.caption || '') + (lbList.length > 1 ? `  ·  ${lbIdx + 1}/${lbList.length}` : '');
    $$('.lb-nav', lb).forEach(b => b.hidden = lbList.length < 2);
  }
  function lbStep(d) { if (lbList.length < 2) return; lbIdx = (lbIdx + d + lbList.length) % lbList.length; showLb(); }
  function closeLb() { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); }
  $('.lb-prev').addEventListener('click', () => lbStep(-1));
  $('.lb-next').addEventListener('click', () => lbStep(1));
  lb.addEventListener('click', e => { if (e.target === lb || e.target.closest('[data-close]')) closeLb(); });

  /* ---------- cartões alternáveis ---------- */
  $$('[data-toggle]').forEach(c => c.addEventListener('click', () => c.classList.toggle('is-on')));

  /* ---------- checklists com contador ---------- */
  $$('[data-checklist]').forEach(list => {
    const items = $$('[data-check]', list);
    const scope = list.closest('.slide');
    const count = $('[data-count]', list) || $('[data-count]', scope);
    const meter = $('[data-meter]', scope);
    const done = list.querySelector('.done-msg') ? list : (count && count.closest('.meter, p'));
    const update = () => {
      const n = items.filter(i => i.classList.contains('is-on')).length;
      if (count) count.textContent = n;
      if (meter) meter.style.width = `${(n / items.length) * 100}%`;
      const complete = n === items.length;
      if (done) done.classList.toggle('is-complete', complete);
      return complete;
    };
    items.forEach(i => i.addEventListener('click', () => {
      i.classList.toggle('is-on');
      if (update() && i.classList.contains('is-on')) toast('Muito bem! Tudo conferido ✓');
    }));
  });

  /* ---------- jogo da vestimenta ---------- */
  $$('[data-game="dress"]').forEach(g => {
    const chips = $$('.chip', g); const score = $('[data-score]', g);
    chips.forEach(c => c.addEventListener('click', () => {
      if (c.classList.contains('ok') || c.classList.contains('no')) return;
      c.classList.add(c.dataset.ok === '1' ? 'ok' : 'no', 'pop');
      const n = chips.filter(x => x.classList.contains('ok') || x.classList.contains('no')).length;
      score.textContent = `${n}/${chips.length}`;
      toast(c.dataset.ok === '1' ? `${c.textContent.replace(/^[✓✕] /, '')}: pode usar ✓` : `${c.textContent}: não é permitido ✕`);
      if (n === chips.length) setTimeout(() => toast('Você já sabe como se vestir para a Rua do Lazer!'), 1400);
    }));
  });

  /* ---------- celular: repetir mensagens ---------- */
  $$('[data-replay] .replay').forEach(b => b.addEventListener('click', () => {
    $$('.bubble', b.closest('.phone')).forEach(x => { x.style.animation = 'none'; void x.offsetWidth; x.style.animation = ''; });
  }));

  /* ---------- etapas em sequência ---------- */
  $$('[data-steps]').forEach(wrap => {
    const steps = $$('.step', wrap);
    const msg = $('[data-steps-msg]', wrap.closest('.slide'));
    const labels = ['Chave retirada!', 'Materiais conferidos!', 'Equipamentos organizados!', 'Espaço preparado — tudo pronto até 13h30!'];
    steps.forEach((s, i) => s.addEventListener('click', () => {
      const doneCount = steps.filter(x => x.classList.contains('is-done')).length;
      if (s.classList.contains('is-done')) { steps.slice(i).forEach(x => x.classList.remove('is-done')); msg.textContent = `Etapa ${i + 1} desmarcada.`; msg.className = 'steps-msg'; return; }
      if (i !== doneCount) {
        s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake');
        msg.textContent = `Ops! Antes, conclua a etapa ${doneCount + 1}.`; msg.className = 'steps-msg bad'; return;
      }
      s.classList.add('is-done');
      msg.textContent = `✓ ${labels[i]}`; msg.className = 'steps-msg ok';
    }));
  });

  /* ---------- clima ---------- */
  $$('[data-weather]').forEach(b => b.addEventListener('click', () => {
    const slide = b.closest('.slide');
    $$('[data-weather]', slide).forEach(x => x.classList.toggle('is-on', x === b));
    slide.classList.toggle('is-raining', b.dataset.weather === 'rain');
  }));

  /* ---------- cenários de ocorrência ---------- */
  $$('.scenario').forEach(sc => {
    const slide = sc.closest('.slide');
    const levels = $('.levels', slide); const cards = $$('.level', levels);
    const chips = $$('.chip', sc);
    // etiqueta dentro do box mostrando a situação escolhida
    cards.forEach(card => { const t = document.createElement('span'); t.className = 'level-tag'; card.appendChild(t); });
    // destaca o box ligado à situação (null = nenhum)
    const show = chip => {
      cards.forEach(x => x.classList.remove('is-focus'));
      levels.classList.toggle('has-focus', !!chip);
      if (!chip) return;
      const card = cards[+chip.dataset.target];
      card.classList.add('is-focus');
      $('.level-tag', card).textContent = `👉 ${chip.textContent}`;
    };
    const locked = () => chips.find(x => x.classList.contains('is-on'));
    chips.forEach(c => {
      // ao passar o mouse: prévia do destaque
      c.addEventListener('mouseenter', () => show(c));
      c.addEventListener('mouseleave', () => show(locked()));
      // ao clicar/tocar: fixa (ou solta) o destaque
      c.addEventListener('click', () => {
        const on = !c.classList.contains('is-on');
        chips.forEach(x => x.classList.remove('is-on'));
        if (on) c.classList.add('is-on');
        show(on ? c : null);
      });
    });
  });

  /* ---------- simulador de intervalos ---------- */
  $$('[data-sim]').forEach(sim => {
    const people = $$('[data-person]', sim); const status = $('[data-sim-status]', sim);
    const render = () => {
      const out = people.filter(p => p.classList.contains('is-out')).length;
      people.forEach(p => $('[data-state]', p).textContent = p.classList.contains('is-out') ? 'Em intervalo' : 'No atendimento');
      const [cls, icon, txt] = out === 0 ? ['ok', 'i-check', 'Atendimento completo.']
        : out === 1 ? ['ok', 'i-coffee', 'Intervalo alternado: alguém continua no atendimento.']
        : ['bad', 'i-alert', 'Atenção: os dois monitores não devem sair juntos!'];
      status.className = `sim-status ${cls}`;
      status.innerHTML = `<svg><use href="#${icon}"/></svg><span>${txt}</span>`;
    };
    people.forEach(p => p.addEventListener('click', () => { p.classList.toggle('is-out'); render(); }));
  });

  /* ---------- quiz ---------- */
  const QUIZ = [
    { q: 'Até que horas os brinquedos devem estar montados e prontos?', o: ['13h00', '13h30', '14h00', '17h30'], a: 1, e: 'Os brinquedos ficam prontos às 13h30; o encerramento é às 17h30.' },
    { q: 'Qual destes itens NÃO é permitido na vestimenta?', o: ['Camiseta preta', 'Tênis fechado', 'Crocs', 'Colete da AV'], a: 2, e: 'Jeans, sandália, crocs e chinelo não são permitidos.' },
    { q: 'Está chovendo. O que fazer?', o: ['Montar os brinquedos mesmo assim', 'Usar o Espaço Kids com atividades recreativas', 'Fazer artes e trabalhos manuais', 'Cancelar o atendimento'], a: 1, e: 'Na chuva: Espaço Kids, jogos, dinâmicas, mímicas e desafios. Artes e trabalhos manuais são de outra empresa.' },
    { q: 'Antes de liberar o brinquedo inflável, você deve…', o: ['Liberar logo para as crianças', 'Solicitar a higienização pela guarita', 'Esperar o encerramento', 'Usar o celular para avisar os pais'], a: 1, e: 'Solicitar a higienização, acionar a equipe pela guarita e liberar somente após a limpeza.' },
    { q: 'Até quando o planejamento deve ser enviado à Recriar?', o: ['Segunda-feira', 'Quarta-feira', 'Sexta-feira', 'No próprio dia'], a: 1, e: 'Atividades e lista de materiais vão para a Recriar até quarta-feira.' },
    { q: 'Sobre os intervalos, qual é a regra principal?', o: ['Os dois saem juntos para agilizar', 'Sair sem avisar', 'Alternar: sempre manter alguém no atendimento', 'Não existe intervalo'], a: 2, e: 'Os intervalos são alternados e combinados; os dois monitores nunca saem juntos.' },
  ];
  $$('[data-quiz]').forEach(qz => {
    let idx = 0, right = 0; const res = [];
    const dotsEl = $('[data-q-dots]', qz);
    const render = () => {
      qz.classList.remove('is-over'); $('[data-q-end]', qz).hidden = true;
      const it = QUIZ[idx];
      $('[data-q-count]', qz).textContent = `Pergunta ${idx + 1} de ${QUIZ.length}`;
      dotsEl.innerHTML = QUIZ.map((_, k) => `<i class="${res[k] === true ? 'ok' : res[k] === false ? 'no' : k === idx ? 'cur' : ''}"></i>`).join('');
      $('[data-q-text]', qz).textContent = it.q;
      const opts = $('[data-q-opts]', qz); opts.innerHTML = '';
      it.o.forEach((t, k) => {
        const b = document.createElement('button'); b.className = 'opt'; b.textContent = t;
        b.addEventListener('click', () => answer(k, b)); opts.appendChild(b);
      });
      const fb = $('[data-q-fb]', qz); fb.textContent = ''; fb.className = 'quiz-fb';
      $('[data-q-next]', qz).hidden = true;
    };
    const answer = (k, b) => {
      const it = QUIZ[idx]; const ok = k === it.a; res[idx] = ok; if (ok) right++;
      $$('.opt', qz).forEach((x, j) => { x.disabled = true; if (j === it.a) x.classList.add('ok'); });
      if (!ok) b.classList.add('no');
      const fb = $('[data-q-fb]', qz); fb.className = `quiz-fb ${ok ? 'ok' : 'no'}`;
      fb.textContent = (ok ? '✓ Correto! ' : '✕ Não é bem assim. ') + it.e;
      dotsEl.children[idx].className = ok ? 'ok' : 'no';
      const nb = $('[data-q-next]', qz); nb.hidden = false;
      nb.firstChild.textContent = idx === QUIZ.length - 1 ? 'Ver resultado ' : 'Próxima ';
    };
    $('[data-q-next]', qz).addEventListener('click', () => {
      if (idx < QUIZ.length - 1) { idx++; render(); return; }
      qz.classList.add('is-over'); $('[data-q-end]', qz).hidden = false;
      $('[data-q-score]', qz).textContent = `${right} de ${QUIZ.length} acertos`;
      $('[data-q-msg]', qz).textContent = right === QUIZ.length ? 'Perfeito! Você está pronto para a Rua do Lazer.' : right >= 4 ? 'Muito bom! Revise os pontos que faltaram.' : 'Vale revisar os slides e tentar de novo.';
    });
    $('[data-q-restart]', qz).addEventListener('click', () => { idx = 0; right = 0; res.length = 0; render(); });
    render();
  });

  /* ---------- PDF ---------- */
  const loadScript = src => new Promise((ok, fail) => {
    if ($(`script[src="${src}"]`)) return ok();
    const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = fail; document.head.appendChild(s);
  });
  const preload = src => new Promise(ok => { const i = new Image(); i.onload = i.onerror = ok; i.src = src; });

  /* ---------- formulário de confirmação (Microsoft Forms) ---------- */
  $$('[data-form]').forEach(card => {
    const link = $('[data-form-link]', card), qr = $('[data-form-qr]', card), status = $('[data-form-status]', card);
    if (!FORMS_URL) {
      link.classList.add('is-disabled'); link.removeAttribute('href');
      qr.innerHTML = '<span class="qr-empty">QR code aparece quando o formulário for configurado</span>';
      status.textContent = 'Formulário em configuração.';
      return;
    }
    link.href = FORMS_URL;
    status.textContent = 'Abre em uma nova aba. Responda individualmente.';
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js')
      .then(() => new window.QRCode(qr, { text: FORMS_URL, width: 256, height: 256, correctLevel: window.QRCode.CorrectLevel.M }))
      .catch(() => { qr.innerHTML = '<span class="qr-empty">Use o botão abaixo</span>'; });
  });


  // html2canvas não resolve <use href="#…">: copia o desenho do ícone para dentro do <svg>
  function inlineIcons(root) {
    $$('svg use', root).forEach(u => {
      const sym = document.getElementById((u.getAttribute('href') || '').slice(1));
      const svg = u.closest('svg'); if (!sym || !svg) return;
      const st = getComputedStyle(svg);
      const r = svg.getBoundingClientRect();
      svg.setAttribute('viewBox', sym.getAttribute('viewBox'));
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svg.setAttribute('width', r.width || 16); svg.setAttribute('height', r.height || 16);
      svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', st.color);
      svg.setAttribute('stroke-width', parseFloat(st.strokeWidth) || 2);
      svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
      svg.innerHTML = sym.innerHTML;
    });
  }

  async function exportPdf() {
    const busy = $('#busy'); const bar = $('#busyBar'); const txt = $('#busyText');
    busy.classList.add('open'); bar.style.width = '0'; txt.textContent = 'Preparando PDF…';
    const stage = document.createElement('div'); stage.className = 'pdf-stage';
    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      await Promise.all([...new Set($$('.photo').map(imgOf))].map(preload));
      if (document.fonts) await document.fonts.ready;
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: [960, 540], compress: true });
      document.body.insertBefore(stage, busy);
      for (let i = 0; i < total; i++) {
        txt.textContent = `Gerando PDF… slide ${i + 1} de ${total}`;
        const c = slides[i].cloneNode(true);
        c.classList.add('is-active', 'export'); c.classList.remove('is-prev');
        c.removeAttribute('aria-hidden'); c.inert = false;
        c.dataset.foot = `Orientações Monitores · Associação Volvo · Rua do Lazer          ${i + 1} / ${total}`;
        stage.innerHTML = ''; stage.appendChild(c);
        await new Promise(r => setTimeout(r, 80));
        inlineIcons(c);
        const canvas = await html2canvas(c, { scale: 1.6, useCORS: true, backgroundColor: '#F8F9F6', width: 1280, height: 720, windowWidth: 1280, windowHeight: 720, logging: false });
        if (i) pdf.addPage([960, 540], 'landscape');
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.88), 'JPEG', 0, 0, 960, 540);
        bar.style.width = `${((i + 1) / total) * 100}%`;
      }
      pdf.save('Orientacoes-Monitores-Rua-do-Lazer.pdf');
      toast('PDF baixado ✓');
    } catch (err) {
      console.error(err);
      toast('Não foi possível gerar o PDF. Abrindo a impressão…');
      setTimeout(() => window.print(), 800);
    } finally {
      stage.remove(); busy.classList.remove('open');
    }
  }
  $('#btnPdf').addEventListener('click', exportPdf);

  go(0);
})();
