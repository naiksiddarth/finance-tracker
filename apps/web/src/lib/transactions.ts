export const TRANSACTIONS_CHANGED_EVENT = "finance-tracker:transactions-changed"

export function notifyTransactionsChanged() {
  window.dispatchEvent(new Event(TRANSACTIONS_CHANGED_EVENT))
}
