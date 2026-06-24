/**
 * Tenancy helpers (ADR-0004).
 */

/**
 * TEMPORARY — introduced with the multi-tenant foundation (issue 0001) and
 * removed once per-Company admin authentication lands (issue 0004/0005).
 *
 * The legacy admin write routes still authenticate with ADR-0003's global
 * password and have no Company in their session yet. Until that's replaced,
 * they write to the first Company that the data-preserving migration (0001)
 * adopted all pre-existing single-tenant rows into. In production this is the
 * only real Company, so the legacy admin keeps managing the same data it always
 * did. The clock flow does NOT use this — a Shift takes its Site's companyId.
 */
export const LEGACY_ADMIN_COMPANY_ID = "company_wl";
