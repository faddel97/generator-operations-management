export function formatDate(value: unknown) {
  if (!value || typeof value !== "string") {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium"
  }).format(new Date(value));
}

export function formatNumber(value: unknown, suffix = "") {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }

  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return String(value);
  }

  return `${new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(numeric)}${suffix}`;
}

export function humanize(value: string) {
  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}
