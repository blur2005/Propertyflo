(function () {
  const root = document.getElementById("page-root");
  const TYPES = [
    { value: "office", label: "Office" },
    { value: "retail", label: "Retail" },
    { value: "industrial", label: "Industrial" },
    { value: "mixed_use", label: "Mixed use" },
    { value: "other", label: "Other" },
  ];

  let user = null;
  let properties = [];
  let unitCounts = {};
  let editingId = null;

  function typeLabel(value) {
    const found = TYPES.find(function (t) {
      return t.value === value;
    });
    return found ? found.label : value;
  }

  async function load() {
    const results = await Promise.all([
      getProperties(user.organization_id),
      getUnits(user.organization_id),
    ]);
    properties = results[0];
    unitCounts = {};
    results[1].forEach(function (u) {
      unitCounts[u.property_id] = (unitCounts[u.property_id] || 0) + 1;
    });
  }

  function cardHtml(p) {
    const count = unitCounts[p.id] || 0;
    const street =
      p.address_line1 + (p.address_line2 ? ", " + p.address_line2 : "");
    return `
      <div class="prop-card">
        <div class="prop-card-top">
          <div class="prop-icon">${icon("building")}</div>
          <div class="prop-actions">
            <button class="btn-icon" data-action="edit" data-id="${p.id}" title="Edit">${icon("edit")}</button>
            <button class="btn-icon danger" data-action="delete" data-id="${p.id}" title="Delete">${icon("trash")}</button>
          </div>
        </div>
        <div class="prop-name">${esc(p.name)}</div>
        <div class="prop-address">${icon("map-pin")} ${esc(p.city)}${p.state ? ", " + esc(p.state) : ""}</div>
        <div class="text-xs text-muted truncate" style="margin-top:2px">${esc(street)}</div>
        <div class="prop-footer">
          <span class="badge badge-primary">${esc(typeLabel(p.property_type))}</span>
          <span class="prop-units">${count} unit${count === 1 ? "" : "s"}</span>
        </div>
      </div>
    `;
  }

  function render() {
    const body =
      properties.length === 0
        ? emptyState(
            "building",
            "No properties yet",
            "Add your first property to get started.",
            `<button class="btn btn-primary" data-action="add">${icon("plus")} Add Property</button>`,
          )
        : `<div class="grid-auto">${properties.map(cardHtml).join("")}</div>`;

    root.innerHTML = `
      <div id="flash"></div>
      <div class="page-header">
        <div class="page-header-left">
          <h2>Properties</h2>
          <p>${properties.length} ${properties.length === 1 ? "property" : "properties"}</p>
        </div>
        <button class="btn btn-primary" data-action="add">${icon("plus")} Add Property</button>
      </div>
      ${body}

      <div class="modal-overlay" id="prop-modal">
        <div class="modal">
          <div class="modal-header">
            <h2 id="prop-modal-title">Add Property</h2>
            <button class="modal-close" onclick="closeModal('prop-modal')">${icon("x")}</button>
          </div>
          <div class="modal-body">
            <div class="alert alert-error" id="prop-error" style="display:none"></div>
            <form id="prop-form">
              <div class="form-group">
                <label class="form-label" for="prop-name">Property Name</label>
                <input type="text" id="prop-name" class="form-input" placeholder="Victoria Crown Plaza" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="prop-type">Property Type</label>
                <select id="prop-type" class="form-select">${TYPES.map(
                  function (t) {
                    return (
                      '<option value="' + t.value + '">' + t.label + "</option>"
                    );
                  },
                ).join("")}</select>
              </div>
              <div class="form-group">
                <label class="form-label" for="prop-addr1">Address Line 1</label>
                <input type="text" id="prop-addr1" class="form-input" placeholder="14 Adeola Odeku Street" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="prop-addr2">Address Line 2 (optional)</label>
                <input type="text" id="prop-addr2" class="form-input" placeholder="Victoria Island" />
              </div>
              <div class="form-row">
                <div class="form-group" style="margin-bottom:0">
                  <label class="form-label" for="prop-city">City</label>
                  <input type="text" id="prop-city" class="form-input" placeholder="Lagos" required />
                </div>
                <div class="form-group" style="margin-bottom:0">
                  <label class="form-label" for="prop-state">State</label>
                  <input type="text" id="prop-state" class="form-input" placeholder="Lagos" />
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal('prop-modal')">Cancel</button>
                <button type="submit" class="btn btn-primary" id="prop-submit">Add Property</button>
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
    const p = id
      ? properties.find(function (x) {
          return x.id === id;
        })
      : null;
    document.getElementById("prop-modal-title").textContent = p
      ? "Edit Property"
      : "Add Property";
    document.getElementById("prop-submit").textContent = p
      ? "Save Changes"
      : "Add Property";
    document.getElementById("prop-name").value = p ? p.name : "";
    document.getElementById("prop-type").value = p ? p.property_type : "office";
    document.getElementById("prop-addr1").value = p ? p.address_line1 : "";
    document.getElementById("prop-addr2").value = p
      ? p.address_line2 || ""
      : "";
    document.getElementById("prop-city").value = p ? p.city : "";
    document.getElementById("prop-state").value = p ? p.state || "" : "";
    clearFormError("prop-error");
    openModal("prop-modal");
  }

  async function save() {
    const button = document.getElementById("prop-submit");
    clearFormError("prop-error");

    const data = {
      name: document.getElementById("prop-name").value.trim(),
      property_type: document.getElementById("prop-type").value,
      address_line1: document.getElementById("prop-addr1").value.trim(),
      address_line2: document.getElementById("prop-addr2").value.trim() || null,
      city: document.getElementById("prop-city").value.trim(),
      state: document.getElementById("prop-state").value.trim() || null,
      country: "NG",
    };

    if (!data.name || !data.address_line1 || !data.city) {
      showFormError("prop-error", "Name, address and city are required.");
      return;
    }

    setButtonBusy(button, true, "Saving...");

    try {
      if (editingId) await updateProperty(editingId, data);
      else await createProperty(user.organization_id, data);
      closeModal("prop-modal");
      await refresh();
      flash("Property saved.", "success");
    } catch (error) {
      showFormError("prop-error", error.message);
      setButtonBusy(button, false);
    }
  }

  function remove(id) {
    const p = properties.find(function (x) {
      return x.id === id;
    });
    if (!p) return;
    confirmDelete(
      'Delete "' + p.name + '"? Its units will be removed too.',
      async function () {
        try {
          await deleteProperty(id);
          await refresh();
          flash("Property deleted.", "success");
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
    if (e.target.id !== "prop-form") return;
    e.preventDefault();
    save();
  });

  (async function init() {
    user = await initPage("Properties", "landlord");
    if (!user) return;
    root.innerHTML = spinner();
    await refresh();
  })();
})();
