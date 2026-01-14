import { DateHelper } from "../../src/helpers/dateHelper.js";
import { expect } from '@esm-bundle/chai';

describe("DateHelper", function () {
    describe("parseDate", function () {
        it("from date only string", function () {
            const actual = DateHelper.parseDate("2002-12-22");

            expect(actual.getMonth()).to.equal(11);
            expect(actual.getDate()).to.equal(22);
            expect(actual.getFullYear()).to.equal(2002);
        });

        it("rom date time string", function () {
            const actual = DateHelper.parseDate("2002-12-22 13:31:01");

            expect(actual.getHours()).to.equal(13);
            expect(actual.getMinutes()).to.equal(31);
        });

        it("returns empty string when input is invalid", function () {
            const actual = DateHelper.parseDate("hello");

            expect(actual).to.equal("");
        });

        it("transforms date only string into local timezone date", function () {
            const actual = DateHelper.parseDate("2024-10-01");

            expect(actual.getMonth()).to.equal(9);
            expect(actual.getDate()).to.equal(1);
            expect(actual.getFullYear()).to.equal(2024);
        });
    });

    describe("parseDateOnly", function () { 
        it("transforms date only string into local timezone date with midnight time", function () {
            const actual = DateHelper.parseDateOnly("2024-10-01");

            expect(actual.getMonth()).to.equal(9);
            expect(actual.getDate()).to.equal(1);
            expect(actual.getFullYear()).to.equal(2024);
        });
    });

    describe("isDate", function () {
        it("identifies correct types", function () {
            const stringFail = DateHelper.isDate("hello");
            const datePass = DateHelper.isDate(new Date());

            expect(stringFail).to.be.false;
            expect(datePass).to.be.true;
        });
    });
});