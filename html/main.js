/* ── AEY Prime Escapes — Shared JS ───────────────────────────────────────────── */

// Navbar hamburger toggle
document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.getElementById("hamburger");
  const mobileNav = document.getElementById("mobile-nav");
  if (hamburger && mobileNav) {
    hamburger.addEventListener("click", () => mobileNav.classList.toggle("open"));
  }

  // Lightbox
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxClose = document.getElementById("lightbox-close");
  const lightboxThumbs = document.querySelectorAll(".lightbox-thumb");
  let lightboxImages = [];
  let lightboxIndex = 0;

  function openLightbox(images, index) {
    lightboxImages = images;
    lightboxIndex = index;
    if (lightbox && lightboxImg) {
      lightboxImg.src = images[index];
      lightbox.classList.remove("hidden");
      document.body.style.overflow = "hidden";
    }
  }

  if (lightboxClose) {
    lightboxClose.addEventListener("click", () => {
      lightbox.classList.add("hidden");
      document.body.style.overflow = "";
    });
  }
  if (lightbox) {
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) {
        lightbox.classList.add("hidden");
        document.body.style.overflow = "";
      }
    });
  }

  window.openLightbox = openLightbox;

  // Modal open/close
  window.openModal = (id) => {
    const m = document.getElementById(id);
    if (m) { m.classList.remove("hidden"); document.body.style.overflow = "hidden"; }
  };
  window.closeModal = (id) => {
    const m = document.getElementById(id);
    if (m) { m.classList.add("hidden"); document.body.style.overflow = ""; }
  };

  // Close modal on overlay click
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.classList.add("hidden");
        document.body.style.overflow = "";
      }
    });
  });

  // Login form
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email")?.value;
      const pass = document.getElementById("login-pass")?.value;
      if (email && pass) {
        localStorage.setItem("aey_auth", JSON.stringify({ name: email.split("@")[0], email }));
        closeModal("auth-modal");
        updateAuthUI();
        showToast("Logged in successfully.");
      }
    });
  }

  function updateAuthUI() {
    const auth = JSON.parse(localStorage.getItem("aey_auth") || "null");
    const loginBtn = document.getElementById("login-btn");
    const userMenu = document.getElementById("user-menu");
    if (auth) {
      if (loginBtn) loginBtn.classList.add("hidden");
      if (userMenu) { userMenu.classList.remove("hidden"); userMenu.querySelector(".user-name").textContent = auth.name; }
    } else {
      if (loginBtn) loginBtn.classList.remove("hidden");
      if (userMenu) userMenu.classList.add("hidden");
    }
  }
  updateAuthUI();

  // Logout
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("aey_auth");
      updateAuthUI();
      showToast("Logged out.");
    });
  }

  // Toast
  window.showToast = (msg) => {
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#3D2B1F;color:#fff;padding:10px 20px;border-radius:999px;font-size:.875rem;font-weight:600;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,.2);";
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2800);
  };

  // Search bar submit
  const searchForms = document.querySelectorAll(".search-form");
  searchForms.forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = form.querySelector("input")?.value;
      if (q) window.location.href = `index.html?q=${encodeURIComponent(q)}`;
    });
  });

  // Category tab switching
  const catTabs = document.querySelectorAll(".category-tab");
  catTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      catTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
    });
  });

  // Chat
  const chatInput = document.getElementById("chat-input");
  const chatSend = document.getElementById("chat-send");
  const chatMessages = document.getElementById("chat-messages");

  const agentReplies = [
    "Thank you for your interest! This property is still available.",
    "I can schedule a viewing at your convenience. What day works best?",
    "The price shown is negotiable. We can discuss terms.",
    "This property includes all listed amenities. Would you like a full brochure?",
    "Our flexible payment terms include a 5-year to 20-year loan option.",
    "I'll follow up with complete documentation shortly.",
  ];

  function appendMessage(text, sender) {
    if (!chatMessages) return;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const wrap = document.createElement("div");
    wrap.style.cssText = `display:flex;flex-direction:column;align-items:${sender === "user" ? "flex-end" : "flex-start"};`;
    wrap.innerHTML = `<div class="chat-bubble ${sender}">${text}</div><div class="chat-time">${time}</div>`;
    chatMessages.appendChild(wrap);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function sendChat() {
    const val = chatInput?.value?.trim();
    if (!val) return;
    appendMessage(val, "user");
    chatInput.value = "";
    setTimeout(() => {
      appendMessage(agentReplies[Math.floor(Math.random() * agentReplies.length)], "agent");
    }, 800);
  }

  if (chatSend) chatSend.addEventListener("click", sendChat);
  if (chatInput) chatInput.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } });

  // Year select pills
  document.querySelectorAll(".year-pills button").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.closest(".year-pills").querySelectorAll("button").forEach((b) => {
        b.classList.remove("btn-dark");
        b.classList.add("btn-outline");
      });
      btn.classList.add("btn-dark");
      btn.classList.remove("btn-outline");
      const loanCalc = document.getElementById("loan-calc");
      if (loanCalc) {
        const years = parseInt(btn.dataset.years || "20");
        const downInput = document.getElementById("down-pct");
        const priceEl = document.getElementById("property-price");
        const price = parseInt(priceEl?.dataset.price || "5000000");
        const down = parseInt(downInput?.value || "20");
        updateLoanCalc(price, down, years);
      }
    });
  });

  function updateLoanCalc(price, downPct, years) {
    const downAmt = Math.round(price * downPct / 100);
    const loan = price - downAmt;
    const r = 0.065 / 12;
    const n = years * 12;
    const monthly = Math.round((loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
    const total = monthly * n + downAmt;
    const interest = total - price;
    const fmt = (v) => "₱" + v.toLocaleString();
    document.getElementById("calc-down-amt") && (document.getElementById("calc-down-amt").textContent = fmt(downAmt));
    document.getElementById("calc-loan") && (document.getElementById("calc-loan").textContent = fmt(loan));
    document.getElementById("calc-monthly") && (document.getElementById("calc-monthly").textContent = fmt(monthly));
    document.getElementById("calc-total-int") && (document.getElementById("calc-total-int").textContent = fmt(interest));
    document.getElementById("calc-total-paid") && (document.getElementById("calc-total-paid").textContent = fmt(total));
    document.getElementById("calc-down-label") && (document.getElementById("calc-down-label").textContent = `${downPct}%`);
  }

  const downInput = document.getElementById("down-pct");
  if (downInput) {
    downInput.addEventListener("input", () => {
      const priceEl = document.getElementById("property-price");
      const price = parseInt(priceEl?.dataset.price || "5000000");
      const down = parseInt(downInput.value);
      const activeYear = document.querySelector(".year-pills .btn-dark");
      const years = parseInt(activeYear?.dataset.years || "20");
      updateLoanCalc(price, down, years);
    });
    // Init
    const priceEl = document.getElementById("property-price");
    if (priceEl) {
      const price = parseInt(priceEl.dataset.price || "5000000");
      updateLoanCalc(price, 20, 20);
    }
  }
});
