function showAlert(message, type) {
  const box = document.getElementById("alert");
  box.className = "alert alert-" + (type || "error");
  box.textContent = message;
  box.style.display = "block";
}

function hideAlert() {
  document.getElementById("alert").style.display = "none";
}

function setBusy(button, busy, busyLabel) {
  if (busy) {
    button.dataset.label = button.textContent;
    button.textContent = busyLabel;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.label || button.textContent;
    button.disabled = false;
  }
}

function validatePassword(password, confirm) {
  if (!password || password.trim().length === 0) return "Password is required.";
  if (password !== confirm) return "Passwords do not match.";
  if (password.length < 8) return "Password must be at least 8 characters.";

  const missing = [];
  if (!/[A-Z]/.test(password)) missing.push("uppercase letter");
  if (!/[a-z]/.test(password)) missing.push("lowercase letter");
  if (!/\d/.test(password)) missing.push("number");
  if (!/[^A-Za-z0-9]/.test(password)) missing.push("special character");

  if (missing.length) {
    return "Password must contain at least one " + missing.join(" and ") + ".";
  }

  return null;
}

function showPanel(containerId, options) {
  const container = document.getElementById(containerId);
  const tone = options.tone || "success";
  const iconPath =
    tone === "success"
      ? '<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/>'
      : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>';

  container.innerHTML =
    '<div class="auth-success">' +
    '<div class="auth-success-icon ' +
    tone +
    '"><svg viewBox="0 0 24 24">' +
    iconPath +
    "</svg></div>" +
    "<h1></h1>" +
    '<p class="auth-subtitle"></p>' +
    '<a class="btn btn-primary w-full" style="display:none"></a>' +
    "</div>";

  container.querySelector("h1").textContent = options.title;
  container.querySelector("p").textContent = options.message;

  if (options.linkHref) {
    const link = container.querySelector("a");
    link.href = options.linkHref;
    link.textContent = options.linkText;
    link.style.display = "inline-flex";
  }
}
