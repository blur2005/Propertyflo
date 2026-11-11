(function () {
  const root = document.getElementById("page-root");
  const STATUSES = [
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In progress" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
  ];
  const PRIORITIES = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ];

  let user = null;
  let requests = [];
  let units = [];
  let properties = [];
  let tenants = [];
  let filter = "all";
  let selectedId = null;

  async function load() {
    const results = await Promise.all([
      getMaintenance(user.organization_id),
      getUnits(user.organization_id),
      getProperties(user.organization_id),
      getTenants(user.organization_id),
    ]);
    requests = results[0];
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

  function submitterName(id) {
    if (id === user.id) return "You";
    const t = tenants.find(function (x) {
      return x.id === id;
    });
    return t ? t.full_name : "—";
  }

  function optionList(items, selected) {
    return items
      .map(function (i) {
        return (
          '<option value="' +
          i.value +
          '"' +
          (i.value === selected ? " selected" : "") +
          ">" +
          i.label +
          "</option>"
        );
      })
      .join("");
  }

  function render() {
    const visible =
      filter === "all"
        ? requests
        : requests.filter(function (r) {
            return r.status === filter;
          });
    const openCount = requests.filter(function (r) {
      return r.status === "open" || r.status === "in_progress";
    }).length;

    const body =
      visible.length === 0
        ? emptyState(
            "tool",
            "No requests found",
            requests.length === 0
              ? "Requests from tenants will appear here."
              : "No requests match this filter.",
          )
        : `<div class="table-wrap"><table>
          <thead><tr><th>Title</th><th>Unit</th><th>Submitted By</th><th>Priority</th><th>Status</th><th>Date</th><th></th></tr></thead>
          <tbody>
            ${visible
              .map(function (r) {
                return `
                <tr class="clickable" data-action="view" data-id="${r.id}">
                  <td><strong>${esc(r.title)}</strong></td>
                  <td>${esc(unitLabel(r.unit_id))}</td>
                  <td>${esc(submitterName(r.submitted_by))}</td>
                  <td>${badge(r.priority)}</td>
                  <td>${badge(r.status)}</td>
                  <td>${formatDate(r.created_at, { day: "numeric", month: "short" })}</td>
                  <td><button class="btn btn-sm btn-ghost" data-action="view" data-id="${r.id}">Update</button></td>
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
          <h2>Maintenance</h2>
          <p>${openCount} open request${openCount === 1 ? "" : "s"}</p>
        </div>
        <div class="filter-bar">
          <select class="filter-select" id="maint-filter">
            <option value="all">All Statuses</option>
            ${STATUSES.map(function (s) {
              return (
                '<option value="' +
                s.value +
                '"' +
                (filter === s.value ? " selected" : "") +
                ">" +
                s.label +
                "</option>"
              );
            }).join("")}
          </select>
          <button class="btn btn-primary" data-action="add">${icon("plus")} Add Request</button>
        </div>
      </div>
      ${body}

      <div class="modal-overlay" id="detail-modal">
        <div class="modal">
          <div class="modal-header">
            <h2>Maintenance Request</h2>
            <button class="modal-close" onclick="closeModal('detail-modal')">${icon("x")}</button>
          </div>
          <div class="modal-body" id="detail-body"></div>
        </div>
      </div>

      <div class="modal-overlay" id="add-modal">
        <div class="modal">
          <div class="modal-header">
            <h2>Add Request</h2>
            <button class="modal-close" onclick="closeModal('add-modal')">${icon("x")}</button>
          </div>
          <div class="modal-body">
            <div class="alert alert-error" id="add-error" style="display:none"></div>
            <form id="add-form">
              <div class="form-group">
                <label class="form-label" for="m-unit">Unit</label>
                <select id="m-unit" class="form-select" required>
                  <option value="">Select unit</option>
                  ${selectOptions(
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
                <label class="form-label" for="m-title">Title</label>
                <input type="text" id="m-title" class="form-input" placeholder="Air conditioning not cooling" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="m-desc">Description</label>
                <textarea id="m-desc" class="form-textarea" placeholder="Describe the issue..."></textarea>
              </div>
              <div class="form-group" style="margin-bottom:0">
                <label class="form-label" for="m-priority">Priority</label>
                <select id="m-priority" class="form-select">${optionList(PRIORITIES, "medium")}</select>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal('add-modal')">Cancel</button>
                <button type="submit" class="btn btn-primary" id="add-submit">Submit Request</button>
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

  function openDetail(id) {
    const r = requests.find(function (x) {
      return x.id === id;
    });
    if (!r) return;
    selectedId = id;

    document.getElementById("detail-body").innerHTML = `
      <div style="margin-bottom:16px">
        <h3 style="font-size:15px;font-weight:600;margin-bottom:6px">${esc(r.title)}</h3>
        <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;white-space:pre-wrap">${esc(r.description || "No description provided.")}</p>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;background:var(--slate-50);border-radius:var(--radius-lg);padding:12px;font-size:13px;margin-bottom:16px">
        <div><span class="text-muted">Unit:</span> <strong>${esc(unitLabel(r.unit_id))}</strong></div>
        <div><span class="text-muted">Submitted by:</span> <strong>${esc(submitterName(r.submitted_by))}</strong></div>
        <div><span class="text-muted">Date:</span> <strong>${formatDate(r.created_at)}</strong></div>
        <div><span class="text-muted">Resolved:</span> <strong>${r.resolved_at ? formatDate(r.resolved_at) : "—"}</strong></div>
      </div>
      <div class="alert alert-error" id="update-error" style="display:none"></div>
      <form id="update-form">
        <div class="form-row">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label" for="u-status">Status</label>
            <select id="u-status" class="form-select">${optionList(STATUSES, r.status)}</select>
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label" for="u-priority">Priority</label>
            <select id="u-priority" class="form-select">${optionList(PRIORITIES, r.priority)}</select>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeModal('detail-modal')">Cancel</button>
          <button type="submit" class="btn btn-primary" id="update-submit">Save Update</button>
        </div>
      </form>
    `;
    openModal("detail-modal");
  }

  async function saveUpdate() {
    const button = document.getElementById("update-submit");
    clearFormError("update-error");
    setButtonBusy(button, true, "Saving...");

    try {
      await updateMaintenance(selectedId, {
        status: document.getElementById("u-status").value,
        priority: document.getElementById("u-priority").value,
      });
      closeModal("detail-modal");
      await refresh();
      flash("Request updated. The tenant has been notified.", "success");
    } catch (error) {
      showFormError("update-error", error.message);
      setButtonBusy(button, false);
    }
  }

  function openAdd() {
    if (units.length === 0) {
      flash("Add a unit before creating a maintenance request.");
      return;
    }
    document.getElementById("add-form").reset();
    document.getElementById("m-priority").value = "medium";
    clearFormError("add-error");
    openModal("add-modal");
  }

  async function saveAdd() {
    const button = document.getElementById("add-submit");
    clearFormError("add-error");

    const data = {
      unit_id: document.getElementById("m-unit").value,
      title: document.getElementById("m-title").value.trim(),
      description: document.getElementById("m-desc").value.trim() || null,
      priority: document.getElementById("m-priority").value,
    };

    if (!data.unit_id || !data.title) {
      showFormError("add-error", "Choose a unit and enter a title.");
      return;
    }

    setButtonBusy(button, true, "Submitting...");

    try {
      await createMaintenance({
        ...data,
        organization_id: user.organization_id,
      });
      closeModal("add-modal");
      await refresh();
      flash("Request added.", "success");
    } catch (error) {
      showFormError("add-error", error.message);
      setButtonBusy(button, false);
    }
  }

  root.addEventListener("click", function (e) {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    if (el.dataset.action === "view") openDetail(el.dataset.id);
    else if (el.dataset.action === "add") openAdd();
  });

  root.addEventListener("change", function (e) {
    if (e.target.id !== "maint-filter") return;
    filter = e.target.value;
    render();
  });

  root.addEventListener("submit", function (e) {
    if (e.target.id === "update-form") {
      e.preventDefault();
      saveUpdate();
    } else if (e.target.id === "add-form") {
      e.preventDefault();
      saveAdd();
    }
  });

  (async function init() {
    user = await initPage("Maintenance", "landlord");
    if (!user) return;
    root.innerHTML = spinner();
    await refresh();
  })();
})();
