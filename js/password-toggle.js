(function () {
  const EYE =
    '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  const EYE_OFF =
    '<svg viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

  function enhance(input) {
    if (input.dataset.pwEnhanced) return;
    input.dataset.pwEnhanced = "true";

    const wrapper = document.createElement("div");
    wrapper.className = "password-field";
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "password-toggle";
    wrapper.appendChild(button);

    input.setAttribute("autocapitalize", "off");
    input.setAttribute("spellcheck", "false");

    function setVisible(visible) {
      input.type = visible ? "text" : "password";
      button.innerHTML = visible ? EYE_OFF : EYE;
      button.classList.toggle("is-visible", visible);
      button.setAttribute("aria-pressed", visible ? "true" : "false");
      button.setAttribute(
        "aria-label",
        visible ? "Hide password" : "Show password",
      );
      button.title = visible ? "Hide password" : "Show password";
    }

    setVisible(false);

    button.addEventListener("mousedown", function (e) {
      e.preventDefault();
    });

    button.addEventListener("click", function () {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const wasFocused = document.activeElement === input;

      setVisible(input.type === "password");

      if (wasFocused) {
        input.focus();
        try {
          input.setSelectionRange(start, end);
        } catch (error) {}
      }
    });

    if (input.form) {
      input.form.addEventListener("submit", function () {
        setVisible(false);
      });
    }
  }

  function enhanceAll() {
    document.querySelectorAll('input[type="password"]').forEach(enhance);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enhanceAll);
  } else {
    enhanceAll();
  }

  window.enhancePasswordFields = enhanceAll;
})();
