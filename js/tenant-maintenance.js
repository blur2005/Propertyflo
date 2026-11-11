(function () {
  const root = document.getElementById("page-root");
  const PRIORITIES = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ];

  let user = null;
  let lease = null;
  let requests = [];

  function canSubmit() {
    return !!lease && lease.status === "active";
  }

  function render() {
    const body =
      requests.length === 0
        ? emptyState(
            "tool",
            "No requests yet",
            "Submit a request and your landlord will be notified.",
            canSubmit()
              ? `<button class="btn btn-primary" data-action="add">${icon("plus")} Submit Request</button>`
              : "",
          )
        : `<div class="table-wrap"><table>
          <thead><tr><th>Title</th><th>Priority</th><th>Status</th><th>Submitted</th><th>Resolved</th></tr></thead>
          <tbody>
            ${requests
              .map(function (r) {
                return `
                <tr class="clickable" data-action="view" data-id="${r.id}">
                  <td><strong>${esc(r.title)}</strong></td>
                  <td>${badge(r.priority)}</td>
                  <td>${badge(r.status)}</td>
                  <td>${formatDate(r.created_at)}</td>
                  <td>${r.resolved_at ? formatDate(r.resolved_at) : "—"}</td>
                </tr>
              `;
              })
              .join("")}
          </tbody>
        </table></div>`;

    const notice = canSubmit()
      ? ""
      : `
      <div class="alert alert-error">${lease ? "Requests can only be submitted while your lease is active." : "You need a lease before you can submit maintenance requests."}</div>
    `;

    root.innerHTML = `
      <div id="flash"></div>
      <div class="page-header">
        <div class="page-header-left">
          <h2>Maintenance Requests</h2>
          <p>${requests.length} request${requests.length === 1 ? "" : "s"}</p>
        </div>
        ${canSubmit() ? `<button class="btn btn-primary" data-action="add">${icon("plus")} Submit Request</button>` : ""}
      </div>
      ${notice}
      ${body}

      <div class="modal-overlay" id="add-modal">
        <div class="modal">
          <div class="modal-header">
            <h2>Submit Maintenance Request</h2>
            <button class="modal-close" onclick="closeModal('add-modal')">${icon("x")}</button>
          </div>
          <div class="modal-body">
            <div class="alert alert-error" id="add-error" style="display:none"></div>
            <form id="add-form">
              <div class="form-group">
                <label class="form-label" for="m-title">Title</label>
                <input type="text" id="m-title" class="form-input" placeholder="Air conditioning not cooling" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="m-desc">Description</label>
                <textarea id="m-desc" class="form-textarea" rows="4" placeholder="Describe the issue in detail..."></textarea>
              </div>
              <div class="form-group" style="margin-bottom:0">
                <label class="form-label" for="m-priority">Priority</label>
                <select id="m-priority" class="form-select">
                  ${PRIORITIES.map(function (p) {
                    return (
                      '<option value="' +
                      p.value +
                      '"' +
                      (p.value === "medium" ? " selected" : "") +
                      ">" +
                      p.label +
                      "</option>"
                    );
                  }).join("")}
                </select>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal('add-modal')">Cancel</button>
                <button type="submit" class="btn btn-primary" id="add-submit">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div class="modal-overlay" id="detail-modal">
        <div class="modal">
          <div class="modal-header">
            <h2>Request Details</h2>
            <button class="modal-close" onclick="closeModal('detail-modal')">${icon("x")}</button>
          </div>
          <div class="modal-body" id="detail-body"></div>
        </div>
      </div>
    `;
  }

  function openDetail(id) {
    const r = requests.find(function (x) {
      return x.id === id;
    });
    if (!r) return;

    const finished = r.status === "resolved" || r.status === "closed";
    const note = finished
      ? `<div class="status-banner success" style="margin:16px 0 0"><div class="status-banner-title">This request has been ${esc(r.status)}.</div></div>`
      : `<div class="status-banner warning" style="margin:16px 0 0"><div class="status-banner-title">Your landlord has been notified and will respond soon.</div></div>`;

    document.getElementById("detail-body").innerHTML = `
      <div style="margin-bottom:16px">
        <h3 style="font-size:15px;font-weight:600;margin-bottom:8px">${esc(r.title)}</h3>
        <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;white-space:pre-wrap">${esc(r.description || "No description provided.")}</p>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;background:var(--slate-50);border-radius:var(--radius-lg);padding:12px;font-size:13px">
        <div><span class="text-muted">Priority:</span> ${badge(r.priority)}</div>
        <div><span class="text-muted">Status:</span> ${badge(r.status)}</div>
        <div><span class="text-muted">Submitted:</span> <strong>${formatDate(r.created_at)}</strong></div>
        <div><span class="text-muted">Resolved:</span> <strong>${r.resolved_at ? formatDate(r.resolved_at) : "Pending"}</strong></div>
      </div>
      ${note}
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal('detail-modal')">Close</button>
      </div>
    `;
    openModal("detail-modal");
  }

  function openAdd() {
    document.getElementById("add-form").reset();
    document.getElementById("m-priority").value = "medium";
    clearFormError("add-error");
    openModal("add-modal");
  }

  async function save() {
    const button = document.getElementById("add-submit");
    clearFormError("add-error");

    const data = {
      unit_id: lease.unit_id,
      lease_id: lease.id,
      organization_id: lease.organization_id,
      title: document.getElementById("m-title").value.trim(),
      description: document.getElementById("m-desc").value.trim() || null,
      priority: document.getElementById("m-priority").value,
      status: "open",
    };

    if (!data.title) {
      showFormError("add-error", "Enter a title for the request.");
      return;
    }

    setButtonBusy(button, true, "Submitting...");

    try {
      await createMaintenance(data);
      closeModal("add-modal");
      requests = await getMaintenanceForTenant(user.id);
      render();
      flash("Request submitted. Your landlord has been notified.", "success");
    } catch (error) {
      showFormError("add-error", error.message);
      setButtonBusy(button, false);
    }
  }

  root.addEventListener("click", function (e) {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    if (el.dataset.action === "add") openAdd();
    else if (el.dataset.action === "view") openDetail(el.dataset.id);
  });

  root.addEventListener("submit", function (e) {
    if (e.target.id !== "add-form") return;
    e.preventDefault();
    save();
  });

  async function init() {
    user = await initPage("Maintenance", "tenant");
    if (!user) return;
    root.innerHTML = spinner();

    try {
      const results = await Promise.all([
        getCurrentLeaseForTenant(user.id),
        getMaintenanceForTenant(user.id),
      ]);
      lease = results[0];
      requests = results[1];
      render();
    } catch (error) {
      root.innerHTML = errorState(error.message);
    }
  }

  init();
})();
