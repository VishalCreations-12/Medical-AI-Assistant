export function formatInr(
  amount: number,
  maximumFractionDigits = 0,
): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits,
  }).format(amount);
}
