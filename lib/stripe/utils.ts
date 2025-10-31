/**
 * Format amount from cents to currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount / 100);
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

/**
 * Get subscription status badge color
 */
export function getSubscriptionStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    active: "bg-green-500",
    trialing: "bg-blue-500",
    past_due: "bg-yellow-500",
    canceled: "bg-red-500",
    unpaid: "bg-red-500",
    incomplete: "bg-gray-500",
  };

  return statusColors[status] || "bg-gray-500";
}
