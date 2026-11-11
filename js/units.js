(function () {
  const root = document.getElementById("page-root");
  const STATUSES = [
    { value: "vacant", label: "Vacant" },
    { value: "occupied", label: "Occupied" },
    { value: "under_maintenance", label: "Under maintenance" },
  ];

  let user = null;
  let units = [];
  let properties = [];
  let filter = "all";
  let editingId = null;

  async function load() {
    const results = await Promise.all([
      getUnits(user.organization_id),
      getProperties(user.organization_id),
    ]);
    units = results[0];
    properties = results[1];
  }

  function propertyName(id) {
    const p = properties.find(function (x) {
      return x.id === id;
    });
    return p ? p.name : "—";
  }

  function render() {
    if (properties.length === 0) {
      root.innerHTML = `
        <div id="flash"></div>
        <div class="page-header"><div class="page-header-left"><h2>Units</h2><p>0 units</p></div></div>
        ${emptyState("door", "Add a property first", "Units belong to a property. Create a property, then come back to add units.", '<a href="properties.html" class="btn btn-primary">Go to Properties</a>')}
      `;
      return;
    }

    const visible =
      filter === "all"
        ? units
        : units.filter(function (u) {
            return u.property_id === filter;
          });

    const body =
      visible.length === 0
        ? emptyState(
            "door",
            "No units found",
            "Add your first unit to a property.",
            `<button class="btn btn-primary" data-action="add">${icon("plus")} Add Unit</button>`,
          )
        : `<div class="table-wrap"><table>
          <thead><tr><th>Unit</th><th>Property</th><th>Floor</th><th>Size</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${visible
              .map(function (u) {
                return `
                <tr>
                  <td><strong>${esc(u.unit_number)}</strong></td>
                  <td>${esc(propertyName(u.property_id))}</td>
                  <td>${esc(u.floor || "—")}</td>
                  <td>${u.size_sqft ? Number(u.size_sqft).toLocaleString() + " sqft" : "—"}</td>
                  <td>${badge(u.status)}</td>
                  <td>
                    <div class="td-actions">
                      <button class="btn-icon" data-action="edit" data-id="${u.id}" title="Edit">${icon("edit")}</button>
                      <button class="btn-icon danger" data-action="delete" data-id="${u.id}" title="Delete">${icon("trash")}</button>
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
          <h2>Units</h2>
          <p>${visible.length} unit${visible.length === 1 ? "" : "s"}</p>
        </div>
        <div class="filter-bar">
          <select class="filter-select" id="unit-filter">
            <option value="all">All Properties</option>
            ${selectOptions(
              properties,
              function (p) {
                return p.id;
              },
              function (p) {
                return p.name;
              },
              filter,
            )}
          </select>
          <button class="btn btn-primary" data-action="add">${icon("plus")} Add Unit</button>
        </div>
      </div>
      ${body}

      <div class="modal-overlay" id="unit-modal">
        <div class="modal">
          <div class="modal-header">
            <h2 id="unit-modal-title">Add Unit</h2>
            <button class="modal-close" onclick="closeModal('unit-modal')">${icon("x")}</button>
          </div>
          <div class="modal-body">
            <div class="alert alert-error" id="unit-error" style="display:none"></div>
            <form id="unit-form">
              <div class="form-group">
                <label class="form-label" for="unit-property">Property</label>
                <select id="unit-property" class="form-select" required>
                  <option value="">Select property</option>
                  ${selectOptions(
                    properties,
                    function (p) {
                      return p.id;
                    },
                    function (p) {
                      return p.name;
                    },
                  )}
                </select>
              </div>
              <div class="form-row">
                <div class="form-group" style="margin-bottom:0">
                  <label class="form-label" for="unit-number">Unit Number</label>
                  <input type="text" id="unit-number" class="form-input" placeholder="Suite 1A" required />
                </div>
                <div class="form-group" style="margin-bottom:0">
                  <label class="form-label" for="unit-floor">Floor</label>
                  <input type="text" id="unit-floor" class="form-input" placeholder="Ground" />
                </div>
              </div>
              <div class="form-group" style="margin-top:16px">
                <label class="form-label" for="unit-size">Size (sqft)</label>
                <input type="number" id="unit-size" class="form-input" placeholder="850" min="0" step="any" />
              </div>
              <div class="form-group">
                <label class="form-label" for="unit-status">Status</label>
                <select id="unit-status" class="form-select">${STATUSES.map(
                  function (s) {
                    return (
                      '<option value="' + s.value + '">' + s.label + "</option>"
                    );
                  },
                ).join("")}</select>
                <span class="form-hint">Updates automatically when a lease starts or ends.</span>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal('unit-modal')">Cancel</button>
                <button type="submit" class="btn btn-primary" id="unit-submit">Add Unit</button>
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
    editingId = id;
    const u = id
      ? units.find(function (x) {
          return x.id === id;
        })
      : null;
    document.getElementById("unit-modal-title").textContent = u
      ? "Edit Unit"
      : "Add Unit";
    document.getElementById("unit-submit").textContent = u
      ? "Save Changes"
      : "Add Unit";
    document.getElementById("unit-property").value = u
      ? u.property_id
      : filter !== "all"
        ? filter
        : "";
    document.getElementById("unit-number").value = u ? u.unit_number : "";
    document.getElementById("unit-floor").value = u ? u.floor || "" : "";
    document.getElementById("unit-size").value =
      u && u.size_sqft ? u.size_sqft : "";
    document.getElementById("unit-status").value = u ? u.status : "vacant";
    clearFormError("unit-error");
    openModal("unit-modal");
  }

  async function save() {
    const button = document.getElementById("unit-submit");
    clearFormError("unit-error");

    const sizeText = document.getElementById("unit-size").value;
    const data = {
      property_id: document.getElementById("unit-property").value,
      unit_number: document.getElementById("unit-number").value.trim(),
      floor: document.getElementById("unit-floor").value.trim() || null,
      size_sqft: sizeText ? parseFloat(sizeText) : null,
      status: document.getElementById("unit-status").value,
    };

    if (!data.property_id || !data.unit_number) {
      showFormError("unit-error", "Choose a property and enter a unit number.");
      return;
    }
    if (data.size_sqft !== null && !(data.size_sqft > 0)) {
      showFormError("unit-error", "Size must be greater than zero.");
      return;
    }

    setButtonBusy(button, true, "Saving...");

    try {
      if (editingId) await updateUnit(editingId, data);
      else await createUnit(data);
      closeModal("unit-modal");
      await refresh();
      flash("Unit saved.", "success");
    } catch (error) {
      showFormError("unit-error", error.message);
      setButtonBusy(button, false);
    }
  }

  function remove(id) {
    const u = units.find(function (x) {
      return x.id === id;
    });
    if (!u) return;
    confirmDelete('Delete unit "' + u.unit_number + '"?', async function () {
      try {
        await deleteUnit(id);
        await refresh();
        flash("Unit deleted.", "success");
      } catch (error) {
        flash(error.message);
      }
    });
  }

  root.addEventListener("click", function (e) {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    if (action === "add") openForm(null);
    else if (action === "edit") openForm(el.dataset.id);
    else if (action === "delete") remove(el.dataset.id);
  });

  root.addEventListener("change", function (e) {
    if (e.target.id !== "unit-filter") return;
    filter = e.target.value;
    render();
  });

  root.addEventListener("submit", function (e) {
    if (e.target.id !== "unit-form") return;
    e.preventDefault();
    save();
  });

  (async function init() {
    user = await initPage("Units", "landlord");
    if (!user) return;
    root.innerHTML = spinner();
    await refresh();
  })();
})();
