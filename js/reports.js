(function () {
  const root = document.getElementById("page-root");

  function bars(entries, color, formatter) {
    const max =
      Math.max.apply(
        null,
        entries.map(function (e) {
          return e.value;
        }),
      ) || 1;
    return entries
      .map(function (e) {
        const height = Math.round((e.value / max) * 80);
        return `
        <div class="chart-col">
          <div class="chart-bar-label">${e.value > 0 ? formatter(e.value) : ""}</div>
          <div class="chart-bar" style="height:${height}%;background:${color}" title="${esc(e.label)}: ${formatter(e.value)}"></div>
          <div class="chart-bar-label" style="text-transform:capitalize">${esc(e.label)}</div>
        </div>
      `;
      })
      .join("");
  }

  function shortNaira(value) {
    return "₦" + Math.round(value / 1000) + "k";
  }

  function occupancyRow(label, count, total, fill) {
    const pct = total ? Math.round((count / total) * 100) : 0;
    return `
      <div class="occ-row">
        <div class="occ-row-header"><span class="occ-label">${label}</span><span class="occ-value">${count} / ${total}</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${fill}"></div></div>
      </div>
    `;
  }

  function render(data) {
    const stats = data.stats;
    const totalRevenue = data.payments.reduce(function (sum, p) {
      return sum + Number(p.amount);
    }, 0);

    const statusEntries = ["open", "in_progress", "resolved", "closed"].map(
      function (s) {
        return {
          label: s.replace(/_/g, " "),
          value: data.maintenance.filter(function (m) {
            return m.status === s;
          }).length,
        };
      },
    );

    const methodTotals = {};
    data.payments.forEach(function (p) {
      const key = p.method.replace(/_/g, " ");
      methodTotals[key] = (methodTotals[key] || 0) + Number(p.amount);
    });
    const methodEntries = Object.keys(methodTotals).map(function (key) {
      return { label: key, value: methodTotals[key] };
    });

    const occupied = data.units.filter(function (u) {
      return u.status === "occupied";
    }).length;
    const vacant = data.units.filter(function (u) {
      return u.status === "vacant";
    }).length;
    const underMaintenance = data.units.filter(function (u) {
      return u.status === "under_maintenance";
    }).length;
    const totalUnits = data.units.length;

    root.innerHTML = `
      <div style="margin-bottom:24px">
        <h2 style="font-size:20px;font-weight:600">Reports</h2>
        <p style="font-size:13.5px;color:var(--text-secondary);margin-top:2px">Analytics and insights across your portfolio.</p>
      </div>

      <div class="stats-grid section">
        <div class="stat-card">
          <div><div class="stat-label">Total Revenue</div><div class="stat-value" style="font-size:20px">${formatNaira(totalRevenue)}</div></div>
          <div class="stat-icon green">${icon("credit-card")}</div>
        </div>
        <div class="stat-card">
          <div><div class="stat-label">Occupancy Rate</div><div class="stat-value">${stats.occupancyRate}%</div></div>
          <div class="stat-icon brand">${icon("check-circle")}</div>
        </div>
        <div class="stat-card">
          <div><div class="stat-label">Active Leases</div><div class="stat-value">${stats.activeLeases}</div></div>
          <div class="stat-icon brand">${icon("file-text")}</div>
        </div>
        <div class="stat-card">
          <div><div class="stat-label">Open Maintenance</div><div class="stat-value">${stats.openMaintenance}</div></div>
          <div class="stat-icon amber">${icon("tool")}</div>
        </div>
      </div>

      <div class="card section">
        <div class="card-header"><div><h3>Monthly Revenue</h3><p>Last 6 months</p></div></div>
        <div class="chart-bars">${bars(
          stats.revenueByMonth.map(function (m) {
            return { label: m.month, value: m.revenue };
          }),
          "var(--brand-500)",
          shortNaira,
        )}</div>
      </div>

      <div class="grid-2 section">
        <div class="card">
          <div class="card-header"><h3>Maintenance by Status</h3></div>
          <div class="chart-bars">${bars(
            statusEntries,
            "var(--sky-600)",
            function (v) {
              return String(v);
            },
          )}</div>
        </div>
        <div class="card">
          <div class="card-header"><h3>Revenue by Payment Method</h3></div>
          ${
            methodEntries.length === 0
              ? '<p class="text-secondary text-sm">No payments recorded yet.</p>'
              : `<div class="chart-bars">${bars(methodEntries, "var(--green-600)", shortNaira)}</div>`
          }
        </div>
      </div>

      <div class="card section">
        <div class="card-header"><h3>Occupancy Summary</h3></div>
        ${
          totalUnits === 0
            ? '<p class="text-secondary text-sm">Add units to see occupancy.</p>'
            : occupancyRow(
                "Occupied",
                occupied,
                totalUnits,
                "var(--green-600)",
              ) +
              occupancyRow("Vacant", vacant, totalUnits, "var(--slate-300)") +
              occupancyRow(
                "Under maintenance",
                underMaintenance,
                totalUnits,
                "var(--amber-600)",
              )
        }
      </div>
    `;
  }

  async function init() {
    const user = await initPage("Reports", "landlord");
    if (!user) return;
    root.innerHTML = spinner();

    try {
      const results = await Promise.all([
        getDashboardStats(user.organization_id),
        getPayments(user.organization_id),
        getUnits(user.organization_id),
        getMaintenance(user.organization_id),
      ]);
      render({
        stats: results[0],
        payments: results[1],
        units: results[2],
        maintenance: results[3],
      });
    } catch (error) {
      root.innerHTML = errorState(error.message);
    }
  }

  init();
})();
