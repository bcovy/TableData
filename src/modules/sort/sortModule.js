import date from "./sorters/date.js";
import number from "./sorters/number.js";
import string from "./sorters/string.js";
/**
 * Class to manage sorting functionality in a grid context.  For remote processing, will subscribe 
 * to the `remoteParams` event.  For local processing, will subscribe to the `render` event.
 * 
 * Class will trigger the `render` event after sorting is applied, allowing the grid to 
 * re-render with the sorted data.
 */
class SortModule {
    /**
     * Creates a new SortModule object.
     * @param {GridContext} context Grid context object.
     */
    constructor(context) {
        this.context = context;
        this.headerCells = [];
        this.currentSortColumn = "";
        this.currentDirection = "";
        this.currentType = "";
        this.isRemote = false;
    }

    initialize() {
        this.isRemote = this.context.settings.remoteProcessing;

        if (this.isRemote) {
            this.currentSortColumn = this.context.settings.remoteSortDefaultColumn;
            this.currentDirection = this.context.settings.remoteSortDefaultDirection;
            this.context.events.subscribe("remoteParams", this.remoteParams, true);
        } else {
            this.context.events.subscribe("render", this.renderLocal, false, 9);
            this.sorters = { number: number, string: string, date: date, datetime: date };
        }

        this.initializeHeaderCells();
    }
    /**
     * Initialize sortable header cells by adding sort CSS class and click listeners.
     */
    initializeHeaderCells() {
        for (const col of this.context.columnManager.columns) {
            if (col.type !== "icon") {
                col.headerCell.span.classList.add("sort");
                col.headerCell.span.addEventListener("click", this.handleSort);
                this.headerCells.push(col.headerCell);
            }
        }
    }
    /**
     * Adds sort parameters to remote request params.
     * 
     * Method is used to chain parameters across multiple modules for remote processing.
     * @param {Object} params Remote request parameters
     * @returns {Object} Updated parameters with sort information
     */
    remoteParams = (params) => {
        params.sort = this.currentSortColumn;
        params.direction = this.currentDirection;

        return params;
    };
    /**
     * Updates the current sort state from a header cell click event.
     * @param {HeaderCell} headerCell The header cell that was clicked
     */
    updateSortState(headerCell) {
        this.currentSortColumn = headerCell.name;
        this.currentDirection = headerCell.directionNext.valueOf();
        this.currentType = headerCell.type;

        if (!headerCell.isCurrentSort) this.resetSort();
        
        headerCell.setSortFlag();
    }
    /**
     * Handles sorting when a header cell is clicked. Updates the current sort 
     * column and direction, sets the sort flag on the header cell, and triggers a 
     * re-render of the grid to display the sorted data (local) or fetch sorted 
     * data from the server (remote).
     * @param {Event} event Click event
     */
    handleSort = async (event) => {
        const headerCell = event.currentTarget.context;

        this.updateSortState(headerCell);

        await this.context.events.trigger("render");
    };
    /**
     * Resets the sort flag on the currently sorted column.
     */
    resetSort() {
        const cell = this.headerCells.find(e => e.isCurrentSort);

        if (cell !== undefined) cell.removeSortFlag();
    }
    /**
     * Performs local sorting on the data array.
     * This method is called during the render event for local processing.
     */
    renderLocal = () => {
        if (!this.currentSortColumn) return;

        this.context.persistence.data.sort((a, b) => {
            return this.sorters[this.currentType](a[this.currentSortColumn], b[this.currentSortColumn], this.currentDirection
            );
        });
    };
}

SortModule.moduleName = "sort";

export { SortModule };