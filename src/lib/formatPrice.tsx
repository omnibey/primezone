/**
 * Formats a number or string into the South Asian/Bangladeshi comma format (e.g. 1,00,000)
 * @param {number|string} amount 
 * @returns {string} Formatted string
 */
export function formatPrice(amount) {
  if (amount === null || amount === undefined) return '0';
  const numericAmount = Number(amount);
  if (isNaN(numericAmount)) return '0';
  
  // 'en-IN' uses the South Asian numbering system
  return numericAmount.toLocaleString('en-IN');
}
