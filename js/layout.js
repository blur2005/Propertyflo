const LANDLORD_NAV = [
  { label: "Dashboard", icon: "grid", href: "../landlord/dashboard.html" },
  {
    label: "Properties",
    icon: "building",
    href: "../landlord/properties.html",
  },
  { label: "Units", icon: "door", href: "../landlord/units.html" },
  { label: "Tenants", icon: "users", href: "../landlord/tenants.html" },
  { label: "Leases", icon: "file-text", href: "../landlord/leases.html" },
  { label: "Payments", icon: "credit-card", href: "../landlord/payments.html" },
  { label: "Maintenance", icon: "tool", href: "../landlord/maintenance.html" },
  { label: "Documents", icon: "folder", href: "../landlord/documents.html" },
  {
    label: "Announcements",
    icon: "megaphone",
    href: "../landlord/announcements.html",
  },
  { label: "Reports", icon: "bar-chart", href: "../landlord/reports.html" },
];

const TENANT_NAV = [
  { label: "Dashboard", icon: "grid", href: "../tenant/dashboard.html" },
  { label: "My Lease", icon: "file-text", href: "../tenant/lease.html" },
  { label: "Payments", icon: "credit-card", href: "../tenant/payments.html" },
  { label: "Maintenance", icon: "tool", href: "../tenant/maintenance.html" },
  { label: "Documents", icon: "folder", href: "../tenant/documents.html" },
];

const SVG_ICONS = {
  grid: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
  building:
    '<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>',
  door: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12h.01"/></svg>',
  users:
    '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
  "user-plus":
    '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>',
  "file-text":
    '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  "credit-card":
    '<svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
  tool: '<svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>',
  folder:
    '<svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>',
  megaphone:
    '<svg viewBox="0 0 24 24"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5"/><path d="M19.07 4.93a10 10 0 010 14.14"/><path d="M15.54 8.46a5 5 0 010 7.07"/></svg>',
  "bar-chart":
    '<svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  bell: '<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>',
  logout:
    '<svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  x: '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  trash:
    '<svg viewBox="0 0 24 24"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>',
  download:
    '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  upload:
    '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
  "map-pin":
    '<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  eye: '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  mail: '<svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
  phone:
    '<svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.7A2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.72 6.72l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>',
  shield:
    '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  calendar:
    '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  "check-circle":
    '<svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>',
  "alert-circle":
    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
};

function icon(name) {
  return SVG_ICONS[name] || "";
}

function esc(value) {
  return String(value === null || value === undefined ? "" : value).replace(
    /[&<>"']/g,
    function (ch) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[ch];
    },
  );
}

function initials(name) {
  if (!name) return "?";
  return esc(
    name
      .split(" ")
      .filter(Boolean)
      .map(function (n) {
        return n[0];
      })
      .slice(0, 2)
      .join("")
      .toUpperCase(),
  );
}

function formatNaira(amount) {
  return "₦" + Number(amount).toLocaleString("en-NG");
}

function formatDate(value, opts) {
  if (!value) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);
  return date.toLocaleDateString(
    "en-NG",
    opts || { day: "numeric", month: "short", year: "numeric" },
  );
}

function formatBytes(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

function badge(value) {
  if (!value) return "";
  const text = String(value);
  const key = text.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  return `<span class="badge badge-${key}">${esc(text.replace(/_/g, " "))}</span>`;
}

function avatarHtml(name, size) {
  return `<div class="avatar avatar-${size || "md"}">${initials(name)}</div>`;
}

function spinner() {
  return '<div class="spinner-wrap"><div class="spinner"></div></div>';
}

function emptyState(iconName, title, desc, actionHtml) {
  return `
    <div class="empty-state">
      <div class="empty-icon">${icon(iconName)}</div>
      <h3>${title}</h3>
      <p>${desc}</p>
      ${actionHtml || ""}
    </div>
  `;
}

function openModal(id) {
  document.getElementById(id).classList.add("open");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}

function confirmDelete(message, onConfirm) {
  document.getElementById("confirm-message").textContent = message;
  openModal("confirm-modal");
  document.getElementById("confirm-ok").onclick = function () {
    closeModal("confirm-modal");
    onConfirm();
  };
}

function renderLayout(user, pageTitle) {
  const nav = user.role === "landlord" ? LANDLORD_NAV : TENANT_NAV;
  const currentFile = window.location.pathname.split("/").pop();

  const navHtml = nav
    .map(function (item) {
      const hrefFile = item.href.split("/").pop();
      const active = currentFile === hrefFile ? "active" : "";
      return `<a href="${item.href}" class="nav-item ${active}">${icon(item.icon)}<span>${item.label}</span></a>`;
    })
    .join("");

  const orgBlock =
    user.role === "landlord"
      ? `<div class="sidebar-org">
         <div class="sidebar-org-label">Organization</div>
         <div class="sidebar-org-name" id="sidebar-org-name"></div>
       </div>`
      : "";

  document.getElementById("sidebar-slot").innerHTML = `
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="sidebar-logo-icon">${icon("building")}</div>
        <span class="sidebar-logo-text">PropertyFlow</span>
      </div>
      ${orgBlock}
      <nav class="sidebar-nav">${navHtml}</nav>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="sidebar-avatar">${initials(user.full_name)}</div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">${esc(user.full_name)}</div>
            <div class="sidebar-user-role">${esc(user.role)}</div>
          </div>
        </div>
        <button class="btn-signout" onclick="logout()">
          ${icon("logout")} Sign out
        </button>
      </div>
    </aside>
  `;

  document.getElementById("topbar-slot").innerHTML = `
    <header class="topbar">
      <button class="topbar-menu-btn" aria-label="Open menu" aria-expanded="false">
        <span></span>
        <span></span>
        <span></span>
      </button>
      <span class="topbar-title">${esc(pageTitle)}</span>
      <div class="topbar-actions">
        <button class="topbar-btn" id="notif-btn" onclick="toggleNotifications()">
          ${icon("bell")}
          <span class="notif-badge" id="notif-badge" style="display:none"></span>
        </button>
      </div>
    </header>
    <div class="notif-dropdown" id="notif-dropdown">
      <div class="notif-header">
        <span class="notif-header-title">Notifications</span>
        <span class="notif-mark-read" onclick="handleMarkAllRead()">Mark all read</span>
      </div>
      <div class="notif-list" id="notif-list">${spinner()}</div>
    </div>
  `;

  const menuBtn = document.querySelector(".topbar-menu-btn");
  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      const isOpen = document.body.classList.toggle("sidebar-open");
      menuBtn.classList.toggle("active", isOpen);
      menuBtn.setAttribute("aria-expanded", String(isOpen));
    });
  }

  document.addEventListener("click", function (event) {
    const sidebar = document.querySelector(".sidebar");
    const menuBtn = document.querySelector(".topbar-menu-btn");
    if (!sidebar || !menuBtn) return;

    const clickInsideSidebar = sidebar.contains(event.target);
    const clickOnMenu = menuBtn.contains(event.target);

    if (
      !clickInsideSidebar &&
      !clickOnMenu &&
      document.body.classList.contains("sidebar-open")
    ) {
      document.body.classList.remove("sidebar-open");
      menuBtn.classList.remove("active");
      menuBtn.setAttribute("aria-expanded", "false");
    }
  });

  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <div class="modal-overlay" id="confirm-modal">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h2>Confirm Delete</h2>
          <button class="modal-close" onclick="closeModal('confirm-modal')">${icon("x")}</button>
        </div>
        <div class="modal-body">
          <p id="confirm-message" style="font-size:13.5px;color:var(--text-secondary)"></p>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('confirm-modal')">Cancel</button>
            <button class="btn btn-danger" id="confirm-ok">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `,
  );

  document.addEventListener("click", function (e) {
    const dropdown = document.getElementById("notif-dropdown");
    const btn = document.getElementById("notif-btn");
    if (
      dropdown &&
      !dropdown.contains(e.target) &&
      btn &&
      !btn.contains(e.target)
    ) {
      dropdown.classList.remove("open");
    }
  });

  loadNotifications(user);
}

function toggleNotifications() {
  document.getElementById("notif-dropdown").classList.toggle("open");
}

async function loadNotifications(user) {
  let notifs = [];
  try {
    notifs = await getNotifications(user.id);
  } catch (error) {
    console.error(error);
  }

  const unread = notifs.filter(function (n) {
    return !n.read_at;
  });
  const badgeEl = document.getElementById("notif-badge");

  if (badgeEl) {
    if (unread.length > 0) {
      badgeEl.style.display = "flex";
      badgeEl.textContent = unread.length > 9 ? "9+" : unread.length;
    } else {
      badgeEl.style.display = "none";
    }
  }

  const list = document.getElementById("notif-list");
  if (!list) return;

  if (notifs.length === 0) {
    list.innerHTML = '<div class="notif-empty">You\'re all caught up!</div>';
    return;
  }

  list.innerHTML = notifs
    .map(function (n) {
      return `
      <div class="notif-item ${n.read_at ? "" : "unread"}">
        ${!n.read_at ? '<div class="notif-dot"></div>' : '<div class="notif-spacer"></div>'}
        <div>
          <div class="notif-item-title">${esc(n.title)}</div>
          <div class="notif-item-body">${esc(n.body)}</div>
          <div class="notif-item-date">${formatDate(n.created_at, { day: "numeric", month: "short" })}</div>
        </div>
      </div>
    `;
    })
    .join("");
}

async function handleMarkAllRead() {
  const user = getCurrentUser();
  if (!user) return;
  try {
    await markAllNotificationsRead(user.id);
  } catch (error) {
    console.error(error);
    return;
  }
  const badgeEl = document.getElementById("notif-badge");
  if (badgeEl) badgeEl.style.display = "none";
  document.querySelectorAll(".notif-item.unread").forEach(function (el) {
    el.classList.remove("unread");
  });
  document.querySelectorAll(".notif-dot").forEach(function (el) {
    el.style.display = "none";
  });
}

async function initPage(pageTitle, role) {
  let user = null;
  if (role === "landlord") user = await requireLandlord();
  else if (role === "tenant") user = await requireTenant();
  else user = await requireAuth();
  if (!user) return null;

  renderLayout(user, pageTitle);

  if (user.role === "landlord") {
    getOrganization(user.organization_id)
      .then(function (org) {
        const el = document.getElementById("sidebar-org-name");
        if (el && org) el.textContent = org.name;
      })
      .catch(function () {});
  }

  return user;
}

function errorState(message) {
  return '<div class="alert alert-error">' + esc(message) + "</div>";
}

function flash(message, type) {
  const box = document.getElementById("flash");
  if (!box) return;
  box.innerHTML =
    '<div class="alert alert-' +
    (type || "error") +
    '">' +
    esc(message) +
    "</div>";
  clearTimeout(flash.timer);
  flash.timer = setTimeout(function () {
    box.innerHTML = "";
  }, 8000);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showFormError(id, message) {
  const box = document.getElementById(id);
  if (!box) return;
  box.textContent = message;
  box.style.display = "block";
}

function clearFormError(id) {
  const box = document.getElementById(id);
  if (box) box.style.display = "none";
}

function setButtonBusy(button, busy, label) {
  if (!button) return;
  if (busy) {
    button.dataset.label = button.textContent;
    button.textContent = label;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.label || button.textContent;
    button.disabled = false;
  }
}

function selectOptions(items, valueOf, labelOf, selected) {
  return items
    .map(function (item) {
      const value = valueOf(item);
      return (
        '<option value="' +
        esc(value) +
        '"' +
        (value === selected ? " selected" : "") +
        ">" +
        esc(labelOf(item)) +
        "</option>"
      );
    })
    .join("");
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    return false;
  }
}
