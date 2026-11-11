(function () {
  const root = document.getElementById("page-root");
  const TYPES = [
    { value: "lease_agreement", label: "Lease agreement" },
    { value: "receipt", label: "Receipt" },
    { value: "notice", label: "Notice" },
    { value: "id_verification", label: "ID verification" },
    { value: "other", label: "Other" },
  ];
  const SCOPES = [
    { value: "lease", label: "A lease (shared with that tenant)" },
    { value: "unit", label: "A unit (shared with its tenant)" },
    { value: "property", label: "A property (shared with all its tenants)" },
    { value: "organization", label: "My organization (private to you)" },
  ];
  const PLURALS = { lease: "leases", unit: "units", property: "properties" };

  let user = null;
  let documents = [];
  let leases = [];
  let tenants = [];
  let units = [];
  let properties = [];
  let filter = "all";

  async function load() {
    const results = await Promise.all([
      getDocuments(user.organization_id),
      getLeases(user.organization_id),
      getTenants(user.organization_id),
      getUnits(user.organization_id),
      getProperties(user.organization_id),
    ]);
    documents = results[0];
    leases = results[1];
    tenants = results[2];
    units = results[3];
    properties = results[4];
  }

  function typeLabel(value) {
    const found = TYPES.find(function (t) {
      return t.value === value;
    });
    return found ? found.label : value;
  }

  function tenantName(id) {
    const t = tenants.find(function (x) {
      return x.id === id;
    });
    return t ? t.full_name : "Tenant";
  }

  function propertyName(id) {
    const p = properties.find(function (x) {
      return x.id === id;
    });
    return p ? p.name : "Property";
  }

  function unitLabel(id) {
    const unit = units.find(function (u) {
      return u.id === id;
    });
    if (!unit) return "Unit";
    return propertyName(unit.property_id) + " — " + unit.unit_number;
  }

  function leaseLabel(lease) {
    return tenantName(lease.tenant_id) + " — " + unitLabel(lease.unit_id);
  }

  function targetLabel(d) {
    if (d.scope === "lease") {
      const lease = leases.find(function (l) {
        return l.id === d.lease_id;
      });
      return lease ? leaseLabel(lease) : "Lease";
    }
    if (d.scope === "unit") return unitLabel(d.unit_id);
    if (d.scope === "property") return propertyName(d.property_id);
    return "Whole organization";
  }

  function targetFieldHtml(scope) {
    let items = [];
    let label = "";
    let labelOf = null;

    if (scope === "lease") {
      items = leases;
      label = "Lease";
      labelOf = leaseLabel;
    } else if (scope === "unit") {
      items = units;
      label = "Unit";
      labelOf = function (u) {
        return unitLabel(u.id);
      };
    } else if (scope === "property") {
      items = properties;
      label = "Property";
      labelOf = function (p) {
        return p.name;
      };
    } else {
      return "";
    }

    if (items.length === 0) {
      return (
        '<div class="form-group"><span class="form-hint">You have no ' +
        PLURALS[scope] +
        " yet. Create one first, or choose a different option above.</span></div>"
      );
    }

    return `
      <div class="form-group">
        <label class="form-label" for="d-target">${label}</label>
        <select id="d-target" class="form-select" required>
          <option value="">Select ${label.toLowerCase()}</option>
          ${selectOptions(
            items,
            function (i) {
              return i.id;
            },
            labelOf,
          )}
        </select>
      </div>
    `;
  }

  function cardHtml(d) {
    const shared = d.scope !== "organization";
    return `
      <div class="doc-card">
        <div class="doc-icon">${icon("file-text")}</div>
        <div class="doc-info">
          <div class="doc-name" title="${esc(d.file_name)}">${esc(d.file_name)}</div>
          <div class="doc-meta">
            <span class="badge badge-primary">${esc(typeLabel(d.document_type))}</span>
            <span class="doc-size">${formatBytes(d.file_size_bytes)}</span>
          </div>
          <div class="text-xs text-secondary truncate" style="margin-top:4px" title="${esc(targetLabel(d))}">${esc(targetLabel(d))}</div>
          <div class="doc-share-note">${shared ? "Visible to tenant(s)" : "Private"} · ${formatDate(d.created_at)}</div>
        </div>
        <div class="doc-actions">
          <button class="btn-icon" data-action="download" data-id="${d.id}" title="Download">${icon("download")}</button>
          <button class="btn-icon danger" data-action="delete" data-id="${d.id}" title="Delete">${icon("trash")}</button>
        </div>
      </div>
    `;
  }

  function render() {
    const visible =
      filter === "all"
        ? documents
        : documents.filter(function (d) {
            return d.scope === filter;
          });

    const body =
      visible.length === 0
        ? emptyState(
            "folder",
            "No documents",
            documents.length === 0
              ? "Upload lease agreements, receipts and notices for your tenants and properties."
              : "No documents match this filter.",
            documents.length === 0
              ? `<button class="btn btn-primary" data-action="add">${icon("upload")} Upload Document</button>`
              : "",
          )
        : `<div class="grid-auto">${visible.map(cardHtml).join("")}</div>`;

    root.innerHTML = `
      <div id="flash"></div>
      <div class="page-header">
        <div class="page-header-left">
          <h2>Documents</h2>
          <p>${visible.length} document${visible.length === 1 ? "" : "s"}</p>
        </div>
        <div class="filter-bar">
          <select class="filter-select" id="doc-filter">
            <option value="all">All Scopes</option>
            <option value="lease"${filter === "lease" ? " selected" : ""}>Lease</option>
            <option value="unit"${filter === "unit" ? " selected" : ""}>Unit</option>
            <option value="property"${filter === "property" ? " selected" : ""}>Property</option>
            <option value="organization"${filter === "organization" ? " selected" : ""}>Organization</option>
          </select>
          <button class="btn btn-primary" data-action="add">${icon("upload")} Upload Document</button>
        </div>
      </div>
      ${body}

      <div class="modal-overlay" id="doc-modal">
        <div class="modal">
          <div class="modal-header">
            <h2>Upload Document</h2>
            <button class="modal-close" onclick="closeModal('doc-modal')">${icon("x")}</button>
          </div>
          <div class="modal-body">
            <div class="alert alert-error" id="doc-error" style="display:none"></div>
            <form id="doc-form">
              <div class="form-group">
                <label class="form-label" for="d-scope">Attach to</label>
                <select id="d-scope" class="form-select">
                  ${SCOPES.map(function (s) {
                    return (
                      '<option value="' + s.value + '">' + s.label + "</option>"
                    );
                  }).join("")}
                </select>
              </div>
              <div id="d-target-slot"></div>
              <div class="form-group">
                <label class="form-label" for="d-type">Document type</label>
                <select id="d-type" class="form-select">
                  ${TYPES.map(function (t) {
                    return (
                      '<option value="' + t.value + '">' + t.label + "</option>"
                    );
                  }).join("")}
                </select>
              </div>
              <div class="form-group" style="margin-bottom:0">
                <label class="form-label" for="d-file">File</label>
                <input type="file" id="d-file" class="form-input" accept=".pdf,.png,.jpg,.jpeg,.docx" required />
                <span class="form-hint">PDF, PNG, JPG or Word (.docx), up to 10 MB.</span>
                <span class="form-hint">Anything attached to a lease, unit or property can be downloaded by the tenants it applies to.</span>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal('doc-modal')">Cancel</button>
                <button type="submit" class="btn btn-primary" id="doc-submit">Upload</button>
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
    document.getElementById("doc-form").reset();
    const scope = leases.length > 0 ? "lease" : "organization";
    document.getElementById("d-scope").value = scope;
    document.getElementById("d-type").value =
      scope === "lease" ? "lease_agreement" : "other";
    document.getElementById("d-target-slot").innerHTML = targetFieldHtml(scope);
    clearFormError("doc-error");
    openModal("doc-modal");
  }

  async function save() {
    const button = document.getElementById("doc-submit");
    clearFormError("doc-error");

    const scope = document.getElementById("d-scope").value;
    const targetEl = document.getElementById("d-target");
    const target = targetEl ? targetEl.value : null;
    const file = document.getElementById("d-file").files[0];

    if (scope !== "organization" && !target) {
      showFormError("doc-error", "Choose what this document belongs to.");
      return;
    }

    const problem = validateDocumentFile(file);
    if (problem) {
      showFormError("doc-error", problem);
      return;
    }

    setButtonBusy(button, true, "Uploading...");

    try {
      await uploadDocument(file, {
        organization_id: user.organization_id,
        scope: scope,
        document_type: document.getElementById("d-type").value,
        lease_id: scope === "lease" ? target : null,
        unit_id: scope === "unit" ? target : null,
        property_id: scope === "property" ? target : null,
      });
      closeModal("doc-modal");
      await refresh();
      flash("Document uploaded.", "success");
    } catch (error) {
      showFormError("doc-error", error.message);
      setButtonBusy(button, false);
    }
  }

  function remove(id) {
    const d = documents.find(function (x) {
      return x.id === id;
    });
    if (!d) return;
    confirmDelete(
      'Delete "' + d.file_name + '"? The file will be permanently removed.',
      async function () {
        try {
          await deleteDocument(d);
          await refresh();
          flash("Document deleted.", "success");
        } catch (error) {
          flash(error.message);
        }
      },
    );
  }

  async function download(id) {
    const d = documents.find(function (x) {
      return x.id === id;
    });
    if (!d) return;
    try {
      await downloadDocument(d);
    } catch (error) {
      flash(error.message);
    }
  }

  root.addEventListener("click", function (e) {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    if (action === "add") openForm();
    else if (action === "download") download(el.dataset.id);
    else if (action === "delete") remove(el.dataset.id);
  });

  root.addEventListener("change", function (e) {
    if (e.target.id === "doc-filter") {
      filter = e.target.value;
      render();
    } else if (e.target.id === "d-scope") {
      const scope = e.target.value;
      document.getElementById("d-target-slot").innerHTML =
        targetFieldHtml(scope);
      if (scope === "lease")
        document.getElementById("d-type").value = "lease_agreement";
    }
  });

  root.addEventListener("submit", function (e) {
    if (e.target.id !== "doc-form") return;
    e.preventDefault();
    save();
  });

  (async function init() {
    user = await initPage("Documents", "landlord");
    if (!user) return;
    root.innerHTML = spinner();
    await refresh();
  })();
})();
