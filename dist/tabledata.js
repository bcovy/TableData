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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGVkYXRhLmpzIiwic291cmNlcyI6WyIuLi9zcmMvY29tcG9uZW50cy9jZWxsL2hlYWRlckNlbGwuanMiLCIuLi9zcmMvaGVscGVycy9jc3NIZWxwZXIuanMiLCIuLi9zcmMvY29tcG9uZW50cy9jb2x1bW4vY29sdW1uLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvY29sdW1uL2NvbHVtbk1hbmFnZXIuanMiLCIuLi9zcmMvY29tcG9uZW50cy9kYXRhL2RhdGFQaXBlbGluZS5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2RhdGEvZGF0YUxvYWRlci5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2RhdGEvZGF0YVBlcnNpc3RlbmNlLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvZXZlbnRzL2dyaWRFdmVudHMuanMiLCIuLi9zcmMvaGVscGVycy9kYXRlSGVscGVyLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvY2VsbC9mb3JtYXR0ZXJzL2RhdGV0aW1lLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvY2VsbC9mb3JtYXR0ZXJzL2xpbmsuanMiLCIuLi9zcmMvY29tcG9uZW50cy9jZWxsL2Zvcm1hdHRlcnMvbnVtZXJpYy5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2NlbGwvZm9ybWF0dGVycy9zdGFyLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvY2VsbC9jZWxsLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvdGFibGUvdGFibGUuanMiLCIuLi9zcmMvY29tcG9uZW50cy9jb250ZXh0L2dyaWRDb250ZXh0LmpzIiwiLi4vc3JjL3NldHRpbmdzL3NldHRpbmdzRGVmYXVsdC5qcyIsIi4uL3NyYy9zZXR0aW5ncy9tZXJnZU9wdGlvbnMuanMiLCIuLi9zcmMvc2V0dGluZ3Mvc2V0dGluZ3NHcmlkLmpzIiwiLi4vc3JjL21vZHVsZXMvcm93L3Jvd01vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL3BhZ2VyL3BhZ2VyQnV0dG9ucy5qcyIsIi4uL3NyYy9tb2R1bGVzL3BhZ2VyL3BhZ2VyTW9kdWxlLmpzIiwiLi4vc3JjL2NvcmUvZ3JpZENvcmUuanMiLCIuLi9zcmMvbW9kdWxlcy9kb3dubG9hZC9jc3ZNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9maWx0ZXIvdHlwZXMvZmlsdGVyVGFyZ2V0LmpzIiwiLi4vc3JjL21vZHVsZXMvZmlsdGVyL3R5cGVzL2ZpbHRlckRhdGUuanMiLCIuLi9zcmMvbW9kdWxlcy9maWx0ZXIvdHlwZXMvZmlsdGVyRnVuY3Rpb24uanMiLCIuLi9zcmMvaGVscGVycy9lbGVtZW50SGVscGVyLmpzIiwiLi4vc3JjL21vZHVsZXMvZmlsdGVyL2VsZW1lbnRzL2VsZW1lbnRCZXR3ZWVuLmpzIiwiLi4vc3JjL21vZHVsZXMvZmlsdGVyL2VsZW1lbnRzL2VsZW1lbnRJbnB1dC5qcyIsIi4uL3NyYy9tb2R1bGVzL2ZpbHRlci9lbGVtZW50cy9lbGVtZW50TXVsdGlTZWxlY3QuanMiLCIuLi9zcmMvbW9kdWxlcy9maWx0ZXIvZWxlbWVudHMvZWxlbWVudFNlbGVjdC5qcyIsIi4uL3NyYy9tb2R1bGVzL2ZpbHRlci9maWx0ZXJNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9yZWZyZXNoL3JlZnJlc2hNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9yb3cvcm93Q291bnRNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9zb3J0L3NvcnRlcnMvZGF0ZS5qcyIsIi4uL3NyYy9tb2R1bGVzL3NvcnQvc29ydGVycy9udW1iZXIuanMiLCIuLi9zcmMvbW9kdWxlcy9zb3J0L3NvcnRlcnMvc3RyaW5nLmpzIiwiLi4vc3JjL21vZHVsZXMvc29ydC9zb3J0TW9kdWxlLmpzIiwiLi4vc3JjL3RhYmxlZGF0YS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIERlZmluZXMgYSBzaW5nbGUgaGVhZGVyIGNlbGwgJ3RoJyBlbGVtZW50LlxuICovXG5jbGFzcyBIZWFkZXJDZWxsIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgaGVhZGVyIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgdGhlIGB0aGAgdGFibGUgaGVhZGVyIGVsZW1lbnQuICBDbGFzcyB3aWxsIHBlcnNpc3QgY29sdW1uIHNvcnQgYW5kIG9yZGVyIHVzZXIgaW5wdXQuXG4gICAgICogQHBhcmFtIHtDb2x1bW59IGNvbHVtbiBjb2x1bW4gb2JqZWN0LlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbHVtbikge1xuICAgICAgICB0aGlzLmNvbHVtbiA9IGNvbHVtbjtcbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9IGNvbHVtbi5zZXR0aW5ncztcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRoXCIpO1xuICAgICAgICB0aGlzLnNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdGhpcy5uYW1lID0gY29sdW1uLmZpZWxkO1xuICAgICAgICB0aGlzLmRpcmVjdGlvbiA9IFwiZGVzY1wiO1xuICAgICAgICB0aGlzLmRpcmVjdGlvbk5leHQgPSBcImRlc2NcIjtcbiAgICAgICAgdGhpcy50eXBlID0gY29sdW1uLnR5cGU7XG5cbiAgICAgICAgaWYgKGNvbHVtbi5oZWFkZXJDc3MpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5jbGFzc0xpc3QuYWRkKGNvbHVtbi5oZWFkZXJDc3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MudGFibGVIZWFkZXJUaENzcykge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC5hZGQodGhpcy5zZXR0aW5ncy50YWJsZUhlYWRlclRoQ3NzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb2x1bW4uY29sdW1uU2l6ZSkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC5hZGQoY29sdW1uLmNvbHVtblNpemUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbHVtbi53aWR0aCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLndpZHRoID0gY29sdW1uLndpZHRoO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbHVtbi5oZWFkZXJGaWx0ZXJFbXB0eSkge1xuICAgICAgICAgICAgdGhpcy5zcGFuLmNsYXNzTGlzdC5hZGQoY29sdW1uLmhlYWRlckZpbHRlckVtcHR5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLnNwYW4pO1xuICAgICAgICB0aGlzLmVsZW1lbnQuY29udGV4dCA9IHRoaXM7XG4gICAgICAgIHRoaXMuc3Bhbi5pbm5lclRleHQgPSBjb2x1bW4ubGFiZWw7XG4gICAgICAgIHRoaXMuc3Bhbi5jb250ZXh0ID0gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBzb3J0IGZsYWcgZm9yIHRoZSBoZWFkZXIgY2VsbC5cbiAgICAgKi9cbiAgICBzZXRTb3J0RmxhZygpIHtcbiAgICAgICAgaWYgKHRoaXMuaWNvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaVwiKTtcbiAgICAgICAgICAgIHRoaXMuc3Bhbi5hcHBlbmQodGhpcy5pY29uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmRpcmVjdGlvbk5leHQgPT09IFwiZGVzY1wiKSB7XG4gICAgICAgICAgICB0aGlzLmljb24uY2xhc3NMaXN0ID0gdGhpcy5zZXR0aW5ncy50YWJsZUNzc1NvcnREZXNjO1xuICAgICAgICAgICAgdGhpcy5kaXJlY3Rpb24gPSBcImRlc2NcIjtcbiAgICAgICAgICAgIHRoaXMuZGlyZWN0aW9uTmV4dCA9IFwiYXNjXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmljb24uY2xhc3NMaXN0ID0gdGhpcy5zZXR0aW5ncy50YWJsZUNzc1NvcnRBc2M7XG4gICAgICAgICAgICB0aGlzLmRpcmVjdGlvbiA9IFwiYXNjXCI7XG4gICAgICAgICAgICB0aGlzLmRpcmVjdGlvbk5leHQgPSBcImRlc2NcIjtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgdGhlIHNvcnQgZmxhZyBmb3IgdGhlIGhlYWRlciBjZWxsLlxuICAgICAqL1xuICAgIHJlbW92ZVNvcnRGbGFnKCkge1xuICAgICAgICB0aGlzLmRpcmVjdGlvbiA9IFwiZGVzY1wiO1xuICAgICAgICB0aGlzLmRpcmVjdGlvbk5leHQgPSBcImRlc2NcIjtcbiAgICAgICAgdGhpcy5pY29uID0gdGhpcy5pY29uLnJlbW92ZSgpO1xuICAgIH1cblxuICAgIGdldCBpc0N1cnJlbnRTb3J0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pY29uICE9PSB1bmRlZmluZWQ7XG4gICAgfVxufVxuXG5leHBvcnQgeyBIZWFkZXJDZWxsIH07IiwiY2xhc3MgQ3NzSGVscGVyIHtcbiAgICBzdGF0aWMgYmV0d2VlbiA9IHtcbiAgICAgICAgYnV0dG9uOiBcInRhYmxlZGF0YS1iZXR3ZWVuLWJ1dHRvblwiLFxuICAgICAgICBsYWJlbDogXCJ0YWJsZWRhdGEtYmV0d2Vlbi1pbnB1dC1sYWJlbFwiXG4gICAgfTtcblxuICAgIHN0YXRpYyBub0hlYWRlciA9IFwidGFibGVkYXRhLW5vLWhlYWRlclwiO1xuICAgIHN0YXRpYyBpbnB1dCA9IFwidGFibGVkYXRhLWlucHV0XCI7XG5cbiAgICBzdGF0aWMgbXVsdGlTZWxlY3QgPSB7XG4gICAgICAgIHBhcmVudENsYXNzOiBcInRhYmxlZGF0YS1tdWx0aS1zZWxlY3RcIixcbiAgICAgICAgaGVhZGVyOiBcInRhYmxlZGF0YS1tdWx0aS1zZWxlY3QtaGVhZGVyXCIsXG4gICAgICAgIGhlYWRlckFjdGl2ZTogXCJ0YWJsZWRhdGEtbXVsdGktc2VsZWN0LWhlYWRlci1hY3RpdmVcIixcbiAgICAgICAgaGVhZGVyT3B0aW9uOiBcInRhYmxlZGF0YS1tdWx0aS1zZWxlY3QtaGVhZGVyLW9wdGlvblwiLFxuICAgICAgICBvcHRpb25zOiBcInRhYmxlZGF0YS1tdWx0aS1zZWxlY3Qtb3B0aW9uc1wiLFxuICAgICAgICBvcHRpb246IFwidGFibGVkYXRhLW11bHRpLXNlbGVjdC1vcHRpb25cIixcbiAgICAgICAgb3B0aW9uVGV4dDogXCJ0YWJsZWRhdGEtbXVsdGktc2VsZWN0LW9wdGlvbi10ZXh0XCIsXG4gICAgICAgIG9wdGlvblJhZGlvOiBcInRhYmxlZGF0YS1tdWx0aS1zZWxlY3Qtb3B0aW9uLXJhZGlvXCIsXG4gICAgICAgIHNlbGVjdGVkOiBcInRhYmxlZGF0YS1tdWx0aS1zZWxlY3Qtc2VsZWN0ZWRcIlxuICAgIH07XG5cbiAgICBzdGF0aWMgdG9vbHRpcCA9IHsgXG4gICAgICAgIHBhcmVudENsYXNzOiBcInRhYmxlZGF0YS10b29sdGlwXCIsXG4gICAgICAgIHJpZ2h0OiBcInRhYmxlZGF0YS10b29sdGlwLXJpZ2h0XCIsXG4gICAgICAgIGxlZnQ6IFwidGFibGVkYXRhLXRvb2x0aXAtbGVmdFwiXG4gICAgfTtcbn1cblxuZXhwb3J0IHsgQ3NzSGVscGVyIH07IiwiaW1wb3J0IHsgQ3NzSGVscGVyIH0gZnJvbSBcIi4uLy4uL2hlbHBlcnMvY3NzSGVscGVyLmpzXCI7XG4vKipcbiAqIERlZmluZXMgYSBzaW5nbGUgY29sdW1uIGZvciB0aGUgZ3JpZC4gIFRyYW5zZm9ybXMgdXNlcidzIGNvbHVtbiBkZWZpbml0aW9uIGludG8gQ2xhc3MgcHJvcGVydGllcy5cbiAqIEBjbGFzc1xuICovXG5jbGFzcyBDb2x1bW4ge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBjb2x1bW4gb2JqZWN0IHdoaWNoIHRyYW5zZm9ybXMgdXNlcidzIGNvbHVtbiBkZWZpbml0aW9uIGludG8gQ2xhc3MgcHJvcGVydGllcy5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY29sdW1uIFVzZXIncyBjb2x1bW4gZGVmaW5pdGlvbi9zZXR0aW5ncy5cbiAgICAgKiBAcGFyYW0ge1NldHRpbmdzR3JpZH0gc2V0dGluZ3MgZ3JpZCBzZXR0aW5ncy5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXggY29sdW1uIGluZGV4IG51bWJlci5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb2x1bW4sIHNldHRpbmdzLCBpbmRleCA9IDApIHtcbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9IHNldHRpbmdzO1xuICAgICAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG5cbiAgICAgICAgaWYgKGNvbHVtbi5maWVsZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmZpZWxkID0gYGNvbHVtbiR7aW5kZXh9YDsgIC8vYXNzb2NpYXRlZCBkYXRhIGZpZWxkIG5hbWUuXG4gICAgICAgICAgICB0aGlzLnR5cGUgPSBcImljb25cIjsgIC8vaWNvbiB0eXBlLlxuICAgICAgICAgICAgdGhpcy5sYWJlbCA9IFwiXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmZpZWxkID0gY29sdW1uLmZpZWxkOyAgLy9hc3NvY2lhdGVkIGRhdGEgZmllbGQgbmFtZS5cbiAgICAgICAgICAgIHRoaXMudHlwZSA9IGNvbHVtbi50eXBlID8gY29sdW1uLnR5cGUgOiBcInN0cmluZ1wiOyAgLy92YWx1ZSB0eXBlLlxuICAgICAgICAgICAgdGhpcy5sYWJlbCA9IGNvbHVtbi5sYWJlbCBcbiAgICAgICAgICAgICAgICA/IGNvbHVtbi5sYWJlbCBcbiAgICAgICAgICAgICAgICA6IGNvbHVtbi5maWVsZFswXS50b1VwcGVyQ2FzZSgpICsgY29sdW1uLmZpZWxkLnNsaWNlKDEpOyAgLy9jb2x1bW4gdGl0bGUuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29sdW1uPy5mb3JtYXR0ZXJNb2R1bGVOYW1lKSB7IFxuICAgICAgICAgICAgdGhpcy5mb3JtYXR0ZXIgPSBcIm1vZHVsZVwiO1xuICAgICAgICAgICAgdGhpcy5mb3JtYXR0ZXJNb2R1bGVOYW1lID0gY29sdW1uLmZvcm1hdHRlck1vZHVsZU5hbWU7ICAvL2Zvcm1hdHRlciBtb2R1bGUgbmFtZS5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZm9ybWF0dGVyID0gY29sdW1uLmZvcm1hdHRlcjsgIC8vZm9ybWF0dGVyIHR5cGUgb3IgZnVuY3Rpb24uXG4gICAgICAgICAgICB0aGlzLmZvcm1hdHRlclBhcmFtcyA9IGNvbHVtbi5mb3JtYXR0ZXJQYXJhbXM7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmhlYWRlckNzcyA9IGNvbHVtbi5oZWFkZXJDc3M7XG4gICAgICAgIHRoaXMuY29sdW1uU2l6ZSA9IGNvbHVtbj8uY29sdW1uU2l6ZSA/IGB0YWJsZWRhdGEtY29sLSR7Y29sdW1uLmNvbHVtblNpemV9YCA6IFwiXCI7XG4gICAgICAgIHRoaXMud2lkdGggPSBjb2x1bW4/LndpZHRoID8/IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5oYXNGaWx0ZXIgPSB0aGlzLnR5cGUgIT09IFwiaWNvblwiICYmIGNvbHVtbi5maWx0ZXJUeXBlID8gdHJ1ZSA6IGZhbHNlO1xuICAgICAgICB0aGlzLmhlYWRlckNlbGwgPSB1bmRlZmluZWQ7ICAvL0hlYWRlckNlbGwgY2xhc3MuXG4gICAgICAgIHRoaXMuaGVhZGVyRmlsdGVyID0gdW5kZWZpbmVkOyAgLy9IZWFkZXJGaWx0ZXIgY2xhc3MuXG5cbiAgICAgICAgaWYgKHRoaXMuaGFzRmlsdGVyKSB7XG4gICAgICAgICAgICB0aGlzLiNpbml0aWFsaXplRmlsdGVyKGNvbHVtbiwgc2V0dGluZ3MpO1xuICAgICAgICB9IGVsc2UgaWYgKGNvbHVtbj8uaGVhZGVyRmlsdGVyRW1wdHkpIHtcbiAgICAgICAgICAgIHRoaXMuaGVhZGVyRmlsdGVyRW1wdHkgPSAodHlwZW9mIGNvbHVtbi5oZWFkZXJGaWx0ZXJFbXB0eSA9PT0gXCJzdHJpbmdcIikgXG4gICAgICAgICAgICAgICAgPyBjb2x1bW4uaGVhZGVyRmlsdGVyRW1wdHkgOiBDc3NIZWxwZXIubm9IZWFkZXI7XG4gICAgICAgIH1cbiAgICAgICAgLy9Ub29sdGlwIHNldHRpbmcuXG4gICAgICAgIGlmIChjb2x1bW4udG9vbHRpcEZpZWxkKSB7XG4gICAgICAgICAgICB0aGlzLnRvb2x0aXBGaWVsZCA9IGNvbHVtbi50b29sdGlwRmllbGQ7XG4gICAgICAgICAgICB0aGlzLnRvb2x0aXBMYXlvdXQgPSBjb2x1bW4/LnRvb2x0aXBMYXlvdXQgPT09IFwicmlnaHRcIiA/IENzc0hlbHBlci50b29sdGlwLnJpZ2h0IDogQ3NzSGVscGVyLnRvb2x0aXAubGVmdDtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyBmaWx0ZXIgcHJvcGVydGllcy5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY29sdW1uIFxuICAgICAqIEBwYXJhbSB7U2V0dGluZ3N9IHNldHRpbmdzIFxuICAgICAqL1xuICAgICNpbml0aWFsaXplRmlsdGVyKGNvbHVtbiwgc2V0dGluZ3MpIHtcbiAgICAgICAgdGhpcy5maWx0ZXJFbGVtZW50ID0gY29sdW1uLmZpbHRlclR5cGUgPT09IFwiYmV0d2VlblwiID8gXCJiZXR3ZWVuXCIgOiBcImlucHV0XCI7XG4gICAgICAgIHRoaXMuZmlsdGVyVHlwZSA9IGNvbHVtbi5maWx0ZXJUeXBlOyAgLy9maWx0ZXIgdHlwZSBkZXNjcmlwdG9yLCBzdWNoIGFzOiBlcXVhbHMsIGxpa2UsIDwsIGV0YzsgY2FuIGFsc28gYmUgYSBmdW5jdGlvbi5cbiAgICAgICAgdGhpcy5maWx0ZXJQYXJhbXMgPSBjb2x1bW4uZmlsdGVyUGFyYW1zO1xuICAgICAgICB0aGlzLmZpbHRlckNzcyA9IGNvbHVtbj8uZmlsdGVyQ3NzID8/IHNldHRpbmdzLnRhYmxlRmlsdGVyQ3NzO1xuICAgICAgICB0aGlzLmZpbHRlclJlYWxUaW1lID0gY29sdW1uPy5maWx0ZXJSZWFsVGltZSA/PyBmYWxzZTtcblxuICAgICAgICBpZiAoY29sdW1uLmZpbHRlclZhbHVlcykge1xuICAgICAgICAgICAgdGhpcy5maWx0ZXJWYWx1ZXMgPSBjb2x1bW4uZmlsdGVyVmFsdWVzOyAgLy9zZWxlY3Qgb3B0aW9uIGZpbHRlciB2YWx1ZS5cbiAgICAgICAgICAgIHRoaXMuZmlsdGVyVmFsdWVzUmVtb3RlU291cmNlID0gdHlwZW9mIGNvbHVtbi5maWx0ZXJWYWx1ZXMgPT09IFwic3RyaW5nXCIgPyBjb2x1bW4uZmlsdGVyVmFsdWVzIDogdW5kZWZpbmVkOyAgLy9zZWxlY3Qgb3B0aW9uIGZpbHRlciB2YWx1ZSBhamF4IHNvdXJjZS5cbiAgICAgICAgICAgIHRoaXMuZmlsdGVyRWxlbWVudCA9IGNvbHVtbi5maWx0ZXJNdWx0aVNlbGVjdCA/IFwibXVsdGlcIiA6IFwic2VsZWN0XCI7XG4gICAgICAgICAgICB0aGlzLmZpbHRlck11bHRpU2VsZWN0ID0gY29sdW1uLmZpbHRlck11bHRpU2VsZWN0O1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgeyBDb2x1bW4gfTsiLCJpbXBvcnQgeyBIZWFkZXJDZWxsIH0gZnJvbSBcIi4uL2NlbGwvaGVhZGVyQ2VsbC5qc1wiO1xuaW1wb3J0IHsgQ29sdW1uIH0gZnJvbSBcIi4vY29sdW1uLmpzXCI7XG4vKipcbiAqIENyZWF0ZXMgYW5kIG1hbmFnZXMgdGhlIGNvbHVtbnMgZm9yIHRoZSBncmlkLiAgV2lsbCBjcmVhdGUgYSBgQ29sdW1uYCBvYmplY3QgZm9yIGVhY2ggY29sdW1uIGRlZmluaXRpb24gcHJvdmlkZWQgYnkgdGhlIHVzZXIuXG4gKi9cbmNsYXNzIENvbHVtbk1hbmFnZXIge1xuICAgICNjb2x1bW5zO1xuICAgICNpbmRleENvdW50ZXIgPSAwO1xuICAgIC8qKlxuICAgICAqIFRyYW5zZm9ybXMgdXNlcidzIGNvbHVtbiBkZWZpbml0aW9ucyBpbnRvIGNvbmNyZXRlIGBDb2x1bW5gIGNsYXNzIG9iamVjdHMuICBXaWxsIGFsc28gY3JlYXRlIGBIZWFkZXJDZWxsYCBvYmplY3RzIFxuICAgICAqIGZvciBlYWNoIGNvbHVtbi5cbiAgICAgKiBAcGFyYW0ge0FycmF5PE9iamVjdD59IGNvbHVtbnMgQ29sdW1uIGRlZmluaXRpb25zIGZyb20gdXNlci5cbiAgICAgKiBAcGFyYW0ge1NldHRpbmdzR3JpZH0gc2V0dGluZ3MgR3JpZCBzZXR0aW5ncy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb2x1bW5zLCBzZXR0aW5ncykge1xuICAgICAgICB0aGlzLiNjb2x1bW5zID0gW107XG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSBzZXR0aW5ncztcbiAgICAgICAgdGhpcy50YWJsZUV2ZW5Db2x1bW5XaWR0aHMgPSBzZXR0aW5ncy50YWJsZUV2ZW5Db2x1bW5XaWR0aHM7XG4gICAgICAgIHRoaXMuaGFzSGVhZGVyRmlsdGVycyA9IGZhbHNlO1xuXG4gICAgICAgIGZvciAoY29uc3QgYyBvZiBjb2x1bW5zKSB7XG4gICAgICAgICAgICBjb25zdCBjb2wgPSBuZXcgQ29sdW1uKGMsIHNldHRpbmdzLCB0aGlzLiNpbmRleENvdW50ZXIpO1xuICAgICAgICAgIFxuICAgICAgICAgICAgY29sLmhlYWRlckNlbGwgPSBuZXcgSGVhZGVyQ2VsbChjb2wpO1xuXG4gICAgICAgICAgICB0aGlzLiNjb2x1bW5zLnB1c2goY29sKTtcbiAgICAgICAgICAgIHRoaXMuI2luZGV4Q291bnRlcisrO1xuICAgICAgICB9XG4gICAgICAgIC8vIENoZWNrIGlmIGFueSBjb2x1bW4gaGFzIGEgZmlsdGVyIGRlZmluZWRcbiAgICAgICAgaWYgKHRoaXMuI2NvbHVtbnMuc29tZSgoYykgPT4gYy5oYXNGaWx0ZXIpKSB7XG4gICAgICAgICAgICB0aGlzLmhhc0hlYWRlckZpbHRlcnMgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNldHRpbmdzLnRhYmxlRXZlbkNvbHVtbldpZHRocykge1xuICAgICAgICAgICAgdGhpcy4jc2V0RXZlbkNvbHVtbldpZHRocygpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNldHMgZXZlbiBjb2x1bW4gd2lkdGhzIGZvciBhbGwgY29sdW1ucyB0aGF0IGRvIG5vdCBoYXZlIGEgd2lkdGggc2V0IGJ5IHRoZSB1c2VyLlxuICAgICAqIFRoaXMgbWV0aG9kIGNhbGN1bGF0ZXMgdGhlIHdpZHRoIGJhc2VkIG9uIHRoZSBudW1iZXIgb2YgY29sdW1ucyB3aXRob3V0IGEgdXNlci1kZWZpbmVkIHdpZHRoLlxuICAgICAqL1xuICAgICNzZXRFdmVuQ29sdW1uV2lkdGhzKCkgeyBcbiAgICAgICAgLy9Db3VudCB0aGUgbnVtYmVyIG9mIGNvbHVtbnMgdGhhdCBkbyBub3QgaGF2ZSBhIHdpZHRoIHNldCBieSB0aGUgdXNlci5cbiAgICAgICAgY29uc3QgY291bnQgPSB0aGlzLiNjb2x1bW5zLmZpbHRlcihjb2wgPT4gY29sLndpZHRoID09PSB1bmRlZmluZWQpLmxlbmd0aDtcbiAgICAgICAgY29uc3QgdXNlcldpZHRocyA9IHRoaXMuI2NvbHVtbnMuZmlsdGVyKGNvbCA9PiBjb2wud2lkdGggIT09IHVuZGVmaW5lZCkubWFwKGNvbCA9PiBjb2wud2lkdGgpO1xuICAgICAgICBsZXQgdG90YWxVc2VyV2lkdGggPSAwO1xuICAgICAgICAvLyBDaGVjayBpZiBhbnkgdXNlci1kZWZpbmVkIHdpZHRocyBhcmUgcGVyY2VudGFnZXMuICBJZiBmb3VuZCwgY2FsY3VsYXRlIHRoZSB0b3RhbCBzdW0gc28gdGhleVxuICAgICAgICAvLyBjYW4gYmUgZXhjbHVkZWQgZnJvbSB0aGUgZXZlbiB3aWR0aCBjYWxjdWxhdGlvbi5cbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHVzZXJXaWR0aHMpIHsgXG4gICAgICAgICAgICBpZiAodHlwZW9mIGl0ZW0gPT09IFwic3RyaW5nXCIgJiYgKGl0ZW0uaW5jbHVkZXMoXCIlXCIpKSkge1xuICAgICAgICAgICAgICAgIHRvdGFsVXNlcldpZHRoICs9IHBhcnNlRmxvYXQoaXRlbS5yZXBsYWNlKFwiJVwiLCBcIlwiKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB3aWR0aCA9ICgxMDAgLSB0b3RhbFVzZXJXaWR0aCkgLyBjb3VudDtcblxuICAgICAgICBmb3IgKGNvbnN0IGNvbCBvZiB0aGlzLiNjb2x1bW5zKSB7IFxuICAgICAgICAgICAgLy8gSWYgdGhlIGNvbHVtbiBhbHJlYWR5IGhhcyBhIHdpZHRoIHNldCwgc2tpcCBpdFxuICAgICAgICAgICAgaWYgKGNvbC5oZWFkZXJDZWxsLmVsZW1lbnQuc3R5bGUud2lkdGgpIGNvbnRpbnVlO1xuICAgICAgICAgICAgLy8gU2V0IHRoZSB3aWR0aCBvZiB0aGUgaGVhZGVyIGNlbGwgdG8gdGhlIGNhbGN1bGF0ZWQgZXZlbiB3aWR0aFxuICAgICAgICAgICAgY29sLmhlYWRlckNlbGwuZWxlbWVudC5zdHlsZS53aWR0aCA9IGAke3dpZHRofSVgO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEdldCBhcnJheSBvZiBgQ29sdW1uYCBvYmplY3RzLlxuICAgICAqIEByZXR1cm5zIHtBcnJheTxDb2x1bW4+fSBhcnJheSBvZiBgQ29sdW1uYCBvYmplY3RzLlxuICAgICAqL1xuICAgIGdldCBjb2x1bW5zKCkge1xuICAgICAgICByZXR1cm4gdGhpcy4jY29sdW1ucztcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBhIG5ldyBjb2x1bW4gdG8gdGhlIGNvbHVtbnMgY29sbGVjdGlvbi5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY29sdW1uIENvbHVtbiBkZWZpbml0aW9uIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW2luZGV4PW51bGxdIEluZGV4IHRvIGluc2VydCB0aGUgY29sdW1uIGF0LiBJZiBudWxsLCBhcHBlbmRzIHRvIHRoZSBlbmQuXG4gICAgICovXG4gICAgYWRkQ29sdW1uKGNvbHVtbiwgaW5kZXggPSBudWxsKSB7IFxuICAgICAgICBjb25zdCBjb2wgPSBuZXcgQ29sdW1uKGNvbHVtbiwgdGhpcy5zZXR0aW5ncywgdGhpcy4jaW5kZXhDb3VudGVyKTtcbiAgICAgICAgY29sLmhlYWRlckNlbGwgPSBuZXcgSGVhZGVyQ2VsbChjb2wpO1xuXG4gICAgICAgIGlmIChpbmRleCAhPT0gbnVsbCAmJiBpbmRleCA+PSAwICYmIGluZGV4IDwgdGhpcy4jY29sdW1ucy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRoaXMuI2NvbHVtbnMuc3BsaWNlKGluZGV4LCAwLCBjb2wpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy4jY29sdW1ucy5wdXNoKGNvbCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiNpbmRleENvdW50ZXIrKztcblxuICAgICAgICBpZiAodGhpcy50YWJsZUV2ZW5Db2x1bW5XaWR0aHMpIHtcbiAgICAgICAgICAgIHRoaXMuI3NldEV2ZW5Db2x1bW5XaWR0aHMoKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IHsgQ29sdW1uTWFuYWdlciB9OyIsIi8qKlxuICogQ2xhc3MgdG8gYnVpbGQgYSBkYXRhLXByb2Nlc3NpbmcgcGlwZWxpbmUgdGhhdCBpbnZva2VzIGFuIGFzeW5jIGZ1bmN0aW9uIHRvIHJldHJpZXZlIGRhdGEgZnJvbSBhIHJlbW90ZSBzb3VyY2UsIFxuICogYW5kIHBhc3MgdGhlIHJlc3VsdHMgdG8gYW4gYXNzb2NpYXRlZCBoYW5kbGVyIGZ1bmN0aW9uLiAgV2lsbCBleGVjdXRlIHN0ZXBzIGluIHRoZSBvcmRlciB0aGV5IGFyZSBhZGRlZCB0byB0aGUgY2xhc3MuXG4gKiBcbiAqIFRoZSBtYWluIHB1cnBvc2Ugb2YgdGhpcyBjbGFzcyBpcyB0byByZXRyaWV2ZSByZW1vdGUgZGF0YSBmb3Igc2VsZWN0IGlucHV0IGNvbnRyb2xzLCBidXQgY2FuIGJlIHVzZWQgZm9yIGFueSBoYW5kbGluZyBcbiAqIG9mIHJlbW90ZSBkYXRhIHJldHJpZXZhbCBhbmQgcHJvY2Vzc2luZy5cbiAqL1xuY2xhc3MgRGF0YVBpcGVsaW5lIHtcbiAgICAjcGlwZWxpbmVzO1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgZGF0YS1wcm9jZXNzaW5nIHBpcGVsaW5lIGNsYXNzLiAgV2lsbCBpbnRlcm5hbGx5IGJ1aWxkIGEga2V5L3ZhbHVlIHBhaXIgb2YgZXZlbnRzIGFuZCBhc3NvY2lhdGVkXG4gICAgICogY2FsbGJhY2sgZnVuY3Rpb25zLiAgVmFsdWUgd2lsbCBiZSBhbiBhcnJheSB0byBhY2NvbW1vZGF0ZSBtdWx0aXBsZSBjYWxsYmFja3MgYXNzaWduZWQgdG8gdGhlIHNhbWUgZXZlbnQgXG4gICAgICoga2V5IG5hbWUuXG4gICAgICogQHBhcmFtIHtTZXR0aW5nc0dyaWR9IHNldHRpbmdzIFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHNldHRpbmdzKSB7XG4gICAgICAgIHRoaXMuI3BpcGVsaW5lcyA9IHt9OyBcbiAgICAgICAgdGhpcy5hamF4VXJsID0gc2V0dGluZ3MuYWpheFVybDtcbiAgICB9XG5cbiAgICBjb3VudEV2ZW50U3RlcHMoZXZlbnROYW1lKSB7XG4gICAgICAgIGlmICghdGhpcy4jcGlwZWxpbmVzW2V2ZW50TmFtZV0pIHJldHVybiAwO1xuXG4gICAgICAgIHJldHVybiB0aGlzLiNwaXBlbGluZXNbZXZlbnROYW1lXS5sZW5ndGg7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIHN0ZXBzIGFyZSByZWdpc3RlcmVkIGZvciB0aGUgYXNzb2NpYXRlZCBldmVudCBuYW1lLCBvciBgZmFsc2VgIGlmIG5vIG1hdGNoaW5nIHJlc3VsdHMgYXJlIGZvdW5kLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUgRXZlbnQgbmFtZS5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gYHRydWVgIGlmIHJlc3VsdHMgYXJlIGZvdW5kIGZvciBldmVudCBuYW1lLCBvdGhlcndpc2UgYGZhbHNlYC5cbiAgICAgKi9cbiAgICBoYXNQaXBlbGluZShldmVudE5hbWUpIHtcbiAgICAgICAgaWYgKCF0aGlzLiNwaXBlbGluZXNbZXZlbnROYW1lXSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIHJldHVybiB0aGlzLiNwaXBlbGluZXNbZXZlbnROYW1lXS5sZW5ndGggPiAwO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlciBhbiBhc3luY2hyb25vdXMgY2FsbGJhY2sgc3RlcCB0byB0aGUgcGlwZWxpbmUuICBNb3JlIHRoYW4gb25lIGNhbGxiYWNrIGNhbiBiZSByZWdpc3RlcmVkIHRvIHRoZSBzYW1lIGV2ZW50IG5hbWUuXG4gICAgICogXG4gICAgICogSWYgYSBkdXBsaWNhdGUvbWF0Y2hpbmcgZXZlbnQgbmFtZSBhbmQgY2FsbGJhY2sgZnVuY3Rpb24gaGFzIGFscmVhZHkgYmVlbiByZWdpc3RlcmVkLCBtZXRob2Qgd2lsbCBza2lwIHRoZSBcbiAgICAgKiByZWdpc3RyYXRpb24gcHJvY2Vzcy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIEV2ZW50IG5hbWUuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgQW4gYXN5bmMgZnVuY3Rpb24uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFt1cmw9XCJcIl0gVGFyZ2V0IHVybC4gIFdpbGwgdXNlIGBhamF4VXJsYCBwcm9wZXJ0eSBkZWZhdWx0IGlmIGFyZ3VtZW50IGlzIGVtcHR5LlxuICAgICAqL1xuICAgIGFkZFN0ZXAoZXZlbnROYW1lLCBjYWxsYmFjaywgdXJsID0gXCJcIikge1xuICAgICAgICBpZiAoIXRoaXMuI3BpcGVsaW5lc1tldmVudE5hbWVdKSB7XG4gICAgICAgICAgICB0aGlzLiNwaXBlbGluZXNbZXZlbnROYW1lXSA9IFtdO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuI3BpcGVsaW5lc1tldmVudE5hbWVdLnNvbWUoKHgpID0+IHguY2FsbGJhY2sgPT09IGNhbGxiYWNrKSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiQ2FsbGJhY2sgZnVuY3Rpb24gYWxyZWFkeSBmb3VuZCBmb3I6IFwiICsgZXZlbnROYW1lKTtcbiAgICAgICAgICAgIHJldHVybjsgIC8vIElmIGV2ZW50IG5hbWUgYW5kIGNhbGxiYWNrIGFscmVhZHkgZXhpc3QsIGRvbid0IGFkZC5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh1cmwgPT09IFwiXCIpIHtcbiAgICAgICAgICAgIHVybCA9IHRoaXMuYWpheFVybDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuI3BpcGVsaW5lc1tldmVudE5hbWVdLnB1c2goe3VybDogdXJsLCBjYWxsYmFjazogY2FsbGJhY2t9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRXhlY3V0ZXMgdGhlIEhUVFAgcmVxdWVzdChzKSBmb3IgdGhlIGdpdmVuIGV2ZW50IG5hbWUsIGFuZCBwYXNzZXMgdGhlIHJlc3VsdHMgdG8gdGhlIGFzc29jaWF0ZWQgY2FsbGJhY2sgZnVuY3Rpb24uICBcbiAgICAgKiBNZXRob2QgZXhwZWN0cyByZXR1cm4gdHlwZSBvZiByZXF1ZXN0IHRvIGJlIGEgSlNPTiByZXNwb25zZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIFxuICAgICAqL1xuICAgIGFzeW5jIGV4ZWN1dGUoZXZlbnROYW1lKSB7XG4gICAgICAgIGZvciAobGV0IGl0ZW0gb2YgdGhpcy4jcGlwZWxpbmVzW2V2ZW50TmFtZV0pIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChpdGVtLnVybCwgeyBcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBcIkdFVFwiLCBcbiAgICAgICAgICAgICAgICAgICAgbW9kZTogXCJjb3JzXCIsXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgQWNjZXB0OiBcImFwcGxpY2F0aW9uL2pzb25cIiB9IFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uY2FsbGJhY2soZGF0YSk7XG4gICAgICAgICAgICAgICAgfSBcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5hbGVydChlcnIubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgeyBEYXRhUGlwZWxpbmUgfTsiLCJjbGFzcyBEYXRhTG9hZGVyIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgY2xhc3MgdG8gcmV0cmlldmUgZGF0YSB2aWEgYW4gQWpheCBjYWxsLlxuICAgICAqIEBwYXJhbSB7U2V0dGluZ3NHcmlkfSBzZXR0aW5ncyBncmlkIHNldHRpbmdzLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHNldHRpbmdzKSB7XG4gICAgICAgIHRoaXMuYWpheFVybCA9IHNldHRpbmdzLmFqYXhVcmw7XG4gICAgfVxuICAgIC8qKipcbiAgICAgKiBVc2VzIGlucHV0IHBhcmFtZXRlcidzIGtleS92YWx1ZSBwYXJpcyB0byBidWlsZCBhIGZ1bGx5IHF1YWxpZmllZCB1cmwgd2l0aCBxdWVyeSBzdHJpbmcgdmFsdWVzLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgVGFyZ2V0IHVybC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW3BhcmFtZXRlcnM9e31dIElucHV0IHBhcmFtZXRlcnMuXG4gICAgICogQHJldHVybnMge3N0cmluZ30gRnVsbHkgcXVhbGlmaWVkIHVybC5cbiAgICAgKi9cbiAgICBidWlsZFVybCh1cmwsIHBhcmFtZXRlcnMgPSB7fSkge1xuICAgICAgICBjb25zdCBwID0gT2JqZWN0LmtleXMocGFyYW1ldGVycyk7XG4gIFxuICAgICAgICBpZiAocC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiB1cmw7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcmVzdWx0ID0gW107XG5cbiAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgcCkge1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocGFyYW1ldGVyc1trZXldKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG11bHRpID0gcGFyYW1ldGVyc1trZXldLm1hcChrID0+IGAke2tleX09JHtlbmNvZGVVUklDb21wb25lbnQoayl9YCk7XG5cbiAgICAgICAgICAgICAgICByZXN1bHQgPSByZXN1bHQuY29uY2F0KG11bHRpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goYCR7a2V5fT0ke2VuY29kZVVSSUNvbXBvbmVudChwYXJhbWV0ZXJzW2tleV0pfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHVybC5pbmRleE9mKFwiP1wiKSAhPT0gLTEgPyBgJHt1cmx9JiR7cmVzdWx0LmpvaW4oXCImXCIpfWAgOiBgJHt1cmx9PyR7cmVzdWx0LmpvaW4oXCImXCIpfWA7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIE1ha2VzIGFuIEFqYXggY2FsbCB0byB0YXJnZXQgcmVzb3VyY2UsIGFuZCByZXR1cm5zIHRoZSByZXN1bHRzIGFzIGEgSlNPTiBhcnJheS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIHVybC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1ldGVycyBrZXkvdmFsdWUgcXVlcnkgc3RyaW5nIHBhaXJzLlxuICAgICAqIEByZXR1cm5zIHtBcnJheSB8IE9iamVjdH1cbiAgICAgKi9cbiAgICBhc3luYyByZXF1ZXN0RGF0YSh1cmwsIHBhcmFtZXRlcnMgPSB7fSkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgICAgIGNvbnN0IHRhcmdldFVybCA9IHRoaXMuYnVpbGRVcmwodXJsLCBwYXJhbWV0ZXJzKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh0YXJnZXRVcmwsIHsgXG4gICAgICAgICAgICAgICAgbWV0aG9kOiBcIkdFVFwiLCBcbiAgICAgICAgICAgICAgICBtb2RlOiBcImNvcnNcIixcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7IEFjY2VwdDogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAocmVzcG9uc2Uub2spIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgICAgICAgICB9IFxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHdpbmRvdy5hbGVydChlcnIubWVzc2FnZSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIubWVzc2FnZSk7XG4gICAgICAgICAgICByZXN1bHQgPSBbXTtcbiAgICAgICAgfVxuICBcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogTWFrZXMgYW4gQWpheCBjYWxsIHRvIHRhcmdldCByZXNvdXJjZSBpZGVudGlmaWVkIGluIHRoZSBgYWpheFVybGAgU2V0dGluZ3MgcHJvcGVydHksIGFuZCByZXR1cm5zIHRoZSByZXN1bHRzIGFzIGEgSlNPTiBhcnJheS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW3BhcmFtZXRlcnM9e31dIGtleS92YWx1ZSBxdWVyeSBzdHJpbmcgcGFpcnMuXG4gICAgICogQHJldHVybnMge0FycmF5IHwgT2JqZWN0fVxuICAgICAqL1xuICAgIGFzeW5jIHJlcXVlc3RHcmlkRGF0YShwYXJhbWV0ZXJzID0ge30pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVxdWVzdERhdGEodGhpcy5hamF4VXJsLCBwYXJhbWV0ZXJzKTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IERhdGFMb2FkZXIgfTsiLCIvKipcbiAqIFByb3ZpZGVzIG1ldGhvZHMgdG8gc3RvcmUgYW5kIHBlcnNpc3QgZGF0YSBmb3IgdGhlIGdyaWQuXG4gKi9cbmNsYXNzIERhdGFQZXJzaXN0ZW5jZSB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBjbGFzcyBvYmplY3QgdG8gc3RvcmUgYW5kIHBlcnNpc3QgZ3JpZCBkYXRhLlxuICAgICAqIEBwYXJhbSB7QXJyYXk8T2JqZWN0Pn0gZGF0YSByb3cgZGF0YS5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihkYXRhKSB7XG4gICAgICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gICAgICAgIHRoaXMuZGF0YUNhY2hlID0gZGF0YS5sZW5ndGggPiAwID8gc3RydWN0dXJlZENsb25lKGRhdGEpIDogW107XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHJvdyBkYXRhLlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IENvdW50IG9mIHJvd3MgaW4gdGhlIGRhdGEuXG4gICAgICovXG4gICAgZ2V0IHJvd0NvdW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kYXRhLmxlbmd0aDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2F2ZXMgdGhlIGRhdGEgdG8gdGhlIGNsYXNzIG9iamVjdC4gIFdpbGwgYWxzbyBjYWNoZSBhIGNvcHkgb2YgdGhlIGRhdGEgZm9yIGxhdGVyIHJlc3RvcmF0aW9uIGlmIGZpbHRlcmluZyBvciBzb3J0aW5nIGlzIGFwcGxpZWQuXG4gICAgICogQHBhcmFtIHtBcnJheTxvYmplY3Q+fSBkYXRhIERhdGEgc2V0LlxuICAgICAqL1xuICAgIHNldERhdGEgPSAoZGF0YSkgPT4ge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoZGF0YSkpIHtcbiAgICAgICAgICAgIHRoaXMuZGF0YSA9IFtdO1xuICAgICAgICAgICAgdGhpcy5kYXRhQ2FjaGUgPSBbXTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gICAgICAgIHRoaXMuZGF0YUNhY2hlID0gZGF0YS5sZW5ndGggPiAwID8gc3RydWN0dXJlZENsb25lKGRhdGEpIDogW107XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBSZXNldHMgdGhlIGRhdGEgdG8gdGhlIG9yaWdpbmFsIHN0YXRlIHdoZW4gdGhlIGNsYXNzIHdhcyBjcmVhdGVkLlxuICAgICAqL1xuICAgIHJlc3RvcmVEYXRhKCkge1xuICAgICAgICB0aGlzLmRhdGEgPSBzdHJ1Y3R1cmVkQ2xvbmUodGhpcy5kYXRhQ2FjaGUpO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRGF0YVBlcnNpc3RlbmNlIH07IiwiLyoqXG4gKiBDbGFzcyB0aGF0IGFsbG93cyB0aGUgc3Vic2NyaXB0aW9uIGFuZCBwdWJsaWNhdGlvbiBvZiBncmlkIHJlbGF0ZWQgZXZlbnRzLlxuICogQGNsYXNzXG4gKi9cbmNsYXNzIEdyaWRFdmVudHMge1xuICAgICNldmVudHM7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy4jZXZlbnRzID0ge307XG4gICAgfVxuXG4gICAgI2d1YXJkKGV2ZW50TmFtZSkge1xuICAgICAgICBpZiAoIXRoaXMuI2V2ZW50cykgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIHJldHVybiAodGhpcy4jZXZlbnRzW2V2ZW50TmFtZV0pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIGFuIGV2ZW50IHRvIHB1Ymxpc2hlciBjb2xsZWN0aW9uLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUgRXZlbnQgbmFtZS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyIENhbGxiYWNrIGZ1bmN0aW9uLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzQXN5bmM9ZmFsc2VdIFRydWUgaWYgY2FsbGJhY2sgc2hvdWxkIGV4ZWN1dGUgd2l0aCBhd2FpdCBvcGVyYXRpb24uXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtwcmlvcml0eT0wXSBPcmRlciBpbiB3aGljaCBldmVudCBzaG91bGQgYmUgZXhlY3V0ZWQuXG4gICAgICovXG4gICAgc3Vic2NyaWJlKGV2ZW50TmFtZSwgaGFuZGxlciwgaXNBc3luYyA9IGZhbHNlLCBwcmlvcml0eSA9IDApIHtcbiAgICAgICAgaWYgKCF0aGlzLiNldmVudHNbZXZlbnROYW1lXSkge1xuICAgICAgICAgICAgdGhpcy4jZXZlbnRzW2V2ZW50TmFtZV0gPSBbeyBoYW5kbGVyLCBwcmlvcml0eSwgaXNBc3luYyB9XTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy4jZXZlbnRzW2V2ZW50TmFtZV0ucHVzaCh7IGhhbmRsZXIsIHByaW9yaXR5LCBpc0FzeW5jIH0pO1xuICAgICAgICB0aGlzLiNldmVudHNbZXZlbnROYW1lXS5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYS5wcmlvcml0eSAtIGIucHJpb3JpdHk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIHRoZSB0YXJnZXQgZXZlbnQgZnJvbSB0aGUgcHVibGljYXRpb24gY2hhaW4uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSBFdmVudCBuYW1lLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXIgRXZlbnQgaGFuZGxlci5cbiAgICAgKi9cbiAgICB1bnN1YnNjcmliZShldmVudE5hbWUsIGhhbmRsZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLiNndWFyZChldmVudE5hbWUpKSByZXR1cm47XG5cbiAgICAgICAgdGhpcy4jZXZlbnRzW2V2ZW50TmFtZV0gPSB0aGlzLiNldmVudHNbZXZlbnROYW1lXS5maWx0ZXIoaCA9PiBoLmhhbmRsZXIgIT09IGhhbmRsZXIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBUYWtlcyB0aGUgcmVzdWx0IG9mIGVhY2ggc3Vic2NyaWJlcidzIGNhbGxiYWNrIGZ1bmN0aW9uIGFuZCBjaGFpbnMgdGhlbSBpbnRvIG9uZSByZXN1bHQuXG4gICAgICogVXNlZCB0byBjcmVhdGUgYSBsaXN0IG9mIHBhcmFtZXRlcnMgZnJvbSBtdWx0aXBsZSBtb2R1bGVzOiBpLmUuIHNvcnQsIGZpbHRlciwgYW5kIHBhZ2luZyBpbnB1dHMuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSBldmVudCBuYW1lXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtpbml0aWFsVmFsdWU9e31dIGluaXRpYWwgdmFsdWVcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fVxuICAgICAqL1xuICAgIGNoYWluKGV2ZW50TmFtZSwgaW5pdGlhbFZhbHVlID0ge30pIHtcbiAgICAgICAgaWYgKCF0aGlzLiNndWFyZChldmVudE5hbWUpKSByZXR1cm47XG5cbiAgICAgICAgbGV0IHJlc3VsdCA9IGluaXRpYWxWYWx1ZTtcblxuICAgICAgICB0aGlzLiNldmVudHNbZXZlbnROYW1lXS5mb3JFYWNoKChoKSA9PiB7XG4gICAgICAgICAgICByZXN1bHQgPSBoLmhhbmRsZXIocmVzdWx0KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogVHJpZ2dlciBjYWxsYmFjayBmdW5jdGlvbiBmb3Igc3Vic2NyaWJlcnMgb2YgdGhlIGBldmVudE5hbWVgLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUgRXZlbnQgbmFtZS5cbiAgICAgKiBAcGFyYW0gIHsuLi5hbnl9IGFyZ3MgQXJndW1lbnRzLlxuICAgICAqL1xuICAgIGFzeW5jIHRyaWdnZXIoZXZlbnROYW1lLCAuLi5hcmdzKSB7XG4gICAgICAgIGlmICghdGhpcy4jZ3VhcmQoZXZlbnROYW1lKSkgcmV0dXJuO1xuXG4gICAgICAgIGZvciAobGV0IGggb2YgdGhpcy4jZXZlbnRzW2V2ZW50TmFtZV0pIHtcbiAgICAgICAgICAgIGlmIChoLmlzQXN5bmMpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBoLmhhbmRsZXIoLi4uYXJncyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGguaGFuZGxlciguLi5hcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IHsgR3JpZEV2ZW50cyB9OyIsImNsYXNzIERhdGVIZWxwZXIge1xuICAgIHN0YXRpYyB0aW1lUmVHZXggPSBuZXcgUmVnRXhwKFwiWzAtOV06WzAtOV1cIik7XG4gICAgLyoqXG4gICAgICogQ29udmVydCBzdHJpbmcgdG8gRGF0ZSBvYmplY3QgdHlwZS4gIEV4cGVjdHMgc3RyaW5nIGZvcm1hdCBvZiB5ZWFyLW1vbnRoLWRheS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgU3RyaW5nIGRhdGUgd2l0aCBmb3JtYXQgb2YgeWVhci1tb250aC1kYXkuXG4gICAgICogQHJldHVybnMge0RhdGUgfCBzdHJpbmd9IERhdGUgaWYgY29udmVyc2lvbiBpcyBzdWNjZXNzZnVsLiAgT3RoZXJ3aXNlLCBlbXB0eSBzdHJpbmcuXG4gICAgICovXG4gICAgc3RhdGljIHBhcnNlRGF0ZSh2YWx1ZSkge1xuICAgICAgICAvL0NoZWNrIGlmIHN0cmluZyBpcyBkYXRlIG9ubHkgYnkgbG9va2luZyBmb3IgbWlzc2luZyB0aW1lIGNvbXBvbmVudC4gIFxuICAgICAgICAvL0lmIG1pc3NpbmcsIGFkZCBpdCBzbyBkYXRlIGlzIGludGVycHJldGVkIGFzIGxvY2FsIHRpbWUuXG4gICAgICAgIGlmICghdGhpcy50aW1lUmVHZXgudGVzdCh2YWx1ZSkpIHtcbiAgICAgICAgICAgIHZhbHVlID0gYCR7dmFsdWV9VDAwOjAwYDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRhdGUgPSBuZXcgRGF0ZSh2YWx1ZSk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gKE51bWJlci5pc05hTihkYXRlLnZhbHVlT2YoKSkpID8gXCJcIiA6IGRhdGU7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENvbnZlcnQgc3RyaW5nIHRvIERhdGUgb2JqZWN0IHR5cGUsIHNldHRpbmcgdGhlIHRpbWUgY29tcG9uZW50IHRvIG1pZG5pZ2h0LiAgRXhwZWN0cyBzdHJpbmcgZm9ybWF0IG9mIHllYXItbW9udGgtZGF5LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSBTdHJpbmcgZGF0ZSB3aXRoIGZvcm1hdCBvZiB5ZWFyLW1vbnRoLWRheS5cbiAgICAgKiBAcmV0dXJucyB7RGF0ZSB8IHN0cmluZ30gRGF0ZSBpZiBjb252ZXJzaW9uIGlzIHN1Y2Nlc3NmdWwuICBPdGhlcndpc2UsIGVtcHR5IHN0cmluZy5cbiAgICAgKi9cbiAgICBzdGF0aWMgcGFyc2VEYXRlT25seSh2YWx1ZSkge1xuICAgICAgICBjb25zdCBkYXRlID0gdGhpcy5wYXJzZURhdGUodmFsdWUpO1xuXG4gICAgICAgIGlmIChkYXRlID09PSBcIlwiKSByZXR1cm4gXCJcIjsgIC8vSW52YWxpZCBkYXRlLlxuXG4gICAgICAgIGRhdGUuc2V0SG91cnMoMCwgMCwgMCwgMCk7IC8vU2V0IHRpbWUgdG8gbWlkbmlnaHQgdG8gcmVtb3ZlIHRpbWUgY29tcG9uZW50LlxuXG4gICAgICAgIHJldHVybiBkYXRlO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiB2YWx1ZSBpcyBhIERhdGUgb2JqZWN0IHR5cGUuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHZhbHVlIFxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB2YWx1ZSBpcyBhIERhdGUgb2JqZWN0IHR5cGUsIG90aGVyd2lzZSBgZmFsc2VgLlxuICAgICAqL1xuICAgIHN0YXRpYyBpc0RhdGUodmFsdWUpIHsgXG4gICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpID09PSBcIltvYmplY3QgRGF0ZV1cIjtcblxuICAgIH1cbn1cblxuZXhwb3J0IHsgRGF0ZUhlbHBlciB9OyIsImltcG9ydCB7IERhdGVIZWxwZXIgfSBmcm9tIFwiLi4vLi4vLi4vaGVscGVycy9kYXRlSGVscGVyLmpzXCI7XG4vKipcbiAqIFByb3ZpZGVzIG1ldGhvZHMgdG8gZm9ybWF0IGRhdGUgYW5kIHRpbWUgc3RyaW5ncy4gIEV4cGVjdHMgZGF0ZSBzdHJpbmcgaW4gZm9ybWF0IG9mIHllYXItbW9udGgtZGF5LlxuICovXG5jbGFzcyBGb3JtYXREYXRlVGltZSB7XG4gICAgc3RhdGljIG1vbnRoc0xvbmcgPSBbXCJKYW51YXJ5XCIsIFwiRmVicnVhcnlcIiwgXCJNYXJjaFwiLCBcIkFwcmlsXCIsIFwiTWF5XCIsIFwiSnVuZVwiLCBcIkp1bHlcIiwgXCJBdWd1c3RcIiwgXCJTZXB0ZW1iZXJcIiwgXCJPY3RvYmVyXCIsIFwiTm92ZW1iZXJcIiwgXCJEZWNlbWJlclwiXTtcbiAgICBzdGF0aWMgbW9udGhzU2hvcnQgPSBbXCJKYW5cIiwgXCJGZWJcIiwgXCJNYXJcIiwgXCJBcHJcIiwgXCJNYXlcIiwgXCJKdW5cIiwgXCJKdWxcIiwgXCJBdWdcIiwgXCJTZXBcIiwgXCJPY3RcIiwgXCJOb3ZcIiwgXCJEZWNcIl07XG5cbiAgICBzdGF0aWMgbGVhZGluZ1plcm8obnVtKSB7XG4gICAgICAgIHJldHVybiBudW0gPCAxMCA/IFwiMFwiICsgbnVtIDogbnVtO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgZm9ybWF0dGVkIGRhdGUgdGltZSBzdHJpbmcuICBFeHBlY3RzIGRhdGUgc3RyaW5nIGluIGZvcm1hdCBvZiB5ZWFyLW1vbnRoLWRheS4gIElmIGBmb3JtYXR0ZXJQYXJhbXNgIGlzIGVtcHR5LCBcbiAgICAgKiBmdW5jdGlvbiB3aWxsIHJldmVydCB0byBkZWZhdWx0IHZhbHVlcy4gRXhwZWN0ZWQgcHJvcGVydHkgdmFsdWVzIGluIGBmb3JtYXR0ZXJQYXJhbXNgIG9iamVjdDpcbiAgICAgKiAtIGRhdGVGaWVsZDogZmllbGQgdG8gY29udmVydCBkYXRlIHRpbWUuXG4gICAgICogLSBmb3JtYXQ6IHN0cmluZyBmb3JtYXQgdGVtcGxhdGUuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHJvd0RhdGEgUm93IGRhdGEuXG4gICAgICogQHBhcmFtIHtDb2x1bW59IGNvbHVtbiBDb2x1bW4gY2xhc3Mgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkZWZhdWx0Rm9ybWF0IERlZmF1bHQgc3RyaW5nIGZvcm1hdDogTU0vZGQveXl5eVxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2FkZFRpbWU9ZmFsc2VdIEFwcGx5IGRhdGUgdGltZSBmb3JtYXR0aW5nP1xuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgc3RhdGljIGFwcGx5KHJvd0RhdGEsIGNvbHVtbiwgZGVmYXVsdEZvcm1hdCA9IFwiTU0vZGQveXl5eVwiLCBhZGRUaW1lID0gZmFsc2UpIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IGNvbHVtbj8uZm9ybWF0dGVyUGFyYW1zPy5mb3JtYXQgPz8gZGVmYXVsdEZvcm1hdDtcbiAgICAgICAgbGV0IGZpZWxkID0gY29sdW1uPy5mb3JtYXR0ZXJQYXJhbXM/LmRhdGVGaWVsZCBcbiAgICAgICAgICAgID8gcm93RGF0YVtjb2x1bW4uZm9ybWF0dGVyUGFyYW1zLmRhdGVGaWVsZF1cbiAgICAgICAgICAgIDogcm93RGF0YVtjb2x1bW4uZmllbGRdO1xuXG4gICAgICAgIGlmIChmaWVsZCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkYXRlID0gRGF0ZUhlbHBlci5wYXJzZURhdGUoZmllbGQpO1xuXG4gICAgICAgIGlmIChkYXRlID09PSBcIlwiKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBmb3JtYXRzID0ge1xuICAgICAgICAgICAgZDogZGF0ZS5nZXREYXRlKCksXG4gICAgICAgICAgICBkZDogdGhpcy5sZWFkaW5nWmVybyhkYXRlLmdldERhdGUoKSksXG5cbiAgICAgICAgICAgIE06IGRhdGUuZ2V0TW9udGgoKSArIDEsXG4gICAgICAgICAgICBNTTogdGhpcy5sZWFkaW5nWmVybyhkYXRlLmdldE1vbnRoKCkgKyAxKSxcbiAgICAgICAgICAgIE1NTTogdGhpcy5tb250aHNTaG9ydFtkYXRlLmdldE1vbnRoKCldLFxuICAgICAgICAgICAgTU1NTTogdGhpcy5tb250aHNMb25nW2RhdGUuZ2V0TW9udGgoKV0sXG5cbiAgICAgICAgICAgIHl5OiBkYXRlLmdldEZ1bGxZZWFyKCkudG9TdHJpbmcoKS5zbGljZSgtMiksXG4gICAgICAgICAgICB5eXl5OiBkYXRlLmdldEZ1bGxZZWFyKClcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoYWRkVGltZSkge1xuICAgICAgICAgICAgbGV0IGhvdXJzID0gZGF0ZS5nZXRIb3VycygpO1xuICAgICAgICAgICAgbGV0IGhvdXJzMTIgPSBob3VycyAlIDEyID09PSAwID8gMTIgOiBob3VycyAlIDEyO1xuXG4gICAgICAgICAgICBmb3JtYXRzLnMgPSBkYXRlLmdldFNlY29uZHMoKTtcbiAgICAgICAgICAgIGZvcm1hdHMuc3MgPSB0aGlzLmxlYWRpbmdaZXJvKGRhdGUuZ2V0U2Vjb25kcygpKTtcbiAgICAgICAgICAgIGZvcm1hdHMubSA9IGRhdGUuZ2V0TWludXRlcygpO1xuICAgICAgICAgICAgZm9ybWF0cy5tbSA9IHRoaXMubGVhZGluZ1plcm8oZGF0ZS5nZXRNaW51dGVzKCkpO1xuICAgICAgICAgICAgZm9ybWF0cy5oID0gaG91cnMxMjtcbiAgICAgICAgICAgIGZvcm1hdHMuaGggPSAgdGhpcy5sZWFkaW5nWmVybyhob3VyczEyKTtcbiAgICAgICAgICAgIGZvcm1hdHMuSCA9IGhvdXJzO1xuICAgICAgICAgICAgZm9ybWF0cy5ISCA9IHRoaXMubGVhZGluZ1plcm8oaG91cnMpO1xuICAgICAgICAgICAgZm9ybWF0cy5ocCA9IGhvdXJzIDwgMTIgPyBcIkFNXCIgOiBcIlBNXCI7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0YXJnZXRzID0gcmVzdWx0LnNwbGl0KC9cXC98LXxcXHN8Oi8pO1xuXG4gICAgICAgIGZvciAobGV0IGl0ZW0gb2YgdGFyZ2V0cykge1xuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UoaXRlbSwgZm9ybWF0c1tpdGVtXSk7XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEZvcm1hdERhdGVUaW1lIH07IiwiLyoqXG4gKiBQcm92aWRlcyBtZXRob2QgdG8gZm9ybWF0IGEgbGluayBhcyBhbiBhbmNob3IgdGFnIGVsZW1lbnQuXG4gKi9cbmNsYXNzIEZvcm1hdExpbmsge1xuICAgIC8qKlxuICAgICAqIEZvcm1hdHRlciB0aGF0IGNyZWF0ZSBhbiBhbmNob3IgdGFnIGVsZW1lbnQuIGhyZWYgYW5kIG90aGVyIGF0dHJpYnV0ZXMgY2FuIGJlIG1vZGlmaWVkIHdpdGggcHJvcGVydGllcyBpbiB0aGUgXG4gICAgICogJ2Zvcm1hdHRlclBhcmFtcycgcGFyYW1ldGVyLiAgRXhwZWN0ZWQgcHJvcGVydHkgdmFsdWVzOiBcbiAgICAgKiAtIHVybFByZWZpeDogQmFzZSB1cmwgYWRkcmVzcy5cbiAgICAgKiAtIHJvdXRlRmllbGQ6IFJvdXRlIHZhbHVlLlxuICAgICAqIC0gcXVlcnlGaWVsZDogRmllbGQgbmFtZSBmcm9tIGRhdGFzZXQgdG8gYnVpbGQgcXVlcnkgc3Rpbmcga2V5L3ZhbHVlIGlucHV0LlxuICAgICAqIC0gZmllbGRUZXh0OiBVc2UgZmllbGQgbmFtZSB0byBzZXQgaW5uZXIgdGV4dCB0byBhc3NvY2lhdGVkIGRhdGFzZXQgdmFsdWUuXG4gICAgICogLSBpbm5lclRleHQ6IFJhdyBpbm5lciB0ZXh0IHZhbHVlIG9yIGZ1bmN0aW9uLiAgSWYgZnVuY3Rpb24gaXMgcHJvdmlkZWQsIGl0IHdpbGwgYmUgY2FsbGVkIHdpdGggcm93RGF0YSBhbmQgZm9ybWF0dGVyUGFyYW1zIGFzIHBhcmFtZXRlcnMuXG4gICAgICogLSB0YXJnZXQ6IEhvdyB0YXJnZXQgZG9jdW1lbnQgc2hvdWxkIGJlIG9wZW5lZC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcm93RGF0YSBSb3cgZGF0YS5cbiAgICAgKiBAcGFyYW0ge3sgdXJsUHJlZml4OiBzdHJpbmcsIHF1ZXJ5RmllbGQ6IHN0cmluZywgZmllbGRUZXh0OiBzdHJpbmcsIGlubmVyVGV4dDogc3RyaW5nIHwgRnVuY3Rpb24sIHRhcmdldDogc3RyaW5nIH19IGZvcm1hdHRlclBhcmFtcyBTZXR0aW5ncy5cbiAgICAgKiBAcmV0dXJuIHtIVE1MQW5jaG9yRWxlbWVudH0gYW5jaG9yIHRhZyBlbGVtZW50LlxuICAgICAqICovXG4gICAgc3RhdGljIGFwcGx5KHJvd0RhdGEsIGZvcm1hdHRlclBhcmFtcykge1xuICAgICAgICBjb25zdCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuXG4gICAgICAgIGxldCB1cmwgPSBmb3JtYXR0ZXJQYXJhbXMudXJsUHJlZml4O1xuICAgICAgICAvL0FwcGx5IHJvdXRlIHZhbHVlIGJlZm9yZSBxdWVyeSBzdHJpbmcuXG4gICAgICAgIGlmIChmb3JtYXR0ZXJQYXJhbXMucm91dGVGaWVsZCkge1xuICAgICAgICAgICAgdXJsICs9IFwiL1wiICsgZW5jb2RlVVJJQ29tcG9uZW50KHJvd0RhdGFbZm9ybWF0dGVyUGFyYW1zLnJvdXRlRmllbGRdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChmb3JtYXR0ZXJQYXJhbXMucXVlcnlGaWVsZCkge1xuICAgICAgICAgICAgY29uc3QgcXJ5VmFsdWUgPSBlbmNvZGVVUklDb21wb25lbnQocm93RGF0YVtmb3JtYXR0ZXJQYXJhbXMucXVlcnlGaWVsZF0pO1xuXG4gICAgICAgICAgICB1cmwgPSBgJHt1cmx9PyR7Zm9ybWF0dGVyUGFyYW1zLnF1ZXJ5RmllbGR9PSR7cXJ5VmFsdWV9YDtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsLmhyZWYgPSB1cmw7XG5cbiAgICAgICAgaWYgKGZvcm1hdHRlclBhcmFtcy5maWVsZFRleHQpIHtcbiAgICAgICAgICAgIGVsLmlubmVySFRNTCA9IHJvd0RhdGFbZm9ybWF0dGVyUGFyYW1zLmZpZWxkVGV4dF07XG4gICAgICAgIH0gZWxzZSBpZiAoKHR5cGVvZiBmb3JtYXR0ZXJQYXJhbXMuaW5uZXJUZXh0ID09PSBcImZ1bmN0aW9uXCIpKSB7XG4gICAgICAgICAgICBlbC5pbm5lckhUTUwgPSBmb3JtYXR0ZXJQYXJhbXMuaW5uZXJUZXh0KHJvd0RhdGEsIGZvcm1hdHRlclBhcmFtcyk7XG4gICAgICAgIH0gZWxzZSBpZiAoZm9ybWF0dGVyUGFyYW1zLmlubmVyVGV4dCkge1xuICAgICAgICAgICAgZWwuaW5uZXJIVE1MID0gZm9ybWF0dGVyUGFyYW1zLmlubmVyVGV4dDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChmb3JtYXR0ZXJQYXJhbXMudGFyZ2V0KSB7XG4gICAgICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoXCJ0YXJnZXRcIiwgZm9ybWF0dGVyUGFyYW1zLnRhcmdldCk7XG4gICAgICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoXCJyZWxcIiwgXCJub29wZW5lclwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBlbDtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEZvcm1hdExpbmsgfTsiLCIvKipcbiAqIFByb3ZpZGVzIG1ldGhvZCB0byBmb3JtYXQgbnVtZXJpYyB2YWx1ZXMgaW50byBzdHJpbmdzIHdpdGggc3BlY2lmaWVkIHN0eWxlcyBvZiBkZWNpbWFsLCBjdXJyZW5jeSwgb3IgcGVyY2VudC5cbiAqL1xuY2xhc3MgRm9ybWF0TnVtZXJpYyB7XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIGZvcm1hdHRlZCBudW1lcmljIHN0cmluZy4gIGBjb2x1bW5gIGlzIGV4cGVjdGVkIHRvIGhhdmUgdGhlIGZvbGxvd2luZyBwcm9wZXJ0eSB2YWx1ZXMgXG4gICAgICogaW4gYGZvcm1hdHRlclBhcmFtc2Agb2JqZWN0OiBcbiAgICAgKiAtIHByZWNpc2lvbjogcm91bmRpbmcgcHJlY2lzaW9uLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSByb3dEYXRhIFJvdyBkYXRhLlxuICAgICAqIEBwYXJhbSB7Q29sdW1ufSBjb2x1bW4gQ29sdW1uIGNsYXNzIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW3N0eWxlPVwiZGVjaW1hbFwiXSBGb3JtYXR0aW5nIHN0eWxlIHRvIHVzZS4gRGVmYXVsdCBpcyBcImRlY2ltYWxcIi5cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqL1xuICAgIHN0YXRpYyBhcHBseShyb3dEYXRhLCBjb2x1bW4sIHN0eWxlID0gXCJkZWNpbWFsXCIpIHtcbiAgICAgICAgY29uc3QgZmxvYXRWYWwgPSByb3dEYXRhW2NvbHVtbi5maWVsZF07XG5cbiAgICAgICAgaWYgKGlzTmFOKGZsb2F0VmFsKSkgcmV0dXJuIGZsb2F0VmFsO1xuXG4gICAgICAgIGNvbnN0IHByZWNpc2lvbiA9IGNvbHVtbi5mb3JtYXR0ZXJQYXJhbXM/LnByZWNpc2lvbiA/PyAyO1xuXG4gICAgICAgIHJldHVybiBuZXcgSW50bC5OdW1iZXJGb3JtYXQoXCJlbi1VU1wiLCB7XG4gICAgICAgICAgICBzdHlsZTogc3R5bGUsXG4gICAgICAgICAgICBtYXhpbXVtRnJhY3Rpb25EaWdpdHM6IHByZWNpc2lvbixcbiAgICAgICAgICAgIGN1cnJlbmN5OiBcIlVTRFwiXG4gICAgICAgIH0pLmZvcm1hdChmbG9hdFZhbCk7XG4gICAgfVxufVxuXG5leHBvcnQgeyBGb3JtYXROdW1lcmljIH07IiwiY2xhc3MgRm9ybWF0U3RhciB7XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhbiBlbGVtZW50IG9mIHN0YXIgcmF0aW5ncyBiYXNlZCBvbiBpbnRlZ2VyIHZhbHVlcy4gIEV4cGVjdGVkIHByb3BlcnR5IHZhbHVlczogXG4gICAgICogLSBzdGFyczogbnVtYmVyIG9mIHN0YXJzIHRvIGRpc3BsYXkuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHJvd0RhdGEgcm93IGRhdGEuXG4gICAgICogQHBhcmFtIHtDb2x1bW59IGNvbHVtbiBjb2x1bW4gY2xhc3Mgb2JqZWN0LlxuICAgICAqIEByZXR1cm5zIHtIVE1MRGl2RWxlbWVudH1cbiAgICAgKi9cbiAgICBzdGF0aWMgYXBwbHkocm93RGF0YSwgY29sdW1uKSB7XG4gICAgICAgIGxldCB2YWx1ZSA9IHJvd0RhdGFbY29sdW1uLmZpZWxkXTtcbiAgICAgICAgY29uc3QgbWF4U3RhcnMgPSBjb2x1bW4uZm9ybWF0dGVyUGFyYW1zPy5zdGFycyA/IGNvbHVtbi5mb3JtYXR0ZXJQYXJhbXMuc3RhcnMgOiA1O1xuICAgICAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICBjb25zdCBzdGFycyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBjb25zdCBzdGFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgXCJzdmdcIik7XG4gICAgICAgIGNvbnN0IHN0YXJBY3RpdmUgPSAnPHBvbHlnb24gZmlsbD1cIiNGRkVBMDBcIiBzdHJva2U9XCIjQzFBQjYwXCIgc3Ryb2tlLXdpZHRoPVwiMzcuNjE1MlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiIHN0cm9rZS1taXRlcmxpbWl0PVwiMTBcIiBwb2ludHM9XCIyNTkuMjE2LDI5Ljk0MiAzMzAuMjcsMTczLjkxOSA0ODkuMTYsMTk3LjAwNyAzNzQuMTg1LDMwOS4wOCA0MDEuMzMsNDY3LjMxIDI1OS4yMTYsMzkyLjYxMiAxMTcuMTA0LDQ2Ny4zMSAxNDQuMjUsMzA5LjA4IDI5LjI3NCwxOTcuMDA3IDE4OC4xNjUsMTczLjkxOSBcIi8+JztcbiAgICAgICAgY29uc3Qgc3RhckluYWN0aXZlID0gJzxwb2x5Z29uIGZpbGw9XCIjRDJEMkQyXCIgc3Ryb2tlPVwiIzY4Njg2OFwiIHN0cm9rZS13aWR0aD1cIjM3LjYxNTJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIiBzdHJva2UtbWl0ZXJsaW1pdD1cIjEwXCIgcG9pbnRzPVwiMjU5LjIxNiwyOS45NDIgMzMwLjI3LDE3My45MTkgNDg5LjE2LDE5Ny4wMDcgMzc0LjE4NSwzMDkuMDggNDAxLjMzLDQ2Ny4zMSAyNTkuMjE2LDM5Mi42MTIgMTE3LjEwNCw0NjcuMzEgMTQ0LjI1LDMwOS4wOCAyOS4yNzQsMTk3LjAwNyAxODguMTY1LDE3My45MTkgXCIvPic7XG5cbiAgICAgICAgLy9zdHlsZSBzdGFycyBob2xkZXJcbiAgICAgICAgc3RhcnMuc3R5bGUudmVydGljYWxBbGlnbiA9IFwibWlkZGxlXCI7XG4gICAgICAgIC8vc3R5bGUgc3RhclxuICAgICAgICBzdGFyLnNldEF0dHJpYnV0ZShcIndpZHRoXCIsIFwiMTRcIik7XG4gICAgICAgIHN0YXIuc2V0QXR0cmlidXRlKFwiaGVpZ2h0XCIsIFwiMTRcIik7XG4gICAgICAgIHN0YXIuc2V0QXR0cmlidXRlKFwidmlld0JveFwiLCBcIjAgMCA1MTIgNTEyXCIpO1xuICAgICAgICBzdGFyLnNldEF0dHJpYnV0ZShcInhtbDpzcGFjZVwiLCBcInByZXNlcnZlXCIpO1xuICAgICAgICBzdGFyLnN0eWxlLnBhZGRpbmcgPSBcIjAgMXB4XCI7XG5cbiAgICAgICAgdmFsdWUgPSB2YWx1ZSAmJiAhaXNOYU4odmFsdWUpID8gcGFyc2VJbnQodmFsdWUpIDogMDtcbiAgICAgICAgdmFsdWUgPSBNYXRoLm1heCgwLCBNYXRoLm1pbih2YWx1ZSwgbWF4U3RhcnMpKTtcblxuICAgICAgICBmb3IobGV0IGkgPSAxOyBpIDw9IG1heFN0YXJzOyBpKyspe1xuICAgICAgICAgICAgY29uc3QgbmV4dFN0YXIgPSBzdGFyLmNsb25lTm9kZSh0cnVlKTtcblxuICAgICAgICAgICAgbmV4dFN0YXIuaW5uZXJIVE1MID0gaSA8PSB2YWx1ZSA/IHN0YXJBY3RpdmUgOiBzdGFySW5hY3RpdmU7XG5cbiAgICAgICAgICAgIHN0YXJzLmFwcGVuZENoaWxkKG5leHRTdGFyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS53aGl0ZVNwYWNlID0gXCJub3dyYXBcIjtcbiAgICAgICAgY29udGFpbmVyLnN0eWxlLm92ZXJmbG93ID0gXCJoaWRkZW5cIjtcbiAgICAgICAgY29udGFpbmVyLnN0eWxlLnRleHRPdmVyZmxvdyA9IFwiZWxsaXBzaXNcIjtcbiAgICAgICAgY29udGFpbmVyLnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwgdmFsdWUpO1xuICAgICAgICBjb250YWluZXIuYXBwZW5kKHN0YXJzKTtcblxuICAgICAgICByZXR1cm4gY29udGFpbmVyO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRm9ybWF0U3RhciB9OyIsImltcG9ydCB7IEZvcm1hdERhdGVUaW1lIH0gZnJvbSBcIi4vZm9ybWF0dGVycy9kYXRldGltZS5qc1wiO1xuaW1wb3J0IHsgRm9ybWF0TGluayB9IGZyb20gXCIuL2Zvcm1hdHRlcnMvbGluay5qc1wiO1xuaW1wb3J0IHsgRm9ybWF0TnVtZXJpYyB9IGZyb20gXCIuL2Zvcm1hdHRlcnMvbnVtZXJpYy5qc1wiO1xuaW1wb3J0IHsgRm9ybWF0U3RhciB9IGZyb20gXCIuL2Zvcm1hdHRlcnMvc3Rhci5qc1wiO1xuaW1wb3J0IHsgQ3NzSGVscGVyIH0gZnJvbSBcIi4uLy4uL2hlbHBlcnMvY3NzSGVscGVyLmpzXCI7XG4vKipcbiAqIFJlcHJlc2VudHMgYSB0YWJsZSBjZWxsIGB0ZGAgZWxlbWVudCBpbiB0aGUgZ3JpZC4gIFdpbGwgYXBwbHkgZm9ybWF0dGluZyBhcyBkZWZpbmVkIGluIHRoZSBjb2x1bW4gb2JqZWN0LlxuICovXG5jbGFzcyBDZWxsIHtcbiAgICAvLyBGb3JtYXR0ZXIgcmVnaXN0cnkgdXNpbmcgc3RyYXRlZ3kgcGF0dGVyblxuICAgIHN0YXRpYyAjZm9ybWF0dGVycyA9IHtcbiAgICAgICAgbGluazogKHJvd0RhdGEsIGNvbHVtbiwgZWxlbWVudCkgPT4ge1xuICAgICAgICAgICAgZWxlbWVudC5hcHBlbmQoRm9ybWF0TGluay5hcHBseShyb3dEYXRhLCBjb2x1bW4uZm9ybWF0dGVyUGFyYW1zKSk7XG4gICAgICAgIH0sXG4gICAgICAgIGRhdGU6IChyb3dEYXRhLCBjb2x1bW4sIGVsZW1lbnQpID0+IHtcbiAgICAgICAgICAgIGVsZW1lbnQuaW5uZXJUZXh0ID0gRm9ybWF0RGF0ZVRpbWUuYXBwbHkocm93RGF0YSwgY29sdW1uLCBjb2x1bW4uc2V0dGluZ3MuZGF0ZUZvcm1hdCwgZmFsc2UpO1xuICAgICAgICB9LFxuICAgICAgICBkYXRldGltZTogKHJvd0RhdGEsIGNvbHVtbiwgZWxlbWVudCkgPT4ge1xuICAgICAgICAgICAgZWxlbWVudC5pbm5lclRleHQgPSBGb3JtYXREYXRlVGltZS5hcHBseShyb3dEYXRhLCBjb2x1bW4sIGNvbHVtbi5zZXR0aW5ncy5kYXRlVGltZUZvcm1hdCwgdHJ1ZSk7XG4gICAgICAgIH0sXG4gICAgICAgIGRlY2ltYWw6IChyb3dEYXRhLCBjb2x1bW4sIGVsZW1lbnQpID0+IHtcbiAgICAgICAgICAgIGVsZW1lbnQuaW5uZXJUZXh0ID0gRm9ybWF0TnVtZXJpYy5hcHBseShyb3dEYXRhLCBjb2x1bW4sIFwiZGVjaW1hbFwiKTtcbiAgICAgICAgfSxcbiAgICAgICAgbW9uZXk6IChyb3dEYXRhLCBjb2x1bW4sIGVsZW1lbnQpID0+IHtcbiAgICAgICAgICAgIGVsZW1lbnQuaW5uZXJUZXh0ID0gRm9ybWF0TnVtZXJpYy5hcHBseShyb3dEYXRhLCBjb2x1bW4sIFwiY3VycmVuY3lcIik7XG4gICAgICAgIH0sXG4gICAgICAgIHBlcmNlbnQ6IChyb3dEYXRhLCBjb2x1bW4sIGVsZW1lbnQpID0+IHtcbiAgICAgICAgICAgIGVsZW1lbnQuaW5uZXJUZXh0ID0gRm9ybWF0TnVtZXJpYy5hcHBseShyb3dEYXRhLCBjb2x1bW4sIFwicGVyY2VudFwiKTtcbiAgICAgICAgfSxcbiAgICAgICAgc3RhcjogKHJvd0RhdGEsIGNvbHVtbiwgZWxlbWVudCkgPT4ge1xuICAgICAgICAgICAgZWxlbWVudC5hcHBlbmQoRm9ybWF0U3Rhci5hcHBseShyb3dEYXRhLCBjb2x1bW4pKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiBhIGNlbGwgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyB0aGUgYHRkYCB0YWJsZSBib2R5IGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHtBcnJheTxvYmplY3Q+fSByb3dEYXRhIFJvdyBkYXRhLlxuICAgICAqIEBwYXJhbSB7Q29sdW1ufSBjb2x1bW4gQ29sdW1uIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gbW9kdWxlcyBHcmlkIG1vZHVsZShzKSBhZGRlZCBieSB1c2VyIGZvciBjdXN0b20gZm9ybWF0dGluZy5cbiAgICAgKiBAcGFyYW0ge0hUTUxUYWJsZVJvd0VsZW1lbnR9IHJvdyBUYWJsZSByb3cgYHRyYCBlbGVtZW50LlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHJvd0RhdGEsIGNvbHVtbiwgbW9kdWxlcywgcm93KSB7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0ZFwiKTtcblxuICAgICAgICBpZiAoY29sdW1uLmZvcm1hdHRlcikge1xuICAgICAgICAgICAgdGhpcy4jYXBwbHlGb3JtYXR0ZXIocm93RGF0YSwgY29sdW1uLCBtb2R1bGVzLCByb3cpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy4jc2V0RGVmYXVsdENvbnRlbnQocm93RGF0YSwgY29sdW1uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb2x1bW4udG9vbHRpcEZpZWxkKSB7XG4gICAgICAgICAgICB0aGlzLiNhcHBseVRvb2x0aXAocm93RGF0YVtjb2x1bW4udG9vbHRpcEZpZWxkXSwgY29sdW1uLnRvb2x0aXBMYXlvdXQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNldHMgZGVmYXVsdCBjZWxsIGNvbnRlbnQgd2hlbiBubyBmb3JtYXR0ZXIgaXMgc3BlY2lmaWVkLlxuICAgICAqIEBwYXJhbSB7QXJyYXk8b2JqZWN0Pn0gcm93RGF0YSBSb3cgZGF0YS5cbiAgICAgKiBAcGFyYW0ge0NvbHVtbn0gY29sdW1uIENvbHVtbiBvYmplY3QuXG4gICAgICovXG4gICAgI3NldERlZmF1bHRDb250ZW50KHJvd0RhdGEsIGNvbHVtbikge1xuICAgICAgICB0aGlzLmVsZW1lbnQuaW5uZXJUZXh0ID0gcm93RGF0YVtjb2x1bW4uZmllbGRdID8/IFwiXCI7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFwcGxpZXMgdG9vbHRpcCBmdW5jdGlvbmFsaXR5IHRvIHRoZSBjZWxsLiBJZiB0aGUgY2VsbCdzIGNvbnRlbnQgY29udGFpbnMgdGV4dCBvbmx5LCBpdCB3aWxsIGNyZWF0ZSBhIHRvb2x0aXAgXG4gICAgICogYHNwYW5gIGVsZW1lbnQgYW5kIGFwcGx5IHRoZSBjb250ZW50IHRvIGl0LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nIHwgbnVtYmVyIHwgRGF0ZSB8IG51bGx9IGNvbnRlbnQgVG9vbHRpcCBjb250ZW50IHRvIGJlIGRpc3BsYXllZC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbGF5b3V0IENTUyBjbGFzcyBmb3IgdG9vbHRpcCBsYXlvdXQsIGVpdGhlciBcInRhYmxlZGF0YS10b29sdGlwLXJpZ2h0XCIgb3IgXCJ0YWJsZWRhdGEtdG9vbHRpcC1sZWZ0XCIuXG4gICAgICovXG4gICAgI2FwcGx5VG9vbHRpcChjb250ZW50LCBsYXlvdXQpIHtcbiAgICAgICAgaWYgKGNvbnRlbnQgPT09IG51bGwgfHwgY29udGVudCA9PT0gXCJcIikgcmV0dXJuO1xuICAgICAgICBcbiAgICAgICAgbGV0IHRvb2x0aXBFbGVtZW50ID0gdGhpcy5lbGVtZW50LmZpcnN0RWxlbWVudENoaWxkO1xuXG4gICAgICAgIGlmICh0b29sdGlwRWxlbWVudCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdG9vbHRpcEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgICAgIHRvb2x0aXBFbGVtZW50LmlubmVyVGV4dCA9IHRoaXMuZWxlbWVudC5pbm5lclRleHQ7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQucmVwbGFjZUNoaWxkcmVuKHRvb2x0aXBFbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRvb2x0aXBFbGVtZW50LmRhdGFzZXQudG9vbHRpcCA9IGNvbnRlbnQ7XG4gICAgICAgIHRvb2x0aXBFbGVtZW50LmNsYXNzTGlzdC5hZGQoQ3NzSGVscGVyLnRvb2x0aXAucGFyZW50Q2xhc3MsIGxheW91dCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFwcGxpZXMgdGhlIGFwcHJvcHJpYXRlIGZvcm1hdHRlciB0byB0aGUgY2VsbCBjb250ZW50LlxuICAgICAqIEBwYXJhbSB7QXJyYXk8b2JqZWN0Pn0gcm93RGF0YSBSb3cgZGF0YS5cbiAgICAgKiBAcGFyYW0ge0NvbHVtbn0gY29sdW1uIENvbHVtbiBvYmplY3QuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG1vZHVsZXMgR3JpZCBtb2R1bGUocykgYWRkZWQgYnkgdXNlciBmb3IgY3VzdG9tIGZvcm1hdHRpbmcuXG4gICAgICogQHBhcmFtIHtIVE1MVGFibGVSb3dFbGVtZW50fSByb3cgVGFibGUgcm93IGB0cmAgZWxlbWVudC5cbiAgICAgKi9cbiAgICAjYXBwbHlGb3JtYXR0ZXIocm93RGF0YSwgY29sdW1uLCBtb2R1bGVzLCByb3cpIHtcbiAgICAgICAgLy8gSGFuZGxlIGN1c3RvbSBmdW5jdGlvbiBmb3JtYXR0ZXIgZnJvbSBjb2x1bW4gZGVmaW5pdGlvbi5cbiAgICAgICAgaWYgKHR5cGVvZiBjb2x1bW4uZm9ybWF0dGVyID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmQoY29sdW1uLmZvcm1hdHRlcihyb3dEYXRhLCBjb2x1bW4uZm9ybWF0dGVyUGFyYW1zLCB0aGlzLmVsZW1lbnQsIHJvdykpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gSGFuZGxlIG1vZHVsZSBmb3JtYXR0ZXJcbiAgICAgICAgaWYgKGNvbHVtbi5mb3JtYXR0ZXIgPT09IFwibW9kdWxlXCIpIHtcbiAgICAgICAgICAgIGNvbnN0IG1vZHVsZU5hbWUgPSBjb2x1bW4uZm9ybWF0dGVyTW9kdWxlTmFtZTtcblxuICAgICAgICAgICAgaWYgKCFtb2R1bGVzPy5bbW9kdWxlTmFtZV0pIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYEZvcm1hdHRlciBtb2R1bGUgXCIke21vZHVsZU5hbWV9XCIgbm90IGZvdW5kYCk7XG4gICAgICAgICAgICAgICAgdGhpcy4jc2V0RGVmYXVsdENvbnRlbnQocm93RGF0YSwgY29sdW1uKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmQobW9kdWxlc1ttb2R1bGVOYW1lXS5hcHBseShyb3dEYXRhLCBjb2x1bW4sIHJvdywgdGhpcy5lbGVtZW50KSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBIYW5kbGUgYnVpbHQtaW4gZm9ybWF0dGVyXG4gICAgICAgIGNvbnN0IGZvcm1hdHRlciA9IENlbGwuI2Zvcm1hdHRlcnNbY29sdW1uLmZvcm1hdHRlcl07XG5cbiAgICAgICAgaWYgKGZvcm1hdHRlcikge1xuICAgICAgICAgICAgLy8gU2V0IHRoZSBjZWxsIGNvbnRlbnQsIGVpdGhlciBhcyB0ZXh0IG9yIERPTSBlbGVtZW50LlxuICAgICAgICAgICAgZm9ybWF0dGVyKHJvd0RhdGEsIGNvbHVtbiwgdGhpcy5lbGVtZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuI3NldERlZmF1bHRDb250ZW50KHJvd0RhdGEsIGNvbHVtbik7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCB7IENlbGwgfTsiLCJpbXBvcnQgeyBDZWxsIH0gZnJvbSBcIi4uL2NlbGwvY2VsbC5qc1wiO1xuLyoqXG4gKiBDbGFzcyB0byBtYW5hZ2UgdGhlIHRhYmxlIGVsZW1lbnQgYW5kIGl0cyByb3dzIGFuZCBjZWxscy5cbiAqL1xuY2xhc3MgVGFibGUge1xuICAgICNyb3dDb3VudDtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYFRhYmxlYCBjbGFzcyB0byBtYW5hZ2UgdGhlIHRhYmxlIGVsZW1lbnQgYW5kIGl0cyByb3dzIGFuZCBjZWxscy5cbiAgICAgKiBAcGFyYW0ge0dyaWRDb250ZXh0fSBjb250ZXh0IEdyaWQgY29udGV4dC5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMudGFibGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGFibGVcIik7XG4gICAgICAgIHRoaXMudGhlYWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGhlYWRcIik7XG4gICAgICAgIHRoaXMudGJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGJvZHlcIik7XG4gICAgICAgIHRoaXMuI3Jvd0NvdW50ID0gMDtcblxuICAgICAgICB0aGlzLnRhYmxlLmlkID0gYCR7Y29udGV4dC5zZXR0aW5ncy5iYXNlSWROYW1lfV90YWJsZWA7XG4gICAgICAgIHRoaXMudGFibGUuYXBwZW5kKHRoaXMudGhlYWQsIHRoaXMudGJvZHkpO1xuICAgICAgICB0aGlzLnRhYmxlLmNsYXNzTmFtZSA9IGNvbnRleHQuc2V0dGluZ3MudGFibGVDc3M7XG5cbiAgICAgICAgaWYgKGNvbnRleHQuc2V0dGluZ3MudGFibGVTdHlsZVNldHRpbmdzICYmIHR5cGVvZiBjb250ZXh0LnNldHRpbmdzLnRhYmxlU3R5bGVTZXR0aW5ncyA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgLy8gQXBwbHkgY3VzdG9tIHN0eWxlIHNldHRpbmdzIHRvIHRhYmxlIGVsZW1lbnQuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhjb250ZXh0LnNldHRpbmdzLnRhYmxlU3R5bGVTZXR0aW5ncykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRhYmxlLnN0eWxlW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyB0aGUgdGFibGUgaGVhZGVyIHJvdyBlbGVtZW50IGJ5IGNyZWF0aW5nIGEgcm93IGFuZCBhcHBlbmRpbmcgZWFjaCBjb2x1bW4ncyBoZWFkZXIgY2VsbC5cbiAgICAgKi9cbiAgICBpbml0aWFsaXplSGVhZGVyKCkge1xuICAgICAgICBjb25zdCB0ciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0clwiKTtcblxuICAgICAgICBmb3IgKGNvbnN0IGNvbHVtbiBvZiB0aGlzLmNvbnRleHQuY29sdW1uTWFuYWdlci5jb2x1bW5zKSB7XG4gICAgICAgICAgICB0ci5hcHBlbmRDaGlsZChjb2x1bW4uaGVhZGVyQ2VsbC5lbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudGhlYWQuYXBwZW5kQ2hpbGQodHIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZW5kZXIgdGFibGUgYm9keSByb3dzLiAgV2lsbCByZW1vdmUgYW55IHByaW9yIHRhYmxlIGJvZHkgcmVzdWx0cyBhbmQgYnVpbGQgbmV3IHJvd3MgYW5kIGNlbGxzLlxuICAgICAqIEBwYXJhbSB7QXJyYXk8T2JqZWN0Pn0gZGF0YXNldCBEYXRhIHNldCB0byBidWlsZCB0YWJsZSByb3dzLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyIHwgbnVsbH0gW3Jvd0NvdW50PW51bGxdIFNldCB0aGUgcm93IGNvdW50IHBhcmFtZXRlciB0byBhIHNwZWNpZmljIHZhbHVlIGlmIFxuICAgICAqIHJlbW90ZSBwcm9jZXNzaW5nIGlzIGJlaW5nIHVzZWQsIG90aGVyd2lzZSB3aWxsIHVzZSB0aGUgbGVuZ3RoIG9mIHRoZSBkYXRhc2V0LlxuICAgICAqL1xuICAgIHJlbmRlclJvd3MoZGF0YXNldCwgcm93Q291bnQgPSBudWxsKSB7XG4gICAgICAgIC8vQ2xlYXIgYm9keSBvZiBwcmV2aW91cyBkYXRhLlxuICAgICAgICB0aGlzLnRib2R5LnJlcGxhY2VDaGlsZHJlbigpO1xuICAgICAgICBcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGRhdGFzZXQpKSB7XG4gICAgICAgICAgICB0aGlzLiNyb3dDb3VudCA9IDA7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiNyb3dDb3VudCA9IHJvd0NvdW50ID8/IGRhdGFzZXQubGVuZ3RoO1xuXG4gICAgICAgIGZvciAoY29uc3QgZGF0YSBvZiBkYXRhc2V0KSB7XG4gICAgICAgICAgICBjb25zdCB0ciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0clwiKTtcblxuICAgICAgICAgICAgZm9yIChsZXQgY29sdW1uIG9mIHRoaXMuY29udGV4dC5jb2x1bW5NYW5hZ2VyLmNvbHVtbnMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjZWxsID0gbmV3IENlbGwoZGF0YSwgY29sdW1uLCB0aGlzLmNvbnRleHQubW9kdWxlcywgdHIpO1xuXG4gICAgICAgICAgICAgICAgdHIuYXBwZW5kQ2hpbGQoY2VsbC5lbGVtZW50KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy50Ym9keS5hcHBlbmRDaGlsZCh0cik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXQgcm93Q291bnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLiNyb3dDb3VudDtcbiAgICB9XG59XG5cbmV4cG9ydCB7IFRhYmxlIH07IiwiaW1wb3J0IHsgQ29sdW1uTWFuYWdlciB9IGZyb20gXCIuLi9jb2x1bW4vY29sdW1uTWFuYWdlci5qc1wiO1xuaW1wb3J0IHsgRGF0YVBpcGVsaW5lIH0gZnJvbSBcIi4uL2RhdGEvZGF0YVBpcGVsaW5lLmpzXCI7XG5pbXBvcnQgeyBEYXRhTG9hZGVyIH0gZnJvbSBcIi4uL2RhdGEvZGF0YUxvYWRlci5qc1wiO1xuaW1wb3J0IHsgRGF0YVBlcnNpc3RlbmNlIH0gZnJvbSBcIi4uL2RhdGEvZGF0YVBlcnNpc3RlbmNlLmpzXCI7XG5pbXBvcnQgeyBHcmlkRXZlbnRzIH0gZnJvbSBcIi4uL2V2ZW50cy9ncmlkRXZlbnRzLmpzXCI7XG5pbXBvcnQgeyBUYWJsZSB9IGZyb20gXCIuLi90YWJsZS90YWJsZS5qc1wiO1xuLyoqXG4gKiBQcm92aWRlcyB0aGUgY29udGV4dCBmb3IgdGhlIGdyaWQsIGluY2x1ZGluZyBzZXR0aW5ncywgZGF0YSwgYW5kIG1vZHVsZXMuICBUaGlzIGNsYXNzIGlzIHJlc3BvbnNpYmxlIGZvciBtYW5hZ2luZyBcbiAqIHRoZSBncmlkJ3MgY29yZSBzdGF0ZSBhbmQgYmVoYXZpb3IuXG4gKi9cbmNsYXNzIEdyaWRDb250ZXh0IHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgZ3JpZCBjb250ZXh0LCB3aGljaCByZXByZXNlbnRzIHRoZSBjb3JlIGxvZ2ljIGFuZCBmdW5jdGlvbmFsaXR5IG9mIHRoZSBkYXRhIGdyaWQuXG4gICAgICogQHBhcmFtIHtBcnJheTxvYmplY3Q+fSBjb2x1bW5zIENvbHVtbiBkZWZpbml0aW9uLlxuICAgICAqIEBwYXJhbSB7U2V0dGluZ3NHcmlkfSBzZXR0aW5ncyBHcmlkIHNldHRpbmdzLlxuICAgICAqIEBwYXJhbSB7YW55W119IFtkYXRhPVtdXSBHcmlkIGRhdGEuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29sdW1ucywgc2V0dGluZ3MsIGRhdGEgPSBbXSkge1xuICAgICAgICB0aGlzLnNldHRpbmdzID0gc2V0dGluZ3M7XG4gICAgICAgIHRoaXMuZXZlbnRzID0gbmV3IEdyaWRFdmVudHMoKTtcbiAgICAgICAgdGhpcy5waXBlbGluZSA9IG5ldyBEYXRhUGlwZWxpbmUodGhpcy5zZXR0aW5ncyk7XG4gICAgICAgIHRoaXMuZGF0YWxvYWRlciA9IG5ldyBEYXRhTG9hZGVyKHRoaXMuc2V0dGluZ3MpO1xuICAgICAgICB0aGlzLnBlcnNpc3RlbmNlID0gbmV3IERhdGFQZXJzaXN0ZW5jZShkYXRhKTtcbiAgICAgICAgdGhpcy5jb2x1bW5NYW5hZ2VyID0gbmV3IENvbHVtbk1hbmFnZXIoY29sdW1ucywgdGhpcy5zZXR0aW5ncyk7XG4gICAgICAgIHRoaXMuZ3JpZCA9IG5ldyBUYWJsZSh0aGlzKTtcbiAgICAgICAgdGhpcy5tb2R1bGVzID0ge307XG4gICAgfVxufVxuXG5leHBvcnQgeyBHcmlkQ29udGV4dCB9OyIsImV4cG9ydCBkZWZhdWx0IHtcbiAgICBiYXNlSWROYW1lOiBcInRhYmxlZGF0YVwiLCAgLy9iYXNlIG5hbWUgZm9yIGFsbCBlbGVtZW50IElEJ3MuXG4gICAgZGF0YTogW10sICAvL3JvdyBkYXRhLlxuICAgIGNvbHVtbnM6IFtdLCAgLy9jb2x1bW4gZGVmaW5pdGlvbnMuXG4gICAgZW5hYmxlUGFnaW5nOiB0cnVlLCAgLy9lbmFibGUgcGFnaW5nIG9mIGRhdGEuXG4gICAgcGFnZXJQYWdlc1RvRGlzcGxheTogNSwgIC8vbWF4IG51bWJlciBvZiBwYWdlciBidXR0b25zIHRvIGRpc3BsYXkuXG4gICAgcGFnZXJSb3dzUGVyUGFnZTogMjUsICAvL3Jvd3MgcGVyIHBhZ2UuXG4gICAgcGFnZXJDc3M6IFwidGFibGVkYXRhLXBhZ2VyXCIsIC8vY3NzIGNsYXNzIGZvciBwYWdlciBjb250YWluZXIuXG4gICAgZGF0ZUZvcm1hdDogXCJNTS9kZC95eXl5XCIsICAvL3JvdyBsZXZlbCBkYXRlIGZvcm1hdC5cbiAgICBkYXRlVGltZUZvcm1hdDogXCJNTS9kZC95eXl5IEhIOm1tOnNzXCIsIC8vcm93IGxldmVsIGRhdGUgZm9ybWF0LlxuICAgIHJlbW90ZVVybDogXCJcIiwgIC8vZ2V0IGRhdGEgZnJvbSB1cmwgZW5kcG9pbnQgdmlhIEFqYXguXG4gICAgcmVtb3RlUGFyYW1zOiBcIlwiLCAgLy9wYXJhbWV0ZXJzIHRvIGJlIHBhc3NlZCBvbiBBamF4IHJlcXVlc3QuXG4gICAgcmVtb3RlUHJvY2Vzc2luZzogZmFsc2UsICAvL3RydXRoeSBzZXRzIGdyaWQgdG8gcHJvY2VzcyBmaWx0ZXIvc29ydCBvbiByZW1vdGUgc2VydmVyLlxuICAgIHRhYmxlQ3NzOiBcInRhYmxlZGF0YVwiLCBcbiAgICB0YWJsZVN0eWxlU2V0dGluZ3M6IFwiXCIsIC8vY3VzdG9tIHN0eWxlIHNldHRpbmdzIGZvciB0YWJsZSBlbGVtZW50LiAgb2JqZWN0IHdpdGgga2V5L3ZhbHVlIHBhaXJzLlxuICAgIHRhYmxlSGVhZGVyVGhDc3M6IFwiXCIsXG4gICAgdGFibGVGaWx0ZXJDc3M6IFwidGFibGVkYXRhLWlucHV0XCIsICAvL2NzcyBjbGFzcyBmb3IgaGVhZGVyIGZpbHRlciBpbnB1dCBlbGVtZW50cy5cbiAgICB0YWJsZUV2ZW5Db2x1bW5XaWR0aHM6IGZhbHNlLCAgLy9zaG91bGQgYWxsIGNvbHVtbnMgYmUgZXF1YWwgd2lkdGg/XG4gICAgdGFibGVDc3NTb3J0QXNjOiBcInRhYmxlZGF0YS1zb3J0LWljb24gdGFibGVkYXRhLXNvcnQtYXNjXCIsXG4gICAgdGFibGVDc3NTb3J0RGVzYzogXCJ0YWJsZWRhdGEtc29ydC1pY29uIHRhYmxlZGF0YS1zb3J0LWRlc2NcIixcbiAgICByZWZyZXNoYWJsZUlkOiBcIlwiLCAgLy9yZWZyZXNoIHJlbW90ZSBkYXRhIHNvdXJjZXMgZm9yIGdyaWQgYW5kL29yIGZpbHRlciB2YWx1ZXMuXG4gICAgcm93Q291bnRJZDogXCJcIixcbiAgICBjc3ZFeHBvcnRJZDogXCJcIixcbiAgICBjc3ZFeHBvcnRSZW1vdGVTb3VyY2U6IFwiXCIgLy9nZXQgZXhwb3J0IGRhdGEgZnJvbSB1cmwgZW5kcG9pbnQgdmlhIEFqYXg7IHVzZWZ1bCB0byBnZXQgbm9uLXBhZ2VkIGRhdGEuXG59OyIsImltcG9ydCBzZXR0aW5nc0RlZmF1bHRzIGZyb20gXCIuL3NldHRpbmdzRGVmYXVsdC5qc1wiO1xuXG5jbGFzcyBNZXJnZU9wdGlvbnMge1xuICAgIC8qKlxuICAgICAqIFJldHVybnMgYW4gb2JqZWN0IGJhc2VkIG9uIHRoZSBtZXJnZWQgcmVzdWx0cyBvZiB0aGUgZGVmYXVsdCBhbmQgdXNlciBwcm92aWRlZCBzZXR0aW5ncy5cbiAgICAgKiBVc2VyIHByb3ZpZGVkIHNldHRpbmdzIHdpbGwgb3ZlcnJpZGUgZGVmYXVsdHMuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHNvdXJjZSB1c2VyIHN1cHBsaWVkIHNldHRpbmdzLlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IHNldHRpbmdzIG1lcmdlZCBmcm9tIGRlZmF1bHQgYW5kIHVzZXIgdmFsdWVzLlxuICAgICAqL1xuICAgIHN0YXRpYyBtZXJnZShzb3VyY2UpIHtcbiAgICAgICAgLy9jb3B5IGRlZmF1bHQga2V5L3ZhbHVlIGl0ZW1zLlxuICAgICAgICBsZXQgcmVzdWx0ID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShzZXR0aW5nc0RlZmF1bHRzKSk7XG5cbiAgICAgICAgaWYgKHNvdXJjZSA9PT0gdW5kZWZpbmVkIHx8IE9iamVjdC5rZXlzKHNvdXJjZSkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBmb3IgKGxldCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoc291cmNlKSkge1xuICAgICAgICAgICAgbGV0IHRhcmdldFR5cGUgPSByZXN1bHRba2V5XSAhPT0gdW5kZWZpbmVkID8gcmVzdWx0W2tleV0udG9TdHJpbmcoKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGxldCBzb3VyY2VUeXBlID0gdmFsdWUudG9TdHJpbmcoKTtcblxuICAgICAgICAgICAgaWYgKHRhcmdldFR5cGUgIT09IHVuZGVmaW5lZCAmJiB0YXJnZXRUeXBlICE9PSBzb3VyY2VUeXBlKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0W2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxufVxuXG5leHBvcnQgeyBNZXJnZU9wdGlvbnMgfTsiLCIvKipcbiAqIEltcGxlbWVudHMgdGhlIHByb3BlcnR5IHNldHRpbmdzIGZvciB0aGUgZ3JpZC5cbiAqL1xuY2xhc3MgU2V0dGluZ3NHcmlkIHtcbiAgICAvKipcbiAgICAgKiBUcmFuc2xhdGVzIHNldHRpbmdzIGZyb20gbWVyZ2VkIHVzZXIvZGVmYXVsdCBvcHRpb25zIGludG8gYSBkZWZpbml0aW9uIG9mIGdyaWQgc2V0dGluZ3MuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgTWVyZ2VkIHVzZXIvZGVmYXVsdCBvcHRpb25zLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5iYXNlSWROYW1lID0gb3B0aW9ucy5iYXNlSWROYW1lO1xuICAgICAgICB0aGlzLmVuYWJsZVBhZ2luZyA9IG9wdGlvbnMuZW5hYmxlUGFnaW5nO1xuICAgICAgICB0aGlzLnBhZ2VyUGFnZXNUb0Rpc3BsYXkgPSBvcHRpb25zLnBhZ2VyUGFnZXNUb0Rpc3BsYXk7XG4gICAgICAgIHRoaXMucGFnZXJSb3dzUGVyUGFnZSA9IG9wdGlvbnMucGFnZXJSb3dzUGVyUGFnZTtcbiAgICAgICAgdGhpcy5kYXRlRm9ybWF0ID0gb3B0aW9ucy5kYXRlRm9ybWF0O1xuICAgICAgICB0aGlzLmRhdGVUaW1lRm9ybWF0ID0gb3B0aW9ucy5kYXRlVGltZUZvcm1hdDtcbiAgICAgICAgdGhpcy5yZW1vdGVVcmwgPSBvcHRpb25zLnJlbW90ZVVybDsgIFxuICAgICAgICB0aGlzLnJlbW90ZVBhcmFtcyA9IG9wdGlvbnMucmVtb3RlUGFyYW1zO1xuICAgICAgICB0aGlzLnJlbW90ZVByb2Nlc3NpbmcgPSBmYWxzZTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuYWpheFVybCA9ICh0aGlzLnJlbW90ZVVybCAmJiB0aGlzLnJlbW90ZVBhcmFtcykgPyB0aGlzLl9idWlsZEFqYXhVcmwodGhpcy5yZW1vdGVVcmwsIHRoaXMucmVtb3RlUGFyYW1zKSA6IHRoaXMucmVtb3RlVXJsO1xuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5yZW1vdGVQcm9jZXNzaW5nID09PSBcImJvb2xlYW5cIiAmJiBvcHRpb25zLnJlbW90ZVByb2Nlc3NpbmcpIHtcbiAgICAgICAgICAgIC8vIFJlbW90ZSBwcm9jZXNzaW5nIHNldCB0byBgb25gOyB1c2UgZmlyc3QgY29sdW1uIHdpdGggZmllbGQgYXMgZGVmYXVsdCBzb3J0LlxuICAgICAgICAgICAgY29uc3QgZmlyc3QgPSBvcHRpb25zLmNvbHVtbnMuZmluZCgoaXRlbSkgPT4gaXRlbS5maWVsZCAhPT0gdW5kZWZpbmVkKTtcblxuICAgICAgICAgICAgdGhpcy5yZW1vdGVQcm9jZXNzaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMucmVtb3RlU29ydERlZmF1bHRDb2x1bW4gPSBmaXJzdC5maWVsZDtcbiAgICAgICAgICAgIHRoaXMucmVtb3RlU29ydERlZmF1bHREaXJlY3Rpb24gPSBcImRlc2NcIjtcbiAgICAgICAgfSBlbHNlIGlmIChPYmplY3Qua2V5cyhvcHRpb25zLnJlbW90ZVByb2Nlc3NpbmcpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIC8vIFJlbW90ZSBwcm9jZXNzaW5nIHNldCB0byBgb25gIHVzaW5nIGtleS92YWx1ZSBwYXJhbWV0ZXIgaW5wdXRzIGZvciBkZWZhdWx0IHNvcnQgY29sdW1uLlxuICAgICAgICAgICAgdGhpcy5yZW1vdGVQcm9jZXNzaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMucmVtb3RlU29ydERlZmF1bHRDb2x1bW4gPSBvcHRpb25zLnJlbW90ZVByb2Nlc3NpbmcuY29sdW1uO1xuICAgICAgICAgICAgdGhpcy5yZW1vdGVTb3J0RGVmYXVsdERpcmVjdGlvbiA9IG9wdGlvbnMucmVtb3RlUHJvY2Vzc2luZy5kaXJlY3Rpb24gPz8gXCJkZXNjXCI7XG4gICAgICAgIH0gXG5cbiAgICAgICAgdGhpcy50YWJsZUNzcyA9IG9wdGlvbnMudGFibGVDc3M7XG4gICAgICAgIHRoaXMudGFibGVIZWFkZXJUaENzcyA9IG9wdGlvbnMudGFibGVIZWFkZXJUaENzcztcbiAgICAgICAgdGhpcy50YWJsZVN0eWxlU2V0dGluZ3MgPSBvcHRpb25zLnRhYmxlU3R5bGVTZXR0aW5nczsgXG4gICAgICAgIHRoaXMucGFnZXJDc3MgPSBvcHRpb25zLnBhZ2VyQ3NzO1xuICAgICAgICB0aGlzLnRhYmxlRmlsdGVyQ3NzID0gb3B0aW9ucy50YWJsZUZpbHRlckNzcztcbiAgICAgICAgdGhpcy50YWJsZUV2ZW5Db2x1bW5XaWR0aHMgPSBvcHRpb25zLnRhYmxlRXZlbkNvbHVtbldpZHRocztcbiAgICAgICAgdGhpcy50YWJsZUNzc1NvcnRBc2MgPSBvcHRpb25zLnRhYmxlQ3NzU29ydEFzYztcbiAgICAgICAgdGhpcy50YWJsZUNzc1NvcnREZXNjID0gb3B0aW9ucy50YWJsZUNzc1NvcnREZXNjO1xuICAgICAgICB0aGlzLnJlZnJlc2hhYmxlSWQgPSBvcHRpb25zLnJlZnJlc2hhYmxlSWQ7XG4gICAgICAgIHRoaXMucm93Q291bnRJZCA9IG9wdGlvbnMucm93Q291bnRJZDtcbiAgICAgICAgdGhpcy5jc3ZFeHBvcnRJZCA9IG9wdGlvbnMuY3N2RXhwb3J0SWQ7XG4gICAgICAgIHRoaXMuY3N2RXhwb3J0UmVtb3RlU291cmNlID0gb3B0aW9ucy5jc3ZFeHBvcnRSZW1vdGVTb3VyY2U7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENvbXBpbGVzIHRoZSBrZXkvdmFsdWUgcXVlcnkgcGFyYW1ldGVycyBpbnRvIGEgZnVsbHkgcXVhbGlmaWVkIHVybCB3aXRoIHF1ZXJ5IHN0cmluZy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIGJhc2UgdXJsLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXMgcXVlcnkgc3RyaW5nIHBhcmFtZXRlcnMuXG4gICAgICogQHJldHVybnMge3N0cmluZ30gdXJsIHdpdGggcXVlcnkgcGFyYW1ldGVycy5cbiAgICAgKi9cbiAgICBfYnVpbGRBamF4VXJsKHVybCwgcGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IHAgPSBPYmplY3Qua2V5cyhwYXJhbXMpO1xuXG4gICAgICAgIGlmIChwLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IHF1ZXJ5ID0gcC5tYXAoayA9PiBgJHtlbmNvZGVVUklDb21wb25lbnQoayl9PSR7ZW5jb2RlVVJJQ29tcG9uZW50KHBhcmFtc1trXSl9YClcbiAgICAgICAgICAgICAgICAuam9pbihcIiZcIik7XG5cbiAgICAgICAgICAgIHJldHVybiBgJHt1cmx9PyR7cXVlcnl9YDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICB9XG59XG5cbmV4cG9ydCB7IFNldHRpbmdzR3JpZCB9OyIsIi8qKlxuICogUmVzcG9uc2libGUgZm9yIHJlbmRlcmluZyB0aGUgZ3JpZHMgcm93cyB1c2luZyBlaXRoZXIgbG9jYWwgb3IgcmVtb3RlIGRhdGEuICBUaGlzIHNob3VsZCBiZSB0aGUgZGVmYXVsdCBtb2R1bGUgdG8gXG4gKiBjcmVhdGUgcm93IGRhdGEgaWYgcGFnaW5nIGlzIG5vdCBlbmFibGVkLiAgU3Vic2NyaWJlcyB0byB0aGUgYHJlbmRlcmAgZXZlbnQgdG8gY3JlYXRlIHRoZSBncmlkJ3Mgcm93cyBhbmQgdGhlIGByZW1vdGVQYXJhbXNgIFxuICogZXZlbnQgZm9yIHJlbW90ZSBwcm9jZXNzaW5nLlxuICogXG4gKiBDbGFzcyB3aWxsIGNhbGwgdGhlICdyZW1vdGVQYXJhbXMnIGV2ZW50IHRvIGNvbmNhdGVuYXRlIHBhcmFtZXRlcnMgZm9yIHJlbW90ZSBkYXRhIHJlcXVlc3RzLlxuICovXG5jbGFzcyBSb3dNb2R1bGUge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgZ3JpZCByb3dzLiAgVGhpcyBzaG91bGQgYmUgdGhlIGRlZmF1bHQgbW9kdWxlIHRvIGNyZWF0ZSByb3cgZGF0YSBpZiBwYWdpbmcgaXMgbm90IGVuYWJsZWQuXG4gICAgICogQHBhcmFtIHtHcmlkQ29udGV4dH0gY29udGV4dCBHcmlkIGNvbnRleHQgY2xhc3MuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29udGV4dCkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgIH1cblxuICAgIGluaXRpYWxpemUoKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVtb3RlUHJvY2Vzc2luZykge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LmV2ZW50cy5zdWJzY3JpYmUoXCJyZW5kZXJcIiwgdGhpcy5yZW5kZXJSZW1vdGUsIHRydWUsIDEwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5ldmVudHMuc3Vic2NyaWJlKFwicmVuZGVyXCIsIHRoaXMucmVuZGVyTG9jYWwsIGZhbHNlLCAxMCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVuZGVycyB0aGUgZ3JpZCByb3dzIHVzaW5nIGxvY2FsIGRhdGEuICBUaGlzIGlzIHRoZSBkZWZhdWx0IG1ldGhvZCB0byByZW5kZXIgcm93cyB3aGVuIHJlbW90ZSBwcm9jZXNzaW5nIGlzIG5vdCBlbmFibGVkLlxuICAgICAqL1xuICAgIHJlbmRlckxvY2FsID0gKCkgPT4ge1xuICAgICAgICB0aGlzLmNvbnRleHQuZ3JpZC5yZW5kZXJSb3dzKHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5kYXRhKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJlbmRlcnMgdGhlIGdyaWQgcm93cyB1c2luZyByZW1vdGUgZGF0YS4gIFRoaXMgbWV0aG9kIHdpbGwgY2FsbCB0aGUgYHJlbW90ZVBhcmFtc2AgZXZlbnQgdG8gZ2V0IHRoZSBwYXJhbWV0ZXJzIGZvciB0aGUgcmVtb3RlIHJlcXVlc3QuXG4gICAgICovXG4gICAgcmVuZGVyUmVtb3RlID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBwYXJhbXMgPSB0aGlzLmNvbnRleHQuZXZlbnRzLmNoYWluKFwicmVtb3RlUGFyYW1zXCIsIHt9KTtcbiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuY29udGV4dC5kYXRhbG9hZGVyLnJlcXVlc3RHcmlkRGF0YShwYXJhbXMpO1xuXG4gICAgICAgIHRoaXMuY29udGV4dC5ncmlkLnJlbmRlclJvd3MoZGF0YSk7XG4gICAgfTtcbn1cblxuUm93TW9kdWxlLm1vZHVsZU5hbWUgPSBcInJvd1wiO1xuXG5leHBvcnQgeyBSb3dNb2R1bGUgfTsiLCJjbGFzcyBQYWdlckJ1dHRvbnMge1xuICAgIC8qKlxuICAgICAqIFJldHVybnMgc3RhcnQgYnV0dG9uIGZvciBwYWdlciBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBjdXJyZW50UGFnZSBDdXJyZW50IHBhZ2UuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgQnV0dG9uIGNsaWNrIGhhbmRsZXIuXG4gICAgICogQHJldHVybnMge0hUTUxMaW5rRWxlbWVudH1cbiAgICAgKi9cbiAgICBzdGF0aWMgc3RhcnQoY3VycmVudFBhZ2UsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xuICAgICAgICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuXG4gICAgICAgIGxpLmFwcGVuZChidG4pO1xuICAgICAgICBidG4uaW5uZXJIVE1MID0gXCImbHNhcXVvO1wiO1xuICAgICAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNhbGxiYWNrKTtcblxuICAgICAgICBpZiAoY3VycmVudFBhZ2UgPiAxKSB7XG4gICAgICAgICAgICBidG4uZGF0YXNldC5wYWdlID0gXCIxXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBidG4udGFiSW5kZXggPSAtMTtcbiAgICAgICAgICAgIGJ0bi5kaXNhYmxlZCA9IHRydWU7XG4gICAgICAgICAgICBsaS5jbGFzc05hbWUgPSBcImRpc2FibGVkXCI7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbGk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgZW5kIGJ1dHRvbiBmb3IgcGFnZXIgZWxlbWVudC5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gdG90YWxQYWdlcyBsYXN0IHBhZ2UgbnVtYmVyIGluIGdyb3VwIHNldC5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gY3VycmVudFBhZ2UgY3VycmVudCBwYWdlLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIGJ1dHRvbiBjbGljayBoYW5kbGVyLlxuICAgICAqIEByZXR1cm5zIHtIVE1MTElFbGVtZW50fVxuICAgICAqL1xuICAgIHN0YXRpYyBlbmQodG90YWxQYWdlcywgY3VycmVudFBhZ2UsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xuICAgICAgICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuXG4gICAgICAgIGxpLmFwcGVuZChidG4pO1xuICAgICAgICBidG4uaW5uZXJIVE1MID0gXCImcnNhcXVvO1wiO1xuICAgICAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNhbGxiYWNrKTtcblxuICAgICAgICBpZiAoY3VycmVudFBhZ2UgPCB0b3RhbFBhZ2VzKSB7XG4gICAgICAgICAgICBidG4uZGF0YXNldC5wYWdlID0gdG90YWxQYWdlcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJ0bi50YWJJbmRleCA9IC0xO1xuICAgICAgICAgICAgYnRuLmRpc2FibGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGxpLmNsYXNzTmFtZSA9IFwiZGlzYWJsZWRcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBsaTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBwYWdlciBidXR0b24gZm9yIGFzc29jaWF0ZWQgcGFnZS5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gcGFnZSBwYWdlIG51bWJlci5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gY3VycmVudFBhZ2UgY3VycmVudCBwYWdlLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIGJ1dHRvbiBjbGljayBoYW5kbGVyLlxuICAgICAqIEByZXR1cm5zIHtIVE1MTElFbGVtZW50fVxuICAgICAqL1xuICAgIHN0YXRpYyBwYWdlTnVtYmVyKHBhZ2UsIGN1cnJlbnRQYWdlLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcbiAgICAgICAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcblxuICAgICAgICBsaS5hcHBlbmQoYnRuKTtcbiAgICAgICAgYnRuLmlubmVyVGV4dCA9IHBhZ2U7XG4gICAgICAgIGJ0bi5kYXRhc2V0LnBhZ2UgPSBwYWdlO1xuICAgICAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNhbGxiYWNrKTtcblxuICAgICAgICBpZiAocGFnZSA9PT0gY3VycmVudFBhZ2UpIHtcbiAgICAgICAgICAgIGxpLmNsYXNzTmFtZSA9IFwiYWN0aXZlXCI7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbGk7XG4gICAgfVxufVxuXG5leHBvcnQgeyBQYWdlckJ1dHRvbnMgfTsiLCJpbXBvcnQgeyBQYWdlckJ1dHRvbnMgfSBmcm9tIFwiLi9wYWdlckJ1dHRvbnMuanNcIjtcbi8qKlxuICogRm9ybWF0cyBncmlkJ3Mgcm93cyBhcyBhIHNlcmllcyBvZiBwYWdlcyByYXRoZXIgdGhhdCBhIHNjcm9sbGluZyBsaXN0LiAgSWYgcGFnaW5nIGlzIG5vdCBkZXNpcmVkLCByZWdpc3RlciB0aGUgYFJvd01vZHVsZWAgaW5zdGVhZC5cbiAqIFxuICogQ2xhc3Mgc3Vic2NyaWJlcyB0byB0aGUgYHJlbmRlcmAgZXZlbnQgdG8gdXBkYXRlIHRoZSBwYWdlciBjb250cm9sIHdoZW4gdGhlIGdyaWQgaXMgcmVuZGVyZWQuICBJdCBhbHNvIGNhbGxzIHRoZSBjaGFpbiBldmVudCBcbiAqIGByZW1vdGVQYXJhbXNgIHRvIGNvbXBpbGUgYSBsaXN0IG9mIHBhcmFtZXRlcnMgdG8gYmUgcGFzc2VkIHRvIHRoZSByZW1vdGUgZGF0YSBzb3VyY2Ugd2hlbiB1c2luZyByZW1vdGUgcHJvY2Vzc2luZy5cbiAqL1xuY2xhc3MgUGFnZXJNb2R1bGUge1xuICAgIC8qKlxuICAgICAqIEZvcm1hdHMgZ3JpZCdzIHJvd3MgYXMgYSBzZXJpZXMgb2YgcGFnZXMgcmF0aGVyIHRoYXQgYSBzY3JvbGxpbmcgbGlzdC4gIE1vZHVsZSBjYW4gYmUgdXNlZCB3aXRoIGJvdGggbG9jYWwgYW5kIHJlbW90ZSBkYXRhIHNvdXJjZXMuICBcbiAgICAgKiBAcGFyYW0ge0dyaWRDb250ZXh0fSBjb250ZXh0IEdyaWQgY29udGV4dC5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMudG90YWxSb3dzID0gdGhpcy5jb250ZXh0LnBlcnNpc3RlbmNlLnJvd0NvdW50O1xuICAgICAgICB0aGlzLnBhZ2VzVG9EaXNwbGF5ID0gdGhpcy5jb250ZXh0LnNldHRpbmdzLnBhZ2VyUGFnZXNUb0Rpc3BsYXk7XG4gICAgICAgIHRoaXMucm93c1BlclBhZ2UgPSB0aGlzLmNvbnRleHQuc2V0dGluZ3MucGFnZXJSb3dzUGVyUGFnZTtcbiAgICAgICAgdGhpcy5jdXJyZW50UGFnZSA9IDE7XG4gICAgICAgIC8vY3JlYXRlIGRpdiBjb250YWluZXIgZm9yIHBhZ2VyXG4gICAgICAgIHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdGhpcy5lbFBhZ2VyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInVsXCIpO1xuXG4gICAgICAgIHRoaXMuY29udGFpbmVyLmlkID0gYCR7dGhpcy5jb250ZXh0LnNldHRpbmdzLmJhc2VJZE5hbWV9X3BhZ2VyYDtcbiAgICAgICAgdGhpcy5jb250YWluZXIuY2xhc3NOYW1lID0gdGhpcy5jb250ZXh0LnNldHRpbmdzLnBhZ2VyQ3NzO1xuICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmQodGhpcy5lbFBhZ2VyKTtcbiAgICAgICAgdGhpcy5jb250ZXh0LmdyaWQudGFibGUuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYWZ0ZXJlbmRcIiwgdGhpcy5jb250YWluZXIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZXRzIGhhbmRsZXIgZXZlbnRzIGZvciByZW5kZXJpbmcvdXBkYXRpbmcgZ3JpZCBib2R5IHJvd3MgYW5kIHBhZ2VyIGNvbnRyb2wuXG4gICAgICovXG4gICAgaW5pdGlhbGl6ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuY29udGV4dC5zZXR0aW5ncy5yZW1vdGVQcm9jZXNzaW5nKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuZXZlbnRzLnN1YnNjcmliZShcInJlbmRlclwiLCB0aGlzLnJlbmRlclJlbW90ZSwgdHJ1ZSwgMTApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LmV2ZW50cy5zdWJzY3JpYmUoXCJyZW5kZXJcIiwgdGhpcy5yZW5kZXJMb2NhbCwgZmFsc2UsIDEwKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSB0b3RhbCBudW1iZXIgb2YgcG9zc2libGUgcGFnZXMgYmFzZWQgb24gdGhlIHRvdGFsIHJvd3MsIGFuZCByb3dzIHBlciBwYWdlIHNldHRpbmcuXG4gICAgICogQHJldHVybnMge051bWJlcn1cbiAgICAgKi9cbiAgICB0b3RhbFBhZ2VzKCkge1xuICAgICAgICBjb25zdCB0b3RhbFJvd3MgPSBpc05hTih0aGlzLnRvdGFsUm93cykgPyAxIDogdGhpcy50b3RhbFJvd3M7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMucm93c1BlclBhZ2UgPT09IDAgPyAxIDogTWF0aC5jZWlsKHRvdGFsUm93cyAvIHRoaXMucm93c1BlclBhZ2UpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgdmFsaWRhdGVkIHBhZ2UgbnVtYmVyIGlucHV0IGJ5IG1ha2luZyBzdXJlIHZhbHVlIGlzIG51bWVyaWMsIGFuZCB3aXRoaW4gdGhlIGJvdW5kcyBvZiB0aGUgdG90YWwgcGFnZXMuICBcbiAgICAgKiBBbiBpbnZhbGlkIGlucHV0IHdpbGwgcmV0dXJuIGEgdmFsdWUgb2YgMS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZyB8IG51bWJlcn0gY3VycmVudFBhZ2UgUGFnZSBudW1iZXIgdG8gdmFsaWRhdGUuXG4gICAgICogQHJldHVybnMge051bWJlcn0gUmV0dXJucyBhIHZhbGlkIHBhZ2UgbnVtYmVyIGJldHdlZW4gMSBhbmQgdGhlIHRvdGFsIG51bWJlciBvZiBwYWdlcy4gIElmIHRoZSBpbnB1dCBpcyBpbnZhbGlkLCByZXR1cm5zIDEuXG4gICAgICovXG4gICAgdmFsaWRhdGVQYWdlKGN1cnJlbnRQYWdlKSB7XG4gICAgICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihjdXJyZW50UGFnZSkpIHtcbiAgICAgICAgICAgIGN1cnJlbnRQYWdlID0gcGFyc2VJbnQoY3VycmVudFBhZ2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdG90YWwgPSB0aGlzLnRvdGFsUGFnZXMoKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gdG90YWwgPCBjdXJyZW50UGFnZSA/IHRvdGFsIDogY3VycmVudFBhZ2U7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdCA8PSAwID8gMSA6IHJlc3VsdDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgZmlyc3QgcGFnZSBudW1iZXIgdG8gZGlzcGxheSBpbiB0aGUgYnV0dG9uIGNvbnRyb2wgc2V0IGJhc2VkIG9uIHRoZSBwYWdlIG51bWJlciBwb3NpdGlvbiBpbiB0aGUgZGF0YXNldC4gIFxuICAgICAqIFBhZ2UgbnVtYmVycyBvdXRzaWRlIG9mIHRoaXMgcmFuZ2UgYXJlIHJlcHJlc2VudGVkIGJ5IGFuIGFycm93LlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBjdXJyZW50UGFnZSBDdXJyZW50IHBhZ2UgbnVtYmVyLlxuICAgICAqIEByZXR1cm5zIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZmlyc3REaXNwbGF5UGFnZShjdXJyZW50UGFnZSkge1xuICAgICAgICBjb25zdCBtaWRkbGUgPSBNYXRoLmZsb29yKHRoaXMucGFnZXNUb0Rpc3BsYXkgLyAyICsgdGhpcy5wYWdlc1RvRGlzcGxheSAlIDIpO1xuXG4gICAgICAgIGlmIChjdXJyZW50UGFnZSA8IG1pZGRsZSkgcmV0dXJuIDE7XG5cbiAgICAgICAgaWYgKHRoaXMudG90YWxQYWdlcygpIDwgKGN1cnJlbnRQYWdlICsgdGhpcy5wYWdlc1RvRGlzcGxheSAtIG1pZGRsZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLm1heCh0aGlzLnRvdGFsUGFnZXMoKSAtIHRoaXMucGFnZXNUb0Rpc3BsYXkgKyAxLCAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJyZW50UGFnZSAtIG1pZGRsZSArIDE7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgdGhlIGh0bWwgbGlzdCBpdGVtIGFuZCBidXR0b24gZWxlbWVudHMgZm9yIHRoZSBwYWdlciBjb250YWluZXIncyB1bCBlbGVtZW50LiAgV2lsbCBhbHNvIHNldCB0aGUgXG4gICAgICogYHRoaXMuY3VycmVudFBhZ2VgIHByb3BlcnR5IHRvIHRoZSBjdXJyZW50IHBhZ2UgbnVtYmVyLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBjdXJyZW50UGFnZSBDdXJyZW50IHBhZ2UgbnVtYmVyLiAgQXNzdW1lcyBhIHZhbGlkIHBhZ2UgbnVtYmVyIGlzIHByb3ZpZGVkLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIEJ1dHRvbiBjbGljayBoYW5kbGVyLlxuICAgICAqL1xuICAgIHJlbmRlcihjdXJyZW50UGFnZSwgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgdG90YWxQYWdlcyA9IHRoaXMudG90YWxQYWdlcygpO1xuICAgICAgICAvLyBDbGVhciB0aGUgcHJpb3IgbGkgZWxlbWVudHMuXG4gICAgICAgIHRoaXMuZWxQYWdlci5yZXBsYWNlQ2hpbGRyZW4oKTtcblxuICAgICAgICBpZiAodG90YWxQYWdlcyA8PSAxKSByZXR1cm47XG4gICAgICAgIFxuICAgICAgICBjb25zdCBmaXJzdERpc3BsYXkgPSB0aGlzLmZpcnN0RGlzcGxheVBhZ2UoY3VycmVudFBhZ2UpO1xuICAgICAgICBjb25zdCBtYXhQYWdlcyA9IGZpcnN0RGlzcGxheSArIHRoaXMucGFnZXNUb0Rpc3BsYXk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmN1cnJlbnRQYWdlID0gY3VycmVudFBhZ2U7XG4gICAgICAgIHRoaXMuZWxQYWdlci5hcHBlbmRDaGlsZChQYWdlckJ1dHRvbnMuc3RhcnQoY3VycmVudFBhZ2UsIGNhbGxiYWNrKSk7XG5cbiAgICAgICAgZm9yIChsZXQgcGFnZSA9IGZpcnN0RGlzcGxheTsgcGFnZSA8PSB0b3RhbFBhZ2VzICYmIHBhZ2UgPCBtYXhQYWdlczsgcGFnZSsrKSB7XG4gICAgICAgICAgICB0aGlzLmVsUGFnZXIuYXBwZW5kQ2hpbGQoUGFnZXJCdXR0b25zLnBhZ2VOdW1iZXIocGFnZSwgY3VycmVudFBhZ2UsIGNhbGxiYWNrKSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmVsUGFnZXIuYXBwZW5kQ2hpbGQoUGFnZXJCdXR0b25zLmVuZCh0b3RhbFBhZ2VzLCBjdXJyZW50UGFnZSwgY2FsbGJhY2spKTtcbiAgICB9XG5cbiAgICBoYW5kbGVQYWdpbmcgPSBhc3luYyAoZSkgPT4ge1xuICAgICAgICBjb25zdCB2YWxpZFBhZ2UgPSB7IHBhZ2U6IHRoaXMudmFsaWRhdGVQYWdlKGUuY3VycmVudFRhcmdldC5kYXRhc2V0LnBhZ2UpIH07XG5cbiAgICAgICAgaWYgKHRoaXMuY29udGV4dC5zZXR0aW5ncy5yZW1vdGVQcm9jZXNzaW5nKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJlbmRlclJlbW90ZSh2YWxpZFBhZ2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5yZW5kZXJMb2NhbCh2YWxpZFBhZ2UpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBIYW5kbGVyIGZvciByZW5kZXJpbmcgcm93cyB1c2luZyBsb2NhbCBkYXRhIHNvdXJjZS4gIFdpbGwgc2xpY2UgdGhlIGRhdGEgYXJyYXkgYmFzZWQgb24gdGhlIGN1cnJlbnQgcGFnZSBhbmQgcm93cyBwZXIgcGFnZSBzZXR0aW5ncyxcbiAgICAgKiB0aGVuIGNhbGwgYHJlbmRlcmAgdG8gdXBkYXRlIHRoZSBwYWdlciBjb250cm9sLiAgT3B0aW9uYWwgYXJndW1lbnQgYHBhcmFtc2AgaXMgYW4gb2JqZWN0IHRoYXQgY2FuIGNvbnRhaW4gdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuICAgICAqICogYHBhZ2VgOlBhZ2UgbnVtYmVyIHRvIHJlbmRlci4gIElmIG5vdCBwcm92aWRlZCwgZGVmYXVsdHMgdG8gMS5cbiAgICAgKiBAcGFyYW0ge3sgcGFnZTogbnVtYmVyIH0gfCBudWxsfSBwYXJhbXMgXG4gICAgICovXG4gICAgcmVuZGVyTG9jYWwgPSAocGFyYW1zID0ge30pID0+IHtcbiAgICAgICAgY29uc3QgcGFnZSA9ICFwYXJhbXMucGFnZSA/IDEgOiB0aGlzLnZhbGlkYXRlUGFnZShwYXJhbXMucGFnZSk7XG4gICAgICAgIGNvbnN0IGJlZ2luID0gKHBhZ2UgLSAxKSAqIHRoaXMucm93c1BlclBhZ2U7XG4gICAgICAgIGNvbnN0IGVuZCA9IGJlZ2luICsgdGhpcy5yb3dzUGVyUGFnZTtcbiAgICAgICAgY29uc3QgZGF0YSA9IHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5kYXRhLnNsaWNlKGJlZ2luLCBlbmQpO1xuXG4gICAgICAgIHRoaXMuY29udGV4dC5ncmlkLnJlbmRlclJvd3MoZGF0YSwgdGhpcy5jb250ZXh0LnBlcnNpc3RlbmNlLnJvd0NvdW50KTtcbiAgICAgICAgdGhpcy50b3RhbFJvd3MgPSB0aGlzLmNvbnRleHQucGVyc2lzdGVuY2Uucm93Q291bnQ7XG4gICAgICAgIHRoaXMucmVuZGVyKHBhZ2UsIHRoaXMuaGFuZGxlUGFnaW5nKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIEhhbmRsZXIgZm9yIHJlbmRlcmluZyByb3dzIHVzaW5nIHJlbW90ZSBkYXRhIHNvdXJjZS4gIFdpbGwgY2FsbCB0aGUgYGRhdGFsb2FkZXJgIHRvIHJlcXVlc3QgZGF0YSBiYXNlZCBvbiB0aGUgcHJvdmlkZWQgcGFyYW1zLFxuICAgICAqIHRoZW4gY2FsbCBgcmVuZGVyYCB0byB1cGRhdGUgdGhlIHBhZ2VyIGNvbnRyb2wuICBPcHRpb25hbCBhcmd1bWVudCBgcGFyYW1zYCBpcyBhbiBvYmplY3QgdGhhdCBjYW4gY29udGFpbiB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gICAgICogKiBgcGFnZWA6IFBhZ2UgbnVtYmVyIHRvIHJlbmRlci4gIElmIG5vdCBwcm92aWRlZCwgZGVmYXVsdHMgdG8gMS5cbiAgICAgKiBAcGFyYW0ge3sgcGFnZTogbnVtYmVyIH0gfCBudWxsfSBwYXJhbXMgXG4gICAgICovXG4gICAgcmVuZGVyUmVtb3RlID0gYXN5bmMgKHBhcmFtcyA9IHt9KSA9PiB7XG4gICAgICAgIGlmICghcGFyYW1zLnBhZ2UpIHBhcmFtcy5wYWdlID0gMTtcbiAgICAgICAgXG4gICAgICAgIHBhcmFtcyA9IHRoaXMuY29udGV4dC5ldmVudHMuY2hhaW4oXCJyZW1vdGVQYXJhbXNcIiwgcGFyYW1zKTtcblxuICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5jb250ZXh0LmRhdGFsb2FkZXIucmVxdWVzdEdyaWREYXRhKHBhcmFtcyk7XG4gICAgICAgIGNvbnN0IHJvd0NvdW50ID0gZGF0YS5yb3dDb3VudCA/PyAwO1xuXG4gICAgICAgIHRoaXMuY29udGV4dC5ncmlkLnJlbmRlclJvd3MoZGF0YS5kYXRhLCByb3dDb3VudCk7XG4gICAgICAgIHRoaXMudG90YWxSb3dzID0gcm93Q291bnQ7XG4gICAgICAgIHRoaXMucmVuZGVyKHBhcmFtcy5wYWdlLCB0aGlzLmhhbmRsZVBhZ2luZyk7XG4gICAgfTtcbn1cblxuUGFnZXJNb2R1bGUubW9kdWxlTmFtZSA9IFwicGFnZXJcIjtcblxuZXhwb3J0IHsgUGFnZXJNb2R1bGUgfTsiLCJpbXBvcnQgeyBHcmlkQ29udGV4dCB9IGZyb20gXCIuLi9jb21wb25lbnRzL2NvbnRleHQvZ3JpZENvbnRleHQuanNcIjtcbmltcG9ydCB7IE1lcmdlT3B0aW9ucyB9IGZyb20gXCIuLi9zZXR0aW5ncy9tZXJnZU9wdGlvbnMuanNcIjtcbmltcG9ydCB7IFNldHRpbmdzR3JpZCB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc0dyaWQuanNcIjtcbmltcG9ydCB7IFJvd01vZHVsZSB9IGZyb20gXCIuLi9tb2R1bGVzL3Jvdy9yb3dNb2R1bGUuanNcIjtcbmltcG9ydCB7IFBhZ2VyTW9kdWxlIH0gZnJvbSBcIi4uL21vZHVsZXMvcGFnZXIvcGFnZXJNb2R1bGUuanNcIjtcbi8qKlxuICogQ3JlYXRlcyBncmlkJ3MgY29yZSBwcm9wZXJ0aWVzIGFuZCBvYmplY3RzLCBhbmQgYWxsb3dzIGZvciByZWdpc3RyYXRpb24gb2YgbW9kdWxlcyB1c2VkIHRvIGJ1aWxkIGZ1bmN0aW9uYWxpdHkuXG4gKiBVc2UgdGhpcyBjbGFzcyBhcyBhIGJhc2UgY2xhc3MgdG8gY3JlYXRlIGEgZ3JpZCB3aXRoIGN1c3RvbSBtb2R1bGFyIGZ1bmN0aW9uYWxpdHkgdXNpbmcgdGhlIGBleHRlbmRzYCBjbGFzcyByZWZlcmVuY2UuXG4gKi9cbmNsYXNzIEdyaWRDb3JlIHtcbiAgICAjbW9kdWxlVHlwZXM7XG4gICAgI21vZHVsZXNDcmVhdGVkO1xuICAgIC8qKlxuICAgICogQ3JlYXRlcyBncmlkJ3MgY29yZSBwcm9wZXJ0aWVzIGFuZCBvYmplY3RzIGFuZCBpZGVudGlmaWVzIGRpdiBlbGVtZW50IHdoaWNoIGdyaWQgd2lsbCBiZSBidWlsdC4gIEFmdGVyIGluc3RhbnRpYXRpb24sIFxuICAgICogdXNlIHRoZSBgYWRkTW9kdWxlc2AgbWV0aG9kIHRvIHJlZ2lzdGVyIGRlc2lyZWQgbW9kdWxlcyB0byBjb21wbGV0ZSB0aGUgc2V0dXAgcHJvY2Vzcy4gIE1vZHVsZSByZWdpc3RyYXRpb24gaXMga2VwdCBcbiAgICAqIHNlcGFyYXRlIGZyb20gY29uc3RydWN0b3IgdG8gYWxsb3cgY3VzdG9taXphdGlvbiBvZiBtb2R1bGVzIHVzZWQgdG8gYnVpbGQgZ3JpZC5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb250YWluZXIgZGl2IGVsZW1lbnQgSUQgdG8gYnVpbGQgZ3JpZCBpbi5cbiAgICAqIEBwYXJhbSB7b2JqZWN0fSBzZXR0aW5ncyBVc2VyIHNldHRpbmdzOyBrZXkvdmFsdWUgcGFpcnMuXG4gICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb250YWluZXIsIHNldHRpbmdzKSB7XG4gICAgICAgIGNvbnN0IHNvdXJjZSA9IE1lcmdlT3B0aW9ucy5tZXJnZShzZXR0aW5ncyk7XG5cbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9IG5ldyBTZXR0aW5nc0dyaWQoc291cmNlKTtcbiAgICAgICAgdGhpcy5jb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChjb250YWluZXIpO1xuICAgICAgICB0aGlzLmVuYWJsZVBhZ2luZyA9IHRoaXMuc2V0dGluZ3MuZW5hYmxlUGFnaW5nO1xuICAgICAgICB0aGlzLmlzVmFsaWQgPSB0cnVlO1xuICAgICAgICB0aGlzLiNtb2R1bGVUeXBlcyA9IFtdO1xuICAgICAgICB0aGlzLiNtb2R1bGVzQ3JlYXRlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLm1vZHVsZXMgPSB7fTtcblxuICAgICAgICBpZiAoT2JqZWN0LnZhbHVlcyhzb3VyY2UuY29sdW1ucykubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk1pc3NpbmcgcmVxdWlyZWQgY29sdW1ucyBkZWZpbml0aW9uLlwiKTtcbiAgICAgICAgICAgIHRoaXMuaXNWYWxpZCA9IGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IHNvdXJjZS5kYXRhID8/IFtdO1xuICAgICAgICAgICAgdGhpcy4jaW5pdChzb3VyY2UuY29sdW1ucywgZGF0YSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAjaW5pdChjb2x1bW5zLCBkYXRhKSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IG5ldyBHcmlkQ29udGV4dChjb2x1bW5zLCB0aGlzLnNldHRpbmdzLCBkYXRhKTtcblxuICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmQodGhpcy5jb250ZXh0LmdyaWQudGFibGUpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlciBtb2R1bGVzIHRvIGJlIHVzZWQgaW4gdGhlIGJ1aWxkaW5nIGFuZCBvcGVyYXRpb24gb2YgdGhlIGdyaWQuICBcbiAgICAgKiBcbiAgICAgKiBOT1RFOiBUaGlzIG1ldGhvZCBzaG91bGQgYmUgY2FsbGVkIGJlZm9yZSB0aGUgYGluaXQoKWAgbWV0aG9kLlxuICAgICAqIEBwYXJhbSB7Y2xhc3N9IG1vZHVsZXMgQ2xhc3MgbW9kdWxlKHMpLlxuICAgICAqL1xuICAgIGFkZE1vZHVsZXMoLi4ubW9kdWxlcykge1xuICAgICAgICBtb2R1bGVzLmZvckVhY2goKG0pID0+IHRoaXMuI21vZHVsZVR5cGVzLnB1c2gobSkpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbmV3IGNvbHVtbiB0byB0aGUgZ3JpZC4gIFRoZSBjb2x1bW4gd2lsbCBiZSBhZGRlZCB0byB0aGUgZW5kIG9mIHRoZSBjb2x1bW5zIGNvbGxlY3Rpb24gYnkgZGVmYXVsdCwgYnV0IGNhbiBcbiAgICAgKiBiZSBpbnNlcnRlZCBhdCBhIHNwZWNpZmljIGluZGV4LiAgXG4gICAgICogXG4gICAgICogTk9URTogVGhpcyBtZXRob2Qgc2hvdWxkIGJlIGNhbGxlZCBiZWZvcmUgdGhlIGBpbml0KClgIG1ldGhvZC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY29sdW1uIENvbHVtbiBvYmplY3QgZGVmaW5pdGlvbi5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW2luZGV4UG9zaXRpb249bnVsbF0gSW5kZXggdG8gaW5zZXJ0IHRoZSBjb2x1bW4gYXQuIElmIG51bGwsIGFwcGVuZHMgdG8gdGhlIGVuZC5cbiAgICAgKi9cbiAgICBhZGRDb2x1bW4oY29sdW1uLCBpbmRleFBvc2l0aW9uID0gbnVsbCkge1xuICAgICAgICB0aGlzLmNvbnRleHQuY29sdW1uTWFuYWdlci5hZGRDb2x1bW4oY29sdW1uLCBpbmRleFBvc2l0aW9uKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogSXRlcmF0ZXMgdGhvdWdoIGEgbGlzdCBvZiBtb2R1bGVzIHRvIGluc3RhbnRpYXRlIGFuZCBpbml0aWFsaXplIHN0YXJ0IHVwIGFuZC9vciBidWlsZCBiZWhhdmlvci4gIFNob3VsZCBiZSBjYWxsZWQgYWZ0ZXIgXG4gICAgICogYWxsIG1vZHVsZXMgaGF2ZSBiZWVuIHJlZ2lzdGVyZWQgdXNpbmcgdGhlIGBhZGRNb2R1bGVzYCBtZXRob2QsIGFuZCBvbmx5IG5lZWRzIHRvIGJlIGNhbGxlZCBvbmNlLlxuICAgICAqIFxuICAgICAqIE5PVEU6IElmIGJ5cGFzc2luZyB0aGUgYGluaXQoKWAgbWV0aG9kLCBiZSBzdXJlIHRvIGNhbGwgYGNvbnRleHQuZ3JpZC5pbml0aWFsaXplSGVhZGVyKClgIGJlZm9yZSBjYWxsaW5nIHRoaXMgbWV0aG9kIFxuICAgICAqIHRvIGVuc3VyZSB0aGUgZ3JpZCdzIGhlYWRlciBpcyBidWlsdC5cbiAgICAgKi9cbiAgICBfaW5pdE1vZHVsZXMgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLiNtb2R1bGVzQ3JlYXRlZClcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAvL1ZlcmlmeSBpZiBiYXNlIHJlcXVpcmVkIHJvdyByZWxhdGVkIG1vZHVsZSBoYXMgYmVlbiBhZGRlZCB0byB0aGUgZ3JpZC5cbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MuZW5hYmxlUGFnaW5nICYmICF0aGlzLiNtb2R1bGVUeXBlcy5zb21lKCh4KSA9PiB4Lm1vZHVsZU5hbWUgPT09IFwicGFnZVwiKSkge1xuICAgICAgICAgICAgdGhpcy4jbW9kdWxlVHlwZXMucHVzaChQYWdlck1vZHVsZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoIXRoaXMuI21vZHVsZVR5cGVzLnNvbWUoKHgpID0+IHgubW9kdWxlTmFtZSA9PT0gXCJyb3dcIikpIHtcbiAgICAgICAgICAgICB0aGlzLiNtb2R1bGVUeXBlcy5wdXNoKFJvd01vZHVsZSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiNtb2R1bGVUeXBlcy5mb3JFYWNoKChtKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQubW9kdWxlc1ttLm1vZHVsZU5hbWVdID0gbmV3IG0odGhpcy5jb250ZXh0KTtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5tb2R1bGVzW20ubW9kdWxlTmFtZV0uaW5pdGlhbGl6ZSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLiNtb2R1bGVzQ3JlYXRlZCA9IHRydWU7XG4gICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInBvc3RJbml0TW9kXCIpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogSW5zdGFudGlhdGVzIHRoZSBjcmVhdGlvbiBvZiB0aGUgZ3JpZC4gIE1ldGhvZCB3aWxsIGNyZWF0ZSB0aGUgZ3JpZCdzIGVsZW1lbnRzLCBydW4gYWxsIHJlZ2lzdGVyZWQgbW9kdWxlcywgZGF0YSBwcm9jZXNzaW5nIFxuICAgICAqIHBpcGVsaW5lcyBhbmQgZXZlbnRzLiAgSWYgZ3JpZCBpcyBiZWluZyBidWlsdCB1c2luZyB0aGUgbW9kdWxhciBhcHByb2FjaCwgYmUgc3VyZSB0byBjYWxsIHRoZSBgYWRkTW9kdWxlc2AgbWV0aG9kIGJlZm9yZSBcbiAgICAgKiBjYWxsaW5nIHRoaXMgb25lIHRvIGVuc3VyZSBhbGwgbW9kdWxlcyBhcmUgcmVnaXN0ZXJlZCBhbmQgaW5pdGlhbGl6ZWQgaW4gdGhlaXIgcHJvcGVyIG9yZGVyLlxuICAgICAqIFxuICAgICAqIE5PVEU6IE1ldGhvZCB3aWxsIGF1dG9tYXRpY2FsbHkgcmVnaXN0ZXIgdGhlIGBQYWdlck1vZHVsZWAgaWYgcGFnaW5nIGlzIGVuYWJsZWQsIG9yIHRoZSBgUm93TW9kdWxlYCBpZiBwYWdpbmcgaXMgbm90IGVuYWJsZWQuXG4gICAgICovXG4gICAgYXN5bmMgaW5pdCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzVmFsaWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTWlzc2luZyByZXF1aXJlZCBjb2x1bW5zIGRlZmluaXRpb24uXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb250ZXh0LmdyaWQuaW5pdGlhbGl6ZUhlYWRlcigpO1xuXG4gICAgICAgIGF3YWl0IHRoaXMuX2luaXRNb2R1bGVzKCk7XG5cbiAgICAgICAgaWYgKCF0aGlzLnNldHRpbmdzLnJlbW90ZVByb2Nlc3NpbmcgJiYgdGhpcy5zZXR0aW5ncy5yZW1vdGVVcmwpIHtcbiAgICAgICAgICAgIC8vbG9jYWwgZGF0YSBzb3VyY2UgcHJvY2Vzc2luZzsgc2V0IHBpcGVsaW5lIGFjdGlvbnMuXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQucGlwZWxpbmUuYWRkU3RlcChcImluaXRcIiwgdGhpcy5jb250ZXh0LnBlcnNpc3RlbmNlLnNldERhdGEpO1xuICAgICAgICB9XG4gICAgICAgIC8vZXhlY3V0ZSBkYXRhIHBpcGVsaW5lIGJlZm9yZSBidWlsZGluZyBlbGVtZW50cy5cbiAgICAgICAgaWYgKHRoaXMuY29udGV4dC5waXBlbGluZS5oYXNQaXBlbGluZShcImluaXRcIikpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5waXBlbGluZS5leGVjdXRlKFwiaW5pdFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQXBwbHkgZmlsdGVyIGNvbmRpdGlvbiBmb3IgdGFyZ2V0IGNvbHVtbi4gIE1ldGhvZCBwcm92aWRlcyBhIG1lYW5zIHRvIGFwcGx5IGNvbmRpdGlvbiBvdXRzaWRlIG9mIGhlYWRlciBmaWx0ZXIgY29udHJvbHMuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZpZWxkIFRhcmdldCBmaWVsZC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gdmFsdWUgRmlsdGVyIHZhbHVlLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nIHwgRnVuY3Rpb259IFt0eXBlPVwiZXF1YWxzXCJdIEZpbHRlciB0eXBlLiAgSWYgYSBmdW5jdGlvbiBpcyBwcm92aWRlZCwgaXQgd2lsbCBiZSB1c2VkIGFzIHRoZSBmaWx0ZXIgY29uZGl0aW9uLlxuICAgICAqIE90aGVyd2lzZSwgdXNlIHRoZSBhc3NvY2lhdGVkIHN0cmluZyB2YWx1ZSB0eXBlIHRvIGRldGVybWluZSB0aGUgZmlsdGVyIGNvbmRpdGlvbi4gIGkuZS4gXCJlcXVhbHNcIiwgXCJjb250YWluc1wiLCBldGMuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtmaWVsZFR5cGU9XCJzdHJpbmdcIl0gRmllbGQgdHlwZS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2ZpbHRlclBhcmFtcz17fV0gQWRkaXRpb25hbCBmaWx0ZXIgcGFyYW1ldGVycy5cbiAgICAgKi9cbiAgICBzZXRGaWx0ZXIgPSBhc3luYyAoZmllbGQsIHZhbHVlLCB0eXBlID0gXCJlcXVhbHNcIiwgZmllbGRUeXBlID0gXCJzdHJpbmdcIiwgZmlsdGVyUGFyYW1zID0ge30pID0+IHtcbiAgICAgICAgaWYgKHRoaXMuY29udGV4dC5tb2R1bGVzLmZpbHRlcikge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0Lm1vZHVsZXMuZmlsdGVyLnNldEZpbHRlcihmaWVsZCwgdmFsdWUsIHR5cGUsIGZpZWxkVHlwZSwgZmlsdGVyUGFyYW1zKTtcblxuICAgICAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiRmlsdGVyIG1vZHVsZSBpcyBub3QgZW5hYmxlZC4gIFNldCBgVGFibGVEYXRhLmRlZmF1bHRPcHRpb25zLmVuYWJsZUZpbHRlcmAgdG8gdHJ1ZSBpbiBvcmRlciB0byBlbmFibGUgdGhpcyBmdW5jdGlvbi5cIik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJlbW92ZSBmaWx0ZXIgY29uZGl0aW9uIGZvciB0YXJnZXQgZmllbGQuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZpZWxkIFRhcmdldCBmaWVsZC5cbiAgICAgKi9cbiAgICByZW1vdmVGaWx0ZXIgPSBhc3luYyAoZmllbGQpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuY29udGV4dC5tb2R1bGVzLmZpbHRlcikge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0Lm1vZHVsZXMuZmlsdGVyLnJlbW92ZUZpbHRlcihmaWVsZCk7XG5cbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkZpbHRlciBtb2R1bGUgaXMgbm90IGVuYWJsZWQuICBTZXQgYFRhYmxlRGF0YS5kZWZhdWx0T3B0aW9ucy5lbmFibGVGaWx0ZXJgIHRvIHRydWUgaW4gb3JkZXIgdG8gZW5hYmxlIHRoaXMgZnVuY3Rpb24uXCIpO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZXhwb3J0IHsgR3JpZENvcmUgfTsiLCIvKipcbiAqIFByb3ZpZGVzIGxvZ2ljIHRvIGNvbnZlcnQgZ3JpZCBkYXRhIGludG8gYSBkb3dubG9hZGFibGUgQ1NWIGZpbGUuXG4gKiBNb2R1bGUgd2lsbCBwcm92aWRlIGxpbWl0ZWQgZm9ybWF0dGluZyBvZiBkYXRhLiAgT25seSBjb2x1bW5zIHdpdGggYSBmb3JtYXR0ZXIgdHlwZSBcbiAqIG9mIGBtb2R1bGVgIG9yIGBmdW5jdGlvbmAgd2lsbCBiZSBwcm9jZXNzZWQuICBBbGwgb3RoZXIgY29sdW1ucyB3aWxsIGJlIHJldHVybmVkIGFzXG4gKiB0aGVpciByYXcgZGF0YSB0eXBlLiAgSWYgYSBjb2x1bW4ncyB2YWx1ZSBjb250YWlucyBhIGNvbW1hLCB0aGUgdmFsdWUgd2lsbCBiZSBkb3VibGUgcXVvdGVkLlxuICovXG5jbGFzcyBDc3ZNb2R1bGUge1xuICAgIC8qKlxuICAgICAqIEFsbG93cyBncmlkJ3MgZGF0YSB0byBiZSBjb252ZXJ0ZWQgaW50byBhIGRvd25sb2FkYWJsZSBDU1YgZmlsZS4gIElmIGdyaWQgaXMgXG4gICAgICogc2V0IHRvIGEgbG9jYWwgZGF0YSBzb3VyY2UsIHRoZSBkYXRhIGNhY2hlIGluIHRoZSBwZXJzaXN0ZW5jZSBjbGFzcyBpcyB1c2VkLlxuICAgICAqIE90aGVyd2lzZSwgY2xhc3Mgd2lsbCBtYWtlIGFuIEFqYXggY2FsbCB0byByZW1vdGUgdGFyZ2V0IHNldCBpbiBkYXRhIGxvYWRlclxuICAgICAqIGNsYXNzLlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgR3JpZCBjb250ZXh0IGNsYXNzLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy5kZWxpbWl0ZXIgPSBcIixcIjtcbiAgICAgICAgdGhpcy5idXR0b24gPSBjb250ZXh0LnNldHRpbmdzLmNzdkV4cG9ydElkO1xuICAgICAgICB0aGlzLmRhdGFVcmwgPSBjb250ZXh0LnNldHRpbmdzLmNzdkV4cG9ydFJlbW90ZVNvdXJjZTtcbiAgICB9XG5cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICBjb25zdCBidG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0aGlzLmJ1dHRvbik7XG4gICAgICAgIFxuICAgICAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlRG93bmxvYWQpO1xuICAgIH1cblxuICAgIGhhbmRsZURvd25sb2FkID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICBsZXQgY3N2RGF0YSA9IFtdO1xuICAgICAgICBjb25zdCBmaWxlTmFtZSA9IGAke2RvY3VtZW50LnRpdGxlfS5jc3ZgO1xuXG4gICAgICAgIGlmICh0aGlzLmRhdGFVcmwpIHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmNvbnRleHQuZGF0YWxvYWRlci5yZXF1ZXN0RGF0YSh0aGlzLmRhdGFVcmwpO1xuXG4gICAgICAgICAgICBjc3ZEYXRhID0gdGhpcy5idWlsZEZpbGVDb250ZW50KGRhdGEpLmpvaW4oXCJcXHJcXG5cIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjc3ZEYXRhID0gdGhpcy5idWlsZEZpbGVDb250ZW50KHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5kYXRhQ2FjaGUpLmpvaW4oXCJcXHJcXG5cIik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBibG9iID0gbmV3IEJsb2IoW2NzdkRhdGFdLCB7IHR5cGU6IFwidGV4dC9jc3Y7Y2hhcnNldD11dGYtODtcIiB9KTtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuXG4gICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCB3aW5kb3cuVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKSk7XG4gICAgICAgIC8vc2V0IGZpbGUgdGl0bGVcbiAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJkb3dubG9hZFwiLCBmaWxlTmFtZSk7XG4gICAgICAgIC8vdHJpZ2dlciBkb3dubG9hZFxuICAgICAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlbGVtZW50KTtcbiAgICAgICAgZWxlbWVudC5jbGljaygpO1xuICAgICAgICAvL3JlbW92ZSB0ZW1wb3JhcnkgbGluayBlbGVtZW50XG4gICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoZWxlbWVudCk7XG5cbiAgICAgICAgd2luZG93LmFsZXJ0KGBEb3dubG9hZGVkICR7ZmlsZU5hbWV9YCk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGFuIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgdGhlIGNvbHVtbnMgYW5kIGhlYWRlciBuYW1lcyB0aGF0IHNob3VsZCBiZSB1c2VkXG4gICAgICogdG8gY3JlYXRlIHRoZSBDU1YgcmVzdWx0cy4gIFdpbGwgZXhjbHVkZSBjb2x1bW5zIHdpdGggYSB0eXBlIG9mIGBpY29uYC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY29sdW1uTWdyQ29sdW1ucyBDb2x1bW4gTWFuYWdlciBDb2x1bW5zIGNvbGxlY3Rpb24uXG4gICAgICogQHJldHVybnMge3sgaGVhZGVyczogQXJyYXk8c3RyaW5nPiwgY29sdW1uczogQXJyYXk8Q29sdW1uPiB9fVxuICAgICAqL1xuICAgIGlkZW50aWZ5Q29sdW1ucyhjb2x1bW5NZ3JDb2x1bW5zKSB7XG4gICAgICAgIGNvbnN0IGhlYWRlcnMgPSBbXTtcbiAgICAgICAgY29uc3QgY29sdW1ucyA9IFtdO1xuXG4gICAgICAgIGZvciAoY29uc3QgY29sdW1uIG9mIGNvbHVtbk1nckNvbHVtbnMpIHtcbiAgICAgICAgICAgIGlmIChjb2x1bW4udHlwZSA9PT0gXCJpY29uXCIpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICBoZWFkZXJzLnB1c2goY29sdW1uLmxhYmVsKTtcbiAgICAgICAgICAgIGNvbHVtbnMucHVzaChjb2x1bW4pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHsgaGVhZGVyczogaGVhZGVycywgY29sdW1uczogY29sdW1ucyB9OyBcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ29udmVydHMgZ3JpZCBkYXRhIGluIERhdGFQZXJzaXN0ZW5jZSBjbGFzcyBpbnRvIGEgc2luZ2xlIGRpbWVuc2lvbmFsIGFycmF5IG9mXG4gICAgICogc3RyaW5nIGRlbGltaXRlZCB2YWx1ZXMgdGhhdCByZXByZXNlbnRzIGEgcm93IG9mIGRhdGEgaW4gYSBjc3YgZmlsZS4gXG4gICAgICogQHBhcmFtIHtBcnJheTxPYmplY3Q+fSBkYXRhc2V0IGRhdGEgc2V0IHRvIGJ1aWxkIGNzdiByb3dzLlxuICAgICAqIEByZXR1cm5zIHtBcnJheTxzdHJpbmc+fVxuICAgICAqL1xuICAgIGJ1aWxkRmlsZUNvbnRlbnQoZGF0YXNldCkge1xuICAgICAgICBjb25zdCBmaWxlQ29udGVudHMgPSBbXTtcbiAgICAgICAgY29uc3QgY29sdW1ucyA9IHRoaXMuaWRlbnRpZnlDb2x1bW5zKHRoaXMuY29udGV4dC5jb2x1bW5NYW5hZ2VyLmNvbHVtbnMpO1xuICAgICAgICAvL2NyZWF0ZSBkZWxpbWl0ZWQgaGVhZGVyLlxuICAgICAgICBmaWxlQ29udGVudHMucHVzaChjb2x1bW5zLmhlYWRlcnMuam9pbih0aGlzLmRlbGltaXRlcikpO1xuICAgICAgICAvL2NyZWF0ZSByb3cgZGF0YVxuICAgICAgICBmb3IgKGNvbnN0IHJvd0RhdGEgb2YgZGF0YXNldCkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gY29sdW1ucy5jb2x1bW5zLm1hcCgoYykgPT4gdGhpcy5mb3JtYXRWYWx1ZShjLCByb3dEYXRhKSk7XG5cbiAgICAgICAgICAgIGZpbGVDb250ZW50cy5wdXNoKHJlc3VsdC5qb2luKHRoaXMuZGVsaW1pdGVyKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmlsZUNvbnRlbnRzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgZm9ybWF0dGVkIHN0cmluZyBiYXNlZCBvbiB0aGUgQ29sdW1uJ3MgZm9ybWF0dGVyIHNldHRpbmcuXG4gICAgICogV2lsbCBkb3VibGUgcXVvdGUgc3RyaW5nIGlmIGNvbW1hIGNoYXJhY3RlciBpcyBmb3VuZCBpbiB2YWx1ZS5cbiAgICAgKiBAcGFyYW0ge0NvbHVtbn0gY29sdW1uIGNvbHVtbiBtb2RlbC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcm93RGF0YSByb3cgZGF0YS5cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqL1xuICAgIGZvcm1hdFZhbHVlKGNvbHVtbiwgcm93RGF0YSkge1xuICAgICAgICBsZXQgdmFsdWUgPSBTdHJpbmcocm93RGF0YVtjb2x1bW4uZmllbGRdKTtcbiAgICAgICAgLy9hcHBseSBsaW1pdGVkIGZvcm1hdHRpbmc7IGNzdiByZXN1bHRzIHNob3VsZCBiZSAncmF3JyBkYXRhLlxuICAgICAgICBpZiAoY29sdW1uLmZvcm1hdHRlcikge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjb2x1bW4uZm9ybWF0dGVyID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IFN0cmluZyhjb2x1bW4uZm9ybWF0dGVyKHJvd0RhdGEsIGNvbHVtbi5mb3JtYXR0ZXJQYXJhbXMpKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY29sdW1uLmZvcm1hdHRlciA9PT0gXCJtb2R1bGVcIikge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gU3RyaW5nKHRoaXMuY29udGV4dC5tb2R1bGVzW2NvbHVtbi5mb3JtYXR0ZXJNb2R1bGVOYW1lXS5hcHBseUNzdihyb3dEYXRhLCBjb2x1bW4pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvL2NoZWNrIGZvciBzdHJpbmdzIHRoYXQgbWF5IG5lZWQgdG8gYmUgcXVvdGVkLlxuICAgICAgICBpZiAodmFsdWUuaW5jbHVkZXMoXCIsXCIpKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGBcIiR7dmFsdWV9XCJgO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbn1cblxuQ3N2TW9kdWxlLm1vZHVsZU5hbWUgPSBcImNzdlwiO1xuXG5leHBvcnQgeyBDc3ZNb2R1bGUgfTsiLCIvKipcbiAqIENsYXNzIHRoYXQgZGVmaW5lcyBhIHNpbmdsZSBmaWx0ZXIgY29uZGl0aW9uIGZvciBhIGNvbHVtbi5cbiAqL1xuY2xhc3MgRmlsdGVyVGFyZ2V0IHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGZpbHRlciB0YXJnZXQgb2JqZWN0IHRoYXQgZGVmaW5lcyBhIHNpbmdsZSBmaWx0ZXIgY29uZGl0aW9uLiAgRXhwZWN0cyBhbiBvYmplY3Qgd2l0aCB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gICAgICogKiBgdmFsdWVgOiBUaGUgdmFsdWUgdG8gZmlsdGVyIGFnYWluc3QuICBFeHBlY3RzIHRoYXQgdmFsdWUgbWF0Y2hlcyB0aGUgdHlwZSBvZiB0aGUgZmllbGQgYmVpbmcgZmlsdGVyZWQuICBTaG91bGQgYmUgbnVsbCBpZiBcbiAgICAgKiB2YWx1ZSB0eXBlIGNhbm5vdCBiZSBjb252ZXJ0ZWQgdG8gdGhlIGZpZWxkIHR5cGUuXG4gICAgICogKiBgZmllbGRgOiBUaGUgZmllbGQgbmFtZSBvZiB0aGUgY29sdW1uIGJlaW5nIGZpbHRlcmVkLiAgVGhpcyBpcyB1c2VkIHRvIGlkZW50aWZ5IHRoZSBjb2x1bW4gaW4gdGhlIGRhdGEgc2V0LlxuICAgICAqICogYGZpZWxkVHlwZWA6IFRoZSB0eXBlIG9mIGZpZWxkIGJlaW5nIGZpbHRlcmVkIChlLmcuLCBcInN0cmluZ1wiLCBcIm51bWJlclwiLCBcImRhdGVcIiwgXCJvYmplY3RcIikuICBUaGlzIGlzIHVzZWQgdG8gZGV0ZXJtaW5lIGhvdyB0byBjb21wYXJlIHRoZSB2YWx1ZS5cbiAgICAgKiAqIGBmaWx0ZXJUeXBlYDogVGhlIHR5cGUgb2YgZmlsdGVyIHRvIGFwcGx5IChlLmcuLCBcImVxdWFsc1wiLCBcImxpa2VcIiwgXCI8XCIsIFwiPD1cIiwgXCI+XCIsIFwiPj1cIiwgXCIhPVwiLCBcImJldHdlZW5cIiwgXCJpblwiKS5cbiAgICAgKiBAcGFyYW0ge3sgdmFsdWU6IChzdHJpbmcgfCBudW1iZXIgfCBEYXRlIHwgT2JqZWN0IHwgbnVsbCksIGZpZWxkOiBzdHJpbmcsIGZpZWxkVHlwZTogc3RyaW5nLCBmaWx0ZXJUeXBlOiBzdHJpbmcgfX0gdGFyZ2V0IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHRhcmdldCkge1xuICAgICAgICB0aGlzLnZhbHVlID0gdGFyZ2V0LnZhbHVlO1xuICAgICAgICB0aGlzLmZpZWxkID0gdGFyZ2V0LmZpZWxkO1xuICAgICAgICB0aGlzLmZpZWxkVHlwZSA9IHRhcmdldC5maWVsZFR5cGUgfHwgXCJzdHJpbmdcIjsgLy8gRGVmYXVsdCB0byBzdHJpbmcgaWYgbm90IHByb3ZpZGVkXG4gICAgICAgIHRoaXMuZmlsdGVyVHlwZSA9IHRhcmdldC5maWx0ZXJUeXBlO1xuICAgICAgICB0aGlzLmZpbHRlcnMgPSB0aGlzLiNpbml0KCk7XG4gICAgfVxuXG4gICAgI2luaXQoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvL2VxdWFsIHRvXG4gICAgICAgICAgICBcImVxdWFsc1wiOiBmdW5jdGlvbihmaWx0ZXJWYWwsIHJvd1ZhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWx0ZXJWYWwgPT09IHJvd1ZhbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL2xpa2VcbiAgICAgICAgICAgIFwibGlrZVwiOiBmdW5jdGlvbihmaWx0ZXJWYWwsIHJvd1ZhbCkge1xuICAgICAgICAgICAgICAgIGlmIChyb3dWYWwgPT09IHVuZGVmaW5lZCB8fCByb3dWYWwgPT09IG51bGwgfHwgcm93VmFsID09PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBTdHJpbmcocm93VmFsKS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoZmlsdGVyVmFsLnRvTG93ZXJDYXNlKCkpID4gLTE7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy9sZXNzIHRoYW5cbiAgICAgICAgICAgIFwiPFwiOiBmdW5jdGlvbihmaWx0ZXJWYWwsIHJvd1ZhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWx0ZXJWYWwgPCByb3dWYWw7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy9sZXNzIHRoYW4gb3IgZXF1YWwgdG9cbiAgICAgICAgICAgIFwiPD1cIjogZnVuY3Rpb24oZmlsdGVyVmFsLCByb3dWYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlsdGVyVmFsIDw9IHJvd1ZhbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL2dyZWF0ZXIgdGhhblxuICAgICAgICAgICAgXCI+XCI6IGZ1bmN0aW9uKGZpbHRlclZhbCwgcm93VmFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlclZhbCA+IHJvd1ZhbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL2dyZWF0ZXIgdGhhbiBvciBlcXVhbCB0b1xuICAgICAgICAgICAgXCI+PVwiOiBmdW5jdGlvbihmaWx0ZXJWYWwsIHJvd1ZhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWx0ZXJWYWwgPj0gcm93VmFsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vbm90IGVxdWFsIHRvXG4gICAgICAgICAgICBcIiE9XCI6IGZ1bmN0aW9uKGZpbHRlclZhbCwgcm93VmFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJvd1ZhbCAhPT0gZmlsdGVyVmFsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIGJldHdlZW4uICBleHBlY3RzIGZpbHRlclZhbCB0byBiZSBhbiBhcnJheSBvZjogWyB7c3RhcnQgdmFsdWV9LCB7IGVuZCB2YWx1ZSB9IF0gXG4gICAgICAgICAgICBcImJldHdlZW5cIjogZnVuY3Rpb24oZmlsdGVyVmFsLCByb3dWYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcm93VmFsID49IGZpbHRlclZhbFswXSAmJiByb3dWYWwgPD0gZmlsdGVyVmFsWzFdO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vaW4gYXJyYXkuXG4gICAgICAgICAgICBcImluXCI6IGZ1bmN0aW9uKGZpbHRlclZhbCwgcm93VmFsKSB7XG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZmlsdGVyVmFsKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmlsdGVyVmFsLmxlbmd0aCA/IGZpbHRlclZhbC5pbmRleE9mKHJvd1ZhbCkgPiAtMSA6IHRydWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiRmlsdGVyIEVycm9yIC0gZmlsdGVyIHZhbHVlIGlzIG5vdCBhbiBhcnJheTpcIiwgZmlsdGVyVmFsKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRXhlY3V0ZXMgYW4gaW50ZXJuYWwgZnVuY3Rpb24gdG8gaW5kaWNhdGUgaWYgdGhlIGN1cnJlbnQgcm93IHZhbHVlcyBtYXRjaGVzIHRoZSBmaWx0ZXIgY3JpdGVyaWEncyB2YWx1ZS4gIFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSByb3dWYWwgUm93IGNvbHVtbiB2YWx1ZS4gIEV4cGVjdHMgYSB2YWx1ZSB0aGF0IG1hdGNoZXMgdGhlIHR5cGUgaWRlbnRpZmllZCBieSB0aGUgY29sdW1uLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0PEFycmF5Pn0gcm93IEN1cnJlbnQgZGF0YSBzZXQgcm93LlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIHRydWUgaWYgcm93IHZhbHVlIG1hdGNoZXMgZmlsdGVyIHZhbHVlLiAgT3RoZXJ3aXNlLCBmYWxzZSBpbmRpY2F0aW5nIG5vIG1hdGNoLlxuICAgICAqL1xuICAgIGV4ZWN1dGUocm93VmFsLCByb3cpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyc1t0aGlzLmZpbHRlclR5cGVdKHRoaXMudmFsdWUsIHJvd1ZhbCk7XG4gICAgfVxufVxuXG5leHBvcnQgeyBGaWx0ZXJUYXJnZXQgfTsiLCJpbXBvcnQgeyBEYXRlSGVscGVyIH0gZnJvbSBcIi4uLy4uLy4uL2hlbHBlcnMvZGF0ZUhlbHBlci5qc1wiO1xuLyoqXG4gKiBDbGFzcyB0aGF0IGRlZmluZXMgYSBzaW5nbGUgZmlsdGVyIGNvbmRpdGlvbiBmb3IgYSBkYXRlIGNvbHVtbi5cbiAqL1xuY2xhc3MgRmlsdGVyRGF0ZSB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBmaWx0ZXIgdGFyZ2V0IG9iamVjdCB0aGF0IGRlZmluZXMgYSBzaW5nbGUgZmlsdGVyIGNvbmRpdGlvbiBmb3IgYSBkYXRlIGRhdGEgdHlwZS4gIEV4cGVjdHMgYW4gb2JqZWN0IHdpdGggdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuICAgICAqICogYHZhbHVlYDogVGhlIHZhbHVlIHRvIGZpbHRlciBhZ2FpbnN0LiAgRXhwZWN0cyB0aGF0IHZhbHVlIG1hdGNoZXMgdGhlIHR5cGUgb2YgdGhlIGZpZWxkIGJlaW5nIGZpbHRlcmVkLiAgU2hvdWxkIGJlIG51bGwgaWYgXG4gICAgICogdmFsdWUgdHlwZSBjYW5ub3QgYmUgY29udmVydGVkIHRvIHRoZSBmaWVsZCB0eXBlLlxuICAgICAqICogYGZpZWxkYDogVGhlIGZpZWxkIG5hbWUgb2YgdGhlIGNvbHVtbiBiZWluZyBmaWx0ZXJlZC4gIFRoaXMgaXMgdXNlZCB0byBpZGVudGlmeSB0aGUgY29sdW1uIGluIHRoZSBkYXRhIHNldC5cbiAgICAgKiAqIGBmaWx0ZXJUeXBlYDogVGhlIHR5cGUgb2YgZmlsdGVyIHRvIGFwcGx5IChlLmcuLCBcImVxdWFsc1wiLCBcImxpa2VcIiwgXCI8XCIsIFwiPD1cIiwgXCI+XCIsIFwiPj1cIiwgXCIhPVwiLCBcImJldHdlZW5cIiwgXCJpblwiKS5cbiAgICAgKiBAcGFyYW0ge3sgdmFsdWU6IChEYXRlIHwgQXJyYXk8RGF0ZT4pLCBmaWVsZDogc3RyaW5nLCBmaWx0ZXJUeXBlOiBzdHJpbmcgfX0gdGFyZ2V0IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHRhcmdldCkge1xuICAgICAgICB0aGlzLnZhbHVlID0gdGFyZ2V0LnZhbHVlO1xuICAgICAgICB0aGlzLmZpZWxkID0gdGFyZ2V0LmZpZWxkO1xuICAgICAgICB0aGlzLmZpZWxkVHlwZSA9IFwiZGF0ZVwiO1xuICAgICAgICB0aGlzLmZpbHRlclR5cGUgPSB0YXJnZXQuZmlsdGVyVHlwZTtcbiAgICAgICAgdGhpcy5maWx0ZXJzID0gdGhpcy4jaW5pdCgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgbmV3IGRhdGUgb2JqZWN0IGZvciBlYWNoIGRhdGUgcGFzc2VkIGluLCBzZXR0aW5nIHRoZSB0aW1lIHRvIG1pZG5pZ2h0LiAgVGhpcyBpcyB1c2VkIHRvIGVuc3VyZSB0aGF0IHRoZSBkYXRlIG9iamVjdHMgYXJlIG5vdCBtb2RpZmllZFxuICAgICAqIHdoZW4gY29tcGFyaW5nIGRhdGVzIGluIHRoZSBmaWx0ZXIgZnVuY3Rpb25zLCBhbmQgdG8gZW5zdXJlIHRoYXQgdGhlIHRpbWUgcG9ydGlvbiBvZiB0aGUgZGF0ZSBkb2VzIG5vdCBhZmZlY3QgdGhlIGNvbXBhcmlzb24uXG4gICAgICogQHBhcmFtIHtEYXRlfSBkYXRlMSBcbiAgICAgKiBAcGFyYW0ge0RhdGV9IGRhdGUyIFxuICAgICAqIEByZXR1cm5zIHtBcnJheTxEYXRlPn0gUmV0dXJucyBhbiBhcnJheSBvZiB0d28gZGF0ZSBvYmplY3RzLCBlYWNoIHNldCB0byBtaWRuaWdodCBvZiB0aGUgcmVzcGVjdGl2ZSBkYXRlIHBhc3NlZCBpbi5cbiAgICAgKi9cbiAgICBjbG9uZURhdGVzID0gKGRhdGUxLCBkYXRlMikgPT4geyBcbiAgICAgICAgY29uc3QgZDEgPSBuZXcgRGF0ZShkYXRlMSk7XG4gICAgICAgIGNvbnN0IGQyID0gbmV3IERhdGUoZGF0ZTIpO1xuXG4gICAgICAgIGQxLnNldEhvdXJzKDAsIDAsIDAsIDApO1xuICAgICAgICBkMi5zZXRIb3VycygwLCAwLCAwLCAwKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBbZDEsIGQyXTtcbiAgICB9O1xuXG4gICAgI2luaXQoKSB7IFxuICAgICAgICByZXR1cm4geyBcbiAgICAgICAgICAgIFwiZXF1YWxzXCI6IGZ1bmN0aW9uKGZpbHRlclZhbCwgcm93VmFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlclZhbC5nZXRGdWxsWWVhcigpID09PSByb3dWYWwuZ2V0RnVsbFllYXIoKSAmJiBmaWx0ZXJWYWwuZ2V0TW9udGgoKSA9PT0gcm93VmFsLmdldE1vbnRoKCkgJiYgZmlsdGVyVmFsLmdldERhdGUoKSA9PT0gcm93VmFsLmdldERhdGUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL2xlc3MgdGhhblxuICAgICAgICAgICAgXCI8XCI6IChmaWx0ZXJWYWwsIHJvd1ZhbCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGVzID0gdGhpcy5jbG9uZURhdGVzKGZpbHRlclZhbCwgcm93VmFsKTtcbiBcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0ZXNbMF0uZ2V0VGltZSgpIDwgZGF0ZXNbMV0uZ2V0VGltZSgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vbGVzcyB0aGFuIG9yIGVxdWFsIHRvXG4gICAgICAgICAgICBcIjw9XCI6IChmaWx0ZXJWYWwsIHJvd1ZhbCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGVzID0gdGhpcy5jbG9uZURhdGVzKGZpbHRlclZhbCwgcm93VmFsKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBkYXRlc1swXS5nZXRUaW1lKCkgPCBkYXRlc1sxXS5nZXRUaW1lKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy9ncmVhdGVyIHRoYW5cbiAgICAgICAgICAgIFwiPlwiOiAoZmlsdGVyVmFsLCByb3dWYWwpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkYXRlcyA9IHRoaXMuY2xvbmVEYXRlcyhmaWx0ZXJWYWwsIHJvd1ZhbCk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0ZXNbMF0uZ2V0VGltZSgpID4gZGF0ZXNbMV0uZ2V0VGltZSgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvXG4gICAgICAgICAgICBcIj49XCI6IChmaWx0ZXJWYWwsIHJvd1ZhbCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGVzID0gdGhpcy5jbG9uZURhdGVzKGZpbHRlclZhbCwgcm93VmFsKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBkYXRlc1swXS5nZXRUaW1lKCkgPj0gZGF0ZXNbMV0uZ2V0VGltZSgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vbm90IGVxdWFsIHRvXG4gICAgICAgICAgICBcIiE9XCI6IGZ1bmN0aW9uKGZpbHRlclZhbCwgcm93VmFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlclZhbC5nZXRGdWxsWWVhcigpICE9PSByb3dWYWwuZ2V0RnVsbFllYXIoKSAmJiBmaWx0ZXJWYWwuZ2V0TW9udGgoKSAhPT0gcm93VmFsLmdldE1vbnRoKCkgJiYgZmlsdGVyVmFsLmdldERhdGUoKSAhPT0gcm93VmFsLmdldERhdGUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBiZXR3ZWVuLiAgZXhwZWN0cyBmaWx0ZXJWYWwgdG8gYmUgYW4gYXJyYXkgb2Y6IFsge3N0YXJ0IHZhbHVlfSwgeyBlbmQgdmFsdWUgfSBdIFxuICAgICAgICAgICAgXCJiZXR3ZWVuXCI6IChmaWx0ZXJWYWwsIHJvd1ZhbCkgID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJEYXRlcyA9IHRoaXMuY2xvbmVEYXRlcyhmaWx0ZXJWYWxbMF0sIGZpbHRlclZhbFsxXSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgcm93RGF0ZXMgPSB0aGlzLmNsb25lRGF0ZXMocm93VmFsLCByb3dWYWwpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJvd0RhdGVzWzBdID49IGZpbHRlckRhdGVzWzBdICYmIHJvd0RhdGVzWzBdIDw9IGZpbHRlckRhdGVzWzFdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBFeGVjdXRlcyBhbiBpbnRlcm5hbCBmdW5jdGlvbiB0byBpbmRpY2F0ZSBpZiB0aGUgY3VycmVudCByb3cgdmFsdWUgbWF0Y2hlcyB0aGUgZmlsdGVyIGNyaXRlcmlhJ3MgdmFsdWUuICBcbiAgICAgKiBAcGFyYW0ge0RhdGV9IHJvd1ZhbCBSb3cgY29sdW1uIHZhbHVlLiAgRXhwZWN0cyBhIERhdGUgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0PEFycmF5Pn0gcm93IEN1cnJlbnQgZGF0YSBzZXQgcm93LlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIHRydWUgaWYgcm93IHZhbHVlIG1hdGNoZXMgZmlsdGVyIHZhbHVlLiAgT3RoZXJ3aXNlLCBmYWxzZSBpbmRpY2F0aW5nIG5vIG1hdGNoLlxuICAgICAqL1xuICAgIGV4ZWN1dGUocm93VmFsLCByb3cpIHtcbiAgICAgICAgaWYgKHJvd1ZhbCA9PT0gbnVsbCB8fCAhRGF0ZUhlbHBlci5pc0RhdGUocm93VmFsKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlOyAvLyBJZiByb3dWYWwgaXMgbnVsbCBvciBub3QgYSBkYXRlLCByZXR1cm4gZmFsc2UuXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXJzW3RoaXMuZmlsdGVyVHlwZV0odGhpcy52YWx1ZSwgcm93VmFsKTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEZpbHRlckRhdGUgfTsiLCIvKipcbiAqIFJlcHJlc2VudHMgYSBjb25jcmV0ZSBpbXBsZW1lbnRhdGlvbiBvZiBhIGZpbHRlciB0aGF0IHVzZXMgYSB1c2VyIHN1cHBsaWVkIGZ1bmN0aW9uLlxuICovXG5jbGFzcyBGaWx0ZXJGdW5jdGlvbiB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGZpbHRlciBmdW5jdGlvbiBpbnN0YW5jZS4gIEV4cGVjdHMgYW4gb2JqZWN0IHdpdGggdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuICAgICAqICogYHZhbHVlYDogVGhlIHZhbHVlIHRvIGZpbHRlciBhZ2FpbnN0LiAgRG9lcyBub3QgbmVlZCB0byBtYXRjaCB0aGUgdHlwZSBvZiB0aGUgZmllbGQgYmVpbmcgZmlsdGVyZWQuXG4gICAgICogKiBgZmllbGRgOiBUaGUgZmllbGQgbmFtZSBvZiB0aGUgY29sdW1uIGJlaW5nIGZpbHRlcmVkLiAgVGhpcyBpcyB1c2VkIHRvIGlkZW50aWZ5IHRoZSBjb2x1bW4gaW4gdGhlIGRhdGEgc2V0LlxuICAgICAqICogYGZpbHRlclR5cGVgOiBUaGUgZnVuY3Rpb24gdG8gdXNlIGZvciBmaWx0ZXJpbmcuXG4gICAgICogKiBgcGFyYW1zYDogT3B0aW9uYWwgcGFyYW1ldGVycyB0byBwYXNzIHRvIHRoZSBmaWx0ZXIgZnVuY3Rpb24uXG4gICAgICogQHBhcmFtIHt7IHZhbHVlOiBPYmplY3QsIGZpZWxkOiBzdHJpbmcsIGZpbHRlclR5cGU6IEZ1bmN0aW9uLCBwYXJhbXM6IE9iamVjdCB9fSB0YXJnZXQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IodGFyZ2V0KSB7XG4gICAgICAgIHRoaXMudmFsdWUgPSB0YXJnZXQudmFsdWU7XG4gICAgICAgIHRoaXMuZmllbGQgPSB0YXJnZXQuZmllbGQ7XG4gICAgICAgIHRoaXMuZmlsdGVyRnVuY3Rpb24gPSB0YXJnZXQuZmlsdGVyVHlwZTtcbiAgICAgICAgdGhpcy5wYXJhbXMgPSB0YXJnZXQucGFyYW1zID8/IHt9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBFeGVjdXRlcyBhbiB1c2VyIHN1cHBsaWVkIGZ1bmN0aW9uIHRvIGluZGljYXRlIGlmIHRoZSBjdXJyZW50IHJvdyB2YWx1ZXMgbWF0Y2hlcyB0aGUgZmlsdGVyIGNyaXRlcmlhJ3MgdmFsdWUuICBcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcm93VmFsIFJvdyBjb2x1bW4gdmFsdWUuICBFeHBlY3RzIGEgdmFsdWUgdGhhdCBtYXRjaGVzIHRoZSB0eXBlIGlkZW50aWZpZWQgYnkgdGhlIGNvbHVtbi5cbiAgICAgKiBAcGFyYW0ge09iamVjdDxBcnJheT59IHJvdyBDdXJyZW50IGRhdGEgc2V0IHJvdy5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyB0cnVlIGlmIHJvdyB2YWx1ZSBtYXRjaGVzIGZpbHRlciB2YWx1ZS4gIE90aGVyd2lzZSwgZmFsc2UgaW5kaWNhdGluZyBubyBtYXRjaC5cbiAgICAgKi9cbiAgICBleGVjdXRlKHJvd1ZhbCwgcm93KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbHRlckZ1bmN0aW9uKHRoaXMudmFsdWUsIHJvd1ZhbCwgcm93LCB0aGlzLnBhcmFtcyk7XG4gICAgfVxufVxuXG5leHBvcnQgeyBGaWx0ZXJGdW5jdGlvbiB9OyIsImNsYXNzIEVsZW1lbnRIZWxwZXIge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gSFRNTCBlbGVtZW50IHdpdGggdGhlIHNwZWNpZmllZCB0YWcgYW5kIHByb3BlcnRpZXMuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgdGFnIG5hbWUgb2YgdGhlIGVsZW1lbnQgdG8gY3JlYXRlLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcGVydGllcz17fV0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgcHJvcGVydGllcyB0byBhc3NpZ24gdG8gdGhlIGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtkYXRhc2V0PXt9XSBBbiBvYmplY3QgY29udGFpbmluZyBkYXRhc2V0IGF0dHJpYnV0ZXMgdG8gYXNzaWduIHRvIHRoZSBlbGVtZW50LlxuICAgICAqIEByZXR1cm5zIHtIVE1MRWxlbWVudH0gVGhlIGNyZWF0ZWQgSFRNTCBlbGVtZW50LlxuICAgICAqL1xuICAgIHN0YXRpYyBjcmVhdGUodGFnLCBwcm9wZXJ0aWVzID0ge30sIGRhdGFzZXQgPSB7fSkge1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gT2JqZWN0LmFzc2lnbihkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZyksIHByb3BlcnRpZXMpO1xuXG4gICAgICAgIGlmIChkYXRhc2V0KSB7IFxuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihlbGVtZW50LmRhdGFzZXQsIGRhdGFzZXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBgZGl2YCBlbGVtZW50IHdpdGggdGhlIHNwZWNpZmllZCBwcm9wZXJ0aWVzIGFuZCBkYXRhc2V0LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcGVydGllcz17fV0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgcHJvcGVydGllcyB0byBhc3NpZ24gdG8gdGhlIGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtkYXRhc2V0PXt9XSBBbiBvYmplY3QgY29udGFpbmluZyBkYXRhc2V0IGF0dHJpYnV0ZXMgdG8gYXNzaWduIHRvIHRoZSBlbGVtZW50LlxuICAgICAqIEByZXR1cm5zIHtIVE1MRGl2RWxlbWVudH0gVGhlIGNyZWF0ZWQgSFRNTCBlbGVtZW50LlxuICAgICAqL1xuICAgIHN0YXRpYyBkaXYocHJvcGVydGllcyA9IHt9LCBkYXRhc2V0ID0ge30pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlKFwiZGl2XCIsIHByb3BlcnRpZXMsIGRhdGFzZXQpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgYGlucHV0YCBlbGVtZW50IHdpdGggdGhlIHNwZWNpZmllZCBwcm9wZXJ0aWVzIGFuZCBkYXRhc2V0LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcGVydGllcz17fV0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgcHJvcGVydGllcyB0byBhc3NpZ24gdG8gdGhlIGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtkYXRhc2V0PXt9XSBBbiBvYmplY3QgY29udGFpbmluZyBkYXRhc2V0IGF0dHJpYnV0ZXMgdG8gYXNzaWduIHRvIHRoZSBlbGVtZW50LlxuICAgICAqIEByZXR1cm5zIHtIVE1MSW5wdXRFbGVtZW50fSBUaGUgY3JlYXRlZCBIVE1MIGVsZW1lbnQuXG4gICAgICovXG4gICAgc3RhdGljIGlucHV0KHByb3BlcnRpZXMgPSB7fSwgZGF0YXNldCA9IHt9KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZShcImlucHV0XCIsIHByb3BlcnRpZXMsIGRhdGFzZXQpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgYHNwYW5gIGVsZW1lbnQgd2l0aCB0aGUgc3BlY2lmaWVkIHByb3BlcnRpZXMgYW5kIGRhdGFzZXQuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtwcm9wZXJ0aWVzPXt9XSBBbiBvYmplY3QgY29udGFpbmluZyBwcm9wZXJ0aWVzIHRvIGFzc2lnbiB0byB0aGUgZWxlbWVudC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW2RhdGFzZXQ9e31dIEFuIG9iamVjdCBjb250YWluaW5nIGRhdGFzZXQgYXR0cmlidXRlcyB0byBhc3NpZ24gdG8gdGhlIGVsZW1lbnQuXG4gICAgICogQHJldHVybnMge0hUTUxTcGFuRWxlbWVudH0gVGhlIGNyZWF0ZWQgSFRNTCBlbGVtZW50LlxuICAgICAqL1xuICAgIHN0YXRpYyBzcGFuKHByb3BlcnRpZXMgPSB7fSwgZGF0YXNldCA9IHt9KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZShcInNwYW5cIiwgcHJvcGVydGllcywgZGF0YXNldCk7XG4gICAgfVxufVxuXG5leHBvcnQgeyBFbGVtZW50SGVscGVyIH07IiwiaW1wb3J0IHsgQ3NzSGVscGVyIH0gZnJvbSBcIi4uLy4uLy4uL2hlbHBlcnMvY3NzSGVscGVyLmpzXCI7XG5pbXBvcnQgeyBFbGVtZW50SGVscGVyIH0gZnJvbSBcIi4uLy4uLy4uL2hlbHBlcnMvZWxlbWVudEhlbHBlci5qc1wiO1xuLyoqXG4gKiBDcmVhdGUgZmlsdGVyIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgYSBlbGVtZW50IHRvIGZpbHRlciBiZXR3ZWVuIHR3byB2YWx1ZXMuICBDcmVhdGVzIGEgZHJvcGRvd24gd2l0aCBhIHR3byBpbnB1dCBib3hlcyBcbiAqIHRvIGVudGVyIHN0YXJ0IGFuZCBlbmQgdmFsdWVzLlxuICovXG5jbGFzcyBFbGVtZW50QmV0d2VlbiB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGZpbHRlciBvYmplY3QgdGhhdCByZXByZXNlbnRzIGEgYmV0d2VlbiBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7Q29sdW1ufSBjb2x1bW4gQ29sdW1uIGNsYXNzIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge0dyaWRDb250ZXh0fSBjb250ZXh0IEdyaWQgY29udGV4dCBvYmplY3QuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29sdW1uLCBjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IEVsZW1lbnRIZWxwZXIuZGl2KHsgbmFtZTogY29sdW1uLmZpZWxkLCBjbGFzc05hbWU6IENzc0hlbHBlci5tdWx0aVNlbGVjdC5wYXJlbnRDbGFzcyB9KTtcbiAgICAgICAgdGhpcy5oZWFkZXIgPSBFbGVtZW50SGVscGVyLmRpdih7IGNsYXNzTmFtZTogQ3NzSGVscGVyLm11bHRpU2VsZWN0LmhlYWRlciB9KTtcbiAgICAgICAgdGhpcy5vcHRpb25zQ29udGFpbmVyID0gRWxlbWVudEhlbHBlci5kaXYoeyBjbGFzc05hbWU6IENzc0hlbHBlci5tdWx0aVNlbGVjdC5vcHRpb25zIH0pO1xuICAgICAgICB0aGlzLmZpZWxkID0gY29sdW1uLmZpZWxkO1xuICAgICAgICB0aGlzLmZpZWxkVHlwZSA9IGNvbHVtbi50eXBlOyAgLy9maWVsZCB2YWx1ZSB0eXBlLlxuICAgICAgICB0aGlzLmZpbHRlclR5cGUgPSBcImJldHdlZW5cIjsgIC8vY29uZGl0aW9uIHR5cGUuXG5cbiAgICAgICAgdGhpcy5lbGVtZW50LmlkID0gYCR7dGhpcy5jb250ZXh0LnNldHRpbmdzLmJhc2VJZE5hbWV9XyR7dGhpcy5maWVsZH1gO1xuICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kKHRoaXMuaGVhZGVyLCB0aGlzLm9wdGlvbnNDb250YWluZXIpO1xuICAgICAgICB0aGlzLmhlYWRlci5pZCA9IGBoZWFkZXJfJHt0aGlzLmNvbnRleHQuc2V0dGluZ3MuYmFzZUlkTmFtZX1fJHt0aGlzLmZpZWxkfWA7XG4gICAgICAgIHRoaXMub3B0aW9uc0NvbnRhaW5lci5zdHlsZS5taW5XaWR0aCA9IFwiMTg1cHhcIjtcblxuICAgICAgICB0aGlzLiN0ZW1wbGF0ZUJldHdlZW4oKTtcbiAgICAgICAgdGhpcy5oZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlQ2xpY2spO1xuICAgIH1cblxuICAgICN0ZW1wbGF0ZUJldHdlZW4oKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudFN0YXJ0ID0gRWxlbWVudEhlbHBlci5pbnB1dCh7IGNsYXNzTmFtZTogQ3NzSGVscGVyLmlucHV0LCBpZDogYHN0YXJ0XyR7dGhpcy5jb250ZXh0LnNldHRpbmdzLmJhc2VJZE5hbWV9XyR7dGhpcy5maWVsZH1gIH0pO1xuXG4gICAgICAgIHRoaXMuZWxlbWVudEVuZCA9IEVsZW1lbnRIZWxwZXIuaW5wdXQoeyBjbGFzc05hbWU6IENzc0hlbHBlci5pbnB1dCwgaWQ6IGBlbmRfJHt0aGlzLmNvbnRleHQuc2V0dGluZ3MuYmFzZUlkTmFtZX1fJHt0aGlzLmZpZWxkfWAgfSk7XG4gICAgICAgIHRoaXMuZWxlbWVudEVuZC5zdHlsZS5tYXJnaW5Cb3R0b20gPSBcIjEwcHhcIjtcblxuICAgICAgICBjb25zdCBzdGFydCA9IEVsZW1lbnRIZWxwZXIuc3Bhbih7IGlubmVyVGV4dDogXCJTdGFydFwiLCBjbGFzc05hbWU6IENzc0hlbHBlci5iZXR3ZWVuLmxhYmVsIH0pO1xuICAgICAgICBjb25zdCBlbmQgPSAgRWxlbWVudEhlbHBlci5zcGFuKHsgaW5uZXJUZXh0OiBcIkVuZFwiLCBjbGFzc05hbWU6IENzc0hlbHBlci5iZXR3ZWVuLmxhYmVsIH0pO1xuIFxuICAgICAgICBjb25zdCBidG5BcHBseSA9IEVsZW1lbnRIZWxwZXIuY3JlYXRlKFwiYnV0dG9uXCIsIHsgaW5uZXJUZXh0OiBcIkFwcGx5XCIsIGNsYXNzTmFtZTogQ3NzSGVscGVyLmJldHdlZW4uYnV0dG9uIH0pO1xuICAgICAgICBidG5BcHBseS5zdHlsZS5tYXJnaW5SaWdodCA9IFwiMTBweFwiO1xuICAgICAgICBidG5BcHBseS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5oYW5kbGVDbGljayk7XG5cbiAgICAgICAgY29uc3QgYnRuQ2xlYXIgPSBFbGVtZW50SGVscGVyLmNyZWF0ZShcImJ1dHRvblwiLCB7IGlubmVyVGV4dDogXCJDbGVhclwiLCBjbGFzc05hbWU6IENzc0hlbHBlci5iZXR3ZWVuLmJ1dHRvbiB9KTtcbiAgICAgICAgYnRuQ2xlYXIuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlQnV0dG9uQ2xlYXIpO1xuXG4gICAgICAgIHRoaXMub3B0aW9uc0NvbnRhaW5lci5hcHBlbmQoc3RhcnQsIHRoaXMuZWxlbWVudFN0YXJ0LCBlbmQsIHRoaXMuZWxlbWVudEVuZCwgYnRuQXBwbHksIGJ0bkNsZWFyKTtcbiAgICB9XG5cbiAgICBoYW5kbGVCdXR0b25DbGVhciA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5lbGVtZW50U3RhcnQudmFsdWUgPSBcIlwiO1xuICAgICAgICB0aGlzLmVsZW1lbnRFbmQudmFsdWUgPSBcIlwiO1xuXG4gICAgICAgIGlmICh0aGlzLmNvdW50TGFiZWwgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5jb3VudExhYmVsLnJlbW92ZSgpO1xuICAgICAgICAgICAgdGhpcy5jb3VudExhYmVsID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGNyZWF0ZUNvdW50TGFiZWwgPSAoKSA9PiB7XG4gICAgICAgIC8vdXBkYXRlIGNvdW50IGxhYmVsLlxuICAgICAgICBpZiAodGhpcy5jb3VudExhYmVsID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuY291bnRMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICAgICAgdGhpcy5jb3VudExhYmVsLmNsYXNzTmFtZSA9IENzc0hlbHBlci5tdWx0aVNlbGVjdC5oZWFkZXJPcHRpb247XG4gICAgICAgICAgICB0aGlzLmhlYWRlci5hcHBlbmQodGhpcy5jb3VudExhYmVsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmVsZW1lbnRTdGFydC52YWx1ZSAhPT0gXCJcIiAmJiB0aGlzLmVsZW1lbnRFbmQudmFsdWUgIT09IFwiXCIpIHtcbiAgICAgICAgICAgIHRoaXMuY291bnRMYWJlbC5pbm5lclRleHQgPSBgJHt0aGlzLmVsZW1lbnRTdGFydC52YWx1ZX0gdG8gJHt0aGlzLmVsZW1lbnRFbmQudmFsdWV9YDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY291bnRMYWJlbC5yZW1vdmUoKTtcbiAgICAgICAgICAgIHRoaXMuY291bnRMYWJlbCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBoYW5kbGVDbGljayA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3Qgc3RhdHVzID0gdGhpcy5oZWFkZXIuY2xhc3NMaXN0LnRvZ2dsZShDc3NIZWxwZXIubXVsdGlTZWxlY3QuaGVhZGVyQWN0aXZlKTtcblxuICAgICAgICBpZiAoIXN0YXR1cykge1xuICAgICAgICAgICAgLy9DbG9zZSB3aW5kb3cgYW5kIGFwcGx5IGZpbHRlciB2YWx1ZS5cbiAgICAgICAgICAgIHRoaXMuY3JlYXRlQ291bnRMYWJlbCgpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpO1xuICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlRG9jdW1lbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlRG9jdW1lbnQpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBIYW5kbGVyIGV2ZW50IHRvIGNsb3NlIGRyb3Bkb3duIHdoZW4gdXNlciBjbGlja3Mgb3V0c2lkZSB0aGUgbXVsdGktc2VsZWN0IGNvbnRyb2wuICBFdmVudCBpcyByZW1vdmVkIHdoZW4gbXVsdGktc2VsZWN0IGlzIFxuICAgICAqIG5vdCBhY3RpdmUgc28gdGhhdCBpdCdzIG5vdCBmaXJpbmcgb24gcmVkdW5kYW50IGV2ZW50cy5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZSBPYmplY3QgdGhhdCB0cmlnZ2VyZWQgZXZlbnQuXG4gICAgICovXG4gICAgaGFuZGxlRG9jdW1lbnQgPSBhc3luYyAoZSkgPT4ge1xuICAgICAgICBpZiAoIWUudGFyZ2V0LmNsb3Nlc3QoYC4ke0Nzc0hlbHBlci5pbnB1dH1gKSAmJiAhZS50YXJnZXQuY2xvc2VzdChgIyR7dGhpcy5oZWFkZXIuaWR9YCkpIHtcbiAgICAgICAgICAgIHRoaXMuaGVhZGVyLmNsYXNzTGlzdC5yZW1vdmUoQ3NzSGVscGVyLm11bHRpU2VsZWN0LmhlYWRlckFjdGl2ZSk7XG5cbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKTtcblxuICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlRG9jdW1lbnQpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIHRoZSBzdGFydCBhbmQgZW5kIHZhbHVlcyBmcm9tIGlucHV0IHNvdXJjZS4gIElmIGVpdGhlciBpbnB1dCBzb3VyY2UgaXMgZW1wdHksIGFuIGVtcHR5IHN0cmluZyB3aWxsIGJlIHJldHVybmVkLlxuICAgICAqIEByZXR1cm5zIHtBcnJheSB8IHN0cmluZ30gQXJyYXkgb2Ygc3RhcnQgYW5kIGVuZCB2YWx1ZXMgb3IgZW1wdHkgc3RyaW5nLlxuICAgICAqL1xuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuZWxlbWVudFN0YXJ0LnZhbHVlID09PSBcIlwiIHx8IHRoaXMuZWxlbWVudEVuZC52YWx1ZSA9PT0gXCJcIikgcmV0dXJuIFwiXCI7XG5cbiAgICAgICAgcmV0dXJuIFt0aGlzLmVsZW1lbnRTdGFydC52YWx1ZSwgdGhpcy5lbGVtZW50RW5kLnZhbHVlXTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEVsZW1lbnRCZXR3ZWVuIH07IiwiLyoqXG4gKiBSZXByZXNlbnRzIGEgY29sdW1ucyBmaWx0ZXIgY29udHJvbC4gIENyZWF0ZXMgYSBgSFRNTElucHV0RWxlbWVudGAgdGhhdCBpcyBhZGRlZCB0byB0aGUgaGVhZGVyIHJvdyBvZiBcbiAqIHRoZSBncmlkIHRvIGZpbHRlciBkYXRhIHNwZWNpZmljIHRvIGl0cyBkZWZpbmVkIGNvbHVtbi4gXG4gKi9cbmNsYXNzIEVsZW1lbnRJbnB1dCB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGZpbHRlciBvYmplY3QgdGhhdCByZXByZXNlbnRzIGEgYEhUTUxTZWxlY3RFbGVtZW50YCBlbGVtZW50IGluIHRoZSB0YWJsZSdzIGhlYWRlciByb3cuXG4gICAgICogQHBhcmFtIHtDb2x1bW59IGNvbHVtbiBDb2x1bW4gY2xhc3Mgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgR3JpZCBjb250ZXh0LlxuICAgICovXG4gICAgY29uc3RydWN0b3IoY29sdW1uLCBjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKTtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy5maWVsZCA9IGNvbHVtbi5maWVsZDtcbiAgICAgICAgdGhpcy5maWVsZFR5cGUgPSBjb2x1bW4udHlwZTsgIC8vZmllbGQgdmFsdWUgdHlwZS5cbiAgICAgICAgdGhpcy5maWx0ZXJUeXBlID0gY29sdW1uLmZpbHRlclR5cGU7ICAvL2NvbmRpdGlvbiB0eXBlLlxuICAgICAgICB0aGlzLmZpbHRlcklzRnVuY3Rpb24gPSAodHlwZW9mIGNvbHVtbj8uZmlsdGVyVHlwZSA9PT0gXCJmdW5jdGlvblwiKTtcbiAgICAgICAgdGhpcy5maWx0ZXJQYXJhbXMgPSBjb2x1bW4uZmlsdGVyUGFyYW1zO1xuICAgICAgICB0aGlzLmVsZW1lbnQubmFtZSA9IHRoaXMuZmllbGQ7XG4gICAgICAgIHRoaXMuZWxlbWVudC5pZCA9IHRoaXMuZmllbGQ7XG4gICAgICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIGFzeW5jICgpID0+IGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKSk7XG5cbiAgICAgICAgaWYgKGNvbHVtbi5maWx0ZXJDc3MpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5jbGFzc05hbWUgPSBjb2x1bW4uZmlsdGVyQ3NzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVtb3RlUHJvY2Vzc2luZyAmJiBjb2x1bW4uZmlsdGVyUmVhbFRpbWUpIHtcbiAgICAgICAgICAgIHRoaXMucmVhbFRpbWVUaW1lb3V0ID0gKHR5cGVvZiB0aGlzLmZpbHRlclJlYWxUaW1lID09PSBcIm51bWJlclwiKSBcbiAgICAgICAgICAgICAgICA/IHRoaXMuZmlsdGVyUmVhbFRpbWUgXG4gICAgICAgICAgICAgICAgOiA1MDA7XG5cbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgdGhpcy5oYW5kbGVMaXZlRmlsdGVyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGhhbmRsZUxpdmVGaWx0ZXIgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIHNldFRpbWVvdXQoYXN5bmMgKCkgPT4gYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpLCB0aGlzLnJlYWxUaW1lVGltZW91dCk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSB2YWx1ZSBvZiB0aGUgaW5wdXQgZWxlbWVudC4gIFdpbGwgcmV0dXJuIGEgc3RyaW5nIHZhbHVlLlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LnZhbHVlO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRWxlbWVudElucHV0IH07IiwiaW1wb3J0IHsgQ3NzSGVscGVyIH0gZnJvbSBcIi4uLy4uLy4uL2hlbHBlcnMvY3NzSGVscGVyLmpzXCI7XG5pbXBvcnQgeyBFbGVtZW50SGVscGVyIH0gZnJvbSBcIi4uLy4uLy4uL2hlbHBlcnMvZWxlbWVudEhlbHBlci5qc1wiO1xuLyoqXG4gKiBDcmVhdGUgZmlsdGVyIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgYSBtdWx0aS1zZWxlY3QgZWxlbWVudC4gIENyZWF0ZXMgYSBkcm9wZG93biB3aXRoIGEgbGlzdCBvZiBvcHRpb25zIHRoYXQgY2FuIGJlIFxuICogc2VsZWN0ZWQgb3IgZGVzZWxlY3RlZC4gIElmIGBmaWx0ZXJWYWx1ZXNSZW1vdGVTb3VyY2VgIGlzIGRlZmluZWQsIHRoZSBzZWxlY3Qgb3B0aW9ucyB3aWxsIGJlIHBvcHVsYXRlZCBieSB0aGUgZGF0YSByZXR1cm5lZCBcbiAqIGZyb20gdGhlIHJlbW90ZSBzb3VyY2UgYnkgcmVnaXN0ZXJpbmcgdG8gIHRoZSBncmlkIHBpcGVsaW5lJ3MgYGluaXRgIGFuZCBgcmVmcmVzaGAgZXZlbnRzLlxuICovXG5jbGFzcyBFbGVtZW50TXVsdGlTZWxlY3Qge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBmaWx0ZXIgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyBhIG11bHRpLXNlbGVjdCBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7Q29sdW1ufSBjb2x1bW4gQ29sdW1uIGNsYXNzIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge0dyaWRDb250ZXh0fSBjb250ZXh0IEdyaWQgY29udGV4dCBvYmplY3QuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29sdW1uLCBjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IEVsZW1lbnRIZWxwZXIuZGl2KHsgbmFtZTogY29sdW1uLmZpZWxkLCBjbGFzc05hbWU6IENzc0hlbHBlci5tdWx0aVNlbGVjdC5wYXJlbnRDbGFzcyB9KTtcbiAgICAgICAgdGhpcy5oZWFkZXIgPSBFbGVtZW50SGVscGVyLmRpdih7IGNsYXNzTmFtZTogQ3NzSGVscGVyLm11bHRpU2VsZWN0LmhlYWRlciB9KTtcbiAgICAgICAgdGhpcy5vcHRpb25zQ29udGFpbmVyID0gRWxlbWVudEhlbHBlci5kaXYoeyBjbGFzc05hbWU6IENzc0hlbHBlci5tdWx0aVNlbGVjdC5vcHRpb25zIH0pO1xuICAgICAgICB0aGlzLmZpZWxkID0gY29sdW1uLmZpZWxkO1xuICAgICAgICB0aGlzLmZpZWxkVHlwZSA9IGNvbHVtbi50eXBlOyAgLy9maWVsZCB2YWx1ZSB0eXBlLlxuICAgICAgICB0aGlzLmZpbHRlclR5cGUgPSBcImluXCI7ICAvL2NvbmRpdGlvbiB0eXBlLlxuICAgICAgICB0aGlzLmZpbHRlcklzRnVuY3Rpb24gPSAodHlwZW9mIGNvbHVtbj8uZmlsdGVyVHlwZSA9PT0gXCJmdW5jdGlvblwiKTtcbiAgICAgICAgdGhpcy5maWx0ZXJQYXJhbXMgPSBjb2x1bW4uZmlsdGVyUGFyYW1zO1xuICAgICAgICB0aGlzLmxpc3RBbGwgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5zZWxlY3RlZFZhbHVlcyA9IFtdO1xuXG4gICAgICAgIGlmICh0eXBlb2YgY29sdW1uLmZpbHRlck11bHRpU2VsZWN0ID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICB0aGlzLmxpc3RBbGwgPSBjb2x1bW4uZmlsdGVyTXVsdGlTZWxlY3QubGlzdEFsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaGVhZGVyLmlkID0gYGhlYWRlcl8ke3RoaXMuY29udGV4dC5zZXR0aW5ncy5iYXNlSWROYW1lfV8ke3RoaXMuZmllbGR9YDtcbiAgICAgICAgdGhpcy5lbGVtZW50LmlkID0gYCR7dGhpcy5jb250ZXh0LnNldHRpbmdzLmJhc2VJZE5hbWV9XyR7dGhpcy5maWVsZH1gO1xuICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kKHRoaXMuaGVhZGVyLCB0aGlzLm9wdGlvbnNDb250YWluZXIpO1xuXG4gICAgICAgIGlmIChjb2x1bW4uZmlsdGVyVmFsdWVzUmVtb3RlU291cmNlKSB7XG4gICAgICAgICAgICAvL3NldCB1cCBwaXBlbGluZSB0byByZXRyaWV2ZSBvcHRpb24gZGF0YSB3aGVuIGluaXQgcGlwZWxpbmUgaXMgY2FsbGVkLlxuICAgICAgICAgICAgdGhpcy5jb250ZXh0LnBpcGVsaW5lLmFkZFN0ZXAoXCJpbml0XCIsIHRoaXMudGVtcGxhdGVDb250YWluZXIsIGNvbHVtbi5maWx0ZXJWYWx1ZXNSZW1vdGVTb3VyY2UpO1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LnBpcGVsaW5lLmFkZFN0ZXAoXCJyZWZyZXNoXCIsIHRoaXMucmVmcmVzaFNlbGVjdE9wdGlvbnMsIGNvbHVtbi5maWx0ZXJWYWx1ZXNSZW1vdGVTb3VyY2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy91c2UgdXNlciBzdXBwbGllZCB2YWx1ZXMgdG8gY3JlYXRlIHNlbGVjdCBvcHRpb25zLlxuICAgICAgICAgICAgY29uc3QgZGF0YSA9IEFycmF5LmlzQXJyYXkoY29sdW1uLmZpbHRlclZhbHVlcykgXG4gICAgICAgICAgICAgICAgPyBjb2x1bW4uZmlsdGVyVmFsdWVzXG4gICAgICAgICAgICAgICAgOiBPYmplY3QuZW50cmllcyhjb2x1bW4uZmlsdGVyVmFsdWVzKS5tYXAoKFtrZXksIHZhbHVlXSkgPT4gKHsgdmFsdWU6IGtleSwgdGV4dDogdmFsdWV9KSk7XG5cbiAgICAgICAgICAgIHRoaXMudGVtcGxhdGVDb250YWluZXIoZGF0YSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmhlYWRlci5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5oYW5kbGVDbGljayk7XG4gICAgfVxuXG4gICAgaGFuZGxlQ2xpY2sgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHN0YXR1cyA9IHRoaXMuaGVhZGVyLmNsYXNzTGlzdC50b2dnbGUoQ3NzSGVscGVyLm11bHRpU2VsZWN0LmhlYWRlckFjdGl2ZSk7XG5cbiAgICAgICAgaWYgKCFzdGF0dXMpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKTtcbiAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZURvY3VtZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZURvY3VtZW50KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogSGFuZGxlciBldmVudCB0byBjbG9zZSBkcm9wZG93biB3aGVuIHVzZXIgY2xpY2tzIG91dHNpZGUgdGhlIG11bHRpLXNlbGVjdCBjb250cm9sLiAgRXZlbnQgaXMgcmVtb3ZlZCB3aGVuIG11bHRpLXNlbGVjdCBcbiAgICAgKiBpcyBub3QgYWN0aXZlIHNvIHRoYXQgaXQncyBub3QgZmlyaW5nIG9uIHJlZHVuZGFudCBldmVudHMuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGUgT2JqZWN0IHRoYXQgdHJpZ2dlcmVkIGV2ZW50LlxuICAgICAqL1xuICAgIGhhbmRsZURvY3VtZW50ID0gYXN5bmMgKGUpID0+IHtcbiAgICAgICAgaWYgKCFlLnRhcmdldC5jbG9zZXN0KFwiLlwiICsgQ3NzSGVscGVyLm11bHRpU2VsZWN0Lm9wdGlvbikgJiYgIWUudGFyZ2V0LmNsb3Nlc3QoYCMke3RoaXMuaGVhZGVyLmlkfWApKSB7XG4gICAgICAgICAgICB0aGlzLmhlYWRlci5jbGFzc0xpc3QucmVtb3ZlKENzc0hlbHBlci5tdWx0aVNlbGVjdC5oZWFkZXJBY3RpdmUpO1xuXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIik7XG5cbiAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZURvY3VtZW50KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGNvdW50IGxhYmVsIHRoYXQgZGlzcGxheXMgdGhlIG51bWJlciBvZiBzZWxlY3RlZCBpdGVtcyBpbiB0aGUgbXVsdGktc2VsZWN0IGNvbnRyb2wuXG4gICAgICovXG4gICAgY3JlYXRlQ291bnRMYWJlbCA9ICgpID0+IHtcbiAgICAgICAgLy91cGRhdGUgY291bnQgbGFiZWwuXG4gICAgICAgIGlmICh0aGlzLmNvdW50TGFiZWwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5jb3VudExhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwuY2xhc3NOYW1lID0gQ3NzSGVscGVyLm11bHRpU2VsZWN0LmhlYWRlck9wdGlvbjtcbiAgICAgICAgICAgIHRoaXMuaGVhZGVyLmFwcGVuZCh0aGlzLmNvdW50TGFiZWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWRWYWx1ZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhpcy5jb3VudExhYmVsLmlubmVyVGV4dCA9IGAke3RoaXMuc2VsZWN0ZWRWYWx1ZXMubGVuZ3RofSBzZWxlY3RlZGA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwucmVtb3ZlKCk7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIEhhbmRsZSBjbGljayBldmVudCBmb3IgZWFjaCBvcHRpb24gaW4gdGhlIG11bHRpLXNlbGVjdCBjb250cm9sLiAgVG9nZ2xlcyB0aGUgc2VsZWN0ZWQgc3RhdGUgb2YgdGhlIG9wdGlvbiBhbmQgdXBkYXRlcyB0aGUgXG4gICAgICogaGVhZGVyIGlmIGBsaXN0QWxsYCBpcyBgdHJ1ZWAuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG8gT2JqZWN0IHRoYXQgdHJpZ2dlcmVkIHRoZSBldmVudC5cbiAgICAgKi9cbiAgICBoYW5kbGVPcHRpb24gPSAobykgPT4ge1xuICAgICAgICBpZiAoIW8uY3VycmVudFRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoQ3NzSGVscGVyLm11bHRpU2VsZWN0LnNlbGVjdGVkKSkge1xuICAgICAgICAgICAgLy9zZWxlY3QgaXRlbS5cbiAgICAgICAgICAgIG8uY3VycmVudFRhcmdldC5jbGFzc0xpc3QuYWRkKENzc0hlbHBlci5tdWx0aVNlbGVjdC5zZWxlY3RlZCk7XG4gICAgICAgICAgICBvLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5zZWxlY3RlZCA9IFwidHJ1ZVwiO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkVmFsdWVzLnB1c2goby5jdXJyZW50VGFyZ2V0LmRhdGFzZXQudmFsdWUpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5saXN0QWxsKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3BhbiA9IEVsZW1lbnRIZWxwZXIuc3Bhbih7IGNsYXNzTmFtZTogQ3NzSGVscGVyLm11bHRpU2VsZWN0LmhlYWRlck9wdGlvbiwgaW5uZXJUZXh0OiBvLmN1cnJlbnRUYXJnZXQuZGF0YXNldC52YWx1ZSB9LCB7IHZhbHVlOiBvLmN1cnJlbnRUYXJnZXQuZGF0YXNldC52YWx1ZSB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmhlYWRlci5hcHBlbmQoc3Bhbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvL2Rlc2VsZWN0IGl0ZW0uXG4gICAgICAgICAgICBvLmN1cnJlbnRUYXJnZXQuY2xhc3NMaXN0LnJlbW92ZShDc3NIZWxwZXIubXVsdGlTZWxlY3Quc2VsZWN0ZWQpO1xuICAgICAgICAgICAgby5jdXJyZW50VGFyZ2V0LmRhdGFzZXQuc2VsZWN0ZWQgPSBcImZhbHNlXCI7XG5cbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRWYWx1ZXMgPSB0aGlzLnNlbGVjdGVkVmFsdWVzLmZpbHRlcihmID0+IGYgIT09IG8uY3VycmVudFRhcmdldC5kYXRhc2V0LnZhbHVlKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMubGlzdEFsbCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLmhlYWRlci5xdWVyeVNlbGVjdG9yKGBbZGF0YS12YWx1ZT0nJHtvLmN1cnJlbnRUYXJnZXQuZGF0YXNldC52YWx1ZX0nXWApO1xuXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0gIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5saXN0QWxsID09PSBmYWxzZSkge1xuICAgICAgICAgICAgdGhpcy5jcmVhdGVDb3VudExhYmVsKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIEhlbHBlciBmdW5jdGlvbiB0byBjcmVhdGUgYW4gb3B0aW9uIGVsZW1lbnQgZm9yIHRoZSBtdWx0aS1zZWxlY3QgY29udHJvbC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaXRlbSBrZXkvdmFsdWUgcGFpciBvYmplY3QgdGhhdCBjb250YWlucyB0aGUgdmFsdWUgYW5kIHRleHQgZm9yIHRoZSBvcHRpb24uXG4gICAgICogQHJldHVybnMge0hUTUxEaXZFbGVtZW50fSBSZXR1cm5zIGEgZGl2IGVsZW1lbnQgdGhhdCByZXByZXNlbnRzIHRoZSBvcHRpb24gaW4gdGhlIG11bHRpLXNlbGVjdCBjb250cm9sLlxuICAgICAqL1xuICAgIGNyZWF0ZU9wdGlvbihpdGVtKSB7IFxuICAgICAgICBjb25zdCBvcHRpb24gPSBFbGVtZW50SGVscGVyLmRpdih7IGNsYXNzTmFtZTogQ3NzSGVscGVyLm11bHRpU2VsZWN0Lm9wdGlvbiB9LCB7IHZhbHVlOiBpdGVtLnZhbHVlLCBzZWxlY3RlZDogXCJmYWxzZVwiIH0pO1xuICAgICAgICBjb25zdCByYWRpbyA9IEVsZW1lbnRIZWxwZXIuc3Bhbih7IGNsYXNzTmFtZTogQ3NzSGVscGVyLm11bHRpU2VsZWN0Lm9wdGlvblJhZGlvIH0pO1xuICAgICAgICBjb25zdCB0ZXh0ID0gRWxlbWVudEhlbHBlci5zcGFuKHsgY2xhc3NOYW1lOiBDc3NIZWxwZXIubXVsdGlTZWxlY3Qub3B0aW9uVGV4dCwgaW5uZXJIVE1MOiBpdGVtLnRleHQgfSk7XG5cbiAgICAgICAgb3B0aW9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZU9wdGlvbik7XG4gICAgICAgIG9wdGlvbi5hcHBlbmQocmFkaW8sIHRleHQpO1xuXG4gICAgICAgIHJldHVybiBvcHRpb247XG4gICAgfVxuXG4gICAgdGVtcGxhdGVDb250YWluZXIgPSAoZGF0YSkgPT4ge1xuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgZGF0YSkge1xuICAgICAgICAgICAgY29uc3Qgb3B0aW9uID0gdGhpcy5jcmVhdGVPcHRpb24oaXRlbSk7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnNDb250YWluZXIuYXBwZW5kKG9wdGlvbik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIENhbGxlZCB3aGVuIHRoZSBncmlkIHBpcGVsaW5lJ3MgYHJlZnJlc2hgIGV2ZW50IGlzIHRyaWdnZXJlZC4gIEl0IGNsZWFycyB0aGUgY3VycmVudCBvcHRpb25zIGFuZFxuICAgICAqIHJlY3JlYXRlcyB0aGVtIGJhc2VkIG9uIHRoZSBkYXRhIHByb3ZpZGVkLiAgSXQgYWxzbyB1cGRhdGVzIHRoZSBzZWxlY3RlZCB2YWx1ZXMgYmFzZWQgb24gdGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIG9wdGlvbnMuXG4gICAgICogQHBhcmFtIHtBcnJheX0gZGF0YSBBcnJheSBvZiBvYmplY3RzIHRoYXQgcmVwcmVzZW50IHRoZSBvcHRpb25zIHRvIGJlIGRpc3BsYXllZCBpbiB0aGUgbXVsdGktc2VsZWN0IGNvbnRyb2wuXG4gICAgICovXG4gICAgcmVmcmVzaFNlbGVjdE9wdGlvbnMgPSAoZGF0YSkgPT4ge1xuICAgICAgICB0aGlzLm9wdGlvbnNDb250YWluZXIucmVwbGFjZUNoaWxkcmVuKCk7XG4gICAgICAgIHRoaXMuaGVhZGVyLnJlcGxhY2VDaGlsZHJlbigpO1xuICAgICAgICB0aGlzLmNvdW50TGFiZWwgPSB1bmRlZmluZWQ7ICAvL3NldCB0byB1bmRlZmluZWQgc28gaXQgY2FuIGJlIHJlY3JlYXRlZCBsYXRlci5cbiAgICAgICAgY29uc3QgbmV3U2VsZWN0ZWQgPSBbXTtcblxuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgZGF0YSkge1xuICAgICAgICAgICAgY29uc3Qgb3B0aW9uID0gdGhpcy5jcmVhdGVPcHRpb24oaXRlbSk7XG4gICAgICAgICAgICAvL2NoZWNrIGlmIGl0ZW0gaXMgc2VsZWN0ZWQuXG4gICAgICAgICAgICBpZiAodGhpcy5zZWxlY3RlZFZhbHVlcy5pbmNsdWRlcyhpdGVtLnZhbHVlKSkge1xuICAgICAgICAgICAgICAgIC8vc2VsZWN0IGl0ZW0uXG4gICAgICAgICAgICAgICAgb3B0aW9uLmNsYXNzTGlzdC5hZGQoQ3NzSGVscGVyLm11bHRpU2VsZWN0LnNlbGVjdGVkKTtcbiAgICAgICAgICAgICAgICBvcHRpb24uZGF0YXNldC5zZWxlY3RlZCA9IFwidHJ1ZVwiO1xuICAgICAgICAgICAgICAgIG5ld1NlbGVjdGVkLnB1c2goaXRlbS52YWx1ZSk7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5saXN0QWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNwYW4gPSBFbGVtZW50SGVscGVyLnNwYW4oeyBjbGFzc05hbWU6IENzc0hlbHBlci5tdWx0aVNlbGVjdC5oZWFkZXJPcHRpb24sIGlubmVyVGV4dDogaXRlbS52YWx1ZSB9LCB7IHZhbHVlOiBpdGVtLnZhbHVlIH0pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmhlYWRlci5hcHBlbmQoc3Bhbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnNDb250YWluZXIuYXBwZW5kKG9wdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgLy9zZXQgbmV3IHNlbGVjdGVkIHZhbHVlcyBhcyBpdGVtcyBtYXkgaGF2ZSBiZWVuIHJlbW92ZWQgb24gcmVmcmVzaC5cbiAgICAgICAgdGhpcy5zZWxlY3RlZFZhbHVlcyA9IG5ld1NlbGVjdGVkO1xuXG4gICAgICAgIGlmICh0aGlzLmxpc3RBbGwgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICB0aGlzLmNyZWF0ZUNvdW50TGFiZWwoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNlbGVjdGVkVmFsdWVzO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRWxlbWVudE11bHRpU2VsZWN0IH07IiwiaW1wb3J0IHsgRWxlbWVudEhlbHBlciB9IGZyb20gXCIuLi8uLi8uLi9oZWxwZXJzL2VsZW1lbnRIZWxwZXIuanNcIjtcbi8qKlxuICogUmVwcmVzZW50cyBhIGNvbHVtbnMgZmlsdGVyIGNvbnRyb2wuICBDcmVhdGVzIGEgYEhUTUxTZWxlY3RFbGVtZW50YCB0aGF0IGlzIGFkZGVkIHRvIHRoZSBoZWFkZXIgcm93IG9mIHRoZSBncmlkIHRvIGZpbHRlciBkYXRhIFxuICogc3BlY2lmaWMgdG8gaXRzIGRlZmluZWQgY29sdW1uLiAgSWYgYGZpbHRlclZhbHVlc1JlbW90ZVNvdXJjZWAgaXMgZGVmaW5lZCwgdGhlIHNlbGVjdCBvcHRpb25zIHdpbGwgYmUgcG9wdWxhdGVkIGJ5IHRoZSBkYXRhIHJldHVybmVkIFxuICogZnJvbSB0aGUgcmVtb3RlIHNvdXJjZSBieSByZWdpc3RlcmluZyB0byB0aGUgZ3JpZCBwaXBlbGluZSdzIGBpbml0YCBhbmQgYHJlZnJlc2hgIGV2ZW50cy5cbiAqL1xuY2xhc3MgRWxlbWVudFNlbGVjdCB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGZpbHRlciBvYmplY3QgdGhhdCByZXByZXNlbnRzIGEgYEhUTUxTZWxlY3RFbGVtZW50YCBlbGVtZW50IGluIHRoZSB0YWJsZSdzIGhlYWRlciByb3cuXG4gICAgICogQHBhcmFtIHtDb2x1bW59IGNvbHVtbiBDb2x1bW4gY2xhc3Mgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgR3JpZCBjb250ZXh0LiBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb2x1bW4sIGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gRWxlbWVudEhlbHBlci5jcmVhdGUoXCJzZWxlY3RcIiwgeyBuYW1lOiBjb2x1bW4uZmllbGQgfSk7XG4gICAgICAgIHRoaXMuZmllbGQgPSBjb2x1bW4uZmllbGQ7XG4gICAgICAgIHRoaXMuZmllbGRUeXBlID0gY29sdW1uLnR5cGU7ICAvL2ZpZWxkIHZhbHVlIHR5cGUuXG4gICAgICAgIHRoaXMuZmlsdGVyVHlwZSA9IGNvbHVtbi5maWx0ZXJUeXBlOyAgLy9jb25kaXRpb24gdHlwZS5cbiAgICAgICAgdGhpcy5maWx0ZXJJc0Z1bmN0aW9uID0gKHR5cGVvZiBjb2x1bW4/LmZpbHRlclR5cGUgPT09IFwiZnVuY3Rpb25cIik7XG4gICAgICAgIHRoaXMuZmlsdGVyUGFyYW1zID0gY29sdW1uLmZpbHRlclBhcmFtcztcbiAgICAgICAgdGhpcy5waXBlbGluZSA9IGNvbnRleHQucGlwZWxpbmU7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50LmlkID0gYCR7Y29sdW1uLnNldHRpbmdzLmJhc2VJZE5hbWV9XyR7dGhpcy5maWVsZH1gO1xuICAgICAgICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCBhc3luYyAoKSA9PiBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIikpO1xuXG4gICAgICAgIGlmIChjb2x1bW4uZmlsdGVyQ3NzKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuY2xhc3NOYW1lID0gY29sdW1uLmZpbHRlckNzcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb2x1bW4uZmlsdGVyVmFsdWVzUmVtb3RlU291cmNlKSB7XG4gICAgICAgICAgICAvL3NldCB1cCBwaXBlbGluZSB0byByZXRyaWV2ZSBvcHRpb24gZGF0YSB3aGVuIGluaXQgcGlwZWxpbmUgaXMgY2FsbGVkLlxuICAgICAgICAgICAgdGhpcy5waXBlbGluZS5hZGRTdGVwKFwiaW5pdFwiLCB0aGlzLmNyZWF0ZVNlbGVjdE9wdGlvbnMsIGNvbHVtbi5maWx0ZXJWYWx1ZXNSZW1vdGVTb3VyY2UpO1xuICAgICAgICAgICAgdGhpcy5waXBlbGluZS5hZGRTdGVwKFwicmVmcmVzaFwiLCB0aGlzLnJlZnJlc2hTZWxlY3RPcHRpb25zLCBjb2x1bW4uZmlsdGVyVmFsdWVzUmVtb3RlU291cmNlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBcbiAgICAgICAgLy91c2UgdXNlciBzdXBwbGllZCB2YWx1ZXMgdG8gY3JlYXRlIHNlbGVjdCBvcHRpb25zLlxuICAgICAgICBjb25zdCBvcHRzID0gQXJyYXkuaXNBcnJheShjb2x1bW4uZmlsdGVyVmFsdWVzKSBcbiAgICAgICAgICAgID8gY29sdW1uLmZpbHRlclZhbHVlc1xuICAgICAgICAgICAgOiBPYmplY3QuZW50cmllcyhjb2x1bW4uZmlsdGVyVmFsdWVzKS5tYXAoKFtrZXksIHZhbHVlXSkgPT4gKHsgdmFsdWU6IGtleSwgdGV4dDogdmFsdWV9KSk7XG5cbiAgICAgICAgdGhpcy5jcmVhdGVTZWxlY3RPcHRpb25zKG9wdHMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBCdWlsZHMgb3B0aW9uIGVsZW1lbnRzIGZvciBjbGFzcydzIGBzZWxlY3RgIGlucHV0LiAgRXhwZWN0cyBhbiBhcnJheSBvZiBvYmplY3RzIHdpdGgga2V5L3ZhbHVlIHBhaXJzIG9mOlxuICAgICAqICAqIGB2YWx1ZWA6IG9wdGlvbiB2YWx1ZS4gIHNob3VsZCBiZSBhIHByaW1hcnkga2V5IHR5cGUgdmFsdWUgd2l0aCBubyBibGFuayBzcGFjZXMuXG4gICAgICogICogYHRleHRgOiBvcHRpb24gdGV4dCB2YWx1ZVxuICAgICAqIEBwYXJhbSB7QXJyYXk8b2JqZWN0Pn0gZGF0YSBrZXkvdmFsdWUgYXJyYXkgb2YgdmFsdWVzLlxuICAgICAqL1xuICAgIGNyZWF0ZVNlbGVjdE9wdGlvbnMgPSAoZGF0YSkgPT4ge1xuICAgICAgICBjb25zdCBmaXJzdCA9IEVsZW1lbnRIZWxwZXIuY3JlYXRlKFwib3B0aW9uXCIsIHsgdmFsdWU6IFwiXCIsIHRleHQ6IFwiU2VsZWN0IGFsbFwiIH0pO1xuXG4gICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmQoZmlyc3QpO1xuXG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBkYXRhKSB7XG4gICAgICAgICAgICBjb25zdCBvcHRpb24gPSBFbGVtZW50SGVscGVyLmNyZWF0ZShcIm9wdGlvblwiLCB7IHZhbHVlOiBpdGVtLnZhbHVlLCB0ZXh0OiBpdGVtLnRleHQgfSk7XG5cbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmQob3B0aW9uKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogUmVwbGFjZXMvdXBkYXRlcyBvcHRpb24gZWxlbWVudHMgZm9yIGNsYXNzJ3MgYHNlbGVjdGAgaW5wdXQuICBXaWxsIHBlcnNpc3QgdGhlIGN1cnJlbnQgc2VsZWN0IHZhbHVlLCBpZiBhbnkuICBcbiAgICAgKiBFeHBlY3RzIGFuIGFycmF5IG9mIG9iamVjdHMgd2l0aCBrZXkvdmFsdWUgcGFpcnMgb2Y6XG4gICAgICogICogYHZhbHVlYDogT3B0aW9uIHZhbHVlLiAgU2hvdWxkIGJlIGEgcHJpbWFyeSBrZXkgdHlwZSB2YWx1ZSB3aXRoIG5vIGJsYW5rIHNwYWNlcy5cbiAgICAgKiAgKiBgdGV4dGA6IE9wdGlvbiB0ZXh0LlxuICAgICAqIEBwYXJhbSB7QXJyYXk8b2JqZWN0Pn0gZGF0YSBrZXkvdmFsdWUgYXJyYXkgb2YgdmFsdWVzLlxuICAgICAqL1xuICAgIHJlZnJlc2hTZWxlY3RPcHRpb25zID0gKGRhdGEpID0+IHtcbiAgICAgICAgY29uc3Qgc2VsZWN0ZWRWYWx1ZSA9IHRoaXMuZWxlbWVudC52YWx1ZTtcblxuICAgICAgICB0aGlzLmVsZW1lbnQucmVwbGFjZUNoaWxkcmVuKCk7XG4gICAgICAgIHRoaXMuY3JlYXRlU2VsZWN0T3B0aW9ucyhkYXRhKTtcbiAgICAgICAgdGhpcy5lbGVtZW50LnZhbHVlID0gc2VsZWN0ZWRWYWx1ZTtcbiAgICB9O1xuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LnZhbHVlO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRWxlbWVudFNlbGVjdCB9OyIsImltcG9ydCB7IERhdGVIZWxwZXIgfSBmcm9tIFwiLi4vLi4vaGVscGVycy9kYXRlSGVscGVyLmpzXCI7XG5pbXBvcnQgeyBGaWx0ZXJUYXJnZXQgfSBmcm9tIFwiLi90eXBlcy9maWx0ZXJUYXJnZXQuanNcIjtcbmltcG9ydCB7IEZpbHRlckRhdGUgfSBmcm9tIFwiLi90eXBlcy9maWx0ZXJEYXRlLmpzXCI7XG5pbXBvcnQgeyBGaWx0ZXJGdW5jdGlvbiB9IGZyb20gXCIuL3R5cGVzL2ZpbHRlckZ1bmN0aW9uLmpzXCI7XG5pbXBvcnQgeyBFbGVtZW50QmV0d2VlbiB9IGZyb20gXCIuL2VsZW1lbnRzL2VsZW1lbnRCZXR3ZWVuLmpzXCI7XG5pbXBvcnQgeyBFbGVtZW50SW5wdXQgfSBmcm9tIFwiLi9lbGVtZW50cy9lbGVtZW50SW5wdXQuanNcIjtcbmltcG9ydCB7IEVsZW1lbnRNdWx0aVNlbGVjdCB9IGZyb20gXCIuL2VsZW1lbnRzL2VsZW1lbnRNdWx0aVNlbGVjdC5qc1wiO1xuaW1wb3J0IHsgRWxlbWVudFNlbGVjdCB9IGZyb20gXCIuL2VsZW1lbnRzL2VsZW1lbnRTZWxlY3QuanNcIjtcbi8qKlxuICogUHJvdmlkZXMgYSBtZWFucyB0byBmaWx0ZXIgZGF0YSBpbiB0aGUgZ3JpZC4gIFRoaXMgbW9kdWxlIGNyZWF0ZXMgaGVhZGVyIGZpbHRlciBjb250cm9scyBmb3IgZWFjaCBjb2x1bW4gdGhhdCBoYXMgXG4gKiBhIGBoYXNGaWx0ZXJgIGF0dHJpYnV0ZSBzZXQgdG8gYHRydWVgLlxuICogXG4gKiBDbGFzcyBzdWJzY3JpYmVzIHRvIHRoZSBgcmVuZGVyYCBldmVudCB0byB1cGRhdGUgdGhlIGZpbHRlciBjb250cm9sIHdoZW4gdGhlIGdyaWQgaXMgcmVuZGVyZWQuICBJdCBhbHNvIGNhbGxzIHRoZSBjaGFpbiBcbiAqIGV2ZW50IGByZW1vdGVQYXJhbXNgIHRvIGNvbXBpbGUgYSBsaXN0IG9mIHBhcmFtZXRlcnMgdG8gYmUgcGFzc2VkIHRvIHRoZSByZW1vdGUgZGF0YSBzb3VyY2Ugd2hlbiB1c2luZyByZW1vdGUgcHJvY2Vzc2luZy5cbiAqL1xuY2xhc3MgRmlsdGVyTW9kdWxlIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IGZpbHRlciBtb2R1bGUgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgR3JpZCBjb250ZXh0LlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy5oZWFkZXJGaWx0ZXJzID0gW107XG4gICAgICAgIHRoaXMuZ3JpZEZpbHRlcnMgPSBbXTtcbiAgICB9XG5cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICBpZiAodGhpcy5jb250ZXh0LnNldHRpbmdzLnJlbW90ZVByb2Nlc3NpbmcpIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5ldmVudHMuc3Vic2NyaWJlKFwicmVtb3RlUGFyYW1zXCIsIHRoaXMucmVtb3RlUGFyYW1zLCB0cnVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5ldmVudHMuc3Vic2NyaWJlKFwicmVuZGVyXCIsIHRoaXMucmVuZGVyTG9jYWwsIGZhbHNlLCA4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2luaXQoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGBIZWFkZXJGaWx0ZXJgIENsYXNzIGZvciBncmlkIGNvbHVtbnMgd2l0aCBhIGBoYXNGaWx0ZXJgIGF0dHJpYnV0ZSBvZiBgdHJ1ZWAuXG4gICAgICovXG4gICAgX2luaXQoKSB7XG4gICAgICAgIGZvciAoY29uc3QgY29sIG9mIHRoaXMuY29udGV4dC5jb2x1bW5NYW5hZ2VyLmNvbHVtbnMpIHtcbiAgICAgICAgICAgIGlmICghY29sLmhhc0ZpbHRlcikgY29udGludWU7XG5cbiAgICAgICAgICAgIGlmIChjb2wuZmlsdGVyRWxlbWVudCA9PT0gXCJtdWx0aVwiKSB7XG4gICAgICAgICAgICAgICAgY29sLmhlYWRlckZpbHRlciA9IG5ldyBFbGVtZW50TXVsdGlTZWxlY3QoY29sLCB0aGlzLmNvbnRleHQpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjb2wuZmlsdGVyRWxlbWVudCA9PT0gXCJiZXR3ZWVuXCIpIHtcbiAgICAgICAgICAgICAgICBjb2wuaGVhZGVyRmlsdGVyID0gbmV3IEVsZW1lbnRCZXR3ZWVuKGNvbCwgdGhpcy5jb250ZXh0KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY29sLmZpbHRlckVsZW1lbnQgPT09IFwic2VsZWN0XCIpIHtcbiAgICAgICAgICAgICAgICBjb2wuaGVhZGVyRmlsdGVyID0gbmV3IEVsZW1lbnRTZWxlY3QoY29sLCB0aGlzLmNvbnRleHQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb2wuaGVhZGVyRmlsdGVyID0gbmV3IEVsZW1lbnRJbnB1dChjb2wsIHRoaXMuY29udGV4dCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbC5oZWFkZXJDZWxsLmVsZW1lbnQuYXBwZW5kQ2hpbGQoY29sLmhlYWRlckZpbHRlci5lbGVtZW50KTtcbiAgICAgICAgICAgIHRoaXMuaGVhZGVyRmlsdGVycy5wdXNoKGNvbC5oZWFkZXJGaWx0ZXIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENvbXBpbGVzIGhlYWRlciBhbmQgZ3JpZCBmaWx0ZXIgdmFsdWVzIGludG8gYSBzaW5nbGUgb2JqZWN0IG9mIGtleS92YWx1ZSBwYWlycyB0aGF0IGNhbiBiZSB1c2VkIHRvIHNlbmQgdG8gdGhlIHJlbW90ZSBkYXRhIHNvdXJjZS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIE9iamVjdCBvZiBrZXkvdmFsdWUgcGFpcnMgdG8gYmUgc2VudCB0byB0aGUgcmVtb3RlIGRhdGEgc291cmNlLlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIG1vZGlmaWVkIHBhcmFtcyBvYmplY3Qgd2l0aCBmaWx0ZXIgdmFsdWVzIGFkZGVkLlxuICAgICAqL1xuICAgIHJlbW90ZVBhcmFtcyA9IChwYXJhbXMpID0+IHtcbiAgICAgICAgdGhpcy5oZWFkZXJGaWx0ZXJzLmZvckVhY2goKGYpID0+IHtcbiAgICAgICAgICAgIGlmIChmLnZhbHVlICE9PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgcGFyYW1zW2YuZmllbGRdID0gZi52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHRoaXMuZ3JpZEZpbHRlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHRoaXMuZ3JpZEZpbHRlcnMpIHtcbiAgICAgICAgICAgICAgICBwYXJhbXNbaXRlbS5maWVsZF0gPSBpdGVtLnZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHBhcmFtcztcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIENvbnZlcnQgdmFsdWUgdHlwZSB0byBjb2x1bW4gdHlwZS4gIElmIHZhbHVlIGNhbm5vdCBiZSBjb252ZXJ0ZWQsIGBudWxsYCBpcyByZXR1cm5lZC5cbiAgICAgKiBAcGFyYW0ge29iamVjdCB8IHN0cmluZyB8IG51bWJlcn0gdmFsdWUgUmF3IGZpbHRlciB2YWx1ZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBGaWVsZCB0eXBlLlxuICAgICAqIEByZXR1cm5zIHtudW1iZXIgfCBEYXRlIHwgc3RyaW5nIHwgbnVsbCB8IE9iamVjdH0gaW5wdXQgdmFsdWUgb3IgYG51bGxgIGlmIGVtcHR5LlxuICAgICAqL1xuICAgIGNvbnZlcnRUb1R5cGUodmFsdWUsIHR5cGUpIHtcbiAgICAgICAgaWYgKHZhbHVlID09PSBcIlwiIHx8IHZhbHVlID09PSBudWxsKSByZXR1cm4gdmFsdWU7XG5cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgICBpZiAodHlwZSA9PT0gXCJkYXRlXCIgfHwgdHlwZSA9PT0gXCJkYXRldGltZVwiKSAgeyBcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSB2YWx1ZS5tYXAoKHYpID0+IERhdGVIZWxwZXIucGFyc2VEYXRlKHYpKTsgXG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0LmluY2x1ZGVzKFwiXCIpID8gbnVsbCA6IHJlc3VsdDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGUgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZTEgPSB0aGlzLmNvbnZlcnRUb1R5cGUodmFsdWVbMF0sIHR5cGUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlMiA9IHRoaXMuY29udmVydFRvVHlwZSh2YWx1ZVsxXSwgdHlwZSk7ICBcblxuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTEgPT09IG51bGwgfHwgdmFsdWUyID09PSBudWxsID8gbnVsbCA6IFt2YWx1ZTEsIHZhbHVlMl07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IE51bWJlcih2YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm4gTnVtYmVyLmlzTmFOKHZhbHVlKSA/IG51bGwgOiB2YWx1ZTtcbiAgICAgICAgfSBcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlID09PSBcImRhdGVcIiB8fCB0eXBlID09PSBcImRhdGV0aW1lXCIpIHtcbiAgICAgICAgICAgIHZhbHVlID0gRGF0ZUhlbHBlci5wYXJzZURhdGVPbmx5KHZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZSA9PT0gXCJcIiA/IG51bGwgOiB2YWx1ZTtcbiAgICAgICAgfSBcbiAgICAgICAgLy9hc3N1bWluZyBpdCdzIGEgc3RyaW5nIHZhbHVlIG9yIE9iamVjdCBhdCB0aGlzIHBvaW50LlxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFdyYXBzIHRoZSBmaWx0ZXIgaW5wdXQgdmFsdWUgaW4gYSBgRmlsdGVyVGFyZ2V0YCBvYmplY3QsIHdoaWNoIGRlZmluZXMgYSBzaW5nbGUgZmlsdGVyIGNvbmRpdGlvbiBmb3IgYSBjb2x1bW4uXG4gICAgICogQHBhcmFtIHtzdHJpbmcgfCBEYXRlIHwgbnVtYmVyIHwgT2JqZWN0fSB2YWx1ZSBGaWx0ZXIgdmFsdWUgdG8gYXBwbHkgdG8gdGhlIGNvbHVtbi5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmllbGQgVGhlIGZpZWxkIG5hbWUgb2YgdGhlIGNvbHVtbiBiZWluZyBmaWx0ZXJlZC4gVGhpcyBpcyB1c2VkIHRvIGlkZW50aWZ5IHRoZSBjb2x1bW4gaW4gdGhlIGRhdGEgc2V0LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nIHwgRnVuY3Rpb259IGZpbHRlclR5cGUgVGhlIHR5cGUgb2YgZmlsdGVyIHRvIGFwcGx5IChlLmcuLCBcImVxdWFsc1wiLCBcImxpa2VcIiwgXCI8XCIsIFwiPD1cIiwgXCI+XCIsIFwiPj1cIiwgXCIhPVwiLCBcImJldHdlZW5cIiwgXCJpblwiKS5cbiAgICAgKiBDYW4gYWxzbyBiZSBhIGZ1bmN0aW9uLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmaWVsZFR5cGUgVGhlIHR5cGUgb2YgZmllbGQgYmVpbmcgZmlsdGVyZWQgKGUuZy4sIFwic3RyaW5nXCIsIFwibnVtYmVyXCIsIFwiZGF0ZVwiLCBcIm9iamVjdFwiKS5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGZpbHRlcklzRnVuY3Rpb24gSW5kaWNhdGVzIGlmIHRoZSBmaWx0ZXIgdHlwZSBpcyBhIGZ1bmN0aW9uLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBmaWx0ZXJQYXJhbXMgT3B0aW9uYWwgcGFyYW1ldGVycyB0byBwYXNzIHRvIHRoZSBmaWx0ZXIgZnVuY3Rpb24uXG4gICAgICogQHJldHVybnMge0ZpbHRlclRhcmdldCB8IEZpbHRlckRhdGUgfCBGaWx0ZXJGdW5jdGlvbiB8IG51bGx9IFJldHVybnMgYSBmaWx0ZXIgdGFyZ2V0IG9iamVjdCB0aGF0IGRlZmluZXMgYSBzaW5nbGUgZmlsdGVyIGNvbmRpdGlvbiBmb3IgYSBjb2x1bW4sIFxuICAgICAqIG9yIG51bGwgaWYgdGhlIHZhbHVlIGNhbm5vdCBiZSBjb252ZXJ0ZWQgdG8gdGhlIGZpZWxkIHR5cGUuIFxuICAgICAqL1xuICAgIGNyZWF0ZUZpbHRlclRhcmdldCh2YWx1ZSwgZmllbGQsIGZpbHRlclR5cGUsIGZpZWxkVHlwZSwgZmlsdGVySXNGdW5jdGlvbiwgZmlsdGVyUGFyYW1zKSB7IFxuICAgICAgICBpZiAoZmlsdGVySXNGdW5jdGlvbikgeyBcbiAgICAgICAgICAgIHJldHVybiBuZXcgRmlsdGVyRnVuY3Rpb24oeyB2YWx1ZTogdmFsdWUsIGZpZWxkOiBmaWVsZCwgZmlsdGVyVHlwZTogZmlsdGVyVHlwZSwgcGFyYW1zOiBmaWx0ZXJQYXJhbXMgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjb252ZXJ0ZWRWYWx1ZSA9IHRoaXMuY29udmVydFRvVHlwZSh2YWx1ZSwgZmllbGRUeXBlKTtcblxuICAgICAgICBpZiAoY29udmVydGVkVmFsdWUgPT09IG51bGwpIHJldHVybiBudWxsO1xuXG4gICAgICAgIGlmIChmaWVsZFR5cGUgPT09IFwiZGF0ZVwiIHx8IGZpZWxkVHlwZSA9PT0gXCJkYXRldGltZVwiKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEZpbHRlckRhdGUoeyB2YWx1ZTogY29udmVydGVkVmFsdWUsIGZpZWxkOiBmaWVsZCwgZmlsdGVyVHlwZTogZmlsdGVyVHlwZSB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgRmlsdGVyVGFyZ2V0KHsgdmFsdWU6IGNvbnZlcnRlZFZhbHVlLCBmaWVsZDogZmllbGQsIGZpZWxkVHlwZTogZmllbGRUeXBlLCBmaWx0ZXJUeXBlOiBmaWx0ZXJUeXBlIH0pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDb21waWxlcyBhbiBhcnJheSBvZiBmaWx0ZXIgdHlwZSBvYmplY3RzIHRoYXQgY29udGFpbiBhIGZpbHRlciB2YWx1ZSB0aGF0IG1hdGNoZXMgaXRzIGNvbHVtbiB0eXBlLiAgQ29sdW1uIHR5cGUgbWF0Y2hpbmcgXG4gICAgICogaXMgbmVjZXNzYXJ5IHdoZW4gcHJvY2Vzc2luZyBkYXRhIGxvY2FsbHksIHNvIHRoYXQgZmlsdGVyIHZhbHVlIG1hdGNoZXMgYXNzb2NpYXRlZCByb3cgdHlwZSB2YWx1ZSBmb3IgY29tcGFyaXNvbi5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IGFycmF5IG9mIGZpbHRlciB0eXBlIG9iamVjdHMgd2l0aCB2YWxpZCB2YWx1ZS5cbiAgICAgKi9cbiAgICBjb21waWxlRmlsdGVycygpIHtcbiAgICAgICAgbGV0IHJlc3VsdHMgPSBbXTtcblxuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgdGhpcy5oZWFkZXJGaWx0ZXJzKSB7XG4gICAgICAgICAgICBpZiAoaXRlbS52YWx1ZSA9PT0gXCJcIikgY29udGludWU7XG5cbiAgICAgICAgICAgIGNvbnN0IGZpbHRlciA9IHRoaXMuY3JlYXRlRmlsdGVyVGFyZ2V0KGl0ZW0udmFsdWUsIGl0ZW0uZmllbGQsIGl0ZW0uZmlsdGVyVHlwZSwgaXRlbS5maWVsZFR5cGUsIGl0ZW0uZmlsdGVySXNGdW5jdGlvbiwgaXRlbT8uZmlsdGVyUGFyYW1zKTtcblxuICAgICAgICAgICAgaWYgKGZpbHRlciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChmaWx0ZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZ3JpZEZpbHRlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHMuY29uY2F0KHRoaXMuZ3JpZEZpbHRlcnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFVzZSB0YXJnZXQgZmlsdGVycyB0byBjcmVhdGUgYSBuZXcgZGF0YSBzZXQgaW4gdGhlIHBlcnNpc3RlbmNlIGRhdGEgcHJvdmlkZXIuXG4gICAgICogQHBhcmFtIHtBcnJheTxGaWx0ZXJUYXJnZXQ+fSB0YXJnZXRzIEFycmF5IG9mIEZpbHRlclRhcmdldCBvYmplY3RzLlxuICAgICAqL1xuICAgIGFwcGx5RmlsdGVycyh0YXJnZXRzKSB7XG4gICAgICAgIHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5kYXRhID0gW107XG4gICAgICAgIHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5kYXRhQ2FjaGUuZm9yRWFjaCgocm93KSA9PiB7XG4gICAgICAgICAgICBsZXQgbWF0Y2ggPSB0cnVlO1xuXG4gICAgICAgICAgICBmb3IgKGxldCBpdGVtIG9mIHRhcmdldHMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByb3dWYWwgPSB0aGlzLmNvbnZlcnRUb1R5cGUocm93W2l0ZW0uZmllbGRdLCBpdGVtLmZpZWxkVHlwZSk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gaXRlbS5leGVjdXRlKHJvd1ZhbCwgcm93KTtcblxuICAgICAgICAgICAgICAgIGlmICghcmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgIG1hdGNoID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQucGVyc2lzdGVuY2UuZGF0YS5wdXNoKHJvdyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZW5kZXJzIHRoZSBsb2NhbCBkYXRhIHNldCBieSBhcHBseWluZyB0aGUgY29tcGlsZWQgZmlsdGVycyB0byB0aGUgcGVyc2lzdGVuY2UgZGF0YSBwcm92aWRlci5cbiAgICAgKi9cbiAgICByZW5kZXJMb2NhbCA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgdGFyZ2V0cyA9IHRoaXMuY29tcGlsZUZpbHRlcnMoKTtcblxuICAgICAgICBpZiAoT2JqZWN0LmtleXModGFyZ2V0cykubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhpcy5hcHBseUZpbHRlcnModGFyZ2V0cyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQucGVyc2lzdGVuY2UucmVzdG9yZURhdGEoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogUHJvdmlkZXMgYSBtZWFucyB0byBhcHBseSBhIGNvbmRpdGlvbiBvdXRzaWRlIHRoZSBoZWFkZXIgZmlsdGVyIGNvbnRyb2xzLiAgV2lsbCBhZGQgY29uZGl0aW9uXG4gICAgICogdG8gZ3JpZCdzIGBncmlkRmlsdGVyc2AgY29sbGVjdGlvbiwgYW5kIHJhaXNlIGByZW5kZXJgIGV2ZW50IHRvIGZpbHRlciBkYXRhIHNldC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmllbGQgZmllbGQgbmFtZS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gdmFsdWUgdmFsdWUuXG4gICAgICogQHBhcmFtIHtzdHJpbmcgfCBGdW5jdGlvbn0gdHlwZSBjb25kaXRpb24gdHlwZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW2ZpZWxkVHlwZT1cInN0cmluZ1wiXSBmaWVsZCB0eXBlLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbZmlsdGVyUGFyYW1zPXt9XSBhZGRpdGlvbmFsIGZpbHRlciBwYXJhbWV0ZXJzLlxuICAgICAqL1xuICAgIHNldEZpbHRlcihmaWVsZCwgdmFsdWUsIHR5cGUgPSBcImVxdWFsc1wiLCBmaWVsZFR5cGUgPSBcInN0cmluZ1wiLCBmaWx0ZXJQYXJhbXMgPSB7fSkge1xuICAgICAgICBjb25zdCBjb252ZXJ0ZWRWYWx1ZSA9IHRoaXMuY29udmVydFRvVHlwZSh2YWx1ZSwgZmllbGRUeXBlKTtcblxuICAgICAgICBpZiAodGhpcy5ncmlkRmlsdGVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuZ3JpZEZpbHRlcnMuZmluZEluZGV4KChpKSA9PiBpLmZpZWxkID09PSBmaWVsZCk7XG4gICAgICAgICAgICAvL0lmIGZpZWxkIGFscmVhZHkgZXhpc3RzLCBqdXN0IHVwZGF0ZSB0aGUgdmFsdWUuXG4gICAgICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZ3JpZEZpbHRlcnNbaW5kZXhdLnZhbHVlID0gY29udmVydGVkVmFsdWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZmlsdGVyID0gdGhpcy5jcmVhdGVGaWx0ZXJUYXJnZXQoY29udmVydGVkVmFsdWUsIGZpZWxkLCB0eXBlLCBmaWVsZFR5cGUsICh0eXBlb2YgdHlwZSA9PT0gXCJmdW5jdGlvblwiKSwgZmlsdGVyUGFyYW1zKTtcbiAgICAgICAgdGhpcy5ncmlkRmlsdGVycy5wdXNoKGZpbHRlcik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgZmlsdGVyIGNvbmRpdGlvbiBmcm9tIGdyaWQncyBgZ3JpZEZpbHRlcnNgIGNvbGxlY3Rpb24uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZpZWxkIGZpZWxkIG5hbWUuXG4gICAgICovXG4gICAgcmVtb3ZlRmlsdGVyKGZpZWxkKSB7XG4gICAgICAgIHRoaXMuZ3JpZEZpbHRlcnMgPSB0aGlzLmdyaWRGaWx0ZXJzLmZpbHRlcihmID0+IGYuZmllbGQgIT09IGZpZWxkKTtcbiAgICB9XG59XG5cbkZpbHRlck1vZHVsZS5tb2R1bGVOYW1lID0gXCJmaWx0ZXJcIjtcblxuZXhwb3J0IHsgRmlsdGVyTW9kdWxlIH07IiwiLyoqXG4gKiBXaWxsIHJlLWxvYWQgdGhlIGdyaWQncyBkYXRhIGZyb20gaXRzIHRhcmdldCBzb3VyY2UgKGxvY2FsIG9yIHJlbW90ZSkuXG4gKi9cbmNsYXNzIFJlZnJlc2hNb2R1bGUge1xuICAgIC8qKlxuICAgICAqIFdpbGwgYXBwbHkgZXZlbnQgdG8gdGFyZ2V0IGJ1dHRvbiB0aGF0LCB3aGVuIGNsaWNrZWQsIHdpbGwgcmUtbG9hZCB0aGUgXG4gICAgICogZ3JpZCdzIGRhdGEgZnJvbSBpdHMgdGFyZ2V0IHNvdXJjZSAobG9jYWwgb3IgcmVtb3RlKS5cbiAgICAgKiBAcGFyYW0ge0dyaWRDb250ZXh0fSBjb250ZXh0IEdyaWQgY29udGV4dCBjbGFzcy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgfVxuXG4gICAgaW5pdGlhbGl6ZSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVtb3RlUHJvY2Vzc2luZyAmJiB0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVtb3RlVXJsKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQucGlwZWxpbmUuYWRkU3RlcChcInJlZnJlc2hcIiwgdGhpcy5jb250ZXh0LnBlcnNpc3RlbmNlLnNldERhdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGhpcy5jb250ZXh0LnNldHRpbmdzLnJlZnJlc2hhYmxlSWQpO1xuICAgICAgICBcbiAgICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZVJlZnJlc2gpO1xuICAgIH1cblxuICAgIGhhbmRsZVJlZnJlc2ggPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmNvbnRleHQucGlwZWxpbmUuaGFzUGlwZWxpbmUoXCJyZWZyZXNoXCIpKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQucGlwZWxpbmUuZXhlY3V0ZShcInJlZnJlc2hcIik7XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIik7XG4gICAgfTtcbn1cblxuUmVmcmVzaE1vZHVsZS5tb2R1bGVOYW1lID0gXCJyZWZyZXNoXCI7XG5cbmV4cG9ydCB7IFJlZnJlc2hNb2R1bGUgfTsiLCIvKipcbiAqIFVwZGF0ZXMgdGFyZ2V0IGxhYmVsIHdpdGggYSBjb3VudCBvZiByb3dzIGluIGdyaWQuXG4gKi9cbmNsYXNzIFJvd0NvdW50TW9kdWxlIHtcbiAgICAvKipcbiAgICAgKiBVcGRhdGVzIHRhcmdldCBsYWJlbCBzdXBwbGllZCBpbiBzZXR0aW5ncyB3aXRoIGEgY291bnQgb2Ygcm93cyBpbiBncmlkLlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgR3JpZCBjb250ZXh0IGNsYXNzLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY29udGV4dC5zZXR0aW5ncy5yb3dDb3VudElkKTtcbiAgICB9XG5cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICB0aGlzLmNvbnRleHQuZXZlbnRzLnN1YnNjcmliZShcInJlbmRlclwiLCB0aGlzLmhhbmRsZUNvdW50LCBmYWxzZSwgMjApO1xuICAgIH1cblxuICAgIGhhbmRsZUNvdW50ID0gKCkgPT4ge1xuICAgICAgICB0aGlzLmVsZW1lbnQuaW5uZXJUZXh0ID0gdGhpcy5jb250ZXh0LmdyaWQucm93Q291bnQ7XG4gICAgfTtcbn1cblxuUm93Q291bnRNb2R1bGUubW9kdWxlTmFtZSA9IFwicm93Y291bnRcIjtcblxuZXhwb3J0IHsgUm93Q291bnRNb2R1bGUgfTsiLCJleHBvcnQgZGVmYXVsdCAoYSwgYiwgZGlyZWN0aW9uKSA9PiB7XG4gICAgbGV0IGNvbXBhcmlzb24gPSAwO1xuICAgIGxldCBkYXRlQSA9IG5ldyBEYXRlKGEpO1xuICAgIGxldCBkYXRlQiA9IG5ldyBEYXRlKGIpO1xuXG4gICAgaWYgKE51bWJlci5pc05hTihkYXRlQS52YWx1ZU9mKCkpKSB7XG4gICAgICAgIGRhdGVBID0gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoTnVtYmVyLmlzTmFOKGRhdGVCLnZhbHVlT2YoKSkpIHtcbiAgICAgICAgZGF0ZUIgPSBudWxsO1xuICAgIH1cbiAgICAvL2JvdGggZGF0ZXMgYXJlIG51bGwvaW52YWxpZFxuICAgIGlmIChkYXRlQSA9PT0gbnVsbCAmJiBkYXRlQiA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgLy9oYW5kbGUgZW1wdHkgdmFsdWVzLlxuICAgIGlmICghZGF0ZUEpIHtcbiAgICAgICAgY29tcGFyaXNvbiA9ICFkYXRlQiA/IDAgOiAtMTtcbiAgICB9IGVsc2UgaWYgKCFkYXRlQikge1xuICAgICAgICBjb21wYXJpc29uID0gMTtcbiAgICB9IGVsc2UgaWYgKGRhdGVBID4gZGF0ZUIpIHsgICAgXG4gICAgICAgIGNvbXBhcmlzb24gPSAxO1xuICAgIH0gZWxzZSBpZiAoZGF0ZUEgPCBkYXRlQikge1xuICAgICAgICBjb21wYXJpc29uID0gLTE7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRpcmVjdGlvbiA9PT0gXCJkZXNjXCIgPyAoY29tcGFyaXNvbiAqIC0xKSA6IGNvbXBhcmlzb247XG59OyIsIi8vc29ydCBudW1lcmljIHZhbHVlLlxuZXhwb3J0IGRlZmF1bHQgKGEsIGIsIGRpcmVjdGlvbikgPT4ge1xuICAgIGxldCBjb21wYXJpc29uID0gMDtcblxuICAgIGlmIChhID4gYikge1xuICAgICAgICBjb21wYXJpc29uID0gMTtcbiAgICB9IGVsc2UgaWYgKGEgPCBiKSB7XG4gICAgICAgIGNvbXBhcmlzb24gPSAtMTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGlyZWN0aW9uID09PSBcImRlc2NcIiA/IChjb21wYXJpc29uICogLTEpIDogY29tcGFyaXNvbjtcbn07IiwiZXhwb3J0IGRlZmF1bHQgKGEsIGIsIGRpcmVjdGlvbikgPT4ge1xuICAgIGxldCBjb21wYXJpc29uID0gMDtcbiAgICAvL2hhbmRsZSBlbXB0eSB2YWx1ZXMuXG4gICAgaWYgKCFhKSB7XG4gICAgICAgIGNvbXBhcmlzb24gPSAhYiA/IDAgOiAtMTtcbiAgICB9IGVsc2UgaWYgKCFiKSB7XG4gICAgICAgIGNvbXBhcmlzb24gPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHZhckEgPSBhLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgIGNvbnN0IHZhckIgPSBiLnRvVXBwZXJDYXNlKCk7XG4gICAgXG4gICAgICAgIGlmICh2YXJBID4gdmFyQikge1xuICAgICAgICAgICAgY29tcGFyaXNvbiA9IDE7XG4gICAgICAgIH0gZWxzZSBpZiAodmFyQSA8IHZhckIpIHtcbiAgICAgICAgICAgIGNvbXBhcmlzb24gPSAtMTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkaXJlY3Rpb24gPT09IFwiZGVzY1wiID8gKGNvbXBhcmlzb24gKiAtMSkgOiBjb21wYXJpc29uO1xufTsiLCJpbXBvcnQgZGF0ZSBmcm9tIFwiLi9zb3J0ZXJzL2RhdGUuanNcIjtcbmltcG9ydCBudW1iZXIgZnJvbSBcIi4vc29ydGVycy9udW1iZXIuanNcIjtcbmltcG9ydCBzdHJpbmcgZnJvbSBcIi4vc29ydGVycy9zdHJpbmcuanNcIjtcbi8qKlxuICogQ2xhc3MgdG8gbWFuYWdlIHNvcnRpbmcgZnVuY3Rpb25hbGl0eSBpbiBhIGdyaWQgY29udGV4dC4gIEZvciByZW1vdGUgcHJvY2Vzc2luZywgd2lsbCBzdWJzY3JpYmUgXG4gKiB0byB0aGUgYHJlbW90ZVBhcmFtc2AgZXZlbnQuICBGb3IgbG9jYWwgcHJvY2Vzc2luZywgd2lsbCBzdWJzY3JpYmUgdG8gdGhlIGByZW5kZXJgIGV2ZW50LlxuICogXG4gKiBDbGFzcyB3aWxsIHRyaWdnZXIgdGhlIGByZW5kZXJgIGV2ZW50IGFmdGVyIHNvcnRpbmcgaXMgYXBwbGllZCwgYWxsb3dpbmcgdGhlIGdyaWQgdG8gXG4gKiByZS1yZW5kZXIgd2l0aCB0aGUgc29ydGVkIGRhdGEuXG4gKi9cbmNsYXNzIFNvcnRNb2R1bGUge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgU29ydE1vZHVsZSBvYmplY3QuXG4gICAgICogQHBhcmFtIHtHcmlkQ29udGV4dH0gY29udGV4dCBHcmlkIGNvbnRleHQgb2JqZWN0LlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy5oZWFkZXJDZWxscyA9IFtdO1xuICAgICAgICB0aGlzLmN1cnJlbnRTb3J0Q29sdW1uID0gXCJcIjtcbiAgICAgICAgdGhpcy5jdXJyZW50RGlyZWN0aW9uID0gXCJcIjtcbiAgICAgICAgdGhpcy5jdXJyZW50VHlwZSA9IFwiXCI7XG4gICAgICAgIHRoaXMuaXNSZW1vdGUgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICB0aGlzLmlzUmVtb3RlID0gdGhpcy5jb250ZXh0LnNldHRpbmdzLnJlbW90ZVByb2Nlc3Npbmc7XG5cbiAgICAgICAgaWYgKHRoaXMuaXNSZW1vdGUpIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFNvcnRDb2x1bW4gPSB0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVtb3RlU29ydERlZmF1bHRDb2x1bW47XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnREaXJlY3Rpb24gPSB0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVtb3RlU29ydERlZmF1bHREaXJlY3Rpb247XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuZXZlbnRzLnN1YnNjcmliZShcInJlbW90ZVBhcmFtc1wiLCB0aGlzLnJlbW90ZVBhcmFtcywgdHJ1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuZXZlbnRzLnN1YnNjcmliZShcInJlbmRlclwiLCB0aGlzLnJlbmRlckxvY2FsLCBmYWxzZSwgOSk7XG4gICAgICAgICAgICB0aGlzLnNvcnRlcnMgPSB7IG51bWJlcjogbnVtYmVyLCBzdHJpbmc6IHN0cmluZywgZGF0ZTogZGF0ZSwgZGF0ZXRpbWU6IGRhdGUgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZUhlYWRlckNlbGxzKCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemUgc29ydGFibGUgaGVhZGVyIGNlbGxzIGJ5IGFkZGluZyBzb3J0IENTUyBjbGFzcyBhbmQgY2xpY2sgbGlzdGVuZXJzLlxuICAgICAqL1xuICAgIGluaXRpYWxpemVIZWFkZXJDZWxscygpIHtcbiAgICAgICAgZm9yIChjb25zdCBjb2wgb2YgdGhpcy5jb250ZXh0LmNvbHVtbk1hbmFnZXIuY29sdW1ucykge1xuICAgICAgICAgICAgaWYgKGNvbC50eXBlICE9PSBcImljb25cIikge1xuICAgICAgICAgICAgICAgIGNvbC5oZWFkZXJDZWxsLnNwYW4uY2xhc3NMaXN0LmFkZChcInNvcnRcIik7XG4gICAgICAgICAgICAgICAgY29sLmhlYWRlckNlbGwuc3Bhbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5oYW5kbGVTb3J0KTtcbiAgICAgICAgICAgICAgICB0aGlzLmhlYWRlckNlbGxzLnB1c2goY29sLmhlYWRlckNlbGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZHMgc29ydCBwYXJhbWV0ZXJzIHRvIHJlbW90ZSByZXF1ZXN0IHBhcmFtcy5cbiAgICAgKiBcbiAgICAgKiBNZXRob2QgaXMgdXNlZCB0byBjaGFpbiBwYXJhbWV0ZXJzIGFjcm9zcyBtdWx0aXBsZSBtb2R1bGVzIGZvciByZW1vdGUgcHJvY2Vzc2luZy5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIFJlbW90ZSByZXF1ZXN0IHBhcmFtZXRlcnNcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBVcGRhdGVkIHBhcmFtZXRlcnMgd2l0aCBzb3J0IGluZm9ybWF0aW9uXG4gICAgICovXG4gICAgcmVtb3RlUGFyYW1zID0gKHBhcmFtcykgPT4ge1xuICAgICAgICBwYXJhbXMuc29ydCA9IHRoaXMuY3VycmVudFNvcnRDb2x1bW47XG4gICAgICAgIHBhcmFtcy5kaXJlY3Rpb24gPSB0aGlzLmN1cnJlbnREaXJlY3Rpb247XG5cbiAgICAgICAgcmV0dXJuIHBhcmFtcztcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFVwZGF0ZXMgdGhlIGN1cnJlbnQgc29ydCBzdGF0ZSBmcm9tIGEgaGVhZGVyIGNlbGwgY2xpY2sgZXZlbnQuXG4gICAgICogQHBhcmFtIHtIZWFkZXJDZWxsfSBoZWFkZXJDZWxsIFRoZSBoZWFkZXIgY2VsbCB0aGF0IHdhcyBjbGlja2VkXG4gICAgICovXG4gICAgdXBkYXRlU29ydFN0YXRlKGhlYWRlckNlbGwpIHtcbiAgICAgICAgdGhpcy5jdXJyZW50U29ydENvbHVtbiA9IGhlYWRlckNlbGwubmFtZTtcbiAgICAgICAgdGhpcy5jdXJyZW50RGlyZWN0aW9uID0gaGVhZGVyQ2VsbC5kaXJlY3Rpb25OZXh0LnZhbHVlT2YoKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VHlwZSA9IGhlYWRlckNlbGwudHlwZTtcblxuICAgICAgICBpZiAoIWhlYWRlckNlbGwuaXNDdXJyZW50U29ydCkgdGhpcy5yZXNldFNvcnQoKTtcbiAgICAgICAgXG4gICAgICAgIGhlYWRlckNlbGwuc2V0U29ydEZsYWcoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogSGFuZGxlcyBzb3J0aW5nIHdoZW4gYSBoZWFkZXIgY2VsbCBpcyBjbGlja2VkLiBVcGRhdGVzIHRoZSBjdXJyZW50IHNvcnQgXG4gICAgICogY29sdW1uIGFuZCBkaXJlY3Rpb24sIHNldHMgdGhlIHNvcnQgZmxhZyBvbiB0aGUgaGVhZGVyIGNlbGwsIGFuZCB0cmlnZ2VycyBhIFxuICAgICAqIHJlLXJlbmRlciBvZiB0aGUgZ3JpZCB0byBkaXNwbGF5IHRoZSBzb3J0ZWQgZGF0YSAobG9jYWwpIG9yIGZldGNoIHNvcnRlZCBcbiAgICAgKiBkYXRhIGZyb20gdGhlIHNlcnZlciAocmVtb3RlKS5cbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudCBDbGljayBldmVudFxuICAgICAqL1xuICAgIGhhbmRsZVNvcnQgPSBhc3luYyAoZXZlbnQpID0+IHtcbiAgICAgICAgY29uc3QgaGVhZGVyQ2VsbCA9IGV2ZW50LmN1cnJlbnRUYXJnZXQuY29udGV4dDtcblxuICAgICAgICB0aGlzLnVwZGF0ZVNvcnRTdGF0ZShoZWFkZXJDZWxsKTtcblxuICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIik7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBSZXNldHMgdGhlIHNvcnQgZmxhZyBvbiB0aGUgY3VycmVudGx5IHNvcnRlZCBjb2x1bW4uXG4gICAgICovXG4gICAgcmVzZXRTb3J0KCkge1xuICAgICAgICBjb25zdCBjZWxsID0gdGhpcy5oZWFkZXJDZWxscy5maW5kKGUgPT4gZS5pc0N1cnJlbnRTb3J0KTtcblxuICAgICAgICBpZiAoY2VsbCAhPT0gdW5kZWZpbmVkKSBjZWxsLnJlbW92ZVNvcnRGbGFnKCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFBlcmZvcm1zIGxvY2FsIHNvcnRpbmcgb24gdGhlIGRhdGEgYXJyYXkuXG4gICAgICogVGhpcyBtZXRob2QgaXMgY2FsbGVkIGR1cmluZyB0aGUgcmVuZGVyIGV2ZW50IGZvciBsb2NhbCBwcm9jZXNzaW5nLlxuICAgICAqL1xuICAgIHJlbmRlckxvY2FsID0gKCkgPT4ge1xuICAgICAgICBpZiAoIXRoaXMuY3VycmVudFNvcnRDb2x1bW4pIHJldHVybjtcblxuICAgICAgICB0aGlzLmNvbnRleHQucGVyc2lzdGVuY2UuZGF0YS5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zb3J0ZXJzW3RoaXMuY3VycmVudFR5cGVdKGFbdGhpcy5jdXJyZW50U29ydENvbHVtbl0sIGJbdGhpcy5jdXJyZW50U29ydENvbHVtbl0sIHRoaXMuY3VycmVudERpcmVjdGlvblxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbn1cblxuU29ydE1vZHVsZS5tb2R1bGVOYW1lID0gXCJzb3J0XCI7XG5cbmV4cG9ydCB7IFNvcnRNb2R1bGUgfTsiLCJpbXBvcnQgeyBHcmlkQ29yZSB9IGZyb20gXCIuL2NvcmUvZ3JpZENvcmUuanNcIjtcbmltcG9ydCB7IENzdk1vZHVsZSB9IGZyb20gXCIuL21vZHVsZXMvZG93bmxvYWQvY3N2TW9kdWxlLmpzXCI7XG5pbXBvcnQgeyBGaWx0ZXJNb2R1bGUgfSBmcm9tIFwiLi9tb2R1bGVzL2ZpbHRlci9maWx0ZXJNb2R1bGUuanNcIjtcbmltcG9ydCB7IFJlZnJlc2hNb2R1bGUgfSBmcm9tIFwiLi9tb2R1bGVzL3JlZnJlc2gvcmVmcmVzaE1vZHVsZS5qc1wiO1xuaW1wb3J0IHsgUm93Q291bnRNb2R1bGUgfSBmcm9tIFwiLi9tb2R1bGVzL3Jvdy9yb3dDb3VudE1vZHVsZS5qc1wiO1xuaW1wb3J0IHsgU29ydE1vZHVsZSB9IGZyb20gXCIuL21vZHVsZXMvc29ydC9zb3J0TW9kdWxlLmpzXCI7XG5cbmNsYXNzIFRhYmxlRGF0YSBleHRlbmRzIEdyaWRDb3JlIHtcbiAgICBjb25zdHJ1Y3Rvcihjb250YWluZXIsIHNldHRpbmdzKSB7XG4gICAgICAgIHN1cGVyKGNvbnRhaW5lciwgc2V0dGluZ3MpO1xuXG4gICAgICAgIGlmIChUYWJsZURhdGEuZGVmYXVsdE9wdGlvbnMuZW5hYmxlRmlsdGVyKSB7XG4gICAgICAgICAgICB0aGlzLmFkZE1vZHVsZXMoRmlsdGVyTW9kdWxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChUYWJsZURhdGEuZGVmYXVsdE9wdGlvbnMuZW5hYmxlU29ydCkge1xuICAgICAgICAgICAgdGhpcy5hZGRNb2R1bGVzKFNvcnRNb2R1bGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3Mucm93Q291bnRJZCkge1xuICAgICAgICAgICAgdGhpcy5hZGRNb2R1bGVzKFJvd0NvdW50TW9kdWxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLnJlZnJlc2hhYmxlSWQpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkTW9kdWxlcyhSZWZyZXNoTW9kdWxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLmNzdkV4cG9ydElkKSB7XG4gICAgICAgICAgICB0aGlzLmFkZE1vZHVsZXMoQ3N2TW9kdWxlKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuVGFibGVEYXRhLmRlZmF1bHRPcHRpb25zID0ge1xuICAgIGVuYWJsZVNvcnQ6IHRydWUsXG4gICAgZW5hYmxlRmlsdGVyOiB0cnVlXG59O1xuXG5leHBvcnQgeyBUYWJsZURhdGEgfTsiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0EsTUFBTSxVQUFVLENBQUM7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLFdBQVcsQ0FBQyxNQUFNLEVBQUU7QUFDeEIsUUFBUSxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU07QUFDNUIsUUFBUSxJQUFJLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRO0FBQ3ZDLFFBQVEsSUFBSSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUks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
