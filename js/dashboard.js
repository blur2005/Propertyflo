(function () {
  const root = document.getElementById("page-root");

  function greeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }

  function barsHtml(months) {
    const max =
      Math.max.apply(
        null,
        months.map(function (m) {
          return m.revenue;
        }),
      ) || 1;
    return months
      .map(function (m) {
        const height = Math.round((m.revenue / max) * 80);
        return `
        <div class="chart-col">
          <div class="chart-bar-label">${m.revenue > 0 ? "₦" + Math.round(m.revenue / 1000) + "k" : ""}</div>
          <div class="chart-bar" style="height:${height}%" title="${esc(m.month)}: ${formatNaira(m.revenue)}"></div>
          <div class="chart-bar-label">${esc(m.month)}</div>
        </div>
      `;
      })
      .join("");
  }

  function onboardingHtml(steps) {
    const items = steps
      .map(function (s) {
        return `
        <a href="${s.href}" class="flex items-center gap-3" style="padding:10px 0;border-bottom:1px solid var(--slate-100)">
          <span class="stat-icon ${s.done ? "green" : "slate"}" style="width:28px;height:28px;border-radius:50%">${icon(s.done ? "check-circle" : "alert-circle")}</span>
          <span style="font-size:13.5px;font-weight:500;${s.done ? "color:var(--text-muted);text-decoration:line-through" : ""}">${s.label}</span>
        </a>
      `;
      })
      .join("");
    return `
      <div class="card section">
        <div class="card-header"><div><h3>Get started</h3><p>Set up your portfolio in a few steps</p></div></div>
        ${items}
      </div>
    `;
  }

  function render(user, data) {
    const stats = data.stats;
    const tenantById = {};
    const leaseById = {};
    const unitById = {};
    data.tenants.forEach(function (t) {
      tenantById[t.id] = t;
    });
    data.leases.forEach(function (l) {
      leaseById[l.id] = l;
    });
    data.units.forEach(function (u) {
      unitById[u.id] = u;
    });

    const steps = [
      {
        done: stats.totalProperties > 0,
        label: "Add your first property",
        href: "properties.html",
      },
      {
        done: stats.totalUnits > 0,
        label: "Add units to your property",
        href: "units.html",
      },
      {
        done: data.tenants.length > 0,
        label: "Add a tenant",
        href: "tenants.html",
      },
      {
        done: stats.activeLeases > 0,
        label: "Create a lease",
        href: "leases.html",
      },
      {
        done: data.payments.length > 0,
        label: "Record a payment",
        href: "payments.html",
      },
    ];
    const allDone = steps.every(function (s) {
      return s.done;
    });

    const recent = data.payments.slice(0, 5);
    const recentHtml =
      recent.length === 0
        ? '<p class="text-secondary text-sm">No payments recorded yet.</p>'
        : recent
            .map(function (p) {
              const lease = leaseById[p.lease_id];
              const tenant = lease ? tenantById[lease.tenant_id] : null;
              return `
            <div class="flex items-center justify-between" style="padding:10px 0;border-bottom:1px solid var(--slate-100)">
              <div>
                <div style="font-size:13px;font-weight:500">${esc(tenant ? tenant.full_name : "Former lease")}</div>
                <div style="font-size:11.5px;color:var(--text-muted)">${formatDate(p.payment_date)} · ${esc(p.method.replace(/_/g, " "))}</div>
              </div>
              <div style="font-size:13px;font-weight:600;color:var(--green-600)">${formatNaira(p.amount)}</div>
            </div>
          `;
            })
            .join("");

    const open = data.maintenance
      .filter(function (m) {
        return m.status === "open" || m.status === "in_progress";
      })
      .slice(0, 5);
    const openHtml =
      open.length === 0
        ? '<p class="text-secondary text-sm">No open requests. All clear!</p>'
        : open
            .map(function (m) {
              const unit = unitById[m.unit_id];
              return `
            <div class="flex items-center justify-between" style="padding:10px 0;border-bottom:1px solid var(--slate-100)">
              <div style="min-width:0;flex:1">
                <div class="truncate" style="font-size:13px;font-weight:500">${esc(m.title)}</div>
                <div style="font-size:11.5px;color:var(--text-muted)">${esc(unit ? unit.unit_number : "—")} · ${formatDate(m.created_at, { day: "numeric", month: "short" })}</div>
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;margin-left:12px">
                ${badge(m.priority)}
                ${badge(m.status)}
              </div>
            </div>
          `;
            })
            .join("");

    root.innerHTML = `
      <div style="margin-bottom:24px">
        <h2 style="font-size:20px;font-weight:600">${greeting()}, ${esc(user.full_name.split(" ")[0])}</h2>
        <p style="font-size:13.5px;color:var(--text-secondary);margin-top:2px">Here's what's happening across your properties.</p>
      </div>

      ${allDone ? "" : onboardingHtml(steps)}

      <div class="stats-grid section">
        <div class="stat-card">
          <div><div class="stat-label">Properties</div><div class="stat-value">${stats.totalProperties}</div></div>
          <div class="stat-icon brand">${icon("building")}</div>
        </div>
        <div class="stat-card">
          <div>
            <div class="stat-label">Total Units</div>
            <div class="stat-value">${stats.totalUnits}</div>
            <div class="stat-sub">${stats.vacantUnits} vacant</div>
          </div>
          <div class="stat-icon slate">${icon("door")}</div>
        </div>
        <div class="stat-card">
          <div>
            <div class="stat-label">Occupancy</div>
            <div class="stat-value">${stats.occupancyRate}%</div>
            <div class="stat-sub">${stats.occupiedUnits} of ${stats.totalUnits} units</div>
          </div>
          <div class="stat-icon green">${icon("check-circle")}</div>
        </div>
        <div class="stat-card">
          <div><div class="stat-label">Active Leases</div><div class="stat-value">${stats.activeLeases}</div></div>
          <div class="stat-icon brand">${icon("file-text")}</div>
        </div>
        <div class="stat-card">
          <div><div class="stat-label">Revenue This Month</div><div class="stat-value" style="font-size:20px">${formatNaira(stats.revenueThisMonth)}</div></div>
          <div class="stat-icon green">${icon("credit-card")}</div>
        </div>
        <div class="stat-card">
          <div>
            <div class="stat-label">Open Maintenance</div>
            <div class="stat-value" style="color:${stats.openMaintenance > 2 ? "var(--amber-600)" : "inherit"}">${stats.openMaintenance}</div>
          </div>
          <div class="stat-icon ${stats.openMaintenance > 2 ? "amber" : "slate"}">${icon("tool")}</div>
        </div>
      </div>

      <div class="card section">
        <div class="card-header"><h3>Revenue — Last 6 Months</h3></div>
        <div class="chart-bars">${barsHtml(stats.revenueByMonth)}</div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-header"><h3>Recent Payments</h3></div>
          ${recentHtml}
        </div>
        <div class="card">
          <div class="card-header"><h3>Open Maintenance</h3></div>
          ${openHtml}
        </div>
      </div>
    `;
  }

  async function init() {
    const user = await initPage("Dashboard", "landlord");
    if (!user) return;
    root.innerHTML = spinner();

    try {
      const results = await Promise.all([
        getDashboardStats(user.organization_id),
        getPayments(user.organization_id),
        getMaintenance(user.organization_id),
        getLeases(user.organization_id),
        getTenants(user.organization_id),
        getUnits(user.organization_id),
      ]);
      render(user, {
        stats: results[0],
        payments: results[1],
        maintenance: results[2],
        leases: results[3],
        tenants: results[4],
        units: results[5],
      });
    } catch (error) {
      root.innerHTML = errorState(error.message);
    }
  }

  init();
})();
