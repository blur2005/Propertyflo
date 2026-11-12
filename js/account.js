(function () {
  const root = document.getElementById("page-root");
  const LEVELS = ["", "Weak", "Fair", "Good", "Strong"];
  const DATE_TIME = {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  let user = null;
  let authUser = null;
  let organization = null;

  function scorePassword(value) {
    if (!value) return 0;
    let score = 0;
    if (value.length >= 8) score++;
    if (value.length >= 12) score++;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
    if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score++;
    return Math.max(score, 1);
  }

  function updateStrength() {
    const level = scorePassword(document.getElementById("pw-new").value);
    document.getElementById("pw-strength").dataset.level = String(level);
    document.getElementById("pw-strength-label").textContent = level
      ? LEVELS[level]
      : "";
  }

  function refreshSidebar() {
    const nameEl = document.querySelector(".sidebar-user-name");
    const avatarEl = document.querySelector(".sidebar-avatar");
    if (nameEl) nameEl.textContent = user.full_name;
    if (avatarEl) avatarEl.innerHTML = initials(user.full_name);
  }

  function render() {
    const verified = !!authUser.email_confirmed_at;
    const roleLabel = user.role === "landlord" ? "Landlord" : "Tenant";

    root.innerHTML = `
      <div id="flash"></div>
      <div class="page-header">
        <div class="page-header-left">
          <h2>Account</h2>
          <p>Your sign-in details and security settings</p>
        </div>
      </div>

      <div class="account-grid">
        <div class="card">
          <div class="account-identity">
            ${avatarHtml(user.full_name, "lg")}
            <div class="account-identity-text">
              <div class="account-name">${esc(user.full_name)}</div>
              <div class="account-email">
                <span>${esc(authUser.email)}</span>
                <span class="badge ${verified ? "badge-success" : "badge-warning"}">${verified ? "Verified" : "Not verified"}</span>
              </div>
            </div>
          </div>

          <div class="info-row"><span class="info-label">Account type</span><span class="info-value">${roleLabel}</span></div>
          ${organization ? `<div class="info-row"><span class="info-label">Organization</span><span class="info-value">${esc(organization.name)}</span></div>` : ""}
          <div class="info-row"><span class="info-label">Member since</span><span class="info-value">${formatDate(authUser.created_at)}</span></div>
          <div class="info-row"><span class="info-label">Last sign-in</span><span class="info-value">${formatDate(authUser.last_sign_in_at, DATE_TIME)}</span></div>

          <div class="divider"></div>

          <form id="profile-form">
            <div class="alert alert-error" id="profile-error" style="display:none"></div>
            <div class="form-group">
              <label class="form-label" for="acc-name">Full name</label>
              <input type="text" id="acc-name" class="form-input" value="${esc(user.full_name)}" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="acc-phone">Phone (optional)</label>
              <input type="tel" id="acc-phone" class="form-input" value="${esc(user.phone || "")}" />
            </div>
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label" for="acc-email">Email</label>
              <input type="email" id="acc-email" class="form-input" value="${esc(authUser.email)}" disabled />
              <span class="form-hint">This is the address you sign in with. It can't be changed here.</span>
            </div>
            <div style="display:flex;justify-content:flex-end;margin-top:20px">
              <button type="submit" class="btn btn-primary" id="profile-submit">Save changes</button>
            </div>
          </form>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <h3>Change password</h3>
              <p>Use at least 8 characters. Other devices are signed out when you change it.</p>
            </div>
          </div>

          <form id="password-form">
            <div class="alert alert-error" id="pw-error" style="display:none"></div>
            <div class="form-group">
              <label class="form-label" for="pw-current">Current password</label>
              <input type="password" id="pw-current" class="form-input" autocomplete="current-password" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="pw-new">New password</label>
              <input type="password" id="pw-new" class="form-input" autocomplete="new-password" placeholder="At least 8 characters" required />
              <div class="strength" id="pw-strength" data-level="0">
                <div class="strength-bars"><span></span><span></span><span></span><span></span></div>
                <div class="strength-label" id="pw-strength-label"></div>
              </div>
            </div>
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label" for="pw-confirm">Confirm new password</label>
              <input type="password" id="pw-confirm" class="form-input" autocomplete="new-password" required />
            </div>
            <div style="display:flex;justify-content:flex-end;margin-top:20px">
              <button type="submit" class="btn btn-primary" id="pw-submit">Update password</button>
            </div>
            <p class="form-hint" style="margin-top:14px">
              Forgot your current password? <a href="../forgot-password.html" class="text-brand font-medium">Reset it by email</a>
            </p>
          </form>
        </div>
      </div>
    `;

    if (window.enhancePasswordFields) window.enhancePasswordFields();
  }

  async function saveProfile() {
    const button = document.getElementById("profile-submit");
    clearFormError("profile-error");

    const fullName = document.getElementById("acc-name").value.trim();
    const phone = document.getElementById("acc-phone").value.trim();

    if (!fullName) {
      showFormError("profile-error", "Enter your full name.");
      return;
    }

    setButtonBusy(button, true, "Saving...");

    try {
      const saved = await updateMyProfile(user.id, {
        full_name: fullName,
        phone: phone,
      });
      user = { ...user, full_name: saved.full_name, phone: saved.phone };
      refreshSidebar();
      render();
      flash("Your details have been saved.", "success");
    } catch (error) {
      showFormError("profile-error", error.message);
      setButtonBusy(button, false);
    }
  }

  async function savePassword() {
    const button = document.getElementById("pw-submit");
    clearFormError("pw-error");

    const current = document.getElementById("pw-current").value;
    const next = document.getElementById("pw-new").value;
    const confirm = document.getElementById("pw-confirm").value;

    if (!current) {
      showFormError("pw-error", "Enter your current password.");
      return;
    }
    if (next.length < 8) {
      showFormError(
        "pw-error",
        "Your new password must be at least 8 characters.",
      );
      return;
    }
    if (next === current) {
      showFormError(
        "pw-error",
        "Your new password must be different from your current one.",
      );
      return;
    }
    if (next !== confirm) {
      showFormError("pw-error", "The new passwords do not match.");
      return;
    }

    setButtonBusy(button, true, "Updating...");

    try {
      await changePassword(current, next);
      render();
      flash(
        "Password updated. Your other devices have been signed out.",
        "success",
      );
    } catch (error) {
      showFormError("pw-error", error.message);
      setButtonBusy(button, false);
    }
  }

  root.addEventListener("submit", function (e) {
    if (e.target.id === "profile-form") {
      e.preventDefault();
      saveProfile();
    } else if (e.target.id === "password-form") {
      e.preventDefault();
      savePassword();
    }
  });

  root.addEventListener("input", function (e) {
    if (e.target.id === "pw-new") updateStrength();
  });

  (async function init() {
    user = await initPage("Account");
    if (!user) return;
    root.innerHTML = spinner();

    try {
      const results = await Promise.all([
        getAuthUser(),
        user.role === "landlord"
          ? getOrganization(user.organization_id)
          : Promise.resolve(null),
      ]);
      authUser = results[0];
      organization = results[1];
      render();
    } catch (error) {
      root.innerHTML = errorState(error.message);
    }
  })();
})();
