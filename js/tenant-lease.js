(function () {
  const root = document.getElementById("page-root");
  const TYPE_LABELS = {
    lease_agreement: "Lease agreement",
    receipt: "Receipt",
    notice: "Notice",
    id_verification: "ID verification",
    other: "Other",
  };

  let documents = [];

  function bannerFor(lease, daysLeft) {
    if (lease.status !== "active") {
      return {
        tone: "warning",
        title: "Your lease is " + lease.status,
        sub: "Contact your landlord if you think this is wrong.",
      };
    }
    if (daysLeft <= 0) {
      return {
        tone: "danger",
        title: "Your lease has ended",
        sub:
          "Ended " +
          formatDate(lease.end_date, {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
      };
    }
    const tone =
      daysLeft < 30 ? "danger" : daysLeft < 90 ? "warning" : "success";
    return {
      tone: tone,
      title: daysLeft + " days remaining on your lease",
      sub:
        "Expires " +
        formatDate(lease.end_date, {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
    };
  }

  function scheduleHtml(lease, payments) {
    const schedule = rentSchedule(lease);
    if (schedule.length === 0)
      return '<p class="text-secondary text-sm">No rent schedule available.</p>';

    const rent = Number(lease.rent_amount);
    const paid = totalPaid(payments);
    const today = startOfToday();

    const rows = schedule
      .map(function (due, i) {
        let label = "Upcoming";
        let cls = "badge-default";
        if (paid >= rent * (i + 1)) {
          label = "Paid";
          cls = "badge-resolved";
        } else if (due <= today) {
          const partial = paid > rent * i;
          label = partial ? "Part paid" : "Unpaid";
          cls = partial ? "badge-high" : "badge-urgent";
        }
        return `<tr><td>${formatLocalDate(due)}</td><td>${formatNaira(rent)}</td><td><span class="badge ${cls}">${label}</span></td></tr>`;
      })
      .join("");

    return `
      <div class="table-wrap" style="max-height:320px;overflow-y:auto">
        <table>
          <thead><tr><th>Due date</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  function documentsHtml(docs) {
    if (docs.length === 0)
      return '<p class="text-secondary text-sm">No documents have been added to your lease yet.</p>';
    return docs
      .map(function (d) {
        return `
        <div class="flex items-center justify-between" style="padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-lg);margin-bottom:8px">
          <div class="flex items-center gap-3" style="min-width:0">
            <div class="doc-icon" style="width:32px;height:32px">${icon("file-text")}</div>
            <div style="min-width:0">
              <div class="truncate" style="font-size:13px;font-weight:500">${esc(d.file_name)}</div>
              <div class="text-xs text-muted">${esc(TYPE_LABELS[d.document_type] || d.document_type)} · ${formatBytes(d.file_size_bytes)}</div>
            </div>
          </div>
          <button class="btn btn-sm btn-secondary" data-action="download" data-id="${d.id}">${icon("download")} Download</button>
        </div>
      `;
      })
      .join("");
  }

  function render(data) {
    const lease = data.lease;
    const unit = data.unit;
    const property = unit ? unit.property : null;
    const today = startOfToday();
    const start = parseDate(lease.start_date);
    const end = parseDate(lease.end_date);
    const daysLeft = Math.ceil((end - today) / 86400000);
    const progress = Math.min(
      100,
      Math.max(0, ((today - start) / (end - start)) * 100),
    );
    const banner = bannerFor(lease, daysLeft);
    const summary = rentSummary(lease, data.payments);

    root.innerHTML = `
      <div id="flash"></div>
      <div style="margin-bottom:24px">
        <h2 style="font-size:20px;font-weight:600">My Lease</h2>
        <p style="font-size:13.5px;color:var(--text-secondary);margin-top:2px">Your lease agreement details.</p>
      </div>

      <div class="status-banner ${banner.tone}">
        <div>
          <div class="status-banner-title">${esc(banner.title)}</div>
          <div class="status-banner-sub">${esc(banner.sub)}</div>
        </div>
        ${badge(lease.status)}
      </div>

      <div class="card section">
        <div class="card-header">
          <h3>Lease Progress</h3>
          <span class="text-xs text-muted">${progress.toFixed(0)}% elapsed</span>
        </div>
        <div class="progress-bar"><div class="progress-fill brand" style="width:${progress.toFixed(1)}%"></div></div>
        <div class="flex justify-between text-xs text-muted" style="margin-top:6px">
          <span>${formatDate(lease.start_date)}</span>
          <span>${formatDate(lease.end_date)}</span>
        </div>
      </div>

      <div class="grid-2 section">
        <div class="card">
          <div class="card-header"><h3>Property & Unit</h3></div>
          <div class="info-row"><span class="info-label">Landlord</span><span class="info-value">${esc(data.organization ? data.organization.name : "—")}</span></div>
          <div class="info-row"><span class="info-label">Property</span><span class="info-value">${esc(property ? property.name : "—")}</span></div>
          <div class="info-row"><span class="info-label">Address</span><span class="info-value">${esc(property ? property.address_line1 : "—")}</span></div>
          <div class="info-row"><span class="info-label">City</span><span class="info-value">${esc(property ? property.city + (property.state ? ", " + property.state : "") : "—")}</span></div>
          <div class="info-row"><span class="info-label">Unit</span><span class="info-value">${esc(unit ? unit.unit_number : "—")}</span></div>
          <div class="info-row"><span class="info-label">Floor</span><span class="info-value">${esc(unit && unit.floor ? unit.floor : "—")}</span></div>
          <div class="info-row"><span class="info-label">Size</span><span class="info-value">${unit && unit.size_sqft ? Number(unit.size_sqft).toLocaleString() + " sqft" : "—"}</span></div>
        </div>

        <div class="card">
          <div class="card-header"><h3>Financial Details</h3></div>
          <div class="info-row"><span class="info-label">Rent</span><span class="info-value" style="color:var(--brand-600);font-weight:600">${formatNaira(lease.rent_amount)}</span></div>
          <div class="info-row"><span class="info-label">Frequency</span><span class="info-value capitalize">${esc(lease.rent_frequency)}</span></div>
          <div class="info-row"><span class="info-label">Security deposit</span><span class="info-value">${formatNaira(lease.security_deposit)}</span></div>
          <div class="info-row"><span class="info-label">Total paid</span><span class="info-value">${formatNaira(summary.paid)}</span></div>
          <div class="info-row"><span class="info-label">Start date</span><span class="info-value">${formatDate(lease.start_date)}</span></div>
          <div class="info-row"><span class="info-label">End date</span><span class="info-value">${formatDate(lease.end_date)}</span></div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-header"><div><h3>Rent Schedule</h3><p>Based on your lease dates and recorded payments</p></div></div>
          ${scheduleHtml(lease, data.payments)}
        </div>
        <div class="card">
          <div class="card-header"><h3>Lease Documents</h3></div>
          ${documentsHtml(documents)}
        </div>
      </div>
    `;
  }

  root.addEventListener("click", async function (e) {
    const el = e.target.closest('[data-action="download"]');
    if (!el) return;
    const doc = documents.find(function (d) {
      return d.id === el.dataset.id;
    });
    if (!doc) return;
    try {
      await downloadDocument(doc);
    } catch (error) {
      flash(error.message);
    }
  });

  async function init() {
    const user = await initPage("My Lease", "tenant");
    if (!user) return;
    root.innerHTML = spinner();

    try {
      const lease = await getCurrentLeaseForTenant(user.id);
      if (!lease) {
        root.innerHTML = emptyState(
          "file-text",
          "No lease found",
          "Your landlord has not created a lease for you yet.",
        );
        return;
      }

      const results = await Promise.all([
        getPaymentsForLease(lease.id),
        getUnitWithProperty(lease.unit_id),
        getOrganization(lease.organization_id),
        getDocumentsForTenant(),
      ]);

      documents = results[3].filter(function (d) {
        return d.lease_id === lease.id;
      });
      render({
        lease: lease,
        payments: results[0],
        unit: results[1],
        organization: results[2],
      });
    } catch (error) {
      root.innerHTML = errorState(error.message);
    }
  }

  init();
})();
