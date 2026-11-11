(function () {
  const root = document.getElementById("page-root");

  let user = null;
  let tenants = [];
  let leases = [];
  let units = [];
  let properties = [];
  let editingId = null;

  async function load() {
    const results = await Promise.all([
      getTenants(user.organization_id),
      getLeases(user.organization_id),
      getUnits(user.organization_id),
      getProperties(user.organization_id),
    ]);
    tenants = results[0];
    leases = results[1];
    units = results[2];
    properties = results[3];
  }

  function activeLease(tenantId) {
    return leases.find(function (l) {
      return l.tenant_id === tenantId && l.status === "active";
    });
  }

  function unitLabel(unitId) {
    const unit = units.find(function (u) {
      return u.id === unitId;
    });
    if (!unit) return "—";
    const property = properties.find(function (p) {
      return p.id === unit.property_id;
    });
    return (property ? property.name + " — " : "") + unit.unit_number;
  }

  function statusBadge(t) {
    if (t.status === "invited")
      return '<span class="badge badge-invited">Awaiting sign-up</span>';
    return badge(t.status);
  }

  function rowHtml(t) {
    const lease = activeLease(t.id);
    return `
      <tr class="clickable" data-action="view" data-id="${t.id}">
        <td><div class="flex items-center gap-2">${avatarHtml(t.full_name, "sm")}<strong>${esc(t.full_name)}</strong></div></td>
        <td>${esc(t.email)}</td>
        <td>${esc(t.phone || "—")}</td>
        <td>${statusBadge(t)}</td>
        <td>${lease ? esc(unitLabel(lease.unit_id)) : "—"}</td>
        <td>${lease ? "<strong>" + formatNaira(lease.rent_amount) + "</strong>" : "—"}</td>
        <td>
          <div class="td-actions">
            <button class="btn-icon" data-action="edit" data-id="${t.id}" title="Edit">${icon("edit")}</button>
            ${t.status === "invited" ? `<button class="btn-icon danger" data-action="delete" data-id="${t.id}" title="Remove">${icon("trash")}</button>` : ""}
          </div>
        </td>
      </tr>
    `;
  }

  function render() {
    const body =
      tenants.length === 0
        ? emptyState(
            "users",
            "No tenants yet",
            "Add a tenant, then share the sign-up link so they can create their login.",
            `<button class="btn btn-primary" data-action="add">${icon("plus")} Add Tenant</button>`,
          )
        : `<div class="table-wrap"><table>
          <thead><tr><th>Tenant</th><th>Email</th><th>Phone</th><th>Status</th><th>Unit</th><th>Rent</th><th></th></tr></thead>
          <tbody>${tenants.map(rowHtml).join("")}</tbody>
        </table></div>`;

    root.innerHTML = `
      <div id="flash"></div>
      <div class="page-header">
        <div class="page-header-left">
          <h2>Tenants</h2>
          <p>${tenants.length} tenant${tenants.length === 1 ? "" : "s"}</p>
        </div>
        <div class="filter-bar">
          <button class="btn btn-secondary" data-action="copy-link">Copy sign-up link</button>
          <button class="btn btn-primary" data-action="add">${icon("user-plus")} Add Tenant</button>
        </div>
      </div>

      <div class="auth-note" style="margin:0 0 20px">
        Add a tenant here, then send them the sign-up link. They create their login using the exact email you entered, confirm it, and their lease connects automatically.
      </div>

      ${body}

      <div class="modal-overlay" id="tenant-modal">
        <div class="modal">
          <div class="modal-header">
            <h2 id="tenant-modal-title">Add Tenant</h2>
            <button class="modal-close" onclick="closeModal('tenant-modal')">${icon("x")}</button>
          </div>
          <div class="modal-body">
            <div class="alert alert-error" id="tenant-error" style="display:none"></div>
            <form id="tenant-form">
              <div class="form-group">
                <label class="form-label" for="t-name">Full Name</label>
                <input type="text" id="t-name" class="form-input" placeholder="Ngozi Eze" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="t-email">Email</label>
                <input type="email" id="t-email" class="form-input" placeholder="ngozi@example.com" required />
                <span class="form-hint" id="t-email-hint">The tenant must sign up with this exact email.</span>
              </div>
              <div class="form-group" style="margin-bottom:0">
                <label class="form-label" for="t-phone">Phone (optional)</label>
                <input type="tel" id="t-phone" class="form-input" placeholder="+234 802 000 0000" />
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal('tenant-modal')">Cancel</button>
                <button type="submit" class="btn btn-primary" id="tenant-submit">Add Tenant</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div class="modal-overlay" id="detail-modal">
        <div class="modal">
          <div class="modal-header">
            <h2>Tenant Details</h2>
            <button class="modal-close" onclick="closeModal('detail-modal')">${icon("x")}</button>
          </div>
          <div class="modal-body" id="detail-body"></div>
        </div>
      </div>
    `;
  }

  async function refresh() {
    try {
      await load();
      render();
    } catch (error) {
      root.innerHTML = errorState(error.message);
    }
  }

  function openForm(id) {
    editingId = id;
    const t = id
      ? tenants.find(function (x) {
          return x.id === id;
        })
      : null;
    const emailInput = document.getElementById("t-email");
    document.getElementById("tenant-modal-title").textContent = t
      ? "Edit Tenant"
      : "Add Tenant";
    document.getElementById("tenant-submit").textContent = t
      ? "Save Changes"
      : "Add Tenant";
    document.getElementById("t-name").value = t ? t.full_name : "";
    emailInput.value = t ? t.email : "";
    emailInput.disabled = !!(t && t.status !== "invited");
    document.getElementById("t-email-hint").textContent = emailInput.disabled
      ? "Email cannot be changed after the tenant has signed up."
      : "The tenant must sign up with this exact email.";
    document.getElementById("t-phone").value = t ? t.phone || "" : "";
    clearFormError("tenant-error");
    closeModal("detail-modal");
    openModal("tenant-modal");
  }

  function openDetail(id) {
    const t = tenants.find(function (x) {
      return x.id === id;
    });
    if (!t) return;
    const lease = activeLease(id);

    const leaseBlock = lease
      ? `
      <div style="margin-top:16px">
        <div class="text-xs text-muted font-semibold" style="text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Active lease</div>
        <div style="border:1px solid var(--border);border-radius:var(--radius-lg);padding:4px 12px">
          <div class="info-row"><span class="info-label">Unit</span><span class="info-value">${esc(unitLabel(lease.unit_id))}</span></div>
          <div class="info-row"><span class="info-label">Rent</span><span class="info-value">${formatNaira(lease.rent_amount)} / ${esc(lease.rent_frequency)}</span></div>
          <div class="info-row"><span class="info-label">Period</span><span class="info-value">${formatDate(lease.start_date)} → ${formatDate(lease.end_date)}</span></div>
          <div class="info-row"><span class="info-label">Deposit</span><span class="info-value">${formatNaira(lease.security_deposit)}</span></div>
        </div>
      </div>`
      : '<p class="text-secondary text-sm" style="margin-top:16px">No active lease for this tenant yet.</p>';

    document.getElementById("detail-body").innerHTML = `
      <div class="flex items-center gap-3" style="margin-bottom:16px">
        ${avatarHtml(t.full_name, "lg")}
        <div>
          <div style="font-size:15px;font-weight:600">${esc(t.full_name)}</div>
          <div style="margin-top:4px">${statusBadge(t)}</div>
        </div>
      </div>
      <div style="background:var(--slate-50);border-radius:var(--radius-lg);padding:12px;display:flex;flex-direction:column;gap:10px;font-size:13px">
        <div class="flex items-center gap-2">${icon("mail")}<span>${esc(t.email)}</span></div>
        <div class="flex items-center gap-2">${icon("phone")}<span>${esc(t.phone || "Not provided")}</span></div>
      </div>
      ${leaseBlock}
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal('detail-modal')">Close</button>
        <button class="btn btn-primary" data-action="edit" data-id="${t.id}">${icon("edit")} Edit</button>
      </div>
    `;
    openModal("detail-modal");
  }

  async function save() {
    const button = document.getElementById("tenant-submit");
    clearFormError("tenant-error");

    const data = {
      full_name: document.getElementById("t-name").value.trim(),
      email: document.getElementById("t-email").value.trim().toLowerCase(),
      phone: document.getElementById("t-phone").value.trim(),
    };

    if (!data.full_name) {
      showFormError("tenant-error", "Enter the tenant's full name.");
      return;
    }
    if (!data.email) {
      showFormError("tenant-error", "Enter the tenant's email address.");
      return;
    }

    setButtonBusy(button, true, "Saving...");
    const wasEditing = !!editingId;

    try {
      if (wasEditing) await updateTenant(editingId, data);
      else await createTenant(data);
      closeModal("tenant-modal");
      await refresh();
      flash(
        wasEditing
          ? "Tenant updated."
          : "Tenant added. Ask them to create their account on the tenant sign-up page using " +
              data.email +
              ".",
        "success",
      );
    } catch (error) {
      showFormError("tenant-error", error.message);
      setButtonBusy(button, false);
    }
  }

  function remove(id) {
    const t = tenants.find(function (x) {
      return x.id === id;
    });
    if (!t) return;
    confirmDelete(
      'Remove "' + t.full_name + '"? They have not signed up yet.',
      async function () {
        try {
          await deleteTenant(id);
          await refresh();
          flash("Tenant removed.", "success");
        } catch (error) {
          flash(error.message);
        }
      },
    );
  }

  root.addEventListener("click", async function (e) {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    if (action === "add") openForm(null);
    else if (action === "edit") openForm(el.dataset.id);
    else if (action === "view") openDetail(el.dataset.id);
    else if (action === "delete") remove(el.dataset.id);
    else if (action === "copy-link") {
      const link = pageUrl("tenant-signup.html");
      const copied = await copyText(link);
      flash(
        copied ? "Sign-up link copied." : "Copy this link: " + link,
        copied ? "success" : "error",
      );
    }
  });

  root.addEventListener("submit", function (e) {
    if (e.target.id !== "tenant-form") return;
    e.preventDefault();
    save();
  });

  (async function init() {
    user = await initPage("Tenants", "landlord");
    if (!user) return;
    root.innerHTML = spinner();
    await refresh();
  })();
})();
