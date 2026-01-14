import numberSorter from "../../src/modules/sort/sorters/number.js";
import { expect } from '@esm-bundle/chai';

describe("numberSorter", function() {
    it("should return 0 when both numbers are equal", function() {
        const result = numberSorter(5, 5, "asc");

        expect(result).to.equal(0);
    });

    it("should return 1 when first number is greater in asc direction", function() {
        const result = numberSorter(10, 5, "asc");

        expect(result).to.equal(1);
    });

    it("should return -1 when first number is less in asc direction", function() {
        const result = numberSorter(3, 8, "asc");

        expect(result).to.equal(-1);
    });

    it("should return -1 when first number is greater in desc direction", function() {
        const result = numberSorter(10, 5, "desc");

        expect(result).to.equal(-1);
    });

    it("should return 1 when first number is less in desc direction", function() {
        const result = numberSorter(3, 8, "desc");

        expect(result).to.equal(1);
    });

    it("should handle negative numbers correctly in asc direction", function() {
        const result = numberSorter(-5, -10, "asc");

        expect(result).to.equal(1);
    });

    it("should handle negative numbers correctly in desc direction", function() {
        const result = numberSorter(-5, -10, "desc");

        expect(result).to.equal(-1);
    });

    it("should handle zero correctly", function() {
        const result = numberSorter(0, 5, "asc");

        expect(result).to.equal(-1);
    });

    it("should handle decimal numbers correctly", function() {
        const result = numberSorter(3.14, 3.15, "asc");

        expect(result).to.equal(-1);
    });

    it("should handle large numbers correctly", function() {
        const result = numberSorter(1000000, 999999, "asc");

        expect(result).to.equal(1);
    });

    it("should handle mixed positive and negative numbers", function() {
        const result = numberSorter(5, -5, "asc");

        expect(result).to.equal(1);
    });
});