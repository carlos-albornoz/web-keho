(function () {
  "use strict";

  var data = window.__BRAND__ || {};
  var contact = data.contact || { whatsapp: "584247006292", email: "contacto.keho@gmail.com" };
  var endpoints = data.endpoints || { chat: "asistente-ia.php", lead: "lead.php" };

  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var escHTML = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var waLink = function (text) { return "https://wa.me/" + contact.whatsapp + "?text=" + encodeURIComponent(text); };
  var fmt = function (n, dec) {
    return Number(n).toLocaleString("es-VE", { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 });
  };
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "]", e); } }

  /* ---------------- Nav ---------------- */
  function initNav() {
    var nav = $("[data-nav]");
    var burger = $("[data-burger]");
    var menu = $("[data-menu]");
    var onScroll = function () { nav.classList.toggle("is-scrolled", window.scrollY > 20); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    var close = function () { menu.classList.remove("is-open"); burger.setAttribute("aria-expanded", "false"); };
    burger.addEventListener("click", function () {
      var open = !menu.classList.contains("is-open");
      menu.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
    });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", close); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

    // Sección actual
    var links = $$('.nav-links a[href^="#"]');
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var a = map[e.target.id];
        if (!a) return;
        if (e.isIntersecting) { links.forEach(function (l) { l.classList.remove("is-current"); }); a.classList.add("is-current"); }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
  }

  /* ---------------- Reveals (fade-up) ---------------- */
  function initReveals() {
    var els = $$(".reveal");
    // Escalonado dentro de cada grupo
    var groups = [".svc-grid", ".steps", ".accordion", ".hero-inner", ".plans"];
    groups.forEach(function (g) {
      $$(g).forEach(function (wrap) {
        $$(".reveal", wrap).forEach(function (el, i) { el.style.setProperty("--d", (i * 0.09).toFixed(2) + "s"); });
      });
    });
    if (!("IntersectionObserver" in window)) { els.forEach(function (el) { el.classList.add("is-visible"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -4% 0px" });
    els.forEach(function (el) { io.observe(el); });
    setTimeout(function () {
      $$(".reveal:not(.is-visible)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-visible");
      });
    }, 6000);
  }

  /* ---------------- Hero: red de nodos IA ---------------- */
  function initNodes() {
    var canvas = $("[data-nodes]");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, nodes = [], running = false, raf = 0;
    var mouse = { x: -9999, y: -9999 };
    var COLORS = ["36,87,255", "24,182,255", "25,230,166"];

    function resize() {
      var r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.round(Math.min(110, Math.max(36, (w * h) / 15000)));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28 - 0.06,
          r: Math.random() * 1.6 + 0.6, c: COLORS[i % 3]
        });
      }
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      var max = w < 720 ? 110 : 150;
      for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        for (var j = i + 1; j < nodes.length; j++) {
          var b = nodes[j];
          var dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
          if (d < max * max) {
            var o = (1 - Math.sqrt(d) / max) * 0.32;
            ctx.strokeStyle = "rgba(" + a.c + "," + o.toFixed(3) + ")";
            ctx.lineWidth = 0.7;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        var mdx = a.x - mouse.x, mdy = a.y - mouse.y, md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < 180) {
          ctx.strokeStyle = "rgba(25,230,166," + ((1 - md / 180) * 0.5).toFixed(3) + ")";
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
        ctx.fillStyle = "rgba(" + a.c + ",0.9)";
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
      }
    }
    function step() {
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < -20) n.x = w + 20; if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20; if (n.y > h + 20) n.y = -20;
      }
      draw();
      if (running) raf = requestAnimationFrame(step);
    }
    resize();
    draw();
    var rt;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { resize(); draw(); }, 150); });
    if (reduced) return; // red estática, sin animación continua
    var hero = canvas.closest(".hero");
    hero.addEventListener("pointermove", function (e) {
      var r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    hero.addEventListener("pointerleave", function () { mouse.x = mouse.y = -9999; });
    new IntersectionObserver(function (en) {
      var vis = en[0].isIntersecting;
      if (vis && !running) { running = true; raf = requestAnimationFrame(step); }
      else if (!vis) { running = false; cancelAnimationFrame(raf); }
    }).observe(hero);
  }

  /* ---------------- Tarjetas de servicios ---------------- */
  function initServiceCards() {
    $$(".svc-card").forEach(function (card) {
      if (!fineHover) {
        card.addEventListener("click", function () {
          var on = !card.classList.contains("is-flipped");
          $$(".svc-card.is-flipped").forEach(function (c) { c.classList.remove("is-flipped"); });
          card.classList.toggle("is-flipped", on);
        });
      }
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); card.classList.toggle("is-flipped"); }
      });
      if (!fineHover) return;
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(900px) rotateX(" + (-py * 6).toFixed(2) + "deg) rotateY(" + (px * 7).toFixed(2) + "deg) translateY(-4px)";
      });
      card.addEventListener("mouseout", function (e) {
        if (!card.contains(e.relatedTarget)) card.style.transform = "";
      });
    });
  }

  /* ---------------- Botones magnéticos ---------------- */
  function initMagnetic() {
    if (!fineHover) return;
    $$("[data-magnetic]").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        el.style.transform = "translate(" + (x * 0.18).toFixed(1) + "px," + (y * 0.25).toFixed(1) + "px)";
      });
      el.addEventListener("mouseout", function (e) { if (!el.contains(e.relatedTarget)) el.style.transform = ""; });
    });
  }

  /* ---------------- Demos en vivo ---------------- */
  function initDemos() {
    var stage = $("[data-stage]");
    if (!stage) return;
    var tabs = $$("[data-demo]");
    var section = $("#demos");
    var visible = false;
    var current = "bot";
    var token = 0; // invalida bucles anteriores

    // ---- Bot de WhatsApp ----
    var body = $("[data-wa-body]");
    var badge = $("[data-wa-badge]");
    var status = $("[data-wa-status]");
    var WA = [
      ["in", "Hola 👋 quiero pedir para delivery"],
      ["out", "¡Hola! Soy el asistente de La Toscana 🍕 ¿Qué te provoca hoy?\n1️⃣ Ver menú · 2️⃣ Promos · 3️⃣ Mi pedido"],
      ["in", "1"],
      ["out", "🍕 Margarita $9 · Pepperoni $11 · 4 Quesos $12\n🥤 Refresco 2L $3\nEscribe tu pedido 👇"],
      ["in", "1 pepperoni grande y un refresco"],
      ["out", "Perfecto ✅\n• Pepperoni grande — $11\n• Refresco 2L — $3\n• Delivery — $2\nTotal: $16 · ¿A qué dirección lo enviamos?"],
      ["in", "Av. Las Américas, Res. Los Andes"],
      ["order", "🧾 Pedido #1048 confirmado\nLlega en 35 min 🛵\nPago: Pago Móvil o Zelle"]
    ];
    var clock = 14;
    function addMsg(kind, text) {
      var el = document.createElement("div");
      el.className = "wa-msg " + (kind === "in" ? "in" : "out") + (kind === "order" ? " order" : "");
      el.innerHTML = escHTML(text).replace(/\n/g, "<br>") + "<time>20:" + String(clock).padStart(2, "0") + "</time>";
      body.appendChild(el);
      while (body.children.length > 6) body.removeChild(body.firstElementChild);
    }
    async function runBot(t) {
      while (t === token) {
        body.innerHTML = ""; clock = 14;
        for (var i = 0; i < WA.length; i++) {
          if (t !== token) return;
          var m = WA[i];
          if (m[0] === "in") {
            await sleep(i === 0 ? 500 : 1300);
            if (t !== token) return;
            addMsg("in", m[1]);
          } else {
            status.textContent = "escribiendo…";
            var ty = document.createElement("div");
            ty.className = "wa-typing"; ty.innerHTML = "<i></i><i></i><i></i>";
            body.appendChild(ty);
            await sleep(1100);
            ty.remove();
            if (t !== token) return;
            status.textContent = "en línea · bot KEHO";
            clock++;
            addMsg(m[0], m[1]);
            badge.classList.add("is-on");
            setTimeout(function () { badge.classList.remove("is-on"); }, 1400);
          }
        }
        await sleep(4200);
      }
    }

    // ---- Inventario ----
    var rows = $$("[data-row]");
    var scanText = $("[data-scan-text]");
    var search = scanText ? scanText.parentNode : null;
    var toast = $("[data-toast]");
    var closeB = $("[data-close]");
    var salesEl = $("[data-sales]");
    var lowEl = $("[data-low]");
    var START = [86, 14, 120, 9, 41];
    var MAXQ = [120, 50, 132, 56, 75];
    function setQty(i, q) {
      var row = rows[i];
      $("[data-qty]", row).textContent = q;
      var bar = $(".bar", row);
      $(".bar i", row).style.setProperty("--w", Math.max(6, Math.round(q / MAXQ[i] * 100)) + "%");
      bar.classList.toggle("low", q < 10);
    }
    async function runInv(t) {
      while (t === token) {
        var q = START.slice(); var sales = 1284;
        q.forEach(function (v, i) { setQty(i, v); });
        salesEl.textContent = "$" + fmt(sales); lowEl.textContent = "2";
        toast.classList.remove("is-on"); closeB.classList.remove("is-on");
        var seq = [[0, 2, 3.2], [3, 1, 6.5], [2, 3, 2.8], [1, 1, 4.9], [3, 1, 6.5]];
        await sleep(700);
        for (var s = 0; s < seq.length; s++) {
          if (t !== token) return;
          var idx = seq[s][0], dec = seq[s][1], price = seq[s][2];
          var name = $("span", rows[idx]).textContent;
          search.classList.add("is-scanning");
          scanText.textContent = "Escaneando: " + name;
          await sleep(650);
          if (t !== token) return;
          rows[idx].classList.add("is-hit");
          q[idx] -= dec; setQty(idx, q[idx]);
          sales += dec * price; salesEl.textContent = "$" + fmt(sales);
          await sleep(650);
          rows[idx].classList.remove("is-hit"); search.classList.remove("is-scanning");
          if (idx === 3 && q[idx] < 9 && !toast.classList.contains("is-on")) { toast.classList.add("is-on"); lowEl.textContent = "3"; }
          scanText.textContent = "Escanear producto…";
          await sleep(350);
        }
        if (t !== token) return;
        closeB.classList.add("is-on");
        await sleep(3800);
      }
    }

    // ---- Dashboard ----
    var dash = $(".app-dash");
    function countUp(el) {
      var target = parseFloat(el.dataset.count), dec = parseInt(el.dataset.dec || "0", 10);
      var pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
      var t0 = performance.now(), dur = 1400;
      (function tick(now) {
        var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4);
        el.textContent = pre + fmt(target * e, dec) + suf;
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    }
    function runDash() {
      dash.classList.remove("is-play");
      void dash.offsetWidth;
      dash.classList.add("is-play");
      $$("[data-count]", dash).forEach(countUp);
    }

    // ---- Web como servicio ----
    var web = $(".app-web");
    var webSteps = web ? $$("[data-step]", web) : [];
    var webBar = $("[data-web-bar]");
    var webStatus = $("[data-web-status]");
    var STATUS = ["Diseñando…", "Escribiendo textos…", "Conectando pagos…", "Publicando…", "En línea ✓"];
    async function runWeb(t) {
      while (t === token) {
        web.classList.remove("s1", "s2", "s3", "s4");
        webSteps.forEach(function (li) { li.classList.remove("is-done"); });
        webBar.style.width = "0%"; webStatus.textContent = STATUS[0];
        await sleep(1300);
        for (var i = 1; i <= 4; i++) {
          if (t !== token) return;
          web.classList.add("s" + i);
          webSteps[i - 1].classList.add("is-done");
          webBar.style.width = (i * 25) + "%";
          webStatus.textContent = STATUS[i < 4 ? i : 4];
          await sleep(i < 4 ? 1500 : 4200);
        }
      }
    }

    function activate(name) {
      current = name;
      token++;
      stage.dataset.stage = name;
      tabs.forEach(function (b) {
        var on = b.dataset.demo === name;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", String(on));
      });
      if (!visible) return;
      var t = token;
      if (name === "bot") runBot(t);
      if (name === "inv") runInv(t);
      if (name === "dash") runDash();
      if (name === "web" && web) runWeb(t);
    }
    tabs.forEach(function (b) { b.addEventListener("click", function () { activate(b.dataset.demo); }); });
    new IntersectionObserver(function (en) {
      var v = en[0].isIntersecting;
      if (v && !visible) { visible = true; activate(current); }
      else if (!v && visible) { visible = false; token++; }
    }, { threshold: 0.05 }).observe(section);
  }

  /* ---------------- Carrusel de testimonios ---------------- */
  function initCarousel() {
    var root = $("[data-carousel]");
    if (!root) return;
    var track = $("[data-track]", root), cards = $$(".tcard", track), dotsWrap = $("[data-dots]", root);
    var idx = 0, timer = 0, paused = false;
    cards.forEach(function (_, i) {
      var b = document.createElement("button");
      b.type = "button"; b.setAttribute("aria-label", "Ir al testimonio " + (i + 1));
      b.addEventListener("click", function () { go(i); });
      dotsWrap.appendChild(b);
    });
    var dots = $$("button", dotsWrap);
    function perView() { return Math.max(1, Math.round(track.clientWidth / cards[0].getBoundingClientRect().width)); }
    function maxIdx() { return Math.max(0, cards.length - perView()); }
    function paint() {
      dots.forEach(function (d, i) { d.classList.toggle("is-on", i === idx); });
      var hideDots = maxIdx() === 0;
      root.querySelector(".carousel-ctrl").style.display = hideDots ? "none" : "";
    }
    function go(i) {
      var m = maxIdx();
      idx = i > m ? 0 : i < 0 ? m : i;
      track.scrollTo({ left: cards[idx].offsetLeft - cards[0].offsetLeft, behavior: "smooth" });
      paint();
    }
    $("[data-next]", root).addEventListener("click", function () { go(idx + 1); });
    $("[data-prev]", root).addEventListener("click", function () { go(idx - 1); });
    var st;
    track.addEventListener("scroll", function () {
      clearTimeout(st);
      st = setTimeout(function () {
        var x = track.scrollLeft, best = 0, bd = Infinity;
        cards.forEach(function (c, i) { var d = Math.abs(c.offsetLeft - cards[0].offsetLeft - x); if (d < bd) { bd = d; best = i; } });
        idx = Math.min(best, maxIdx()); paint();
      }, 120);
    }, { passive: true });
    root.addEventListener("mouseover", function () { paused = true; });
    root.addEventListener("mouseout", function (e) { if (!root.contains(e.relatedTarget)) paused = false; });
    root.addEventListener("touchstart", function () { paused = true; }, { passive: true });
    timer = setInterval(function () { if (!paused && !document.hidden) go(idx + 1); }, 6500);
    window.addEventListener("resize", paint);
    paint();
  }

  /* ---------------- Asistente de triage ---------------- */
  function initBot() {
    var root = $("[data-bot]");
    if (!root) return;
    var panel = $("[data-bot-panel]", root), fab = $("[data-bot-toggle]", root), teaser = $("[data-bot-teaser]", root);
    var bodyEl = $("[data-bot-body]", root), quick = $("[data-bot-quick]", root), form = $("[data-bot-form]", root);
    var input = $("input", form);
    var history = [];
    var started = false, busy = false;
    var profile = { dolor: "", sector: "", equipo: "" };

    var PAINS = {
      "Respondo tarde en WhatsApp": "Es de los problemas más caros: un cliente que espera más de unos minutos suele comprar en otro lado. Con un chatbot IA en WhatsApp respondes al instante, tomas pedidos y cobras 24/7, incluso cuando estás ocupado.",
      "Descontrol de inventario o caja": "Los faltantes y los cuadres que no cierran son fugas silenciosas de dinero. Un sistema de inventario a medida te da stock en tiempo real, alertas automáticas y cierres de caja en minutos.",
      "Mi web no vende": "Una web lenta o sin versión móvil espanta clientes. Creamos landing pages y e-commerce rápidos, pensados para convertir visitas en ventas y mensajes de WhatsApp.",
      "No tengo métricas claras": "Sin datos, cada decisión es una apuesta. Un dashboard te muestra ventas, márgenes y productos rentables en tiempo real, desde tu teléfono."
    };

    function scrollDown() { bodyEl.scrollTop = bodyEl.scrollHeight; }
    function say(text, who) {
      var el = document.createElement("div");
      el.className = "bmsg " + (who === "user" ? "user-m" : "bot-m");
      el.textContent = text;
      bodyEl.appendChild(el); scrollDown();
      return el;
    }
    function typing() {
      var el = document.createElement("div");
      el.className = "btyping"; el.innerHTML = "<i></i><i></i><i></i>";
      bodyEl.appendChild(el); scrollDown();
      return el;
    }
    async function botSay(text, delay) {
      var t = typing();
      await sleep(delay || 750);
      t.remove();
      return say(text, "bot");
    }
    function setQuick(opts, handler) {
      quick.innerHTML = "";
      opts.forEach(function (o) {
        var b = document.createElement("button");
        b.type = "button"; b.textContent = o;
        b.addEventListener("click", function () { if (!busy) { quick.innerHTML = ""; say(o, "user"); handler(o); } });
        quick.appendChild(b);
      });
    }
    function ctaMessage() {
      var parts = ["Hola KEHO, vengo del asistente de la web."];
      if (profile.dolor) parts.push("Mi principal problema: " + profile.dolor + ".");
      if (profile.sector) parts.push("Mi negocio: " + profile.sector + ".");
      if (profile.equipo) parts.push("Equipo: " + profile.equipo + ".");
      parts.push("Quiero agendar una auditoría.");
      return parts.join(" ");
    }
    function addCTA() {
      var el = say("Te propongo una auditoría gratuita de 30 minutos: revisamos tu proceso y te mostramos cuánto puedes ahorrar.", "bot");
      var a = document.createElement("a");
      a.className = "btn btn-primary btn-block";
      a.href = waLink(ctaMessage()); a.target = "_blank"; a.rel = "noopener";
      a.innerHTML = '<svg aria-hidden="true"><use href="#i-wa"/></svg> Agendar mi auditoría por WhatsApp';
      el.appendChild(document.createElement("br"));
      el.appendChild(a);
      scrollDown();
    }

    async function askSector() {
      await botSay("Para afinar la recomendación: ¿qué tipo de negocio tienes?");
      setQuick(["Restaurante / Delivery", "Comercio / Tienda", "PYME de servicios", "Otro"], async function (s) {
        profile.sector = s;
        await botSay("¿Cuántas personas trabajan contigo?");
        setQuick(["Solo yo", "2 a 5", "6 a 20", "Más de 20"], async function (eq) {
          profile.equipo = eq;
          await botSay("¡Perfecto! Con lo que me cuentas, vemos una oportunidad clara de ahorrar tiempo y vender más.", 900);
          addCTA();
          setQuick(["Tengo otra pregunta", "Ver demos en vivo"], function (o) {
            if (o === "Ver demos en vivo") { location.hash = "#demos"; botSay("¡Listo! Te llevé a las demos. Prueba el bot de WhatsApp 👀"); }
            else botSay("Claro, escríbela abajo y te respondo 👇");
          });
        });
      });
    }

    async function onPain(p) {
      if (p === "Otro") {
        profile.dolor = "otro";
        await botSay("Cuéntame en una frase qué proceso te quita más tiempo o dinero, y te digo cómo lo automatizaríamos 👇");
        input.focus();
        return;
      }
      profile.dolor = p.toLowerCase();
      await botSay(PAINS[p], 1000);
      askSector();
    }

    async function start() {
      if (started) return;
      started = true;
      await botSay("¡Hola! 👋 Soy el asistente de eficiencia de KEHO. ¿Qué proceso de tu negocio te da más dolores de cabeza?", 500);
      setQuick(Object.keys(PAINS).concat(["Otro"]), onPain);
    }

    async function askAI(text) {
      busy = true;
      var t = typing();
      var reply = "";
      try {
        var ctrl = ("AbortController" in window) ? new AbortController() : null;
        var to = setTimeout(function () { if (ctrl) ctrl.abort(); }, 20000);
        var res = await fetch(endpoints.chat, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, history: history.slice(-8) }),
          signal: ctrl ? ctrl.signal : undefined
        });
        clearTimeout(to);
        var j = await res.json();
        reply = (j && j.reply) ? String(j.reply) : "";
      } catch (e) { reply = ""; }
      if (!reply) {
        await sleep(600);
        reply = "¡Gracias por contarme! Eso es justo el tipo de proceso que automatizamos. Para darte una solución precisa, lo ideal es revisarlo contigo en una auditoría corta.";
      }
      t.remove();
      say(reply, "bot");
      history.push({ role: "user", text: text }, { role: "model", text: reply });
      busy = false;
    }

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text || busy) return;
      input.value = "";
      quick.innerHTML = "";
      say(text, "user");
      var wasOther = profile.dolor === "otro";
      if (wasOther) profile.dolor = text.slice(0, 120);
      await askAI(text);
      if (wasOther || !profile.sector) { askSector(); }
      else { addCTA(); }
    });

    function open() {
      panel.hidden = false; root.classList.add("is-open");
      fab.setAttribute("aria-expanded", "true"); fab.setAttribute("aria-label", "Cerrar asistente KEHO");
      teaser.classList.remove("is-on");
      start();
      if (fineHover) setTimeout(function () { input.focus(); }, 300);
    }
    function close() {
      panel.hidden = true; root.classList.remove("is-open");
      fab.setAttribute("aria-expanded", "false"); fab.setAttribute("aria-label", "Abrir asistente KEHO");
    }
    fab.addEventListener("click", function () { panel.hidden ? open() : close(); });
    $("[data-bot-close]", root).addEventListener("click", close);
    $("[data-teaser-close]", root).addEventListener("click", function (e) { e.stopPropagation(); teaser.classList.remove("is-on"); });
    teaser.addEventListener("click", open);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) close(); });
    setTimeout(function () { if (panel.hidden && !started) teaser.classList.add("is-on"); }, 7000);
    setTimeout(function () { teaser.classList.remove("is-on"); }, 22000);
  }

  function initYear() { var y = $("[data-year]"); if (y) y.textContent = new Date().getFullYear(); }

  function boot() {
    safe(initNav, "initNav");
    safe(initReveals, "initReveals");
    safe(initNodes, "initNodes");
    safe(initServiceCards, "initServiceCards");
    safe(initMagnetic, "initMagnetic");
    safe(initDemos, "initDemos");
    safe(initCarousel, "initCarousel");
    safe(initBot, "initBot");
    safe(initYear, "initYear");
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
