// Number utilities

// Converts a value (string, number, etc.) to an integer number
// Assumes radix base 10
export const toInteger = (value, defaultValue = NaN) => {
  const integer = parseInt(value, 10)

  return isNaN(integer) ? defaultValue : integer
}

// Converts a value (string, number, etc.) to a number
export const toFloat = (value, defaultValue = NaN) => {
  const float = parseFloat(value)

  return isNaN(float) ? defaultValue : float
}

// Converts a value (string, number, etc.) to a string
// representation with `precision` digits after the decimal
// Returns the string 'NaN' if the value cannot be converted
export const toFixed = (val, precision) => toFloat(val).toFixed(toInteger(precision, 0))

export function phonePrettier(phoneNumber) {
  if (phoneNumber) {
    const phone = phoneNumber.toString()

    /* 998 90 992 50 44 */
    if (!phone) return
    const leftHandSide = '+' + phone.slice(0, 3) /* 998 */
    const companyCode = phone.slice(3, 5) /* 90  */
    const starterNumbers = phone.slice(5, 8) /* 992 */
    const middleNumbers = phone.slice(8, 10) /* 50  */
    const endingNumbers = phone.slice(10, 12) /* 44  */

    return `${leftHandSide} ${companyCode} ${starterNumbers} ${middleNumbers} ${endingNumbers}`
  }

  return ''
}

// export function formatToPrice(rawPrice, decimalCount = 0) {
//     if (!rawPrice) return 0;
//
//     const dollarUSLocale = Intl.NumberFormat('en-US');
//     const price = dollarUSLocale.format(parseInt(rawPrice));
//     const result = price.toLocaleString().replace(/,/g, '  ');
//
//     if (decimalCount) {
//         const decimalValue = (rawPrice % 1).toFixed(decimalCount);
//         if (decimalValue > 0) {
//             return (result + decimalValue.slice(1)).replace('.', ',');
//         }
//     }
//
//     return result;
// }
