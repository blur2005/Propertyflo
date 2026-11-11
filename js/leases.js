(function () {
  const root = document.getElementById("page-root");
  const STATUSES = [
    { value: "active", label: "Active" },
    { value: "pending", label: "Pending" },
    { value: "expired", label: "Expired" },
    { value: "terminated", label: "Terminated" },
  ];
  const FREQUENCIES = [
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "annually", label: "Annually" },
  ];

  let user = null;
  let leases = [];
  let units = [];
  let properties = [];
  let tenants = [];
  let editingId = null;

  async function load() {
    const results = await Promise.all([
      getLeases(user.organization_id),
      getUnits(user.organization_id),
      getProperties(user.organization_id),
      getTenants(user.organization_id),
    ]);
    leases = results[0];
    units = results[1];
    properties = results[2];
    tenants = results[3];
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

  function tenantName(id) {
    const t = tenants.find(function (x) {
      return x.id === id;
    });
    return t ? t.full_name : "—";
  }

  function optionsFor(items, valueOf, labelOf) {
    return selectOptions(items, valueOf, labelOf);
  }

  function render() {
    const body =
      leases.length === 0
        ? emptyState(
            "file-text",
            "No leases yet",
            "Create a lease to link a tenant to a unit.",
            `<button class="btn btn-primary" data-action="add">${icon("plus")} New Lease</button>`,
          )
        : `<div class="table-wrap"><table>
          <thead><tr><th>Tenant</th><th>Unit</th><th>Rent</th><th>Frequency</th><th>Period</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${leases
              .map(function (l) {
                return `
                <tr>
                  <td><strong>${esc(tenantName(l.tenant_id))}</strong></td>
                  <td>${esc(unitLabel(l.unit_id))}</td>
                  <td><strong>${formatNaira(l.rent_amount)}</strong></td>
                  <td class="capitalize">${esc(l.rent_frequency)}</td>
                  <td>${formatDate(l.start_date)} → ${formatDate(l.end_date)}</td>
                  <td>${badge(l.status)}</td>
                  <td>
                    <div class="td-actions">
                      <button class="btn-icon" data-action="edit" data-id="${l.id}" title="Edit">${icon("edit")}</button>
                      <button class="btn-icon danger" data-action="delete" data-id="${l.id}" title="Delete">${icon("trash")}</button>
                    </div>
                  </td>
                </tr>
              `;
              })
              .join("")}
          </tbody>
        </table></div>`;

    root.innerHTML = `
      <div id="flash"></div>
      <div class="page-header">
        <div class="page-header-left">
          <h2>Leases</h2>
          <p>${leases.length} lease${leases.length === 1 ? "" : "s"}</p>
        </div>
        <button class="btn btn-primary" data-action="add">${icon("plus")} New Lease</button>
      </div>
      ${body}

      <div class="modal-overlay" id="lease-modal">
        <div class="modal modal-lg">
          <div class="modal-header">
            <h2 id="lease-modal-title">New Lease</h2>
            <button class="modal-close" onclick="closeModal('lease-modal')">${icon("x")}</button>
          </div>
          <div class="modal-body">
            <div class="alert alert-error" id="lease-error" style="display:none"></div>
            <form id="lease-form">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="l-unit">Unit</label>
                  <select id="l-unit" class="form-select" required>
                    <option value="">Select unit</option>
                    ${optionsFor(
                      units,
                      function (u) {
                        return u.id;
                      },
                      function (u) {
                        return unitLabel(u.id);
                      },
                    )}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="l-tenant">Tenant</label>
                  <select id="l-tenant" class="form-select" required>
                    <option value="">Select tenant</option>
                    ${optionsFor(
                      tenants,
                      function (t) {
                        return t.id;
                      },
                      function (t) {
                        return t.full_name;
                      },
                    )}
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="l-start">Start Date</label>
                  <input type="date" id="l-start" class="form-input" required />
                </div>
                <div class="form-group">
                  <label class="form-label" for="l-end">End Date</label>
                  <input type="date" id="l-end" class="form-input" required />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="l-rent">Rent Amount (₦)</label>
                  <input type="number" id="l-rent" class="form-input" placeholder="450000" min="1" step="any" required />
                </div>
                <div class="form-group">
                  <label class="form-label" for="l-freq">Frequency</label>
                  <select id="l-freq" class="form-select">${FREQUENCIES.map(
                    function (f) {
                      return (
                        '<option value="' +
                        f.value +
                        '">' +
                        f.label +
                        "</option>"
                      );
                    },
                  ).join("")}</select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group" style="margin-bottom:0">
                  <label class="form-label" for="l-deposit">Security Deposit (₦)</label>
                  <input type="number" id="l-deposit" class="form-input" placeholder="900000" min="0" step="any" />
                </div>
                <div class="form-group" style="margin-bottom:0">
                  <label class="form-label" for="l-status">Status</label>
                  <select id="l-status" class="form-select">${STATUSES.map(
                    function (s) {
                      return (
                        '<option value="' +
                        s.value +
                        '">' +
                        s.label +
                        "</option>"
                      );
                    },
                  ).join("")}</select>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal('lease-modal')">Cancel</button>
                <button type="submit" class="btn btn-primary" id="lease-submit">Create Lease</button>
              </div>
            </form>
          </div>
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
    if (!id && (units.length === 0 || tenants.length === 0)) {
      flash("Add at least one unit and one tenant before creating a lease.");
      return;
    }
    editingId = id;
    const l = id
      ? leases.find(function (x) {
          return x.id === id;
        })
      : null;
    document.getElementById("lease-modal-title").textContent = l
      ? "Edit Lease"
      : "New Lease";
    document.getElementById("lease-submit").textContent = l
      ? "Save Changes"
      : "Create Lease";
    document.getElementById("l-unit").value = l ? l.unit_id : "";
    document.getElementById("l-tenant").value = l ? l.tenant_id : "";
    document.getElementById("l-start").value = l ? l.start_date : "";
    document.getElementById("l-end").value = l ? l.end_date : "";
    document.getElementById("l-rent").value = l ? l.rent_amount : "";
    document.getElementById("l-freq").value = l ? l.rent_frequency : "monthly";
    document.getElementById("l-deposit").value =
      l && l.security_deposit ? l.security_deposit : "";
    document.getElementById("l-status").value = l ? l.status : "active";
    clearFormError("lease-error");
    openModal("lease-modal");
  }

  async function save() {
    const button = document.getElementById("lease-submit");
    clearFormError("lease-error");

    const data = {
      unit_id: document.getElementById("l-unit").value,
      tenant_id: document.getElementById("l-tenant").value,
      start_date: document.getElementById("l-start").value,
      end_date: document.getElementById("l-end").value,
      rent_amount: parseFloat(document.getElementById("l-rent").value),
      rent_frequency: document.getElementById("l-freq").value,
      security_deposit:
        parseFloat(document.getElementById("l-deposit").value) || 0,
      status: document.getElementById("l-status").value,
    };

    if (!data.unit_id || !data.tenant_id) {
      showFormError("lease-error", "Choose a unit and a tenant.");
      return;
    }
    if (
      !data.start_date ||
      !data.end_date ||
      data.end_date <= data.start_date
    ) {
      showFormError(
        "lease-error",
        "The end date must be after the start date.",
      );
      return;
    }
    if (!(data.rent_amount > 0)) {
      showFormError("lease-error", "Enter a rent amount greater than zero.");
      return;
    }

    setButtonBusy(button, true, "Saving...");

    try {
      if (editingId) await updateLease(editingId, data);
      else
        await createLease({ ...data, organization_id: user.organization_id });
      closeModal("lease-modal");
      await refresh();
      flash("Lease saved.", "success");
    } catch (error) {
      showFormError("lease-error", error.message);
      setButtonBusy(button, false);
    }
  }

  function remove(id) {
    const l = leases.find(function (x) {
      return x.id === id;
    });
    if (!l) return;
    confirmDelete(
      'Delete the lease for "' +
        tenantName(l.tenant_id) +
        '"? Payment records are kept.',
      async function () {
        try {
          await deleteLease(id);
          await refresh();
          flash("Lease deleted.", "success");
        } catch (error) {
          flash(error.message);
        }
      },
    );
  }

  root.addEventListener("click", function (e) {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    if (action === "add") openForm(null);
    else if (action === "edit") openForm(el.dataset.id);
    else if (action === "delete") remove(el.dataset.id);
  });

  root.addEventListener("submit", function (e) {
    if (e.target.id !== "lease-form") return;
    e.preventDefault();
    save();
  });

  (async function init() {
    user = await initPage("Leases", "landlord");
    if (!user) return;
    root.innerHTML = spinner();
    await refresh();
  })();
})();
