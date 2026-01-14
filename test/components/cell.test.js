import { Cell } from "../../src/components/cell/cell.js";
import { MockModule } from "../fixtures/mockModule.js";
import { Fixtures } from "../fixtures/fixtures.js";
import { expect } from '@esm-bundle/chai';

describe("Cell", function() {
    let modules = {};
    let rowElement;

    beforeEach(function() {
        modules = {};
        rowElement = document.createElement("tr");
    });

    describe("Default cell creation", function() {
        it("should create a td element", function() {
            const data = { id: 18, name: "Amy" };
            const column = { field: "name", type: "string" };

            const cell = new Cell(data, column, modules, rowElement);

            expect(cell.element.tagName).to.equal("TD");
        });

        it("should set innerText when no formatter is specified", function() {
            const data = { id: 18, name: "Amy" };
            const column = { field: "name", type: "string" };

            const cell = new Cell(data, column, modules, rowElement);

            expect(cell.element.innerText).to.equal("Amy");
        });

        it("should handle undefined field values with empty string", function() {
            const data = { id: 18 };
            const column = { field: "name", type: "string" };

            const cell = new Cell(data, column, modules, rowElement);

            expect(cell.element.innerText).to.equal("");
        });

        it("should handle null field values with empty string", function() {
            const data = { id: 18, name: null };
            const column = { field: "name", type: "string" };

            const cell = new Cell(data, column, modules, rowElement);

            expect(cell.element.innerText).to.equal("");
        });
    });

    describe("Built-in formatters", function() {
        it("should format date values", function() {
            const data = { id: 18, pcoe: "2002-12-22" };
            const settings = Fixtures.getSettings();
            const column = { field: "pcoe", type: "date", formatter: "date", settings: settings };

            const cell = new Cell(data, column, modules, rowElement);

            expect(cell.element.innerText).to.not.be.empty;
        });

        it("should format datetime values", function() {
            const data = { id: 18, task: "2002-12-22T08:31:01" };
            const settings = Fixtures.getSettings();
            const column = { field: "task", type: "datetime", formatter: "datetime", settings: settings };

            const cell = new Cell(data, column, modules, rowElement);

            expect(cell.element.innerText).to.not.be.empty;
        });

        it("should format money values", function() {
            const data = { id: 18, price: 1234.56 };
            const settings = Fixtures.getSettings();
            const column = { field: "price", type: "number", formatter: "money", settings: settings };

            const cell = new Cell(data, column, modules, rowElement);

            expect(cell.element.innerText).to.not.be.empty;
        });

        it("should format decimal values with default parameters", function() {
            const data = { id: 18, price: 1234.5678 };
            const settings = Fixtures.getSettings();
            const column = { field: "price", type: "number", formatter: "decimal", settings: settings };

            const cell = new Cell(data, column, modules, rowElement);

            expect(cell.element.innerText).to.not.be.empty;
        });
        
        it("should format percent values with custom precision", function() {
            const data = { id: 18, percentage: 0.95 };
            const settings = Fixtures.getSettings();
            const column = { 
                field: "percentage", 
                type: "number", 
                formatter: "percent",
                formatterParams: { precision: 1 },
                settings: settings 
            };

            const cell = new Cell(data, column, modules, rowElement);

            expect(cell.element.innerText).to.not.be.empty;
        });

        it("should format link values as element", function() {
            const data = { id: 18, website: "https://example.com" };
            const column = { 
                field: "website", 
                type: "string", 
                formatter: "link",
                formatterParams: { field: "website", text: "Visit Site" }
            };

            const cell = new Cell(data, column, modules, rowElement);

            expect(cell.element.children.length).to.be.greaterThan(0);
        });

        it("should format star rating as element", function() {
            const data = { id: 18, rating: 4 };
            const column = { 
                field: "rating", 
                type: "number", 
                formatter: "star"
            };

            const cell = new Cell(data, column, modules, rowElement);

            expect(cell.element.children.length).to.be.greaterThan(0);
        });

        it("should use default content for unknown formatter", function() {
            const data = { id: 18, name: "Amy" };
            const column = { field: "name", type: "string", formatter: "unknownFormatter" };

            const cell = new Cell(data, column, modules, rowElement);

            expect(cell.element.innerText).to.equal("Amy");
        });
    });

    describe("Custom function formatter", function() {
        it("should apply custom formatter function", function() {
            const data = { id: 18, name: "Amy" };
            const customFormatter = (rowData, params, element, row) => {
                const span = document.createElement("span");
                span.innerText = rowData.name.toUpperCase();
                return span;
            };
            const column = { field: "name", type: "string", formatter: customFormatter };

            const cell = new Cell(data, column, modules, rowElement);

            expect(cell.element.children.length).to.equal(1);
            expect(cell.element.firstChild.innerText).to.equal("AMY");
        });

        it("should pass formatterParams to custom function", function() {
            const data = { id: 18, name: "Amy" };
            let receivedParams;
            const customFormatter = (rowData, params) => {
                receivedParams = params;
                return document.createTextNode("test");
            };
            const params = { prefix: "Ms. " };
            const column = { 
                field: "name", 
                type: "string", 
                formatter: customFormatter,
                formatterParams: params
            };

            const cell = new Cell(data, column, modules, rowElement);

            expect(receivedParams).to.equal(params);
        });

        it("should pass cell element and row to custom function", function() {
            const data = { id: 18, name: "Amy" };
            let receivedElement, receivedRow;
            const customFormatter = (rowData, params, element, row) => {
                receivedElement = element;
                receivedRow = row;
                return document.createTextNode("test");
            };
            const column = { field: "name", type: "string", formatter: customFormatter };

            const cell = new Cell(data, column, modules, rowElement);

            expect(receivedElement).to.equal(cell.element);
            expect(receivedRow).to.equal(rowElement);
        });
    });

    describe("Module formatter", function() {
        it("should use module to format cell text", function () {
            const data = { id: 18, name: "Amy", pcoe: "2002-12-22", task: "2002-12-22T8:31:01", comments: "comment 1" };
            const column = { field: "name", type: "string", formatter: "module", formatterModuleName: MockModule.moduleName };
            modules[MockModule.moduleName] = new MockModule({ context: "empty"});
            modules[MockModule.moduleName].initialize();

            const cell = new Cell(data, column, modules, rowElement);

            expect(cell.element.innerText).to.equal("hello world");
        });

        it("should handle missing module gracefully", function() {
            const data = { id: 18, name: "Amy" };
            const column = { 
                field: "name", 
                type: "string", 
                formatter: "module", 
                formatterModuleName: "nonExistentModule" 
            };
            const consoleWarnStub = [];
            const originalWarn = console.warn;
            console.warn = (...args) => consoleWarnStub.push(args);

            const cell = new Cell(data, column, modules, rowElement);

            console.warn = originalWarn;
            expect(consoleWarnStub.length).to.equal(1);
            expect(consoleWarnStub[0][0]).to.include("not found");
            expect(cell.element.innerText).to.equal("Amy");
        });

        it("should handle undefined modules object gracefully", function() {
            const data = { id: 18, name: "Amy" };
            const column = { 
                field: "name", 
                type: "string", 
                formatter: "module", 
                formatterModuleName: "someModule" 
            };
            const consoleWarnStub = [];
            const originalWarn = console.warn;
            console.warn = (...args) => consoleWarnStub.push(args);

            const cell = new Cell(data, column, undefined, rowElement);

            console.warn = originalWarn;
            expect(consoleWarnStub.length).to.equal(1);
            expect(cell.element.innerText).to.equal("Amy");
        });
    });

    describe("Tooltip functionality", function() {
        it("should not apply tooltip when tooltipField is not specified", function() {
            const data = { id: 18, name: "Amy" };
            const column = { field: "name", type: "string" };

            const cell = new Cell(data, column, modules, rowElement);

            expect(cell.element.querySelector('[data-tooltip]')).to.be.null;
        });

        it("should apply tooltip to text content", function() {
            const data = { id: 18, name: "Amy", nameTooltip: "Amy Johnson" };
            const column = { 
                field: "name", 
                type: "string",
                tooltipField: "nameTooltip",
                tooltipLayout: "tabledata-tooltip-right"
            };

            const cell = new Cell(data, column, modules, rowElement);

            const tooltipElement = cell.element.querySelector('[data-tooltip]');
            expect(tooltipElement).to.not.be.null;
            expect(tooltipElement.dataset.tooltip).to.equal("Amy Johnson");
            expect(tooltipElement.classList.contains("tabledata-tooltip-right")).to.be.true;
        });

        it("should apply tooltip to element content", function() {
            const data = { id: 18, website: "https://example.com", siteTooltip: "Company Website" };
            const column = { 
                field: "website", 
                type: "string", 
                formatter: "link",
                formatterParams: { field: "website", text: "Visit Site" },
                tooltipField: "siteTooltip",
                tooltipLayout: "tabledata-tooltip-left"
            };

            const cell = new Cell(data, column, modules, rowElement);

            const tooltipElement = cell.element.querySelector('[data-tooltip]');
            expect(tooltipElement).to.not.be.null;
            expect(tooltipElement.dataset.tooltip).to.equal("Company Website");
            expect(tooltipElement.classList.contains("tabledata-tooltip-left")).to.be.true;
        });

        it("should not apply tooltip when content is null", function() {
            const data = { id: 18, name: "Amy", nameTooltip: null };
            const column = { 
                field: "name", 
                type: "string",
                tooltipField: "nameTooltip",
                tooltipLayout: "tabledata-tooltip-right"
            };

            const cell = new Cell(data, column, modules, rowElement);

            expect(cell.element.querySelector('[data-tooltip]')).to.be.null;
        });

        it("should not apply tooltip when content is empty string", function() {
            const data = { id: 18, name: "Amy", nameTooltip: "" };
            const column = { 
                field: "name", 
                type: "string",
                tooltipField: "nameTooltip",
                tooltipLayout: "tabledata-tooltip-right"
            };

            const cell = new Cell(data, column, modules, rowElement);

            expect(cell.element.querySelector('[data-tooltip]')).to.be.null;
        });

        it("should wrap text content in span for tooltip", function() {
            const data = { id: 18, name: "Amy", nameTooltip: "Full Name" };
            const column = { 
                field: "name", 
                type: "string",
                tooltipField: "nameTooltip",
                tooltipLayout: "tabledata-tooltip-right"
            };

            const cell = new Cell(data, column, modules, rowElement);

            expect(cell.element.firstElementChild.tagName).to.equal("SPAN");
            expect(cell.element.firstElementChild.innerText).to.equal("Amy");
        });
    });

    describe("Combined features", function() {
        it("should apply both formatter and tooltip", function() {
            const data = { id: 18, price: 1234.56, priceTooltip: "Base price before tax" };
            const settings = Fixtures.getSettings();
            const column = { 
                field: "price", 
                type: "number", 
                formatter: "money",
                settings: settings,
                tooltipField: "priceTooltip",
                tooltipLayout: "tabledata-tooltip-right"
            };

            const cell = new Cell(data, column, modules, rowElement);

            expect(cell.element.innerText).to.not.be.empty;
            const tooltipElement = cell.element.querySelector('[data-tooltip]');
            expect(tooltipElement).to.not.be.null;
            expect(tooltipElement.dataset.tooltip).to.equal("Base price before tax");
        });

        it("should handle numeric zero value correctly", function() {
            const data = { id: 18, rating: 0 };
            const column = { field: "rating", type: "number" };

            const cell = new Cell(data, column, modules, rowElement);

            expect(cell.element.innerText).to.equal("0");
        });

        it("should handle boolean values", function() {
            const data = { id: 18, active: true };
            const column = { field: "active", type: "boolean" };

            const cell = new Cell(data, column, modules, rowElement);

            expect(cell.element.innerText).to.equal("true");
        });
    });
});