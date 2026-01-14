import dateSorter from "../../src/modules/sort/sorters/date.js";
import { expect } from '@esm-bundle/chai';

describe("dateSorter", function() {
    it("should return 0 when both dates are equal", function() {
        const result = dateSorter("2023-01-15", "2023-01-15", "asc");

        expect(result).to.equal(0);
    });

    it("should return 1 when first date is greater in asc direction", function() {
        const result = dateSorter("2023-01-20", "2023-01-15", "asc");

        expect(result).to.equal(1);
    });

    it("should return -1 when first date is less in asc direction", function() {
        const result = dateSorter("2023-01-10", "2023-01-15", "asc");

        expect(result).to.equal(-1);
    });

    it("should return -1 when first date is greater in desc direction", function() {
        const result = dateSorter("2023-01-20", "2023-01-15", "desc");

        expect(result).to.equal(-1);
    });

    it("should return 1 when first date is less in desc direction", function() {
        const result = dateSorter("2023-01-10", "2023-01-15", "desc");

        expect(result).to.equal(1);
    });

    it("should handle null/invalid first date as less than valid date", function() {
        const result = dateSorter("invalid", "2023-01-15", "asc");

        expect(result).to.equal(-1);
    });

    it("should handle null/invalid second date as greater than valid date", function() {
        const result = dateSorter("2023-01-15", "invalid", "asc");

        expect(result).to.equal(1);
    });

    it("should return 0 when both dates are invalid", function() {
        const result = dateSorter("invalid1", "invalid2", "asc");

        expect(result).to.equal(0);
    });

    it("should handle empty string as invalid date", function() {
        const result = dateSorter("", "2023-01-15", "asc");

        expect(result).to.equal(-1);
    });

    it("should handle null as invalid date", function() {
        const result = dateSorter(null, "2023-01-15", "asc");

        expect(result).to.equal(-1);
    });

    it("should handle undefined as invalid date", function() {
        const result = dateSorter(undefined, "2023-01-15", "asc");

        expect(result).to.equal(-1);
    });

    it("should sort dates with time component correctly", function() {
        const result = dateSorter("2023-01-15T10:30:00", "2023-01-15T10:20:00", "asc");

        expect(result).to.equal(1);
    });

    it("should return 0 in desc direction when both dates are invalid", function() {
        const result = dateSorter("invalid1", "invalid2", "desc");

        expect(result).to.equal(0);
    });
});