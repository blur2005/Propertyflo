function toDateString(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return date.getFullYear() + "-" + month + "-" + day;
}

function stamp() {
  return new Date().toISOString();
}

function fail(error) {
  const text = error.message || "";
  let message = text;
  if (text.includes("profiles_tenant_email_key"))
    message = "A tenant with this email address already exists.";
  else if (text.includes("units_property_number_key"))
    message = "This property already has a unit with that number.";
  else if (text.includes("leases_one_active_per_unit"))
    message = "This unit already has an active lease.";
  else if (error.code === "23503")
    message = "This record is linked to other records and cannot be removed.";
  else if (error.code === "PGRST116")
    message =
      "That record could not be found, or you do not have permission to change it.";
  else if (error.code === "42501" || /row-level security/i.test(text))
    message = "You do not have permission to do that.";
  const wrapped = new Error(message);
  wrapped.code = error.code;
  return wrapped;
}

async function run(query) {
  const { data, error } = await query;
  if (error) throw fail(error);
  return data;
}

async function softDelete(table, id) {
  const rows = await run(
    sb.from(table).update({ deleted_at: stamp() }).eq("id", id).select("id"),
  );
  if (!rows.length)
    throw new Error(
      "That record could not be found, or you do not have permission to delete it.",
    );
}

async function getOrganization(orgId) {
  return run(
    sb.from("organizations").select("id, name").eq("id", orgId).maybeSingle(),
  );
}

async function getProperties(orgId) {
  return run(
    sb
      .from("properties")
      .select("*")
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
  );
}

async function createProperty(orgId, data) {
  return run(
    sb
      .from("properties")
      .insert({ ...data, organization_id: orgId })
      .select()
      .single(),
  );
}

async function updateProperty(id, data) {
  return run(sb.from("properties").update(data).eq("id", id).select().single());
}

async function deleteProperty(id) {
  const active = await run(
    sb
      .from("leases")
      .select("id, units!inner(property_id)")
      .eq("units.property_id", id)
      .eq("status", "active")
      .is("deleted_at", null)
      .limit(1),
  );
  if (active.length)
    throw new Error(
      "This property has active leases. End or delete those leases first.",
    );
  await run(
    sb
      .from("units")
      .update({ deleted_at: stamp() })
      .eq("property_id", id)
      .is("deleted_at", null),
  );
  await softDelete("properties", id);
}

async function getUnits(orgId, propertyId) {
  let query = sb
    .from("units")
    .select("*")
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("unit_number", { ascending: true });
  if (propertyId) query = query.eq("property_id", propertyId);
  return run(query);
}

async function getUnitWithProperty(unitId) {
  return run(
    sb
      .from("units")
      .select("*, property:properties(*)")
      .eq("id", unitId)
      .maybeSingle(),
  );
}

async function createUnit(data) {
  return run(sb.from("units").insert(data).select().single());
}

async function updateUnit(id, data) {
  return run(sb.from("units").update(data).eq("id", id).select().single());
}

async function deleteUnit(id) {
  const active = await run(
    sb
      .from("leases")
      .select("id")
      .eq("unit_id", id)
      .eq("status", "active")
      .is("deleted_at", null)
      .limit(1),
  );
  if (active.length)
    throw new Error(
      "This unit has an active lease. End or delete the lease first.",
    );
  await softDelete("units", id);
}

async function getTenants(orgId) {
  return run(
    sb
      .from("profiles")
      .select("id, status, full_name, email, phone, created_at")
      .eq("role", "tenant")
      .eq("invited_by_org", orgId)
      .order("full_name", { ascending: true }),
  );
}

async function createTenant(data) {
  return run(
    sb
      .from("profiles")
      .insert({
        role: "tenant",
        full_name: data.full_name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone ? data.phone.trim() : null,
      })
      .select()
      .single(),
  );
}

async function updateTenant(id, data) {
  return run(
    sb
      .from("profiles")
      .update({
        full_name: data.full_name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone ? data.phone.trim() : null,
      })
      .eq("id", id)
      .select()
      .single(),
  );
}

async function deleteTenant(id) {
  const rows = await run(
    sb.from("profiles").delete().eq("id", id).select("id"),
  );
  if (!rows.length)
    throw new Error("Only tenants who have not signed up yet can be removed.");
}

async function getLeases(orgId) {
  return run(
    sb
      .from("leases")
      .select("*")
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .order("start_date", { ascending: false }),
  );
}

async function getLeaseForTenant(tenantId) {
  return run(
    sb
      .from("leases")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .is("deleted_at", null)
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
}

async function getCurrentLeaseForTenant(tenantId) {
  const leases = await run(
    sb
      .from("leases")
      .select("*")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("start_date", { ascending: false }),
  );
  return (
    leases.find(function (l) {
      return l.status === "active";
    }) ||
    leases[0] ||
    null
  );
}

async function createLease(data) {
  return run(sb.from("leases").insert(data).select().single());
}

async function updateLease(id, data) {
  return run(sb.from("leases").update(data).eq("id", id).select().single());
}

async function deleteLease(id) {
  await softDelete("leases", id);
}

async function getPayments(orgId) {
  return run(
    sb
      .from("payments")
      .select("*")
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .order("payment_date", { ascending: false }),
  );
}

async function getPaymentsForLease(leaseId) {
  return run(
    sb
      .from("payments")
      .select("*")
      .eq("lease_id", leaseId)
      .is("deleted_at", null)
      .order("payment_date", { ascending: false }),
  );
}

async function recordPayment(data) {
  return run(sb.from("payments").insert(data).select().single());
}

async function deletePayment(id) {
  await softDelete("payments", id);
}

async function getMaintenance(orgId) {
  return run(
    sb
      .from("maintenance_requests")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false }),
  );
}

async function getMaintenanceForTenant(tenantId) {
  return run(
    sb
      .from("maintenance_requests")
      .select("*")
      .eq("submitted_by", tenantId)
      .order("created_at", { ascending: false }),
  );
}

async function createMaintenance(data) {
  return run(sb.from("maintenance_requests").insert(data).select().single());
}

async function updateMaintenance(id, data) {
  return run(
    sb.from("maintenance_requests").update(data).eq("id", id).select().single(),
  );
}

async function getDocuments(orgId) {
  return run(
    sb
      .from("documents")
      .select("*")
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  );
}

async function getDocumentsForLease(leaseId) {
  return run(
    sb
      .from("documents")
      .select("*")
      .eq("lease_id", leaseId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  );
}

async function getDocumentsForTenant() {
  return run(
    sb
      .from("documents")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  );
}

const DOCUMENT_LIMIT = 10485760;
const DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function safeFileName(name) {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[_.]+/, "");
  return (cleaned || "file").slice(-120);
}

function validateDocumentFile(file) {
  if (!file) return "Choose a file to upload.";
  if (file.size === 0) return "That file is empty.";
  if (file.size > DOCUMENT_LIMIT) return "Files must be 10 MB or smaller.";
  if (DOCUMENT_MIME_TYPES.indexOf(file.type) === -1)
    return "Only PDF, PNG, JPG and Word (.docx) files are allowed.";
  return null;
}

async function uploadDocument(file, meta) {
  const problem = validateDocumentFile(file);
  if (problem) throw new Error(problem);

  const entityId =
    meta.scope === "organization"
      ? meta.organization_id
      : meta.lease_id || meta.unit_id || meta.property_id;

  const path =
    meta.organization_id +
    "/" +
    meta.scope +
    "/" +
    entityId +
    "/" +
    crypto.randomUUID() +
    "-" +
    safeFileName(file.name);

  const { error: uploadError } = await sb.storage
    .from("documents")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    const text = (uploadError.message || "").toLowerCase();
    if (text.includes("mime"))
      throw new Error("That file type is not allowed.");
    if (
      text.includes("maximum") ||
      text.includes("too large") ||
      text.includes("exceeded")
    )
      throw new Error("Files must be 10 MB or smaller.");
    throw new Error("The upload failed. Please try again.");
  }

  try {
    return await run(
      sb
        .from("documents")
        .insert({
          organization_id: meta.organization_id,
          scope: meta.scope,
          property_id: meta.property_id || null,
          unit_id: meta.unit_id || null,
          lease_id: meta.lease_id || null,
          file_name: file.name,
          storage_path: path,
          file_size_bytes: file.size,
          mime_type: file.type,
          document_type: meta.document_type,
        })
        .select()
        .single(),
    );
  } catch (error) {
    await sb.storage.from("documents").remove([path]);
    throw error;
  }
}

async function downloadDocument(doc) {
  const { data, error } = await sb.storage
    .from("documents")
    .createSignedUrl(doc.storage_path, 60, { download: doc.file_name });
  if (error || !data)
    throw new Error("Could not prepare the download. Please try again.");
  window.location.href = data.signedUrl;
}

async function deleteDocument(doc) {
  await softDelete("documents", doc.id);
  const { error } = await sb.storage
    .from("documents")
    .remove([doc.storage_path]);
  if (error) console.error(error);
}

async function getAnnouncements(orgId) {
  return run(
    sb
      .from("announcements")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false }),
  );
}

async function getAnnouncementsForTenant() {
  return run(
    sb
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false }),
  );
}

async function createAnnouncement(data) {
  return run(sb.from("announcements").insert(data).select().single());
}

async function deleteAnnouncement(id) {
  const rows = await run(
    sb.from("announcements").delete().eq("id", id).select("id"),
  );
  if (!rows.length)
    throw new Error(
      "That announcement could not be found, or you do not have permission to delete it.",
    );
}

async function getNotifications(profileId) {
  return run(
    sb
      .from("notifications")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(30),
  );
}

async function markAllNotificationsRead(profileId) {
  await run(
    sb
      .from("notifications")
      .update({ read_at: stamp() })
      .eq("profile_id", profileId)
      .is("read_at", null),
  );
}

async function getDashboardStats(orgId) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth() - 5, 1);

  const [properties, units, leases, maintenance, payments] = await Promise.all([
    run(
      sb
        .from("properties")
        .select("id")
        .eq("organization_id", orgId)
        .is("deleted_at", null),
    ),
    run(
      sb
        .from("units")
        .select("status")
        .eq("organization_id", orgId)
        .is("deleted_at", null),
    ),
    run(
      sb
        .from("leases")
        .select("id")
        .eq("organization_id", orgId)
        .eq("status", "active")
        .is("deleted_at", null),
    ),
    run(
      sb
        .from("maintenance_requests")
        .select("id")
        .eq("organization_id", orgId)
        .in("status", ["open", "in_progress"]),
    ),
    run(
      sb
        .from("payments")
        .select("amount, payment_date")
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .gte("payment_date", toDateString(start)),
    ),
  ]);

  const occupied = units.filter(function (u) {
    return u.status === "occupied";
  }).length;

  const revenueByMonth = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = toDateString(monthDate).slice(0, 7);
    const revenue = payments
      .filter(function (p) {
        return p.payment_date.startsWith(key);
      })
      .reduce(function (sum, p) {
        return sum + Number(p.amount);
      }, 0);
    revenueByMonth.push({
      month: monthDate.toLocaleString("en-NG", { month: "short" }),
      revenue: revenue,
    });
  }

  return {
    totalProperties: properties.length,
    totalUnits: units.length,
    occupiedUnits: occupied,
    vacantUnits: units.length - occupied,
    occupancyRate: units.length
      ? Math.round((occupied / units.length) * 100)
      : 0,
    activeLeases: leases.length,
    openMaintenance: maintenance.length,
    revenueThisMonth: revenueByMonth[revenueByMonth.length - 1].revenue,
    revenueByMonth: revenueByMonth,
  };
}
async function updateMyProfile(profileId, data) {
  return run(
    sb
      .from("profiles")
      .update({
        full_name: data.full_name.trim(),
        phone: data.phone ? data.phone.trim() : null,
      })
      .eq("id", profileId)
      .select("id, full_name, phone")
      .single(),
  );
}