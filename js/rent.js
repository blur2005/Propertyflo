function parseDate(text) {
  const parts = text.split("-").map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function monthsPerPeriod(frequency) {
  if (frequency === "quarterly") return 3;
  if (frequency === "annually") return 12;
  return 1;
}

function addMonths(date, count) {
  const result = new Date(date.getFullYear(), date.getMonth() + count, 1);
  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();
  result.setDate(Math.min(date.getDate(), lastDay));
  return result;
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function formatLocalDate(date) {
  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function rentSchedule(lease) {
  const start = parseDate(lease.start_date);
  const end = parseDate(lease.end_date);
  const step = monthsPerPeriod(lease.rent_frequency);
  const dates = [];
  for (let i = 0; i < 600; i++) {
    const due = addMonths(start, step * i);
    if (due >= end) break;
    dates.push(due);
  }
  return dates;
}

function totalPaid(payments) {
  return payments.reduce(function (sum, p) {
    return sum + Number(p.amount);
  }, 0);
}

function rentSummary(lease, payments) {
  const today = startOfToday();
  const schedule = rentSchedule(lease);
  const started = schedule.filter(function (d) {
    return d <= today;
  });
  const expected = started.length * Number(lease.rent_amount);
  const paid = totalPaid(payments);
  const nextDue =
    schedule.find(function (d) {
      return d > today;
    }) || null;
  return {
    expected: expected,
    paid: paid,
    balance: expected - paid,
    nextDue: nextDue,
    periodsDue: started.length,
  };
}
