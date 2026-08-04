/**
 * Number to Words converter — PKR (Pakistani Rupee) aware
 * Converts numeric values like 17500 → "PKR Seventeen Thousand Five Hundred only."
 */

const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seven-Teen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertHundreds(num) {
  let result = '';

  if (num >= 100) {
    result += ones[Math.floor(num / 100)] + ' Hundred';
    num %= 100;
    if (num > 0) result += ' ';
  }

  if (num >= 20) {
    result += tens[Math.floor(num / 10)];
    num %= 10;
    if (num > 0) result += '-' + ones[num];
  } else if (num > 0) {
    result += ones[num];
  }

  return result;
}

/**
 * Convert a number to words using standard thousands system
 * @param {number} num - The number to convert
 * @returns {string} The number in words
 */
function numberToWordsRaw(num) {
  if (num === 0) return 'Zero';

  const isNegative = num < 0;
  num = Math.abs(num);

  // Split into integer and decimal parts
  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * 100);

  const scales = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];
  let result = '';
  let scaleIndex = 0;

  let remaining = intPart;

  if (remaining === 0) {
    result = 'Zero';
  } else {
    while (remaining > 0) {
      const chunk = remaining % 1000;
      if (chunk > 0) {
        const chunkWords = convertHundreds(chunk);
        if (scaleIndex > 0) {
          result = chunkWords + ' ' + scales[scaleIndex] + (result ? ' ' + result : '');
        } else {
          result = chunkWords;
        }
      }
      remaining = Math.floor(remaining / 1000);
      scaleIndex++;
    }
  }

  if (isNegative) {
    result = 'Negative ' + result;
  }

  return result;
}

/**
 * Convert amount to words with currency
 * @param {number} amount - The monetary amount
 * @param {string} currencyName - Currency name (e.g., "PKR")
 * @returns {string} Formatted string like "PKR Seventeen Thousand Five Hundred only."
 */
export function amountToWords(amount, currencyName = 'PKR') {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '';
  }

  const intPart = Math.floor(Math.abs(amount));
  const decPart = Math.round((Math.abs(amount) - intPart) * 100);

  let result = currencyName + ' ' + numberToWordsRaw(amount);

  if (decPart > 0) {
    result += ' and ' + numberToWordsRaw(decPart) + ' Paisa';
  }

  result += ' only.';

  return result;
}

/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @param {string} symbol - Currency symbol (e.g., "₨")
 * @returns {string} Formatted string like "₨ 17,500.00"
 */
export function formatCurrency(amount, symbol = '₨') {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return symbol + ' 0.00';
  }
  return symbol + ' ' + Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
