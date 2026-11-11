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

  function render() {
    const body =
      documents.length === 0
        ? emptyState(
            "folder",
            "No documents yet",
            "Your landlord has not shared any documents with you yet.",
          )
        : `<div class="grid-auto">${documents
            .map(function (d) {
              return `
            <div class="doc-card">
              <div class="doc-icon">${icon("file-text")}</div>
              <div class="doc-info">
                <div class="doc-name" title="${esc(d.file_name)}">${esc(d.file_name)}</div>
                <div class="doc-meta">
                  <span class="badge badge-primary">${esc(TYPE_LABELS[d.document_type] || d.document_type)}</span>
                  <span class="doc-size">${formatBytes(d.file_size_bytes)}</span>
                </div>
                <div class="text-xs text-muted" style="margin-top:4px">${formatDate(d.created_at)}</div>
              </div>
              <div class="doc-actions">
                <button class="btn-icon" data-action="download" data-id="${d.id}" title="Download">${icon("download")}</button>
              </div>
            </div>
          `;
            })
            .join("")}</div>`;

    root.innerHTML = `
      <div id="flash"></div>
      <div class="page-header">
        <div class="page-header-left">
          <h2>My Documents</h2>
          <p>${documents.length} document${documents.length === 1 ? "" : "s"}</p>
        </div>
      </div>
      <div class="alert alert-success">These documents are read-only. Contact your landlord if one needs to be updated or added.</div>
      ${body}
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
    const user = await initPage("My Documents", "tenant");
    if (!user) return;
    root.innerHTML = spinner();

    try {
      documents = await getDocumentsForTenant();
      render();
    } catch (error) {
      root.innerHTML = errorState(error.message);
    }
  }

  init();
})();
