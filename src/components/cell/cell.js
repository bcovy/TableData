import { FormatDateTime } from "./formatters/datetime.js";
import { FormatLink } from "./formatters/link.js";
import { FormatNumeric } from "./formatters/numeric.js";
import { FormatStar } from "./formatters/star.js";
import { CssHelper } from "../../helpers/cssHelper.js";
/**
 * Represents a table cell `td` element in the grid.  Will apply formatting as defined in the column object.
 */
class Cell {
    // Formatter registry using strategy pattern
    static #formatters = {
        link: (rowData, column, element) => {
            element.append(FormatLink.apply(rowData, column.formatterParams));
        },
        date: (rowData, column, element) => {
            element.innerText = FormatDateTime.apply(rowData, column, column.settings.dateFormat, false);
        },
        datetime: (rowData, column, element) => {
            element.innerText = FormatDateTime.apply(rowData, column, column.settings.dateTimeFormat, true);
        },
        decimal: (rowData, column, element) => {
            element.innerText = FormatNumeric.apply(rowData, column, "decimal");
        },
        money: (rowData, column, element) => {
            element.innerText = FormatNumeric.apply(rowData, column, "currency");
        },
        percent: (rowData, column, element) => {
            element.innerText = FormatNumeric.apply(rowData, column, "percent");
        },
        star: (rowData, column, element) => {
            element.append(FormatStar.apply(rowData, column));
        }
    };
    /**
     * Creates an instance of a cell object that represents the `td` table body element.
     * @param {Array<object>} rowData Row data.
     * @param {Column} column Column object.
     * @param {Object} modules Grid module(s) added by user for custom formatting.
     * @param {HTMLTableRowElement} row Table row `tr` element.
     */
    constructor(rowData, column, modules, row) {
        this.element = document.createElement("td");

        if (column.formatter) {
            this.#applyFormatter(rowData, column, modules, row);
        } else {
            this.#setDefaultContent(rowData, column);
        }

        if (column.tooltipField) {
            this.#applyTooltip(rowData[column.tooltipField], column.tooltipLayout);
        }
    }
    /**
     * Sets default cell content when no formatter is specified.
     * @param {Array<object>} rowData Row data.
     * @param {Column} column Column object.
     */
    #setDefaultContent(rowData, column) {
        this.element.innerText = rowData[column.field] ?? "";
    }
    /**
     * Applies tooltip functionality to the cell. If the cell's content contains text only, it will create a tooltip 
     * `span` element and apply the content to it.
     * @param {string | number | Date | null} content Tooltip content to be displayed.
     * @param {string} layout CSS class for tooltip layout, either "tabledata-tooltip-right" or "tabledata-tooltip-left".
     */
    #applyTooltip(content, layout) {
        if (content === null || content === "") return;
        
        let tooltipElement = this.element.firstElementChild;

        if (tooltipElement === null) {
            tooltipElement = document.createElement("span");
            tooltipElement.innerText = this.element.innerText;
            this.element.replaceChildren(tooltipElement);
        }

        tooltipElement.dataset.tooltip = content;
        tooltipElement.classList.add(CssHelper.tooltip.parentClass, layout);
    }
    /**
     * Applies the appropriate formatter to the cell content.
     * @param {Array<object>} rowData Row data.
     * @param {Column} column Column object.
     * @param {Object} modules Grid module(s) added by user for custom formatting.
     * @param {HTMLTableRowElement} row Table row `tr` element.
     */
    #applyFormatter(rowData, column, modules, row) {
        // Handle custom function formatter from column definition.
        if (typeof column.formatter === "function") {
            this.element.append(column.formatter(rowData, column.formatterParams, this.element, row))
            return;
        }
        // Handle module formatter
        if (column.formatter === "module") {
            const moduleName = column.formatterModuleName;

            if (!modules?.[moduleName]) {
                console.warn(`Formatter module "${moduleName}" not found`);
                this.#setDefaultContent(rowData, column);
                return;
            }

            this.element.append(modules[moduleName].apply(rowData, column, row, this.element))
            return;
        }
        // Handle built-in formatter
        const formatter = Cell.#formatters[column.formatter];

        if (formatter) {
            // Set the cell content, either as text or DOM element.
            formatter(rowData, column, this.element);
        } else {
            this.#setDefaultContent(rowData, column);
        }
    }
}

export { Cell };