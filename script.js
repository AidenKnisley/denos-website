(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Theme preference is persisted, with a safe fallback if storage is blocked.
  const root = document.documentElement;
  const themeToggle = $("#themeToggle");
  let savedTheme = "light";
  try { savedTheme = localStorage.getItem("denos-theme") || "light"; } catch (_) {}
  if (savedTheme === "dark") root.dataset.theme = "dark";
  const setThemeLabel = () => {
    const dark = root.dataset.theme === "dark";
    if (themeToggle) {
      themeToggle.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
      themeToggle.title = dark ? "Switch to light theme" : "Switch to dark theme";
      $(".theme-glyph", themeToggle).textContent = dark ? "☼" : "◐";
    }
  };
  setThemeLabel();
  themeToggle?.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("denos-theme", root.dataset.theme); } catch (_) {}
    setThemeLabel();
  });

  // Reading progress.
  const progress = $("#readProgress");
  const updateProgress = () => {
    if (!progress) return;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = `${max > 0 ? Math.min(100, (scrollY / max) * 100) : 0}%`;
  };
  addEventListener("scroll", updateProgress, { passive: true });
  addEventListener("resize", updateProgress);
  updateProgress();

  // Small-screen navigation.
  const menuToggle = $("#menuToggle");
  const mobileNav = $("#mobileNav");
  const closeMobileNav = () => {
    mobileNav?.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  };
  menuToggle?.addEventListener("click", () => {
    const open = !mobileNav.classList.contains("open");
    mobileNav.classList.toggle("open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
  });
  $$("#mobileNav a").forEach(link => link.addEventListener("click", closeMobileNav));
  document.addEventListener("click", event => {
    if (mobileNav?.classList.contains("open") &&
        !mobileNav.contains(event.target) && !menuToggle.contains(event.target)) closeMobileNav();
  });

  // Reveal sections when they enter the viewport. Content remains visible when
  // IntersectionObserver is unavailable or reduced motion is requested.
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealNodes = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -25px 0px" });
    revealNodes.forEach(node => observer.observe(node));
  } else {
    revealNodes.forEach(node => node.classList.add("is-visible"));
  }

  // Copy helper with a compatibility fallback.
  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const temp = document.createElement("textarea");
    temp.value = text;
    temp.setAttribute("readonly", "");
    temp.style.position = "fixed";
    temp.style.opacity = "0";
    document.body.append(temp);
    temp.select();
    const ok = document.execCommand("copy");
    temp.remove();
    if (!ok) throw new Error("Clipboard unavailable");
    return true;
  }

  const copyStatus = $("#copyStatus");
  $$("[data-copy]").forEach(button => {
    button.addEventListener("click", async () => {
      const oldLabel = button.textContent;
      try {
        await copyText(button.dataset.copy);
        button.textContent = "COPIED";
        if (copyStatus) copyStatus.textContent = "COMMAND COPIED";
      } catch (_) {
        button.textContent = "SELECT";
        if (copyStatus) copyStatus.textContent = "COPY NOT AVAILABLE";
      }
      setTimeout(() => {
        button.textContent = oldLabel;
        if (copyStatus) copyStatus.textContent = "";
      }, 1700);
    });
  });

  // Release filtering.
  const releaseSearch = $("#releaseSearch");
  const releaseRows = $$(".release-row");
  const noReleaseResults = $("#noReleaseResults");
  const releaseCount = $("#releaseCount");
  const filterReleases = () => {
    if (!releaseSearch) return;
    const needle = releaseSearch.value.trim().toLowerCase();
    let visible = 0;
    releaseRows.forEach(row => {
      const haystack = `${row.dataset.search || ""} ${row.textContent}`.toLowerCase();
      const match = haystack.includes(needle);
      row.hidden = !match;
      if (match) visible++;
    });
    if (noReleaseResults) noReleaseResults.hidden = visible !== 0;
    if (releaseCount) releaseCount.textContent = `${visible} SOURCE ARCHIVE${visible === 1 ? "" : "S"}`;
  };
  releaseSearch?.addEventListener("input", filterReleases);

  // Expand and copy release SHA-256 values.
  $$(".hash-toggle").forEach(button => {
    button.addEventListener("click", async () => {
      const value = button.nextElementSibling;
      const opening = value.hidden;
      value.hidden = !opening;
      button.querySelector("span").textContent = opening ? "Copy again" : "Show hash + copy";
      if (opening) {
        try {
          await copyText(button.dataset.hash);
          button.querySelector("span").textContent = "Copied · copy again";
        } catch (_) {
          button.querySelector("span").textContent = "Hash shown";
        }
      } else {
        try {
          await copyText(button.dataset.hash);
          button.querySelector("span").textContent = "Copied · copy again";
        } catch (_) {}
      }
    });
  });

  // Browser-side command demo. This is intentionally labelled as simulated;
  // all output comes from a small static command map and never executes code.
  const terminalDialog = $("#terminalDialog");
  const terminalLaunch = $("#terminalLaunch");
  const demoForm = $("#demoForm");
  const demoInput = $("#demoInput");
  const demoOutput = $("#demoOutput");
  const demoCommands = {
    help: [
      "Documented demo topics:",
      "about  version  paging  memory  network  compiler  graphics  clear",
      "Also try: net  vmstat  cinfo"
    ],
    about: [
      "DenOS 0.4.9 — experimental independent x86-64 operating system.",
      "Boot path: GRUB Multiboot2 → long mode → VGA text console.",
      "This browser panel is a static project tour, not a live OS."
    ],
    version: [
      "DenOS 0.4.9",
      "Aiden C 5.2.4",
      "Bytecode target: AEX6 (interpreted by the in-kernel VM)."
    ],
    paging: [
      "Virtual memory snapshot:",
      "Four-level x86-64 page-table manager attached to the active CR3.",
      "Supports 4 KiB mapping operations and 2 MiB / 1 GiB huge-page inspection/splitting.",
      "No per-process address spaces or ring-3 isolation."
    ],
    memory: [
      "Memory foundations:",
      "Physical memory manager + kernel heap diagnostics.",
      "PMM-backed 64 MiB kernel virtual allocation window.",
      "Single active address space; not a process-isolation boundary."
    ],
    vmstat: [
      "The real shell includes paging and vmstat diagnostics.",
      "This tour does not query a running kernel or show live allocation counters."
    ],
    network: [
      "Network baseline:",
      "PCI discovery + QEMU E1000 adapter, Ethernet frames, ARP, IPv4 validation and ICMP echo.",
      "No DHCP, DNS, TCP/UDP sockets, IPv6, Wi-Fi or Bluetooth."
    ],
    net: [
      "Network baseline:",
      "QEMU E1000 / static guest profile / ARP / IPv4 / ICMP echo.",
      "The real adapter is polled; host-side protocol tests do not validate DMA or QEMU packet exchange."
    ],
    compiler: [
      "Aiden C 5.2.4:",
      "A bounded C subset compiled to AEX6 bytecode, then interpreted in kernel context.",
      "Not ISO C, not native x86-64 code, and not a security boundary."
    ],
    cinfo: [
      "Aiden C 5.2.4 · AEX6",
      "The real shell includes cinfo and cc --version compiler information commands.",
      "This static demo is not invoking the compiler."
    ],
    graphics: [
      "Graphics library:",
      "Software renderer, framebuffer API, geometry/text helpers, window/event utilities and QOI decoder.",
      "The normal CLI boot does not start a desktop; no GPU acceleration is included."
    ],
    clear: []
  };
  const appendDemoLine = (text, className = "") => {
    const line = document.createElement("span");
    line.textContent = text;
    if (className) line.className = className;
    demoOutput.append(line);
  };
  const runDemoCommand = raw => {
    const command = String(raw || "").trim().toLowerCase();
    if (!command) return;
    appendDemoLine(`root@denos:~$ ${command}`, "user-line");
    const response = demoCommands[command];
    if (!response) {
      appendDemoLine(`${command}: no tour entry. Type "help" for the available topics.`);
    } else {
      response.forEach(line => appendDemoLine(line));
    }
    while (demoOutput.children.length > 26) demoOutput.firstElementChild.remove();
    demoOutput.scrollTop = demoOutput.scrollHeight;
  };
  terminalLaunch?.addEventListener("click", () => {
    if (typeof terminalDialog.showModal === "function") terminalDialog.showModal();
    else terminalDialog.setAttribute("open", "");
    setTimeout(() => demoInput?.focus(), 50);
  });
  $$("[data-close-terminal]").forEach(button => button.addEventListener("click", () => terminalDialog.close()));
  demoForm?.addEventListener("submit", event => {
    event.preventDefault();
    const command = demoInput.value;
    demoInput.value = "";
    if (command.trim().toLowerCase() === "clear") {
      demoOutput.replaceChildren();
      return;
    }
    runDemoCommand(command);
    demoInput.focus();
  });
  $$("[data-demo-command]").forEach(button => button.addEventListener("click", () => {
    runDemoCommand(button.dataset.demoCommand);
    demoInput?.focus();
  }));

  // Compact command palette for jumping around the site.
  const commandDialog = $("#commandDialog");
  const commandSearch = $("#commandSearch");
  const commandResults = $("#commandResults");
  const commandEntries = $$("#commandResults button");
  const openCommandPalette = () => {
    if (typeof commandDialog.showModal === "function") commandDialog.showModal();
    else commandDialog.setAttribute("open", "");
    commandSearch.value = "";
    filterPalette();
    setTimeout(() => commandSearch.focus(), 30);
  };
  const filterPalette = () => {
    const query = (commandSearch?.value || "").toLowerCase().trim();
    commandEntries.forEach(item => {
      item.hidden = !item.textContent.toLowerCase().includes(query);
    });
  };
  commandSearch?.addEventListener("input", filterPalette);
  commandEntries.forEach(item => item.addEventListener("click", () => {
    const target = item.dataset.target;
    commandDialog.close();
    if (target.startsWith("#")) {
      document.querySelector(target)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      history.replaceState(null, "", target);
    } else {
      window.location.href = target;
    }
  }));
  document.addEventListener("keydown", event => {
    const tag = document.activeElement?.tagName;
    const typing = tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openCommandPalette();
    } else if (event.key === "/" && !typing && !commandDialog.open && !terminalDialog.open) {
      event.preventDefault();
      releaseSearch?.focus();
    } else if (event.key === "Escape") {
      closeMobileNav();
    }
  });
})();