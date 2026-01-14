export default {
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