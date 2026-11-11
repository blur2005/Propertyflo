(function () {
  const root = document.getElementById("page-root");

  let user = null;
  let announcements = [];
  let properties = [];

  async function load() {
    const results = await Promise.all([
      getAnnouncements(user.organization_id),
      getProperties(user.organization_id),
    ]);
    announcements = results[0];
    properties = results[1];
  }

  function propertyName(id) {
    const p = properties.find(function (x) {
      return x.id === id;
    });
    return p ? p.name : "Property";
  }

  function render() {
    const body =
      announcements.length === 0
        ? emptyState(
            "megaphone",
            "No announcements yet",
            "Post an update to notify your tenants.",
            `<button class="btn btn-primary" data-action="add">${icon("plus")} Post Announcement</button>`,
          )
        : announcements
            .map(function (a) {
              return `
            <div class="ann-card">
              <div class="ann-icon">${icon("megaphone")}</div>
              <div class="ann-body">
                <div class="ann-title-row">
                  <span class="ann-title">${esc(a.title)}</span>
                  ${
                    a.property_id
                      ? `<span class="badge badge-primary">${esc(propertyName(a.property_id))}</span>`
                      : '<span class="badge badge-default">All tenants</span>'
                  }
                </div>
                <div class="ann-text" style="white-space:pre-wrap">${esc(a.body)}</div>
                <div class="ann-date">${formatDate(a.created_at, { day: "numeric", month: "long", year: "numeric" })}</div>
              </div>
              <div class="ann-delete">
                <button class="btn-icon danger" data-action="delete" data-id="${a.id}" title="Delete">${icon("trash")}</button>
              </div>
            </div>
          `;
            })
            .join("");

    root.innerHTML = `
      <div id="flash"></div>
      <div class="page-header">
        <div class="page-header-left">
          <h2>Announcements</h2>
          <p>${announcements.length} announcement${announcements.length === 1 ? "" : "s"}</p>
        </div>
        <button class="btn btn-primary" data-action="add">${icon("plus")} Post Announcement</button>
      </div>
      ${body}

      <div class="modal-overlay" id="ann-modal">
        <div class="modal">
          <div class="modal-header">
            <h2>Post Announcement</h2>
            <button class="modal-close" onclick="closeModal('ann-modal')">${icon("x")}</button>
          </div>
          <div class="modal-body">
            <div class="alert alert-error" id="ann-error" style="display:none"></div>
            <form id="ann-form">
              <div class="form-group">
                <label class="form-label" for="ann-title">Title</label>
                <input type="text" id="ann-title" class="form-input" placeholder="Planned power outage" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="ann-body">Message</label>
                <textarea id="ann-body" class="form-textarea" placeholder="Write your announcement here..." rows="4" required></textarea>
              </div>
              <div class="form-group" style="margin-bottom:0">
                <label class="form-label" for="ann-property">Audience</label>
                <select id="ann-property" class="form-select">
                  <option value="">All tenants (all properties)</option>
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
                <span class="form-hint">Tenants with an active lease are notified.</span>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal('ann-modal')">Cancel</button>
                <button type="submit" class="btn btn-primary" id="ann-submit">Post Announcement</button>
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
    document.getElementById("ann-form").reset();
    clearFormError("ann-error");
    openModal("ann-modal");
  }

  async function save() {
    const button = document.getElementById("ann-submit");
    clearFormError("ann-error");

    const data = {
      title: document.getElementById("ann-title").value.trim(),
      body: document.getElementById("ann-body").value.trim(),
      property_id: document.getElementById("ann-property").value || null,
    };

    if (!data.title || !data.body) {
      showFormError("ann-error", "Enter a title and a message.");
      return;
    }

    setButtonBusy(button, true, "Posting...");

    try {
      await createAnnouncement({
        ...data,
        organization_id: user.organization_id,
      });
      closeModal("ann-modal");
      await refresh();
      flash("Announcement posted. Tenants have been notified.", "success");
    } catch (error) {
      showFormError("ann-error", error.message);
      setButtonBusy(button, false);
    }
  }

  function remove(id) {
    const a = announcements.find(function (x) {
      return x.id === id;
    });
    if (!a) return;
    confirmDelete(
      'Delete the announcement "' + a.title + '"?',
      async function () {
        try {
          await deleteAnnouncement(id);
          await refresh();
          flash("Announcement deleted.", "success");
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

  root.addEventListener("submit", function (e) {
    if (e.target.id !== "ann-form") return;
    e.preventDefault();
    save();
  });

  (async function init() {
    user = await initPage("Announcements", "landlord");
    if (!user) return;
    root.innerHTML = spinner();
    await refresh();
  })();
})();
