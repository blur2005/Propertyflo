let cachedProfile = null;

function basePath() {
  const path = window.location.pathname;
  return path.includes("/landlord/") || path.includes("/tenant/") ? "../" : "";
}

function resolvedSiteUrl() {
  if (APP_CONFIG && APP_CONFIG.siteUrl)
    return APP_CONFIG.siteUrl.replace(/\/$/, "");
  return window.location.origin;
}

function pageUrl(page) {
  if (APP_CONFIG && APP_CONFIG.siteUrl) {
    return new URL(page, APP_CONFIG.siteUrl.replace(/\/$/, "") + "/").href;
  }

  return new URL(basePath() + page, window.location.href).href;
}

function homeFor(role) {
  return role === "landlord"
    ? "landlord/dashboard.html"
    : "tenant/dashboard.html";
}

function redirectTo(page) {
  window.location.href = basePath() + page;
}

sb.auth.onAuthStateChange(function (event) {
  if (event === "SIGNED_OUT") cachedProfile = null;
});

function authMessage(error) {
  const text = (error.message || "").toLowerCase();
  if (text.includes("invalid login credentials"))
    return "Incorrect email or password.";
  if (text.includes("email not confirmed"))
    return "Please confirm your email address first. Check your inbox for the confirmation link.";
  if (
    text.includes("already registered") ||
    text.includes("already been registered")
  )
    return "An account with this email already exists. Try signing in instead.";
  if (text.includes("rate limit"))
    return "Too many attempts. Please wait a few minutes and try again.";
  if (text.includes("password should be at least"))
    return "That password is too short.";
  return error.message;
}

async function fetchProfile(userId) {
  const { data, error } = await sb
    .from("profiles")
    .select(
      "id, role, status, organization_id, invited_by_org, full_name, email, phone",
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function loadCurrentUser() {
  const { data } = await sb.auth.getSession();
  if (!data.session) {
    cachedProfile = null;
    return null;
  }

  let profile = await fetchProfile(data.session.user.id);

  if (!profile) {
    const { error } = await sb.rpc("claim_tenant_profile");
    if (!error) profile = await fetchProfile(data.session.user.id);
  }

  cachedProfile = profile;
  return profile;
}

function getCurrentUser() {
  return cachedProfile;
}

async function requireAuth() {
  try {
    const profile = await loadCurrentUser();
    if (!profile) {
      redirectTo("index.html");
      return null;
    }
    return profile;
  } catch (error) {
    console.error(error);
    redirectTo("index.html");
    return null;
  }
}

async function requireLandlord() {
  const profile = await requireAuth();
  if (profile && profile.role !== "landlord") {
    redirectTo(homeFor(profile.role));
    return null;
  }
  return profile;
}

async function requireTenant() {
  const profile = await requireAuth();
  if (profile && profile.role !== "tenant") {
    redirectTo(homeFor(profile.role));
    return null;
  }
  return profile;
}

async function login(email, password) {
  const { error } = await sb.auth.signInWithPassword({ email, password });

  if (error) {
    const wrapped = new Error(authMessage(error));
    wrapped.unconfirmed = (error.message || "")
      .toLowerCase()
      .includes("email not confirmed");
    throw wrapped;
  }

  const profile = await loadCurrentUser();
  if (!profile) {
    await sb.auth.signOut();
    throw new Error(
      "No account was found for this email. If you are a tenant, ask your landlord to add your email address first.",
    );
  }
  return profile;
}

async function registerLandlord({
  fullName,
  organizationName,
  email,
  password,
}) {
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: {
        signup_type: "landlord",
        full_name: fullName,
        organization_name: organizationName,
      },
      emailRedirectTo: pageUrl("index.html"),
    },
  });
  if (error) throw new Error(authMessage(error));
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    throw new Error(
      "An account with this email already exists. Try signing in instead.",
    );
  }
  return data;
}

async function registerTenant({ email, password }) {
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: { signup_type: "tenant" },
      emailRedirectTo: pageUrl("index.html"),
    },
  });
  if (error) throw new Error(authMessage(error));
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    throw new Error(
      "An account with this email already exists. Try signing in instead.",
    );
  }
  return data;
}

async function resendConfirmation(email) {
  const { error } = await sb.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: pageUrl("index.html") },
  });
  if (error) throw new Error(authMessage(error));
}

async function logout() {
  await sb.auth.signOut();
  cachedProfile = null;
  redirectTo("index.html");
}

async function requestPasswordReset(email) {
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: pageUrl("reset-password.html"),
  });
  if (error) throw new Error(authMessage(error));
}

async function updatePassword(newPassword) {
  const { error } = await sb.auth.updateUser({ password: newPassword });
  if (error) throw new Error(authMessage(error));
}
