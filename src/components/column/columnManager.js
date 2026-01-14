import { HeaderCell } from "../cell/headerCell.js";
import { Column } from "./column.js";
/**
 * Creates and manages the columns for the grid.  Will create a `Column` object for each column definition provided by the user.
 */
class ColumnManager {
    #columns;
    #indexCounter = 0;
    /**
     * Transforms user's column definitions into concrete `Column` class objects.  Will also create `HeaderCell` objects 
     * for each column.
     * @param {Array<Object>} columns Column definitions from user.
     * @param {SettingsGrid} settings Grid settings.
     */
    constructor(columns, settings) {
        this.#columns = [];
        this.settings = settings;
        this.tableEvenColumnWidths = settings.tableEvenColumnWidths;
        this.hasHeaderFilters = false;

        for (const c of columns) {
            const col = new Column(c, settings, this.#indexCounter);
          
            col.headerCell = new HeaderCell(col);

            this.#columns.push(col);
            this.#indexCounter++;
        }
        // Check if any column has a filter defined
        if (this.#columns.some((c) => c.hasFilter)) {
            this.hasHeaderFilters = true;
        }

        if (settings.tableEvenColumnWidths) {
            this.#setEvenColumnWidths();
        }
    }
    /**
     * Sets even column widths for all columns that do not have a width set by the user.
     * This method calculates the width based on the number of columns without a user-defined width.
     */
    #setEvenColumnWidths() { 
        //Count the number of columns that do not have a width set by the user.
        const count = this.#columns.filter(col => col.width === undefined).length;
        const userWidths = this.#columns.filter(col => col.width !== undefined).map(col => col.width);
        let totalUserWidth = 0;
        // Check if any user-defined widths are percentages.  If found, calculate the total sum so they
        // can be excluded from the even width calculation.
        for (const item of userWidths) { 
            if (typeof item === "string" && (item.includes("%"))) {
                totalUserWidth += parseFloat(item.replace("%", ""));
            }
        }

        const width = (100 - totalUserWidth) / count;

        for (const col of this.#columns) { 
            // If the column already has a width set, skip it
            if (col.headerCell.element.style.width) continue;
            // Set the width of the header cell to the calculated even width
            col.headerCell.element.style.width = `${width}%`;
        }
    }
    /**
     * Get array of `Column` objects.
     * @returns {Array<Column>} array of `Column` objects.
     */
    get columns() {
        return this.#columns;
    }
    /**
     * Adds a new column to the columns collection.
     * @param {Object} column Column definition object.
     * @param {number} [index=null] Index to insert the column at. If null, appends to the end.
     */
    addColumn(column, index = null) { 
        const col = new Column(column, this.settings, this.#indexCounter);
        col.headerCell = new HeaderCell(col);

        if (index !== null && index >= 0 && index < this.#columns.length) {
            this.#columns.splice(index, 0, col);
        } else {
            this.#columns.push(col);
        }

        this.#indexCounter++;

        if (this.tableEvenColumnWidths) {
            this.#setEvenColumnWidths();
        }
    }
}

export { ColumnManager };