/**
 * Active = last activity within X many hours.
 * Set ACTIVE_THRESHOLD_HOURS=1 in .env for testing. Default is 24 hours.
 *
 * A student is only considered "At Risk" after they have completed the diagnostic
 * AND have been inactive (no activity within threshold).
 */
const ACTIVE_THRESHOLD_HOURS = (() => {
  const val = process.env.ACTIVE_THRESHOLD_HOURS;
  if (val === undefined || val === "") return 24;
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? n : 24;
})();
const ACTIVE_THRESHOLD_MS = ACTIVE_THRESHOLD_HOURS * 60 * 60 * 1000;

export function isActiveFromLastActive(lastActiveAt: string | null): boolean {
  if (!lastActiveAt) return false;
  const elapsed = Date.now() - new Date(lastActiveAt).getTime();
  return elapsed >= 0 && elapsed < ACTIVE_THRESHOLD_MS;
}

export type StudentStatus = "On Track" | "At Risk";

/**
 * Returns status and isActive. Student is "At Risk" only if they have completed
 * the diagnostic AND have been inactive (beyond threshold). Otherwise "On Track".
 */
export function getStudentStatus(
  lastActive: string | null,
  hasCompletedDiagnostic: boolean
): { status: StudentStatus; isActive: boolean } {
  const activeByTime = isActiveFromLastActive(lastActive);
  const isAtRisk = hasCompletedDiagnostic && !activeByTime;
  return {
    status: isAtRisk ? "At Risk" : "On Track",
    isActive: !isAtRisk,
  };
}
