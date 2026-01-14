class DateHelper {
    static timeReGex = new RegExp("[0-9]:[0-9]");
    /**
     * Convert string to Date object type.  Expects string format of year-month-day.
     * @param {string} value String date with format of year-month-day.
     * @returns {Date | string} Date if conversion is successful.  Otherwise, empty string.
     */
    static parseDate(value) {
        //Check if string is date only by looking for missing time component.  
        //If missing, add it so date is interpreted as local time.
        if (!this.timeReGex.test(value)) {
            value = `${value}T00:00`;
        }

        const date = new Date(value);
        
        return (Number.isNaN(date.valueOf())) ? "" : date;
    }
    /**
     * Convert string to Date object type, setting the time component to midnight.  Expects string format of year-month-day.
     * @param {string} value String date with format of year-month-day.
     * @returns {Date | string} Date if conversion is successful.  Otherwise, empty string.
     */
    static parseDateOnly(value) {
        const date = this.parseDate(value);

        if (date === "") return "";  //Invalid date.

        date.setHours(0, 0, 0, 0); //Set time to midnight to remove time component.

        return date;
    }
    /**
     * Returns `true` if value is a Date object type.
     * @param {object} value 
     * @returns {boolean} Returns `true` if value is a Date object type, otherwise `false`.
     */
    static isDate(value) { 
        return Object.prototype.toString.call(value) === "[object Date]";

    }
}

/**
 * Provides methods to format date and time strings.  Expects date string in format of year-month-day.
 */
class FormatDateTime {
    static monthsLong = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    static monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    static leadingZero(num) {
        return num < 10 ? "0" + num : num;
    }
    /**
     * Returns a formatted date time string.  Expects date string in format of year-month-day.  If `formatterParams` is empty, 
     * function will revert to default values. Expected property values in `formatterParams` object:
     * - dateField: field to convert date time.
     * - format: string format template.
     * @param {Object} rowData Row data.
     * @param {Column} column Column class object.
     * @param {string} defaultFormat Default string format: MM/dd/yyyy
     * @param {boolean} [addTime=false] Apply date time formatting?
     * @returns {string}
     */
    static apply(rowData, column, defaultFormat = "MM/dd/yyyy", addTime = false) {
        let result = column?.formatterParams?.format ?? defaultFormat;
        let field = column?.formatterParams?.dateField 
            ? rowData[column.formatterParams.dateField]
            : rowData[column.field];

        if (field === null) {
            return "";
        }

        const date = DateHelper.parseDate(field);

        if (date === "") {
            return "";
        }

        let formats = {
            d: date.getDate(),
            dd: this.leadingZero(date.getDate()),

            M: date.getMonth() + 1,
            MM: this.leadingZero(date.getMonth() + 1),
            MMM: this.monthsShort[date.getMonth()],
            MMMM: this.monthsLong[date.getMonth()],

            yy: date.getFullYear().toString().slice(-2),
            yyyy: date.getFullYear()
        };

        if (addTime) {
            let hours = date.getHours();
            let hours12 = hours % 12 === 0 ? 12 : hours % 12;

            formats.s = date.getSeconds();
            formats.ss = this.leadingZero(date.getSeconds());
            formats.m = date.getMinutes();
            formats.mm = this.leadingZero(date.getMinutes());
            formats.h = hours12;
            formats.hh =  this.leadingZero(hours12);
            formats.H = hours;
            formats.HH = this.leadingZero(hours);
            formats.hp = hours < 12 ? "AM" : "PM";
        }

        const targets = result.split(/\/|-|\s|:/);

        for (let item of targets) {
            result = result.replace(item, formats[item]);
        }
    
        return result;
    }
}

/**
 * Provides method to format a link as an anchor tag element.
 */
class FormatLink {
    /**
     * Formatter that create an anchor tag element. href and other attributes can be modified with properties in the 
     * 'formatterParams' parameter.  Expected property values: 
     * - urlPrefix: Base url address.
     * - routeField: Route value.
     * - queryField: Field name from dataset to build query sting key/value input.
     * - fieldText: Use field name to set inner text to associated dataset value.
     * - innerText: Raw inner text value or function.  If function is provided, it will be called with rowData and formatterParams as parameters.
     * - target: How target document should be opened.
     * @param {Object} rowData Row data.
     * @param {{ urlPrefix: string, queryField: string, fieldText: string, innerText: string | Function, target: string }} formatterParams Settings.
     * @return {HTMLAnchorElement} anchor tag element.
     * */
    static apply(rowData, formatterParams) {
        const el = document.createElement("a");

        let url = formatterParams.urlPrefix;
        //Apply route value before query string.
        if (formatterParams.routeField) {
            url += "/" + encodeURIComponent(rowData[formatterParams.routeField]);
        }

        if (formatterParams.queryField) {
            const qryValue = encodeURIComponent(rowData[formatterParams.queryField]);

            url = `${url}?${formatterParams.queryField}=${qryValue}`;
        }

        el.href = url;

        if (formatterParams.fieldText) {
            el.innerHTML = rowData[formatterParams.fieldText];
        } else if ((typeof formatterParams.innerText === "function")) {
            el.innerHTML = formatterParams.innerText(rowData, formatterParams);
        } else if (formatterParams.innerText) {
            el.innerHTML = formatterParams.innerText;
        }

        if (formatterParams.target) {
            el.setAttribute("target", formatterParams.target);
            el.setAttribute("rel", "noopener");
        }

        return el;
    }
}

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

class FormatStar {
    /**
     * Returns an element of star ratings based on integer values.  Expected property values: 
     * - stars: number of stars to display.
     * @param {Object} rowData row data.
     * @param {Column} column column class object.
     * @returns {HTMLDivElement}
     */
    static apply(rowData, column) {
        let value = rowData[column.field];
        const maxStars = column.formatterParams?.stars ? column.formatterParams.stars : 5;
        const container = document.createElement("div");
        const stars = document.createElement("span");
        const star = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const starActive = '<polygon fill="#FFEA00" stroke="#C1AB60" stroke-width="37.6152" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" points="259.216,29.942 330.27,173.919 489.16,197.007 374.185,309.08 401.33,467.31 259.216,392.612 117.104,467.31 144.25,309.08 29.274,197.007 188.165,173.919 "/>';
        const starInactive = '<polygon fill="#D2D2D2" stroke="#686868" stroke-width="37.6152" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" points="259.216,29.942 330.27,173.919 489.16,197.007 374.185,309.08 401.33,467.31 259.216,392.612 117.104,467.31 144.25,309.08 29.274,197.007 188.165,173.919 "/>';

        //style stars holder
        stars.style.verticalAlign = "middle";
        //style star
        star.setAttribute("width", "14");
        star.setAttribute("height", "14");
        star.setAttribute("viewBox", "0 0 512 512");
        star.setAttribute("xml:space", "preserve");
        star.style.padding = "0 1px";

        value = value && !isNaN(value) ? parseInt(value) : 0;
        value = Math.max(0, Math.min(value, maxStars));

        for(let i = 1; i <= maxStars; i++){
            const nextStar = star.cloneNode(true);

            nextStar.innerHTML = i <= value ? starActive : starInactive;

            stars.appendChild(nextStar);
        }

        container.style.whiteSpace = "nowrap";
        container.style.overflow = "hidden";
        container.style.textOverflow = "ellipsis";
        container.setAttribute("aria-label", value);
        container.append(stars);

        return container;
    }
}

class CssHelper {
    static between = {
        button: "tabledata-between-button",
        label: "tabledata-between-input-label"
    };

    static noHeader = "tabledata-no-header";
    static input = "tabledata-input";

    static multiSelect = {
        parentClass: "tabledata-multi-select",
        header: "tabledata-multi-select-header",
        headerActive: "tabledata-multi-select-header-active",
        headerOption: "tabledata-multi-select-header-option",
        options: "tabledata-multi-select-options",
        option: "tabledata-multi-select-option",
        optionText: "tabledata-multi-select-option-text",
        optionRadio: "tabledata-multi-select-option-radio",
        selected: "tabledata-multi-select-selected"
    };

    static tooltip = { 
        parentClass: "tabledata-tooltip",
        right: "tabledata-tooltip-right",
        left: "tabledata-tooltip-left"
    };
}

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
            this.element.append(column.formatter(rowData, column.formatterParams, this.element, row));
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

            this.element.append(modules[moduleName].apply(rowData, column, row, this.element));
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

/**
 * Defines a single header cell 'th' element.
 */
class HeaderCell {
    /**
     * Create header object that represents the `th` table header element.  Class will persist column sort and order user input.
     * @param {Column} column column object.
     */
    constructor(column) {
        this.column = column;
        this.settings = column.settings;
        this.element = document.createElement("th");
        this.span = document.createElement("span");
        this.name = column.field;
        this.direction = "desc";
        this.directionNext = "desc";
        this.type = column.type;

        if (column.headerCss) {
            this.element.classList.add(column.headerCss);
        }

        if (this.settings.tableHeaderThCss) {
            this.element.classList.add(this.settings.tableHeaderThCss);
        }

        if (column.columnSize) {
            this.element.classList.add(column.columnSize);
        }

        if (column.width) {
            this.element.style.width = column.width;
        }

        if (column.headerFilterEmpty) {
            this.span.classList.add(column.headerFilterEmpty);
        }

        this.element.appendChild(this.span);
        this.element.context = this;
        this.span.innerText = column.label;
        this.span.context = this;
    }
    /**
     * Set the sort flag for the header cell.
     */
    setSortFlag() {
        if (this.icon === undefined) {
            this.icon = document.createElement("i");
            this.span.append(this.icon);
        }

        if (this.directionNext === "desc") {
            this.icon.classList = this.settings.tableCssSortDesc;
            this.direction = "desc";
            this.directionNext = "asc";
        } else {
            this.icon.classList = this.settings.tableCssSortAsc;
            this.direction = "asc";
            this.directionNext = "desc";
        }
    }
    /**
     * Remove the sort flag for the header cell.
     */
    removeSortFlag() {
        this.direction = "desc";
        this.directionNext = "desc";
        this.icon = this.icon.remove();
    }

    get isCurrentSort() {
        return this.icon !== undefined;
    }
}

/**
 * Defines a single column for the grid.  Transforms user's column definition into Class properties.
 * @class
 */
class Column {
    /**
     * Create column object which transforms user's column definition into Class properties.
     * @param {Object} column User's column definition/settings.
     * @param {SettingsGrid} settings grid settings.
     * @param {number} index column index number.
     */
    constructor(column, settings, index = 0) {
        this.settings = settings;
        this.index = index;

        if (column.field === undefined) {
            this.field = `column${index}`;  //associated data field name.
            this.type = "icon";  //icon type.
            this.label = "";
        } else {
            this.field = column.field;  //associated data field name.
            this.type = column.type ? column.type : "string";  //value type.
            this.label = column.label 
                ? column.label 
                : column.field[0].toUpperCase() + column.field.slice(1);  //column title.
        }

        if (column?.formatterModuleName) { 
            this.formatter = "module";
            this.formatterModuleName = column.formatterModuleName;  //formatter module name.
        } else {
            this.formatter = column.formatter;  //formatter type or function.
            this.formatterParams = column.formatterParams;
        }

        this.headerCss = column.headerCss;
        this.columnSize = column?.columnSize ? `tabledata-col-${column.columnSize}` : "";
        this.width = column?.width ?? undefined;
        this.hasFilter = this.type !== "icon" && column.filterType ? true : false;
        this.headerCell = undefined;  //HeaderCell class.
        this.headerFilter = undefined;  //HeaderFilter class.

        if (this.hasFilter) {
            this.#initializeFilter(column, settings);
        } else if (column?.headerFilterEmpty) {
            this.headerFilterEmpty = (typeof column.headerFilterEmpty === "string") 
                ? column.headerFilterEmpty : CssHelper.noHeader;
        }
        //Tooltip setting.
        if (column.tooltipField) {
            this.tooltipField = column.tooltipField;
            this.tooltipLayout = column?.tooltipLayout === "right" ? CssHelper.tooltip.right : CssHelper.tooltip.left;
        }
    }
    /**
     * Initializes filter properties.
     * @param {Object} column 
     * @param {Settings} settings 
     */
    #initializeFilter(column, settings) {
        this.filterElement = column.filterType === "between" ? "between" : "input";
        this.filterType = column.filterType;  //filter type descriptor, such as: equals, like, <, etc; can also be a function.
        this.filterParams = column.filterParams;
        this.filterCss = column?.filterCss ?? settings.tableFilterCss;
        this.filterRealTime = column?.filterRealTime ?? false;

        if (column.filterValues) {
            this.filterValues = column.filterValues;  //select option filter value.
            this.filterValuesRemoteSource = typeof column.filterValues === "string" ? column.filterValues : undefined;  //select option filter value ajax source.
            this.filterElement = column.filterMultiSelect ? "multi" : "select";
            this.filterMultiSelect = column.filterMultiSelect;
        }
    }
}

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

const settingsDefaults = {
    baseIdName: "tabledata",  //base name for all element ID's.
    data: [],  //row data.
    columns: [],  //column definitions.
    enablePaging: true,  //enable paging of data.
    pagerPagesToDisplay: 5,  //max number of pager buttons to display.
    pagerRowsPerPage: 25,  //rows per page.
    pagerCss: "tabledata-pager", //css class for pager container.
    dateFormat: "MM/dd/yyyy",  //row level date format.
    dateTimeFormat: "MM/dd/yyyy HH:mm:ss", //row level date format.
    remoteUrl: "",  //get data from url endpoint via Ajax.
    remoteParams: "",  //parameters to be passed on Ajax request.
    remoteProcessing: false,  //truthy sets grid to process filter/sort on remote server.
    tableCss: "tabledata", 
    tableStyleSettings: "", //custom style settings for table element.  object with key/value pairs.
    tableHeaderThCss: "",
    tableFilterCss: "tabledata-input",  //css class for header filter input elements.
    tableEvenColumnWidths: false,  //should all columns be equal width?
    tableCssSortAsc: "tabledata-sort-icon tabledata-sort-asc",
    tableCssSortDesc: "tabledata-sort-icon tabledata-sort-desc",
    refreshableId: "",  //refresh remote data sources for grid and/or filter values.
    rowCountId: "",
    csvExportId: "",
    csvExportRemoteSource: "" //get export data from url endpoint via Ajax; useful to get non-paged data.
};

class MergeOptions {
    /**
     * Returns an object based on the merged results of the default and user provided settings.
     * User provided settings will override defaults.
     * @param {Object} source user supplied settings.
     * @returns {Object} settings merged from default and user values.
     */
    static merge(source) {
        //copy default key/value items.
        let result = JSON.parse(JSON.stringify(settingsDefaults));

        if (source === undefined || Object.keys(source).length === 0) {
            return result;
        }
        
        for (let [key, value] of Object.entries(source)) {
            let targetType = result[key] !== undefined ? result[key].toString() : undefined;
            let sourceType = value.toString();

            if (targetType !== undefined && targetType !== sourceType) {
                result[key] = value;
            }
        }

        return result;
    }
}

/**
 * Implements the property settings for the grid.
 */
class SettingsGrid {
    /**
     * Translates settings from merged user/default options into a definition of grid settings.
     * @param {Object} options Merged user/default options.
     */
    constructor(options) {
        this.baseIdName = options.baseIdName;
        this.enablePaging = options.enablePaging;
        this.pagerPagesToDisplay = options.pagerPagesToDisplay;
        this.pagerRowsPerPage = options.pagerRowsPerPage;
        this.dateFormat = options.dateFormat;
        this.dateTimeFormat = options.dateTimeFormat;
        this.remoteUrl = options.remoteUrl;  
        this.remoteParams = options.remoteParams;
        this.remoteProcessing = false;
        
        this.ajaxUrl = (this.remoteUrl && this.remoteParams) ? this._buildAjaxUrl(this.remoteUrl, this.remoteParams) : this.remoteUrl;

        if (typeof options.remoteProcessing === "boolean" && options.remoteProcessing) {
            // Remote processing set to `on`; use first column with field as default sort.
            const first = options.columns.find((item) => item.field !== undefined);

            this.remoteProcessing = true;
            this.remoteSortDefaultColumn = first.field;
            this.remoteSortDefaultDirection = "desc";
        } else if (Object.keys(options.remoteProcessing).length > 0) {
            // Remote processing set to `on` using key/value parameter inputs for default sort column.
            this.remoteProcessing = true;
            this.remoteSortDefaultColumn = options.remoteProcessing.column;
            this.remoteSortDefaultDirection = options.remoteProcessing.direction ?? "desc";
        } 

        this.tableCss = options.tableCss;
        this.tableHeaderThCss = options.tableHeaderThCss;
        this.tableStyleSettings = options.tableStyleSettings; 
        this.pagerCss = options.pagerCss;
        this.tableFilterCss = options.tableFilterCss;
        this.tableEvenColumnWidths = options.tableEvenColumnWidths;
        this.tableCssSortAsc = options.tableCssSortAsc;
        this.tableCssSortDesc = options.tableCssSortDesc;
        this.refreshableId = options.refreshableId;
        this.rowCountId = options.rowCountId;
        this.csvExportId = options.csvExportId;
        this.csvExportRemoteSource = options.csvExportRemoteSource;
    }
    /**
     * Compiles the key/value query parameters into a fully qualified url with query string.
     * @param {string} url base url.
     * @param {object} params query string parameters.
     * @returns {string} url with query parameters.
     */
    _buildAjaxUrl(url, params) {
        const p = Object.keys(params);

        if (p.length > 0) {
            const query = p.map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
                .join("&");

            return `${url}?${query}`;
        }
        
        return url;
    }
}

class DataLoader {
    /**
     * Create class to retrieve data via an Ajax call.
     * @param {SettingsGrid} settings grid settings.
     */
    constructor(settings) {
        this.ajaxUrl = settings.ajaxUrl;
    }
    /***
     * Uses input parameter's key/value paris to build a fully qualified url with query string values.
     * @param {string} url Target url.
     * @param {object} [parameters={}] Input parameters.
     * @returns {string} Fully qualified url.
     */
    buildUrl(url, parameters = {}) {
        const p = Object.keys(parameters);
  
        if (p.length === 0) {
            return url;
        }

        let result = [];

        for (const key of p) {
            if (Array.isArray(parameters[key])) {
                const multi = parameters[key].map(k => `${key}=${encodeURIComponent(k)}`);

                result = result.concat(multi);
            } else {
                result.push(`${key}=${encodeURIComponent(parameters[key])}`);
            }
        }

        return url.indexOf("?") !== -1 ? `${url}&${result.join("&")}` : `${url}?${result.join("&")}`;
    }
    /**
     * Makes an Ajax call to target resource, and returns the results as a JSON array.
     * @param {string} url url.
     * @param {Object} parameters key/value query string pairs.
     * @returns {Array | Object}
     */
    async requestData(url, parameters = {}) {
        let result = [];
        const targetUrl = this.buildUrl(url, parameters);

        try {
            const response = await fetch(targetUrl, { 
                method: "GET", 
                mode: "cors",
                headers: { Accept: "application/json" } 
            });
            
            if (response.ok) {
                result = await response.json();
            } 
        } catch (err) {
            window.alert(err.message);
            console.log(err.message);
            result = [];
        }
  
        return result;
    }
    /**
     * Makes an Ajax call to target resource identified in the `ajaxUrl` Settings property, and returns the results as a JSON array.
     * @param {Object} [parameters={}] key/value query string pairs.
     * @returns {Array | Object}
     */
    async requestGridData(parameters = {}) {
        return this.requestData(this.ajaxUrl, parameters);
    }
}

/**
 * Provides methods to store and persist data for the grid.
 */
class DataPersistence {
    /**
     * Creates class object to store and persist grid data.
     * @param {Array<Object>} data row data.
     */
    constructor(data) {
        this.data = data;
        this.dataCache = data.length > 0 ? structuredClone(data) : [];
    }
    /**
     * Returns the row data.
     * @returns {number} Count of rows in the data.
     */
    get rowCount() {
        return this.data.length;
    }
    /**
     * Saves the data to the class object.  Will also cache a copy of the data for later restoration if filtering or sorting is applied.
     * @param {Array<object>} data Data set.
     */
    setData = (data) => {
        if (!Array.isArray(data)) {
            this.data = [];
            this.dataCache = [];
            return;
        }

        this.data = data;
        this.dataCache = data.length > 0 ? structuredClone(data) : [];
    };
    /**
     * Resets the data to the original state when the class was created.
     */
    restoreData() {
        this.data = structuredClone(this.dataCache);
    }
}

/**
 * Class to build a data-processing pipeline that invokes an async function to retrieve data from a remote source, 
 * and pass the results to an associated handler function.  Will execute steps in the order they are added to the class.
 * 
 * The main purpose of this class is to retrieve remote data for select input controls, but can be used for any handling 
 * of remote data retrieval and processing.
 */
class DataPipeline {
    #pipelines;
    /**
     * Creates data-processing pipeline class.  Will internally build a key/value pair of events and associated
     * callback functions.  Value will be an array to accommodate multiple callbacks assigned to the same event 
     * key name.
     * @param {SettingsGrid} settings 
     */
    constructor(settings) {
        this.#pipelines = {}; 
        this.ajaxUrl = settings.ajaxUrl;
    }

    countEventSteps(eventName) {
        if (!this.#pipelines[eventName]) return 0;

        return this.#pipelines[eventName].length;
    }
    /**
     * Returns `true` if steps are registered for the associated event name, or `false` if no matching results are found.
     * @param {string} eventName Event name.
     * @returns {boolean} `true` if results are found for event name, otherwise `false`.
     */
    hasPipeline(eventName) {
        if (!this.#pipelines[eventName]) return false;

        return this.#pipelines[eventName].length > 0;
    }
    /**
     * Register an asynchronous callback step to the pipeline.  More than one callback can be registered to the same event name.
     * 
     * If a duplicate/matching event name and callback function has already been registered, method will skip the 
     * registration process.
     * @param {string} eventName Event name.
     * @param {Function} callback An async function.
     * @param {string} [url=""] Target url.  Will use `ajaxUrl` property default if argument is empty.
     */
    addStep(eventName, callback, url = "") {
        if (!this.#pipelines[eventName]) {
            this.#pipelines[eventName] = [];
        } else if (this.#pipelines[eventName].some((x) => x.callback === callback)) {
            console.warn("Callback function already found for: " + eventName);
            return;  // If event name and callback already exist, don't add.
        }

        if (url === "") {
            url = this.ajaxUrl;
        }

        this.#pipelines[eventName].push({url: url, callback: callback});
    }
    /**
     * Executes the HTTP request(s) for the given event name, and passes the results to the associated callback function.  
     * Method expects return type of request to be a JSON response.
     * @param {string} eventName 
     */
    async execute(eventName) {
        for (let item of this.#pipelines[eventName]) {
            try {
                const response = await fetch(item.url, { 
                    method: "GET", 
                    mode: "cors",
                    headers: { Accept: "application/json" } 
                });
                
                if (response.ok) {
                    const data = await response.json();

                    item.callback(data);
                } 
            } catch (err) {
                window.alert(err.message);
                console.log(err.message);
                break;
            }
        }
    }
}

class ElementHelper {
    /**
     * Creates an HTML element with the specified tag and properties.
     * @param {string} tag The tag name of the element to create.
     * @param {Object} [properties={}] An object containing properties to assign to the element.
     * @param {Object} [dataset={}] An object containing dataset attributes to assign to the element.
     * @returns {HTMLElement} The created HTML element.
     */
    static create(tag, properties = {}, dataset = {}) {
        const element = Object.assign(document.createElement(tag), properties);

        if (dataset) { 
            Object.assign(element.dataset, dataset);
        }

        return element;
    }
    /**
     * Creates a `div` element with the specified properties and dataset.
     * @param {Object} [properties={}] An object containing properties to assign to the element.
     * @param {Object} [dataset={}] An object containing dataset attributes to assign to the element.
     * @returns {HTMLDivElement} The created HTML element.
     */
    static div(properties = {}, dataset = {}) {
        return this.create("div", properties, dataset);
    }
    /**
     * Creates a `input` element with the specified properties and dataset.
     * @param {Object} [properties={}] An object containing properties to assign to the element.
     * @param {Object} [dataset={}] An object containing dataset attributes to assign to the element.
     * @returns {HTMLInputElement} The created HTML element.
     */
    static input(properties = {}, dataset = {}) {
        return this.create("input", properties, dataset);
    }
    /**
     * Creates a `span` element with the specified properties and dataset.
     * @param {Object} [properties={}] An object containing properties to assign to the element.
     * @param {Object} [dataset={}] An object containing dataset attributes to assign to the element.
     * @returns {HTMLSpanElement} The created HTML element.
     */
    static span(properties = {}, dataset = {}) {
        return this.create("span", properties, dataset);
    }
}

/**
 * Class that allows the subscription and publication of grid related events.
 * @class
 */
class GridEvents {
    #events;

    constructor() {
        this.#events = {};
    }

    #guard(eventName) {
        if (!this.#events) return false;

        return (this.#events[eventName]);
    }
    /**
     * Adds an event to publisher collection.
     * @param {string} eventName Event name.
     * @param {Function} handler Callback function.
     * @param {boolean} [isAsync=false] True if callback should execute with await operation.
     * @param {number} [priority=0] Order in which event should be executed.
     */
    subscribe(eventName, handler, isAsync = false, priority = 0) {
        if (!this.#events[eventName]) {
            this.#events[eventName] = [{ handler, priority, isAsync }];
            return;
        }
        
        this.#events[eventName].push({ handler, priority, isAsync });
        this.#events[eventName].sort((a, b) => {
            return a.priority - b.priority;
        });
    }
    /**
     * Removes the target event from the publication chain.
     * @param {string} eventName Event name.
     * @param {Function} handler Event handler.
     */
    unsubscribe(eventName, handler) {
        if (!this.#guard(eventName)) return;

        this.#events[eventName] = this.#events[eventName].filter(h => h.handler !== handler);
    }
    /**
     * Takes the result of each subscriber's callback function and chains them into one result.
     * Used to create a list of parameters from multiple modules: i.e. sort, filter, and paging inputs.
     * @param {string} eventName event name
     * @param {Object} [initialValue={}] initial value
     * @returns {Object}
     */
    chain(eventName, initialValue = {}) {
        if (!this.#guard(eventName)) return;

        let result = initialValue;

        this.#events[eventName].forEach((h) => {
            result = h.handler(result);
        });

        return result;
    }
    /**
     * Trigger callback function for subscribers of the `eventName`.
     * @param {string} eventName Event name.
     * @param  {...any} args Arguments.
     */
    async trigger(eventName, ...args) {
        if (!this.#guard(eventName)) return;

        for (let h of this.#events[eventName]) {
            if (h.isAsync) {
                await h.handler(...args);
            } else {
                h.handler(...args);
            }
        }
    }
}

/**
 * Class to manage the table element and its rows and cells.
 */
class Table {
    #rowCount;
    /**
     * Create `Table` class to manage the table element and its rows and cells.
     * @param {GridContext} context Grid context.
     */
    constructor(context) {
        this.context = context;
        this.table = document.createElement("table");
        this.thead = document.createElement("thead");
        this.tbody = document.createElement("tbody");
        this.#rowCount = 0;

        this.table.id = `${context.settings.baseIdName}_table`;
        this.table.append(this.thead, this.tbody);
        this.table.className = context.settings.tableCss;

        if (context.settings.tableStyleSettings && typeof context.settings.tableStyleSettings === "object") {
            // Apply custom style settings to table element.
            for (const [key, value] of Object.entries(context.settings.tableStyleSettings)) {
                this.table.style[key] = value;
            }
        }
    }
    /**
     * Initializes the table header row element by creating a row and appending each column's header cell.
     */
    initializeHeader() {
        const tr = document.createElement("tr");

        for (const column of this.context.columnManager.columns) {
            tr.appendChild(column.headerCell.element);
        }

        this.thead.appendChild(tr);
    }
    /**
     * Render table body rows.  Will remove any prior table body results and build new rows and cells.
     * @param {Array<Object>} dataset Data set to build table rows.
     * @param {number | null} [rowCount=null] Set the row count parameter to a specific value if 
     * remote processing is being used, otherwise will use the length of the dataset.
     */
    renderRows(dataset, rowCount = null) {
        //Clear body of previous data.
        this.tbody.replaceChildren();
        
        if (!Array.isArray(dataset)) {
            this.#rowCount = 0;
            return;
        }

        this.#rowCount = rowCount ?? dataset.length;

        for (const data of dataset) {
            const tr = document.createElement("tr");

            for (let column of this.context.columnManager.columns) {
                const cell = new Cell(data, column, this.context.modules, tr);

                tr.appendChild(cell.element);
            }

            this.tbody.appendChild(tr);
        }
    }

    get rowCount() {
        return this.#rowCount;
    }
}

/**
 * Provides the context for the grid, including settings, data, and modules.  This class is responsible for managing 
 * the grid's core state and behavior.
 */
class GridContext {
    /**
     * Create grid context, which represents the core logic and functionality of the data grid.
     * @param {Array<object>} columns Column definition.
     * @param {SettingsGrid} settings Grid settings.
     * @param {any[]} [data=[]] Grid data.
     */
    constructor(columns, settings, data = []) {
        this.settings = settings;
        this.events = new GridEvents();
        this.pipeline = new DataPipeline(this.settings);
        this.dataloader = new DataLoader(this.settings);
        this.persistence = new DataPersistence(data);
        this.columnManager = new ColumnManager(columns, this.settings);
        this.grid = new Table(this);
        this.modules = {};
    }
}

/**
 * Provides logic to convert grid data into a downloadable CSV file.
 * Module will provide limited formatting of data.  Only columns with a formatter type 
 * of `module` or `function` will be processed.  All other columns will be returned as
 * their raw data type.  If a column's value contains a comma, the value will be double quoted.
 */
class CsvModule {
    /**
     * Allows grid's data to be converted into a downloadable CSV file.  If grid is 
     * set to a local data source, the data cache in the persistence class is used.
     * Otherwise, class will make an Ajax call to remote target set in data loader
     * class.
     * @param {GridContext} context Grid context class.
     */
    constructor(context) {
        this.context = context;
        this.delimiter = ",";
        this.button = context.settings.csvExportId;
        this.dataUrl = context.settings.csvExportRemoteSource;
    }

    initialize() {
        const btn = document.getElementById(this.button);
        
        btn.addEventListener("click", this.handleDownload);
    }

    handleDownload = async () => {
        let csvData = [];
        const fileName = `${document.title}.csv`;

        if (this.dataUrl) {
            const data = await this.context.dataloader.requestData(this.dataUrl);

            csvData = this.buildFileContent(data).join("\r\n");
        } else {
            csvData = this.buildFileContent(this.context.persistence.dataCache).join("\r\n");
        }

        const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
        const element = document.createElement("a");

        element.setAttribute("href", window.URL.createObjectURL(blob));
        //set file title
        element.setAttribute("download", fileName);
        //trigger download
        element.style.display = "none";
        document.body.appendChild(element);
        element.click();
        //remove temporary link element
        document.body.removeChild(element);

        window.alert(`Downloaded ${fileName}`);
    };
    /**
     * Returns an object that represents the columns and header names that should be used
     * to create the CSV results.  Will exclude columns with a type of `icon`.
     * @param {Object} columnMgrColumns Column Manager Columns collection.
     * @returns {{ headers: Array<string>, columns: Array<Column> }}
     */
    identifyColumns(columnMgrColumns) {
        const headers = [];
        const columns = [];

        for (const column of columnMgrColumns) {
            if (column.type === "icon") continue;

            headers.push(column.label);
            columns.push(column);
        }

        return { headers: headers, columns: columns }; 
    }
    /**
     * Converts grid data in DataPersistence class into a single dimensional array of
     * string delimited values that represents a row of data in a csv file. 
     * @param {Array<Object>} dataset data set to build csv rows.
     * @returns {Array<string>}
     */
    buildFileContent(dataset) {
        const fileContents = [];
        const columns = this.identifyColumns(this.context.columnManager.columns);
        //create delimited header.
        fileContents.push(columns.headers.join(this.delimiter));
        //create row data
        for (const rowData of dataset) {
            const result = columns.columns.map((c) => this.formatValue(c, rowData));

            fileContents.push(result.join(this.delimiter));
        }

        return fileContents;
    }
    /**
     * Returns a formatted string based on the Column's formatter setting.
     * Will double quote string if comma character is found in value.
     * @param {Column} column column model.
     * @param {Object} rowData row data.
     * @returns {string}
     */
    formatValue(column, rowData) {
        let value = String(rowData[column.field]);
        //apply limited formatting; csv results should be 'raw' data.
        if (column.formatter) {
            if (typeof column.formatter === "function") {
                value = String(column.formatter(rowData, column.formatterParams));
            } else if (column.formatter === "module") {
                value = String(this.context.modules[column.formatterModuleName].applyCsv(rowData, column));
            }
        }
        //check for strings that may need to be quoted.
        if (value.includes(",")) {
            value = `"${value}"`;
        }

        return value;
    }
}

CsvModule.moduleName = "csv";

/**
 * Create filter object that represents a element to filter between two values.  Creates a dropdown with a two input boxes 
 * to enter start and end values.
 */
class ElementBetween {
    /**
     * Create filter object that represents a between element.
     * @param {Column} column Column class object.
     * @param {GridContext} context Grid context object.
     */
    constructor(column, context) {
        this.context = context;
        this.element = ElementHelper.div({ name: column.field, className: CssHelper.multiSelect.parentClass });
        this.header = ElementHelper.div({ className: CssHelper.multiSelect.header });
        this.optionsContainer = ElementHelper.div({ className: CssHelper.multiSelect.options });
        this.field = column.field;
        this.fieldType = column.type;  //field value type.
        this.filterType = "between";  //condition type.

        this.element.id = `${this.context.settings.baseIdName}_${this.field}`;
        this.element.append(this.header, this.optionsContainer);
        this.header.id = `header_${this.context.settings.baseIdName}_${this.field}`;
        this.optionsContainer.style.minWidth = "185px";

        this.#templateBetween();
        this.header.addEventListener("click", this.handleClick);
    }

    #templateBetween() {
        this.elementStart = ElementHelper.input({ className: CssHelper.input, id: `start_${this.context.settings.baseIdName}_${this.field}` });

        this.elementEnd = ElementHelper.input({ className: CssHelper.input, id: `end_${this.context.settings.baseIdName}_${this.field}` });
        this.elementEnd.style.marginBottom = "10px";

        const start = ElementHelper.span({ innerText: "Start", className: CssHelper.between.label });
        const end =  ElementHelper.span({ innerText: "End", className: CssHelper.between.label });
 
        const btnApply = ElementHelper.create("button", { innerText: "Apply", className: CssHelper.between.button });
        btnApply.style.marginRight = "10px";
        btnApply.addEventListener("click", this.handleClick);

        const btnClear = ElementHelper.create("button", { innerText: "Clear", className: CssHelper.between.button });
        btnClear.addEventListener("click", this.handleButtonClear);

        this.optionsContainer.append(start, this.elementStart, end, this.elementEnd, btnApply, btnClear);
    }

    handleButtonClear = () => {
        this.elementStart.value = "";
        this.elementEnd.value = "";

        if (this.countLabel !== undefined) {
            this.countLabel.remove();
            this.countLabel = undefined;
        }
    };

    createCountLabel = () => {
        //update count label.
        if (this.countLabel === undefined) {
            this.countLabel = document.createElement("span");
            this.countLabel.className = CssHelper.multiSelect.headerOption;
            this.header.append(this.countLabel);
        }

        if (this.elementStart.value !== "" && this.elementEnd.value !== "") {
            this.countLabel.innerText = `${this.elementStart.value} to ${this.elementEnd.value}`;
        } else {
            this.countLabel.remove();
            this.countLabel = undefined;
        }
    };

    handleClick = async () => {
        const status = this.header.classList.toggle(CssHelper.multiSelect.headerActive);

        if (!status) {
            //Close window and apply filter value.
            this.createCountLabel();
            await this.context.events.trigger("render");
            document.removeEventListener("click", this.handleDocument);
        } else {
            document.addEventListener("click", this.handleDocument);
        }
    };
    /**
     * Handler event to close dropdown when user clicks outside the multi-select control.  Event is removed when multi-select is 
     * not active so that it's not firing on redundant events.
     * @param {Object} e Object that triggered event.
     */
    handleDocument = async (e) => {
        if (!e.target.closest(`.${CssHelper.input}`) && !e.target.closest(`#${this.header.id}`)) {
            this.header.classList.remove(CssHelper.multiSelect.headerActive);

            await this.context.events.trigger("render");

            document.removeEventListener("click", this.handleDocument);
        }
    };
    /**
     * Returns an array of the start and end values from input source.  If either input source is empty, an empty string will be returned.
     * @returns {Array | string} Array of start and end values or empty string.
     */
    get value() {
        if (this.elementStart.value === "" || this.elementEnd.value === "") return "";

        return [this.elementStart.value, this.elementEnd.value];
    }
}

/**
 * Represents a columns filter control.  Creates a `HTMLInputElement` that is added to the header row of 
 * the grid to filter data specific to its defined column. 
 */
class ElementInput {
    /**
     * Create filter object that represents a `HTMLSelectElement` element in the table's header row.
     * @param {Column} column Column class object.
     * @param {GridContext} context Grid context.
    */
    constructor(column, context) {
        this.element = document.createElement("input");
        this.context = context;
        this.field = column.field;
        this.fieldType = column.type;  //field value type.
        this.filterType = column.filterType;  //condition type.
        this.filterIsFunction = (typeof column?.filterType === "function");
        this.filterParams = column.filterParams;
        this.element.name = this.field;
        this.element.id = this.field;
        this.element.addEventListener("change", async () => await this.context.events.trigger("render"));

        if (column.filterCss) {
            this.element.className = column.filterCss;
        }

        if (!this.context.settings.remoteProcessing && column.filterRealTime) {
            this.realTimeTimeout = (typeof this.filterRealTime === "number") 
                ? this.filterRealTime 
                : 500;

            this.element.addEventListener("keyup", this.handleLiveFilter);
        }
    }

    handleLiveFilter = async () => {
        setTimeout(async () => await this.context.events.trigger("render"), this.realTimeTimeout);
    };
    /**
     * Returns the value of the input element.  Will return a string value.
     * @returns {string}
     */
    get value() {
        return this.element.value;
    }
}

/**
 * Represents a columns filter control.  Creates a `HTMLSelectElement` that is added to the header row of the grid to filter data 
 * specific to its defined column.  If `filterValuesRemoteSource` is defined, the select options will be populated by the data returned 
 * from the remote source by registering to the grid pipeline's `init` and `refresh` events.
 */
class ElementSelect {
    /**
     * Create filter object that represents a `HTMLSelectElement` element in the table's header row.
     * @param {Column} column Column class object.
     * @param {GridContext} context Grid context. 
     */
    constructor(column, context) {
        this.element = ElementHelper.create("select", { name: column.field });
        this.field = column.field;
        this.fieldType = column.type;  //field value type.
        this.filterType = column.filterType;  //condition type.
        this.filterIsFunction = (typeof column?.filterType === "function");
        this.filterParams = column.filterParams;
        this.pipeline = context.pipeline;
        this.context = context;

        this.element.id = `${column.settings.baseIdName}_${this.field}`;
        this.element.addEventListener("change", async () => await this.context.events.trigger("render"));

        if (column.filterCss) {
            this.element.className = column.filterCss;
        }

        if (column.filterValuesRemoteSource) {
            //set up pipeline to retrieve option data when init pipeline is called.
            this.pipeline.addStep("init", this.createSelectOptions, column.filterValuesRemoteSource);
            this.pipeline.addStep("refresh", this.refreshSelectOptions, column.filterValuesRemoteSource);
            return;
        } 
        //use user supplied values to create select options.
        const opts = Array.isArray(column.filterValues) 
            ? column.filterValues
            : Object.entries(column.filterValues).map(([key, value]) => ({ value: key, text: value}));

        this.createSelectOptions(opts);
    }
    /**
     * Builds option elements for class's `select` input.  Expects an array of objects with key/value pairs of:
     *  * `value`: option value.  should be a primary key type value with no blank spaces.
     *  * `text`: option text value
     * @param {Array<object>} data key/value array of values.
     */
    createSelectOptions = (data) => {
        const first = ElementHelper.create("option", { value: "", text: "Select all" });

        this.element.append(first);

        for (const item of data) {
            const option = ElementHelper.create("option", { value: item.value, text: item.text });

            this.element.append(option);
        }
    };
    /**
     * Replaces/updates option elements for class's `select` input.  Will persist the current select value, if any.  
     * Expects an array of objects with key/value pairs of:
     *  * `value`: Option value.  Should be a primary key type value with no blank spaces.
     *  * `text`: Option text.
     * @param {Array<object>} data key/value array of values.
     */
    refreshSelectOptions = (data) => {
        const selectedValue = this.element.value;

        this.element.replaceChildren();
        this.createSelectOptions(data);
        this.element.value = selectedValue;
    };

    get value() {
        return this.element.value;
    }
}

/**
 * Create filter object that represents a multi-select element.  Creates a dropdown with a list of options that can be 
 * selected or deselected.  If `filterValuesRemoteSource` is defined, the select options will be populated by the data returned 
 * from the remote source by registering to  the grid pipeline's `init` and `refresh` events.
 */
class ElementMultiSelect {
    /**
     * Create filter object that represents a multi-select element.
     * @param {Column} column Column class object.
     * @param {GridContext} context Grid context object.
     */
    constructor(column, context) {
        this.context = context;
        this.element = ElementHelper.div({ name: column.field, className: CssHelper.multiSelect.parentClass });
        this.header = ElementHelper.div({ className: CssHelper.multiSelect.header });
        this.optionsContainer = ElementHelper.div({ className: CssHelper.multiSelect.options });
        this.field = column.field;
        this.fieldType = column.type;  //field value type.
        this.filterType = "in";  //condition type.
        this.filterIsFunction = (typeof column?.filterType === "function");
        this.filterParams = column.filterParams;
        this.listAll = false;
        this.selectedValues = [];

        if (typeof column.filterMultiSelect === "object") {
            this.listAll = column.filterMultiSelect.listAll;
        }

        this.header.id = `header_${this.context.settings.baseIdName}_${this.field}`;
        this.element.id = `${this.context.settings.baseIdName}_${this.field}`;
        this.element.append(this.header, this.optionsContainer);

        if (column.filterValuesRemoteSource) {
            //set up pipeline to retrieve option data when init pipeline is called.
            this.context.pipeline.addStep("init", this.templateContainer, column.filterValuesRemoteSource);
            this.context.pipeline.addStep("refresh", this.refreshSelectOptions, column.filterValuesRemoteSource);
        } else {
            //use user supplied values to create select options.
            const data = Array.isArray(column.filterValues) 
                ? column.filterValues
                : Object.entries(column.filterValues).map(([key, value]) => ({ value: key, text: value}));

            this.templateContainer(data);
        }

        this.header.addEventListener("click", this.handleClick);
    }

    handleClick = async () => {
        const status = this.header.classList.toggle(CssHelper.multiSelect.headerActive);

        if (!status) {
            await this.context.events.trigger("render");
            document.removeEventListener("click", this.handleDocument);
        } else {
            document.addEventListener("click", this.handleDocument);
        }
    };
    /**
     * Handler event to close dropdown when user clicks outside the multi-select control.  Event is removed when multi-select 
     * is not active so that it's not firing on redundant events.
     * @param {Object} e Object that triggered event.
     */
    handleDocument = async (e) => {
        if (!e.target.closest("." + CssHelper.multiSelect.option) && !e.target.closest(`#${this.header.id}`)) {
            this.header.classList.remove(CssHelper.multiSelect.headerActive);

            await this.context.events.trigger("render");

            document.removeEventListener("click", this.handleDocument);
        }
    };
    /**
     * Creates a count label that displays the number of selected items in the multi-select control.
     */
    createCountLabel = () => {
        //update count label.
        if (this.countLabel === undefined) {
            this.countLabel = document.createElement("span");
            this.countLabel.className = CssHelper.multiSelect.headerOption;
            this.header.append(this.countLabel);
        }

        if (this.selectedValues.length > 0) {
            this.countLabel.innerText = `${this.selectedValues.length} selected`;
        } else {
            this.countLabel.remove();
            this.countLabel = undefined;
        }
    };
    /**
     * Handle click event for each option in the multi-select control.  Toggles the selected state of the option and updates the 
     * header if `listAll` is `true`.
     * @param {Object} o Object that triggered the event.
     */
    handleOption = (o) => {
        if (!o.currentTarget.classList.contains(CssHelper.multiSelect.selected)) {
            //select item.
            o.currentTarget.classList.add(CssHelper.multiSelect.selected);
            o.currentTarget.dataset.selected = "true";
            
            this.selectedValues.push(o.currentTarget.dataset.value);

            if (this.listAll) {
                const span = ElementHelper.span({ className: CssHelper.multiSelect.headerOption, innerText: o.currentTarget.dataset.value }, { value: o.currentTarget.dataset.value });
                this.header.append(span);
            }
        } else {
            //deselect item.
            o.currentTarget.classList.remove(CssHelper.multiSelect.selected);
            o.currentTarget.dataset.selected = "false";

            this.selectedValues = this.selectedValues.filter(f => f !== o.currentTarget.dataset.value);

            if (this.listAll) {
                const item = this.header.querySelector(`[data-value='${o.currentTarget.dataset.value}']`);

                if (item !== null) {
                    item.remove();
                }
            }
        }

        if (this.listAll === false) {
            this.createCountLabel();
        }
    };
    /**
     * Helper function to create an option element for the multi-select control.
     * @param {Object} item key/value pair object that contains the value and text for the option.
     * @returns {HTMLDivElement} Returns a div element that represents the option in the multi-select control.
     */
    createOption(item) { 
        const option = ElementHelper.div({ className: CssHelper.multiSelect.option }, { value: item.value, selected: "false" });
        const radio = ElementHelper.span({ className: CssHelper.multiSelect.optionRadio });
        const text = ElementHelper.span({ className: CssHelper.multiSelect.optionText, innerHTML: item.text });

        option.addEventListener("click", this.handleOption);
        option.append(radio, text);

        return option;
    }

    templateContainer = (data) => {
        for (const item of data) {
            const option = this.createOption(item);
            this.optionsContainer.append(option);
        }
    };
    /**
     * Called when the grid pipeline's `refresh` event is triggered.  It clears the current options and
     * recreates them based on the data provided.  It also updates the selected values based on the current state of the options.
     * @param {Array} data Array of objects that represent the options to be displayed in the multi-select control.
     */
    refreshSelectOptions = (data) => {
        this.optionsContainer.replaceChildren();
        this.header.replaceChildren();
        this.countLabel = undefined;  //set to undefined so it can be recreated later.
        const newSelected = [];

        for (const item of data) {
            const option = this.createOption(item);
            //check if item is selected.
            if (this.selectedValues.includes(item.value)) {
                //select item.
                option.classList.add(CssHelper.multiSelect.selected);
                option.dataset.selected = "true";
                newSelected.push(item.value);

                if (this.listAll) {
                    const span = ElementHelper.span({ className: CssHelper.multiSelect.headerOption, innerText: item.value }, { value: item.value });
                    this.header.append(span);
                }
            }

            this.optionsContainer.append(option);
        }
        //set new selected values as items may have been removed on refresh.
        this.selectedValues = newSelected;

        if (this.listAll === false) {
            this.createCountLabel();
        }
    };

    get value() {
        return this.selectedValues;
    }
}

/**
 * Class that defines a single filter condition for a column.
 */
class FilterTarget {
    /**
     * Creates filter target object that defines a single filter condition.  Expects an object with the following properties:
     * * `value`: The value to filter against.  Expects that value matches the type of the field being filtered.  Should be null if 
     * value type cannot be converted to the field type.
     * * `field`: The field name of the column being filtered.  This is used to identify the column in the data set.
     * * `fieldType`: The type of field being filtered (e.g., "string", "number", "date", "object").  This is used to determine how to compare the value.
     * * `filterType`: The type of filter to apply (e.g., "equals", "like", "<", "<=", ">", ">=", "!=", "between", "in").
     * @param {{ value: (string | number | Date | Object | null), field: string, fieldType: string, filterType: string }} target 
     */
    constructor(target) {
        this.value = target.value;
        this.field = target.field;
        this.fieldType = target.fieldType || "string"; // Default to string if not provided
        this.filterType = target.filterType;
        this.filters = this.#init();
    }

    #init() {
        return {
            //equal to
            "equals": function(filterVal, rowVal) {
                return filterVal === rowVal;
            },
            //like
            "like": function(filterVal, rowVal) {
                if (rowVal === undefined || rowVal === null || rowVal === "") {
                    return false;
                }
        
                return String(rowVal).toLowerCase().indexOf(filterVal.toLowerCase()) > -1;
            },
            //less than
            "<": function(filterVal, rowVal) {
                return filterVal < rowVal;
            },
            //less than or equal to
            "<=": function(filterVal, rowVal) {
                return filterVal <= rowVal;
            },
            //greater than
            ">": function(filterVal, rowVal) {
                return filterVal > rowVal;
            },
            //greater than or equal to
            ">=": function(filterVal, rowVal) {
                return filterVal >= rowVal;
            },
            //not equal to
            "!=": function(filterVal, rowVal) {
                return rowVal !== filterVal;
            },
            // between.  expects filterVal to be an array of: [ {start value}, { end value } ] 
            "between": function(filterVal, rowVal) {
                return rowVal >= filterVal[0] && rowVal <= filterVal[1];
            },
            //in array.
            "in": function(filterVal, rowVal) {
                if (Array.isArray(filterVal)) {
                    return filterVal.length ? filterVal.indexOf(rowVal) > -1 : true;
                } else {
                    console.warn("Filter Error - filter value is not an array:", filterVal);
                    return false;
                }
            }
        };
    }
    /**
     * Executes an internal function to indicate if the current row values matches the filter criteria's value.  
     * @param {Object} rowVal Row column value.  Expects a value that matches the type identified by the column.
     * @param {Object<Array>} row Current data set row.
     * @returns {boolean} Returns true if row value matches filter value.  Otherwise, false indicating no match.
     */
    execute(rowVal, row) {
        return this.filters[this.filterType](this.value, rowVal);
    }
}

/**
 * Class that defines a single filter condition for a date column.
 */
class FilterDate {
    /**
     * Creates filter target object that defines a single filter condition for a date data type.  Expects an object with the following properties:
     * * `value`: The value to filter against.  Expects that value matches the type of the field being filtered.  Should be null if 
     * value type cannot be converted to the field type.
     * * `field`: The field name of the column being filtered.  This is used to identify the column in the data set.
     * * `filterType`: The type of filter to apply (e.g., "equals", "like", "<", "<=", ">", ">=", "!=", "between", "in").
     * @param {{ value: (Date | Array<Date>), field: string, filterType: string }} target 
     */
    constructor(target) {
        this.value = target.value;
        this.field = target.field;
        this.fieldType = "date";
        this.filterType = target.filterType;
        this.filters = this.#init();
    }
    /**
     * Returns a new date object for each date passed in, setting the time to midnight.  This is used to ensure that the date objects are not modified
     * when comparing dates in the filter functions, and to ensure that the time portion of the date does not affect the comparison.
     * @param {Date} date1 
     * @param {Date} date2 
     * @returns {Array<Date>} Returns an array of two date objects, each set to midnight of the respective date passed in.
     */
    cloneDates = (date1, date2) => { 
        const d1 = new Date(date1);
        const d2 = new Date(date2);

        d1.setHours(0, 0, 0, 0);
        d2.setHours(0, 0, 0, 0);
        
        return [d1, d2];
    };

    #init() { 
        return { 
            "equals": function(filterVal, rowVal) {
                return filterVal.getFullYear() === rowVal.getFullYear() && filterVal.getMonth() === rowVal.getMonth() && filterVal.getDate() === rowVal.getDate();
            },
            //less than
            "<": (filterVal, rowVal) => {
                const dates = this.cloneDates(filterVal, rowVal);
 
                return dates[0].getTime() < dates[1].getTime();
            },
            //less than or equal to
            "<=": (filterVal, rowVal) => {
                const dates = this.cloneDates(filterVal, rowVal);

                return dates[0].getTime() < dates[1].getTime();
            },
            //greater than
            ">": (filterVal, rowVal) => {
                const dates = this.cloneDates(filterVal, rowVal);

                return dates[0].getTime() > dates[1].getTime();
            },
            //greater than or equal to
            ">=": (filterVal, rowVal) => {
                const dates = this.cloneDates(filterVal, rowVal);

                return dates[0].getTime() >= dates[1].getTime();
            },
            //not equal to
            "!=": function(filterVal, rowVal) {
                return filterVal.getFullYear() !== rowVal.getFullYear() && filterVal.getMonth() !== rowVal.getMonth() && filterVal.getDate() !== rowVal.getDate();
            },
            // between.  expects filterVal to be an array of: [ {start value}, { end value } ] 
            "between": (filterVal, rowVal)  => {
                const filterDates = this.cloneDates(filterVal[0], filterVal[1]);
                const rowDates = this.cloneDates(rowVal, rowVal);

                return rowDates[0] >= filterDates[0] && rowDates[0] <= filterDates[1];
            }
        };
    }
    /**
     * Executes an internal function to indicate if the current row value matches the filter criteria's value.  
     * @param {Date} rowVal Row column value.  Expects a Date object.
     * @param {Object<Array>} row Current data set row.
     * @returns {boolean} Returns true if row value matches filter value.  Otherwise, false indicating no match.
     */
    execute(rowVal, row) {
        if (rowVal === null || !DateHelper.isDate(rowVal)) {
            return false; // If rowVal is null or not a date, return false.
        }

        return this.filters[this.filterType](this.value, rowVal);
    }
}

/**
 * Represents a concrete implementation of a filter that uses a user supplied function.
 */
class FilterFunction {
    /**
     * Creates a filter function instance.  Expects an object with the following properties:
     * * `value`: The value to filter against.  Does not need to match the type of the field being filtered.
     * * `field`: The field name of the column being filtered.  This is used to identify the column in the data set.
     * * `filterType`: The function to use for filtering.
     * * `params`: Optional parameters to pass to the filter function.
     * @param {{ value: Object, field: string, filterType: Function, params: Object }} target 
     */
    constructor(target) {
        this.value = target.value;
        this.field = target.field;
        this.filterFunction = target.filterType;
        this.params = target.params ?? {};
    }
    /**
     * Executes an user supplied function to indicate if the current row values matches the filter criteria's value.  
     * @param {Object} rowVal Row column value.  Expects a value that matches the type identified by the column.
     * @param {Object<Array>} row Current data set row.
     * @returns {boolean} Returns true if row value matches filter value.  Otherwise, false indicating no match.
     */
    execute(rowVal, row) {
        return this.filterFunction(this.value, rowVal, row, this.params);
    }
}

/**
 * Provides a means to filter data in the grid.  This module creates header filter controls for each column that has 
 * a `hasFilter` attribute set to `true`.
 * 
 * Class subscribes to the `render` event to update the filter control when the grid is rendered.  It also calls the chain 
 * event `remoteParams` to compile a list of parameters to be passed to the remote data source when using remote processing.
 */
class FilterModule {
    /**
     * Creates a new filter module object.
     * @param {GridContext} context Grid context.
     */
    constructor(context) {
        this.context = context;
        this.headerFilters = [];
        this.gridFilters = [];
    }

    initialize() {
        if (this.context.settings.remoteProcessing) {
            this.context.events.subscribe("remoteParams", this.remoteParams, true);
        } else {
            this.context.events.subscribe("render", this.renderLocal, false, 8);
        }

        this._init();
    }
    /**
     * Create `HeaderFilter` Class for grid columns with a `hasFilter` attribute of `true`.
     */
    _init() {
        for (const col of this.context.columnManager.columns) {
            if (!col.hasFilter) continue;

            if (col.filterElement === "multi") {
                col.headerFilter = new ElementMultiSelect(col, this.context);
            } else if (col.filterElement === "between") {
                col.headerFilter = new ElementBetween(col, this.context);
            } else if (col.filterElement === "select") {
                col.headerFilter = new ElementSelect(col, this.context);
            } else {
                col.headerFilter = new ElementInput(col, this.context);
            }

            col.headerCell.element.appendChild(col.headerFilter.element);
            this.headerFilters.push(col.headerFilter);
        }
    }
    /**
     * Compiles header and grid filter values into a single object of key/value pairs that can be used to send to the remote data source.
     * @param {Object} params Object of key/value pairs to be sent to the remote data source.
     * @returns {Object} Returns the modified params object with filter values added.
     */
    remoteParams = (params) => {
        this.headerFilters.forEach((f) => {
            if (f.value !== "") {
                params[f.field] = f.value;
            }
        });

        if (this.gridFilters.length > 0) {
            for (const item of this.gridFilters) {
                params[item.field] = item.value;
            }
        }

        return params;
    };
    /**
     * Convert value type to column type.  If value cannot be converted, `null` is returned.
     * @param {object | string | number} value Raw filter value.
     * @param {string} type Field type.
     * @returns {number | Date | string | null | Object} input value or `null` if empty.
     */
    convertToType(value, type) {
        if (value === "" || value === null) return value;

        if (Array.isArray(value)) {
            if (type === "date" || type === "datetime")  { 
                const result = value.map((v) => DateHelper.parseDate(v)); 

                return result.includes("") ? null : result;
            }

            if (type === "number") {
                const value1 = this.convertToType(value[0], type);
                const value2 = this.convertToType(value[1], type);  

                return value1 === null || value2 === null ? null : [value1, value2];
            }

            return value;
        }

        if (type === "number") {
            value = Number(value);
            return Number.isNaN(value) ? null : value;
        } 
        
        if (type === "date" || type === "datetime") {
            value = DateHelper.parseDateOnly(value);
            return value === "" ? null : value;
        } 
        //assuming it's a string value or Object at this point.
        return value;
    }
    /**
     * Wraps the filter input value in a `FilterTarget` object, which defines a single filter condition for a column.
     * @param {string | Date | number | Object} value Filter value to apply to the column.
     * @param {string} field The field name of the column being filtered. This is used to identify the column in the data set.
     * @param {string | Function} filterType The type of filter to apply (e.g., "equals", "like", "<", "<=", ">", ">=", "!=", "between", "in").
     * Can also be a function.
     * @param {string} fieldType The type of field being filtered (e.g., "string", "number", "date", "object").
     * @param {boolean} filterIsFunction Indicates if the filter type is a function.
     * @param {Object} filterParams Optional parameters to pass to the filter function.
     * @returns {FilterTarget | FilterDate | FilterFunction | null} Returns a filter target object that defines a single filter condition for a column, 
     * or null if the value cannot be converted to the field type. 
     */
    createFilterTarget(value, field, filterType, fieldType, filterIsFunction, filterParams) { 
        if (filterIsFunction) { 
            return new FilterFunction({ value: value, field: field, filterType: filterType, params: filterParams });
        }

        const convertedValue = this.convertToType(value, fieldType);

        if (convertedValue === null) return null;

        if (fieldType === "date" || fieldType === "datetime") {
            return new FilterDate({ value: convertedValue, field: field, filterType: filterType });
        }

        return new FilterTarget({ value: convertedValue, field: field, fieldType: fieldType, filterType: filterType });
    }
    /**
     * Compiles an array of filter type objects that contain a filter value that matches its column type.  Column type matching 
     * is necessary when processing data locally, so that filter value matches associated row type value for comparison.
     * @returns {Array} array of filter type objects with valid value.
     */
    compileFilters() {
        let results = [];

        for (const item of this.headerFilters) {
            if (item.value === "") continue;

            const filter = this.createFilterTarget(item.value, item.field, item.filterType, item.fieldType, item.filterIsFunction, item?.filterParams);

            if (filter !== null) {
                results.push(filter);
            }
        }

        if (this.gridFilters.length > 0) {
            results = results.concat(this.gridFilters);
        }

        return results;
    }
    /**
     * Use target filters to create a new data set in the persistence data provider.
     * @param {Array<FilterTarget>} targets Array of FilterTarget objects.
     */
    applyFilters(targets) {
        this.context.persistence.data = [];
        this.context.persistence.dataCache.forEach((row) => {
            let match = true;

            for (let item of targets) {
                const rowVal = this.convertToType(row[item.field], item.fieldType);
                const result = item.execute(rowVal, row);

                if (!result) {
                    match = false;
                }
            }

            if (match) {
                this.context.persistence.data.push(row);
            }
        });
    }
    /**
     * Renders the local data set by applying the compiled filters to the persistence data provider.
     */
    renderLocal = () => {
        const targets = this.compileFilters();

        if (Object.keys(targets).length > 0) {
            this.applyFilters(targets);
        } else {
            this.context.persistence.restoreData();
        }
    };
    /**
     * Provides a means to apply a condition outside the header filter controls.  Will add condition
     * to grid's `gridFilters` collection, and raise `render` event to filter data set.
     * @param {string} field field name.
     * @param {object} value value.
     * @param {string | Function} type condition type.
     * @param {string} [fieldType="string"] field type.
     * @param {object} [filterParams={}] additional filter parameters.
     */
    setFilter(field, value, type = "equals", fieldType = "string", filterParams = {}) {
        const convertedValue = this.convertToType(value, fieldType);

        if (this.gridFilters.length > 0) {
            const index = this.gridFilters.findIndex((i) => i.field === field);
            //If field already exists, just update the value.
            if (index > -1) {
                this.gridFilters[index].value = convertedValue;
                return;
            }
        }

        const filter = this.createFilterTarget(convertedValue, field, type, fieldType, (typeof type === "function"), filterParams);
        this.gridFilters.push(filter);
    }
    /**
     * Removes filter condition from grid's `gridFilters` collection.
     * @param {string} field field name.
     */
    removeFilter(field) {
        this.gridFilters = this.gridFilters.filter(f => f.field !== field);
    }
}

FilterModule.moduleName = "filter";

class PagerButtons {
    /**
     * Returns start button for pager element.
     * @param {number} currentPage Current page.
     * @param {Function} callback Button click handler.
     * @returns {HTMLLinkElement}
     */
    static start(currentPage, callback) {
        const li = document.createElement("li");
        const btn = document.createElement("button");

        li.append(btn);
        btn.innerHTML = "&lsaquo;";
        btn.addEventListener("click", callback);

        if (currentPage > 1) {
            btn.dataset.page = "1";
        } else {
            btn.tabIndex = -1;
            btn.disabled = true;
            li.className = "disabled";
        }

        return li;
    }
    /**
     * Returns end button for pager element.
     * @param {number} totalPages last page number in group set.
     * @param {number} currentPage current page.
     * @param {Function} callback button click handler.
     * @returns {HTMLLIElement}
     */
    static end(totalPages, currentPage, callback) {
        const li = document.createElement("li");
        const btn = document.createElement("button");

        li.append(btn);
        btn.innerHTML = "&rsaquo;";
        btn.addEventListener("click", callback);

        if (currentPage < totalPages) {
            btn.dataset.page = totalPages;
        } else {
            btn.tabIndex = -1;
            btn.disabled = true;
            li.className = "disabled";
        }

        return li;
    }
    /**
     * Returns pager button for associated page.
     * @param {number} page page number.
     * @param {number} currentPage current page.
     * @param {Function} callback button click handler.
     * @returns {HTMLLIElement}
     */
    static pageNumber(page, currentPage, callback) {
        const li = document.createElement("li");
        const btn = document.createElement("button");

        li.append(btn);
        btn.innerText = page;
        btn.dataset.page = page;
        btn.addEventListener("click", callback);

        if (page === currentPage) {
            li.className = "active";
        }

        return li;
    }
}

/**
 * Formats grid's rows as a series of pages rather that a scrolling list.  If paging is not desired, register the `RowModule` instead.
 * 
 * Class subscribes to the `render` event to update the pager control when the grid is rendered.  It also calls the chain event 
 * `remoteParams` to compile a list of parameters to be passed to the remote data source when using remote processing.
 */
class PagerModule {
    /**
     * Formats grid's rows as a series of pages rather that a scrolling list.  Module can be used with both local and remote data sources.  
     * @param {GridContext} context Grid context.
     */
    constructor(context) {
        this.context = context;
        this.totalRows = this.context.persistence.rowCount;
        this.pagesToDisplay = this.context.settings.pagerPagesToDisplay;
        this.rowsPerPage = this.context.settings.pagerRowsPerPage;
        this.currentPage = 1;
        //create div container for pager
        this.container = document.createElement("div");
        this.elPager = document.createElement("ul");

        this.container.id = `${this.context.settings.baseIdName}_pager`;
        this.container.className = this.context.settings.pagerCss;
        this.container.append(this.elPager);
        this.context.grid.table.insertAdjacentElement("afterend", this.container);
    }
    /**
     * Sets handler events for rendering/updating grid body rows and pager control.
     */
    initialize() {
        if (this.context.settings.remoteProcessing) {
            this.context.events.subscribe("render", this.renderRemote, true, 10);
        } else {
            this.context.events.subscribe("render", this.renderLocal, false, 10);
        }
    }
    /**
     * Returns the total number of possible pages based on the total rows, and rows per page setting.
     * @returns {Number}
     */
    totalPages() {
        const totalRows = isNaN(this.totalRows) ? 1 : this.totalRows;

        return this.rowsPerPage === 0 ? 1 : Math.ceil(totalRows / this.rowsPerPage);
    }
    /**
     * Returns a validated page number input by making sure value is numeric, and within the bounds of the total pages.  
     * An invalid input will return a value of 1.
     * @param {string | number} currentPage Page number to validate.
     * @returns {Number} Returns a valid page number between 1 and the total number of pages.  If the input is invalid, returns 1.
     */
    validatePage(currentPage) {
        if (!Number.isInteger(currentPage)) {
            currentPage = parseInt(currentPage);
        }

        const total = this.totalPages();
        const result = total < currentPage ? total : currentPage;

        return result <= 0 ? 1 : result;
    }
    /**
     * Returns the first page number to display in the button control set based on the page number position in the dataset.  
     * Page numbers outside of this range are represented by an arrow.
     * @param {Number} currentPage Current page number.
     * @returns {Number}
     */
    firstDisplayPage(currentPage) {
        const middle = Math.floor(this.pagesToDisplay / 2 + this.pagesToDisplay % 2);

        if (currentPage < middle) return 1;

        if (this.totalPages() < (currentPage + this.pagesToDisplay - middle)) {
            return Math.max(this.totalPages() - this.pagesToDisplay + 1, 1);
        }

        return currentPage - middle + 1;
    }
    /**
     * Creates the html list item and button elements for the pager container's ul element.  Will also set the 
     * `this.currentPage` property to the current page number.
     * @param {Number} currentPage Current page number.  Assumes a valid page number is provided.
     * @param {Function} callback Button click handler.
     */
    render(currentPage, callback) {
        const totalPages = this.totalPages();
        // Clear the prior li elements.
        this.elPager.replaceChildren();

        if (totalPages <= 1) return;
        
        const firstDisplay = this.firstDisplayPage(currentPage);
        const maxPages = firstDisplay + this.pagesToDisplay;
        
        this.currentPage = currentPage;
        this.elPager.appendChild(PagerButtons.start(currentPage, callback));

        for (let page = firstDisplay; page <= totalPages && page < maxPages; page++) {
            this.elPager.appendChild(PagerButtons.pageNumber(page, currentPage, callback));
        }

        this.elPager.appendChild(PagerButtons.end(totalPages, currentPage, callback));
    }

    handlePaging = async (e) => {
        const validPage = { page: this.validatePage(e.currentTarget.dataset.page) };

        if (this.context.settings.remoteProcessing) {
            await this.renderRemote(validPage);
        } else {
            this.renderLocal(validPage);
        }
    };
    /**
     * Handler for rendering rows using local data source.  Will slice the data array based on the current page and rows per page settings,
     * then call `render` to update the pager control.  Optional argument `params` is an object that can contain the following properties:
     * * `page`:Page number to render.  If not provided, defaults to 1.
     * @param {{ page: number } | null} params 
     */
    renderLocal = (params = {}) => {
        const page = !params.page ? 1 : this.validatePage(params.page);
        const begin = (page - 1) * this.rowsPerPage;
        const end = begin + this.rowsPerPage;
        const data = this.context.persistence.data.slice(begin, end);

        this.context.grid.renderRows(data, this.context.persistence.rowCount);
        this.totalRows = this.context.persistence.rowCount;
        this.render(page, this.handlePaging);
    };
    /**
     * Handler for rendering rows using remote data source.  Will call the `dataloader` to request data based on the provided params,
     * then call `render` to update the pager control.  Optional argument `params` is an object that can contain the following properties:
     * * `page`: Page number to render.  If not provided, defaults to 1.
     * @param {{ page: number } | null} params 
     */
    renderRemote = async (params = {}) => {
        if (!params.page) params.page = 1;
        
        params = this.context.events.chain("remoteParams", params);

        const data = await this.context.dataloader.requestGridData(params);
        const rowCount = data.rowCount ?? 0;

        this.context.grid.renderRows(data.data, rowCount);
        this.totalRows = rowCount;
        this.render(params.page, this.handlePaging);
    };
}

PagerModule.moduleName = "pager";

/**
 * Will re-load the grid's data from its target source (local or remote).
 */
class RefreshModule {
    /**
     * Will apply event to target button that, when clicked, will re-load the 
     * grid's data from its target source (local or remote).
     * @param {GridContext} context Grid context class.
     */
    constructor(context) {
        this.context = context;
    }

    initialize() {
        if (!this.context.settings.remoteProcessing && this.context.settings.remoteUrl) {
            this.context.pipeline.addStep("refresh", this.context.persistence.setData);
        }

        const btn = document.getElementById(this.context.settings.refreshableId);
        
        btn.addEventListener("click", this.handleRefresh);
    }

    handleRefresh = async () => {
        if (this.context.pipeline.hasPipeline("refresh")) {
            await this.context.pipeline.execute("refresh");
        }

        await this.context.events.trigger("render");
    };
}

RefreshModule.moduleName = "refresh";

/**
 * Responsible for rendering the grids rows using either local or remote data.  This should be the default module to 
 * create row data if paging is not enabled.  Subscribes to the `render` event to create the grid's rows and the `remoteParams` 
 * event for remote processing.
 * 
 * Class will call the 'remoteParams' event to concatenate parameters for remote data requests.
 */
class RowModule {
    /**
     * Creates grid rows.  This should be the default module to create row data if paging is not enabled.
     * @param {GridContext} context Grid context class.
     */
    constructor(context) {
        this.context = context;
    }

    initialize() {
        if (this.context.settings.remoteProcessing) {
            this.context.events.subscribe("render", this.renderRemote, true, 10);
        } else {
            this.context.events.subscribe("render", this.renderLocal, false, 10);
        }
    }
    /**
     * Renders the grid rows using local data.  This is the default method to render rows when remote processing is not enabled.
     */
    renderLocal = () => {
        this.context.grid.renderRows(this.context.persistence.data);
    };
    /**
     * Renders the grid rows using remote data.  This method will call the `remoteParams` event to get the parameters for the remote request.
     */
    renderRemote = async () => {
        const params = this.context.events.chain("remoteParams", {});
        const data = await this.context.dataloader.requestGridData(params);

        this.context.grid.renderRows(data);
    };
}

RowModule.moduleName = "row";

/**
 * Updates target label with a count of rows in grid.
 */
class RowCountModule {
    /**
     * Updates target label supplied in settings with a count of rows in grid.
     * @param {GridContext} context Grid context class.
     */
    constructor(context) {
        this.context = context;
        this.element = document.getElementById(context.settings.rowCountId);
    }

    initialize() {
        this.context.events.subscribe("render", this.handleCount, false, 20);
    }

    handleCount = () => {
        this.element.innerText = this.context.grid.rowCount;
    };
}

RowCountModule.moduleName = "rowcount";

const date = (a, b, direction) => {
    let comparison = 0;
    let dateA = new Date(a);
    let dateB = new Date(b);

    if (Number.isNaN(dateA.valueOf())) {
        dateA = null;
    }

    if (Number.isNaN(dateB.valueOf())) {
        dateB = null;
    }
    //both dates are null/invalid
    if (dateA === null && dateB === null) {
        return 0;
    }
    //handle empty values.
    if (!dateA) {
        comparison = !dateB ? 0 : -1;
    } else if (!dateB) {
        comparison = 1;
    } else if (dateA > dateB) {    
        comparison = 1;
    } else if (dateA < dateB) {
        comparison = -1;
    }

    return direction === "desc" ? (comparison * -1) : comparison;
};

//sort numeric value.
const number = (a, b, direction) => {
    let comparison = 0;

    if (a > b) {
        comparison = 1;
    } else if (a < b) {
        comparison = -1;
    }

    return direction === "desc" ? (comparison * -1) : comparison;
};

const string = (a, b, direction) => {
    let comparison = 0;
    //handle empty values.
    if (!a) {
        comparison = !b ? 0 : -1;
    } else if (!b) {
        comparison = 1;
    } else {
        const varA = a.toUpperCase();
        const varB = b.toUpperCase();
    
        if (varA > varB) {
            comparison = 1;
        } else if (varA < varB) {
            comparison = -1;
        }
    }

    return direction === "desc" ? (comparison * -1) : comparison;
};

/**
 * Class to manage sorting functionality in a grid context.  For remote processing, will subscribe to the `remoteParams` event.
 * For local processing, will subscribe to the `render` event.
 * 
 * Class will trigger the `render` event after sorting is applied, allowing the grid to re-render with the sorted data.
 */
class SortModule {
    /**
     * Creates a new SortModule object.
     * @param {GridContext} context 
     */
    constructor(context) {
        this.context = context;
        this.headerCells = [];
        this.currentSortColumn = "";
        this.currentDirection = "";
        this.currentType = "";
    }

    initialize() {
        if (this.context.settings.remoteProcessing) {
            this.currentSortColumn = this.context.settings.remoteSortDefaultColumn;
            this.currentDirection = this.context.settings.remoteSortDefaultDirection;
            this.context.events.subscribe("remoteParams", this.remoteParams, true);
            this._init(this.handleRemote);
        } else {
            this.context.events.subscribe("render", this.renderLocal, false, 9);
            this.sorters = { number: number, string: string, date: date, datetime: date };
            this._init(this.handleLocal);
        }
    }

    _init(callback) {
        //bind listener for non-icon columns; add css sort tag.
        for (const col of this.context.columnManager.columns) {
            if (col.type !== "icon") {
                this.headerCells.push(col.headerCell);
                col.headerCell.span.classList.add("sort");
                col.headerCell.span.addEventListener("click", callback);
            }
        }
    }

    remoteParams = (params) => {
        params.sort = this.currentSortColumn;
        params.direction = this.currentDirection;

        return params;
    };

    handleRemote = async (c) => {
        this.currentSortColumn = c.currentTarget.context.name;
        this.currentDirection = c.currentTarget.context.directionNext.valueOf();
        this.currentType = c.currentTarget.context.type;

        if (!c.currentTarget.context.isCurrentSort) {
            this.resetSort();
        }

        c.currentTarget.context.setSortFlag();

        await this.context.events.trigger("render");
    };

    resetSort() {
        const cell = this.headerCells.find(e => e.isCurrentSort);

        if (cell !== undefined) {
            cell.removeSortFlag();
        }
    }

    renderLocal = () => {
        if (!this.currentSortColumn) return;

        this.context.persistence.data.sort((a, b) => {
            return this.sorters[this.currentType](a[this.currentSortColumn], b[this.currentSortColumn], this.currentDirection);
        });
    };

    handleLocal = async (c) => {
        this.currentSortColumn = c.currentTarget.context.name;
        this.currentDirection = c.currentTarget.context.directionNext.valueOf();
        this.currentType = c.currentTarget.context.type;

        if (!c.currentTarget.context.isCurrentSort) {
            this.resetSort();
        }

        c.currentTarget.context.setSortFlag();

        await this.context.events.trigger("render");
    };
}

SortModule.moduleName = "sort";

/**
 * Creates grid's core properties and objects, and allows for registration of modules used to build functionality.
 * Use this class as a base class to create a grid with custom modular functionality using the `extends` class reference.
 */
class GridCore {
    #moduleTypes;
    #modulesCreated;
    /**
    * Creates grid's core properties and objects and identifies div element which grid will be built.  After instantiation, 
    * use the `addModules` method to register desired modules to complete the setup process.  Module registration is kept 
    * separate from constructor to allow customization of modules used to build grid.
    * @param {string} container div element ID to build grid in.
    * @param {object} settings User settings; key/value pairs.
    */
    constructor(container, settings) {
        const source = MergeOptions.merge(settings);

        this.settings = new SettingsGrid(source);
        this.container = document.getElementById(container);
        this.enablePaging = this.settings.enablePaging;
        this.isValid = true;
        this.#moduleTypes = [];
        this.#modulesCreated = false;
        this.modules = {};

        if (Object.values(source.columns).length === 0) {
            console.log("Missing required columns definition.");
            this.isValid = false;
        } else {
            const data = source.data ?? [];
            this.#init(source.columns, data);
        }
    }

    #init(columns, data) {
        this.context = new GridContext(columns, this.settings, data);

        this.container.append(this.context.grid.table);
    }
    /**
     * Register modules to be used in the building and operation of the grid.  
     * 
     * NOTE: This method should be called before the `init()` method.
     * @param {class} modules Class module(s).
     */
    addModules(...modules) {
        modules.forEach((m) => this.#moduleTypes.push(m));
    }
    /**
     * Adds a new column to the grid.  The column will be added to the end of the columns collection by default, but can 
     * be inserted at a specific index.  
     * 
     * NOTE: This method should be called before the `init()` method.
     * @param {Object} column Column object definition.
     * @param {number} [indexPosition=null] Index to insert the column at. If null, appends to the end.
     */
    addColumn(column, indexPosition = null) {
        this.context.columnManager.addColumn(column, indexPosition);
    }
    /**
     * Iterates though a list of modules to instantiate and initialize start up and/or build behavior.  Should be called after 
     * all modules have been registered using the `addModules` method, and only needs to be called once.
     * 
     * NOTE: If bypassing the `init()` method, be sure to call `context.grid.initializeHeader()` before calling this method 
     * to ensure the grid's header is built.
     */
    _initModules = async () => {
        if (this.#modulesCreated)
            return;

        //Verify if base required row related module has been added to the grid.
        if (this.settings.enablePaging && !this.#moduleTypes.some((x) => x.moduleName === "page")) {
            this.#moduleTypes.push(PagerModule);
        } else if (!this.#moduleTypes.some((x) => x.moduleName === "row")) {
             this.#moduleTypes.push(RowModule);
        }

        this.#moduleTypes.forEach((m) => {
            this.context.modules[m.moduleName] = new m(this.context);
            this.context.modules[m.moduleName].initialize();
        });

        this.#modulesCreated = true;
        await this.context.events.trigger("postInitMod");
    };
    /**
     * Instantiates the creation of the grid.  Method will create the grid's elements, run all registered modules, data processing 
     * pipelines and events.  If grid is being built using the modular approach, be sure to call the `addModules` method before 
     * calling this one to ensure all modules are registered and initialized in their proper order.
     * 
     * NOTE: Method will automatically register the `PagerModule` if paging is enabled, or the `RowModule` if paging is not enabled.
     */
    async init() {
        if (!this.isValid) {
            console.log("Missing required columns definition.");
            return;
        }

        this.context.grid.initializeHeader();

        await this._initModules();

        if (!this.settings.remoteProcessing && this.settings.remoteUrl) {
            //local data source processing; set pipeline actions.
            this.context.pipeline.addStep("init", this.context.persistence.setData);
        }
        //execute data pipeline before building elements.
        if (this.context.pipeline.hasPipeline("init")) {
            await this.context.pipeline.execute("init");
        }

        await this.context.events.trigger("render");
    }
    /**
     * Apply filter condition for target column.  Method provides a means to apply condition outside of header filter controls.
     * @param {string} field Target field.
     * @param {object} value Filter value.
     * @param {string | Function} [type="equals"] Filter type.  If a function is provided, it will be used as the filter condition.
     * Otherwise, use the associated string value type to determine the filter condition.  i.e. "equals", "contains", etc.
     * @param {string} [fieldType="string"] Field type.
     * @param {object} [filterParams={}] Additional filter parameters.
     */
    setFilter = async (field, value, type = "equals", fieldType = "string", filterParams = {}) => {
        if (this.context.modules.filter) {
            this.context.modules.filter.setFilter(field, value, type, fieldType, filterParams);

            await this.context.events.trigger("render");
        } else {
            console.warn("Filter module is not enabled.  Set `TableData.defaultOptions.enableFilter` to true in order to enable this function.");
        }
    };
    /**
     * Remove filter condition for target field.
     * @param {string} field Target field.
     */
    removeFilter = async (field) => {
        if (this.context.modules.filter) {
            this.context.modules.filter.removeFilter(field);

            await this.context.events.trigger("render");
        } else {
            console.warn("Filter module is not enabled.  Set `TableData.defaultOptions.enableFilter` to true in order to enable this function.");
        }
    };
}

class TableData extends GridCore {
    constructor(container, settings) {
        super(container, settings);

        if (TableData.defaultOptions.enableFilter) {
            this.addModules(FilterModule);
        }

        if (TableData.defaultOptions.enableSort) {
            this.addModules(SortModule);
        }

        if (this.settings.rowCountId) {
            this.addModules(RowCountModule);
        }

        if (this.settings.refreshableId) {
            this.addModules(RefreshModule);
        }

        if (this.settings.csvExportId) {
            this.addModules(CsvModule);
        }
    }
}

TableData.defaultOptions = {
    enableSort: true,
    enableFilter: true
};

export { Cell, Column, ColumnManager, CssHelper, CsvModule, DataLoader, DataPersistence, DataPipeline, DateHelper, ElementBetween, ElementHelper, ElementInput, ElementMultiSelect, ElementSelect, FilterModule, FormatDateTime, FormatLink, FormatNumeric, FormatStar, GridContext, GridCore, GridEvents, HeaderCell, MergeOptions, PagerButtons, PagerModule, RefreshModule, RowCountModule, RowModule, SettingsGrid, SortModule, Table, TableData, settingsDefaults as settingsDefault };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGVkYXRhX2Vtcy5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL2hlbHBlcnMvZGF0ZUhlbHBlci5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2NlbGwvZm9ybWF0dGVycy9kYXRldGltZS5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2NlbGwvZm9ybWF0dGVycy9saW5rLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvY2VsbC9mb3JtYXR0ZXJzL251bWVyaWMuanMiLCIuLi9zcmMvY29tcG9uZW50cy9jZWxsL2Zvcm1hdHRlcnMvc3Rhci5qcyIsIi4uL3NyYy9oZWxwZXJzL2Nzc0hlbHBlci5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2NlbGwvY2VsbC5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2NlbGwvaGVhZGVyQ2VsbC5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2NvbHVtbi9jb2x1bW4uanMiLCIuLi9zcmMvY29tcG9uZW50cy9jb2x1bW4vY29sdW1uTWFuYWdlci5qcyIsIi4uL3NyYy9zZXR0aW5ncy9zZXR0aW5nc0RlZmF1bHQuanMiLCIuLi9zcmMvc2V0dGluZ3MvbWVyZ2VPcHRpb25zLmpzIiwiLi4vc3JjL3NldHRpbmdzL3NldHRpbmdzR3JpZC5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2RhdGEvZGF0YUxvYWRlci5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2RhdGEvZGF0YVBlcnNpc3RlbmNlLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvZGF0YS9kYXRhUGlwZWxpbmUuanMiLCIuLi9zcmMvaGVscGVycy9lbGVtZW50SGVscGVyLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvZXZlbnRzL2dyaWRFdmVudHMuanMiLCIuLi9zcmMvY29tcG9uZW50cy90YWJsZS90YWJsZS5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2NvbnRleHQvZ3JpZENvbnRleHQuanMiLCIuLi9zcmMvbW9kdWxlcy9kb3dubG9hZC9jc3ZNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9maWx0ZXIvZWxlbWVudHMvZWxlbWVudEJldHdlZW4uanMiLCIuLi9zcmMvbW9kdWxlcy9maWx0ZXIvZWxlbWVudHMvZWxlbWVudElucHV0LmpzIiwiLi4vc3JjL21vZHVsZXMvZmlsdGVyL2VsZW1lbnRzL2VsZW1lbnRTZWxlY3QuanMiLCIuLi9zcmMvbW9kdWxlcy9maWx0ZXIvZWxlbWVudHMvZWxlbWVudE11bHRpU2VsZWN0LmpzIiwiLi4vc3JjL21vZHVsZXMvZmlsdGVyL3R5cGVzL2ZpbHRlclRhcmdldC5qcyIsIi4uL3NyYy9tb2R1bGVzL2ZpbHRlci90eXBlcy9maWx0ZXJEYXRlLmpzIiwiLi4vc3JjL21vZHVsZXMvZmlsdGVyL3R5cGVzL2ZpbHRlckZ1bmN0aW9uLmpzIiwiLi4vc3JjL21vZHVsZXMvZmlsdGVyL2ZpbHRlck1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL3BhZ2VyL3BhZ2VyQnV0dG9ucy5qcyIsIi4uL3NyYy9tb2R1bGVzL3BhZ2VyL3BhZ2VyTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvcmVmcmVzaC9yZWZyZXNoTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvcm93L3Jvd01vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL3Jvdy9yb3dDb3VudE1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL3NvcnQvc29ydGVycy9kYXRlLmpzIiwiLi4vc3JjL21vZHVsZXMvc29ydC9zb3J0ZXJzL251bWJlci5qcyIsIi4uL3NyYy9tb2R1bGVzL3NvcnQvc29ydGVycy9zdHJpbmcuanMiLCIuLi9zcmMvbW9kdWxlcy9zb3J0L3NvcnRNb2R1bGUuanMiLCIuLi9zcmMvY29yZS9ncmlkQ29yZS5qcyIsIi4uL3NyYy90YWJsZWRhdGEuanMiXSwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgRGF0ZUhlbHBlciB7XG4gICAgc3RhdGljIHRpbWVSZUdleCA9IG5ldyBSZWdFeHAoXCJbMC05XTpbMC05XVwiKTtcbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IHN0cmluZyB0byBEYXRlIG9iamVjdCB0eXBlLiAgRXhwZWN0cyBzdHJpbmcgZm9ybWF0IG9mIHllYXItbW9udGgtZGF5LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSBTdHJpbmcgZGF0ZSB3aXRoIGZvcm1hdCBvZiB5ZWFyLW1vbnRoLWRheS5cbiAgICAgKiBAcmV0dXJucyB7RGF0ZSB8IHN0cmluZ30gRGF0ZSBpZiBjb252ZXJzaW9uIGlzIHN1Y2Nlc3NmdWwuICBPdGhlcndpc2UsIGVtcHR5IHN0cmluZy5cbiAgICAgKi9cbiAgICBzdGF0aWMgcGFyc2VEYXRlKHZhbHVlKSB7XG4gICAgICAgIC8vQ2hlY2sgaWYgc3RyaW5nIGlzIGRhdGUgb25seSBieSBsb29raW5nIGZvciBtaXNzaW5nIHRpbWUgY29tcG9uZW50LiAgXG4gICAgICAgIC8vSWYgbWlzc2luZywgYWRkIGl0IHNvIGRhdGUgaXMgaW50ZXJwcmV0ZWQgYXMgbG9jYWwgdGltZS5cbiAgICAgICAgaWYgKCF0aGlzLnRpbWVSZUdleC50ZXN0KHZhbHVlKSkge1xuICAgICAgICAgICAgdmFsdWUgPSBgJHt2YWx1ZX1UMDA6MDBgO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGF0ZSA9IG5ldyBEYXRlKHZhbHVlKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiAoTnVtYmVyLmlzTmFOKGRhdGUudmFsdWVPZigpKSkgPyBcIlwiIDogZGF0ZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ29udmVydCBzdHJpbmcgdG8gRGF0ZSBvYmplY3QgdHlwZSwgc2V0dGluZyB0aGUgdGltZSBjb21wb25lbnQgdG8gbWlkbmlnaHQuICBFeHBlY3RzIHN0cmluZyBmb3JtYXQgb2YgeWVhci1tb250aC1kYXkuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlIFN0cmluZyBkYXRlIHdpdGggZm9ybWF0IG9mIHllYXItbW9udGgtZGF5LlxuICAgICAqIEByZXR1cm5zIHtEYXRlIHwgc3RyaW5nfSBEYXRlIGlmIGNvbnZlcnNpb24gaXMgc3VjY2Vzc2Z1bC4gIE90aGVyd2lzZSwgZW1wdHkgc3RyaW5nLlxuICAgICAqL1xuICAgIHN0YXRpYyBwYXJzZURhdGVPbmx5KHZhbHVlKSB7XG4gICAgICAgIGNvbnN0IGRhdGUgPSB0aGlzLnBhcnNlRGF0ZSh2YWx1ZSk7XG5cbiAgICAgICAgaWYgKGRhdGUgPT09IFwiXCIpIHJldHVybiBcIlwiOyAgLy9JbnZhbGlkIGRhdGUuXG5cbiAgICAgICAgZGF0ZS5zZXRIb3VycygwLCAwLCAwLCAwKTsgLy9TZXQgdGltZSB0byBtaWRuaWdodCB0byByZW1vdmUgdGltZSBjb21wb25lbnQuXG5cbiAgICAgICAgcmV0dXJuIGRhdGU7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIHZhbHVlIGlzIGEgRGF0ZSBvYmplY3QgdHlwZS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gdmFsdWUgXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHZhbHVlIGlzIGEgRGF0ZSBvYmplY3QgdHlwZSwgb3RoZXJ3aXNlIGBmYWxzZWAuXG4gICAgICovXG4gICAgc3RhdGljIGlzRGF0ZSh2YWx1ZSkgeyBcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09IFwiW29iamVjdCBEYXRlXVwiO1xuXG4gICAgfVxufVxuXG5leHBvcnQgeyBEYXRlSGVscGVyIH07IiwiaW1wb3J0IHsgRGF0ZUhlbHBlciB9IGZyb20gXCIuLi8uLi8uLi9oZWxwZXJzL2RhdGVIZWxwZXIuanNcIjtcbi8qKlxuICogUHJvdmlkZXMgbWV0aG9kcyB0byBmb3JtYXQgZGF0ZSBhbmQgdGltZSBzdHJpbmdzLiAgRXhwZWN0cyBkYXRlIHN0cmluZyBpbiBmb3JtYXQgb2YgeWVhci1tb250aC1kYXkuXG4gKi9cbmNsYXNzIEZvcm1hdERhdGVUaW1lIHtcbiAgICBzdGF0aWMgbW9udGhzTG9uZyA9IFtcIkphbnVhcnlcIiwgXCJGZWJydWFyeVwiLCBcIk1hcmNoXCIsIFwiQXByaWxcIiwgXCJNYXlcIiwgXCJKdW5lXCIsIFwiSnVseVwiLCBcIkF1Z3VzdFwiLCBcIlNlcHRlbWJlclwiLCBcIk9jdG9iZXJcIiwgXCJOb3ZlbWJlclwiLCBcIkRlY2VtYmVyXCJdO1xuICAgIHN0YXRpYyBtb250aHNTaG9ydCA9IFtcIkphblwiLCBcIkZlYlwiLCBcIk1hclwiLCBcIkFwclwiLCBcIk1heVwiLCBcIkp1blwiLCBcIkp1bFwiLCBcIkF1Z1wiLCBcIlNlcFwiLCBcIk9jdFwiLCBcIk5vdlwiLCBcIkRlY1wiXTtcblxuICAgIHN0YXRpYyBsZWFkaW5nWmVybyhudW0pIHtcbiAgICAgICAgcmV0dXJuIG51bSA8IDEwID8gXCIwXCIgKyBudW0gOiBudW07XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBmb3JtYXR0ZWQgZGF0ZSB0aW1lIHN0cmluZy4gIEV4cGVjdHMgZGF0ZSBzdHJpbmcgaW4gZm9ybWF0IG9mIHllYXItbW9udGgtZGF5LiAgSWYgYGZvcm1hdHRlclBhcmFtc2AgaXMgZW1wdHksIFxuICAgICAqIGZ1bmN0aW9uIHdpbGwgcmV2ZXJ0IHRvIGRlZmF1bHQgdmFsdWVzLiBFeHBlY3RlZCBwcm9wZXJ0eSB2YWx1ZXMgaW4gYGZvcm1hdHRlclBhcmFtc2Agb2JqZWN0OlxuICAgICAqIC0gZGF0ZUZpZWxkOiBmaWVsZCB0byBjb252ZXJ0IGRhdGUgdGltZS5cbiAgICAgKiAtIGZvcm1hdDogc3RyaW5nIGZvcm1hdCB0ZW1wbGF0ZS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcm93RGF0YSBSb3cgZGF0YS5cbiAgICAgKiBAcGFyYW0ge0NvbHVtbn0gY29sdW1uIENvbHVtbiBjbGFzcyBvYmplY3QuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGRlZmF1bHRGb3JtYXQgRGVmYXVsdCBzdHJpbmcgZm9ybWF0OiBNTS9kZC95eXl5XG4gICAgICogQHBhcmFtIHtib29sZWFufSBbYWRkVGltZT1mYWxzZV0gQXBwbHkgZGF0ZSB0aW1lIGZvcm1hdHRpbmc/XG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBzdGF0aWMgYXBwbHkocm93RGF0YSwgY29sdW1uLCBkZWZhdWx0Rm9ybWF0ID0gXCJNTS9kZC95eXl5XCIsIGFkZFRpbWUgPSBmYWxzZSkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gY29sdW1uPy5mb3JtYXR0ZXJQYXJhbXM/LmZvcm1hdCA/PyBkZWZhdWx0Rm9ybWF0O1xuICAgICAgICBsZXQgZmllbGQgPSBjb2x1bW4/LmZvcm1hdHRlclBhcmFtcz8uZGF0ZUZpZWxkIFxuICAgICAgICAgICAgPyByb3dEYXRhW2NvbHVtbi5mb3JtYXR0ZXJQYXJhbXMuZGF0ZUZpZWxkXVxuICAgICAgICAgICAgOiByb3dEYXRhW2NvbHVtbi5maWVsZF07XG5cbiAgICAgICAgaWYgKGZpZWxkID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRhdGUgPSBEYXRlSGVscGVyLnBhcnNlRGF0ZShmaWVsZCk7XG5cbiAgICAgICAgaWYgKGRhdGUgPT09IFwiXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGZvcm1hdHMgPSB7XG4gICAgICAgICAgICBkOiBkYXRlLmdldERhdGUoKSxcbiAgICAgICAgICAgIGRkOiB0aGlzLmxlYWRpbmdaZXJvKGRhdGUuZ2V0RGF0ZSgpKSxcblxuICAgICAgICAgICAgTTogZGF0ZS5nZXRNb250aCgpICsgMSxcbiAgICAgICAgICAgIE1NOiB0aGlzLmxlYWRpbmdaZXJvKGRhdGUuZ2V0TW9udGgoKSArIDEpLFxuICAgICAgICAgICAgTU1NOiB0aGlzLm1vbnRoc1Nob3J0W2RhdGUuZ2V0TW9udGgoKV0sXG4gICAgICAgICAgICBNTU1NOiB0aGlzLm1vbnRoc0xvbmdbZGF0ZS5nZXRNb250aCgpXSxcblxuICAgICAgICAgICAgeXk6IGRhdGUuZ2V0RnVsbFllYXIoKS50b1N0cmluZygpLnNsaWNlKC0yKSxcbiAgICAgICAgICAgIHl5eXk6IGRhdGUuZ2V0RnVsbFllYXIoKVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChhZGRUaW1lKSB7XG4gICAgICAgICAgICBsZXQgaG91cnMgPSBkYXRlLmdldEhvdXJzKCk7XG4gICAgICAgICAgICBsZXQgaG91cnMxMiA9IGhvdXJzICUgMTIgPT09IDAgPyAxMiA6IGhvdXJzICUgMTI7XG5cbiAgICAgICAgICAgIGZvcm1hdHMucyA9IGRhdGUuZ2V0U2Vjb25kcygpO1xuICAgICAgICAgICAgZm9ybWF0cy5zcyA9IHRoaXMubGVhZGluZ1plcm8oZGF0ZS5nZXRTZWNvbmRzKCkpO1xuICAgICAgICAgICAgZm9ybWF0cy5tID0gZGF0ZS5nZXRNaW51dGVzKCk7XG4gICAgICAgICAgICBmb3JtYXRzLm1tID0gdGhpcy5sZWFkaW5nWmVybyhkYXRlLmdldE1pbnV0ZXMoKSk7XG4gICAgICAgICAgICBmb3JtYXRzLmggPSBob3VyczEyO1xuICAgICAgICAgICAgZm9ybWF0cy5oaCA9ICB0aGlzLmxlYWRpbmdaZXJvKGhvdXJzMTIpO1xuICAgICAgICAgICAgZm9ybWF0cy5IID0gaG91cnM7XG4gICAgICAgICAgICBmb3JtYXRzLkhIID0gdGhpcy5sZWFkaW5nWmVybyhob3Vycyk7XG4gICAgICAgICAgICBmb3JtYXRzLmhwID0gaG91cnMgPCAxMiA/IFwiQU1cIiA6IFwiUE1cIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRhcmdldHMgPSByZXN1bHQuc3BsaXQoL1xcL3wtfFxcc3w6Lyk7XG5cbiAgICAgICAgZm9yIChsZXQgaXRlbSBvZiB0YXJnZXRzKSB7XG4gICAgICAgICAgICByZXN1bHQgPSByZXN1bHQucmVwbGFjZShpdGVtLCBmb3JtYXRzW2l0ZW1dKTtcbiAgICAgICAgfVxuICAgIFxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRm9ybWF0RGF0ZVRpbWUgfTsiLCIvKipcbiAqIFByb3ZpZGVzIG1ldGhvZCB0byBmb3JtYXQgYSBsaW5rIGFzIGFuIGFuY2hvciB0YWcgZWxlbWVudC5cbiAqL1xuY2xhc3MgRm9ybWF0TGluayB7XG4gICAgLyoqXG4gICAgICogRm9ybWF0dGVyIHRoYXQgY3JlYXRlIGFuIGFuY2hvciB0YWcgZWxlbWVudC4gaHJlZiBhbmQgb3RoZXIgYXR0cmlidXRlcyBjYW4gYmUgbW9kaWZpZWQgd2l0aCBwcm9wZXJ0aWVzIGluIHRoZSBcbiAgICAgKiAnZm9ybWF0dGVyUGFyYW1zJyBwYXJhbWV0ZXIuICBFeHBlY3RlZCBwcm9wZXJ0eSB2YWx1ZXM6IFxuICAgICAqIC0gdXJsUHJlZml4OiBCYXNlIHVybCBhZGRyZXNzLlxuICAgICAqIC0gcm91dGVGaWVsZDogUm91dGUgdmFsdWUuXG4gICAgICogLSBxdWVyeUZpZWxkOiBGaWVsZCBuYW1lIGZyb20gZGF0YXNldCB0byBidWlsZCBxdWVyeSBzdGluZyBrZXkvdmFsdWUgaW5wdXQuXG4gICAgICogLSBmaWVsZFRleHQ6IFVzZSBmaWVsZCBuYW1lIHRvIHNldCBpbm5lciB0ZXh0IHRvIGFzc29jaWF0ZWQgZGF0YXNldCB2YWx1ZS5cbiAgICAgKiAtIGlubmVyVGV4dDogUmF3IGlubmVyIHRleHQgdmFsdWUgb3IgZnVuY3Rpb24uICBJZiBmdW5jdGlvbiBpcyBwcm92aWRlZCwgaXQgd2lsbCBiZSBjYWxsZWQgd2l0aCByb3dEYXRhIGFuZCBmb3JtYXR0ZXJQYXJhbXMgYXMgcGFyYW1ldGVycy5cbiAgICAgKiAtIHRhcmdldDogSG93IHRhcmdldCBkb2N1bWVudCBzaG91bGQgYmUgb3BlbmVkLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSByb3dEYXRhIFJvdyBkYXRhLlxuICAgICAqIEBwYXJhbSB7eyB1cmxQcmVmaXg6IHN0cmluZywgcXVlcnlGaWVsZDogc3RyaW5nLCBmaWVsZFRleHQ6IHN0cmluZywgaW5uZXJUZXh0OiBzdHJpbmcgfCBGdW5jdGlvbiwgdGFyZ2V0OiBzdHJpbmcgfX0gZm9ybWF0dGVyUGFyYW1zIFNldHRpbmdzLlxuICAgICAqIEByZXR1cm4ge0hUTUxBbmNob3JFbGVtZW50fSBhbmNob3IgdGFnIGVsZW1lbnQuXG4gICAgICogKi9cbiAgICBzdGF0aWMgYXBwbHkocm93RGF0YSwgZm9ybWF0dGVyUGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XG5cbiAgICAgICAgbGV0IHVybCA9IGZvcm1hdHRlclBhcmFtcy51cmxQcmVmaXg7XG4gICAgICAgIC8vQXBwbHkgcm91dGUgdmFsdWUgYmVmb3JlIHF1ZXJ5IHN0cmluZy5cbiAgICAgICAgaWYgKGZvcm1hdHRlclBhcmFtcy5yb3V0ZUZpZWxkKSB7XG4gICAgICAgICAgICB1cmwgKz0gXCIvXCIgKyBlbmNvZGVVUklDb21wb25lbnQocm93RGF0YVtmb3JtYXR0ZXJQYXJhbXMucm91dGVGaWVsZF0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGZvcm1hdHRlclBhcmFtcy5xdWVyeUZpZWxkKSB7XG4gICAgICAgICAgICBjb25zdCBxcnlWYWx1ZSA9IGVuY29kZVVSSUNvbXBvbmVudChyb3dEYXRhW2Zvcm1hdHRlclBhcmFtcy5xdWVyeUZpZWxkXSk7XG5cbiAgICAgICAgICAgIHVybCA9IGAke3VybH0/JHtmb3JtYXR0ZXJQYXJhbXMucXVlcnlGaWVsZH09JHtxcnlWYWx1ZX1gO1xuICAgICAgICB9XG5cbiAgICAgICAgZWwuaHJlZiA9IHVybDtcblxuICAgICAgICBpZiAoZm9ybWF0dGVyUGFyYW1zLmZpZWxkVGV4dCkge1xuICAgICAgICAgICAgZWwuaW5uZXJIVE1MID0gcm93RGF0YVtmb3JtYXR0ZXJQYXJhbXMuZmllbGRUZXh0XTtcbiAgICAgICAgfSBlbHNlIGlmICgodHlwZW9mIGZvcm1hdHRlclBhcmFtcy5pbm5lclRleHQgPT09IFwiZnVuY3Rpb25cIikpIHtcbiAgICAgICAgICAgIGVsLmlubmVySFRNTCA9IGZvcm1hdHRlclBhcmFtcy5pbm5lclRleHQocm93RGF0YSwgZm9ybWF0dGVyUGFyYW1zKTtcbiAgICAgICAgfSBlbHNlIGlmIChmb3JtYXR0ZXJQYXJhbXMuaW5uZXJUZXh0KSB7XG4gICAgICAgICAgICBlbC5pbm5lckhUTUwgPSBmb3JtYXR0ZXJQYXJhbXMuaW5uZXJUZXh0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGZvcm1hdHRlclBhcmFtcy50YXJnZXQpIHtcbiAgICAgICAgICAgIGVsLnNldEF0dHJpYnV0ZShcInRhcmdldFwiLCBmb3JtYXR0ZXJQYXJhbXMudGFyZ2V0KTtcbiAgICAgICAgICAgIGVsLnNldEF0dHJpYnV0ZShcInJlbFwiLCBcIm5vb3BlbmVyXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGVsO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRm9ybWF0TGluayB9OyIsIi8qKlxuICogUHJvdmlkZXMgbWV0aG9kIHRvIGZvcm1hdCBudW1lcmljIHZhbHVlcyBpbnRvIHN0cmluZ3Mgd2l0aCBzcGVjaWZpZWQgc3R5bGVzIG9mIGRlY2ltYWwsIGN1cnJlbmN5LCBvciBwZXJjZW50LlxuICovXG5jbGFzcyBGb3JtYXROdW1lcmljIHtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgZm9ybWF0dGVkIG51bWVyaWMgc3RyaW5nLiAgYGNvbHVtbmAgaXMgZXhwZWN0ZWQgdG8gaGF2ZSB0aGUgZm9sbG93aW5nIHByb3BlcnR5IHZhbHVlcyBcbiAgICAgKiBpbiBgZm9ybWF0dGVyUGFyYW1zYCBvYmplY3Q6IFxuICAgICAqIC0gcHJlY2lzaW9uOiByb3VuZGluZyBwcmVjaXNpb24uXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHJvd0RhdGEgUm93IGRhdGEuXG4gICAgICogQHBhcmFtIHtDb2x1bW59IGNvbHVtbiBDb2x1bW4gY2xhc3Mgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbc3R5bGU9XCJkZWNpbWFsXCJdIEZvcm1hdHRpbmcgc3R5bGUgdG8gdXNlLiBEZWZhdWx0IGlzIFwiZGVjaW1hbFwiLlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgc3RhdGljIGFwcGx5KHJvd0RhdGEsIGNvbHVtbiwgc3R5bGUgPSBcImRlY2ltYWxcIikge1xuICAgICAgICBjb25zdCBmbG9hdFZhbCA9IHJvd0RhdGFbY29sdW1uLmZpZWxkXTtcblxuICAgICAgICBpZiAoaXNOYU4oZmxvYXRWYWwpKSByZXR1cm4gZmxvYXRWYWw7XG5cbiAgICAgICAgY29uc3QgcHJlY2lzaW9uID0gY29sdW1uLmZvcm1hdHRlclBhcmFtcz8ucHJlY2lzaW9uID8/IDI7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBJbnRsLk51bWJlckZvcm1hdChcImVuLVVTXCIsIHtcbiAgICAgICAgICAgIHN0eWxlOiBzdHlsZSxcbiAgICAgICAgICAgIG1heGltdW1GcmFjdGlvbkRpZ2l0czogcHJlY2lzaW9uLFxuICAgICAgICAgICAgY3VycmVuY3k6IFwiVVNEXCJcbiAgICAgICAgfSkuZm9ybWF0KGZsb2F0VmFsKTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEZvcm1hdE51bWVyaWMgfTsiLCJjbGFzcyBGb3JtYXRTdGFyIHtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGFuIGVsZW1lbnQgb2Ygc3RhciByYXRpbmdzIGJhc2VkIG9uIGludGVnZXIgdmFsdWVzLiAgRXhwZWN0ZWQgcHJvcGVydHkgdmFsdWVzOiBcbiAgICAgKiAtIHN0YXJzOiBudW1iZXIgb2Ygc3RhcnMgdG8gZGlzcGxheS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcm93RGF0YSByb3cgZGF0YS5cbiAgICAgKiBAcGFyYW0ge0NvbHVtbn0gY29sdW1uIGNvbHVtbiBjbGFzcyBvYmplY3QuXG4gICAgICogQHJldHVybnMge0hUTUxEaXZFbGVtZW50fVxuICAgICAqL1xuICAgIHN0YXRpYyBhcHBseShyb3dEYXRhLCBjb2x1bW4pIHtcbiAgICAgICAgbGV0IHZhbHVlID0gcm93RGF0YVtjb2x1bW4uZmllbGRdO1xuICAgICAgICBjb25zdCBtYXhTdGFycyA9IGNvbHVtbi5mb3JtYXR0ZXJQYXJhbXM/LnN0YXJzID8gY29sdW1uLmZvcm1hdHRlclBhcmFtcy5zdGFycyA6IDU7XG4gICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIGNvbnN0IHN0YXJzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIGNvbnN0IHN0YXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcInN2Z1wiKTtcbiAgICAgICAgY29uc3Qgc3RhckFjdGl2ZSA9ICc8cG9seWdvbiBmaWxsPVwiI0ZGRUEwMFwiIHN0cm9rZT1cIiNDMUFCNjBcIiBzdHJva2Utd2lkdGg9XCIzNy42MTUyXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCIgc3Ryb2tlLW1pdGVybGltaXQ9XCIxMFwiIHBvaW50cz1cIjI1OS4yMTYsMjkuOTQyIDMzMC4yNywxNzMuOTE5IDQ4OS4xNiwxOTcuMDA3IDM3NC4xODUsMzA5LjA4IDQwMS4zMyw0NjcuMzEgMjU5LjIxNiwzOTIuNjEyIDExNy4xMDQsNDY3LjMxIDE0NC4yNSwzMDkuMDggMjkuMjc0LDE5Ny4wMDcgMTg4LjE2NSwxNzMuOTE5IFwiLz4nO1xuICAgICAgICBjb25zdCBzdGFySW5hY3RpdmUgPSAnPHBvbHlnb24gZmlsbD1cIiNEMkQyRDJcIiBzdHJva2U9XCIjNjg2ODY4XCIgc3Ryb2tlLXdpZHRoPVwiMzcuNjE1MlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiIHN0cm9rZS1taXRlcmxpbWl0PVwiMTBcIiBwb2ludHM9XCIyNTkuMjE2LDI5Ljk0MiAzMzAuMjcsMTczLjkxOSA0ODkuMTYsMTk3LjAwNyAzNzQuMTg1LDMwOS4wOCA0MDEuMzMsNDY3LjMxIDI1OS4yMTYsMzkyLjYxMiAxMTcuMTA0LDQ2Ny4zMSAxNDQuMjUsMzA5LjA4IDI5LjI3NCwxOTcuMDA3IDE4OC4xNjUsMTczLjkxOSBcIi8+JztcblxuICAgICAgICAvL3N0eWxlIHN0YXJzIGhvbGRlclxuICAgICAgICBzdGFycy5zdHlsZS52ZXJ0aWNhbEFsaWduID0gXCJtaWRkbGVcIjtcbiAgICAgICAgLy9zdHlsZSBzdGFyXG4gICAgICAgIHN0YXIuc2V0QXR0cmlidXRlKFwid2lkdGhcIiwgXCIxNFwiKTtcbiAgICAgICAgc3Rhci5zZXRBdHRyaWJ1dGUoXCJoZWlnaHRcIiwgXCIxNFwiKTtcbiAgICAgICAgc3Rhci5zZXRBdHRyaWJ1dGUoXCJ2aWV3Qm94XCIsIFwiMCAwIDUxMiA1MTJcIik7XG4gICAgICAgIHN0YXIuc2V0QXR0cmlidXRlKFwieG1sOnNwYWNlXCIsIFwicHJlc2VydmVcIik7XG4gICAgICAgIHN0YXIuc3R5bGUucGFkZGluZyA9IFwiMCAxcHhcIjtcblxuICAgICAgICB2YWx1ZSA9IHZhbHVlICYmICFpc05hTih2YWx1ZSkgPyBwYXJzZUludCh2YWx1ZSkgOiAwO1xuICAgICAgICB2YWx1ZSA9IE1hdGgubWF4KDAsIE1hdGgubWluKHZhbHVlLCBtYXhTdGFycykpO1xuXG4gICAgICAgIGZvcihsZXQgaSA9IDE7IGkgPD0gbWF4U3RhcnM7IGkrKyl7XG4gICAgICAgICAgICBjb25zdCBuZXh0U3RhciA9IHN0YXIuY2xvbmVOb2RlKHRydWUpO1xuXG4gICAgICAgICAgICBuZXh0U3Rhci5pbm5lckhUTUwgPSBpIDw9IHZhbHVlID8gc3RhckFjdGl2ZSA6IHN0YXJJbmFjdGl2ZTtcblxuICAgICAgICAgICAgc3RhcnMuYXBwZW5kQ2hpbGQobmV4dFN0YXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29udGFpbmVyLnN0eWxlLndoaXRlU3BhY2UgPSBcIm5vd3JhcFwiO1xuICAgICAgICBjb250YWluZXIuc3R5bGUub3ZlcmZsb3cgPSBcImhpZGRlblwiO1xuICAgICAgICBjb250YWluZXIuc3R5bGUudGV4dE92ZXJmbG93ID0gXCJlbGxpcHNpc1wiO1xuICAgICAgICBjb250YWluZXIuc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbFwiLCB2YWx1ZSk7XG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmQoc3RhcnMpO1xuXG4gICAgICAgIHJldHVybiBjb250YWluZXI7XG4gICAgfVxufVxuXG5leHBvcnQgeyBGb3JtYXRTdGFyIH07IiwiY2xhc3MgQ3NzSGVscGVyIHtcbiAgICBzdGF0aWMgYmV0d2VlbiA9IHtcbiAgICAgICAgYnV0dG9uOiBcInRhYmxlZGF0YS1iZXR3ZWVuLWJ1dHRvblwiLFxuICAgICAgICBsYWJlbDogXCJ0YWJsZWRhdGEtYmV0d2Vlbi1pbnB1dC1sYWJlbFwiXG4gICAgfTtcblxuICAgIHN0YXRpYyBub0hlYWRlciA9IFwidGFibGVkYXRhLW5vLWhlYWRlclwiO1xuICAgIHN0YXRpYyBpbnB1dCA9IFwidGFibGVkYXRhLWlucHV0XCI7XG5cbiAgICBzdGF0aWMgbXVsdGlTZWxlY3QgPSB7XG4gICAgICAgIHBhcmVudENsYXNzOiBcInRhYmxlZGF0YS1tdWx0aS1zZWxlY3RcIixcbiAgICAgICAgaGVhZGVyOiBcInRhYmxlZGF0YS1tdWx0aS1zZWxlY3QtaGVhZGVyXCIsXG4gICAgICAgIGhlYWRlckFjdGl2ZTogXCJ0YWJsZWRhdGEtbXVsdGktc2VsZWN0LWhlYWRlci1hY3RpdmVcIixcbiAgICAgICAgaGVhZGVyT3B0aW9uOiBcInRhYmxlZGF0YS1tdWx0aS1zZWxlY3QtaGVhZGVyLW9wdGlvblwiLFxuICAgICAgICBvcHRpb25zOiBcInRhYmxlZGF0YS1tdWx0aS1zZWxlY3Qtb3B0aW9uc1wiLFxuICAgICAgICBvcHRpb246IFwidGFibGVkYXRhLW11bHRpLXNlbGVjdC1vcHRpb25cIixcbiAgICAgICAgb3B0aW9uVGV4dDogXCJ0YWJsZWRhdGEtbXVsdGktc2VsZWN0LW9wdGlvbi10ZXh0XCIsXG4gICAgICAgIG9wdGlvblJhZGlvOiBcInRhYmxlZGF0YS1tdWx0aS1zZWxlY3Qtb3B0aW9uLXJhZGlvXCIsXG4gICAgICAgIHNlbGVjdGVkOiBcInRhYmxlZGF0YS1tdWx0aS1zZWxlY3Qtc2VsZWN0ZWRcIlxuICAgIH07XG5cbiAgICBzdGF0aWMgdG9vbHRpcCA9IHsgXG4gICAgICAgIHBhcmVudENsYXNzOiBcInRhYmxlZGF0YS10b29sdGlwXCIsXG4gICAgICAgIHJpZ2h0OiBcInRhYmxlZGF0YS10b29sdGlwLXJpZ2h0XCIsXG4gICAgICAgIGxlZnQ6IFwidGFibGVkYXRhLXRvb2x0aXAtbGVmdFwiXG4gICAgfTtcbn1cblxuZXhwb3J0IHsgQ3NzSGVscGVyIH07IiwiaW1wb3J0IHsgRm9ybWF0RGF0ZVRpbWUgfSBmcm9tIFwiLi9mb3JtYXR0ZXJzL2RhdGV0aW1lLmpzXCI7XG5pbXBvcnQgeyBGb3JtYXRMaW5rIH0gZnJvbSBcIi4vZm9ybWF0dGVycy9saW5rLmpzXCI7XG5pbXBvcnQgeyBGb3JtYXROdW1lcmljIH0gZnJvbSBcIi4vZm9ybWF0dGVycy9udW1lcmljLmpzXCI7XG5pbXBvcnQgeyBGb3JtYXRTdGFyIH0gZnJvbSBcIi4vZm9ybWF0dGVycy9zdGFyLmpzXCI7XG5pbXBvcnQgeyBDc3NIZWxwZXIgfSBmcm9tIFwiLi4vLi4vaGVscGVycy9jc3NIZWxwZXIuanNcIjtcbi8qKlxuICogUmVwcmVzZW50cyBhIHRhYmxlIGNlbGwgYHRkYCBlbGVtZW50IGluIHRoZSBncmlkLiAgV2lsbCBhcHBseSBmb3JtYXR0aW5nIGFzIGRlZmluZWQgaW4gdGhlIGNvbHVtbiBvYmplY3QuXG4gKi9cbmNsYXNzIENlbGwge1xuICAgIC8vIEZvcm1hdHRlciByZWdpc3RyeSB1c2luZyBzdHJhdGVneSBwYXR0ZXJuXG4gICAgc3RhdGljICNmb3JtYXR0ZXJzID0ge1xuICAgICAgICBsaW5rOiAocm93RGF0YSwgY29sdW1uLCBlbGVtZW50KSA9PiB7XG4gICAgICAgICAgICBlbGVtZW50LmFwcGVuZChGb3JtYXRMaW5rLmFwcGx5KHJvd0RhdGEsIGNvbHVtbi5mb3JtYXR0ZXJQYXJhbXMpKTtcbiAgICAgICAgfSxcbiAgICAgICAgZGF0ZTogKHJvd0RhdGEsIGNvbHVtbiwgZWxlbWVudCkgPT4ge1xuICAgICAgICAgICAgZWxlbWVudC5pbm5lclRleHQgPSBGb3JtYXREYXRlVGltZS5hcHBseShyb3dEYXRhLCBjb2x1bW4sIGNvbHVtbi5zZXR0aW5ncy5kYXRlRm9ybWF0LCBmYWxzZSk7XG4gICAgICAgIH0sXG4gICAgICAgIGRhdGV0aW1lOiAocm93RGF0YSwgY29sdW1uLCBlbGVtZW50KSA9PiB7XG4gICAgICAgICAgICBlbGVtZW50LmlubmVyVGV4dCA9IEZvcm1hdERhdGVUaW1lLmFwcGx5KHJvd0RhdGEsIGNvbHVtbiwgY29sdW1uLnNldHRpbmdzLmRhdGVUaW1lRm9ybWF0LCB0cnVlKTtcbiAgICAgICAgfSxcbiAgICAgICAgZGVjaW1hbDogKHJvd0RhdGEsIGNvbHVtbiwgZWxlbWVudCkgPT4ge1xuICAgICAgICAgICAgZWxlbWVudC5pbm5lclRleHQgPSBGb3JtYXROdW1lcmljLmFwcGx5KHJvd0RhdGEsIGNvbHVtbiwgXCJkZWNpbWFsXCIpO1xuICAgICAgICB9LFxuICAgICAgICBtb25leTogKHJvd0RhdGEsIGNvbHVtbiwgZWxlbWVudCkgPT4ge1xuICAgICAgICAgICAgZWxlbWVudC5pbm5lclRleHQgPSBGb3JtYXROdW1lcmljLmFwcGx5KHJvd0RhdGEsIGNvbHVtbiwgXCJjdXJyZW5jeVwiKTtcbiAgICAgICAgfSxcbiAgICAgICAgcGVyY2VudDogKHJvd0RhdGEsIGNvbHVtbiwgZWxlbWVudCkgPT4ge1xuICAgICAgICAgICAgZWxlbWVudC5pbm5lclRleHQgPSBGb3JtYXROdW1lcmljLmFwcGx5KHJvd0RhdGEsIGNvbHVtbiwgXCJwZXJjZW50XCIpO1xuICAgICAgICB9LFxuICAgICAgICBzdGFyOiAocm93RGF0YSwgY29sdW1uLCBlbGVtZW50KSA9PiB7XG4gICAgICAgICAgICBlbGVtZW50LmFwcGVuZChGb3JtYXRTdGFyLmFwcGx5KHJvd0RhdGEsIGNvbHVtbikpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIGEgY2VsbCBvYmplY3QgdGhhdCByZXByZXNlbnRzIHRoZSBgdGRgIHRhYmxlIGJvZHkgZWxlbWVudC5cbiAgICAgKiBAcGFyYW0ge0FycmF5PG9iamVjdD59IHJvd0RhdGEgUm93IGRhdGEuXG4gICAgICogQHBhcmFtIHtDb2x1bW59IGNvbHVtbiBDb2x1bW4gb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBtb2R1bGVzIEdyaWQgbW9kdWxlKHMpIGFkZGVkIGJ5IHVzZXIgZm9yIGN1c3RvbSBmb3JtYXR0aW5nLlxuICAgICAqIEBwYXJhbSB7SFRNTFRhYmxlUm93RWxlbWVudH0gcm93IFRhYmxlIHJvdyBgdHJgIGVsZW1lbnQuXG4gICAgICovXG4gICAgY29uc3RydWN0b3Iocm93RGF0YSwgY29sdW1uLCBtb2R1bGVzLCByb3cpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRkXCIpO1xuXG4gICAgICAgIGlmIChjb2x1bW4uZm9ybWF0dGVyKSB7XG4gICAgICAgICAgICB0aGlzLiNhcHBseUZvcm1hdHRlcihyb3dEYXRhLCBjb2x1bW4sIG1vZHVsZXMsIHJvdyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiNzZXREZWZhdWx0Q29udGVudChyb3dEYXRhLCBjb2x1bW4pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbHVtbi50b29sdGlwRmllbGQpIHtcbiAgICAgICAgICAgIHRoaXMuI2FwcGx5VG9vbHRpcChyb3dEYXRhW2NvbHVtbi50b29sdGlwRmllbGRdLCBjb2x1bW4udG9vbHRpcExheW91dCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogU2V0cyBkZWZhdWx0IGNlbGwgY29udGVudCB3aGVuIG5vIGZvcm1hdHRlciBpcyBzcGVjaWZpZWQuXG4gICAgICogQHBhcmFtIHtBcnJheTxvYmplY3Q+fSByb3dEYXRhIFJvdyBkYXRhLlxuICAgICAqIEBwYXJhbSB7Q29sdW1ufSBjb2x1bW4gQ29sdW1uIG9iamVjdC5cbiAgICAgKi9cbiAgICAjc2V0RGVmYXVsdENvbnRlbnQocm93RGF0YSwgY29sdW1uKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5pbm5lclRleHQgPSByb3dEYXRhW2NvbHVtbi5maWVsZF0gPz8gXCJcIjtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQXBwbGllcyB0b29sdGlwIGZ1bmN0aW9uYWxpdHkgdG8gdGhlIGNlbGwuIElmIHRoZSBjZWxsJ3MgY29udGVudCBjb250YWlucyB0ZXh0IG9ubHksIGl0IHdpbGwgY3JlYXRlIGEgdG9vbHRpcCBcbiAgICAgKiBgc3BhbmAgZWxlbWVudCBhbmQgYXBwbHkgdGhlIGNvbnRlbnQgdG8gaXQuXG4gICAgICogQHBhcmFtIHtzdHJpbmcgfCBudW1iZXIgfCBEYXRlIHwgbnVsbH0gY29udGVudCBUb29sdGlwIGNvbnRlbnQgdG8gYmUgZGlzcGxheWVkLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBsYXlvdXQgQ1NTIGNsYXNzIGZvciB0b29sdGlwIGxheW91dCwgZWl0aGVyIFwidGFibGVkYXRhLXRvb2x0aXAtcmlnaHRcIiBvciBcInRhYmxlZGF0YS10b29sdGlwLWxlZnRcIi5cbiAgICAgKi9cbiAgICAjYXBwbHlUb29sdGlwKGNvbnRlbnQsIGxheW91dCkge1xuICAgICAgICBpZiAoY29udGVudCA9PT0gbnVsbCB8fCBjb250ZW50ID09PSBcIlwiKSByZXR1cm47XG4gICAgICAgIFxuICAgICAgICBsZXQgdG9vbHRpcEVsZW1lbnQgPSB0aGlzLmVsZW1lbnQuZmlyc3RFbGVtZW50Q2hpbGQ7XG5cbiAgICAgICAgaWYgKHRvb2x0aXBFbGVtZW50ID09PSBudWxsKSB7XG4gICAgICAgICAgICB0b29sdGlwRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICAgICAgdG9vbHRpcEVsZW1lbnQuaW5uZXJUZXh0ID0gdGhpcy5lbGVtZW50LmlubmVyVGV4dDtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5yZXBsYWNlQ2hpbGRyZW4odG9vbHRpcEVsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdG9vbHRpcEVsZW1lbnQuZGF0YXNldC50b29sdGlwID0gY29udGVudDtcbiAgICAgICAgdG9vbHRpcEVsZW1lbnQuY2xhc3NMaXN0LmFkZChDc3NIZWxwZXIudG9vbHRpcC5wYXJlbnRDbGFzcywgbGF5b3V0KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQXBwbGllcyB0aGUgYXBwcm9wcmlhdGUgZm9ybWF0dGVyIHRvIHRoZSBjZWxsIGNvbnRlbnQuXG4gICAgICogQHBhcmFtIHtBcnJheTxvYmplY3Q+fSByb3dEYXRhIFJvdyBkYXRhLlxuICAgICAqIEBwYXJhbSB7Q29sdW1ufSBjb2x1bW4gQ29sdW1uIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gbW9kdWxlcyBHcmlkIG1vZHVsZShzKSBhZGRlZCBieSB1c2VyIGZvciBjdXN0b20gZm9ybWF0dGluZy5cbiAgICAgKiBAcGFyYW0ge0hUTUxUYWJsZVJvd0VsZW1lbnR9IHJvdyBUYWJsZSByb3cgYHRyYCBlbGVtZW50LlxuICAgICAqL1xuICAgICNhcHBseUZvcm1hdHRlcihyb3dEYXRhLCBjb2x1bW4sIG1vZHVsZXMsIHJvdykge1xuICAgICAgICAvLyBIYW5kbGUgY3VzdG9tIGZ1bmN0aW9uIGZvcm1hdHRlciBmcm9tIGNvbHVtbiBkZWZpbml0aW9uLlxuICAgICAgICBpZiAodHlwZW9mIGNvbHVtbi5mb3JtYXR0ZXIgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZChjb2x1bW4uZm9ybWF0dGVyKHJvd0RhdGEsIGNvbHVtbi5mb3JtYXR0ZXJQYXJhbXMsIHRoaXMuZWxlbWVudCwgcm93KSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBIYW5kbGUgbW9kdWxlIGZvcm1hdHRlclxuICAgICAgICBpZiAoY29sdW1uLmZvcm1hdHRlciA9PT0gXCJtb2R1bGVcIikge1xuICAgICAgICAgICAgY29uc3QgbW9kdWxlTmFtZSA9IGNvbHVtbi5mb3JtYXR0ZXJNb2R1bGVOYW1lO1xuXG4gICAgICAgICAgICBpZiAoIW1vZHVsZXM/Llttb2R1bGVOYW1lXSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgRm9ybWF0dGVyIG1vZHVsZSBcIiR7bW9kdWxlTmFtZX1cIiBub3QgZm91bmRgKTtcbiAgICAgICAgICAgICAgICB0aGlzLiNzZXREZWZhdWx0Q29udGVudChyb3dEYXRhLCBjb2x1bW4pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZChtb2R1bGVzW21vZHVsZU5hbWVdLmFwcGx5KHJvd0RhdGEsIGNvbHVtbiwgcm93LCB0aGlzLmVsZW1lbnQpKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIEhhbmRsZSBidWlsdC1pbiBmb3JtYXR0ZXJcbiAgICAgICAgY29uc3QgZm9ybWF0dGVyID0gQ2VsbC4jZm9ybWF0dGVyc1tjb2x1bW4uZm9ybWF0dGVyXTtcblxuICAgICAgICBpZiAoZm9ybWF0dGVyKSB7XG4gICAgICAgICAgICAvLyBTZXQgdGhlIGNlbGwgY29udGVudCwgZWl0aGVyIGFzIHRleHQgb3IgRE9NIGVsZW1lbnQuXG4gICAgICAgICAgICBmb3JtYXR0ZXIocm93RGF0YSwgY29sdW1uLCB0aGlzLmVsZW1lbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy4jc2V0RGVmYXVsdENvbnRlbnQocm93RGF0YSwgY29sdW1uKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IHsgQ2VsbCB9OyIsIi8qKlxuICogRGVmaW5lcyBhIHNpbmdsZSBoZWFkZXIgY2VsbCAndGgnIGVsZW1lbnQuXG4gKi9cbmNsYXNzIEhlYWRlckNlbGwge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBoZWFkZXIgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyB0aGUgYHRoYCB0YWJsZSBoZWFkZXIgZWxlbWVudC4gIENsYXNzIHdpbGwgcGVyc2lzdCBjb2x1bW4gc29ydCBhbmQgb3JkZXIgdXNlciBpbnB1dC5cbiAgICAgKiBAcGFyYW0ge0NvbHVtbn0gY29sdW1uIGNvbHVtbiBvYmplY3QuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29sdW1uKSB7XG4gICAgICAgIHRoaXMuY29sdW1uID0gY29sdW1uO1xuICAgICAgICB0aGlzLnNldHRpbmdzID0gY29sdW1uLnNldHRpbmdzO1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGhcIik7XG4gICAgICAgIHRoaXMuc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICB0aGlzLm5hbWUgPSBjb2x1bW4uZmllbGQ7XG4gICAgICAgIHRoaXMuZGlyZWN0aW9uID0gXCJkZXNjXCI7XG4gICAgICAgIHRoaXMuZGlyZWN0aW9uTmV4dCA9IFwiZGVzY1wiO1xuICAgICAgICB0aGlzLnR5cGUgPSBjb2x1bW4udHlwZTtcblxuICAgICAgICBpZiAoY29sdW1uLmhlYWRlckNzcykge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC5hZGQoY29sdW1uLmhlYWRlckNzcyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy50YWJsZUhlYWRlclRoQ3NzKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuY2xhc3NMaXN0LmFkZCh0aGlzLnNldHRpbmdzLnRhYmxlSGVhZGVyVGhDc3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbHVtbi5jb2x1bW5TaXplKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuY2xhc3NMaXN0LmFkZChjb2x1bW4uY29sdW1uU2l6ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29sdW1uLndpZHRoKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUud2lkdGggPSBjb2x1bW4ud2lkdGg7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29sdW1uLmhlYWRlckZpbHRlckVtcHR5KSB7XG4gICAgICAgICAgICB0aGlzLnNwYW4uY2xhc3NMaXN0LmFkZChjb2x1bW4uaGVhZGVyRmlsdGVyRW1wdHkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuc3Bhbik7XG4gICAgICAgIHRoaXMuZWxlbWVudC5jb250ZXh0ID0gdGhpcztcbiAgICAgICAgdGhpcy5zcGFuLmlubmVyVGV4dCA9IGNvbHVtbi5sYWJlbDtcbiAgICAgICAgdGhpcy5zcGFuLmNvbnRleHQgPSB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHNvcnQgZmxhZyBmb3IgdGhlIGhlYWRlciBjZWxsLlxuICAgICAqL1xuICAgIHNldFNvcnRGbGFnKCkge1xuICAgICAgICBpZiAodGhpcy5pY29uID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuaWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpXCIpO1xuICAgICAgICAgICAgdGhpcy5zcGFuLmFwcGVuZCh0aGlzLmljb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZGlyZWN0aW9uTmV4dCA9PT0gXCJkZXNjXCIpIHtcbiAgICAgICAgICAgIHRoaXMuaWNvbi5jbGFzc0xpc3QgPSB0aGlzLnNldHRpbmdzLnRhYmxlQ3NzU29ydERlc2M7XG4gICAgICAgICAgICB0aGlzLmRpcmVjdGlvbiA9IFwiZGVzY1wiO1xuICAgICAgICAgICAgdGhpcy5kaXJlY3Rpb25OZXh0ID0gXCJhc2NcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaWNvbi5jbGFzc0xpc3QgPSB0aGlzLnNldHRpbmdzLnRhYmxlQ3NzU29ydEFzYztcbiAgICAgICAgICAgIHRoaXMuZGlyZWN0aW9uID0gXCJhc2NcIjtcbiAgICAgICAgICAgIHRoaXMuZGlyZWN0aW9uTmV4dCA9IFwiZGVzY1wiO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlbW92ZSB0aGUgc29ydCBmbGFnIGZvciB0aGUgaGVhZGVyIGNlbGwuXG4gICAgICovXG4gICAgcmVtb3ZlU29ydEZsYWcoKSB7XG4gICAgICAgIHRoaXMuZGlyZWN0aW9uID0gXCJkZXNjXCI7XG4gICAgICAgIHRoaXMuZGlyZWN0aW9uTmV4dCA9IFwiZGVzY1wiO1xuICAgICAgICB0aGlzLmljb24gPSB0aGlzLmljb24ucmVtb3ZlKCk7XG4gICAgfVxuXG4gICAgZ2V0IGlzQ3VycmVudFNvcnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmljb24gIT09IHVuZGVmaW5lZDtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEhlYWRlckNlbGwgfTsiLCJpbXBvcnQgeyBDc3NIZWxwZXIgfSBmcm9tIFwiLi4vLi4vaGVscGVycy9jc3NIZWxwZXIuanNcIjtcbi8qKlxuICogRGVmaW5lcyBhIHNpbmdsZSBjb2x1bW4gZm9yIHRoZSBncmlkLiAgVHJhbnNmb3JtcyB1c2VyJ3MgY29sdW1uIGRlZmluaXRpb24gaW50byBDbGFzcyBwcm9wZXJ0aWVzLlxuICogQGNsYXNzXG4gKi9cbmNsYXNzIENvbHVtbiB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGNvbHVtbiBvYmplY3Qgd2hpY2ggdHJhbnNmb3JtcyB1c2VyJ3MgY29sdW1uIGRlZmluaXRpb24gaW50byBDbGFzcyBwcm9wZXJ0aWVzLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb2x1bW4gVXNlcidzIGNvbHVtbiBkZWZpbml0aW9uL3NldHRpbmdzLlxuICAgICAqIEBwYXJhbSB7U2V0dGluZ3NHcmlkfSBzZXR0aW5ncyBncmlkIHNldHRpbmdzLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleCBjb2x1bW4gaW5kZXggbnVtYmVyLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbHVtbiwgc2V0dGluZ3MsIGluZGV4ID0gMCkge1xuICAgICAgICB0aGlzLnNldHRpbmdzID0gc2V0dGluZ3M7XG4gICAgICAgIHRoaXMuaW5kZXggPSBpbmRleDtcblxuICAgICAgICBpZiAoY29sdW1uLmZpZWxkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuZmllbGQgPSBgY29sdW1uJHtpbmRleH1gOyAgLy9hc3NvY2lhdGVkIGRhdGEgZmllbGQgbmFtZS5cbiAgICAgICAgICAgIHRoaXMudHlwZSA9IFwiaWNvblwiOyAgLy9pY29uIHR5cGUuXG4gICAgICAgICAgICB0aGlzLmxhYmVsID0gXCJcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZmllbGQgPSBjb2x1bW4uZmllbGQ7ICAvL2Fzc29jaWF0ZWQgZGF0YSBmaWVsZCBuYW1lLlxuICAgICAgICAgICAgdGhpcy50eXBlID0gY29sdW1uLnR5cGUgPyBjb2x1bW4udHlwZSA6IFwic3RyaW5nXCI7ICAvL3ZhbHVlIHR5cGUuXG4gICAgICAgICAgICB0aGlzLmxhYmVsID0gY29sdW1uLmxhYmVsIFxuICAgICAgICAgICAgICAgID8gY29sdW1uLmxhYmVsIFxuICAgICAgICAgICAgICAgIDogY29sdW1uLmZpZWxkWzBdLnRvVXBwZXJDYXNlKCkgKyBjb2x1bW4uZmllbGQuc2xpY2UoMSk7ICAvL2NvbHVtbiB0aXRsZS5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb2x1bW4/LmZvcm1hdHRlck1vZHVsZU5hbWUpIHsgXG4gICAgICAgICAgICB0aGlzLmZvcm1hdHRlciA9IFwibW9kdWxlXCI7XG4gICAgICAgICAgICB0aGlzLmZvcm1hdHRlck1vZHVsZU5hbWUgPSBjb2x1bW4uZm9ybWF0dGVyTW9kdWxlTmFtZTsgIC8vZm9ybWF0dGVyIG1vZHVsZSBuYW1lLlxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5mb3JtYXR0ZXIgPSBjb2x1bW4uZm9ybWF0dGVyOyAgLy9mb3JtYXR0ZXIgdHlwZSBvciBmdW5jdGlvbi5cbiAgICAgICAgICAgIHRoaXMuZm9ybWF0dGVyUGFyYW1zID0gY29sdW1uLmZvcm1hdHRlclBhcmFtcztcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaGVhZGVyQ3NzID0gY29sdW1uLmhlYWRlckNzcztcbiAgICAgICAgdGhpcy5jb2x1bW5TaXplID0gY29sdW1uPy5jb2x1bW5TaXplID8gYHRhYmxlZGF0YS1jb2wtJHtjb2x1bW4uY29sdW1uU2l6ZX1gIDogXCJcIjtcbiAgICAgICAgdGhpcy53aWR0aCA9IGNvbHVtbj8ud2lkdGggPz8gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLmhhc0ZpbHRlciA9IHRoaXMudHlwZSAhPT0gXCJpY29uXCIgJiYgY29sdW1uLmZpbHRlclR5cGUgPyB0cnVlIDogZmFsc2U7XG4gICAgICAgIHRoaXMuaGVhZGVyQ2VsbCA9IHVuZGVmaW5lZDsgIC8vSGVhZGVyQ2VsbCBjbGFzcy5cbiAgICAgICAgdGhpcy5oZWFkZXJGaWx0ZXIgPSB1bmRlZmluZWQ7ICAvL0hlYWRlckZpbHRlciBjbGFzcy5cblxuICAgICAgICBpZiAodGhpcy5oYXNGaWx0ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuI2luaXRpYWxpemVGaWx0ZXIoY29sdW1uLCBzZXR0aW5ncyk7XG4gICAgICAgIH0gZWxzZSBpZiAoY29sdW1uPy5oZWFkZXJGaWx0ZXJFbXB0eSkge1xuICAgICAgICAgICAgdGhpcy5oZWFkZXJGaWx0ZXJFbXB0eSA9ICh0eXBlb2YgY29sdW1uLmhlYWRlckZpbHRlckVtcHR5ID09PSBcInN0cmluZ1wiKSBcbiAgICAgICAgICAgICAgICA/IGNvbHVtbi5oZWFkZXJGaWx0ZXJFbXB0eSA6IENzc0hlbHBlci5ub0hlYWRlcjtcbiAgICAgICAgfVxuICAgICAgICAvL1Rvb2x0aXAgc2V0dGluZy5cbiAgICAgICAgaWYgKGNvbHVtbi50b29sdGlwRmllbGQpIHtcbiAgICAgICAgICAgIHRoaXMudG9vbHRpcEZpZWxkID0gY29sdW1uLnRvb2x0aXBGaWVsZDtcbiAgICAgICAgICAgIHRoaXMudG9vbHRpcExheW91dCA9IGNvbHVtbj8udG9vbHRpcExheW91dCA9PT0gXCJyaWdodFwiID8gQ3NzSGVscGVyLnRvb2x0aXAucmlnaHQgOiBDc3NIZWxwZXIudG9vbHRpcC5sZWZ0O1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemVzIGZpbHRlciBwcm9wZXJ0aWVzLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb2x1bW4gXG4gICAgICogQHBhcmFtIHtTZXR0aW5nc30gc2V0dGluZ3MgXG4gICAgICovXG4gICAgI2luaXRpYWxpemVGaWx0ZXIoY29sdW1uLCBzZXR0aW5ncykge1xuICAgICAgICB0aGlzLmZpbHRlckVsZW1lbnQgPSBjb2x1bW4uZmlsdGVyVHlwZSA9PT0gXCJiZXR3ZWVuXCIgPyBcImJldHdlZW5cIiA6IFwiaW5wdXRcIjtcbiAgICAgICAgdGhpcy5maWx0ZXJUeXBlID0gY29sdW1uLmZpbHRlclR5cGU7ICAvL2ZpbHRlciB0eXBlIGRlc2NyaXB0b3IsIHN1Y2ggYXM6IGVxdWFscywgbGlrZSwgPCwgZXRjOyBjYW4gYWxzbyBiZSBhIGZ1bmN0aW9uLlxuICAgICAgICB0aGlzLmZpbHRlclBhcmFtcyA9IGNvbHVtbi5maWx0ZXJQYXJhbXM7XG4gICAgICAgIHRoaXMuZmlsdGVyQ3NzID0gY29sdW1uPy5maWx0ZXJDc3MgPz8gc2V0dGluZ3MudGFibGVGaWx0ZXJDc3M7XG4gICAgICAgIHRoaXMuZmlsdGVyUmVhbFRpbWUgPSBjb2x1bW4/LmZpbHRlclJlYWxUaW1lID8/IGZhbHNlO1xuXG4gICAgICAgIGlmIChjb2x1bW4uZmlsdGVyVmFsdWVzKSB7XG4gICAgICAgICAgICB0aGlzLmZpbHRlclZhbHVlcyA9IGNvbHVtbi5maWx0ZXJWYWx1ZXM7ICAvL3NlbGVjdCBvcHRpb24gZmlsdGVyIHZhbHVlLlxuICAgICAgICAgICAgdGhpcy5maWx0ZXJWYWx1ZXNSZW1vdGVTb3VyY2UgPSB0eXBlb2YgY29sdW1uLmZpbHRlclZhbHVlcyA9PT0gXCJzdHJpbmdcIiA/IGNvbHVtbi5maWx0ZXJWYWx1ZXMgOiB1bmRlZmluZWQ7ICAvL3NlbGVjdCBvcHRpb24gZmlsdGVyIHZhbHVlIGFqYXggc291cmNlLlxuICAgICAgICAgICAgdGhpcy5maWx0ZXJFbGVtZW50ID0gY29sdW1uLmZpbHRlck11bHRpU2VsZWN0ID8gXCJtdWx0aVwiIDogXCJzZWxlY3RcIjtcbiAgICAgICAgICAgIHRoaXMuZmlsdGVyTXVsdGlTZWxlY3QgPSBjb2x1bW4uZmlsdGVyTXVsdGlTZWxlY3Q7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCB7IENvbHVtbiB9OyIsImltcG9ydCB7IEhlYWRlckNlbGwgfSBmcm9tIFwiLi4vY2VsbC9oZWFkZXJDZWxsLmpzXCI7XG5pbXBvcnQgeyBDb2x1bW4gfSBmcm9tIFwiLi9jb2x1bW4uanNcIjtcbi8qKlxuICogQ3JlYXRlcyBhbmQgbWFuYWdlcyB0aGUgY29sdW1ucyBmb3IgdGhlIGdyaWQuICBXaWxsIGNyZWF0ZSBhIGBDb2x1bW5gIG9iamVjdCBmb3IgZWFjaCBjb2x1bW4gZGVmaW5pdGlvbiBwcm92aWRlZCBieSB0aGUgdXNlci5cbiAqL1xuY2xhc3MgQ29sdW1uTWFuYWdlciB7XG4gICAgI2NvbHVtbnM7XG4gICAgI2luZGV4Q291bnRlciA9IDA7XG4gICAgLyoqXG4gICAgICogVHJhbnNmb3JtcyB1c2VyJ3MgY29sdW1uIGRlZmluaXRpb25zIGludG8gY29uY3JldGUgYENvbHVtbmAgY2xhc3Mgb2JqZWN0cy4gIFdpbGwgYWxzbyBjcmVhdGUgYEhlYWRlckNlbGxgIG9iamVjdHMgXG4gICAgICogZm9yIGVhY2ggY29sdW1uLlxuICAgICAqIEBwYXJhbSB7QXJyYXk8T2JqZWN0Pn0gY29sdW1ucyBDb2x1bW4gZGVmaW5pdGlvbnMgZnJvbSB1c2VyLlxuICAgICAqIEBwYXJhbSB7U2V0dGluZ3NHcmlkfSBzZXR0aW5ncyBHcmlkIHNldHRpbmdzLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbHVtbnMsIHNldHRpbmdzKSB7XG4gICAgICAgIHRoaXMuI2NvbHVtbnMgPSBbXTtcbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9IHNldHRpbmdzO1xuICAgICAgICB0aGlzLnRhYmxlRXZlbkNvbHVtbldpZHRocyA9IHNldHRpbmdzLnRhYmxlRXZlbkNvbHVtbldpZHRocztcbiAgICAgICAgdGhpcy5oYXNIZWFkZXJGaWx0ZXJzID0gZmFsc2U7XG5cbiAgICAgICAgZm9yIChjb25zdCBjIG9mIGNvbHVtbnMpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbCA9IG5ldyBDb2x1bW4oYywgc2V0dGluZ3MsIHRoaXMuI2luZGV4Q291bnRlcik7XG4gICAgICAgICAgXG4gICAgICAgICAgICBjb2wuaGVhZGVyQ2VsbCA9IG5ldyBIZWFkZXJDZWxsKGNvbCk7XG5cbiAgICAgICAgICAgIHRoaXMuI2NvbHVtbnMucHVzaChjb2wpO1xuICAgICAgICAgICAgdGhpcy4jaW5kZXhDb3VudGVyKys7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQ2hlY2sgaWYgYW55IGNvbHVtbiBoYXMgYSBmaWx0ZXIgZGVmaW5lZFxuICAgICAgICBpZiAodGhpcy4jY29sdW1ucy5zb21lKChjKSA9PiBjLmhhc0ZpbHRlcikpIHtcbiAgICAgICAgICAgIHRoaXMuaGFzSGVhZGVyRmlsdGVycyA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2V0dGluZ3MudGFibGVFdmVuQ29sdW1uV2lkdGhzKSB7XG4gICAgICAgICAgICB0aGlzLiNzZXRFdmVuQ29sdW1uV2lkdGhzKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogU2V0cyBldmVuIGNvbHVtbiB3aWR0aHMgZm9yIGFsbCBjb2x1bW5zIHRoYXQgZG8gbm90IGhhdmUgYSB3aWR0aCBzZXQgYnkgdGhlIHVzZXIuXG4gICAgICogVGhpcyBtZXRob2QgY2FsY3VsYXRlcyB0aGUgd2lkdGggYmFzZWQgb24gdGhlIG51bWJlciBvZiBjb2x1bW5zIHdpdGhvdXQgYSB1c2VyLWRlZmluZWQgd2lkdGguXG4gICAgICovXG4gICAgI3NldEV2ZW5Db2x1bW5XaWR0aHMoKSB7IFxuICAgICAgICAvL0NvdW50IHRoZSBudW1iZXIgb2YgY29sdW1ucyB0aGF0IGRvIG5vdCBoYXZlIGEgd2lkdGggc2V0IGJ5IHRoZSB1c2VyLlxuICAgICAgICBjb25zdCBjb3VudCA9IHRoaXMuI2NvbHVtbnMuZmlsdGVyKGNvbCA9PiBjb2wud2lkdGggPT09IHVuZGVmaW5lZCkubGVuZ3RoO1xuICAgICAgICBjb25zdCB1c2VyV2lkdGhzID0gdGhpcy4jY29sdW1ucy5maWx0ZXIoY29sID0+IGNvbC53aWR0aCAhPT0gdW5kZWZpbmVkKS5tYXAoY29sID0+IGNvbC53aWR0aCk7XG4gICAgICAgIGxldCB0b3RhbFVzZXJXaWR0aCA9IDA7XG4gICAgICAgIC8vIENoZWNrIGlmIGFueSB1c2VyLWRlZmluZWQgd2lkdGhzIGFyZSBwZXJjZW50YWdlcy4gIElmIGZvdW5kLCBjYWxjdWxhdGUgdGhlIHRvdGFsIHN1bSBzbyB0aGV5XG4gICAgICAgIC8vIGNhbiBiZSBleGNsdWRlZCBmcm9tIHRoZSBldmVuIHdpZHRoIGNhbGN1bGF0aW9uLlxuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgdXNlcldpZHRocykgeyBcbiAgICAgICAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gXCJzdHJpbmdcIiAmJiAoaXRlbS5pbmNsdWRlcyhcIiVcIikpKSB7XG4gICAgICAgICAgICAgICAgdG90YWxVc2VyV2lkdGggKz0gcGFyc2VGbG9hdChpdGVtLnJlcGxhY2UoXCIlXCIsIFwiXCIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHdpZHRoID0gKDEwMCAtIHRvdGFsVXNlcldpZHRoKSAvIGNvdW50O1xuXG4gICAgICAgIGZvciAoY29uc3QgY29sIG9mIHRoaXMuI2NvbHVtbnMpIHsgXG4gICAgICAgICAgICAvLyBJZiB0aGUgY29sdW1uIGFscmVhZHkgaGFzIGEgd2lkdGggc2V0LCBza2lwIGl0XG4gICAgICAgICAgICBpZiAoY29sLmhlYWRlckNlbGwuZWxlbWVudC5zdHlsZS53aWR0aCkgY29udGludWU7XG4gICAgICAgICAgICAvLyBTZXQgdGhlIHdpZHRoIG9mIHRoZSBoZWFkZXIgY2VsbCB0byB0aGUgY2FsY3VsYXRlZCBldmVuIHdpZHRoXG4gICAgICAgICAgICBjb2wuaGVhZGVyQ2VsbC5lbGVtZW50LnN0eWxlLndpZHRoID0gYCR7d2lkdGh9JWA7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogR2V0IGFycmF5IG9mIGBDb2x1bW5gIG9iamVjdHMuXG4gICAgICogQHJldHVybnMge0FycmF5PENvbHVtbj59IGFycmF5IG9mIGBDb2x1bW5gIG9iamVjdHMuXG4gICAgICovXG4gICAgZ2V0IGNvbHVtbnMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLiNjb2x1bW5zO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbmV3IGNvbHVtbiB0byB0aGUgY29sdW1ucyBjb2xsZWN0aW9uLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb2x1bW4gQ29sdW1uIGRlZmluaXRpb24gb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbaW5kZXg9bnVsbF0gSW5kZXggdG8gaW5zZXJ0IHRoZSBjb2x1bW4gYXQuIElmIG51bGwsIGFwcGVuZHMgdG8gdGhlIGVuZC5cbiAgICAgKi9cbiAgICBhZGRDb2x1bW4oY29sdW1uLCBpbmRleCA9IG51bGwpIHsgXG4gICAgICAgIGNvbnN0IGNvbCA9IG5ldyBDb2x1bW4oY29sdW1uLCB0aGlzLnNldHRpbmdzLCB0aGlzLiNpbmRleENvdW50ZXIpO1xuICAgICAgICBjb2wuaGVhZGVyQ2VsbCA9IG5ldyBIZWFkZXJDZWxsKGNvbCk7XG5cbiAgICAgICAgaWYgKGluZGV4ICE9PSBudWxsICYmIGluZGV4ID49IDAgJiYgaW5kZXggPCB0aGlzLiNjb2x1bW5zLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhpcy4jY29sdW1ucy5zcGxpY2UoaW5kZXgsIDAsIGNvbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiNjb2x1bW5zLnB1c2goY29sKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuI2luZGV4Q291bnRlcisrO1xuXG4gICAgICAgIGlmICh0aGlzLnRhYmxlRXZlbkNvbHVtbldpZHRocykge1xuICAgICAgICAgICAgdGhpcy4jc2V0RXZlbkNvbHVtbldpZHRocygpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgeyBDb2x1bW5NYW5hZ2VyIH07IiwiZXhwb3J0IGRlZmF1bHQge1xuICAgIGJhc2VJZE5hbWU6IFwidGFibGVkYXRhXCIsICAvL2Jhc2UgbmFtZSBmb3IgYWxsIGVsZW1lbnQgSUQncy5cbiAgICBkYXRhOiBbXSwgIC8vcm93IGRhdGEuXG4gICAgY29sdW1uczogW10sICAvL2NvbHVtbiBkZWZpbml0aW9ucy5cbiAgICBlbmFibGVQYWdpbmc6IHRydWUsICAvL2VuYWJsZSBwYWdpbmcgb2YgZGF0YS5cbiAgICBwYWdlclBhZ2VzVG9EaXNwbGF5OiA1LCAgLy9tYXggbnVtYmVyIG9mIHBhZ2VyIGJ1dHRvbnMgdG8gZGlzcGxheS5cbiAgICBwYWdlclJvd3NQZXJQYWdlOiAyNSwgIC8vcm93cyBwZXIgcGFnZS5cbiAgICBwYWdlckNzczogXCJ0YWJsZWRhdGEtcGFnZXJcIiwgLy9jc3MgY2xhc3MgZm9yIHBhZ2VyIGNvbnRhaW5lci5cbiAgICBkYXRlRm9ybWF0OiBcIk1NL2RkL3l5eXlcIiwgIC8vcm93IGxldmVsIGRhdGUgZm9ybWF0LlxuICAgIGRhdGVUaW1lRm9ybWF0OiBcIk1NL2RkL3l5eXkgSEg6bW06c3NcIiwgLy9yb3cgbGV2ZWwgZGF0ZSBmb3JtYXQuXG4gICAgcmVtb3RlVXJsOiBcIlwiLCAgLy9nZXQgZGF0YSBmcm9tIHVybCBlbmRwb2ludCB2aWEgQWpheC5cbiAgICByZW1vdGVQYXJhbXM6IFwiXCIsICAvL3BhcmFtZXRlcnMgdG8gYmUgcGFzc2VkIG9uIEFqYXggcmVxdWVzdC5cbiAgICByZW1vdGVQcm9jZXNzaW5nOiBmYWxzZSwgIC8vdHJ1dGh5IHNldHMgZ3JpZCB0byBwcm9jZXNzIGZpbHRlci9zb3J0IG9uIHJlbW90ZSBzZXJ2ZXIuXG4gICAgdGFibGVDc3M6IFwidGFibGVkYXRhXCIsIFxuICAgIHRhYmxlU3R5bGVTZXR0aW5nczogXCJcIiwgLy9jdXN0b20gc3R5bGUgc2V0dGluZ3MgZm9yIHRhYmxlIGVsZW1lbnQuICBvYmplY3Qgd2l0aCBrZXkvdmFsdWUgcGFpcnMuXG4gICAgdGFibGVIZWFkZXJUaENzczogXCJcIixcbiAgICB0YWJsZUZpbHRlckNzczogXCJ0YWJsZWRhdGEtaW5wdXRcIiwgIC8vY3NzIGNsYXNzIGZvciBoZWFkZXIgZmlsdGVyIGlucHV0IGVsZW1lbnRzLlxuICAgIHRhYmxlRXZlbkNvbHVtbldpZHRoczogZmFsc2UsICAvL3Nob3VsZCBhbGwgY29sdW1ucyBiZSBlcXVhbCB3aWR0aD9cbiAgICB0YWJsZUNzc1NvcnRBc2M6IFwidGFibGVkYXRhLXNvcnQtaWNvbiB0YWJsZWRhdGEtc29ydC1hc2NcIixcbiAgICB0YWJsZUNzc1NvcnREZXNjOiBcInRhYmxlZGF0YS1zb3J0LWljb24gdGFibGVkYXRhLXNvcnQtZGVzY1wiLFxuICAgIHJlZnJlc2hhYmxlSWQ6IFwiXCIsICAvL3JlZnJlc2ggcmVtb3RlIGRhdGEgc291cmNlcyBmb3IgZ3JpZCBhbmQvb3IgZmlsdGVyIHZhbHVlcy5cbiAgICByb3dDb3VudElkOiBcIlwiLFxuICAgIGNzdkV4cG9ydElkOiBcIlwiLFxuICAgIGNzdkV4cG9ydFJlbW90ZVNvdXJjZTogXCJcIiAvL2dldCBleHBvcnQgZGF0YSBmcm9tIHVybCBlbmRwb2ludCB2aWEgQWpheDsgdXNlZnVsIHRvIGdldCBub24tcGFnZWQgZGF0YS5cbn07IiwiaW1wb3J0IHNldHRpbmdzRGVmYXVsdHMgZnJvbSBcIi4vc2V0dGluZ3NEZWZhdWx0LmpzXCI7XG5cbmNsYXNzIE1lcmdlT3B0aW9ucyB7XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhbiBvYmplY3QgYmFzZWQgb24gdGhlIG1lcmdlZCByZXN1bHRzIG9mIHRoZSBkZWZhdWx0IGFuZCB1c2VyIHByb3ZpZGVkIHNldHRpbmdzLlxuICAgICAqIFVzZXIgcHJvdmlkZWQgc2V0dGluZ3Mgd2lsbCBvdmVycmlkZSBkZWZhdWx0cy5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gc291cmNlIHVzZXIgc3VwcGxpZWQgc2V0dGluZ3MuXG4gICAgICogQHJldHVybnMge09iamVjdH0gc2V0dGluZ3MgbWVyZ2VkIGZyb20gZGVmYXVsdCBhbmQgdXNlciB2YWx1ZXMuXG4gICAgICovXG4gICAgc3RhdGljIG1lcmdlKHNvdXJjZSkge1xuICAgICAgICAvL2NvcHkgZGVmYXVsdCBrZXkvdmFsdWUgaXRlbXMuXG4gICAgICAgIGxldCByZXN1bHQgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHNldHRpbmdzRGVmYXVsdHMpKTtcblxuICAgICAgICBpZiAoc291cmNlID09PSB1bmRlZmluZWQgfHwgT2JqZWN0LmtleXMoc291cmNlKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhzb3VyY2UpKSB7XG4gICAgICAgICAgICBsZXQgdGFyZ2V0VHlwZSA9IHJlc3VsdFtrZXldICE9PSB1bmRlZmluZWQgPyByZXN1bHRba2V5XS50b1N0cmluZygpIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgbGV0IHNvdXJjZVR5cGUgPSB2YWx1ZS50b1N0cmluZygpO1xuXG4gICAgICAgICAgICBpZiAodGFyZ2V0VHlwZSAhPT0gdW5kZWZpbmVkICYmIHRhcmdldFR5cGUgIT09IHNvdXJjZVR5cGUpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG59XG5cbmV4cG9ydCB7IE1lcmdlT3B0aW9ucyB9OyIsIi8qKlxuICogSW1wbGVtZW50cyB0aGUgcHJvcGVydHkgc2V0dGluZ3MgZm9yIHRoZSBncmlkLlxuICovXG5jbGFzcyBTZXR0aW5nc0dyaWQge1xuICAgIC8qKlxuICAgICAqIFRyYW5zbGF0ZXMgc2V0dGluZ3MgZnJvbSBtZXJnZWQgdXNlci9kZWZhdWx0IG9wdGlvbnMgaW50byBhIGRlZmluaXRpb24gb2YgZ3JpZCBzZXR0aW5ncy5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBNZXJnZWQgdXNlci9kZWZhdWx0IG9wdGlvbnMuXG4gICAgICovXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICB0aGlzLmJhc2VJZE5hbWUgPSBvcHRpb25zLmJhc2VJZE5hbWU7XG4gICAgICAgIHRoaXMuZW5hYmxlUGFnaW5nID0gb3B0aW9ucy5lbmFibGVQYWdpbmc7XG4gICAgICAgIHRoaXMucGFnZXJQYWdlc1RvRGlzcGxheSA9IG9wdGlvbnMucGFnZXJQYWdlc1RvRGlzcGxheTtcbiAgICAgICAgdGhpcy5wYWdlclJvd3NQZXJQYWdlID0gb3B0aW9ucy5wYWdlclJvd3NQZXJQYWdlO1xuICAgICAgICB0aGlzLmRhdGVGb3JtYXQgPSBvcHRpb25zLmRhdGVGb3JtYXQ7XG4gICAgICAgIHRoaXMuZGF0ZVRpbWVGb3JtYXQgPSBvcHRpb25zLmRhdGVUaW1lRm9ybWF0O1xuICAgICAgICB0aGlzLnJlbW90ZVVybCA9IG9wdGlvbnMucmVtb3RlVXJsOyAgXG4gICAgICAgIHRoaXMucmVtb3RlUGFyYW1zID0gb3B0aW9ucy5yZW1vdGVQYXJhbXM7XG4gICAgICAgIHRoaXMucmVtb3RlUHJvY2Vzc2luZyA9IGZhbHNlO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5hamF4VXJsID0gKHRoaXMucmVtb3RlVXJsICYmIHRoaXMucmVtb3RlUGFyYW1zKSA/IHRoaXMuX2J1aWxkQWpheFVybCh0aGlzLnJlbW90ZVVybCwgdGhpcy5yZW1vdGVQYXJhbXMpIDogdGhpcy5yZW1vdGVVcmw7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnJlbW90ZVByb2Nlc3NpbmcgPT09IFwiYm9vbGVhblwiICYmIG9wdGlvbnMucmVtb3RlUHJvY2Vzc2luZykge1xuICAgICAgICAgICAgLy8gUmVtb3RlIHByb2Nlc3Npbmcgc2V0IHRvIGBvbmA7IHVzZSBmaXJzdCBjb2x1bW4gd2l0aCBmaWVsZCBhcyBkZWZhdWx0IHNvcnQuXG4gICAgICAgICAgICBjb25zdCBmaXJzdCA9IG9wdGlvbnMuY29sdW1ucy5maW5kKChpdGVtKSA9PiBpdGVtLmZpZWxkICE9PSB1bmRlZmluZWQpO1xuXG4gICAgICAgICAgICB0aGlzLnJlbW90ZVByb2Nlc3NpbmcgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5yZW1vdGVTb3J0RGVmYXVsdENvbHVtbiA9IGZpcnN0LmZpZWxkO1xuICAgICAgICAgICAgdGhpcy5yZW1vdGVTb3J0RGVmYXVsdERpcmVjdGlvbiA9IFwiZGVzY1wiO1xuICAgICAgICB9IGVsc2UgaWYgKE9iamVjdC5rZXlzKG9wdGlvbnMucmVtb3RlUHJvY2Vzc2luZykubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgLy8gUmVtb3RlIHByb2Nlc3Npbmcgc2V0IHRvIGBvbmAgdXNpbmcga2V5L3ZhbHVlIHBhcmFtZXRlciBpbnB1dHMgZm9yIGRlZmF1bHQgc29ydCBjb2x1bW4uXG4gICAgICAgICAgICB0aGlzLnJlbW90ZVByb2Nlc3NpbmcgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5yZW1vdGVTb3J0RGVmYXVsdENvbHVtbiA9IG9wdGlvbnMucmVtb3RlUHJvY2Vzc2luZy5jb2x1bW47XG4gICAgICAgICAgICB0aGlzLnJlbW90ZVNvcnREZWZhdWx0RGlyZWN0aW9uID0gb3B0aW9ucy5yZW1vdGVQcm9jZXNzaW5nLmRpcmVjdGlvbiA/PyBcImRlc2NcIjtcbiAgICAgICAgfSBcblxuICAgICAgICB0aGlzLnRhYmxlQ3NzID0gb3B0aW9ucy50YWJsZUNzcztcbiAgICAgICAgdGhpcy50YWJsZUhlYWRlclRoQ3NzID0gb3B0aW9ucy50YWJsZUhlYWRlclRoQ3NzO1xuICAgICAgICB0aGlzLnRhYmxlU3R5bGVTZXR0aW5ncyA9IG9wdGlvbnMudGFibGVTdHlsZVNldHRpbmdzOyBcbiAgICAgICAgdGhpcy5wYWdlckNzcyA9IG9wdGlvbnMucGFnZXJDc3M7XG4gICAgICAgIHRoaXMudGFibGVGaWx0ZXJDc3MgPSBvcHRpb25zLnRhYmxlRmlsdGVyQ3NzO1xuICAgICAgICB0aGlzLnRhYmxlRXZlbkNvbHVtbldpZHRocyA9IG9wdGlvbnMudGFibGVFdmVuQ29sdW1uV2lkdGhzO1xuICAgICAgICB0aGlzLnRhYmxlQ3NzU29ydEFzYyA9IG9wdGlvbnMudGFibGVDc3NTb3J0QXNjO1xuICAgICAgICB0aGlzLnRhYmxlQ3NzU29ydERlc2MgPSBvcHRpb25zLnRhYmxlQ3NzU29ydERlc2M7XG4gICAgICAgIHRoaXMucmVmcmVzaGFibGVJZCA9IG9wdGlvbnMucmVmcmVzaGFibGVJZDtcbiAgICAgICAgdGhpcy5yb3dDb3VudElkID0gb3B0aW9ucy5yb3dDb3VudElkO1xuICAgICAgICB0aGlzLmNzdkV4cG9ydElkID0gb3B0aW9ucy5jc3ZFeHBvcnRJZDtcbiAgICAgICAgdGhpcy5jc3ZFeHBvcnRSZW1vdGVTb3VyY2UgPSBvcHRpb25zLmNzdkV4cG9ydFJlbW90ZVNvdXJjZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ29tcGlsZXMgdGhlIGtleS92YWx1ZSBxdWVyeSBwYXJhbWV0ZXJzIGludG8gYSBmdWxseSBxdWFsaWZpZWQgdXJsIHdpdGggcXVlcnkgc3RyaW5nLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgYmFzZSB1cmwuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcyBxdWVyeSBzdHJpbmcgcGFyYW1ldGVycy5cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSB1cmwgd2l0aCBxdWVyeSBwYXJhbWV0ZXJzLlxuICAgICAqL1xuICAgIF9idWlsZEFqYXhVcmwodXJsLCBwYXJhbXMpIHtcbiAgICAgICAgY29uc3QgcCA9IE9iamVjdC5rZXlzKHBhcmFtcyk7XG5cbiAgICAgICAgaWYgKHAubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3QgcXVlcnkgPSBwLm1hcChrID0+IGAke2VuY29kZVVSSUNvbXBvbmVudChrKX09JHtlbmNvZGVVUklDb21wb25lbnQocGFyYW1zW2tdKX1gKVxuICAgICAgICAgICAgICAgIC5qb2luKFwiJlwiKTtcblxuICAgICAgICAgICAgcmV0dXJuIGAke3VybH0/JHtxdWVyeX1gO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgU2V0dGluZ3NHcmlkIH07IiwiY2xhc3MgRGF0YUxvYWRlciB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGNsYXNzIHRvIHJldHJpZXZlIGRhdGEgdmlhIGFuIEFqYXggY2FsbC5cbiAgICAgKiBAcGFyYW0ge1NldHRpbmdzR3JpZH0gc2V0dGluZ3MgZ3JpZCBzZXR0aW5ncy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihzZXR0aW5ncykge1xuICAgICAgICB0aGlzLmFqYXhVcmwgPSBzZXR0aW5ncy5hamF4VXJsO1xuICAgIH1cbiAgICAvKioqXG4gICAgICogVXNlcyBpbnB1dCBwYXJhbWV0ZXIncyBrZXkvdmFsdWUgcGFyaXMgdG8gYnVpbGQgYSBmdWxseSBxdWFsaWZpZWQgdXJsIHdpdGggcXVlcnkgc3RyaW5nIHZhbHVlcy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFRhcmdldCB1cmwuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtwYXJhbWV0ZXJzPXt9XSBJbnB1dCBwYXJhbWV0ZXJzLlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IEZ1bGx5IHF1YWxpZmllZCB1cmwuXG4gICAgICovXG4gICAgYnVpbGRVcmwodXJsLCBwYXJhbWV0ZXJzID0ge30pIHtcbiAgICAgICAgY29uc3QgcCA9IE9iamVjdC5rZXlzKHBhcmFtZXRlcnMpO1xuICBcbiAgICAgICAgaWYgKHAubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdXJsO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHJlc3VsdCA9IFtdO1xuXG4gICAgICAgIGZvciAoY29uc3Qga2V5IG9mIHApIHtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHBhcmFtZXRlcnNba2V5XSkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtdWx0aSA9IHBhcmFtZXRlcnNba2V5XS5tYXAoayA9PiBgJHtrZXl9PSR7ZW5jb2RlVVJJQ29tcG9uZW50KGspfWApO1xuXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdChtdWx0aSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGAke2tleX09JHtlbmNvZGVVUklDb21wb25lbnQocGFyYW1ldGVyc1trZXldKX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB1cmwuaW5kZXhPZihcIj9cIikgIT09IC0xID8gYCR7dXJsfSYke3Jlc3VsdC5qb2luKFwiJlwiKX1gIDogYCR7dXJsfT8ke3Jlc3VsdC5qb2luKFwiJlwiKX1gO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBNYWtlcyBhbiBBamF4IGNhbGwgdG8gdGFyZ2V0IHJlc291cmNlLCBhbmQgcmV0dXJucyB0aGUgcmVzdWx0cyBhcyBhIEpTT04gYXJyYXkuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCB1cmwuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMga2V5L3ZhbHVlIHF1ZXJ5IHN0cmluZyBwYWlycy5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXkgfCBPYmplY3R9XG4gICAgICovXG4gICAgYXN5bmMgcmVxdWVzdERhdGEodXJsLCBwYXJhbWV0ZXJzID0ge30pIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgICAgICBjb25zdCB0YXJnZXRVcmwgPSB0aGlzLmJ1aWxkVXJsKHVybCwgcGFyYW1ldGVycyk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godGFyZ2V0VXJsLCB7IFxuICAgICAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIiwgXG4gICAgICAgICAgICAgICAgbW9kZTogXCJjb3JzXCIsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyBBY2NlcHQ6IFwiYXBwbGljYXRpb24vanNvblwiIH0gXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICAgICAgICAgICAgfSBcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICB3aW5kb3cuYWxlcnQoZXJyLm1lc3NhZ2UpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyLm1lc3NhZ2UpO1xuICAgICAgICAgICAgcmVzdWx0ID0gW107XG4gICAgICAgIH1cbiAgXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIE1ha2VzIGFuIEFqYXggY2FsbCB0byB0YXJnZXQgcmVzb3VyY2UgaWRlbnRpZmllZCBpbiB0aGUgYGFqYXhVcmxgIFNldHRpbmdzIHByb3BlcnR5LCBhbmQgcmV0dXJucyB0aGUgcmVzdWx0cyBhcyBhIEpTT04gYXJyYXkuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtwYXJhbWV0ZXJzPXt9XSBrZXkvdmFsdWUgcXVlcnkgc3RyaW5nIHBhaXJzLlxuICAgICAqIEByZXR1cm5zIHtBcnJheSB8IE9iamVjdH1cbiAgICAgKi9cbiAgICBhc3luYyByZXF1ZXN0R3JpZERhdGEocGFyYW1ldGVycyA9IHt9KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlcXVlc3REYXRhKHRoaXMuYWpheFVybCwgcGFyYW1ldGVycyk7XG4gICAgfVxufVxuXG5leHBvcnQgeyBEYXRhTG9hZGVyIH07IiwiLyoqXG4gKiBQcm92aWRlcyBtZXRob2RzIHRvIHN0b3JlIGFuZCBwZXJzaXN0IGRhdGEgZm9yIHRoZSBncmlkLlxuICovXG5jbGFzcyBEYXRhUGVyc2lzdGVuY2Uge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgY2xhc3Mgb2JqZWN0IHRvIHN0b3JlIGFuZCBwZXJzaXN0IGdyaWQgZGF0YS5cbiAgICAgKiBAcGFyYW0ge0FycmF5PE9iamVjdD59IGRhdGEgcm93IGRhdGEuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoZGF0YSkge1xuICAgICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgICAgICB0aGlzLmRhdGFDYWNoZSA9IGRhdGEubGVuZ3RoID4gMCA/IHN0cnVjdHVyZWRDbG9uZShkYXRhKSA6IFtdO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSByb3cgZGF0YS5cbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBDb3VudCBvZiByb3dzIGluIHRoZSBkYXRhLlxuICAgICAqL1xuICAgIGdldCByb3dDb3VudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0YS5sZW5ndGg7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNhdmVzIHRoZSBkYXRhIHRvIHRoZSBjbGFzcyBvYmplY3QuICBXaWxsIGFsc28gY2FjaGUgYSBjb3B5IG9mIHRoZSBkYXRhIGZvciBsYXRlciByZXN0b3JhdGlvbiBpZiBmaWx0ZXJpbmcgb3Igc29ydGluZyBpcyBhcHBsaWVkLlxuICAgICAqIEBwYXJhbSB7QXJyYXk8b2JqZWN0Pn0gZGF0YSBEYXRhIHNldC5cbiAgICAgKi9cbiAgICBzZXREYXRhID0gKGRhdGEpID0+IHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGRhdGEpKSB7XG4gICAgICAgICAgICB0aGlzLmRhdGEgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuZGF0YUNhY2hlID0gW107XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgICAgICB0aGlzLmRhdGFDYWNoZSA9IGRhdGEubGVuZ3RoID4gMCA/IHN0cnVjdHVyZWRDbG9uZShkYXRhKSA6IFtdO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogUmVzZXRzIHRoZSBkYXRhIHRvIHRoZSBvcmlnaW5hbCBzdGF0ZSB3aGVuIHRoZSBjbGFzcyB3YXMgY3JlYXRlZC5cbiAgICAgKi9cbiAgICByZXN0b3JlRGF0YSgpIHtcbiAgICAgICAgdGhpcy5kYXRhID0gc3RydWN0dXJlZENsb25lKHRoaXMuZGF0YUNhY2hlKTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IERhdGFQZXJzaXN0ZW5jZSB9OyIsIi8qKlxuICogQ2xhc3MgdG8gYnVpbGQgYSBkYXRhLXByb2Nlc3NpbmcgcGlwZWxpbmUgdGhhdCBpbnZva2VzIGFuIGFzeW5jIGZ1bmN0aW9uIHRvIHJldHJpZXZlIGRhdGEgZnJvbSBhIHJlbW90ZSBzb3VyY2UsIFxuICogYW5kIHBhc3MgdGhlIHJlc3VsdHMgdG8gYW4gYXNzb2NpYXRlZCBoYW5kbGVyIGZ1bmN0aW9uLiAgV2lsbCBleGVjdXRlIHN0ZXBzIGluIHRoZSBvcmRlciB0aGV5IGFyZSBhZGRlZCB0byB0aGUgY2xhc3MuXG4gKiBcbiAqIFRoZSBtYWluIHB1cnBvc2Ugb2YgdGhpcyBjbGFzcyBpcyB0byByZXRyaWV2ZSByZW1vdGUgZGF0YSBmb3Igc2VsZWN0IGlucHV0IGNvbnRyb2xzLCBidXQgY2FuIGJlIHVzZWQgZm9yIGFueSBoYW5kbGluZyBcbiAqIG9mIHJlbW90ZSBkYXRhIHJldHJpZXZhbCBhbmQgcHJvY2Vzc2luZy5cbiAqL1xuY2xhc3MgRGF0YVBpcGVsaW5lIHtcbiAgICAjcGlwZWxpbmVzO1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgZGF0YS1wcm9jZXNzaW5nIHBpcGVsaW5lIGNsYXNzLiAgV2lsbCBpbnRlcm5hbGx5IGJ1aWxkIGEga2V5L3ZhbHVlIHBhaXIgb2YgZXZlbnRzIGFuZCBhc3NvY2lhdGVkXG4gICAgICogY2FsbGJhY2sgZnVuY3Rpb25zLiAgVmFsdWUgd2lsbCBiZSBhbiBhcnJheSB0byBhY2NvbW1vZGF0ZSBtdWx0aXBsZSBjYWxsYmFja3MgYXNzaWduZWQgdG8gdGhlIHNhbWUgZXZlbnQgXG4gICAgICoga2V5IG5hbWUuXG4gICAgICogQHBhcmFtIHtTZXR0aW5nc0dyaWR9IHNldHRpbmdzIFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHNldHRpbmdzKSB7XG4gICAgICAgIHRoaXMuI3BpcGVsaW5lcyA9IHt9OyBcbiAgICAgICAgdGhpcy5hamF4VXJsID0gc2V0dGluZ3MuYWpheFVybDtcbiAgICB9XG5cbiAgICBjb3VudEV2ZW50U3RlcHMoZXZlbnROYW1lKSB7XG4gICAgICAgIGlmICghdGhpcy4jcGlwZWxpbmVzW2V2ZW50TmFtZV0pIHJldHVybiAwO1xuXG4gICAgICAgIHJldHVybiB0aGlzLiNwaXBlbGluZXNbZXZlbnROYW1lXS5sZW5ndGg7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIHN0ZXBzIGFyZSByZWdpc3RlcmVkIGZvciB0aGUgYXNzb2NpYXRlZCBldmVudCBuYW1lLCBvciBgZmFsc2VgIGlmIG5vIG1hdGNoaW5nIHJlc3VsdHMgYXJlIGZvdW5kLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUgRXZlbnQgbmFtZS5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gYHRydWVgIGlmIHJlc3VsdHMgYXJlIGZvdW5kIGZvciBldmVudCBuYW1lLCBvdGhlcndpc2UgYGZhbHNlYC5cbiAgICAgKi9cbiAgICBoYXNQaXBlbGluZShldmVudE5hbWUpIHtcbiAgICAgICAgaWYgKCF0aGlzLiNwaXBlbGluZXNbZXZlbnROYW1lXSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIHJldHVybiB0aGlzLiNwaXBlbGluZXNbZXZlbnROYW1lXS5sZW5ndGggPiAwO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlciBhbiBhc3luY2hyb25vdXMgY2FsbGJhY2sgc3RlcCB0byB0aGUgcGlwZWxpbmUuICBNb3JlIHRoYW4gb25lIGNhbGxiYWNrIGNhbiBiZSByZWdpc3RlcmVkIHRvIHRoZSBzYW1lIGV2ZW50IG5hbWUuXG4gICAgICogXG4gICAgICogSWYgYSBkdXBsaWNhdGUvbWF0Y2hpbmcgZXZlbnQgbmFtZSBhbmQgY2FsbGJhY2sgZnVuY3Rpb24gaGFzIGFscmVhZHkgYmVlbiByZWdpc3RlcmVkLCBtZXRob2Qgd2lsbCBza2lwIHRoZSBcbiAgICAgKiByZWdpc3RyYXRpb24gcHJvY2Vzcy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIEV2ZW50IG5hbWUuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgQW4gYXN5bmMgZnVuY3Rpb24uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFt1cmw9XCJcIl0gVGFyZ2V0IHVybC4gIFdpbGwgdXNlIGBhamF4VXJsYCBwcm9wZXJ0eSBkZWZhdWx0IGlmIGFyZ3VtZW50IGlzIGVtcHR5LlxuICAgICAqL1xuICAgIGFkZFN0ZXAoZXZlbnROYW1lLCBjYWxsYmFjaywgdXJsID0gXCJcIikge1xuICAgICAgICBpZiAoIXRoaXMuI3BpcGVsaW5lc1tldmVudE5hbWVdKSB7XG4gICAgICAgICAgICB0aGlzLiNwaXBlbGluZXNbZXZlbnROYW1lXSA9IFtdO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuI3BpcGVsaW5lc1tldmVudE5hbWVdLnNvbWUoKHgpID0+IHguY2FsbGJhY2sgPT09IGNhbGxiYWNrKSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiQ2FsbGJhY2sgZnVuY3Rpb24gYWxyZWFkeSBmb3VuZCBmb3I6IFwiICsgZXZlbnROYW1lKTtcbiAgICAgICAgICAgIHJldHVybjsgIC8vIElmIGV2ZW50IG5hbWUgYW5kIGNhbGxiYWNrIGFscmVhZHkgZXhpc3QsIGRvbid0IGFkZC5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh1cmwgPT09IFwiXCIpIHtcbiAgICAgICAgICAgIHVybCA9IHRoaXMuYWpheFVybDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuI3BpcGVsaW5lc1tldmVudE5hbWVdLnB1c2goe3VybDogdXJsLCBjYWxsYmFjazogY2FsbGJhY2t9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRXhlY3V0ZXMgdGhlIEhUVFAgcmVxdWVzdChzKSBmb3IgdGhlIGdpdmVuIGV2ZW50IG5hbWUsIGFuZCBwYXNzZXMgdGhlIHJlc3VsdHMgdG8gdGhlIGFzc29jaWF0ZWQgY2FsbGJhY2sgZnVuY3Rpb24uICBcbiAgICAgKiBNZXRob2QgZXhwZWN0cyByZXR1cm4gdHlwZSBvZiByZXF1ZXN0IHRvIGJlIGEgSlNPTiByZXNwb25zZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIFxuICAgICAqL1xuICAgIGFzeW5jIGV4ZWN1dGUoZXZlbnROYW1lKSB7XG4gICAgICAgIGZvciAobGV0IGl0ZW0gb2YgdGhpcy4jcGlwZWxpbmVzW2V2ZW50TmFtZV0pIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChpdGVtLnVybCwgeyBcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBcIkdFVFwiLCBcbiAgICAgICAgICAgICAgICAgICAgbW9kZTogXCJjb3JzXCIsXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgQWNjZXB0OiBcImFwcGxpY2F0aW9uL2pzb25cIiB9IFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uY2FsbGJhY2soZGF0YSk7XG4gICAgICAgICAgICAgICAgfSBcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5hbGVydChlcnIubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgeyBEYXRhUGlwZWxpbmUgfTsiLCJjbGFzcyBFbGVtZW50SGVscGVyIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIEhUTUwgZWxlbWVudCB3aXRoIHRoZSBzcGVjaWZpZWQgdGFnIGFuZCBwcm9wZXJ0aWVzLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIHRhZyBuYW1lIG9mIHRoZSBlbGVtZW50IHRvIGNyZWF0ZS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW3Byb3BlcnRpZXM9e31dIEFuIG9iamVjdCBjb250YWluaW5nIHByb3BlcnRpZXMgdG8gYXNzaWduIHRvIHRoZSBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbZGF0YXNldD17fV0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgZGF0YXNldCBhdHRyaWJ1dGVzIHRvIGFzc2lnbiB0byB0aGUgZWxlbWVudC5cbiAgICAgKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR9IFRoZSBjcmVhdGVkIEhUTUwgZWxlbWVudC5cbiAgICAgKi9cbiAgICBzdGF0aWMgY3JlYXRlKHRhZywgcHJvcGVydGllcyA9IHt9LCBkYXRhc2V0ID0ge30pIHtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IE9iamVjdC5hc3NpZ24oZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcpLCBwcm9wZXJ0aWVzKTtcblxuICAgICAgICBpZiAoZGF0YXNldCkgeyBcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oZWxlbWVudC5kYXRhc2V0LCBkYXRhc2V0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgYGRpdmAgZWxlbWVudCB3aXRoIHRoZSBzcGVjaWZpZWQgcHJvcGVydGllcyBhbmQgZGF0YXNldC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW3Byb3BlcnRpZXM9e31dIEFuIG9iamVjdCBjb250YWluaW5nIHByb3BlcnRpZXMgdG8gYXNzaWduIHRvIHRoZSBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbZGF0YXNldD17fV0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgZGF0YXNldCBhdHRyaWJ1dGVzIHRvIGFzc2lnbiB0byB0aGUgZWxlbWVudC5cbiAgICAgKiBAcmV0dXJucyB7SFRNTERpdkVsZW1lbnR9IFRoZSBjcmVhdGVkIEhUTUwgZWxlbWVudC5cbiAgICAgKi9cbiAgICBzdGF0aWMgZGl2KHByb3BlcnRpZXMgPSB7fSwgZGF0YXNldCA9IHt9KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZShcImRpdlwiLCBwcm9wZXJ0aWVzLCBkYXRhc2V0KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGBpbnB1dGAgZWxlbWVudCB3aXRoIHRoZSBzcGVjaWZpZWQgcHJvcGVydGllcyBhbmQgZGF0YXNldC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW3Byb3BlcnRpZXM9e31dIEFuIG9iamVjdCBjb250YWluaW5nIHByb3BlcnRpZXMgdG8gYXNzaWduIHRvIHRoZSBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbZGF0YXNldD17fV0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgZGF0YXNldCBhdHRyaWJ1dGVzIHRvIGFzc2lnbiB0byB0aGUgZWxlbWVudC5cbiAgICAgKiBAcmV0dXJucyB7SFRNTElucHV0RWxlbWVudH0gVGhlIGNyZWF0ZWQgSFRNTCBlbGVtZW50LlxuICAgICAqL1xuICAgIHN0YXRpYyBpbnB1dChwcm9wZXJ0aWVzID0ge30sIGRhdGFzZXQgPSB7fSkge1xuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGUoXCJpbnB1dFwiLCBwcm9wZXJ0aWVzLCBkYXRhc2V0KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGBzcGFuYCBlbGVtZW50IHdpdGggdGhlIHNwZWNpZmllZCBwcm9wZXJ0aWVzIGFuZCBkYXRhc2V0LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcGVydGllcz17fV0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgcHJvcGVydGllcyB0byBhc3NpZ24gdG8gdGhlIGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtkYXRhc2V0PXt9XSBBbiBvYmplY3QgY29udGFpbmluZyBkYXRhc2V0IGF0dHJpYnV0ZXMgdG8gYXNzaWduIHRvIHRoZSBlbGVtZW50LlxuICAgICAqIEByZXR1cm5zIHtIVE1MU3BhbkVsZW1lbnR9IFRoZSBjcmVhdGVkIEhUTUwgZWxlbWVudC5cbiAgICAgKi9cbiAgICBzdGF0aWMgc3Bhbihwcm9wZXJ0aWVzID0ge30sIGRhdGFzZXQgPSB7fSkge1xuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGUoXCJzcGFuXCIsIHByb3BlcnRpZXMsIGRhdGFzZXQpO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRWxlbWVudEhlbHBlciB9OyIsIi8qKlxuICogQ2xhc3MgdGhhdCBhbGxvd3MgdGhlIHN1YnNjcmlwdGlvbiBhbmQgcHVibGljYXRpb24gb2YgZ3JpZCByZWxhdGVkIGV2ZW50cy5cbiAqIEBjbGFzc1xuICovXG5jbGFzcyBHcmlkRXZlbnRzIHtcbiAgICAjZXZlbnRzO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuI2V2ZW50cyA9IHt9O1xuICAgIH1cblxuICAgICNndWFyZChldmVudE5hbWUpIHtcbiAgICAgICAgaWYgKCF0aGlzLiNldmVudHMpIHJldHVybiBmYWxzZTtcblxuICAgICAgICByZXR1cm4gKHRoaXMuI2V2ZW50c1tldmVudE5hbWVdKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBhbiBldmVudCB0byBwdWJsaXNoZXIgY29sbGVjdGlvbi5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIEV2ZW50IG5hbWUuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlciBDYWxsYmFjayBmdW5jdGlvbi5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc0FzeW5jPWZhbHNlXSBUcnVlIGlmIGNhbGxiYWNrIHNob3VsZCBleGVjdXRlIHdpdGggYXdhaXQgb3BlcmF0aW9uLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbcHJpb3JpdHk9MF0gT3JkZXIgaW4gd2hpY2ggZXZlbnQgc2hvdWxkIGJlIGV4ZWN1dGVkLlxuICAgICAqL1xuICAgIHN1YnNjcmliZShldmVudE5hbWUsIGhhbmRsZXIsIGlzQXN5bmMgPSBmYWxzZSwgcHJpb3JpdHkgPSAwKSB7XG4gICAgICAgIGlmICghdGhpcy4jZXZlbnRzW2V2ZW50TmFtZV0pIHtcbiAgICAgICAgICAgIHRoaXMuI2V2ZW50c1tldmVudE5hbWVdID0gW3sgaGFuZGxlciwgcHJpb3JpdHksIGlzQXN5bmMgfV07XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuI2V2ZW50c1tldmVudE5hbWVdLnB1c2goeyBoYW5kbGVyLCBwcmlvcml0eSwgaXNBc3luYyB9KTtcbiAgICAgICAgdGhpcy4jZXZlbnRzW2V2ZW50TmFtZV0uc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGEucHJpb3JpdHkgLSBiLnByaW9yaXR5O1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyB0aGUgdGFyZ2V0IGV2ZW50IGZyb20gdGhlIHB1YmxpY2F0aW9uIGNoYWluLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUgRXZlbnQgbmFtZS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyIEV2ZW50IGhhbmRsZXIuXG4gICAgICovXG4gICAgdW5zdWJzY3JpYmUoZXZlbnROYW1lLCBoYW5kbGVyKSB7XG4gICAgICAgIGlmICghdGhpcy4jZ3VhcmQoZXZlbnROYW1lKSkgcmV0dXJuO1xuXG4gICAgICAgIHRoaXMuI2V2ZW50c1tldmVudE5hbWVdID0gdGhpcy4jZXZlbnRzW2V2ZW50TmFtZV0uZmlsdGVyKGggPT4gaC5oYW5kbGVyICE9PSBoYW5kbGVyKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogVGFrZXMgdGhlIHJlc3VsdCBvZiBlYWNoIHN1YnNjcmliZXIncyBjYWxsYmFjayBmdW5jdGlvbiBhbmQgY2hhaW5zIHRoZW0gaW50byBvbmUgcmVzdWx0LlxuICAgICAqIFVzZWQgdG8gY3JlYXRlIGEgbGlzdCBvZiBwYXJhbWV0ZXJzIGZyb20gbXVsdGlwbGUgbW9kdWxlczogaS5lLiBzb3J0LCBmaWx0ZXIsIGFuZCBwYWdpbmcgaW5wdXRzLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUgZXZlbnQgbmFtZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbaW5pdGlhbFZhbHVlPXt9XSBpbml0aWFsIHZhbHVlXG4gICAgICogQHJldHVybnMge09iamVjdH1cbiAgICAgKi9cbiAgICBjaGFpbihldmVudE5hbWUsIGluaXRpYWxWYWx1ZSA9IHt9KSB7XG4gICAgICAgIGlmICghdGhpcy4jZ3VhcmQoZXZlbnROYW1lKSkgcmV0dXJuO1xuXG4gICAgICAgIGxldCByZXN1bHQgPSBpbml0aWFsVmFsdWU7XG5cbiAgICAgICAgdGhpcy4jZXZlbnRzW2V2ZW50TmFtZV0uZm9yRWFjaCgoaCkgPT4ge1xuICAgICAgICAgICAgcmVzdWx0ID0gaC5oYW5kbGVyKHJlc3VsdCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFRyaWdnZXIgY2FsbGJhY2sgZnVuY3Rpb24gZm9yIHN1YnNjcmliZXJzIG9mIHRoZSBgZXZlbnROYW1lYC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIEV2ZW50IG5hbWUuXG4gICAgICogQHBhcmFtICB7Li4uYW55fSBhcmdzIEFyZ3VtZW50cy5cbiAgICAgKi9cbiAgICBhc3luYyB0cmlnZ2VyKGV2ZW50TmFtZSwgLi4uYXJncykge1xuICAgICAgICBpZiAoIXRoaXMuI2d1YXJkKGV2ZW50TmFtZSkpIHJldHVybjtcblxuICAgICAgICBmb3IgKGxldCBoIG9mIHRoaXMuI2V2ZW50c1tldmVudE5hbWVdKSB7XG4gICAgICAgICAgICBpZiAoaC5pc0FzeW5jKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgaC5oYW5kbGVyKC4uLmFyZ3MpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBoLmhhbmRsZXIoLi4uYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCB7IEdyaWRFdmVudHMgfTsiLCJpbXBvcnQgeyBDZWxsIH0gZnJvbSBcIi4uL2NlbGwvY2VsbC5qc1wiO1xuLyoqXG4gKiBDbGFzcyB0byBtYW5hZ2UgdGhlIHRhYmxlIGVsZW1lbnQgYW5kIGl0cyByb3dzIGFuZCBjZWxscy5cbiAqL1xuY2xhc3MgVGFibGUge1xuICAgICNyb3dDb3VudDtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYFRhYmxlYCBjbGFzcyB0byBtYW5hZ2UgdGhlIHRhYmxlIGVsZW1lbnQgYW5kIGl0cyByb3dzIGFuZCBjZWxscy5cbiAgICAgKiBAcGFyYW0ge0dyaWRDb250ZXh0fSBjb250ZXh0IEdyaWQgY29udGV4dC5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMudGFibGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGFibGVcIik7XG4gICAgICAgIHRoaXMudGhlYWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGhlYWRcIik7XG4gICAgICAgIHRoaXMudGJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGJvZHlcIik7XG4gICAgICAgIHRoaXMuI3Jvd0NvdW50ID0gMDtcblxuICAgICAgICB0aGlzLnRhYmxlLmlkID0gYCR7Y29udGV4dC5zZXR0aW5ncy5iYXNlSWROYW1lfV90YWJsZWA7XG4gICAgICAgIHRoaXMudGFibGUuYXBwZW5kKHRoaXMudGhlYWQsIHRoaXMudGJvZHkpO1xuICAgICAgICB0aGlzLnRhYmxlLmNsYXNzTmFtZSA9IGNvbnRleHQuc2V0dGluZ3MudGFibGVDc3M7XG5cbiAgICAgICAgaWYgKGNvbnRleHQuc2V0dGluZ3MudGFibGVTdHlsZVNldHRpbmdzICYmIHR5cGVvZiBjb250ZXh0LnNldHRpbmdzLnRhYmxlU3R5bGVTZXR0aW5ncyA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgLy8gQXBwbHkgY3VzdG9tIHN0eWxlIHNldHRpbmdzIHRvIHRhYmxlIGVsZW1lbnQuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhjb250ZXh0LnNldHRpbmdzLnRhYmxlU3R5bGVTZXR0aW5ncykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRhYmxlLnN0eWxlW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyB0aGUgdGFibGUgaGVhZGVyIHJvdyBlbGVtZW50IGJ5IGNyZWF0aW5nIGEgcm93IGFuZCBhcHBlbmRpbmcgZWFjaCBjb2x1bW4ncyBoZWFkZXIgY2VsbC5cbiAgICAgKi9cbiAgICBpbml0aWFsaXplSGVhZGVyKCkge1xuICAgICAgICBjb25zdCB0ciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0clwiKTtcblxuICAgICAgICBmb3IgKGNvbnN0IGNvbHVtbiBvZiB0aGlzLmNvbnRleHQuY29sdW1uTWFuYWdlci5jb2x1bW5zKSB7XG4gICAgICAgICAgICB0ci5hcHBlbmRDaGlsZChjb2x1bW4uaGVhZGVyQ2VsbC5lbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudGhlYWQuYXBwZW5kQ2hpbGQodHIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZW5kZXIgdGFibGUgYm9keSByb3dzLiAgV2lsbCByZW1vdmUgYW55IHByaW9yIHRhYmxlIGJvZHkgcmVzdWx0cyBhbmQgYnVpbGQgbmV3IHJvd3MgYW5kIGNlbGxzLlxuICAgICAqIEBwYXJhbSB7QXJyYXk8T2JqZWN0Pn0gZGF0YXNldCBEYXRhIHNldCB0byBidWlsZCB0YWJsZSByb3dzLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyIHwgbnVsbH0gW3Jvd0NvdW50PW51bGxdIFNldCB0aGUgcm93IGNvdW50IHBhcmFtZXRlciB0byBhIHNwZWNpZmljIHZhbHVlIGlmIFxuICAgICAqIHJlbW90ZSBwcm9jZXNzaW5nIGlzIGJlaW5nIHVzZWQsIG90aGVyd2lzZSB3aWxsIHVzZSB0aGUgbGVuZ3RoIG9mIHRoZSBkYXRhc2V0LlxuICAgICAqL1xuICAgIHJlbmRlclJvd3MoZGF0YXNldCwgcm93Q291bnQgPSBudWxsKSB7XG4gICAgICAgIC8vQ2xlYXIgYm9keSBvZiBwcmV2aW91cyBkYXRhLlxuICAgICAgICB0aGlzLnRib2R5LnJlcGxhY2VDaGlsZHJlbigpO1xuICAgICAgICBcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGRhdGFzZXQpKSB7XG4gICAgICAgICAgICB0aGlzLiNyb3dDb3VudCA9IDA7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiNyb3dDb3VudCA9IHJvd0NvdW50ID8/IGRhdGFzZXQubGVuZ3RoO1xuXG4gICAgICAgIGZvciAoY29uc3QgZGF0YSBvZiBkYXRhc2V0KSB7XG4gICAgICAgICAgICBjb25zdCB0ciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0clwiKTtcblxuICAgICAgICAgICAgZm9yIChsZXQgY29sdW1uIG9mIHRoaXMuY29udGV4dC5jb2x1bW5NYW5hZ2VyLmNvbHVtbnMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjZWxsID0gbmV3IENlbGwoZGF0YSwgY29sdW1uLCB0aGlzLmNvbnRleHQubW9kdWxlcywgdHIpO1xuXG4gICAgICAgICAgICAgICAgdHIuYXBwZW5kQ2hpbGQoY2VsbC5lbGVtZW50KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy50Ym9keS5hcHBlbmRDaGlsZCh0cik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXQgcm93Q291bnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLiNyb3dDb3VudDtcbiAgICB9XG59XG5cbmV4cG9ydCB7IFRhYmxlIH07IiwiaW1wb3J0IHsgQ29sdW1uTWFuYWdlciB9IGZyb20gXCIuLi9jb2x1bW4vY29sdW1uTWFuYWdlci5qc1wiO1xuaW1wb3J0IHsgRGF0YVBpcGVsaW5lIH0gZnJvbSBcIi4uL2RhdGEvZGF0YVBpcGVsaW5lLmpzXCI7XG5pbXBvcnQgeyBEYXRhTG9hZGVyIH0gZnJvbSBcIi4uL2RhdGEvZGF0YUxvYWRlci5qc1wiO1xuaW1wb3J0IHsgRGF0YVBlcnNpc3RlbmNlIH0gZnJvbSBcIi4uL2RhdGEvZGF0YVBlcnNpc3RlbmNlLmpzXCI7XG5pbXBvcnQgeyBHcmlkRXZlbnRzIH0gZnJvbSBcIi4uL2V2ZW50cy9ncmlkRXZlbnRzLmpzXCI7XG5pbXBvcnQgeyBUYWJsZSB9IGZyb20gXCIuLi90YWJsZS90YWJsZS5qc1wiO1xuLyoqXG4gKiBQcm92aWRlcyB0aGUgY29udGV4dCBmb3IgdGhlIGdyaWQsIGluY2x1ZGluZyBzZXR0aW5ncywgZGF0YSwgYW5kIG1vZHVsZXMuICBUaGlzIGNsYXNzIGlzIHJlc3BvbnNpYmxlIGZvciBtYW5hZ2luZyBcbiAqIHRoZSBncmlkJ3MgY29yZSBzdGF0ZSBhbmQgYmVoYXZpb3IuXG4gKi9cbmNsYXNzIEdyaWRDb250ZXh0IHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgZ3JpZCBjb250ZXh0LCB3aGljaCByZXByZXNlbnRzIHRoZSBjb3JlIGxvZ2ljIGFuZCBmdW5jdGlvbmFsaXR5IG9mIHRoZSBkYXRhIGdyaWQuXG4gICAgICogQHBhcmFtIHtBcnJheTxvYmplY3Q+fSBjb2x1bW5zIENvbHVtbiBkZWZpbml0aW9uLlxuICAgICAqIEBwYXJhbSB7U2V0dGluZ3NHcmlkfSBzZXR0aW5ncyBHcmlkIHNldHRpbmdzLlxuICAgICAqIEBwYXJhbSB7YW55W119IFtkYXRhPVtdXSBHcmlkIGRhdGEuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29sdW1ucywgc2V0dGluZ3MsIGRhdGEgPSBbXSkge1xuICAgICAgICB0aGlzLnNldHRpbmdzID0gc2V0dGluZ3M7XG4gICAgICAgIHRoaXMuZXZlbnRzID0gbmV3IEdyaWRFdmVudHMoKTtcbiAgICAgICAgdGhpcy5waXBlbGluZSA9IG5ldyBEYXRhUGlwZWxpbmUodGhpcy5zZXR0aW5ncyk7XG4gICAgICAgIHRoaXMuZGF0YWxvYWRlciA9IG5ldyBEYXRhTG9hZGVyKHRoaXMuc2V0dGluZ3MpO1xuICAgICAgICB0aGlzLnBlcnNpc3RlbmNlID0gbmV3IERhdGFQZXJzaXN0ZW5jZShkYXRhKTtcbiAgICAgICAgdGhpcy5jb2x1bW5NYW5hZ2VyID0gbmV3IENvbHVtbk1hbmFnZXIoY29sdW1ucywgdGhpcy5zZXR0aW5ncyk7XG4gICAgICAgIHRoaXMuZ3JpZCA9IG5ldyBUYWJsZSh0aGlzKTtcbiAgICAgICAgdGhpcy5tb2R1bGVzID0ge307XG4gICAgfVxufVxuXG5leHBvcnQgeyBHcmlkQ29udGV4dCB9OyIsIi8qKlxuICogUHJvdmlkZXMgbG9naWMgdG8gY29udmVydCBncmlkIGRhdGEgaW50byBhIGRvd25sb2FkYWJsZSBDU1YgZmlsZS5cbiAqIE1vZHVsZSB3aWxsIHByb3ZpZGUgbGltaXRlZCBmb3JtYXR0aW5nIG9mIGRhdGEuICBPbmx5IGNvbHVtbnMgd2l0aCBhIGZvcm1hdHRlciB0eXBlIFxuICogb2YgYG1vZHVsZWAgb3IgYGZ1bmN0aW9uYCB3aWxsIGJlIHByb2Nlc3NlZC4gIEFsbCBvdGhlciBjb2x1bW5zIHdpbGwgYmUgcmV0dXJuZWQgYXNcbiAqIHRoZWlyIHJhdyBkYXRhIHR5cGUuICBJZiBhIGNvbHVtbidzIHZhbHVlIGNvbnRhaW5zIGEgY29tbWEsIHRoZSB2YWx1ZSB3aWxsIGJlIGRvdWJsZSBxdW90ZWQuXG4gKi9cbmNsYXNzIENzdk1vZHVsZSB7XG4gICAgLyoqXG4gICAgICogQWxsb3dzIGdyaWQncyBkYXRhIHRvIGJlIGNvbnZlcnRlZCBpbnRvIGEgZG93bmxvYWRhYmxlIENTViBmaWxlLiAgSWYgZ3JpZCBpcyBcbiAgICAgKiBzZXQgdG8gYSBsb2NhbCBkYXRhIHNvdXJjZSwgdGhlIGRhdGEgY2FjaGUgaW4gdGhlIHBlcnNpc3RlbmNlIGNsYXNzIGlzIHVzZWQuXG4gICAgICogT3RoZXJ3aXNlLCBjbGFzcyB3aWxsIG1ha2UgYW4gQWpheCBjYWxsIHRvIHJlbW90ZSB0YXJnZXQgc2V0IGluIGRhdGEgbG9hZGVyXG4gICAgICogY2xhc3MuXG4gICAgICogQHBhcmFtIHtHcmlkQ29udGV4dH0gY29udGV4dCBHcmlkIGNvbnRleHQgY2xhc3MuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29udGV4dCkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLmRlbGltaXRlciA9IFwiLFwiO1xuICAgICAgICB0aGlzLmJ1dHRvbiA9IGNvbnRleHQuc2V0dGluZ3MuY3N2RXhwb3J0SWQ7XG4gICAgICAgIHRoaXMuZGF0YVVybCA9IGNvbnRleHQuc2V0dGluZ3MuY3N2RXhwb3J0UmVtb3RlU291cmNlO1xuICAgIH1cblxuICAgIGluaXRpYWxpemUoKSB7XG4gICAgICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRoaXMuYnV0dG9uKTtcbiAgICAgICAgXG4gICAgICAgIGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5oYW5kbGVEb3dubG9hZCk7XG4gICAgfVxuXG4gICAgaGFuZGxlRG93bmxvYWQgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGxldCBjc3ZEYXRhID0gW107XG4gICAgICAgIGNvbnN0IGZpbGVOYW1lID0gYCR7ZG9jdW1lbnQudGl0bGV9LmNzdmA7XG5cbiAgICAgICAgaWYgKHRoaXMuZGF0YVVybCkge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuY29udGV4dC5kYXRhbG9hZGVyLnJlcXVlc3REYXRhKHRoaXMuZGF0YVVybCk7XG5cbiAgICAgICAgICAgIGNzdkRhdGEgPSB0aGlzLmJ1aWxkRmlsZUNvbnRlbnQoZGF0YSkuam9pbihcIlxcclxcblwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNzdkRhdGEgPSB0aGlzLmJ1aWxkRmlsZUNvbnRlbnQodGhpcy5jb250ZXh0LnBlcnNpc3RlbmNlLmRhdGFDYWNoZSkuam9pbihcIlxcclxcblwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGJsb2IgPSBuZXcgQmxvYihbY3N2RGF0YV0sIHsgdHlwZTogXCJ0ZXh0L2NzdjtjaGFyc2V0PXV0Zi04O1wiIH0pO1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XG5cbiAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIHdpbmRvdy5VUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpKTtcbiAgICAgICAgLy9zZXQgZmlsZSB0aXRsZVxuICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShcImRvd25sb2FkXCIsIGZpbGVOYW1lKTtcbiAgICAgICAgLy90cmlnZ2VyIGRvd25sb2FkXG4gICAgICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuICAgICAgICBlbGVtZW50LmNsaWNrKCk7XG4gICAgICAgIC8vcmVtb3ZlIHRlbXBvcmFyeSBsaW5rIGVsZW1lbnRcbiAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChlbGVtZW50KTtcblxuICAgICAgICB3aW5kb3cuYWxlcnQoYERvd25sb2FkZWQgJHtmaWxlTmFtZX1gKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJldHVybnMgYW4gb2JqZWN0IHRoYXQgcmVwcmVzZW50cyB0aGUgY29sdW1ucyBhbmQgaGVhZGVyIG5hbWVzIHRoYXQgc2hvdWxkIGJlIHVzZWRcbiAgICAgKiB0byBjcmVhdGUgdGhlIENTViByZXN1bHRzLiAgV2lsbCBleGNsdWRlIGNvbHVtbnMgd2l0aCBhIHR5cGUgb2YgYGljb25gLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb2x1bW5NZ3JDb2x1bW5zIENvbHVtbiBNYW5hZ2VyIENvbHVtbnMgY29sbGVjdGlvbi5cbiAgICAgKiBAcmV0dXJucyB7eyBoZWFkZXJzOiBBcnJheTxzdHJpbmc+LCBjb2x1bW5zOiBBcnJheTxDb2x1bW4+IH19XG4gICAgICovXG4gICAgaWRlbnRpZnlDb2x1bW5zKGNvbHVtbk1nckNvbHVtbnMpIHtcbiAgICAgICAgY29uc3QgaGVhZGVycyA9IFtdO1xuICAgICAgICBjb25zdCBjb2x1bW5zID0gW107XG5cbiAgICAgICAgZm9yIChjb25zdCBjb2x1bW4gb2YgY29sdW1uTWdyQ29sdW1ucykge1xuICAgICAgICAgICAgaWYgKGNvbHVtbi50eXBlID09PSBcImljb25cIikgY29udGludWU7XG5cbiAgICAgICAgICAgIGhlYWRlcnMucHVzaChjb2x1bW4ubGFiZWwpO1xuICAgICAgICAgICAgY29sdW1ucy5wdXNoKGNvbHVtbik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4geyBoZWFkZXJzOiBoZWFkZXJzLCBjb2x1bW5zOiBjb2x1bW5zIH07IFxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0cyBncmlkIGRhdGEgaW4gRGF0YVBlcnNpc3RlbmNlIGNsYXNzIGludG8gYSBzaW5nbGUgZGltZW5zaW9uYWwgYXJyYXkgb2ZcbiAgICAgKiBzdHJpbmcgZGVsaW1pdGVkIHZhbHVlcyB0aGF0IHJlcHJlc2VudHMgYSByb3cgb2YgZGF0YSBpbiBhIGNzdiBmaWxlLiBcbiAgICAgKiBAcGFyYW0ge0FycmF5PE9iamVjdD59IGRhdGFzZXQgZGF0YSBzZXQgdG8gYnVpbGQgY3N2IHJvd3MuXG4gICAgICogQHJldHVybnMge0FycmF5PHN0cmluZz59XG4gICAgICovXG4gICAgYnVpbGRGaWxlQ29udGVudChkYXRhc2V0KSB7XG4gICAgICAgIGNvbnN0IGZpbGVDb250ZW50cyA9IFtdO1xuICAgICAgICBjb25zdCBjb2x1bW5zID0gdGhpcy5pZGVudGlmeUNvbHVtbnModGhpcy5jb250ZXh0LmNvbHVtbk1hbmFnZXIuY29sdW1ucyk7XG4gICAgICAgIC8vY3JlYXRlIGRlbGltaXRlZCBoZWFkZXIuXG4gICAgICAgIGZpbGVDb250ZW50cy5wdXNoKGNvbHVtbnMuaGVhZGVycy5qb2luKHRoaXMuZGVsaW1pdGVyKSk7XG4gICAgICAgIC8vY3JlYXRlIHJvdyBkYXRhXG4gICAgICAgIGZvciAoY29uc3Qgcm93RGF0YSBvZiBkYXRhc2V0KSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBjb2x1bW5zLmNvbHVtbnMubWFwKChjKSA9PiB0aGlzLmZvcm1hdFZhbHVlKGMsIHJvd0RhdGEpKTtcblxuICAgICAgICAgICAgZmlsZUNvbnRlbnRzLnB1c2gocmVzdWx0LmpvaW4odGhpcy5kZWxpbWl0ZXIpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmaWxlQ29udGVudHM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBmb3JtYXR0ZWQgc3RyaW5nIGJhc2VkIG9uIHRoZSBDb2x1bW4ncyBmb3JtYXR0ZXIgc2V0dGluZy5cbiAgICAgKiBXaWxsIGRvdWJsZSBxdW90ZSBzdHJpbmcgaWYgY29tbWEgY2hhcmFjdGVyIGlzIGZvdW5kIGluIHZhbHVlLlxuICAgICAqIEBwYXJhbSB7Q29sdW1ufSBjb2x1bW4gY29sdW1uIG1vZGVsLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSByb3dEYXRhIHJvdyBkYXRhLlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgZm9ybWF0VmFsdWUoY29sdW1uLCByb3dEYXRhKSB7XG4gICAgICAgIGxldCB2YWx1ZSA9IFN0cmluZyhyb3dEYXRhW2NvbHVtbi5maWVsZF0pO1xuICAgICAgICAvL2FwcGx5IGxpbWl0ZWQgZm9ybWF0dGluZzsgY3N2IHJlc3VsdHMgc2hvdWxkIGJlICdyYXcnIGRhdGEuXG4gICAgICAgIGlmIChjb2x1bW4uZm9ybWF0dGVyKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNvbHVtbi5mb3JtYXR0ZXIgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gU3RyaW5nKGNvbHVtbi5mb3JtYXR0ZXIocm93RGF0YSwgY29sdW1uLmZvcm1hdHRlclBhcmFtcykpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjb2x1bW4uZm9ybWF0dGVyID09PSBcIm1vZHVsZVwiKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBTdHJpbmcodGhpcy5jb250ZXh0Lm1vZHVsZXNbY29sdW1uLmZvcm1hdHRlck1vZHVsZU5hbWVdLmFwcGx5Q3N2KHJvd0RhdGEsIGNvbHVtbikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vY2hlY2sgZm9yIHN0cmluZ3MgdGhhdCBtYXkgbmVlZCB0byBiZSBxdW90ZWQuXG4gICAgICAgIGlmICh2YWx1ZS5pbmNsdWRlcyhcIixcIikpIHtcbiAgICAgICAgICAgIHZhbHVlID0gYFwiJHt2YWx1ZX1cImA7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxufVxuXG5Dc3ZNb2R1bGUubW9kdWxlTmFtZSA9IFwiY3N2XCI7XG5cbmV4cG9ydCB7IENzdk1vZHVsZSB9OyIsImltcG9ydCB7IENzc0hlbHBlciB9IGZyb20gXCIuLi8uLi8uLi9oZWxwZXJzL2Nzc0hlbHBlci5qc1wiO1xuaW1wb3J0IHsgRWxlbWVudEhlbHBlciB9IGZyb20gXCIuLi8uLi8uLi9oZWxwZXJzL2VsZW1lbnRIZWxwZXIuanNcIjtcbi8qKlxuICogQ3JlYXRlIGZpbHRlciBvYmplY3QgdGhhdCByZXByZXNlbnRzIGEgZWxlbWVudCB0byBmaWx0ZXIgYmV0d2VlbiB0d28gdmFsdWVzLiAgQ3JlYXRlcyBhIGRyb3Bkb3duIHdpdGggYSB0d28gaW5wdXQgYm94ZXMgXG4gKiB0byBlbnRlciBzdGFydCBhbmQgZW5kIHZhbHVlcy5cbiAqL1xuY2xhc3MgRWxlbWVudEJldHdlZW4ge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBmaWx0ZXIgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyBhIGJldHdlZW4gZWxlbWVudC5cbiAgICAgKiBAcGFyYW0ge0NvbHVtbn0gY29sdW1uIENvbHVtbiBjbGFzcyBvYmplY3QuXG4gICAgICogQHBhcmFtIHtHcmlkQ29udGV4dH0gY29udGV4dCBHcmlkIGNvbnRleHQgb2JqZWN0LlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbHVtbiwgY29udGV4dCkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBFbGVtZW50SGVscGVyLmRpdih7IG5hbWU6IGNvbHVtbi5maWVsZCwgY2xhc3NOYW1lOiBDc3NIZWxwZXIubXVsdGlTZWxlY3QucGFyZW50Q2xhc3MgfSk7XG4gICAgICAgIHRoaXMuaGVhZGVyID0gRWxlbWVudEhlbHBlci5kaXYoeyBjbGFzc05hbWU6IENzc0hlbHBlci5tdWx0aVNlbGVjdC5oZWFkZXIgfSk7XG4gICAgICAgIHRoaXMub3B0aW9uc0NvbnRhaW5lciA9IEVsZW1lbnRIZWxwZXIuZGl2KHsgY2xhc3NOYW1lOiBDc3NIZWxwZXIubXVsdGlTZWxlY3Qub3B0aW9ucyB9KTtcbiAgICAgICAgdGhpcy5maWVsZCA9IGNvbHVtbi5maWVsZDtcbiAgICAgICAgdGhpcy5maWVsZFR5cGUgPSBjb2x1bW4udHlwZTsgIC8vZmllbGQgdmFsdWUgdHlwZS5cbiAgICAgICAgdGhpcy5maWx0ZXJUeXBlID0gXCJiZXR3ZWVuXCI7ICAvL2NvbmRpdGlvbiB0eXBlLlxuXG4gICAgICAgIHRoaXMuZWxlbWVudC5pZCA9IGAke3RoaXMuY29udGV4dC5zZXR0aW5ncy5iYXNlSWROYW1lfV8ke3RoaXMuZmllbGR9YDtcbiAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZCh0aGlzLmhlYWRlciwgdGhpcy5vcHRpb25zQ29udGFpbmVyKTtcbiAgICAgICAgdGhpcy5oZWFkZXIuaWQgPSBgaGVhZGVyXyR7dGhpcy5jb250ZXh0LnNldHRpbmdzLmJhc2VJZE5hbWV9XyR7dGhpcy5maWVsZH1gO1xuICAgICAgICB0aGlzLm9wdGlvbnNDb250YWluZXIuc3R5bGUubWluV2lkdGggPSBcIjE4NXB4XCI7XG5cbiAgICAgICAgdGhpcy4jdGVtcGxhdGVCZXR3ZWVuKCk7XG4gICAgICAgIHRoaXMuaGVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZUNsaWNrKTtcbiAgICB9XG5cbiAgICAjdGVtcGxhdGVCZXR3ZWVuKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnRTdGFydCA9IEVsZW1lbnRIZWxwZXIuaW5wdXQoeyBjbGFzc05hbWU6IENzc0hlbHBlci5pbnB1dCwgaWQ6IGBzdGFydF8ke3RoaXMuY29udGV4dC5zZXR0aW5ncy5iYXNlSWROYW1lfV8ke3RoaXMuZmllbGR9YCB9KTtcblxuICAgICAgICB0aGlzLmVsZW1lbnRFbmQgPSBFbGVtZW50SGVscGVyLmlucHV0KHsgY2xhc3NOYW1lOiBDc3NIZWxwZXIuaW5wdXQsIGlkOiBgZW5kXyR7dGhpcy5jb250ZXh0LnNldHRpbmdzLmJhc2VJZE5hbWV9XyR7dGhpcy5maWVsZH1gIH0pO1xuICAgICAgICB0aGlzLmVsZW1lbnRFbmQuc3R5bGUubWFyZ2luQm90dG9tID0gXCIxMHB4XCI7XG5cbiAgICAgICAgY29uc3Qgc3RhcnQgPSBFbGVtZW50SGVscGVyLnNwYW4oeyBpbm5lclRleHQ6IFwiU3RhcnRcIiwgY2xhc3NOYW1lOiBDc3NIZWxwZXIuYmV0d2Vlbi5sYWJlbCB9KTtcbiAgICAgICAgY29uc3QgZW5kID0gIEVsZW1lbnRIZWxwZXIuc3Bhbih7IGlubmVyVGV4dDogXCJFbmRcIiwgY2xhc3NOYW1lOiBDc3NIZWxwZXIuYmV0d2Vlbi5sYWJlbCB9KTtcbiBcbiAgICAgICAgY29uc3QgYnRuQXBwbHkgPSBFbGVtZW50SGVscGVyLmNyZWF0ZShcImJ1dHRvblwiLCB7IGlubmVyVGV4dDogXCJBcHBseVwiLCBjbGFzc05hbWU6IENzc0hlbHBlci5iZXR3ZWVuLmJ1dHRvbiB9KTtcbiAgICAgICAgYnRuQXBwbHkuc3R5bGUubWFyZ2luUmlnaHQgPSBcIjEwcHhcIjtcbiAgICAgICAgYnRuQXBwbHkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlQ2xpY2spO1xuXG4gICAgICAgIGNvbnN0IGJ0bkNsZWFyID0gRWxlbWVudEhlbHBlci5jcmVhdGUoXCJidXR0b25cIiwgeyBpbm5lclRleHQ6IFwiQ2xlYXJcIiwgY2xhc3NOYW1lOiBDc3NIZWxwZXIuYmV0d2Vlbi5idXR0b24gfSk7XG4gICAgICAgIGJ0bkNsZWFyLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZUJ1dHRvbkNsZWFyKTtcblxuICAgICAgICB0aGlzLm9wdGlvbnNDb250YWluZXIuYXBwZW5kKHN0YXJ0LCB0aGlzLmVsZW1lbnRTdGFydCwgZW5kLCB0aGlzLmVsZW1lbnRFbmQsIGJ0bkFwcGx5LCBidG5DbGVhcik7XG4gICAgfVxuXG4gICAgaGFuZGxlQnV0dG9uQ2xlYXIgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuZWxlbWVudFN0YXJ0LnZhbHVlID0gXCJcIjtcbiAgICAgICAgdGhpcy5lbGVtZW50RW5kLnZhbHVlID0gXCJcIjtcblxuICAgICAgICBpZiAodGhpcy5jb3VudExhYmVsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuY291bnRMYWJlbC5yZW1vdmUoKTtcbiAgICAgICAgICAgIHRoaXMuY291bnRMYWJlbCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBjcmVhdGVDb3VudExhYmVsID0gKCkgPT4ge1xuICAgICAgICAvL3VwZGF0ZSBjb3VudCBsYWJlbC5cbiAgICAgICAgaWYgKHRoaXMuY291bnRMYWJlbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgICAgIHRoaXMuY291bnRMYWJlbC5jbGFzc05hbWUgPSBDc3NIZWxwZXIubXVsdGlTZWxlY3QuaGVhZGVyT3B0aW9uO1xuICAgICAgICAgICAgdGhpcy5oZWFkZXIuYXBwZW5kKHRoaXMuY291bnRMYWJlbCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5lbGVtZW50U3RhcnQudmFsdWUgIT09IFwiXCIgJiYgdGhpcy5lbGVtZW50RW5kLnZhbHVlICE9PSBcIlwiKSB7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwuaW5uZXJUZXh0ID0gYCR7dGhpcy5lbGVtZW50U3RhcnQudmFsdWV9IHRvICR7dGhpcy5lbGVtZW50RW5kLnZhbHVlfWA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwucmVtb3ZlKCk7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgaGFuZGxlQ2xpY2sgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHN0YXR1cyA9IHRoaXMuaGVhZGVyLmNsYXNzTGlzdC50b2dnbGUoQ3NzSGVscGVyLm11bHRpU2VsZWN0LmhlYWRlckFjdGl2ZSk7XG5cbiAgICAgICAgaWYgKCFzdGF0dXMpIHtcbiAgICAgICAgICAgIC8vQ2xvc2Ugd2luZG93IGFuZCBhcHBseSBmaWx0ZXIgdmFsdWUuXG4gICAgICAgICAgICB0aGlzLmNyZWF0ZUNvdW50TGFiZWwoKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKTtcbiAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZURvY3VtZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZURvY3VtZW50KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogSGFuZGxlciBldmVudCB0byBjbG9zZSBkcm9wZG93biB3aGVuIHVzZXIgY2xpY2tzIG91dHNpZGUgdGhlIG11bHRpLXNlbGVjdCBjb250cm9sLiAgRXZlbnQgaXMgcmVtb3ZlZCB3aGVuIG11bHRpLXNlbGVjdCBpcyBcbiAgICAgKiBub3QgYWN0aXZlIHNvIHRoYXQgaXQncyBub3QgZmlyaW5nIG9uIHJlZHVuZGFudCBldmVudHMuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGUgT2JqZWN0IHRoYXQgdHJpZ2dlcmVkIGV2ZW50LlxuICAgICAqL1xuICAgIGhhbmRsZURvY3VtZW50ID0gYXN5bmMgKGUpID0+IHtcbiAgICAgICAgaWYgKCFlLnRhcmdldC5jbG9zZXN0KGAuJHtDc3NIZWxwZXIuaW5wdXR9YCkgJiYgIWUudGFyZ2V0LmNsb3Nlc3QoYCMke3RoaXMuaGVhZGVyLmlkfWApKSB7XG4gICAgICAgICAgICB0aGlzLmhlYWRlci5jbGFzc0xpc3QucmVtb3ZlKENzc0hlbHBlci5tdWx0aVNlbGVjdC5oZWFkZXJBY3RpdmUpO1xuXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIik7XG5cbiAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZURvY3VtZW50KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhbiBhcnJheSBvZiB0aGUgc3RhcnQgYW5kIGVuZCB2YWx1ZXMgZnJvbSBpbnB1dCBzb3VyY2UuICBJZiBlaXRoZXIgaW5wdXQgc291cmNlIGlzIGVtcHR5LCBhbiBlbXB0eSBzdHJpbmcgd2lsbCBiZSByZXR1cm5lZC5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXkgfCBzdHJpbmd9IEFycmF5IG9mIHN0YXJ0IGFuZCBlbmQgdmFsdWVzIG9yIGVtcHR5IHN0cmluZy5cbiAgICAgKi9cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIGlmICh0aGlzLmVsZW1lbnRTdGFydC52YWx1ZSA9PT0gXCJcIiB8fCB0aGlzLmVsZW1lbnRFbmQudmFsdWUgPT09IFwiXCIpIHJldHVybiBcIlwiO1xuXG4gICAgICAgIHJldHVybiBbdGhpcy5lbGVtZW50U3RhcnQudmFsdWUsIHRoaXMuZWxlbWVudEVuZC52YWx1ZV07XG4gICAgfVxufVxuXG5leHBvcnQgeyBFbGVtZW50QmV0d2VlbiB9OyIsIi8qKlxuICogUmVwcmVzZW50cyBhIGNvbHVtbnMgZmlsdGVyIGNvbnRyb2wuICBDcmVhdGVzIGEgYEhUTUxJbnB1dEVsZW1lbnRgIHRoYXQgaXMgYWRkZWQgdG8gdGhlIGhlYWRlciByb3cgb2YgXG4gKiB0aGUgZ3JpZCB0byBmaWx0ZXIgZGF0YSBzcGVjaWZpYyB0byBpdHMgZGVmaW5lZCBjb2x1bW4uIFxuICovXG5jbGFzcyBFbGVtZW50SW5wdXQge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBmaWx0ZXIgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyBhIGBIVE1MU2VsZWN0RWxlbWVudGAgZWxlbWVudCBpbiB0aGUgdGFibGUncyBoZWFkZXIgcm93LlxuICAgICAqIEBwYXJhbSB7Q29sdW1ufSBjb2x1bW4gQ29sdW1uIGNsYXNzIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge0dyaWRDb250ZXh0fSBjb250ZXh0IEdyaWQgY29udGV4dC5cbiAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbHVtbiwgY29udGV4dCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIik7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMuZmllbGQgPSBjb2x1bW4uZmllbGQ7XG4gICAgICAgIHRoaXMuZmllbGRUeXBlID0gY29sdW1uLnR5cGU7ICAvL2ZpZWxkIHZhbHVlIHR5cGUuXG4gICAgICAgIHRoaXMuZmlsdGVyVHlwZSA9IGNvbHVtbi5maWx0ZXJUeXBlOyAgLy9jb25kaXRpb24gdHlwZS5cbiAgICAgICAgdGhpcy5maWx0ZXJJc0Z1bmN0aW9uID0gKHR5cGVvZiBjb2x1bW4/LmZpbHRlclR5cGUgPT09IFwiZnVuY3Rpb25cIik7XG4gICAgICAgIHRoaXMuZmlsdGVyUGFyYW1zID0gY29sdW1uLmZpbHRlclBhcmFtcztcbiAgICAgICAgdGhpcy5lbGVtZW50Lm5hbWUgPSB0aGlzLmZpZWxkO1xuICAgICAgICB0aGlzLmVsZW1lbnQuaWQgPSB0aGlzLmZpZWxkO1xuICAgICAgICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCBhc3luYyAoKSA9PiBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIikpO1xuXG4gICAgICAgIGlmIChjb2x1bW4uZmlsdGVyQ3NzKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuY2xhc3NOYW1lID0gY29sdW1uLmZpbHRlckNzcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5jb250ZXh0LnNldHRpbmdzLnJlbW90ZVByb2Nlc3NpbmcgJiYgY29sdW1uLmZpbHRlclJlYWxUaW1lKSB7XG4gICAgICAgICAgICB0aGlzLnJlYWxUaW1lVGltZW91dCA9ICh0eXBlb2YgdGhpcy5maWx0ZXJSZWFsVGltZSA9PT0gXCJudW1iZXJcIikgXG4gICAgICAgICAgICAgICAgPyB0aGlzLmZpbHRlclJlYWxUaW1lIFxuICAgICAgICAgICAgICAgIDogNTAwO1xuXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIHRoaXMuaGFuZGxlTGl2ZUZpbHRlcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBoYW5kbGVMaXZlRmlsdGVyID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICBzZXRUaW1lb3V0KGFzeW5jICgpID0+IGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKSwgdGhpcy5yZWFsVGltZVRpbWVvdXQpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgdmFsdWUgb2YgdGhlIGlucHV0IGVsZW1lbnQuICBXaWxsIHJldHVybiBhIHN0cmluZyB2YWx1ZS5cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqL1xuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC52YWx1ZTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEVsZW1lbnRJbnB1dCB9OyIsImltcG9ydCB7IEVsZW1lbnRIZWxwZXIgfSBmcm9tIFwiLi4vLi4vLi4vaGVscGVycy9lbGVtZW50SGVscGVyLmpzXCI7XG4vKipcbiAqIFJlcHJlc2VudHMgYSBjb2x1bW5zIGZpbHRlciBjb250cm9sLiAgQ3JlYXRlcyBhIGBIVE1MU2VsZWN0RWxlbWVudGAgdGhhdCBpcyBhZGRlZCB0byB0aGUgaGVhZGVyIHJvdyBvZiB0aGUgZ3JpZCB0byBmaWx0ZXIgZGF0YSBcbiAqIHNwZWNpZmljIHRvIGl0cyBkZWZpbmVkIGNvbHVtbi4gIElmIGBmaWx0ZXJWYWx1ZXNSZW1vdGVTb3VyY2VgIGlzIGRlZmluZWQsIHRoZSBzZWxlY3Qgb3B0aW9ucyB3aWxsIGJlIHBvcHVsYXRlZCBieSB0aGUgZGF0YSByZXR1cm5lZCBcbiAqIGZyb20gdGhlIHJlbW90ZSBzb3VyY2UgYnkgcmVnaXN0ZXJpbmcgdG8gdGhlIGdyaWQgcGlwZWxpbmUncyBgaW5pdGAgYW5kIGByZWZyZXNoYCBldmVudHMuXG4gKi9cbmNsYXNzIEVsZW1lbnRTZWxlY3Qge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBmaWx0ZXIgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyBhIGBIVE1MU2VsZWN0RWxlbWVudGAgZWxlbWVudCBpbiB0aGUgdGFibGUncyBoZWFkZXIgcm93LlxuICAgICAqIEBwYXJhbSB7Q29sdW1ufSBjb2x1bW4gQ29sdW1uIGNsYXNzIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge0dyaWRDb250ZXh0fSBjb250ZXh0IEdyaWQgY29udGV4dC4gXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29sdW1uLCBjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IEVsZW1lbnRIZWxwZXIuY3JlYXRlKFwic2VsZWN0XCIsIHsgbmFtZTogY29sdW1uLmZpZWxkIH0pO1xuICAgICAgICB0aGlzLmZpZWxkID0gY29sdW1uLmZpZWxkO1xuICAgICAgICB0aGlzLmZpZWxkVHlwZSA9IGNvbHVtbi50eXBlOyAgLy9maWVsZCB2YWx1ZSB0eXBlLlxuICAgICAgICB0aGlzLmZpbHRlclR5cGUgPSBjb2x1bW4uZmlsdGVyVHlwZTsgIC8vY29uZGl0aW9uIHR5cGUuXG4gICAgICAgIHRoaXMuZmlsdGVySXNGdW5jdGlvbiA9ICh0eXBlb2YgY29sdW1uPy5maWx0ZXJUeXBlID09PSBcImZ1bmN0aW9uXCIpO1xuICAgICAgICB0aGlzLmZpbHRlclBhcmFtcyA9IGNvbHVtbi5maWx0ZXJQYXJhbXM7XG4gICAgICAgIHRoaXMucGlwZWxpbmUgPSBjb250ZXh0LnBpcGVsaW5lO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuXG4gICAgICAgIHRoaXMuZWxlbWVudC5pZCA9IGAke2NvbHVtbi5zZXR0aW5ncy5iYXNlSWROYW1lfV8ke3RoaXMuZmllbGR9YDtcbiAgICAgICAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgYXN5bmMgKCkgPT4gYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpKTtcblxuICAgICAgICBpZiAoY29sdW1uLmZpbHRlckNzcykge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTmFtZSA9IGNvbHVtbi5maWx0ZXJDc3M7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29sdW1uLmZpbHRlclZhbHVlc1JlbW90ZVNvdXJjZSkge1xuICAgICAgICAgICAgLy9zZXQgdXAgcGlwZWxpbmUgdG8gcmV0cmlldmUgb3B0aW9uIGRhdGEgd2hlbiBpbml0IHBpcGVsaW5lIGlzIGNhbGxlZC5cbiAgICAgICAgICAgIHRoaXMucGlwZWxpbmUuYWRkU3RlcChcImluaXRcIiwgdGhpcy5jcmVhdGVTZWxlY3RPcHRpb25zLCBjb2x1bW4uZmlsdGVyVmFsdWVzUmVtb3RlU291cmNlKTtcbiAgICAgICAgICAgIHRoaXMucGlwZWxpbmUuYWRkU3RlcChcInJlZnJlc2hcIiwgdGhpcy5yZWZyZXNoU2VsZWN0T3B0aW9ucywgY29sdW1uLmZpbHRlclZhbHVlc1JlbW90ZVNvdXJjZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gXG4gICAgICAgIC8vdXNlIHVzZXIgc3VwcGxpZWQgdmFsdWVzIHRvIGNyZWF0ZSBzZWxlY3Qgb3B0aW9ucy5cbiAgICAgICAgY29uc3Qgb3B0cyA9IEFycmF5LmlzQXJyYXkoY29sdW1uLmZpbHRlclZhbHVlcykgXG4gICAgICAgICAgICA/IGNvbHVtbi5maWx0ZXJWYWx1ZXNcbiAgICAgICAgICAgIDogT2JqZWN0LmVudHJpZXMoY29sdW1uLmZpbHRlclZhbHVlcykubWFwKChba2V5LCB2YWx1ZV0pID0+ICh7IHZhbHVlOiBrZXksIHRleHQ6IHZhbHVlfSkpO1xuXG4gICAgICAgIHRoaXMuY3JlYXRlU2VsZWN0T3B0aW9ucyhvcHRzKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQnVpbGRzIG9wdGlvbiBlbGVtZW50cyBmb3IgY2xhc3MncyBgc2VsZWN0YCBpbnB1dC4gIEV4cGVjdHMgYW4gYXJyYXkgb2Ygb2JqZWN0cyB3aXRoIGtleS92YWx1ZSBwYWlycyBvZjpcbiAgICAgKiAgKiBgdmFsdWVgOiBvcHRpb24gdmFsdWUuICBzaG91bGQgYmUgYSBwcmltYXJ5IGtleSB0eXBlIHZhbHVlIHdpdGggbm8gYmxhbmsgc3BhY2VzLlxuICAgICAqICAqIGB0ZXh0YDogb3B0aW9uIHRleHQgdmFsdWVcbiAgICAgKiBAcGFyYW0ge0FycmF5PG9iamVjdD59IGRhdGEga2V5L3ZhbHVlIGFycmF5IG9mIHZhbHVlcy5cbiAgICAgKi9cbiAgICBjcmVhdGVTZWxlY3RPcHRpb25zID0gKGRhdGEpID0+IHtcbiAgICAgICAgY29uc3QgZmlyc3QgPSBFbGVtZW50SGVscGVyLmNyZWF0ZShcIm9wdGlvblwiLCB7IHZhbHVlOiBcIlwiLCB0ZXh0OiBcIlNlbGVjdCBhbGxcIiB9KTtcblxuICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kKGZpcnN0KTtcblxuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgZGF0YSkge1xuICAgICAgICAgICAgY29uc3Qgb3B0aW9uID0gRWxlbWVudEhlbHBlci5jcmVhdGUoXCJvcHRpb25cIiwgeyB2YWx1ZTogaXRlbS52YWx1ZSwgdGV4dDogaXRlbS50ZXh0IH0pO1xuXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kKG9wdGlvbik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJlcGxhY2VzL3VwZGF0ZXMgb3B0aW9uIGVsZW1lbnRzIGZvciBjbGFzcydzIGBzZWxlY3RgIGlucHV0LiAgV2lsbCBwZXJzaXN0IHRoZSBjdXJyZW50IHNlbGVjdCB2YWx1ZSwgaWYgYW55LiAgXG4gICAgICogRXhwZWN0cyBhbiBhcnJheSBvZiBvYmplY3RzIHdpdGgga2V5L3ZhbHVlIHBhaXJzIG9mOlxuICAgICAqICAqIGB2YWx1ZWA6IE9wdGlvbiB2YWx1ZS4gIFNob3VsZCBiZSBhIHByaW1hcnkga2V5IHR5cGUgdmFsdWUgd2l0aCBubyBibGFuayBzcGFjZXMuXG4gICAgICogICogYHRleHRgOiBPcHRpb24gdGV4dC5cbiAgICAgKiBAcGFyYW0ge0FycmF5PG9iamVjdD59IGRhdGEga2V5L3ZhbHVlIGFycmF5IG9mIHZhbHVlcy5cbiAgICAgKi9cbiAgICByZWZyZXNoU2VsZWN0T3B0aW9ucyA9IChkYXRhKSA9PiB7XG4gICAgICAgIGNvbnN0IHNlbGVjdGVkVmFsdWUgPSB0aGlzLmVsZW1lbnQudmFsdWU7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50LnJlcGxhY2VDaGlsZHJlbigpO1xuICAgICAgICB0aGlzLmNyZWF0ZVNlbGVjdE9wdGlvbnMoZGF0YSk7XG4gICAgICAgIHRoaXMuZWxlbWVudC52YWx1ZSA9IHNlbGVjdGVkVmFsdWU7XG4gICAgfTtcblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC52YWx1ZTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEVsZW1lbnRTZWxlY3QgfTsiLCJpbXBvcnQgeyBDc3NIZWxwZXIgfSBmcm9tIFwiLi4vLi4vLi4vaGVscGVycy9jc3NIZWxwZXIuanNcIjtcbmltcG9ydCB7IEVsZW1lbnRIZWxwZXIgfSBmcm9tIFwiLi4vLi4vLi4vaGVscGVycy9lbGVtZW50SGVscGVyLmpzXCI7XG4vKipcbiAqIENyZWF0ZSBmaWx0ZXIgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyBhIG11bHRpLXNlbGVjdCBlbGVtZW50LiAgQ3JlYXRlcyBhIGRyb3Bkb3duIHdpdGggYSBsaXN0IG9mIG9wdGlvbnMgdGhhdCBjYW4gYmUgXG4gKiBzZWxlY3RlZCBvciBkZXNlbGVjdGVkLiAgSWYgYGZpbHRlclZhbHVlc1JlbW90ZVNvdXJjZWAgaXMgZGVmaW5lZCwgdGhlIHNlbGVjdCBvcHRpb25zIHdpbGwgYmUgcG9wdWxhdGVkIGJ5IHRoZSBkYXRhIHJldHVybmVkIFxuICogZnJvbSB0aGUgcmVtb3RlIHNvdXJjZSBieSByZWdpc3RlcmluZyB0byAgdGhlIGdyaWQgcGlwZWxpbmUncyBgaW5pdGAgYW5kIGByZWZyZXNoYCBldmVudHMuXG4gKi9cbmNsYXNzIEVsZW1lbnRNdWx0aVNlbGVjdCB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGZpbHRlciBvYmplY3QgdGhhdCByZXByZXNlbnRzIGEgbXVsdGktc2VsZWN0IGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHtDb2x1bW59IGNvbHVtbiBDb2x1bW4gY2xhc3Mgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgR3JpZCBjb250ZXh0IG9iamVjdC5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb2x1bW4sIGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gRWxlbWVudEhlbHBlci5kaXYoeyBuYW1lOiBjb2x1bW4uZmllbGQsIGNsYXNzTmFtZTogQ3NzSGVscGVyLm11bHRpU2VsZWN0LnBhcmVudENsYXNzIH0pO1xuICAgICAgICB0aGlzLmhlYWRlciA9IEVsZW1lbnRIZWxwZXIuZGl2KHsgY2xhc3NOYW1lOiBDc3NIZWxwZXIubXVsdGlTZWxlY3QuaGVhZGVyIH0pO1xuICAgICAgICB0aGlzLm9wdGlvbnNDb250YWluZXIgPSBFbGVtZW50SGVscGVyLmRpdih7IGNsYXNzTmFtZTogQ3NzSGVscGVyLm11bHRpU2VsZWN0Lm9wdGlvbnMgfSk7XG4gICAgICAgIHRoaXMuZmllbGQgPSBjb2x1bW4uZmllbGQ7XG4gICAgICAgIHRoaXMuZmllbGRUeXBlID0gY29sdW1uLnR5cGU7ICAvL2ZpZWxkIHZhbHVlIHR5cGUuXG4gICAgICAgIHRoaXMuZmlsdGVyVHlwZSA9IFwiaW5cIjsgIC8vY29uZGl0aW9uIHR5cGUuXG4gICAgICAgIHRoaXMuZmlsdGVySXNGdW5jdGlvbiA9ICh0eXBlb2YgY29sdW1uPy5maWx0ZXJUeXBlID09PSBcImZ1bmN0aW9uXCIpO1xuICAgICAgICB0aGlzLmZpbHRlclBhcmFtcyA9IGNvbHVtbi5maWx0ZXJQYXJhbXM7XG4gICAgICAgIHRoaXMubGlzdEFsbCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNlbGVjdGVkVmFsdWVzID0gW107XG5cbiAgICAgICAgaWYgKHR5cGVvZiBjb2x1bW4uZmlsdGVyTXVsdGlTZWxlY3QgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgIHRoaXMubGlzdEFsbCA9IGNvbHVtbi5maWx0ZXJNdWx0aVNlbGVjdC5saXN0QWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5oZWFkZXIuaWQgPSBgaGVhZGVyXyR7dGhpcy5jb250ZXh0LnNldHRpbmdzLmJhc2VJZE5hbWV9XyR7dGhpcy5maWVsZH1gO1xuICAgICAgICB0aGlzLmVsZW1lbnQuaWQgPSBgJHt0aGlzLmNvbnRleHQuc2V0dGluZ3MuYmFzZUlkTmFtZX1fJHt0aGlzLmZpZWxkfWA7XG4gICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmQodGhpcy5oZWFkZXIsIHRoaXMub3B0aW9uc0NvbnRhaW5lcik7XG5cbiAgICAgICAgaWYgKGNvbHVtbi5maWx0ZXJWYWx1ZXNSZW1vdGVTb3VyY2UpIHtcbiAgICAgICAgICAgIC8vc2V0IHVwIHBpcGVsaW5lIHRvIHJldHJpZXZlIG9wdGlvbiBkYXRhIHdoZW4gaW5pdCBwaXBlbGluZSBpcyBjYWxsZWQuXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQucGlwZWxpbmUuYWRkU3RlcChcImluaXRcIiwgdGhpcy50ZW1wbGF0ZUNvbnRhaW5lciwgY29sdW1uLmZpbHRlclZhbHVlc1JlbW90ZVNvdXJjZSk7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQucGlwZWxpbmUuYWRkU3RlcChcInJlZnJlc2hcIiwgdGhpcy5yZWZyZXNoU2VsZWN0T3B0aW9ucywgY29sdW1uLmZpbHRlclZhbHVlc1JlbW90ZVNvdXJjZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvL3VzZSB1c2VyIHN1cHBsaWVkIHZhbHVlcyB0byBjcmVhdGUgc2VsZWN0IG9wdGlvbnMuXG4gICAgICAgICAgICBjb25zdCBkYXRhID0gQXJyYXkuaXNBcnJheShjb2x1bW4uZmlsdGVyVmFsdWVzKSBcbiAgICAgICAgICAgICAgICA/IGNvbHVtbi5maWx0ZXJWYWx1ZXNcbiAgICAgICAgICAgICAgICA6IE9iamVjdC5lbnRyaWVzKGNvbHVtbi5maWx0ZXJWYWx1ZXMpLm1hcCgoW2tleSwgdmFsdWVdKSA9PiAoeyB2YWx1ZToga2V5LCB0ZXh0OiB2YWx1ZX0pKTtcblxuICAgICAgICAgICAgdGhpcy50ZW1wbGF0ZUNvbnRhaW5lcihkYXRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaGVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZUNsaWNrKTtcbiAgICB9XG5cbiAgICBoYW5kbGVDbGljayA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3Qgc3RhdHVzID0gdGhpcy5oZWFkZXIuY2xhc3NMaXN0LnRvZ2dsZShDc3NIZWxwZXIubXVsdGlTZWxlY3QuaGVhZGVyQWN0aXZlKTtcblxuICAgICAgICBpZiAoIXN0YXR1cykge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpO1xuICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlRG9jdW1lbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlRG9jdW1lbnQpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBIYW5kbGVyIGV2ZW50IHRvIGNsb3NlIGRyb3Bkb3duIHdoZW4gdXNlciBjbGlja3Mgb3V0c2lkZSB0aGUgbXVsdGktc2VsZWN0IGNvbnRyb2wuICBFdmVudCBpcyByZW1vdmVkIHdoZW4gbXVsdGktc2VsZWN0IFxuICAgICAqIGlzIG5vdCBhY3RpdmUgc28gdGhhdCBpdCdzIG5vdCBmaXJpbmcgb24gcmVkdW5kYW50IGV2ZW50cy5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZSBPYmplY3QgdGhhdCB0cmlnZ2VyZWQgZXZlbnQuXG4gICAgICovXG4gICAgaGFuZGxlRG9jdW1lbnQgPSBhc3luYyAoZSkgPT4ge1xuICAgICAgICBpZiAoIWUudGFyZ2V0LmNsb3Nlc3QoXCIuXCIgKyBDc3NIZWxwZXIubXVsdGlTZWxlY3Qub3B0aW9uKSAmJiAhZS50YXJnZXQuY2xvc2VzdChgIyR7dGhpcy5oZWFkZXIuaWR9YCkpIHtcbiAgICAgICAgICAgIHRoaXMuaGVhZGVyLmNsYXNzTGlzdC5yZW1vdmUoQ3NzSGVscGVyLm11bHRpU2VsZWN0LmhlYWRlckFjdGl2ZSk7XG5cbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKTtcblxuICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlRG9jdW1lbnQpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgY291bnQgbGFiZWwgdGhhdCBkaXNwbGF5cyB0aGUgbnVtYmVyIG9mIHNlbGVjdGVkIGl0ZW1zIGluIHRoZSBtdWx0aS1zZWxlY3QgY29udHJvbC5cbiAgICAgKi9cbiAgICBjcmVhdGVDb3VudExhYmVsID0gKCkgPT4ge1xuICAgICAgICAvL3VwZGF0ZSBjb3VudCBsYWJlbC5cbiAgICAgICAgaWYgKHRoaXMuY291bnRMYWJlbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgICAgIHRoaXMuY291bnRMYWJlbC5jbGFzc05hbWUgPSBDc3NIZWxwZXIubXVsdGlTZWxlY3QuaGVhZGVyT3B0aW9uO1xuICAgICAgICAgICAgdGhpcy5oZWFkZXIuYXBwZW5kKHRoaXMuY291bnRMYWJlbCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5zZWxlY3RlZFZhbHVlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwuaW5uZXJUZXh0ID0gYCR7dGhpcy5zZWxlY3RlZFZhbHVlcy5sZW5ndGh9IHNlbGVjdGVkYDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY291bnRMYWJlbC5yZW1vdmUoKTtcbiAgICAgICAgICAgIHRoaXMuY291bnRMYWJlbCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogSGFuZGxlIGNsaWNrIGV2ZW50IGZvciBlYWNoIG9wdGlvbiBpbiB0aGUgbXVsdGktc2VsZWN0IGNvbnRyb2wuICBUb2dnbGVzIHRoZSBzZWxlY3RlZCBzdGF0ZSBvZiB0aGUgb3B0aW9uIGFuZCB1cGRhdGVzIHRoZSBcbiAgICAgKiBoZWFkZXIgaWYgYGxpc3RBbGxgIGlzIGB0cnVlYC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gbyBPYmplY3QgdGhhdCB0cmlnZ2VyZWQgdGhlIGV2ZW50LlxuICAgICAqL1xuICAgIGhhbmRsZU9wdGlvbiA9IChvKSA9PiB7XG4gICAgICAgIGlmICghby5jdXJyZW50VGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhDc3NIZWxwZXIubXVsdGlTZWxlY3Quc2VsZWN0ZWQpKSB7XG4gICAgICAgICAgICAvL3NlbGVjdCBpdGVtLlxuICAgICAgICAgICAgby5jdXJyZW50VGFyZ2V0LmNsYXNzTGlzdC5hZGQoQ3NzSGVscGVyLm11bHRpU2VsZWN0LnNlbGVjdGVkKTtcbiAgICAgICAgICAgIG8uY3VycmVudFRhcmdldC5kYXRhc2V0LnNlbGVjdGVkID0gXCJ0cnVlXCI7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRWYWx1ZXMucHVzaChvLmN1cnJlbnRUYXJnZXQuZGF0YXNldC52YWx1ZSk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmxpc3RBbGwpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzcGFuID0gRWxlbWVudEhlbHBlci5zcGFuKHsgY2xhc3NOYW1lOiBDc3NIZWxwZXIubXVsdGlTZWxlY3QuaGVhZGVyT3B0aW9uLCBpbm5lclRleHQ6IG8uY3VycmVudFRhcmdldC5kYXRhc2V0LnZhbHVlIH0sIHsgdmFsdWU6IG8uY3VycmVudFRhcmdldC5kYXRhc2V0LnZhbHVlIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuaGVhZGVyLmFwcGVuZChzcGFuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vZGVzZWxlY3QgaXRlbS5cbiAgICAgICAgICAgIG8uY3VycmVudFRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKENzc0hlbHBlci5tdWx0aVNlbGVjdC5zZWxlY3RlZCk7XG4gICAgICAgICAgICBvLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5zZWxlY3RlZCA9IFwiZmFsc2VcIjtcblxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZFZhbHVlcyA9IHRoaXMuc2VsZWN0ZWRWYWx1ZXMuZmlsdGVyKGYgPT4gZiAhPT0gby5jdXJyZW50VGFyZ2V0LmRhdGFzZXQudmFsdWUpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5saXN0QWxsKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMuaGVhZGVyLnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLXZhbHVlPScke28uY3VycmVudFRhcmdldC5kYXRhc2V0LnZhbHVlfSddYCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoaXRlbSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBpdGVtLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmxpc3RBbGwgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICB0aGlzLmNyZWF0ZUNvdW50TGFiZWwoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogSGVscGVyIGZ1bmN0aW9uIHRvIGNyZWF0ZSBhbiBvcHRpb24gZWxlbWVudCBmb3IgdGhlIG11bHRpLXNlbGVjdCBjb250cm9sLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpdGVtIGtleS92YWx1ZSBwYWlyIG9iamVjdCB0aGF0IGNvbnRhaW5zIHRoZSB2YWx1ZSBhbmQgdGV4dCBmb3IgdGhlIG9wdGlvbi5cbiAgICAgKiBAcmV0dXJucyB7SFRNTERpdkVsZW1lbnR9IFJldHVybnMgYSBkaXYgZWxlbWVudCB0aGF0IHJlcHJlc2VudHMgdGhlIG9wdGlvbiBpbiB0aGUgbXVsdGktc2VsZWN0IGNvbnRyb2wuXG4gICAgICovXG4gICAgY3JlYXRlT3B0aW9uKGl0ZW0pIHsgXG4gICAgICAgIGNvbnN0IG9wdGlvbiA9IEVsZW1lbnRIZWxwZXIuZGl2KHsgY2xhc3NOYW1lOiBDc3NIZWxwZXIubXVsdGlTZWxlY3Qub3B0aW9uIH0sIHsgdmFsdWU6IGl0ZW0udmFsdWUsIHNlbGVjdGVkOiBcImZhbHNlXCIgfSk7XG4gICAgICAgIGNvbnN0IHJhZGlvID0gRWxlbWVudEhlbHBlci5zcGFuKHsgY2xhc3NOYW1lOiBDc3NIZWxwZXIubXVsdGlTZWxlY3Qub3B0aW9uUmFkaW8gfSk7XG4gICAgICAgIGNvbnN0IHRleHQgPSBFbGVtZW50SGVscGVyLnNwYW4oeyBjbGFzc05hbWU6IENzc0hlbHBlci5tdWx0aVNlbGVjdC5vcHRpb25UZXh0LCBpbm5lckhUTUw6IGl0ZW0udGV4dCB9KTtcblxuICAgICAgICBvcHRpb24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlT3B0aW9uKTtcbiAgICAgICAgb3B0aW9uLmFwcGVuZChyYWRpbywgdGV4dCk7XG5cbiAgICAgICAgcmV0dXJuIG9wdGlvbjtcbiAgICB9XG5cbiAgICB0ZW1wbGF0ZUNvbnRhaW5lciA9IChkYXRhKSA9PiB7XG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBkYXRhKSB7XG4gICAgICAgICAgICBjb25zdCBvcHRpb24gPSB0aGlzLmNyZWF0ZU9wdGlvbihpdGVtKTtcbiAgICAgICAgICAgIHRoaXMub3B0aW9uc0NvbnRhaW5lci5hcHBlbmQob3B0aW9uKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHdoZW4gdGhlIGdyaWQgcGlwZWxpbmUncyBgcmVmcmVzaGAgZXZlbnQgaXMgdHJpZ2dlcmVkLiAgSXQgY2xlYXJzIHRoZSBjdXJyZW50IG9wdGlvbnMgYW5kXG4gICAgICogcmVjcmVhdGVzIHRoZW0gYmFzZWQgb24gdGhlIGRhdGEgcHJvdmlkZWQuICBJdCBhbHNvIHVwZGF0ZXMgdGhlIHNlbGVjdGVkIHZhbHVlcyBiYXNlZCBvbiB0aGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgb3B0aW9ucy5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBkYXRhIEFycmF5IG9mIG9iamVjdHMgdGhhdCByZXByZXNlbnQgdGhlIG9wdGlvbnMgdG8gYmUgZGlzcGxheWVkIGluIHRoZSBtdWx0aS1zZWxlY3QgY29udHJvbC5cbiAgICAgKi9cbiAgICByZWZyZXNoU2VsZWN0T3B0aW9ucyA9IChkYXRhKSA9PiB7XG4gICAgICAgIHRoaXMub3B0aW9uc0NvbnRhaW5lci5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgICAgICAgdGhpcy5oZWFkZXIucmVwbGFjZUNoaWxkcmVuKCk7XG4gICAgICAgIHRoaXMuY291bnRMYWJlbCA9IHVuZGVmaW5lZDsgIC8vc2V0IHRvIHVuZGVmaW5lZCBzbyBpdCBjYW4gYmUgcmVjcmVhdGVkIGxhdGVyLlxuICAgICAgICBjb25zdCBuZXdTZWxlY3RlZCA9IFtdO1xuXG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBkYXRhKSB7XG4gICAgICAgICAgICBjb25zdCBvcHRpb24gPSB0aGlzLmNyZWF0ZU9wdGlvbihpdGVtKTtcbiAgICAgICAgICAgIC8vY2hlY2sgaWYgaXRlbSBpcyBzZWxlY3RlZC5cbiAgICAgICAgICAgIGlmICh0aGlzLnNlbGVjdGVkVmFsdWVzLmluY2x1ZGVzKGl0ZW0udmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgLy9zZWxlY3QgaXRlbS5cbiAgICAgICAgICAgICAgICBvcHRpb24uY2xhc3NMaXN0LmFkZChDc3NIZWxwZXIubXVsdGlTZWxlY3Quc2VsZWN0ZWQpO1xuICAgICAgICAgICAgICAgIG9wdGlvbi5kYXRhc2V0LnNlbGVjdGVkID0gXCJ0cnVlXCI7XG4gICAgICAgICAgICAgICAgbmV3U2VsZWN0ZWQucHVzaChpdGVtLnZhbHVlKTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmxpc3RBbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3BhbiA9IEVsZW1lbnRIZWxwZXIuc3Bhbih7IGNsYXNzTmFtZTogQ3NzSGVscGVyLm11bHRpU2VsZWN0LmhlYWRlck9wdGlvbiwgaW5uZXJUZXh0OiBpdGVtLnZhbHVlIH0sIHsgdmFsdWU6IGl0ZW0udmFsdWUgfSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGVhZGVyLmFwcGVuZChzcGFuKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMub3B0aW9uc0NvbnRhaW5lci5hcHBlbmQob3B0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICAvL3NldCBuZXcgc2VsZWN0ZWQgdmFsdWVzIGFzIGl0ZW1zIG1heSBoYXZlIGJlZW4gcmVtb3ZlZCBvbiByZWZyZXNoLlxuICAgICAgICB0aGlzLnNlbGVjdGVkVmFsdWVzID0gbmV3U2VsZWN0ZWQ7XG5cbiAgICAgICAgaWYgKHRoaXMubGlzdEFsbCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlQ291bnRMYWJlbCgpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0ZWRWYWx1ZXM7XG4gICAgfVxufVxuXG5leHBvcnQgeyBFbGVtZW50TXVsdGlTZWxlY3QgfTsiLCIvKipcbiAqIENsYXNzIHRoYXQgZGVmaW5lcyBhIHNpbmdsZSBmaWx0ZXIgY29uZGl0aW9uIGZvciBhIGNvbHVtbi5cbiAqL1xuY2xhc3MgRmlsdGVyVGFyZ2V0IHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGZpbHRlciB0YXJnZXQgb2JqZWN0IHRoYXQgZGVmaW5lcyBhIHNpbmdsZSBmaWx0ZXIgY29uZGl0aW9uLiAgRXhwZWN0cyBhbiBvYmplY3Qgd2l0aCB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gICAgICogKiBgdmFsdWVgOiBUaGUgdmFsdWUgdG8gZmlsdGVyIGFnYWluc3QuICBFeHBlY3RzIHRoYXQgdmFsdWUgbWF0Y2hlcyB0aGUgdHlwZSBvZiB0aGUgZmllbGQgYmVpbmcgZmlsdGVyZWQuICBTaG91bGQgYmUgbnVsbCBpZiBcbiAgICAgKiB2YWx1ZSB0eXBlIGNhbm5vdCBiZSBjb252ZXJ0ZWQgdG8gdGhlIGZpZWxkIHR5cGUuXG4gICAgICogKiBgZmllbGRgOiBUaGUgZmllbGQgbmFtZSBvZiB0aGUgY29sdW1uIGJlaW5nIGZpbHRlcmVkLiAgVGhpcyBpcyB1c2VkIHRvIGlkZW50aWZ5IHRoZSBjb2x1bW4gaW4gdGhlIGRhdGEgc2V0LlxuICAgICAqICogYGZpZWxkVHlwZWA6IFRoZSB0eXBlIG9mIGZpZWxkIGJlaW5nIGZpbHRlcmVkIChlLmcuLCBcInN0cmluZ1wiLCBcIm51bWJlclwiLCBcImRhdGVcIiwgXCJvYmplY3RcIikuICBUaGlzIGlzIHVzZWQgdG8gZGV0ZXJtaW5lIGhvdyB0byBjb21wYXJlIHRoZSB2YWx1ZS5cbiAgICAgKiAqIGBmaWx0ZXJUeXBlYDogVGhlIHR5cGUgb2YgZmlsdGVyIHRvIGFwcGx5IChlLmcuLCBcImVxdWFsc1wiLCBcImxpa2VcIiwgXCI8XCIsIFwiPD1cIiwgXCI+XCIsIFwiPj1cIiwgXCIhPVwiLCBcImJldHdlZW5cIiwgXCJpblwiKS5cbiAgICAgKiBAcGFyYW0ge3sgdmFsdWU6IChzdHJpbmcgfCBudW1iZXIgfCBEYXRlIHwgT2JqZWN0IHwgbnVsbCksIGZpZWxkOiBzdHJpbmcsIGZpZWxkVHlwZTogc3RyaW5nLCBmaWx0ZXJUeXBlOiBzdHJpbmcgfX0gdGFyZ2V0IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHRhcmdldCkge1xuICAgICAgICB0aGlzLnZhbHVlID0gdGFyZ2V0LnZhbHVlO1xuICAgICAgICB0aGlzLmZpZWxkID0gdGFyZ2V0LmZpZWxkO1xuICAgICAgICB0aGlzLmZpZWxkVHlwZSA9IHRhcmdldC5maWVsZFR5cGUgfHwgXCJzdHJpbmdcIjsgLy8gRGVmYXVsdCB0byBzdHJpbmcgaWYgbm90IHByb3ZpZGVkXG4gICAgICAgIHRoaXMuZmlsdGVyVHlwZSA9IHRhcmdldC5maWx0ZXJUeXBlO1xuICAgICAgICB0aGlzLmZpbHRlcnMgPSB0aGlzLiNpbml0KCk7XG4gICAgfVxuXG4gICAgI2luaXQoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvL2VxdWFsIHRvXG4gICAgICAgICAgICBcImVxdWFsc1wiOiBmdW5jdGlvbihmaWx0ZXJWYWwsIHJvd1ZhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWx0ZXJWYWwgPT09IHJvd1ZhbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL2xpa2VcbiAgICAgICAgICAgIFwibGlrZVwiOiBmdW5jdGlvbihmaWx0ZXJWYWwsIHJvd1ZhbCkge1xuICAgICAgICAgICAgICAgIGlmIChyb3dWYWwgPT09IHVuZGVmaW5lZCB8fCByb3dWYWwgPT09IG51bGwgfHwgcm93VmFsID09PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBTdHJpbmcocm93VmFsKS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoZmlsdGVyVmFsLnRvTG93ZXJDYXNlKCkpID4gLTE7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy9sZXNzIHRoYW5cbiAgICAgICAgICAgIFwiPFwiOiBmdW5jdGlvbihmaWx0ZXJWYWwsIHJvd1ZhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWx0ZXJWYWwgPCByb3dWYWw7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy9sZXNzIHRoYW4gb3IgZXF1YWwgdG9cbiAgICAgICAgICAgIFwiPD1cIjogZnVuY3Rpb24oZmlsdGVyVmFsLCByb3dWYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlsdGVyVmFsIDw9IHJvd1ZhbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL2dyZWF0ZXIgdGhhblxuICAgICAgICAgICAgXCI+XCI6IGZ1bmN0aW9uKGZpbHRlclZhbCwgcm93VmFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlclZhbCA+IHJvd1ZhbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL2dyZWF0ZXIgdGhhbiBvciBlcXVhbCB0b1xuICAgICAgICAgICAgXCI+PVwiOiBmdW5jdGlvbihmaWx0ZXJWYWwsIHJvd1ZhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWx0ZXJWYWwgPj0gcm93VmFsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vbm90IGVxdWFsIHRvXG4gICAgICAgICAgICBcIiE9XCI6IGZ1bmN0aW9uKGZpbHRlclZhbCwgcm93VmFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJvd1ZhbCAhPT0gZmlsdGVyVmFsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIGJldHdlZW4uICBleHBlY3RzIGZpbHRlclZhbCB0byBiZSBhbiBhcnJheSBvZjogWyB7c3RhcnQgdmFsdWV9LCB7IGVuZCB2YWx1ZSB9IF0gXG4gICAgICAgICAgICBcImJldHdlZW5cIjogZnVuY3Rpb24oZmlsdGVyVmFsLCByb3dWYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcm93VmFsID49IGZpbHRlclZhbFswXSAmJiByb3dWYWwgPD0gZmlsdGVyVmFsWzFdO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vaW4gYXJyYXkuXG4gICAgICAgICAgICBcImluXCI6IGZ1bmN0aW9uKGZpbHRlclZhbCwgcm93VmFsKSB7XG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZmlsdGVyVmFsKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmlsdGVyVmFsLmxlbmd0aCA/IGZpbHRlclZhbC5pbmRleE9mKHJvd1ZhbCkgPiAtMSA6IHRydWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiRmlsdGVyIEVycm9yIC0gZmlsdGVyIHZhbHVlIGlzIG5vdCBhbiBhcnJheTpcIiwgZmlsdGVyVmFsKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRXhlY3V0ZXMgYW4gaW50ZXJuYWwgZnVuY3Rpb24gdG8gaW5kaWNhdGUgaWYgdGhlIGN1cnJlbnQgcm93IHZhbHVlcyBtYXRjaGVzIHRoZSBmaWx0ZXIgY3JpdGVyaWEncyB2YWx1ZS4gIFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSByb3dWYWwgUm93IGNvbHVtbiB2YWx1ZS4gIEV4cGVjdHMgYSB2YWx1ZSB0aGF0IG1hdGNoZXMgdGhlIHR5cGUgaWRlbnRpZmllZCBieSB0aGUgY29sdW1uLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0PEFycmF5Pn0gcm93IEN1cnJlbnQgZGF0YSBzZXQgcm93LlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIHRydWUgaWYgcm93IHZhbHVlIG1hdGNoZXMgZmlsdGVyIHZhbHVlLiAgT3RoZXJ3aXNlLCBmYWxzZSBpbmRpY2F0aW5nIG5vIG1hdGNoLlxuICAgICAqL1xuICAgIGV4ZWN1dGUocm93VmFsLCByb3cpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyc1t0aGlzLmZpbHRlclR5cGVdKHRoaXMudmFsdWUsIHJvd1ZhbCk7XG4gICAgfVxufVxuXG5leHBvcnQgeyBGaWx0ZXJUYXJnZXQgfTsiLCJpbXBvcnQgeyBEYXRlSGVscGVyIH0gZnJvbSBcIi4uLy4uLy4uL2hlbHBlcnMvZGF0ZUhlbHBlci5qc1wiO1xuLyoqXG4gKiBDbGFzcyB0aGF0IGRlZmluZXMgYSBzaW5nbGUgZmlsdGVyIGNvbmRpdGlvbiBmb3IgYSBkYXRlIGNvbHVtbi5cbiAqL1xuY2xhc3MgRmlsdGVyRGF0ZSB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBmaWx0ZXIgdGFyZ2V0IG9iamVjdCB0aGF0IGRlZmluZXMgYSBzaW5nbGUgZmlsdGVyIGNvbmRpdGlvbiBmb3IgYSBkYXRlIGRhdGEgdHlwZS4gIEV4cGVjdHMgYW4gb2JqZWN0IHdpdGggdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuICAgICAqICogYHZhbHVlYDogVGhlIHZhbHVlIHRvIGZpbHRlciBhZ2FpbnN0LiAgRXhwZWN0cyB0aGF0IHZhbHVlIG1hdGNoZXMgdGhlIHR5cGUgb2YgdGhlIGZpZWxkIGJlaW5nIGZpbHRlcmVkLiAgU2hvdWxkIGJlIG51bGwgaWYgXG4gICAgICogdmFsdWUgdHlwZSBjYW5ub3QgYmUgY29udmVydGVkIHRvIHRoZSBmaWVsZCB0eXBlLlxuICAgICAqICogYGZpZWxkYDogVGhlIGZpZWxkIG5hbWUgb2YgdGhlIGNvbHVtbiBiZWluZyBmaWx0ZXJlZC4gIFRoaXMgaXMgdXNlZCB0byBpZGVudGlmeSB0aGUgY29sdW1uIGluIHRoZSBkYXRhIHNldC5cbiAgICAgKiAqIGBmaWx0ZXJUeXBlYDogVGhlIHR5cGUgb2YgZmlsdGVyIHRvIGFwcGx5IChlLmcuLCBcImVxdWFsc1wiLCBcImxpa2VcIiwgXCI8XCIsIFwiPD1cIiwgXCI+XCIsIFwiPj1cIiwgXCIhPVwiLCBcImJldHdlZW5cIiwgXCJpblwiKS5cbiAgICAgKiBAcGFyYW0ge3sgdmFsdWU6IChEYXRlIHwgQXJyYXk8RGF0ZT4pLCBmaWVsZDogc3RyaW5nLCBmaWx0ZXJUeXBlOiBzdHJpbmcgfX0gdGFyZ2V0IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHRhcmdldCkge1xuICAgICAgICB0aGlzLnZhbHVlID0gdGFyZ2V0LnZhbHVlO1xuICAgICAgICB0aGlzLmZpZWxkID0gdGFyZ2V0LmZpZWxkO1xuICAgICAgICB0aGlzLmZpZWxkVHlwZSA9IFwiZGF0ZVwiO1xuICAgICAgICB0aGlzLmZpbHRlclR5cGUgPSB0YXJnZXQuZmlsdGVyVHlwZTtcbiAgICAgICAgdGhpcy5maWx0ZXJzID0gdGhpcy4jaW5pdCgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgbmV3IGRhdGUgb2JqZWN0IGZvciBlYWNoIGRhdGUgcGFzc2VkIGluLCBzZXR0aW5nIHRoZSB0aW1lIHRvIG1pZG5pZ2h0LiAgVGhpcyBpcyB1c2VkIHRvIGVuc3VyZSB0aGF0IHRoZSBkYXRlIG9iamVjdHMgYXJlIG5vdCBtb2RpZmllZFxuICAgICAqIHdoZW4gY29tcGFyaW5nIGRhdGVzIGluIHRoZSBmaWx0ZXIgZnVuY3Rpb25zLCBhbmQgdG8gZW5zdXJlIHRoYXQgdGhlIHRpbWUgcG9ydGlvbiBvZiB0aGUgZGF0ZSBkb2VzIG5vdCBhZmZlY3QgdGhlIGNvbXBhcmlzb24uXG4gICAgICogQHBhcmFtIHtEYXRlfSBkYXRlMSBcbiAgICAgKiBAcGFyYW0ge0RhdGV9IGRhdGUyIFxuICAgICAqIEByZXR1cm5zIHtBcnJheTxEYXRlPn0gUmV0dXJucyBhbiBhcnJheSBvZiB0d28gZGF0ZSBvYmplY3RzLCBlYWNoIHNldCB0byBtaWRuaWdodCBvZiB0aGUgcmVzcGVjdGl2ZSBkYXRlIHBhc3NlZCBpbi5cbiAgICAgKi9cbiAgICBjbG9uZURhdGVzID0gKGRhdGUxLCBkYXRlMikgPT4geyBcbiAgICAgICAgY29uc3QgZDEgPSBuZXcgRGF0ZShkYXRlMSk7XG4gICAgICAgIGNvbnN0IGQyID0gbmV3IERhdGUoZGF0ZTIpO1xuXG4gICAgICAgIGQxLnNldEhvdXJzKDAsIDAsIDAsIDApO1xuICAgICAgICBkMi5zZXRIb3VycygwLCAwLCAwLCAwKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBbZDEsIGQyXTtcbiAgICB9O1xuXG4gICAgI2luaXQoKSB7IFxuICAgICAgICByZXR1cm4geyBcbiAgICAgICAgICAgIFwiZXF1YWxzXCI6IGZ1bmN0aW9uKGZpbHRlclZhbCwgcm93VmFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlclZhbC5nZXRGdWxsWWVhcigpID09PSByb3dWYWwuZ2V0RnVsbFllYXIoKSAmJiBmaWx0ZXJWYWwuZ2V0TW9udGgoKSA9PT0gcm93VmFsLmdldE1vbnRoKCkgJiYgZmlsdGVyVmFsLmdldERhdGUoKSA9PT0gcm93VmFsLmdldERhdGUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL2xlc3MgdGhhblxuICAgICAgICAgICAgXCI8XCI6IChmaWx0ZXJWYWwsIHJvd1ZhbCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGVzID0gdGhpcy5jbG9uZURhdGVzKGZpbHRlclZhbCwgcm93VmFsKTtcbiBcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0ZXNbMF0uZ2V0VGltZSgpIDwgZGF0ZXNbMV0uZ2V0VGltZSgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vbGVzcyB0aGFuIG9yIGVxdWFsIHRvXG4gICAgICAgICAgICBcIjw9XCI6IChmaWx0ZXJWYWwsIHJvd1ZhbCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGVzID0gdGhpcy5jbG9uZURhdGVzKGZpbHRlclZhbCwgcm93VmFsKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBkYXRlc1swXS5nZXRUaW1lKCkgPCBkYXRlc1sxXS5nZXRUaW1lKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy9ncmVhdGVyIHRoYW5cbiAgICAgICAgICAgIFwiPlwiOiAoZmlsdGVyVmFsLCByb3dWYWwpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkYXRlcyA9IHRoaXMuY2xvbmVEYXRlcyhmaWx0ZXJWYWwsIHJvd1ZhbCk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0ZXNbMF0uZ2V0VGltZSgpID4gZGF0ZXNbMV0uZ2V0VGltZSgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvXG4gICAgICAgICAgICBcIj49XCI6IChmaWx0ZXJWYWwsIHJvd1ZhbCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGVzID0gdGhpcy5jbG9uZURhdGVzKGZpbHRlclZhbCwgcm93VmFsKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBkYXRlc1swXS5nZXRUaW1lKCkgPj0gZGF0ZXNbMV0uZ2V0VGltZSgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vbm90IGVxdWFsIHRvXG4gICAgICAgICAgICBcIiE9XCI6IGZ1bmN0aW9uKGZpbHRlclZhbCwgcm93VmFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlclZhbC5nZXRGdWxsWWVhcigpICE9PSByb3dWYWwuZ2V0RnVsbFllYXIoKSAmJiBmaWx0ZXJWYWwuZ2V0TW9udGgoKSAhPT0gcm93VmFsLmdldE1vbnRoKCkgJiYgZmlsdGVyVmFsLmdldERhdGUoKSAhPT0gcm93VmFsLmdldERhdGUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBiZXR3ZWVuLiAgZXhwZWN0cyBmaWx0ZXJWYWwgdG8gYmUgYW4gYXJyYXkgb2Y6IFsge3N0YXJ0IHZhbHVlfSwgeyBlbmQgdmFsdWUgfSBdIFxuICAgICAgICAgICAgXCJiZXR3ZWVuXCI6IChmaWx0ZXJWYWwsIHJvd1ZhbCkgID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJEYXRlcyA9IHRoaXMuY2xvbmVEYXRlcyhmaWx0ZXJWYWxbMF0sIGZpbHRlclZhbFsxXSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgcm93RGF0ZXMgPSB0aGlzLmNsb25lRGF0ZXMocm93VmFsLCByb3dWYWwpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJvd0RhdGVzWzBdID49IGZpbHRlckRhdGVzWzBdICYmIHJvd0RhdGVzWzBdIDw9IGZpbHRlckRhdGVzWzFdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBFeGVjdXRlcyBhbiBpbnRlcm5hbCBmdW5jdGlvbiB0byBpbmRpY2F0ZSBpZiB0aGUgY3VycmVudCByb3cgdmFsdWUgbWF0Y2hlcyB0aGUgZmlsdGVyIGNyaXRlcmlhJ3MgdmFsdWUuICBcbiAgICAgKiBAcGFyYW0ge0RhdGV9IHJvd1ZhbCBSb3cgY29sdW1uIHZhbHVlLiAgRXhwZWN0cyBhIERhdGUgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0PEFycmF5Pn0gcm93IEN1cnJlbnQgZGF0YSBzZXQgcm93LlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIHRydWUgaWYgcm93IHZhbHVlIG1hdGNoZXMgZmlsdGVyIHZhbHVlLiAgT3RoZXJ3aXNlLCBmYWxzZSBpbmRpY2F0aW5nIG5vIG1hdGNoLlxuICAgICAqL1xuICAgIGV4ZWN1dGUocm93VmFsLCByb3cpIHtcbiAgICAgICAgaWYgKHJvd1ZhbCA9PT0gbnVsbCB8fCAhRGF0ZUhlbHBlci5pc0RhdGUocm93VmFsKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlOyAvLyBJZiByb3dWYWwgaXMgbnVsbCBvciBub3QgYSBkYXRlLCByZXR1cm4gZmFsc2UuXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXJzW3RoaXMuZmlsdGVyVHlwZV0odGhpcy52YWx1ZSwgcm93VmFsKTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEZpbHRlckRhdGUgfTsiLCIvKipcbiAqIFJlcHJlc2VudHMgYSBjb25jcmV0ZSBpbXBsZW1lbnRhdGlvbiBvZiBhIGZpbHRlciB0aGF0IHVzZXMgYSB1c2VyIHN1cHBsaWVkIGZ1bmN0aW9uLlxuICovXG5jbGFzcyBGaWx0ZXJGdW5jdGlvbiB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGZpbHRlciBmdW5jdGlvbiBpbnN0YW5jZS4gIEV4cGVjdHMgYW4gb2JqZWN0IHdpdGggdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuICAgICAqICogYHZhbHVlYDogVGhlIHZhbHVlIHRvIGZpbHRlciBhZ2FpbnN0LiAgRG9lcyBub3QgbmVlZCB0byBtYXRjaCB0aGUgdHlwZSBvZiB0aGUgZmllbGQgYmVpbmcgZmlsdGVyZWQuXG4gICAgICogKiBgZmllbGRgOiBUaGUgZmllbGQgbmFtZSBvZiB0aGUgY29sdW1uIGJlaW5nIGZpbHRlcmVkLiAgVGhpcyBpcyB1c2VkIHRvIGlkZW50aWZ5IHRoZSBjb2x1bW4gaW4gdGhlIGRhdGEgc2V0LlxuICAgICAqICogYGZpbHRlclR5cGVgOiBUaGUgZnVuY3Rpb24gdG8gdXNlIGZvciBmaWx0ZXJpbmcuXG4gICAgICogKiBgcGFyYW1zYDogT3B0aW9uYWwgcGFyYW1ldGVycyB0byBwYXNzIHRvIHRoZSBmaWx0ZXIgZnVuY3Rpb24uXG4gICAgICogQHBhcmFtIHt7IHZhbHVlOiBPYmplY3QsIGZpZWxkOiBzdHJpbmcsIGZpbHRlclR5cGU6IEZ1bmN0aW9uLCBwYXJhbXM6IE9iamVjdCB9fSB0YXJnZXQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IodGFyZ2V0KSB7XG4gICAgICAgIHRoaXMudmFsdWUgPSB0YXJnZXQudmFsdWU7XG4gICAgICAgIHRoaXMuZmllbGQgPSB0YXJnZXQuZmllbGQ7XG4gICAgICAgIHRoaXMuZmlsdGVyRnVuY3Rpb24gPSB0YXJnZXQuZmlsdGVyVHlwZTtcbiAgICAgICAgdGhpcy5wYXJhbXMgPSB0YXJnZXQucGFyYW1zID8/IHt9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBFeGVjdXRlcyBhbiB1c2VyIHN1cHBsaWVkIGZ1bmN0aW9uIHRvIGluZGljYXRlIGlmIHRoZSBjdXJyZW50IHJvdyB2YWx1ZXMgbWF0Y2hlcyB0aGUgZmlsdGVyIGNyaXRlcmlhJ3MgdmFsdWUuICBcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcm93VmFsIFJvdyBjb2x1bW4gdmFsdWUuICBFeHBlY3RzIGEgdmFsdWUgdGhhdCBtYXRjaGVzIHRoZSB0eXBlIGlkZW50aWZpZWQgYnkgdGhlIGNvbHVtbi5cbiAgICAgKiBAcGFyYW0ge09iamVjdDxBcnJheT59IHJvdyBDdXJyZW50IGRhdGEgc2V0IHJvdy5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyB0cnVlIGlmIHJvdyB2YWx1ZSBtYXRjaGVzIGZpbHRlciB2YWx1ZS4gIE90aGVyd2lzZSwgZmFsc2UgaW5kaWNhdGluZyBubyBtYXRjaC5cbiAgICAgKi9cbiAgICBleGVjdXRlKHJvd1ZhbCwgcm93KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbHRlckZ1bmN0aW9uKHRoaXMudmFsdWUsIHJvd1ZhbCwgcm93LCB0aGlzLnBhcmFtcyk7XG4gICAgfVxufVxuXG5leHBvcnQgeyBGaWx0ZXJGdW5jdGlvbiB9OyIsImltcG9ydCB7IERhdGVIZWxwZXIgfSBmcm9tIFwiLi4vLi4vaGVscGVycy9kYXRlSGVscGVyLmpzXCI7XG5pbXBvcnQgeyBGaWx0ZXJUYXJnZXQgfSBmcm9tIFwiLi90eXBlcy9maWx0ZXJUYXJnZXQuanNcIjtcbmltcG9ydCB7IEZpbHRlckRhdGUgfSBmcm9tIFwiLi90eXBlcy9maWx0ZXJEYXRlLmpzXCI7XG5pbXBvcnQgeyBGaWx0ZXJGdW5jdGlvbiB9IGZyb20gXCIuL3R5cGVzL2ZpbHRlckZ1bmN0aW9uLmpzXCI7XG5pbXBvcnQgeyBFbGVtZW50QmV0d2VlbiB9IGZyb20gXCIuL2VsZW1lbnRzL2VsZW1lbnRCZXR3ZWVuLmpzXCI7XG5pbXBvcnQgeyBFbGVtZW50SW5wdXQgfSBmcm9tIFwiLi9lbGVtZW50cy9lbGVtZW50SW5wdXQuanNcIjtcbmltcG9ydCB7IEVsZW1lbnRNdWx0aVNlbGVjdCB9IGZyb20gXCIuL2VsZW1lbnRzL2VsZW1lbnRNdWx0aVNlbGVjdC5qc1wiO1xuaW1wb3J0IHsgRWxlbWVudFNlbGVjdCB9IGZyb20gXCIuL2VsZW1lbnRzL2VsZW1lbnRTZWxlY3QuanNcIjtcbi8qKlxuICogUHJvdmlkZXMgYSBtZWFucyB0byBmaWx0ZXIgZGF0YSBpbiB0aGUgZ3JpZC4gIFRoaXMgbW9kdWxlIGNyZWF0ZXMgaGVhZGVyIGZpbHRlciBjb250cm9scyBmb3IgZWFjaCBjb2x1bW4gdGhhdCBoYXMgXG4gKiBhIGBoYXNGaWx0ZXJgIGF0dHJpYnV0ZSBzZXQgdG8gYHRydWVgLlxuICogXG4gKiBDbGFzcyBzdWJzY3JpYmVzIHRvIHRoZSBgcmVuZGVyYCBldmVudCB0byB1cGRhdGUgdGhlIGZpbHRlciBjb250cm9sIHdoZW4gdGhlIGdyaWQgaXMgcmVuZGVyZWQuICBJdCBhbHNvIGNhbGxzIHRoZSBjaGFpbiBcbiAqIGV2ZW50IGByZW1vdGVQYXJhbXNgIHRvIGNvbXBpbGUgYSBsaXN0IG9mIHBhcmFtZXRlcnMgdG8gYmUgcGFzc2VkIHRvIHRoZSByZW1vdGUgZGF0YSBzb3VyY2Ugd2hlbiB1c2luZyByZW1vdGUgcHJvY2Vzc2luZy5cbiAqL1xuY2xhc3MgRmlsdGVyTW9kdWxlIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IGZpbHRlciBtb2R1bGUgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgR3JpZCBjb250ZXh0LlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy5oZWFkZXJGaWx0ZXJzID0gW107XG4gICAgICAgIHRoaXMuZ3JpZEZpbHRlcnMgPSBbXTtcbiAgICB9XG5cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICBpZiAodGhpcy5jb250ZXh0LnNldHRpbmdzLnJlbW90ZVByb2Nlc3NpbmcpIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5ldmVudHMuc3Vic2NyaWJlKFwicmVtb3RlUGFyYW1zXCIsIHRoaXMucmVtb3RlUGFyYW1zLCB0cnVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5ldmVudHMuc3Vic2NyaWJlKFwicmVuZGVyXCIsIHRoaXMucmVuZGVyTG9jYWwsIGZhbHNlLCA4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2luaXQoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGBIZWFkZXJGaWx0ZXJgIENsYXNzIGZvciBncmlkIGNvbHVtbnMgd2l0aCBhIGBoYXNGaWx0ZXJgIGF0dHJpYnV0ZSBvZiBgdHJ1ZWAuXG4gICAgICovXG4gICAgX2luaXQoKSB7XG4gICAgICAgIGZvciAoY29uc3QgY29sIG9mIHRoaXMuY29udGV4dC5jb2x1bW5NYW5hZ2VyLmNvbHVtbnMpIHtcbiAgICAgICAgICAgIGlmICghY29sLmhhc0ZpbHRlcikgY29udGludWU7XG5cbiAgICAgICAgICAgIGlmIChjb2wuZmlsdGVyRWxlbWVudCA9PT0gXCJtdWx0aVwiKSB7XG4gICAgICAgICAgICAgICAgY29sLmhlYWRlckZpbHRlciA9IG5ldyBFbGVtZW50TXVsdGlTZWxlY3QoY29sLCB0aGlzLmNvbnRleHQpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjb2wuZmlsdGVyRWxlbWVudCA9PT0gXCJiZXR3ZWVuXCIpIHtcbiAgICAgICAgICAgICAgICBjb2wuaGVhZGVyRmlsdGVyID0gbmV3IEVsZW1lbnRCZXR3ZWVuKGNvbCwgdGhpcy5jb250ZXh0KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY29sLmZpbHRlckVsZW1lbnQgPT09IFwic2VsZWN0XCIpIHtcbiAgICAgICAgICAgICAgICBjb2wuaGVhZGVyRmlsdGVyID0gbmV3IEVsZW1lbnRTZWxlY3QoY29sLCB0aGlzLmNvbnRleHQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb2wuaGVhZGVyRmlsdGVyID0gbmV3IEVsZW1lbnRJbnB1dChjb2wsIHRoaXMuY29udGV4dCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbC5oZWFkZXJDZWxsLmVsZW1lbnQuYXBwZW5kQ2hpbGQoY29sLmhlYWRlckZpbHRlci5lbGVtZW50KTtcbiAgICAgICAgICAgIHRoaXMuaGVhZGVyRmlsdGVycy5wdXNoKGNvbC5oZWFkZXJGaWx0ZXIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENvbXBpbGVzIGhlYWRlciBhbmQgZ3JpZCBmaWx0ZXIgdmFsdWVzIGludG8gYSBzaW5nbGUgb2JqZWN0IG9mIGtleS92YWx1ZSBwYWlycyB0aGF0IGNhbiBiZSB1c2VkIHRvIHNlbmQgdG8gdGhlIHJlbW90ZSBkYXRhIHNvdXJjZS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIE9iamVjdCBvZiBrZXkvdmFsdWUgcGFpcnMgdG8gYmUgc2VudCB0byB0aGUgcmVtb3RlIGRhdGEgc291cmNlLlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIG1vZGlmaWVkIHBhcmFtcyBvYmplY3Qgd2l0aCBmaWx0ZXIgdmFsdWVzIGFkZGVkLlxuICAgICAqL1xuICAgIHJlbW90ZVBhcmFtcyA9IChwYXJhbXMpID0+IHtcbiAgICAgICAgdGhpcy5oZWFkZXJGaWx0ZXJzLmZvckVhY2goKGYpID0+IHtcbiAgICAgICAgICAgIGlmIChmLnZhbHVlICE9PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgcGFyYW1zW2YuZmllbGRdID0gZi52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHRoaXMuZ3JpZEZpbHRlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHRoaXMuZ3JpZEZpbHRlcnMpIHtcbiAgICAgICAgICAgICAgICBwYXJhbXNbaXRlbS5maWVsZF0gPSBpdGVtLnZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHBhcmFtcztcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIENvbnZlcnQgdmFsdWUgdHlwZSB0byBjb2x1bW4gdHlwZS4gIElmIHZhbHVlIGNhbm5vdCBiZSBjb252ZXJ0ZWQsIGBudWxsYCBpcyByZXR1cm5lZC5cbiAgICAgKiBAcGFyYW0ge29iamVjdCB8IHN0cmluZyB8IG51bWJlcn0gdmFsdWUgUmF3IGZpbHRlciB2YWx1ZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBGaWVsZCB0eXBlLlxuICAgICAqIEByZXR1cm5zIHtudW1iZXIgfCBEYXRlIHwgc3RyaW5nIHwgbnVsbCB8IE9iamVjdH0gaW5wdXQgdmFsdWUgb3IgYG51bGxgIGlmIGVtcHR5LlxuICAgICAqL1xuICAgIGNvbnZlcnRUb1R5cGUodmFsdWUsIHR5cGUpIHtcbiAgICAgICAgaWYgKHZhbHVlID09PSBcIlwiIHx8IHZhbHVlID09PSBudWxsKSByZXR1cm4gdmFsdWU7XG5cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgICBpZiAodHlwZSA9PT0gXCJkYXRlXCIgfHwgdHlwZSA9PT0gXCJkYXRldGltZVwiKSAgeyBcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSB2YWx1ZS5tYXAoKHYpID0+IERhdGVIZWxwZXIucGFyc2VEYXRlKHYpKTsgXG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0LmluY2x1ZGVzKFwiXCIpID8gbnVsbCA6IHJlc3VsdDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGUgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZTEgPSB0aGlzLmNvbnZlcnRUb1R5cGUodmFsdWVbMF0sIHR5cGUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlMiA9IHRoaXMuY29udmVydFRvVHlwZSh2YWx1ZVsxXSwgdHlwZSk7ICBcblxuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTEgPT09IG51bGwgfHwgdmFsdWUyID09PSBudWxsID8gbnVsbCA6IFt2YWx1ZTEsIHZhbHVlMl07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IE51bWJlcih2YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm4gTnVtYmVyLmlzTmFOKHZhbHVlKSA/IG51bGwgOiB2YWx1ZTtcbiAgICAgICAgfSBcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlID09PSBcImRhdGVcIiB8fCB0eXBlID09PSBcImRhdGV0aW1lXCIpIHtcbiAgICAgICAgICAgIHZhbHVlID0gRGF0ZUhlbHBlci5wYXJzZURhdGVPbmx5KHZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZSA9PT0gXCJcIiA/IG51bGwgOiB2YWx1ZTtcbiAgICAgICAgfSBcbiAgICAgICAgLy9hc3N1bWluZyBpdCdzIGEgc3RyaW5nIHZhbHVlIG9yIE9iamVjdCBhdCB0aGlzIHBvaW50LlxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFdyYXBzIHRoZSBmaWx0ZXIgaW5wdXQgdmFsdWUgaW4gYSBgRmlsdGVyVGFyZ2V0YCBvYmplY3QsIHdoaWNoIGRlZmluZXMgYSBzaW5nbGUgZmlsdGVyIGNvbmRpdGlvbiBmb3IgYSBjb2x1bW4uXG4gICAgICogQHBhcmFtIHtzdHJpbmcgfCBEYXRlIHwgbnVtYmVyIHwgT2JqZWN0fSB2YWx1ZSBGaWx0ZXIgdmFsdWUgdG8gYXBwbHkgdG8gdGhlIGNvbHVtbi5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmllbGQgVGhlIGZpZWxkIG5hbWUgb2YgdGhlIGNvbHVtbiBiZWluZyBmaWx0ZXJlZC4gVGhpcyBpcyB1c2VkIHRvIGlkZW50aWZ5IHRoZSBjb2x1bW4gaW4gdGhlIGRhdGEgc2V0LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nIHwgRnVuY3Rpb259IGZpbHRlclR5cGUgVGhlIHR5cGUgb2YgZmlsdGVyIHRvIGFwcGx5IChlLmcuLCBcImVxdWFsc1wiLCBcImxpa2VcIiwgXCI8XCIsIFwiPD1cIiwgXCI+XCIsIFwiPj1cIiwgXCIhPVwiLCBcImJldHdlZW5cIiwgXCJpblwiKS5cbiAgICAgKiBDYW4gYWxzbyBiZSBhIGZ1bmN0aW9uLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmaWVsZFR5cGUgVGhlIHR5cGUgb2YgZmllbGQgYmVpbmcgZmlsdGVyZWQgKGUuZy4sIFwic3RyaW5nXCIsIFwibnVtYmVyXCIsIFwiZGF0ZVwiLCBcIm9iamVjdFwiKS5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGZpbHRlcklzRnVuY3Rpb24gSW5kaWNhdGVzIGlmIHRoZSBmaWx0ZXIgdHlwZSBpcyBhIGZ1bmN0aW9uLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBmaWx0ZXJQYXJhbXMgT3B0aW9uYWwgcGFyYW1ldGVycyB0byBwYXNzIHRvIHRoZSBmaWx0ZXIgZnVuY3Rpb24uXG4gICAgICogQHJldHVybnMge0ZpbHRlclRhcmdldCB8IEZpbHRlckRhdGUgfCBGaWx0ZXJGdW5jdGlvbiB8IG51bGx9IFJldHVybnMgYSBmaWx0ZXIgdGFyZ2V0IG9iamVjdCB0aGF0IGRlZmluZXMgYSBzaW5nbGUgZmlsdGVyIGNvbmRpdGlvbiBmb3IgYSBjb2x1bW4sIFxuICAgICAqIG9yIG51bGwgaWYgdGhlIHZhbHVlIGNhbm5vdCBiZSBjb252ZXJ0ZWQgdG8gdGhlIGZpZWxkIHR5cGUuIFxuICAgICAqL1xuICAgIGNyZWF0ZUZpbHRlclRhcmdldCh2YWx1ZSwgZmllbGQsIGZpbHRlclR5cGUsIGZpZWxkVHlwZSwgZmlsdGVySXNGdW5jdGlvbiwgZmlsdGVyUGFyYW1zKSB7IFxuICAgICAgICBpZiAoZmlsdGVySXNGdW5jdGlvbikgeyBcbiAgICAgICAgICAgIHJldHVybiBuZXcgRmlsdGVyRnVuY3Rpb24oeyB2YWx1ZTogdmFsdWUsIGZpZWxkOiBmaWVsZCwgZmlsdGVyVHlwZTogZmlsdGVyVHlwZSwgcGFyYW1zOiBmaWx0ZXJQYXJhbXMgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjb252ZXJ0ZWRWYWx1ZSA9IHRoaXMuY29udmVydFRvVHlwZSh2YWx1ZSwgZmllbGRUeXBlKTtcblxuICAgICAgICBpZiAoY29udmVydGVkVmFsdWUgPT09IG51bGwpIHJldHVybiBudWxsO1xuXG4gICAgICAgIGlmIChmaWVsZFR5cGUgPT09IFwiZGF0ZVwiIHx8IGZpZWxkVHlwZSA9PT0gXCJkYXRldGltZVwiKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEZpbHRlckRhdGUoeyB2YWx1ZTogY29udmVydGVkVmFsdWUsIGZpZWxkOiBmaWVsZCwgZmlsdGVyVHlwZTogZmlsdGVyVHlwZSB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgRmlsdGVyVGFyZ2V0KHsgdmFsdWU6IGNvbnZlcnRlZFZhbHVlLCBmaWVsZDogZmllbGQsIGZpZWxkVHlwZTogZmllbGRUeXBlLCBmaWx0ZXJUeXBlOiBmaWx0ZXJUeXBlIH0pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDb21waWxlcyBhbiBhcnJheSBvZiBmaWx0ZXIgdHlwZSBvYmplY3RzIHRoYXQgY29udGFpbiBhIGZpbHRlciB2YWx1ZSB0aGF0IG1hdGNoZXMgaXRzIGNvbHVtbiB0eXBlLiAgQ29sdW1uIHR5cGUgbWF0Y2hpbmcgXG4gICAgICogaXMgbmVjZXNzYXJ5IHdoZW4gcHJvY2Vzc2luZyBkYXRhIGxvY2FsbHksIHNvIHRoYXQgZmlsdGVyIHZhbHVlIG1hdGNoZXMgYXNzb2NpYXRlZCByb3cgdHlwZSB2YWx1ZSBmb3IgY29tcGFyaXNvbi5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IGFycmF5IG9mIGZpbHRlciB0eXBlIG9iamVjdHMgd2l0aCB2YWxpZCB2YWx1ZS5cbiAgICAgKi9cbiAgICBjb21waWxlRmlsdGVycygpIHtcbiAgICAgICAgbGV0IHJlc3VsdHMgPSBbXTtcblxuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgdGhpcy5oZWFkZXJGaWx0ZXJzKSB7XG4gICAgICAgICAgICBpZiAoaXRlbS52YWx1ZSA9PT0gXCJcIikgY29udGludWU7XG5cbiAgICAgICAgICAgIGNvbnN0IGZpbHRlciA9IHRoaXMuY3JlYXRlRmlsdGVyVGFyZ2V0KGl0ZW0udmFsdWUsIGl0ZW0uZmllbGQsIGl0ZW0uZmlsdGVyVHlwZSwgaXRlbS5maWVsZFR5cGUsIGl0ZW0uZmlsdGVySXNGdW5jdGlvbiwgaXRlbT8uZmlsdGVyUGFyYW1zKTtcblxuICAgICAgICAgICAgaWYgKGZpbHRlciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChmaWx0ZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZ3JpZEZpbHRlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHMuY29uY2F0KHRoaXMuZ3JpZEZpbHRlcnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFVzZSB0YXJnZXQgZmlsdGVycyB0byBjcmVhdGUgYSBuZXcgZGF0YSBzZXQgaW4gdGhlIHBlcnNpc3RlbmNlIGRhdGEgcHJvdmlkZXIuXG4gICAgICogQHBhcmFtIHtBcnJheTxGaWx0ZXJUYXJnZXQ+fSB0YXJnZXRzIEFycmF5IG9mIEZpbHRlclRhcmdldCBvYmplY3RzLlxuICAgICAqL1xuICAgIGFwcGx5RmlsdGVycyh0YXJnZXRzKSB7XG4gICAgICAgIHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5kYXRhID0gW107XG4gICAgICAgIHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5kYXRhQ2FjaGUuZm9yRWFjaCgocm93KSA9PiB7XG4gICAgICAgICAgICBsZXQgbWF0Y2ggPSB0cnVlO1xuXG4gICAgICAgICAgICBmb3IgKGxldCBpdGVtIG9mIHRhcmdldHMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByb3dWYWwgPSB0aGlzLmNvbnZlcnRUb1R5cGUocm93W2l0ZW0uZmllbGRdLCBpdGVtLmZpZWxkVHlwZSk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gaXRlbS5leGVjdXRlKHJvd1ZhbCwgcm93KTtcblxuICAgICAgICAgICAgICAgIGlmICghcmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgIG1hdGNoID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQucGVyc2lzdGVuY2UuZGF0YS5wdXNoKHJvdyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZW5kZXJzIHRoZSBsb2NhbCBkYXRhIHNldCBieSBhcHBseWluZyB0aGUgY29tcGlsZWQgZmlsdGVycyB0byB0aGUgcGVyc2lzdGVuY2UgZGF0YSBwcm92aWRlci5cbiAgICAgKi9cbiAgICByZW5kZXJMb2NhbCA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgdGFyZ2V0cyA9IHRoaXMuY29tcGlsZUZpbHRlcnMoKTtcblxuICAgICAgICBpZiAoT2JqZWN0LmtleXModGFyZ2V0cykubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhpcy5hcHBseUZpbHRlcnModGFyZ2V0cyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQucGVyc2lzdGVuY2UucmVzdG9yZURhdGEoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogUHJvdmlkZXMgYSBtZWFucyB0byBhcHBseSBhIGNvbmRpdGlvbiBvdXRzaWRlIHRoZSBoZWFkZXIgZmlsdGVyIGNvbnRyb2xzLiAgV2lsbCBhZGQgY29uZGl0aW9uXG4gICAgICogdG8gZ3JpZCdzIGBncmlkRmlsdGVyc2AgY29sbGVjdGlvbiwgYW5kIHJhaXNlIGByZW5kZXJgIGV2ZW50IHRvIGZpbHRlciBkYXRhIHNldC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmllbGQgZmllbGQgbmFtZS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gdmFsdWUgdmFsdWUuXG4gICAgICogQHBhcmFtIHtzdHJpbmcgfCBGdW5jdGlvbn0gdHlwZSBjb25kaXRpb24gdHlwZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW2ZpZWxkVHlwZT1cInN0cmluZ1wiXSBmaWVsZCB0eXBlLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbZmlsdGVyUGFyYW1zPXt9XSBhZGRpdGlvbmFsIGZpbHRlciBwYXJhbWV0ZXJzLlxuICAgICAqL1xuICAgIHNldEZpbHRlcihmaWVsZCwgdmFsdWUsIHR5cGUgPSBcImVxdWFsc1wiLCBmaWVsZFR5cGUgPSBcInN0cmluZ1wiLCBmaWx0ZXJQYXJhbXMgPSB7fSkge1xuICAgICAgICBjb25zdCBjb252ZXJ0ZWRWYWx1ZSA9IHRoaXMuY29udmVydFRvVHlwZSh2YWx1ZSwgZmllbGRUeXBlKTtcblxuICAgICAgICBpZiAodGhpcy5ncmlkRmlsdGVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuZ3JpZEZpbHRlcnMuZmluZEluZGV4KChpKSA9PiBpLmZpZWxkID09PSBmaWVsZCk7XG4gICAgICAgICAgICAvL0lmIGZpZWxkIGFscmVhZHkgZXhpc3RzLCBqdXN0IHVwZGF0ZSB0aGUgdmFsdWUuXG4gICAgICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZ3JpZEZpbHRlcnNbaW5kZXhdLnZhbHVlID0gY29udmVydGVkVmFsdWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZmlsdGVyID0gdGhpcy5jcmVhdGVGaWx0ZXJUYXJnZXQoY29udmVydGVkVmFsdWUsIGZpZWxkLCB0eXBlLCBmaWVsZFR5cGUsICh0eXBlb2YgdHlwZSA9PT0gXCJmdW5jdGlvblwiKSwgZmlsdGVyUGFyYW1zKTtcbiAgICAgICAgdGhpcy5ncmlkRmlsdGVycy5wdXNoKGZpbHRlcik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgZmlsdGVyIGNvbmRpdGlvbiBmcm9tIGdyaWQncyBgZ3JpZEZpbHRlcnNgIGNvbGxlY3Rpb24uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZpZWxkIGZpZWxkIG5hbWUuXG4gICAgICovXG4gICAgcmVtb3ZlRmlsdGVyKGZpZWxkKSB7XG4gICAgICAgIHRoaXMuZ3JpZEZpbHRlcnMgPSB0aGlzLmdyaWRGaWx0ZXJzLmZpbHRlcihmID0+IGYuZmllbGQgIT09IGZpZWxkKTtcbiAgICB9XG59XG5cbkZpbHRlck1vZHVsZS5tb2R1bGVOYW1lID0gXCJmaWx0ZXJcIjtcblxuZXhwb3J0IHsgRmlsdGVyTW9kdWxlIH07IiwiY2xhc3MgUGFnZXJCdXR0b25zIHtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHN0YXJ0IGJ1dHRvbiBmb3IgcGFnZXIgZWxlbWVudC5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gY3VycmVudFBhZ2UgQ3VycmVudCBwYWdlLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIEJ1dHRvbiBjbGljayBoYW5kbGVyLlxuICAgICAqIEByZXR1cm5zIHtIVE1MTGlua0VsZW1lbnR9XG4gICAgICovXG4gICAgc3RhdGljIHN0YXJ0KGN1cnJlbnRQYWdlLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcbiAgICAgICAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcblxuICAgICAgICBsaS5hcHBlbmQoYnRuKTtcbiAgICAgICAgYnRuLmlubmVySFRNTCA9IFwiJmxzYXF1bztcIjtcbiAgICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBjYWxsYmFjayk7XG5cbiAgICAgICAgaWYgKGN1cnJlbnRQYWdlID4gMSkge1xuICAgICAgICAgICAgYnRuLmRhdGFzZXQucGFnZSA9IFwiMVwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYnRuLnRhYkluZGV4ID0gLTE7XG4gICAgICAgICAgICBidG4uZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgICAgICAgbGkuY2xhc3NOYW1lID0gXCJkaXNhYmxlZFwiO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGxpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGVuZCBidXR0b24gZm9yIHBhZ2VyIGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHRvdGFsUGFnZXMgbGFzdCBwYWdlIG51bWJlciBpbiBncm91cCBzZXQuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGN1cnJlbnRQYWdlIGN1cnJlbnQgcGFnZS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBidXR0b24gY2xpY2sgaGFuZGxlci5cbiAgICAgKiBAcmV0dXJucyB7SFRNTExJRWxlbWVudH1cbiAgICAgKi9cbiAgICBzdGF0aWMgZW5kKHRvdGFsUGFnZXMsIGN1cnJlbnRQYWdlLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcbiAgICAgICAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcblxuICAgICAgICBsaS5hcHBlbmQoYnRuKTtcbiAgICAgICAgYnRuLmlubmVySFRNTCA9IFwiJnJzYXF1bztcIjtcbiAgICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBjYWxsYmFjayk7XG5cbiAgICAgICAgaWYgKGN1cnJlbnRQYWdlIDwgdG90YWxQYWdlcykge1xuICAgICAgICAgICAgYnRuLmRhdGFzZXQucGFnZSA9IHRvdGFsUGFnZXM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBidG4udGFiSW5kZXggPSAtMTtcbiAgICAgICAgICAgIGJ0bi5kaXNhYmxlZCA9IHRydWU7XG4gICAgICAgICAgICBsaS5jbGFzc05hbWUgPSBcImRpc2FibGVkXCI7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbGk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgcGFnZXIgYnV0dG9uIGZvciBhc3NvY2lhdGVkIHBhZ2UuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHBhZ2UgcGFnZSBudW1iZXIuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGN1cnJlbnRQYWdlIGN1cnJlbnQgcGFnZS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBidXR0b24gY2xpY2sgaGFuZGxlci5cbiAgICAgKiBAcmV0dXJucyB7SFRNTExJRWxlbWVudH1cbiAgICAgKi9cbiAgICBzdGF0aWMgcGFnZU51bWJlcihwYWdlLCBjdXJyZW50UGFnZSwgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XG4gICAgICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG5cbiAgICAgICAgbGkuYXBwZW5kKGJ0bik7XG4gICAgICAgIGJ0bi5pbm5lclRleHQgPSBwYWdlO1xuICAgICAgICBidG4uZGF0YXNldC5wYWdlID0gcGFnZTtcbiAgICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBjYWxsYmFjayk7XG5cbiAgICAgICAgaWYgKHBhZ2UgPT09IGN1cnJlbnRQYWdlKSB7XG4gICAgICAgICAgICBsaS5jbGFzc05hbWUgPSBcImFjdGl2ZVwiO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGxpO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgUGFnZXJCdXR0b25zIH07IiwiaW1wb3J0IHsgUGFnZXJCdXR0b25zIH0gZnJvbSBcIi4vcGFnZXJCdXR0b25zLmpzXCI7XG4vKipcbiAqIEZvcm1hdHMgZ3JpZCdzIHJvd3MgYXMgYSBzZXJpZXMgb2YgcGFnZXMgcmF0aGVyIHRoYXQgYSBzY3JvbGxpbmcgbGlzdC4gIElmIHBhZ2luZyBpcyBub3QgZGVzaXJlZCwgcmVnaXN0ZXIgdGhlIGBSb3dNb2R1bGVgIGluc3RlYWQuXG4gKiBcbiAqIENsYXNzIHN1YnNjcmliZXMgdG8gdGhlIGByZW5kZXJgIGV2ZW50IHRvIHVwZGF0ZSB0aGUgcGFnZXIgY29udHJvbCB3aGVuIHRoZSBncmlkIGlzIHJlbmRlcmVkLiAgSXQgYWxzbyBjYWxscyB0aGUgY2hhaW4gZXZlbnQgXG4gKiBgcmVtb3RlUGFyYW1zYCB0byBjb21waWxlIGEgbGlzdCBvZiBwYXJhbWV0ZXJzIHRvIGJlIHBhc3NlZCB0byB0aGUgcmVtb3RlIGRhdGEgc291cmNlIHdoZW4gdXNpbmcgcmVtb3RlIHByb2Nlc3NpbmcuXG4gKi9cbmNsYXNzIFBhZ2VyTW9kdWxlIHtcbiAgICAvKipcbiAgICAgKiBGb3JtYXRzIGdyaWQncyByb3dzIGFzIGEgc2VyaWVzIG9mIHBhZ2VzIHJhdGhlciB0aGF0IGEgc2Nyb2xsaW5nIGxpc3QuICBNb2R1bGUgY2FuIGJlIHVzZWQgd2l0aCBib3RoIGxvY2FsIGFuZCByZW1vdGUgZGF0YSBzb3VyY2VzLiAgXG4gICAgICogQHBhcmFtIHtHcmlkQ29udGV4dH0gY29udGV4dCBHcmlkIGNvbnRleHQuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29udGV4dCkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLnRvdGFsUm93cyA9IHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5yb3dDb3VudDtcbiAgICAgICAgdGhpcy5wYWdlc1RvRGlzcGxheSA9IHRoaXMuY29udGV4dC5zZXR0aW5ncy5wYWdlclBhZ2VzVG9EaXNwbGF5O1xuICAgICAgICB0aGlzLnJvd3NQZXJQYWdlID0gdGhpcy5jb250ZXh0LnNldHRpbmdzLnBhZ2VyUm93c1BlclBhZ2U7XG4gICAgICAgIHRoaXMuY3VycmVudFBhZ2UgPSAxO1xuICAgICAgICAvL2NyZWF0ZSBkaXYgY29udGFpbmVyIGZvciBwYWdlclxuICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHRoaXMuZWxQYWdlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ1bFwiKTtcblxuICAgICAgICB0aGlzLmNvbnRhaW5lci5pZCA9IGAke3RoaXMuY29udGV4dC5zZXR0aW5ncy5iYXNlSWROYW1lfV9wYWdlcmA7XG4gICAgICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTmFtZSA9IHRoaXMuY29udGV4dC5zZXR0aW5ncy5wYWdlckNzcztcbiAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kKHRoaXMuZWxQYWdlcik7XG4gICAgICAgIHRoaXMuY29udGV4dC5ncmlkLnRhYmxlLmluc2VydEFkamFjZW50RWxlbWVudChcImFmdGVyZW5kXCIsIHRoaXMuY29udGFpbmVyKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2V0cyBoYW5kbGVyIGV2ZW50cyBmb3IgcmVuZGVyaW5nL3VwZGF0aW5nIGdyaWQgYm9keSByb3dzIGFuZCBwYWdlciBjb250cm9sLlxuICAgICAqL1xuICAgIGluaXRpYWxpemUoKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVtb3RlUHJvY2Vzc2luZykge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LmV2ZW50cy5zdWJzY3JpYmUoXCJyZW5kZXJcIiwgdGhpcy5yZW5kZXJSZW1vdGUsIHRydWUsIDEwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5ldmVudHMuc3Vic2NyaWJlKFwicmVuZGVyXCIsIHRoaXMucmVuZGVyTG9jYWwsIGZhbHNlLCAxMCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgdG90YWwgbnVtYmVyIG9mIHBvc3NpYmxlIHBhZ2VzIGJhc2VkIG9uIHRoZSB0b3RhbCByb3dzLCBhbmQgcm93cyBwZXIgcGFnZSBzZXR0aW5nLlxuICAgICAqIEByZXR1cm5zIHtOdW1iZXJ9XG4gICAgICovXG4gICAgdG90YWxQYWdlcygpIHtcbiAgICAgICAgY29uc3QgdG90YWxSb3dzID0gaXNOYU4odGhpcy50b3RhbFJvd3MpID8gMSA6IHRoaXMudG90YWxSb3dzO1xuXG4gICAgICAgIHJldHVybiB0aGlzLnJvd3NQZXJQYWdlID09PSAwID8gMSA6IE1hdGguY2VpbCh0b3RhbFJvd3MgLyB0aGlzLnJvd3NQZXJQYWdlKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIHZhbGlkYXRlZCBwYWdlIG51bWJlciBpbnB1dCBieSBtYWtpbmcgc3VyZSB2YWx1ZSBpcyBudW1lcmljLCBhbmQgd2l0aGluIHRoZSBib3VuZHMgb2YgdGhlIHRvdGFsIHBhZ2VzLiAgXG4gICAgICogQW4gaW52YWxpZCBpbnB1dCB3aWxsIHJldHVybiBhIHZhbHVlIG9mIDEuXG4gICAgICogQHBhcmFtIHtzdHJpbmcgfCBudW1iZXJ9IGN1cnJlbnRQYWdlIFBhZ2UgbnVtYmVyIHRvIHZhbGlkYXRlLlxuICAgICAqIEByZXR1cm5zIHtOdW1iZXJ9IFJldHVybnMgYSB2YWxpZCBwYWdlIG51bWJlciBiZXR3ZWVuIDEgYW5kIHRoZSB0b3RhbCBudW1iZXIgb2YgcGFnZXMuICBJZiB0aGUgaW5wdXQgaXMgaW52YWxpZCwgcmV0dXJucyAxLlxuICAgICAqL1xuICAgIHZhbGlkYXRlUGFnZShjdXJyZW50UGFnZSkge1xuICAgICAgICBpZiAoIU51bWJlci5pc0ludGVnZXIoY3VycmVudFBhZ2UpKSB7XG4gICAgICAgICAgICBjdXJyZW50UGFnZSA9IHBhcnNlSW50KGN1cnJlbnRQYWdlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRvdGFsID0gdGhpcy50b3RhbFBhZ2VzKCk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRvdGFsIDwgY3VycmVudFBhZ2UgPyB0b3RhbCA6IGN1cnJlbnRQYWdlO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQgPD0gMCA/IDEgOiByZXN1bHQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGZpcnN0IHBhZ2UgbnVtYmVyIHRvIGRpc3BsYXkgaW4gdGhlIGJ1dHRvbiBjb250cm9sIHNldCBiYXNlZCBvbiB0aGUgcGFnZSBudW1iZXIgcG9zaXRpb24gaW4gdGhlIGRhdGFzZXQuICBcbiAgICAgKiBQYWdlIG51bWJlcnMgb3V0c2lkZSBvZiB0aGlzIHJhbmdlIGFyZSByZXByZXNlbnRlZCBieSBhbiBhcnJvdy5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gY3VycmVudFBhZ2UgQ3VycmVudCBwYWdlIG51bWJlci5cbiAgICAgKiBAcmV0dXJucyB7TnVtYmVyfVxuICAgICAqL1xuICAgIGZpcnN0RGlzcGxheVBhZ2UoY3VycmVudFBhZ2UpIHtcbiAgICAgICAgY29uc3QgbWlkZGxlID0gTWF0aC5mbG9vcih0aGlzLnBhZ2VzVG9EaXNwbGF5IC8gMiArIHRoaXMucGFnZXNUb0Rpc3BsYXkgJSAyKTtcblxuICAgICAgICBpZiAoY3VycmVudFBhZ2UgPCBtaWRkbGUpIHJldHVybiAxO1xuXG4gICAgICAgIGlmICh0aGlzLnRvdGFsUGFnZXMoKSA8IChjdXJyZW50UGFnZSArIHRoaXMucGFnZXNUb0Rpc3BsYXkgLSBtaWRkbGUpKSB7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5tYXgodGhpcy50b3RhbFBhZ2VzKCkgLSB0aGlzLnBhZ2VzVG9EaXNwbGF5ICsgMSwgMSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VycmVudFBhZ2UgLSBtaWRkbGUgKyAxO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIHRoZSBodG1sIGxpc3QgaXRlbSBhbmQgYnV0dG9uIGVsZW1lbnRzIGZvciB0aGUgcGFnZXIgY29udGFpbmVyJ3MgdWwgZWxlbWVudC4gIFdpbGwgYWxzbyBzZXQgdGhlIFxuICAgICAqIGB0aGlzLmN1cnJlbnRQYWdlYCBwcm9wZXJ0eSB0byB0aGUgY3VycmVudCBwYWdlIG51bWJlci5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gY3VycmVudFBhZ2UgQ3VycmVudCBwYWdlIG51bWJlci4gIEFzc3VtZXMgYSB2YWxpZCBwYWdlIG51bWJlciBpcyBwcm92aWRlZC5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBCdXR0b24gY2xpY2sgaGFuZGxlci5cbiAgICAgKi9cbiAgICByZW5kZXIoY3VycmVudFBhZ2UsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IHRvdGFsUGFnZXMgPSB0aGlzLnRvdGFsUGFnZXMoKTtcbiAgICAgICAgLy8gQ2xlYXIgdGhlIHByaW9yIGxpIGVsZW1lbnRzLlxuICAgICAgICB0aGlzLmVsUGFnZXIucmVwbGFjZUNoaWxkcmVuKCk7XG5cbiAgICAgICAgaWYgKHRvdGFsUGFnZXMgPD0gMSkgcmV0dXJuO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgZmlyc3REaXNwbGF5ID0gdGhpcy5maXJzdERpc3BsYXlQYWdlKGN1cnJlbnRQYWdlKTtcbiAgICAgICAgY29uc3QgbWF4UGFnZXMgPSBmaXJzdERpc3BsYXkgKyB0aGlzLnBhZ2VzVG9EaXNwbGF5O1xuICAgICAgICBcbiAgICAgICAgdGhpcy5jdXJyZW50UGFnZSA9IGN1cnJlbnRQYWdlO1xuICAgICAgICB0aGlzLmVsUGFnZXIuYXBwZW5kQ2hpbGQoUGFnZXJCdXR0b25zLnN0YXJ0KGN1cnJlbnRQYWdlLCBjYWxsYmFjaykpO1xuXG4gICAgICAgIGZvciAobGV0IHBhZ2UgPSBmaXJzdERpc3BsYXk7IHBhZ2UgPD0gdG90YWxQYWdlcyAmJiBwYWdlIDwgbWF4UGFnZXM7IHBhZ2UrKykge1xuICAgICAgICAgICAgdGhpcy5lbFBhZ2VyLmFwcGVuZENoaWxkKFBhZ2VyQnV0dG9ucy5wYWdlTnVtYmVyKHBhZ2UsIGN1cnJlbnRQYWdlLCBjYWxsYmFjaykpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5lbFBhZ2VyLmFwcGVuZENoaWxkKFBhZ2VyQnV0dG9ucy5lbmQodG90YWxQYWdlcywgY3VycmVudFBhZ2UsIGNhbGxiYWNrKSk7XG4gICAgfVxuXG4gICAgaGFuZGxlUGFnaW5nID0gYXN5bmMgKGUpID0+IHtcbiAgICAgICAgY29uc3QgdmFsaWRQYWdlID0geyBwYWdlOiB0aGlzLnZhbGlkYXRlUGFnZShlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5wYWdlKSB9O1xuXG4gICAgICAgIGlmICh0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVtb3RlUHJvY2Vzc2luZykge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5yZW5kZXJSZW1vdGUodmFsaWRQYWdlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyTG9jYWwodmFsaWRQYWdlKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogSGFuZGxlciBmb3IgcmVuZGVyaW5nIHJvd3MgdXNpbmcgbG9jYWwgZGF0YSBzb3VyY2UuICBXaWxsIHNsaWNlIHRoZSBkYXRhIGFycmF5IGJhc2VkIG9uIHRoZSBjdXJyZW50IHBhZ2UgYW5kIHJvd3MgcGVyIHBhZ2Ugc2V0dGluZ3MsXG4gICAgICogdGhlbiBjYWxsIGByZW5kZXJgIHRvIHVwZGF0ZSB0aGUgcGFnZXIgY29udHJvbC4gIE9wdGlvbmFsIGFyZ3VtZW50IGBwYXJhbXNgIGlzIGFuIG9iamVjdCB0aGF0IGNhbiBjb250YWluIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAgICAgKiAqIGBwYWdlYDpQYWdlIG51bWJlciB0byByZW5kZXIuICBJZiBub3QgcHJvdmlkZWQsIGRlZmF1bHRzIHRvIDEuXG4gICAgICogQHBhcmFtIHt7IHBhZ2U6IG51bWJlciB9IHwgbnVsbH0gcGFyYW1zIFxuICAgICAqL1xuICAgIHJlbmRlckxvY2FsID0gKHBhcmFtcyA9IHt9KSA9PiB7XG4gICAgICAgIGNvbnN0IHBhZ2UgPSAhcGFyYW1zLnBhZ2UgPyAxIDogdGhpcy52YWxpZGF0ZVBhZ2UocGFyYW1zLnBhZ2UpO1xuICAgICAgICBjb25zdCBiZWdpbiA9IChwYWdlIC0gMSkgKiB0aGlzLnJvd3NQZXJQYWdlO1xuICAgICAgICBjb25zdCBlbmQgPSBiZWdpbiArIHRoaXMucm93c1BlclBhZ2U7XG4gICAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLmNvbnRleHQucGVyc2lzdGVuY2UuZGF0YS5zbGljZShiZWdpbiwgZW5kKTtcblxuICAgICAgICB0aGlzLmNvbnRleHQuZ3JpZC5yZW5kZXJSb3dzKGRhdGEsIHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5yb3dDb3VudCk7XG4gICAgICAgIHRoaXMudG90YWxSb3dzID0gdGhpcy5jb250ZXh0LnBlcnNpc3RlbmNlLnJvd0NvdW50O1xuICAgICAgICB0aGlzLnJlbmRlcihwYWdlLCB0aGlzLmhhbmRsZVBhZ2luZyk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBIYW5kbGVyIGZvciByZW5kZXJpbmcgcm93cyB1c2luZyByZW1vdGUgZGF0YSBzb3VyY2UuICBXaWxsIGNhbGwgdGhlIGBkYXRhbG9hZGVyYCB0byByZXF1ZXN0IGRhdGEgYmFzZWQgb24gdGhlIHByb3ZpZGVkIHBhcmFtcyxcbiAgICAgKiB0aGVuIGNhbGwgYHJlbmRlcmAgdG8gdXBkYXRlIHRoZSBwYWdlciBjb250cm9sLiAgT3B0aW9uYWwgYXJndW1lbnQgYHBhcmFtc2AgaXMgYW4gb2JqZWN0IHRoYXQgY2FuIGNvbnRhaW4gdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuICAgICAqICogYHBhZ2VgOiBQYWdlIG51bWJlciB0byByZW5kZXIuICBJZiBub3QgcHJvdmlkZWQsIGRlZmF1bHRzIHRvIDEuXG4gICAgICogQHBhcmFtIHt7IHBhZ2U6IG51bWJlciB9IHwgbnVsbH0gcGFyYW1zIFxuICAgICAqL1xuICAgIHJlbmRlclJlbW90ZSA9IGFzeW5jIChwYXJhbXMgPSB7fSkgPT4ge1xuICAgICAgICBpZiAoIXBhcmFtcy5wYWdlKSBwYXJhbXMucGFnZSA9IDE7XG4gICAgICAgIFxuICAgICAgICBwYXJhbXMgPSB0aGlzLmNvbnRleHQuZXZlbnRzLmNoYWluKFwicmVtb3RlUGFyYW1zXCIsIHBhcmFtcyk7XG5cbiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuY29udGV4dC5kYXRhbG9hZGVyLnJlcXVlc3RHcmlkRGF0YShwYXJhbXMpO1xuICAgICAgICBjb25zdCByb3dDb3VudCA9IGRhdGEucm93Q291bnQgPz8gMDtcblxuICAgICAgICB0aGlzLmNvbnRleHQuZ3JpZC5yZW5kZXJSb3dzKGRhdGEuZGF0YSwgcm93Q291bnQpO1xuICAgICAgICB0aGlzLnRvdGFsUm93cyA9IHJvd0NvdW50O1xuICAgICAgICB0aGlzLnJlbmRlcihwYXJhbXMucGFnZSwgdGhpcy5oYW5kbGVQYWdpbmcpO1xuICAgIH07XG59XG5cblBhZ2VyTW9kdWxlLm1vZHVsZU5hbWUgPSBcInBhZ2VyXCI7XG5cbmV4cG9ydCB7IFBhZ2VyTW9kdWxlIH07IiwiLyoqXG4gKiBXaWxsIHJlLWxvYWQgdGhlIGdyaWQncyBkYXRhIGZyb20gaXRzIHRhcmdldCBzb3VyY2UgKGxvY2FsIG9yIHJlbW90ZSkuXG4gKi9cbmNsYXNzIFJlZnJlc2hNb2R1bGUge1xuICAgIC8qKlxuICAgICAqIFdpbGwgYXBwbHkgZXZlbnQgdG8gdGFyZ2V0IGJ1dHRvbiB0aGF0LCB3aGVuIGNsaWNrZWQsIHdpbGwgcmUtbG9hZCB0aGUgXG4gICAgICogZ3JpZCdzIGRhdGEgZnJvbSBpdHMgdGFyZ2V0IHNvdXJjZSAobG9jYWwgb3IgcmVtb3RlKS5cbiAgICAgKiBAcGFyYW0ge0dyaWRDb250ZXh0fSBjb250ZXh0IEdyaWQgY29udGV4dCBjbGFzcy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgfVxuXG4gICAgaW5pdGlhbGl6ZSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVtb3RlUHJvY2Vzc2luZyAmJiB0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVtb3RlVXJsKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQucGlwZWxpbmUuYWRkU3RlcChcInJlZnJlc2hcIiwgdGhpcy5jb250ZXh0LnBlcnNpc3RlbmNlLnNldERhdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGhpcy5jb250ZXh0LnNldHRpbmdzLnJlZnJlc2hhYmxlSWQpO1xuICAgICAgICBcbiAgICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZVJlZnJlc2gpO1xuICAgIH1cblxuICAgIGhhbmRsZVJlZnJlc2ggPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmNvbnRleHQucGlwZWxpbmUuaGFzUGlwZWxpbmUoXCJyZWZyZXNoXCIpKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQucGlwZWxpbmUuZXhlY3V0ZShcInJlZnJlc2hcIik7XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIik7XG4gICAgfTtcbn1cblxuUmVmcmVzaE1vZHVsZS5tb2R1bGVOYW1lID0gXCJyZWZyZXNoXCI7XG5cbmV4cG9ydCB7IFJlZnJlc2hNb2R1bGUgfTsiLCIvKipcbiAqIFJlc3BvbnNpYmxlIGZvciByZW5kZXJpbmcgdGhlIGdyaWRzIHJvd3MgdXNpbmcgZWl0aGVyIGxvY2FsIG9yIHJlbW90ZSBkYXRhLiAgVGhpcyBzaG91bGQgYmUgdGhlIGRlZmF1bHQgbW9kdWxlIHRvIFxuICogY3JlYXRlIHJvdyBkYXRhIGlmIHBhZ2luZyBpcyBub3QgZW5hYmxlZC4gIFN1YnNjcmliZXMgdG8gdGhlIGByZW5kZXJgIGV2ZW50IHRvIGNyZWF0ZSB0aGUgZ3JpZCdzIHJvd3MgYW5kIHRoZSBgcmVtb3RlUGFyYW1zYCBcbiAqIGV2ZW50IGZvciByZW1vdGUgcHJvY2Vzc2luZy5cbiAqIFxuICogQ2xhc3Mgd2lsbCBjYWxsIHRoZSAncmVtb3RlUGFyYW1zJyBldmVudCB0byBjb25jYXRlbmF0ZSBwYXJhbWV0ZXJzIGZvciByZW1vdGUgZGF0YSByZXF1ZXN0cy5cbiAqL1xuY2xhc3MgUm93TW9kdWxlIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGdyaWQgcm93cy4gIFRoaXMgc2hvdWxkIGJlIHRoZSBkZWZhdWx0IG1vZHVsZSB0byBjcmVhdGUgcm93IGRhdGEgaWYgcGFnaW5nIGlzIG5vdCBlbmFibGVkLlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgR3JpZCBjb250ZXh0IGNsYXNzLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICB9XG5cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICBpZiAodGhpcy5jb250ZXh0LnNldHRpbmdzLnJlbW90ZVByb2Nlc3NpbmcpIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5ldmVudHMuc3Vic2NyaWJlKFwicmVuZGVyXCIsIHRoaXMucmVuZGVyUmVtb3RlLCB0cnVlLCAxMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuZXZlbnRzLnN1YnNjcmliZShcInJlbmRlclwiLCB0aGlzLnJlbmRlckxvY2FsLCBmYWxzZSwgMTApO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlbmRlcnMgdGhlIGdyaWQgcm93cyB1c2luZyBsb2NhbCBkYXRhLiAgVGhpcyBpcyB0aGUgZGVmYXVsdCBtZXRob2QgdG8gcmVuZGVyIHJvd3Mgd2hlbiByZW1vdGUgcHJvY2Vzc2luZyBpcyBub3QgZW5hYmxlZC5cbiAgICAgKi9cbiAgICByZW5kZXJMb2NhbCA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5jb250ZXh0LmdyaWQucmVuZGVyUm93cyh0aGlzLmNvbnRleHQucGVyc2lzdGVuY2UuZGF0YSk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBSZW5kZXJzIHRoZSBncmlkIHJvd3MgdXNpbmcgcmVtb3RlIGRhdGEuICBUaGlzIG1ldGhvZCB3aWxsIGNhbGwgdGhlIGByZW1vdGVQYXJhbXNgIGV2ZW50IHRvIGdldCB0aGUgcGFyYW1ldGVycyBmb3IgdGhlIHJlbW90ZSByZXF1ZXN0LlxuICAgICAqL1xuICAgIHJlbmRlclJlbW90ZSA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gdGhpcy5jb250ZXh0LmV2ZW50cy5jaGFpbihcInJlbW90ZVBhcmFtc1wiLCB7fSk7XG4gICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmNvbnRleHQuZGF0YWxvYWRlci5yZXF1ZXN0R3JpZERhdGEocGFyYW1zKTtcblxuICAgICAgICB0aGlzLmNvbnRleHQuZ3JpZC5yZW5kZXJSb3dzKGRhdGEpO1xuICAgIH07XG59XG5cblJvd01vZHVsZS5tb2R1bGVOYW1lID0gXCJyb3dcIjtcblxuZXhwb3J0IHsgUm93TW9kdWxlIH07IiwiLyoqXG4gKiBVcGRhdGVzIHRhcmdldCBsYWJlbCB3aXRoIGEgY291bnQgb2Ygcm93cyBpbiBncmlkLlxuICovXG5jbGFzcyBSb3dDb3VudE1vZHVsZSB7XG4gICAgLyoqXG4gICAgICogVXBkYXRlcyB0YXJnZXQgbGFiZWwgc3VwcGxpZWQgaW4gc2V0dGluZ3Mgd2l0aCBhIGNvdW50IG9mIHJvd3MgaW4gZ3JpZC5cbiAgICAgKiBAcGFyYW0ge0dyaWRDb250ZXh0fSBjb250ZXh0IEdyaWQgY29udGV4dCBjbGFzcy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGNvbnRleHQuc2V0dGluZ3Mucm93Q291bnRJZCk7XG4gICAgfVxuXG4gICAgaW5pdGlhbGl6ZSgpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0LmV2ZW50cy5zdWJzY3JpYmUoXCJyZW5kZXJcIiwgdGhpcy5oYW5kbGVDb3VudCwgZmFsc2UsIDIwKTtcbiAgICB9XG5cbiAgICBoYW5kbGVDb3VudCA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5lbGVtZW50LmlubmVyVGV4dCA9IHRoaXMuY29udGV4dC5ncmlkLnJvd0NvdW50O1xuICAgIH07XG59XG5cblJvd0NvdW50TW9kdWxlLm1vZHVsZU5hbWUgPSBcInJvd2NvdW50XCI7XG5cbmV4cG9ydCB7IFJvd0NvdW50TW9kdWxlIH07IiwiZXhwb3J0IGRlZmF1bHQgKGEsIGIsIGRpcmVjdGlvbikgPT4ge1xuICAgIGxldCBjb21wYXJpc29uID0gMDtcbiAgICBsZXQgZGF0ZUEgPSBuZXcgRGF0ZShhKTtcbiAgICBsZXQgZGF0ZUIgPSBuZXcgRGF0ZShiKTtcblxuICAgIGlmIChOdW1iZXIuaXNOYU4oZGF0ZUEudmFsdWVPZigpKSkge1xuICAgICAgICBkYXRlQSA9IG51bGw7XG4gICAgfVxuXG4gICAgaWYgKE51bWJlci5pc05hTihkYXRlQi52YWx1ZU9mKCkpKSB7XG4gICAgICAgIGRhdGVCID0gbnVsbDtcbiAgICB9XG4gICAgLy9ib3RoIGRhdGVzIGFyZSBudWxsL2ludmFsaWRcbiAgICBpZiAoZGF0ZUEgPT09IG51bGwgJiYgZGF0ZUIgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIC8vaGFuZGxlIGVtcHR5IHZhbHVlcy5cbiAgICBpZiAoIWRhdGVBKSB7XG4gICAgICAgIGNvbXBhcmlzb24gPSAhZGF0ZUIgPyAwIDogLTE7XG4gICAgfSBlbHNlIGlmICghZGF0ZUIpIHtcbiAgICAgICAgY29tcGFyaXNvbiA9IDE7XG4gICAgfSBlbHNlIGlmIChkYXRlQSA+IGRhdGVCKSB7ICAgIFxuICAgICAgICBjb21wYXJpc29uID0gMTtcbiAgICB9IGVsc2UgaWYgKGRhdGVBIDwgZGF0ZUIpIHtcbiAgICAgICAgY29tcGFyaXNvbiA9IC0xO1xuICAgIH1cblxuICAgIHJldHVybiBkaXJlY3Rpb24gPT09IFwiZGVzY1wiID8gKGNvbXBhcmlzb24gKiAtMSkgOiBjb21wYXJpc29uO1xufTsiLCIvL3NvcnQgbnVtZXJpYyB2YWx1ZS5cbmV4cG9ydCBkZWZhdWx0IChhLCBiLCBkaXJlY3Rpb24pID0+IHtcbiAgICBsZXQgY29tcGFyaXNvbiA9IDA7XG5cbiAgICBpZiAoYSA+IGIpIHtcbiAgICAgICAgY29tcGFyaXNvbiA9IDE7XG4gICAgfSBlbHNlIGlmIChhIDwgYikge1xuICAgICAgICBjb21wYXJpc29uID0gLTE7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRpcmVjdGlvbiA9PT0gXCJkZXNjXCIgPyAoY29tcGFyaXNvbiAqIC0xKSA6IGNvbXBhcmlzb247XG59OyIsImV4cG9ydCBkZWZhdWx0IChhLCBiLCBkaXJlY3Rpb24pID0+IHtcbiAgICBsZXQgY29tcGFyaXNvbiA9IDA7XG4gICAgLy9oYW5kbGUgZW1wdHkgdmFsdWVzLlxuICAgIGlmICghYSkge1xuICAgICAgICBjb21wYXJpc29uID0gIWIgPyAwIDogLTE7XG4gICAgfSBlbHNlIGlmICghYikge1xuICAgICAgICBjb21wYXJpc29uID0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCB2YXJBID0gYS50b1VwcGVyQ2FzZSgpO1xuICAgICAgICBjb25zdCB2YXJCID0gYi50b1VwcGVyQ2FzZSgpO1xuICAgIFxuICAgICAgICBpZiAodmFyQSA+IHZhckIpIHtcbiAgICAgICAgICAgIGNvbXBhcmlzb24gPSAxO1xuICAgICAgICB9IGVsc2UgaWYgKHZhckEgPCB2YXJCKSB7XG4gICAgICAgICAgICBjb21wYXJpc29uID0gLTE7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZGlyZWN0aW9uID09PSBcImRlc2NcIiA/IChjb21wYXJpc29uICogLTEpIDogY29tcGFyaXNvbjtcbn07IiwiaW1wb3J0IGRhdGUgZnJvbSBcIi4vc29ydGVycy9kYXRlLmpzXCI7XG5pbXBvcnQgbnVtYmVyIGZyb20gXCIuL3NvcnRlcnMvbnVtYmVyLmpzXCI7XG5pbXBvcnQgc3RyaW5nIGZyb20gXCIuL3NvcnRlcnMvc3RyaW5nLmpzXCI7XG4vKipcbiAqIENsYXNzIHRvIG1hbmFnZSBzb3J0aW5nIGZ1bmN0aW9uYWxpdHkgaW4gYSBncmlkIGNvbnRleHQuICBGb3IgcmVtb3RlIHByb2Nlc3NpbmcsIHdpbGwgc3Vic2NyaWJlIHRvIHRoZSBgcmVtb3RlUGFyYW1zYCBldmVudC5cbiAqIEZvciBsb2NhbCBwcm9jZXNzaW5nLCB3aWxsIHN1YnNjcmliZSB0byB0aGUgYHJlbmRlcmAgZXZlbnQuXG4gKiBcbiAqIENsYXNzIHdpbGwgdHJpZ2dlciB0aGUgYHJlbmRlcmAgZXZlbnQgYWZ0ZXIgc29ydGluZyBpcyBhcHBsaWVkLCBhbGxvd2luZyB0aGUgZ3JpZCB0byByZS1yZW5kZXIgd2l0aCB0aGUgc29ydGVkIGRhdGEuXG4gKi9cbmNsYXNzIFNvcnRNb2R1bGUge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgU29ydE1vZHVsZSBvYmplY3QuXG4gICAgICogQHBhcmFtIHtHcmlkQ29udGV4dH0gY29udGV4dCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMuaGVhZGVyQ2VsbHMgPSBbXTtcbiAgICAgICAgdGhpcy5jdXJyZW50U29ydENvbHVtbiA9IFwiXCI7XG4gICAgICAgIHRoaXMuY3VycmVudERpcmVjdGlvbiA9IFwiXCI7XG4gICAgICAgIHRoaXMuY3VycmVudFR5cGUgPSBcIlwiO1xuICAgIH1cblxuICAgIGluaXRpYWxpemUoKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVtb3RlUHJvY2Vzc2luZykge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50U29ydENvbHVtbiA9IHRoaXMuY29udGV4dC5zZXR0aW5ncy5yZW1vdGVTb3J0RGVmYXVsdENvbHVtbjtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudERpcmVjdGlvbiA9IHRoaXMuY29udGV4dC5zZXR0aW5ncy5yZW1vdGVTb3J0RGVmYXVsdERpcmVjdGlvbjtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5ldmVudHMuc3Vic2NyaWJlKFwicmVtb3RlUGFyYW1zXCIsIHRoaXMucmVtb3RlUGFyYW1zLCB0cnVlKTtcbiAgICAgICAgICAgIHRoaXMuX2luaXQodGhpcy5oYW5kbGVSZW1vdGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LmV2ZW50cy5zdWJzY3JpYmUoXCJyZW5kZXJcIiwgdGhpcy5yZW5kZXJMb2NhbCwgZmFsc2UsIDkpO1xuICAgICAgICAgICAgdGhpcy5zb3J0ZXJzID0geyBudW1iZXI6IG51bWJlciwgc3RyaW5nOiBzdHJpbmcsIGRhdGU6IGRhdGUsIGRhdGV0aW1lOiBkYXRlIH07XG4gICAgICAgICAgICB0aGlzLl9pbml0KHRoaXMuaGFuZGxlTG9jYWwpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2luaXQoY2FsbGJhY2spIHtcbiAgICAgICAgLy9iaW5kIGxpc3RlbmVyIGZvciBub24taWNvbiBjb2x1bW5zOyBhZGQgY3NzIHNvcnQgdGFnLlxuICAgICAgICBmb3IgKGNvbnN0IGNvbCBvZiB0aGlzLmNvbnRleHQuY29sdW1uTWFuYWdlci5jb2x1bW5zKSB7XG4gICAgICAgICAgICBpZiAoY29sLnR5cGUgIT09IFwiaWNvblwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5oZWFkZXJDZWxscy5wdXNoKGNvbC5oZWFkZXJDZWxsKTtcbiAgICAgICAgICAgICAgICBjb2wuaGVhZGVyQ2VsbC5zcGFuLmNsYXNzTGlzdC5hZGQoXCJzb3J0XCIpO1xuICAgICAgICAgICAgICAgIGNvbC5oZWFkZXJDZWxsLnNwYW4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlbW90ZVBhcmFtcyA9IChwYXJhbXMpID0+IHtcbiAgICAgICAgcGFyYW1zLnNvcnQgPSB0aGlzLmN1cnJlbnRTb3J0Q29sdW1uO1xuICAgICAgICBwYXJhbXMuZGlyZWN0aW9uID0gdGhpcy5jdXJyZW50RGlyZWN0aW9uO1xuXG4gICAgICAgIHJldHVybiBwYXJhbXM7XG4gICAgfTtcblxuICAgIGhhbmRsZVJlbW90ZSA9IGFzeW5jIChjKSA9PiB7XG4gICAgICAgIHRoaXMuY3VycmVudFNvcnRDb2x1bW4gPSBjLmN1cnJlbnRUYXJnZXQuY29udGV4dC5uYW1lO1xuICAgICAgICB0aGlzLmN1cnJlbnREaXJlY3Rpb24gPSBjLmN1cnJlbnRUYXJnZXQuY29udGV4dC5kaXJlY3Rpb25OZXh0LnZhbHVlT2YoKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VHlwZSA9IGMuY3VycmVudFRhcmdldC5jb250ZXh0LnR5cGU7XG5cbiAgICAgICAgaWYgKCFjLmN1cnJlbnRUYXJnZXQuY29udGV4dC5pc0N1cnJlbnRTb3J0KSB7XG4gICAgICAgICAgICB0aGlzLnJlc2V0U29ydCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgYy5jdXJyZW50VGFyZ2V0LmNvbnRleHQuc2V0U29ydEZsYWcoKTtcblxuICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIik7XG4gICAgfTtcblxuICAgIHJlc2V0U29ydCgpIHtcbiAgICAgICAgY29uc3QgY2VsbCA9IHRoaXMuaGVhZGVyQ2VsbHMuZmluZChlID0+IGUuaXNDdXJyZW50U29ydCk7XG5cbiAgICAgICAgaWYgKGNlbGwgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY2VsbC5yZW1vdmVTb3J0RmxhZygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVuZGVyTG9jYWwgPSAoKSA9PiB7XG4gICAgICAgIGlmICghdGhpcy5jdXJyZW50U29ydENvbHVtbikgcmV0dXJuO1xuXG4gICAgICAgIHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5kYXRhLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNvcnRlcnNbdGhpcy5jdXJyZW50VHlwZV0oYVt0aGlzLmN1cnJlbnRTb3J0Q29sdW1uXSwgYlt0aGlzLmN1cnJlbnRTb3J0Q29sdW1uXSwgdGhpcy5jdXJyZW50RGlyZWN0aW9uKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGhhbmRsZUxvY2FsID0gYXN5bmMgKGMpID0+IHtcbiAgICAgICAgdGhpcy5jdXJyZW50U29ydENvbHVtbiA9IGMuY3VycmVudFRhcmdldC5jb250ZXh0Lm5hbWU7XG4gICAgICAgIHRoaXMuY3VycmVudERpcmVjdGlvbiA9IGMuY3VycmVudFRhcmdldC5jb250ZXh0LmRpcmVjdGlvbk5leHQudmFsdWVPZigpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUeXBlID0gYy5jdXJyZW50VGFyZ2V0LmNvbnRleHQudHlwZTtcblxuICAgICAgICBpZiAoIWMuY3VycmVudFRhcmdldC5jb250ZXh0LmlzQ3VycmVudFNvcnQpIHtcbiAgICAgICAgICAgIHRoaXMucmVzZXRTb3J0KCk7XG4gICAgICAgIH1cblxuICAgICAgICBjLmN1cnJlbnRUYXJnZXQuY29udGV4dC5zZXRTb3J0RmxhZygpO1xuXG4gICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKTtcbiAgICB9O1xufVxuXG5Tb3J0TW9kdWxlLm1vZHVsZU5hbWUgPSBcInNvcnRcIjtcblxuZXhwb3J0IHsgU29ydE1vZHVsZSB9OyIsImltcG9ydCB7IEdyaWRDb250ZXh0IH0gZnJvbSBcIi4uL2NvbXBvbmVudHMvY29udGV4dC9ncmlkQ29udGV4dC5qc1wiO1xuaW1wb3J0IHsgTWVyZ2VPcHRpb25zIH0gZnJvbSBcIi4uL3NldHRpbmdzL21lcmdlT3B0aW9ucy5qc1wiO1xuaW1wb3J0IHsgU2V0dGluZ3NHcmlkIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzR3JpZC5qc1wiO1xuaW1wb3J0IHsgUm93TW9kdWxlIH0gZnJvbSBcIi4uL21vZHVsZXMvcm93L3Jvd01vZHVsZS5qc1wiO1xuaW1wb3J0IHsgUGFnZXJNb2R1bGUgfSBmcm9tIFwiLi4vbW9kdWxlcy9wYWdlci9wYWdlck1vZHVsZS5qc1wiO1xuLyoqXG4gKiBDcmVhdGVzIGdyaWQncyBjb3JlIHByb3BlcnRpZXMgYW5kIG9iamVjdHMsIGFuZCBhbGxvd3MgZm9yIHJlZ2lzdHJhdGlvbiBvZiBtb2R1bGVzIHVzZWQgdG8gYnVpbGQgZnVuY3Rpb25hbGl0eS5cbiAqIFVzZSB0aGlzIGNsYXNzIGFzIGEgYmFzZSBjbGFzcyB0byBjcmVhdGUgYSBncmlkIHdpdGggY3VzdG9tIG1vZHVsYXIgZnVuY3Rpb25hbGl0eSB1c2luZyB0aGUgYGV4dGVuZHNgIGNsYXNzIHJlZmVyZW5jZS5cbiAqL1xuY2xhc3MgR3JpZENvcmUge1xuICAgICNtb2R1bGVUeXBlcztcbiAgICAjbW9kdWxlc0NyZWF0ZWQ7XG4gICAgLyoqXG4gICAgKiBDcmVhdGVzIGdyaWQncyBjb3JlIHByb3BlcnRpZXMgYW5kIG9iamVjdHMgYW5kIGlkZW50aWZpZXMgZGl2IGVsZW1lbnQgd2hpY2ggZ3JpZCB3aWxsIGJlIGJ1aWx0LiAgQWZ0ZXIgaW5zdGFudGlhdGlvbiwgXG4gICAgKiB1c2UgdGhlIGBhZGRNb2R1bGVzYCBtZXRob2QgdG8gcmVnaXN0ZXIgZGVzaXJlZCBtb2R1bGVzIHRvIGNvbXBsZXRlIHRoZSBzZXR1cCBwcm9jZXNzLiAgTW9kdWxlIHJlZ2lzdHJhdGlvbiBpcyBrZXB0IFxuICAgICogc2VwYXJhdGUgZnJvbSBjb25zdHJ1Y3RvciB0byBhbGxvdyBjdXN0b21pemF0aW9uIG9mIG1vZHVsZXMgdXNlZCB0byBidWlsZCBncmlkLlxuICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbnRhaW5lciBkaXYgZWxlbWVudCBJRCB0byBidWlsZCBncmlkIGluLlxuICAgICogQHBhcmFtIHtvYmplY3R9IHNldHRpbmdzIFVzZXIgc2V0dGluZ3M7IGtleS92YWx1ZSBwYWlycy5cbiAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbnRhaW5lciwgc2V0dGluZ3MpIHtcbiAgICAgICAgY29uc3Qgc291cmNlID0gTWVyZ2VPcHRpb25zLm1lcmdlKHNldHRpbmdzKTtcblxuICAgICAgICB0aGlzLnNldHRpbmdzID0gbmV3IFNldHRpbmdzR3JpZChzb3VyY2UpO1xuICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGNvbnRhaW5lcik7XG4gICAgICAgIHRoaXMuZW5hYmxlUGFnaW5nID0gdGhpcy5zZXR0aW5ncy5lbmFibGVQYWdpbmc7XG4gICAgICAgIHRoaXMuaXNWYWxpZCA9IHRydWU7XG4gICAgICAgIHRoaXMuI21vZHVsZVR5cGVzID0gW107XG4gICAgICAgIHRoaXMuI21vZHVsZXNDcmVhdGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMubW9kdWxlcyA9IHt9O1xuXG4gICAgICAgIGlmIChPYmplY3QudmFsdWVzKHNvdXJjZS5jb2x1bW5zKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTWlzc2luZyByZXF1aXJlZCBjb2x1bW5zIGRlZmluaXRpb24uXCIpO1xuICAgICAgICAgICAgdGhpcy5pc1ZhbGlkID0gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gc291cmNlLmRhdGEgPz8gW107XG4gICAgICAgICAgICB0aGlzLiNpbml0KHNvdXJjZS5jb2x1bW5zLCBkYXRhKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgICNpbml0KGNvbHVtbnMsIGRhdGEpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gbmV3IEdyaWRDb250ZXh0KGNvbHVtbnMsIHRoaXMuc2V0dGluZ3MsIGRhdGEpO1xuXG4gICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZCh0aGlzLmNvbnRleHQuZ3JpZC50YWJsZSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVyIG1vZHVsZXMgdG8gYmUgdXNlZCBpbiB0aGUgYnVpbGRpbmcgYW5kIG9wZXJhdGlvbiBvZiB0aGUgZ3JpZC4gIFxuICAgICAqIFxuICAgICAqIE5PVEU6IFRoaXMgbWV0aG9kIHNob3VsZCBiZSBjYWxsZWQgYmVmb3JlIHRoZSBgaW5pdCgpYCBtZXRob2QuXG4gICAgICogQHBhcmFtIHtjbGFzc30gbW9kdWxlcyBDbGFzcyBtb2R1bGUocykuXG4gICAgICovXG4gICAgYWRkTW9kdWxlcyguLi5tb2R1bGVzKSB7XG4gICAgICAgIG1vZHVsZXMuZm9yRWFjaCgobSkgPT4gdGhpcy4jbW9kdWxlVHlwZXMucHVzaChtKSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBuZXcgY29sdW1uIHRvIHRoZSBncmlkLiAgVGhlIGNvbHVtbiB3aWxsIGJlIGFkZGVkIHRvIHRoZSBlbmQgb2YgdGhlIGNvbHVtbnMgY29sbGVjdGlvbiBieSBkZWZhdWx0LCBidXQgY2FuIFxuICAgICAqIGJlIGluc2VydGVkIGF0IGEgc3BlY2lmaWMgaW5kZXguICBcbiAgICAgKiBcbiAgICAgKiBOT1RFOiBUaGlzIG1ldGhvZCBzaG91bGQgYmUgY2FsbGVkIGJlZm9yZSB0aGUgYGluaXQoKWAgbWV0aG9kLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb2x1bW4gQ29sdW1uIG9iamVjdCBkZWZpbml0aW9uLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbaW5kZXhQb3NpdGlvbj1udWxsXSBJbmRleCB0byBpbnNlcnQgdGhlIGNvbHVtbiBhdC4gSWYgbnVsbCwgYXBwZW5kcyB0byB0aGUgZW5kLlxuICAgICAqL1xuICAgIGFkZENvbHVtbihjb2x1bW4sIGluZGV4UG9zaXRpb24gPSBudWxsKSB7XG4gICAgICAgIHRoaXMuY29udGV4dC5jb2x1bW5NYW5hZ2VyLmFkZENvbHVtbihjb2x1bW4sIGluZGV4UG9zaXRpb24pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBJdGVyYXRlcyB0aG91Z2ggYSBsaXN0IG9mIG1vZHVsZXMgdG8gaW5zdGFudGlhdGUgYW5kIGluaXRpYWxpemUgc3RhcnQgdXAgYW5kL29yIGJ1aWxkIGJlaGF2aW9yLiAgU2hvdWxkIGJlIGNhbGxlZCBhZnRlciBcbiAgICAgKiBhbGwgbW9kdWxlcyBoYXZlIGJlZW4gcmVnaXN0ZXJlZCB1c2luZyB0aGUgYGFkZE1vZHVsZXNgIG1ldGhvZCwgYW5kIG9ubHkgbmVlZHMgdG8gYmUgY2FsbGVkIG9uY2UuXG4gICAgICogXG4gICAgICogTk9URTogSWYgYnlwYXNzaW5nIHRoZSBgaW5pdCgpYCBtZXRob2QsIGJlIHN1cmUgdG8gY2FsbCBgY29udGV4dC5ncmlkLmluaXRpYWxpemVIZWFkZXIoKWAgYmVmb3JlIGNhbGxpbmcgdGhpcyBtZXRob2QgXG4gICAgICogdG8gZW5zdXJlIHRoZSBncmlkJ3MgaGVhZGVyIGlzIGJ1aWx0LlxuICAgICAqL1xuICAgIF9pbml0TW9kdWxlcyA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuI21vZHVsZXNDcmVhdGVkKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIC8vVmVyaWZ5IGlmIGJhc2UgcmVxdWlyZWQgcm93IHJlbGF0ZWQgbW9kdWxlIGhhcyBiZWVuIGFkZGVkIHRvIHRoZSBncmlkLlxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5lbmFibGVQYWdpbmcgJiYgIXRoaXMuI21vZHVsZVR5cGVzLnNvbWUoKHgpID0+IHgubW9kdWxlTmFtZSA9PT0gXCJwYWdlXCIpKSB7XG4gICAgICAgICAgICB0aGlzLiNtb2R1bGVUeXBlcy5wdXNoKFBhZ2VyTW9kdWxlKTtcbiAgICAgICAgfSBlbHNlIGlmICghdGhpcy4jbW9kdWxlVHlwZXMuc29tZSgoeCkgPT4geC5tb2R1bGVOYW1lID09PSBcInJvd1wiKSkge1xuICAgICAgICAgICAgIHRoaXMuI21vZHVsZVR5cGVzLnB1c2goUm93TW9kdWxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuI21vZHVsZVR5cGVzLmZvckVhY2goKG0pID0+IHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5tb2R1bGVzW20ubW9kdWxlTmFtZV0gPSBuZXcgbSh0aGlzLmNvbnRleHQpO1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0Lm1vZHVsZXNbbS5tb2R1bGVOYW1lXS5pbml0aWFsaXplKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuI21vZHVsZXNDcmVhdGVkID0gdHJ1ZTtcbiAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicG9zdEluaXRNb2RcIik7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBJbnN0YW50aWF0ZXMgdGhlIGNyZWF0aW9uIG9mIHRoZSBncmlkLiAgTWV0aG9kIHdpbGwgY3JlYXRlIHRoZSBncmlkJ3MgZWxlbWVudHMsIHJ1biBhbGwgcmVnaXN0ZXJlZCBtb2R1bGVzLCBkYXRhIHByb2Nlc3NpbmcgXG4gICAgICogcGlwZWxpbmVzIGFuZCBldmVudHMuICBJZiBncmlkIGlzIGJlaW5nIGJ1aWx0IHVzaW5nIHRoZSBtb2R1bGFyIGFwcHJvYWNoLCBiZSBzdXJlIHRvIGNhbGwgdGhlIGBhZGRNb2R1bGVzYCBtZXRob2QgYmVmb3JlIFxuICAgICAqIGNhbGxpbmcgdGhpcyBvbmUgdG8gZW5zdXJlIGFsbCBtb2R1bGVzIGFyZSByZWdpc3RlcmVkIGFuZCBpbml0aWFsaXplZCBpbiB0aGVpciBwcm9wZXIgb3JkZXIuXG4gICAgICogXG4gICAgICogTk9URTogTWV0aG9kIHdpbGwgYXV0b21hdGljYWxseSByZWdpc3RlciB0aGUgYFBhZ2VyTW9kdWxlYCBpZiBwYWdpbmcgaXMgZW5hYmxlZCwgb3IgdGhlIGBSb3dNb2R1bGVgIGlmIHBhZ2luZyBpcyBub3QgZW5hYmxlZC5cbiAgICAgKi9cbiAgICBhc3luYyBpbml0KCkge1xuICAgICAgICBpZiAoIXRoaXMuaXNWYWxpZCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJNaXNzaW5nIHJlcXVpcmVkIGNvbHVtbnMgZGVmaW5pdGlvbi5cIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbnRleHQuZ3JpZC5pbml0aWFsaXplSGVhZGVyKCk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5faW5pdE1vZHVsZXMoKTtcblxuICAgICAgICBpZiAoIXRoaXMuc2V0dGluZ3MucmVtb3RlUHJvY2Vzc2luZyAmJiB0aGlzLnNldHRpbmdzLnJlbW90ZVVybCkge1xuICAgICAgICAgICAgLy9sb2NhbCBkYXRhIHNvdXJjZSBwcm9jZXNzaW5nOyBzZXQgcGlwZWxpbmUgYWN0aW9ucy5cbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5waXBlbGluZS5hZGRTdGVwKFwiaW5pdFwiLCB0aGlzLmNvbnRleHQucGVyc2lzdGVuY2Uuc2V0RGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9leGVjdXRlIGRhdGEgcGlwZWxpbmUgYmVmb3JlIGJ1aWxkaW5nIGVsZW1lbnRzLlxuICAgICAgICBpZiAodGhpcy5jb250ZXh0LnBpcGVsaW5lLmhhc1BpcGVsaW5lKFwiaW5pdFwiKSkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LnBpcGVsaW5lLmV4ZWN1dGUoXCJpbml0XCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBcHBseSBmaWx0ZXIgY29uZGl0aW9uIGZvciB0YXJnZXQgY29sdW1uLiAgTWV0aG9kIHByb3ZpZGVzIGEgbWVhbnMgdG8gYXBwbHkgY29uZGl0aW9uIG91dHNpZGUgb2YgaGVhZGVyIGZpbHRlciBjb250cm9scy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmllbGQgVGFyZ2V0IGZpZWxkLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSB2YWx1ZSBGaWx0ZXIgdmFsdWUuXG4gICAgICogQHBhcmFtIHtzdHJpbmcgfCBGdW5jdGlvbn0gW3R5cGU9XCJlcXVhbHNcIl0gRmlsdGVyIHR5cGUuICBJZiBhIGZ1bmN0aW9uIGlzIHByb3ZpZGVkLCBpdCB3aWxsIGJlIHVzZWQgYXMgdGhlIGZpbHRlciBjb25kaXRpb24uXG4gICAgICogT3RoZXJ3aXNlLCB1c2UgdGhlIGFzc29jaWF0ZWQgc3RyaW5nIHZhbHVlIHR5cGUgdG8gZGV0ZXJtaW5lIHRoZSBmaWx0ZXIgY29uZGl0aW9uLiAgaS5lLiBcImVxdWFsc1wiLCBcImNvbnRhaW5zXCIsIGV0Yy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW2ZpZWxkVHlwZT1cInN0cmluZ1wiXSBGaWVsZCB0eXBlLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbZmlsdGVyUGFyYW1zPXt9XSBBZGRpdGlvbmFsIGZpbHRlciBwYXJhbWV0ZXJzLlxuICAgICAqL1xuICAgIHNldEZpbHRlciA9IGFzeW5jIChmaWVsZCwgdmFsdWUsIHR5cGUgPSBcImVxdWFsc1wiLCBmaWVsZFR5cGUgPSBcInN0cmluZ1wiLCBmaWx0ZXJQYXJhbXMgPSB7fSkgPT4ge1xuICAgICAgICBpZiAodGhpcy5jb250ZXh0Lm1vZHVsZXMuZmlsdGVyKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQubW9kdWxlcy5maWx0ZXIuc2V0RmlsdGVyKGZpZWxkLCB2YWx1ZSwgdHlwZSwgZmllbGRUeXBlLCBmaWx0ZXJQYXJhbXMpO1xuXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJGaWx0ZXIgbW9kdWxlIGlzIG5vdCBlbmFibGVkLiAgU2V0IGBUYWJsZURhdGEuZGVmYXVsdE9wdGlvbnMuZW5hYmxlRmlsdGVyYCB0byB0cnVlIGluIG9yZGVyIHRvIGVuYWJsZSB0aGlzIGZ1bmN0aW9uLlwiKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGZpbHRlciBjb25kaXRpb24gZm9yIHRhcmdldCBmaWVsZC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmllbGQgVGFyZ2V0IGZpZWxkLlxuICAgICAqL1xuICAgIHJlbW92ZUZpbHRlciA9IGFzeW5jIChmaWVsZCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5jb250ZXh0Lm1vZHVsZXMuZmlsdGVyKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQubW9kdWxlcy5maWx0ZXIucmVtb3ZlRmlsdGVyKGZpZWxkKTtcblxuICAgICAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiRmlsdGVyIG1vZHVsZSBpcyBub3QgZW5hYmxlZC4gIFNldCBgVGFibGVEYXRhLmRlZmF1bHRPcHRpb25zLmVuYWJsZUZpbHRlcmAgdG8gdHJ1ZSBpbiBvcmRlciB0byBlbmFibGUgdGhpcyBmdW5jdGlvbi5cIik7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5leHBvcnQgeyBHcmlkQ29yZSB9OyIsImltcG9ydCB7IEdyaWRDb3JlIH0gZnJvbSBcIi4vY29yZS9ncmlkQ29yZS5qc1wiO1xuaW1wb3J0IHsgQ3N2TW9kdWxlIH0gZnJvbSBcIi4vbW9kdWxlcy9kb3dubG9hZC9jc3ZNb2R1bGUuanNcIjtcbmltcG9ydCB7IEZpbHRlck1vZHVsZSB9IGZyb20gXCIuL21vZHVsZXMvZmlsdGVyL2ZpbHRlck1vZHVsZS5qc1wiO1xuaW1wb3J0IHsgUmVmcmVzaE1vZHVsZSB9IGZyb20gXCIuL21vZHVsZXMvcmVmcmVzaC9yZWZyZXNoTW9kdWxlLmpzXCI7XG5pbXBvcnQgeyBSb3dDb3VudE1vZHVsZSB9IGZyb20gXCIuL21vZHVsZXMvcm93L3Jvd0NvdW50TW9kdWxlLmpzXCI7XG5pbXBvcnQgeyBTb3J0TW9kdWxlIH0gZnJvbSBcIi4vbW9kdWxlcy9zb3J0L3NvcnRNb2R1bGUuanNcIjtcblxuY2xhc3MgVGFibGVEYXRhIGV4dGVuZHMgR3JpZENvcmUge1xuICAgIGNvbnN0cnVjdG9yKGNvbnRhaW5lciwgc2V0dGluZ3MpIHtcbiAgICAgICAgc3VwZXIoY29udGFpbmVyLCBzZXR0aW5ncyk7XG5cbiAgICAgICAgaWYgKFRhYmxlRGF0YS5kZWZhdWx0T3B0aW9ucy5lbmFibGVGaWx0ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkTW9kdWxlcyhGaWx0ZXJNb2R1bGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFRhYmxlRGF0YS5kZWZhdWx0T3B0aW9ucy5lbmFibGVTb3J0KSB7XG4gICAgICAgICAgICB0aGlzLmFkZE1vZHVsZXMoU29ydE1vZHVsZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5yb3dDb3VudElkKSB7XG4gICAgICAgICAgICB0aGlzLmFkZE1vZHVsZXMoUm93Q291bnRNb2R1bGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MucmVmcmVzaGFibGVJZCkge1xuICAgICAgICAgICAgdGhpcy5hZGRNb2R1bGVzKFJlZnJlc2hNb2R1bGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MuY3N2RXhwb3J0SWQpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkTW9kdWxlcyhDc3ZNb2R1bGUpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5UYWJsZURhdGEuZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgZW5hYmxlU29ydDogdHJ1ZSxcbiAgICBlbmFibGVGaWx0ZXI6IHRydWVcbn07XG5cbmV4cG9ydCB7IFRhYmxlRGF0YSB9OyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxNQUFNLFVBQVUsQ0FBQztBQUNqQixJQUFJLE9BQU8sU0FBUyxH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
