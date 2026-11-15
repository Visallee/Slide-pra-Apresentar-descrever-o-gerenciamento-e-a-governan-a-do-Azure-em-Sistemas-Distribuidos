/* ==========================================================
   Apresentação — Descrever o Gerenciamento e a Governança do Azure
   JavaScript puro, sem dependências externas (funciona offline).
   ========================================================== */

/* ----------------------------------------------------------
   1) Carregamento inteligente de imagens (fallback)
   ----------------------------------------------------------
   Se a imagem principal não existir, testa automaticamente variações
   de nome e extensão dentro da pasta ./modulo X imagens/ antes de
   mostrar um placeholder elegante.
   Exemplos testados: "imagem 1.png", "Imagem 1.png", "imagem01.png",
   "Imagem01.jpg", "1.png", "1.jpeg", ...
   Esta função precisa existir antes das imagens falharem, por isso
   o script é carregado no <head> (sem defer).
---------------------------------------------------------- */
(function () {
  var EXTENSOES = ['png', 'jpg', 'jpeg', 'webp', 'PNG', 'JPG', 'JPEG', 'WEBP'];

  function dois(n) { return (n < 10 ? '0' : '') + n; }

  function nomesImagem(n) {
    var a = String(n), b = dois(n);
    return [
      'imagem ' + a, 'Imagem ' + a, 'imagem' + a, 'Imagem' + a,
      'imagem ' + b, 'Imagem ' + b, 'imagem' + b, 'Imagem' + b,
      'imagem_' + a, 'imagem-' + a, 'Imagem_' + a, 'Imagem-' + a,
      a, b, 'img ' + a, 'img' + a, 'image ' + a, 'Image ' + a, 'image' + a
    ];
  }

  var NOMES_LOGO = [
    'logo ifs', 'Logo IFS', 'Logo ifs', 'logo IFS', 'logo-ifs', 'logo_ifs', 'logoifs',
    'LogoIFS', 'logo', 'Logo', 'ifs', 'IFS'
  ];

  function caminho(mod, nome, ext) {
    return './' + encodeURIComponent('modulo ' + mod + ' imagens').replace(/%2F/g, '/') + '/' +
      encodeURIComponent(nome) + '.' + ext;
  }

  function candidatos(img) {
    if (img.__cands) return img.__cands;
    var mod = img.getAttribute('data-mod') || '1';
    var lista = [];
    var nomes = img.hasAttribute('data-logo') ? NOMES_LOGO : nomesImagem(parseInt(img.getAttribute('data-n'), 10) || 1);
    nomes.forEach(function (nome) {
      EXTENSOES.forEach(function (ext) { lista.push(caminho(mod, nome, ext)); });
    });
    img.__cands = lista;
    img.__i = 0;
    return lista;
  }

  function placeholder(img) {
    var box = img.parentNode;
    var mod = img.getAttribute('data-mod') || '';
    var n = img.getAttribute('data-n') || '';
    var div = document.createElement('div');
    if (img.hasAttribute('data-logo')) {
      div.className = 'logo-ph';
      div.textContent = 'Logo IFS';
    } else {
      div.className = 'img-ph';
      div.innerHTML = '<strong>Imagem ' + n + ' — Módulo ' + mod + '</strong>' +
        '<small>Coloque o arquivo em “modulo ' + mod + ' imagens/”</small>';
    }
    box.replaceChild(div, img);
  }

  /* Chamada pelo atributo onerror="imgFallback(this)" de cada <img>. */
  window.imgFallback = function (img) {
    var lista = candidatos(img);
    var atual = decodeURIComponent((img.getAttribute('src') || '').split('/').pop());
    while (img.__i < lista.length) {
      var prox = lista[img.__i++];
      if (decodeURIComponent(prox.split('/').pop()) === atual) continue; /* já falhou */
      img.src = prox;
      return;
    }
    img.onerror = null;
    placeholder(img);
  };
})();

/* ----------------------------------------------------------
   2) Motor de slides: escala 16:9, navegação, sumário clicável
---------------------------------------------------------- */
(function () {
  var slides = [];
  var atual = 0;
  var TITULO_RODAPE = 'Descrever o gerenciamento e a governança do Azure';

  function dois(n) { return (n < 10 ? '0' : '') + n; }

  /* Escala automática 1280×720 → qualquer janela, sem distorcer */
  function escalar() {
    var s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
    document.documentElement.style.setProperty('--escala', s);
  }

  /* Cabeçalho e rodapé (com numeração) em todos os slides, exceto a capa */
  function montarMoldura() {
    var total = slides.length;
    slides.forEach(function (sl, i) {
      if (sl.classList.contains('capa')) return;
      var tag = sl.getAttribute('data-cap') || '';
      var h = document.createElement('div');
      h.className = 's-header';
      h.innerHTML = '<span class="inst"><img src="./modulo 1 imagens/IF.png" alt="" onerror="this.style.display=\'none\'">IFS · Campus Lagarto · Sistemas Distribuídos</span>' +
        (tag ? '<span class="cap-tag">' + tag + '</span>' : '');
      sl.insertBefore(h, sl.firstChild);
      var f = document.createElement('div');
      f.className = 's-footer';
      f.innerHTML = '<span>' + TITULO_RODAPE + '</span><span class="pn">' + dois(i + 1) + ' / ' + total + '</span>';
      sl.appendChild(f);
    });
  }

  /* Itens do sumário: preenche "Pág. NN" e torna clicável */
  function montarSumario() {
    var mapa = {};
    slides.forEach(function (sl, i) { if (sl.id) mapa[sl.id] = i; });
    document.querySelectorAll('[data-goto]').forEach(function (el) {
      var alvo = mapa[el.getAttribute('data-goto')];
      if (alvo === undefined) return;
      var p = el.querySelector('.p, .cap-p');
      if (p) p.textContent = 'Pág. ' + dois(alvo + 1);
      el.setAttribute('role', 'link');
      el.setAttribute('tabindex', '0');
      el.addEventListener('click', function () { ir(alvo); });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); ir(alvo); }
      });
    });
  }

  function ir(i) {
    if (i < 0) i = 0;
    if (i > slides.length - 1) i = slides.length - 1;
    slides[atual].classList.remove('ativo');
    atual = i;
    slides[atual].classList.add('ativo');
    var barra = document.getElementById('barra');
    if (barra) barra.style.width = (slides.length > 1 ? (atual / (slides.length - 1)) * 100 : 100) + '%';
    try { history.replaceState(null, '', '#' + (atual + 1)); } catch (err) { /* file:// em alguns navegadores */ }
  }

  function tela() {
    var el = document.documentElement;
    if (!document.fullscreenElement) { if (el.requestFullscreen) el.requestFullscreen(); }
    else if (document.exitFullscreen) document.exitFullscreen();
  }

  function teclas(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) { e.preventDefault(); ir(atual + 1); }
    else if (k === 'ArrowLeft' || k === 'PageUp' || (k === ' ' && e.shiftKey)) { e.preventDefault(); ir(atual - 1); }
    else if (k === 'Home') { e.preventDefault(); ir(0); }
    else if (k === 'End') { e.preventDefault(); ir(slides.length - 1); }
    else if (k === 'f' || k === 'F') { tela(); }
  }

  function iniciar() {
    slides = Array.prototype.slice.call(document.querySelectorAll('#deck > .slide'));
    montarMoldura();
    montarSumario();
    escalar();
    window.addEventListener('resize', escalar);
    document.addEventListener('keydown', teclas);
    /* Clique: metade esquerda da tela volta, metade direita avança */
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-goto], a, input, textarea, select')) return;
      if (window.getSelection && String(window.getSelection())) return; /* não atrapalha seleção de texto */
      ir(e.clientX < window.innerWidth / 2 ? atual - 1 : atual + 1);
    });

    var inicio = parseInt((location.hash || '').replace('#', ''), 10);
    atual = 0;
    slides[0].classList.add('ativo');
    ir(isNaN(inicio) ? 0 : inicio - 1);

    /* Imagens que já falharam antes deste script rodar */
    document.querySelectorAll('img[onerror]').forEach(function (img) {
      if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) window.imgFallback(img);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
