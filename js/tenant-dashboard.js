(function () {
  const root = document.getElementById("page-root");

  function statCard(label, value, sub, iconName, tone, color) {
    return `
      <div class="stat-card">
        <div>
          <div class="stat-label">${label}</div>
          <div class="stat-value" style="font-size:20px${color ? ";color:" + color : ""}">${value}</div>
          <div class="stat-sub">${sub}</div>
        </div>
        <div class="stat-icon ${tone}">${icon(iconName)}</div>
      </div>
    `;
  }

  function noLeaseHtml(user) {
    return `
      <div style="margin-bottom:24px">
        <h2 style="font-size:20px;font-weight:600">Welcome, ${esc(user.full_name.split(" ")[0])}</h2>
      </div>
      <div class="card">
        ${emptyState("alert-circle", "No lease found", "Your landlord has not created a lease for you yet. Once they do, your rent, payments and documents will appear here.")}
      </div>
    `;
  }

  function render(user, data) {
    const lease = data.lease;
    const summary = rentSummary(lease, data.payments);
    const today = startOfToday();
    const start = parseDate(lease.start_date);
    const end = parseDate(lease.end_date);
    const daysLeft = Math.ceil((end - today) / 86400000);
    const progress = Math.min(
      100,
      Math.max(0, ((today - start) / (end - start)) * 100),
    );
    const openRequests = data.requests.filter(function (r) {
      return r.status === "open" || r.status === "in_progress";
    }).length;
    const unit = data.unit;
    const property = unit ? unit.property : null;

    let balanceValue = formatNaira(Math.abs(summary.balance));
    let balanceSub = "paid up";
    let balanceColor = "var(--green-600)";
    if (summary.balance > 0) {
      balanceSub = "outstanding";
      balanceColor = "var(--red-600)";
    } else if (summary.balance < 0) {
      balanceSub = "prepaid credit";
    } else if (summary.periodsDue === 0 && summary.paid === 0) {
      balanceSub = "no rent due yet";
      balanceColor = "";
    }

    const banner =
      summary.balance > 0
        ? `
      <div class="status-banner warning">
        <div>
          <div class="status-banner-title">Outstanding balance: ${formatNaira(summary.balance)}</div>
          <div class="status-banner-sub">Calculated from your lease schedule and the payments your landlord has recorded.</div>
        </div>
      </div>
    `
        : "";

    const paymentsHtml =
      data.payments.length === 0
        ? '<p class="text-secondary text-sm">No payments recorded yet.</p>'
        : data.payments
            .slice(0, 5)
            .map(function (p) {
              return `
            <div class="flex items-center justify-between" style="padding:10px 0;border-bottom:1px solid var(--slate-100)">
              <div>
                <div style="font-size:13px;font-weight:500">${esc(p.notes || "Rent payment")}</div>
                <div class="text-xs text-muted">${formatDate(p.payment_date)} · ${esc(p.method.replace(/_/g, " "))}</div>
              </div>
              <div style="font-size:13px;font-weight:600;color:var(--green-600)">${formatNaira(p.amount)}</div>
            </div>
          `;
            })
            .join("");

    const announcementsHtml =
      data.announcements.length === 0
        ? '<p class="text-secondary text-sm">No announcements.</p>'
        : data.announcements
            .slice(0, 3)
            .map(function (a) {
              return `
            <div style="padding:10px 0;border-bottom:1px solid var(--slate-100)">
              <div style="font-size:13px;font-weight:500">${esc(a.title)}</div>
              <div class="ann-text" style="margin-top:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(a.body)}</div>
              <div class="text-xs text-muted" style="margin-top:4px">${formatDate(a.created_at)}</div>
            </div>
          `;
            })
            .join("");

    root.innerHTML = `
      <div style="margin-bottom:24px">
        <h2 style="font-size:20px;font-weight:600">Welcome, ${esc(user.full_name.split(" ")[0])}</h2>
        <p style="font-size:13.5px;color:var(--text-secondary);margin-top:2px">Here's an overview of your tenancy.</p>
      </div>

      ${banner}

      <div class="stats-grid section">
        ${statCard("Rent", formatNaira(lease.rent_amount), esc(lease.rent_frequency), "credit-card", "brand")}
        ${statCard("Balance", balanceValue, balanceSub, "check-circle", summary.balance > 0 ? "red" : "green", balanceColor)}
        ${statCard("Next Rent Due", summary.nextDue ? formatLocalDate(summary.nextDue) : "—", summary.nextDue ? formatNaira(lease.rent_amount) : "none scheduled", "calendar", "slate")}
        ${statCard("Open Requests", openRequests, "maintenance", "tool", openRequests > 0 ? "amber" : "slate")}
        ${statCard("Lease Ends In", daysLeft > 0 ? daysLeft + " days" : "Ended", formatDate(lease.end_date), "file-text", "slate", daysLeft > 0 && daysLeft < 60 ? "var(--red-600)" : "")}
      </div>

      <div class="card section">
        <div class="card-header">
          <h3>Lease Period</h3>
          <span class="text-xs text-muted">${formatDate(lease.start_date)} → ${formatDate(lease.end_date)}</span>
        </div>
        <div class="progress-bar"><div class="progress-fill brand" style="width:${progress.toFixed(1)}%"></div></div>
        <div class="flex justify-between text-xs text-muted" style="margin-top:6px">
          <span>Started ${formatDate(lease.start_date)}</span>
          <span>${progress.toFixed(0)}% elapsed</span>
          <span>Ends ${formatDate(lease.end_date)}</span>
        </div>
      </div>

      <div class="grid-2 section">
        <div class="card">
          <div class="card-header"><h3>My Lease</h3></div>
          <div class="info-row"><span class="info-label">Landlord</span><span class="info-value">${esc(data.organization ? data.organization.name : "—")}</span></div>
          <div class="info-row"><span class="info-label">Property</span><span class="info-value">${esc(property ? property.name : "—")}</span></div>
          <div class="info-row"><span class="info-label">Unit</span><span class="info-value">${esc(unit ? unit.unit_number : "—")}</span></div>
          <div class="info-row"><span class="info-label">Address</span><span class="info-value">${esc(property ? property.address_line1 + ", " + property.city : "—")}</span></div>
          <div class="info-row"><span class="info-label">Status</span><span class="info-value">${badge(lease.status)}</span></div>
        </div>
        <div class="card">
          <div class="card-header"><h3>Announcements</h3></div>
          ${announcementsHtml}
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3>Recent Payments</h3><a href="payments.html" class="text-brand text-sm font-medium">View all</a></div>
        ${paymentsHtml}
      </div>
    `;
  }

  async function init() {
    const user = await initPage("Dashboard", "tenant");
    if (!user) return;
    root.innerHTML = spinner();

    try {
      const lease = await getCurrentLeaseForTenant(user.id);
      if (!lease) {
        root.innerHTML = noLeaseHtml(user);
        return;
      }

      const results = await Promise.all([
        getPaymentsForLease(lease.id),
        getMaintenanceForTenant(user.id),
        getAnnouncementsForTenant(),
        getUnitWithProperty(lease.unit_id),
        getOrganization(lease.organization_id),
      ]);

      render(user, {
        lease: lease,
        payments: results[0],
        requests: results[1],
        announcements: results[2],
        unit: results[3],
        organization: results[4],
      });
    } catch (error) {
      root.innerHTML = errorState(error.message);
    }
  }

  init();
})();
