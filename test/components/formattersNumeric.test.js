import { FormatNumeric } from "../../src/components/cell/formatters/numeric.js";
import { expect } from '@esm-bundle/chai';

describe("Formatters numeric", function () {
    it("formats decimal", function () {
        const column = { field: "sales", formatter: "decimal", formatterParams: { precision: 3 } };
        const actual = FormatNumeric.apply({ id: 7, sales: 1125.125 }, column, "decimal");

        expect(actual).to.equal("1,125.125");
    });

    it("formats currency", function () {
         const column = { field: "sales", formatter: "money", formatterParams: { precision: 2 } };
        const actual = FormatNumeric.apply({ id: 7, sales: 1000125.125 }, column, "currency");

        expect(actual).to.equal("$1,000,125.13");
    });

    it("formats decimal using default settings", function () {
        const column = { field: "sales", formatter: "decimal" };
        const actual = FormatNumeric.apply({ id: 7, sales: 1125.125 }, column);

        expect(actual).to.equal("1,125.13");
    });
});