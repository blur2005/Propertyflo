(function () {
  const root = document.getElementById("page-root");
  const METHODS = [
    { value: "bank_transfer", label: "Bank transfer" },
    { value: "cash", label: "Cash" },
    { value: "card", label: "Card" },
    { value: "cheque", label: "Cheque" },
    { value: "other", label: "Other" },
  ];

  let user = null;
  let payments = [];
  let leases = [];
  let tenants = [];
  let units = [];

  async function load() {
    const results = await Promise.all([
      getPayments(user.organization_id),
      getLeases(user.organization_id),
      getTenants(user.organization_id),
      getUnits(user.organization_id),
    ]);
    payments = results[0];
    leases = results[1];
    tenants = results[2];
    units = results[3];
  }

  function tenantName(leaseId) {
    const lease = leases.find(function (l) {
      return l.id === leaseId;
    });
    if (!lease) return "Former lease";
    const tenant = tenants.find(function (t) {
      return t.id === lease.tenant_id;
    });
    return tenant ? tenant.full_name : "—";
  }

  function unitNumber(leaseId) {
    const lease = leases.find(function (l) {
      return l.id === leaseId;
    });
    if (!lease) return "—";
    const unit = units.find(function (u) {
      return u.id === lease.unit_id;
    });
    return unit ? unit.unit_number : "—";
  }

  function activeLeases() {
    return leases.filter(function (l) {
      return l.status === "active";
    });
  }

  function leaseLabel(l) {
    return (
      tenantName(l.id) +
      " — " +
      unitNumber(l.id) +
      " — " +
      formatNaira(l.rent_amount)
    );
  }

  function render() {
    const total = payments.reduce(function (sum, p) {
      return sum + Number(p.amount);
    }, 0);

    const body =
      payments.length === 0
        ? emptyState(
            "credit-card",
            "No payments recorded",
            "Record your first rent payment.",
            `<button class="btn btn-primary" data-action="add">${icon("plus")} Record Payment</button>`,
          )
        : `<div class="table-wrap"><table>
          <thead><tr><th>Tenant</th><th>Unit</th><th>Date</th><th>Amount</th><th>Method</th><th>Notes</th><th></th></tr></thead>
          <tbody>
            ${payments
              .map(function (p) {
                return `
                <tr>
                  <td><strong>${esc(tenantName(p.lease_id))}</strong></td>
                  <td>${esc(unitNumber(p.lease_id))}</td>
                  <td>${formatDate(p.payment_date)}</td>
                  <td><strong style="color:var(--green-600)">${formatNaira(p.amount)}</strong></td>
                  <td>${badge(p.method)}</td>
                  <td class="text-secondary truncate" style="max-width:200px">${esc(p.notes || "—")}</td>
                  <td><button class="btn-icon danger" data-action="delete" data-id="${p.id}" title="Delete">${icon("trash")}</button></td>
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
          <h2>Payments</h2>
          <p>${payments.length} record${payments.length === 1 ? "" : "s"} &nbsp;·&nbsp; Total ${formatNaira(total)}</p>
        </div>
        <button class="btn btn-primary" data-action="add">${icon("plus")} Record Payment</button>
      </div>
      ${body}

      <div class="modal-overlay" id="pay-modal">
        <div class="modal">
          <div class="modal-header">
            <h2>Record Payment</h2>
            <button class="modal-close" onclick="closeModal('pay-modal')">${icon("x")}</button>
          </div>
          <div class="modal-body">
            <div class="alert alert-error" id="pay-error" style="display:none"></div>
            <form id="pay-form">
              <div class="form-group">
                <label class="form-label" for="pay-lease">Lease</label>
                <select id="pay-lease" class="form-select" required>
                  <option value="">Select lease</option>
                  ${selectOptions(
                    activeLeases(),
                    function (l) {
                      return l.id;
                    },
                    leaseLabel,
                  )}
                </select>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="pay-amount">Amount (₦)</label>
                  <input type="number" id="pay-amount" class="form-input" placeholder="450000" min="1" step="any" required />
                </div>
                <div class="form-group">
                  <label class="form-label" for="pay-date">Payment Date</label>
                  <input type="date" id="pay-date" class="form-input" required />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="pay-method">Payment Method</label>
                <select id="pay-method" class="form-select">${METHODS.map(
                  function (m) {
                    return (
                      '<option value="' + m.value + '">' + m.label + "</option>"
                    );
                  },
                ).join("")}</select>
              </div>
              <div class="form-group" style="margin-bottom:0">
                <label class="form-label" for="pay-notes">Notes (optional)</label>
                <input type="text" id="pay-notes" class="form-input" placeholder="April rent" />
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal('pay-modal')">Cancel</button>
                <button type="submit" class="btn btn-primary" id="pay-submit">Record Payment</button>
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

  function openForm() {
    if (activeLeases().length === 0) {
      flash("Create an active lease before recording a payment.");
      return;
    }
    document.getElementById("pay-form").reset();
    document.getElementById("pay-date").value = toDateString(new Date());
    document.getElementById("pay-method").value = "bank_transfer";
    clearFormError("pay-error");
    openModal("pay-modal");
  }

  async function save() {
    const button = document.getElementById("pay-submit");
    clearFormError("pay-error");

    const data = {
      lease_id: document.getElementById("pay-lease").value,
      amount: parseFloat(document.getElementById("pay-amount").value),
      payment_date: document.getElementById("pay-date").value,
      method: document.getElementById("pay-method").value,
      notes: document.getElementById("pay-notes").value.trim() || null,
    };

    if (!data.lease_id) {
      showFormError("pay-error", "Choose a lease.");
      return;
    }
    if (!(data.amount > 0)) {
      showFormError("pay-error", "Enter an amount greater than zero.");
      return;
    }
    if (!data.payment_date) {
      showFormError("pay-error", "Choose the payment date.");
      return;
    }

    setButtonBusy(button, true, "Saving...");

    try {
      await recordPayment({ ...data, organization_id: user.organization_id });
      closeModal("pay-modal");
      await refresh();
      flash("Payment recorded. The tenant has been notified.", "success");
    } catch (error) {
      showFormError("pay-error", error.message);
      setButtonBusy(button, false);
    }
  }

  function remove(id) {
    const p = payments.find(function (x) {
      return x.id === id;
    });
    if (!p) return;
    confirmDelete(
      "Delete the payment of " +
        formatNaira(p.amount) +
        " from " +
        tenantName(p.lease_id) +
        "?",
      async function () {
        try {
          await deletePayment(id);
          await refresh();
          flash("Payment deleted.", "success");
        } catch (error) {
          flash(error.message);
        }
      },
    );
  }

  root.addEventListener("click", function (e) {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    if (el.dataset.action === "add") openForm();
    else if (el.dataset.action === "delete") remove(el.dataset.id);
  });

  root.addEventListener("change", function (e) {
    if (e.target.id !== "pay-lease") return;
    const lease = leases.find(function (l) {
      return l.id === e.target.value;
    });
    const amount = document.getElementById("pay-amount");
    if (lease && !amount.value) amount.value = lease.rent_amount;
  });

  root.addEventListener("submit", function (e) {
    if (e.target.id !== "pay-form") return;
    e.preventDefault();
    save();
  });

  (async function init() {
    user = await initPage("Payments", "landlord");
    if (!user) return;
    root.innerHTML = spinner();
    await refresh();
  })();
})();
