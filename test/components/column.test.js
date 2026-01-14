import { Fixtures } from "../fixtures/fixtures.js";
import { Column } from "../../src/components/column/column.js";
import { expect } from '@esm-bundle/chai';

describe("Column", function() {
    const settings = Fixtures.getSettings();

    describe("constructor", function() { 
        it("sets hasFilter property to true", function() {
            const columnData = { field: "comments", type: "string", filterType: "equals" };

            const feature = new Column(columnData, settings, 0);

            expect(feature.hasFilter).to.be.true;
        });

        it("sets hasFilter property to false when field property is missing", function() {
            const columnData = { type: "string", filterType: "equals" };

            const feature = new Column(columnData, settings, 0);

            expect(feature.hasFilter).to.be.false;
        });

        it("sets filter type of multi select", function() {
            const columnData = { field: "comments", type: "string", filterType: "equals", filterValues: { 1: "one", 2: "two" }, filterMultiSelect: true };

            const feature = new Column(columnData, settings, 0);

            expect(feature.filterElement).to.equal("multi");
        });

        it("sets filter type of select", function() {
            const columnData = { field: "comments", type: "string", filterType: "equals", filterValues: { 1: "one", 2: "two" } };

            const feature = new Column(columnData, settings, 0);

            expect(feature.filterElement).to.equal("select");
            expect(feature.filterValuesRemoteSource).to.be.undefined;
        });

        it("sets filter type of select with filterValuesRemoteSource string property value", function() {
            const columnData = { field: "comments", type: "string", filterType: "equals", filterValues: "some/url" };

            const feature = new Column(columnData, settings, 0);

            expect(feature.filterElement).to.equal("select");
            expect(feature.filterValuesRemoteSource).to.equal("some/url");
        });

        it("sets filter type of input", function() {
            const columnData = { field: "comments", type: "string", filterType: "equals" };

            const feature = new Column(columnData, settings, 0);

            expect(feature.filterElement).to.equal("input");
        });

        it("sets headerFilterEmpty property", function() {
            const column1 = { field: "comments", type: "string", headerFilterEmpty: true };
            const column2 = { field: "hello", headerFilterEmpty: "world" };

            const actual1 = new Column(column1, settings, 0);
            const actual2 = new Column(column2, settings, 1);

            expect(actual1.headerFilterEmpty).to.equal("tabledata-no-header");
            expect(actual2.headerFilterEmpty).to.equal("world");
        });
    });
});