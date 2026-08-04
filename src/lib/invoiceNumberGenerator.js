/**
 * Invoice number generator
 * Format: {prefix}-{YYYY}-{NNNNN}
 * Example: ACC-SINV-2026-00084
 */

/**
 * Generate an invoice number from prefix and sequence number
 * @param {string} prefix - Invoice prefix (e.g., "ACC-SINV")
 * @param {number} sequenceNumber - The sequential number
 * @returns {string} Formatted invoice number
 */
export function generateInvoiceNumber(prefix = 'ACC-SINV', sequenceNumber = 1) {
  const year = new Date().getFullYear();
  const paddedNumber = String(sequenceNumber).padStart(5, '0');
  return `${prefix}-${year}-${paddedNumber}`;
}

/**
 * Parse an invoice number to extract its components
 * @param {string} invoiceNumber - The invoice number to parse
 * @returns {{ prefix: string, year: number, sequence: number } | null}
 */
export function parseInvoiceNumber(invoiceNumber) {
  const match = invoiceNumber.match(/^(.+)-(\d{4})-(\d+)$/);
  if (!match) return null;
  return {
    prefix: match[1],
    year: parseInt(match[2], 10),
    sequence: parseInt(match[3], 10),
  };
}
