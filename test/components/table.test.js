import { Table } from "../../src/components/table/table.js";
import { Fixtures } from "../fixtures/fixtures.js";
import { expect } from '@esm-bundle/chai';

describe("Table", function () {
    let feature;
    const columns = Fixtures.columns();

    beforeEach(function() {
        const context = Fixtures.getContext(columns, "", Fixtures.data());

        feature = new Table(context);
    });

    describe("constructor", function () {
        it("applies table style settings", function () {
            const context = Fixtures.createContext(columns, 
                { tableStyleSettings: { backgroundColor: "red", border: "2px solid blue" } }, Fixtures.data());

            feature = new Table(context);

            expect(feature.table.style.backgroundColor).to.equal("red");
            expect(feature.table.style.border).to.equal("2px solid blue");
        });
    });

    describe("renderRows", function () {
        it("sets row count from data set and creates element rows", function () {
            feature.renderRows(Fixtures.data());

            const actual = feature.tbody.querySelectorAll("tr");

            expect(feature.rowCount).to.equal(6);
            expect(actual.length).to.equal(6);
        });

        it("sets row count from input and creates element rows", function () {
            feature.renderRows(Fixtures.data(), 7);

            const actual = feature.tbody.querySelectorAll("tr");

            expect(feature.rowCount).to.equal(7);
            expect(actual.length).to.equal(6);
        });

        it("does not render rows when data set is empty", function () {
            feature.renderRows(null, 7);

            const actual = feature.tbody.querySelectorAll("tr");

            expect(feature.rowCount).to.equal(0);
            expect(actual.length).to.equal(0);
        });
    });
});