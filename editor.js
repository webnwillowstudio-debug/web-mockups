/* =========================================================
   webnwillow MOCKUP EDITOR  — drop <script src="editor.js"></script> into any page
   ✎ button (bottom-right) or press E  → edit mode
   • Click any text to type over it
   • Click any photo box / image to replace it with your own picture
   • Colour pickers change the whole theme
   • "Save HTML" downloads the edited page (put it back in this folder)
   S = auto-scroll for video · T = top · H = hide/show ✎ button
   iPad: triple-tap the logo (anything with class "logo") for auto-scroll
   ========================================================= */
(function () {
  if (location.hash === "#preview") { document.querySelectorAll(".rv,.win").forEach(n => n.classList.add("in")); return; }
  const VARS = (document.documentElement.dataset.vars || "").split(",").map(s => s.trim()).filter(Boolean);
  const TEXT_SEL = "h1,h2,h3,h4,h5,h6,p,a,li,button,figcaption,small,blockquote,dt,dd,td,th,label,.e,.btn,.chip,.hl,.stk,.lbl,.num";
  let editing = false, hidden = location.hash === "#demo";

  const css = document.createElement("style");
  css.id = "wnw-editor-css";
  css.textContent = `
  #wnw-fab{position:fixed;right:18px;bottom:18px;z-index:2147483000;width:52px;height:52px;border-radius:50%;border:3px solid #111;background:#FFE36E;font:700 22px system-ui;cursor:pointer;box-shadow:3px 3px 0 #111;display:grid;place-items:center;transition:transform .2s}
  #wnw-fab:hover{transform:rotate(-12deg) scale(1.08)}
  #wnw-panel{position:fixed;right:18px;bottom:82px;z-index:2147483000;width:290px;max-height:72vh;overflow:auto;background:#FFFDF4;color:#111;border:3px solid #111;border-radius:18px;box-shadow:5px 5px 0 #111;padding:16px;font:500 13px system-ui;display:none}
  #wnw-panel.open{display:block}
  #wnw-panel h4{font:800 15px system-ui;margin:0 0 4px;text-transform:uppercase;letter-spacing:.5px}
  #wnw-panel .hint{font-size:11.5px;color:#555;margin-bottom:12px;line-height:1.45}
  #wnw-panel .row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:5px 0;border-bottom:1px dashed #ddd}
  #wnw-panel input[type=color]{width:42px;height:28px;border:2px solid #111;border-radius:8px;padding:0;background:none;cursor:pointer}
  #wnw-panel .btns{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
  #wnw-panel button{font:700 12px system-ui;text-transform:uppercase;padding:10px;border:2px solid #111;border-radius:10px;background:#fff;cursor:pointer}
  #wnw-panel button.p{background:#111;color:#FFE36E}
  #wnw-panel .tog{display:flex;gap:8px;align-items:center;margin:8px 0 4px;font-weight:700}
  body.wnw-editing [contenteditable=true]{outline:2px dashed rgba(255,106,61,.7);outline-offset:3px;cursor:text}
  body.wnw-editing [contenteditable=true]:focus{outline:2px solid #FF6A3D;background:rgba(255,227,110,.18)}
  body.wnw-editing img, body.wnw-editing [data-img]{cursor:copy!important;outline:3px dashed #3B47F0;outline-offset:-3px}
  #wnw-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483001;background:#111;color:#FFE36E;font:700 13px system-ui;padding:10px 16px;border-radius:99px;opacity:0;transition:.3s;pointer-events:none}
  #wnw-toast.show{opacity:1}
  .wnw-hidden{display:none!important}`;
  document.head.appendChild(css);

  const fab = el("button", { id: "wnw-fab", title: "Edit this page (E)" }, "✎");
  const panel = el("div", { id: "wnw-panel" });
  const toast = el("div", { id: "wnw-toast" });
  document.body.append(fab, panel, toast);
  if (hidden) fab.classList.add("wnw-hidden");

  function el(tag, attrs, html) { const e = document.createElement(tag); Object.assign(e, attrs || {}); if (html) e.innerHTML = html; return e; }
  function say(t) { toast.textContent = t; toast.classList.add("show"); clearTimeout(say.t); say.t = setTimeout(() => toast.classList.remove("show"), 1800); }
  function toHex(v) {
    v = v.trim(); if (v.startsWith("#")) { if (v.length === 4) v = "#" + [...v.slice(1)].map(c => c + c).join(""); return v.slice(0, 7); }
    const m = v.match(/\d+/g); if (!m) return "#000000"; return "#" + m.slice(0, 3).map(n => (+n).toString(16).padStart(2, "0")).join("");
  }

  // ---------- panel ----------
  const root = getComputedStyle(document.documentElement);
  let rows = VARS.map(v => `<div class="row"><span>${v.replace("--", "")}</span><input type="color" data-var="${v}" value="${toHex(root.getPropertyValue(v) || "#000")}"></div>`).join("");
  panel.innerHTML = `<h4>✎ Page editor</h4>
   <div class="hint">Click any text to change it. Click a photo box to put in your own image. Pick colours below. Then <b>Save HTML</b>.</div>
   <label class="tog"><input type="checkbox" id="wnw-edit"> Edit mode (E)</label>
   ${rows ? `<h4 style="margin-top:12px">Colours</h4>${rows}` : ""}
   <div class="btns">
     <button class="p" id="wnw-save">Save HTML</button>
     <button id="wnw-reset">Undo all</button>
     <button id="wnw-auto">Auto-scroll</button>
     <button id="wnw-hide">Hide ✎</button>
   </div>`;

  fab.onclick = () => panel.classList.toggle("open");
  panel.querySelector("#wnw-edit").onchange = e => setEdit(e.target.checked);
  panel.querySelectorAll("input[type=color]").forEach(inp => inp.oninput = () => document.documentElement.style.setProperty(inp.dataset.var, inp.value));
  panel.querySelector("#wnw-save").onclick = save;
  panel.querySelector("#wnw-reset").onclick = () => location.reload();
  panel.querySelector("#wnw-auto").onclick = () => { panel.classList.remove("open"); setEdit(false); toggleAuto(); };
  panel.querySelector("#wnw-hide").onclick = () => { panel.classList.remove("open"); fab.classList.add("wnw-hidden"); say("Press H to bring ✎ back"); };

  function setEdit(on) {
    editing = on; document.body.classList.toggle("wnw-editing", on);
    panel.querySelector("#wnw-edit").checked = on;
    document.querySelectorAll(TEXT_SEL).forEach(n => {
      if (n.closest("#wnw-panel,#wnw-fab,svg")) return;
      if (on) n.setAttribute("contenteditable", "true"); else n.removeAttribute("contenteditable");
    });
    say(on ? "Edit mode ON — click text or photos" : "Edit mode OFF");
  }

  // links shouldn't navigate while editing
  document.addEventListener("click", e => {
    if (!editing) return;
    const a = e.target.closest("a"); if (a && !a.closest("#wnw-panel")) e.preventDefault();
    const pic = e.target.closest("img,[data-img]");
    if (pic && !pic.closest("#wnw-panel")) { e.preventDefault(); pickImage(pic); }
  }, true);

  function pickImage(target) {
    const f = el("input", { type: "file", accept: "image/*" });
    f.onchange = () => {
      const file = f.files[0]; if (!file) return;
      const r = new FileReader();
      r.onload = () => {
        if (target.tagName === "IMG") target.src = r.result;
        else { target.style.backgroundImage = `url("${r.result}")`; target.style.backgroundSize = "cover"; target.style.backgroundPosition = "center"; target.classList.add("has-img"); }
        say("Photo replaced ✓");
      };
      r.readAsDataURL(file);
    };
    f.click();
  }

  function save() {
    const wasEditing = editing; setEdit(false);
    document.querySelectorAll("[data-count]").forEach(n => { const v = parseInt(n.textContent); if (!isNaN(v)) n.dataset.count = v; });
    const clone = document.documentElement.cloneNode(true);
    clone.querySelectorAll("#wnw-fab,#wnw-panel,#wnw-toast,#wnw-editor-css").forEach(n => n.remove());
    clone.querySelector("body").classList.remove("wnw-editing");
    const html = "<!DOCTYPE html>\n" + clone.outerHTML;
    const name = (location.pathname.split("/").pop() || "page.html");
    const a = el("a", { href: URL.createObjectURL(new Blob([html], { type: "text/html" })), download: name });
    document.body.appendChild(a); a.click(); a.remove();
    say("Saved " + name + " — replace the old file in your folder");
    if (wasEditing) setEdit(true);
  }

  // ---------- auto-scroll for video ----------
  let auto = false, last = 0; const SPEED = +(document.documentElement.dataset.speed || 70);
  function step(t) { if (!auto) return; if (last) { scrollBy(0, (t - last) / 1000 * SPEED); if (innerHeight + scrollY >= document.body.scrollHeight - 2) { auto = false; return; } } last = t; requestAnimationFrame(step); }
  function toggleAuto() { auto = !auto; last = 0; document.documentElement.style.scrollBehavior = auto ? "auto" : "smooth"; if (auto) { fab.classList.add("wnw-hidden"); requestAnimationFrame(step); } }
  window.wnwToggleAuto = toggleAuto;

  addEventListener("keydown", e => {
    if (e.target.isContentEditable || /input|textarea/i.test(e.target.tagName)) return;
    const k = e.key.toLowerCase();
    if (k === "e") { panel.classList.add("open"); fab.classList.remove("wnw-hidden"); setEdit(!editing); }
    if (k === "s") toggleAuto();
    if (k === "t") scrollTo({ top: 0 });
    if (k === "h") fab.classList.toggle("wnw-hidden");
  });
  let taps = 0, tt;
  document.querySelectorAll(".logo").forEach(l => l.addEventListener("click", () => {
    if (editing) return; taps++; clearTimeout(tt);
    tt = setTimeout(() => { if (taps >= 3) toggleAuto(); else if (taps === 1) scrollTo({ top: 0 }); taps = 0; }, 350);
  }));
  if (location.hash === "#demo") setTimeout(toggleAuto, 2500);

  // ---------- shared scroll reveal ----------
  const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }), { threshold: .15 });
  document.querySelectorAll(".rv:not(.in)").forEach((n, i) => { n.style.transitionDelay = (i % 3) * 110 + "ms"; io.observe(n); });
})();
