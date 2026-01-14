import { ColumnManager } from "../../src/components/column/columnManager.js";
import { Fixtures } from "../fixtures/fixtures.js";
import { expect } from '@esm-bundle/chai';

describe("ColumnManager", function() {
    const settings = Fixtures.getSettings();

    describe("constructor", function() { 
        it("creates column objects", function () {
            const feature = new ColumnManager(Fixtures.columns(), settings);

            expect(feature.columns.length).to.equal(5);
        });

        it("creates header columns with even widths", function () {
            const s = Fixtures.getSettings();
            s.tableEvenColumnWidths = true;
            const feature = new ColumnManager(Fixtures.columns(), s);

            const actual = feature.columns[0];

            expect(actual.headerCell.element.style.width).to.equal("20%");
        });

        it("creates header columns with even widths skipping user input column", function () {
            const s = Fixtures.getSettings();
            s.tableEvenColumnWidths = true;
            const columns = Fixtures.columns();
            columns[0].width = "1%"; // Set width for the first column
            const feature = new ColumnManager(columns, s);

            const actual = feature.columns[1];

            expect(actual.headerCell.element.style.width).to.equal("24.75%");
        });
    });

    describe("getters", function() { 
        it("columns returns results by internal array index order", function () {
            const feature = new ColumnManager(Fixtures.columns(true), settings);
            
            const actual = feature.columns;

            expect(actual[0].field).to.equal("id");
            expect(actual[3].field).to.equal("task");
        });

        it("hasHeaderFilters returns true when header filters are present", function () {
            const feature = new ColumnManager(Fixtures.columns(true), settings);
            
            expect(feature.hasHeaderFilters).to.be.true;
        });
    });

    describe("addColumn", function() {  
        it("adds a new column to the end", function () {
            const feature = new ColumnManager(Fixtures.columns(), settings);
            const newCol = { field: "newCol", type: "number",  filterType: "equals"};

            feature.addColumn(newCol);

            expect(feature.columns.length).to.equal(6);
            expect(feature.columns[5].field).to.equal("newCol");
        });

        it("adds a new column to the index position", function () {
            const feature = new ColumnManager(Fixtures.columns(), settings);
            const newCol = { field: "newCol", type: "number",  filterType: "equals"};

            feature.addColumn(newCol, 1);

            expect(feature.columns.length).to.equal(6);
            expect(feature.columns[1].field).to.equal("newCol");
        });
    });
});