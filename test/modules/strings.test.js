import stringSorter from "../../src/modules/sort/sorters/string.js";
import { expect } from '@esm-bundle/chai';

describe("stringSorter", function() {
    it("should return 0 when both strings are equal", function() {
        const result = stringSorter("apple", "apple", "asc");

        expect(result).to.equal(0);
    });

    it("should return 1 when first string is greater in asc direction", function() {
        const result = stringSorter("zebra", "apple", "asc");

        expect(result).to.equal(1);
    });

    it("should return -1 when first string is less in asc direction", function() {
        const result = stringSorter("apple", "zebra", "asc");

        expect(result).to.equal(-1);
    });

    it("should return -1 when first string is greater in desc direction", function() {
        const result = stringSorter("zebra", "apple", "desc");

        expect(result).to.equal(-1);
    });

    it("should return 1 when first string is less in desc direction", function() {
        const result = stringSorter("apple", "zebra", "desc");

        expect(result).to.equal(1);
    });

    it("should handle case-insensitive comparison", function() {
        const result = stringSorter("Apple", "apple", "asc");

        expect(result).to.equal(0);
    });

    it("should handle mixed case strings correctly", function() {
        const result = stringSorter("ZEBRA", "apple", "asc");

        expect(result).to.equal(1);
    });

    it("should handle empty string as less than non-empty string", function() {
        const result = stringSorter("", "apple", "asc");

        expect(result).to.equal(-1);
    });

    it("should handle null as less than non-empty string", function() {
        const result = stringSorter(null, "apple", "asc");

        expect(result).to.equal(-1);
    });

    it("should handle undefined as less than non-empty string", function() {
        const result = stringSorter(undefined, "apple", "asc");

        expect(result).to.equal(-1);
    });

    it("should return 0 when both strings are empty", function() {
        const result = stringSorter("", "", "asc");

        expect(result).to.equal(0);
    });

    it("should return 0 when both strings are null", function() {
        const result = stringSorter(null, null, "asc");

        expect(result).to.equal(0);
    });

    it("should handle strings with spaces correctly", function() {
        const result = stringSorter("apple pie", "apple", "asc");

        expect(result).to.equal(1);
    });

    it("should handle numeric strings correctly", function() {
        const result = stringSorter("123", "456", "asc");

        expect(result).to.equal(-1);
    });

    it("should handle empty string in desc direction", function() {
        const result = stringSorter("", "apple", "desc");

        expect(result).to.equal(1);
    });
});