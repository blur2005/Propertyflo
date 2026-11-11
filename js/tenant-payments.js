(function () {
  const root = document.getElementById("page-root");

  let user = null;
  let lease = null;
  let payments = [];
  let context = null;

  function receiptHtml(payment) {
    const number = "RCT-" + payment.id.slice(0, 8).toUpperCase();
    const rows = [
      ["Receipt number", number],
      [
        "Payment date",
        formatDate(payment.payment_date, {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      ],
      ["Received from", context.tenantName],
      ["Property", context.propertyLabel],
      ["Payment method", payment.method.replace(/_/g, " ")],
      ["Notes", payment.notes || "—"],
    ]
      .map(function (row) {
        return (
          '<tr><td class="label">' +
          esc(row[0]) +
          "</td><td>" +
          esc(row[1]) +
          "</td></tr>"
        );
      })
      .join("");

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Receipt ${esc(number)}</title>
<style>
  body { font-family: Arial, sans-serif; color: #0f172a; margin: 0; padding: 40px; }
  .sheet { max-width: 560px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .sub { color: #64748b; font-size: 13px; margin-bottom: 24px; }
  .amount { font-size: 30px; font-weight: 700; margin: 8px 0 24px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
  td.label { color: #64748b; width: 40%; }
  .foot { margin-top: 24px; font-size: 12px; color: #94a3b8; }
  @media print { body { padding: 0; } .sheet { border: none; } }
</style>
</head>
<body>
<div class="sheet">
  <h1>${esc(context.organizationName)}</h1>
  <div class="sub">Payment receipt</div>
  <div class="amount">${esc(formatNaira(payment.amount))}</div>
  <table>${rows}</table>
  <div class="foot">Generated ${esc(formatDate(new Date().toISOString(), { day: "numeric", month: "long", year: "numeric" }))} from PropertyFlow, based on the payment recorded by your landlord.</div>
</div>
<script>window.onload = function () { window.print(); };</script>
</body>
</html>`;
  }

  function openReceipt(id) {
    const payment = payments.find(function (p) {
      return p.id === id;
    });
    if (!payment) return;
    const win = window.open("", "_blank");
    if (!win) {
      flash(
        "Your browser blocked the receipt window. Allow pop-ups for this site and try again.",
      );
      return;
    }
    win.document.write(receiptHtml(payment));
    win.document.close();
  }

  function render() {
    const summary = rentSummary(lease, payments);
    const last = payments[0] || null;

    const body =
      payments.length === 0
        ? emptyState(
            "credit-card",
            "No payments yet",
            "Your payment history will appear here once your landlord records a payment.",
          )
        : `<div class="table-wrap"><table>
          <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Notes</th><th></th></tr></thead>
          <tbody>
            ${payments
              .map(function (p) {
                return `
                <tr>
                  <td>${formatDate(p.payment_date)}</td>
                  <td><strong style="color:var(--green-600)">${formatNaira(p.amount)}</strong></td>
                  <td>${badge(p.method)}</td>
                  <td class="text-secondary">${esc(p.notes || "—")}</td>
                  <td><button class="btn btn-sm btn-secondary" data-action="receipt" data-id="${p.id}">${icon("download")} Receipt</button></td>
                </tr>
              `;
              })
              .join("")}
          </tbody>
        </table></div>`;

    let balanceValue = formatNaira(Math.abs(summary.balance));
    let balanceSub = "paid up";
    let balanceTone = "green";
    if (summary.balance > 0) {
      balanceSub = "outstanding";
      balanceTone = "red";
    } else if (summary.balance < 0) {
      balanceSub = "prepaid credit";
    } else if (summary.periodsDue === 0 && summary.paid === 0) {
      balanceSub = "no rent due yet";
      balanceTone = "slate";
    }

    root.innerHTML = `
      <div id="flash"></div>
      <div class="page-header">
        <div class="page-header-left">
          <h2>Payments</h2>
          <p>${payments.length} record${payments.length === 1 ? "" : "s"}</p>
        </div>
      </div>

      <div class="stats-grid section">
        <div class="stat-card">
          <div>
            <div class="stat-label">Total Paid</div>
            <div class="stat-value" style="font-size:22px;color:var(--green-600)">${formatNaira(summary.paid)}</div>
            <div class="stat-sub">${payments.length} payment${payments.length === 1 ? "" : "s"}</div>
          </div>
          <div class="stat-icon green">${icon("check-circle")}</div>
        </div>
        <div class="stat-card">
          <div>
            <div class="stat-label">Balance</div>
            <div class="stat-value" style="font-size:22px">${balanceValue}</div>
            <div class="stat-sub">${balanceSub}</div>
          </div>
          <div class="stat-icon ${balanceTone}">${icon("credit-card")}</div>
        </div>
        <div class="stat-card">
          <div>
            <div class="stat-label">Last Payment</div>
            <div class="stat-value" style="font-size:20px">${last ? formatNaira(last.amount) : "—"}</div>
            <div class="stat-sub">${last ? formatDate(last.payment_date) : "No payments yet"}</div>
          </div>
          <div class="stat-icon slate">${icon("calendar")}</div>
        </div>
      </div>

      ${body}
    `;
  }

  root.addEventListener("click", function (e) {
    const el = e.target.closest('[data-action="receipt"]');
    if (el) openReceipt(el.dataset.id);
  });

  async function init() {
    user = await initPage("Payments", "tenant");
    if (!user) return;
    root.innerHTML = spinner();

    try {
      lease = await getCurrentLeaseForTenant(user.id);
      if (!lease) {
        root.innerHTML = emptyState(
          "credit-card",
          "No lease found",
          "Your payment history will appear here once your landlord creates a lease for you.",
        );
        return;
      }

      const results = await Promise.all([
        getPaymentsForLease(lease.id),
        getUnitWithProperty(lease.unit_id),
        getOrganization(lease.organization_id),
      ]);

      payments = results[0];
      const unit = results[1];
      const property = unit ? unit.property : null;
      context = {
        tenantName: user.full_name,
        organizationName: results[2] ? results[2].name : "PropertyFlow",
        propertyLabel:
          (property ? property.name + " — " : "") +
          (unit ? unit.unit_number : ""),
      };
      render();
    } catch (error) {
      root.innerHTML = errorState(error.message);
    }
  }

  init();
})();
