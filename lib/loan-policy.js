export const LOAN_MAX_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
export const PENALTY_DURATION_MS = 5 * 24 * 60 * 60 * 1000;

export function calculateDueDate(loanDateInput) {
  const loanDate = loanDateInput ? new Date(loanDateInput) : new Date();
  return new Date(loanDate.getTime() + LOAN_MAX_DURATION_MS);
}

export function calculatePenaltyUntil(nowInput) {
  const now = nowInput ? new Date(nowInput) : new Date();
  return new Date(now.getTime() + PENALTY_DURATION_MS);
}

export function getSecondsDifference(fromDateInput, toDateInput) {
  const fromDate = new Date(fromDateInput);
  const toDate = new Date(toDateInput);
  return Math.ceil((toDate.getTime() - fromDate.getTime()) / 1000);
}

export function formatSecondsAsDuration(totalSecondsInput) {
  const totalSeconds = Math.max(0, Number(totalSecondsInput) || 0);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${Math.max(1, Math.floor(totalSeconds))}s`;
}
