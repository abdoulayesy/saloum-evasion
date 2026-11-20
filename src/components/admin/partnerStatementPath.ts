// Chemin de la vue « Relevés prestataires » de l'admin et de son export (002, US5, T095).
export const PARTNER_STATEMENT_PATH = '/admin/releves';

export const statementExportPath = (partnerId: number, from: string, to: string): string =>
  `/api/admin/statements/${partnerId}?du=${from}&au=${to}`;

/** Rôles qui voient les commissions et les montants à reverser (data-model « Rôles »). */
export const FINANCE_ROLES: ReadonlySet<string> = new Set(['admin', 'finance']);
