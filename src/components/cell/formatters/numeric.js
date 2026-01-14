/**
 * Provides method to format numeric values into strings with specified styles of decimal, currency, or percent.
 */
class FormatNumeric {
    /**
     * Returns a formatted numeric string.  `column` is expected to have the following property values 
     * in `formatterParams` object: 
     * - precision: rounding precision.
     * @param {Object} rowData Row data.
     * @param {Column} column Column class object.
     * @param {string} [style="decimal"] Formatting style to use. Default is "decimal".
     * @returns {string}
     */
    static apply(rowData, column, style = "decimal") {
        const floatVal = rowData[column.field];

        if (isNaN(floatVal)) return floatVal;

        const precision = column.formatterParams?.precision ?? 2;

        return new Intl.NumberFormat("en-US", {
            style: style,
            maximumFractionDigits: precision,
            currency: "USD"
        }).format(floatVal);
    }
}

export { FormatNumeric };