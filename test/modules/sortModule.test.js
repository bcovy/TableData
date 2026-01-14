import { Fixtures } from "../fixtures/fixtures.js";
import { SortModule } from "../../src/modules/sort/sortModule.js";
import { expect } from '@esm-bundle/chai';

describe("SortModule", function() {
    let feature = null;
    const columns = Fixtures.columns(true);

    beforeEach(function() {
        const context = Fixtures.getContext(columns, "", Fixtures.data());

        feature = new SortModule(context);
        feature.initialize();
    });

    describe("constructor", function() { 
        it("should initialize with default values", function () {
            const context = Fixtures.getContext(columns, "", Fixtures.data());
            const sortModule = new SortModule(context);

            expect(sortModule.context).to.equal(context);
            expect(sortModule.headerCells).to.deep.equal([]);
            expect(sortModule.currentSortColumn).to.equal("");
            expect(sortModule.currentDirection).to.equal("");
            expect(sortModule.currentType).to.equal("");
            expect(sortModule.isRemote).to.be.false;
        });
    });

    describe("initialize", function() {
        it("should set isRemote to false for local processing", function () {
            expect(feature.isRemote).to.be.false;
        });

        it("should initialize sorters for local processing", function () {
            expect(feature.sorters).to.exist;
            expect(feature.sorters.number).to.exist;
            expect(feature.sorters.string).to.exist;
            expect(feature.sorters.date).to.exist;
            expect(feature.sorters.datetime).to.exist;
        });

        it("should set isRemote to true for remote processing", function () {
            const context = Fixtures.getContext();
            context.settings.remoteProcessing = true;
            context.settings.remoteSortDefaultColumn = "id";
            context.settings.remoteSortDefaultDirection = "asc";
            const remoteSortModule = new SortModule(context);
            
            remoteSortModule.initialize();

            expect(remoteSortModule.isRemote).to.be.true;
            expect(remoteSortModule.currentSortColumn).to.equal("id");
            expect(remoteSortModule.currentDirection).to.equal("asc");
            expect(remoteSortModule.sorters).to.be.undefined;
        });
    });

    describe("initializeHeaderCells", function() {
        it("should add sort class to header cells", function () {
            expect(feature.headerCells.length).to.equal(5);
            expect(feature.headerCells[0].span.className).to.include("sort");
            expect(feature.headerCells[1].span.className).to.include("sort");
        });

        it("should exclude icon type columns", function () {
            const columnsWithIcon = [
                ...columns,
                { field: "actions", type: "icon" }
            ];
            const context = Fixtures.getContext(columnsWithIcon, "", Fixtures.data());
            const sortModule = new SortModule(context);
            
            sortModule.initialize();

            expect(sortModule.headerCells.length).to.equal(5);
        });
    });

    describe("remoteParams", function() {
        it("should add sort parameters to params object", function () {
            feature.currentSortColumn = "name";
            feature.currentDirection = "asc";

            const params = {};
            const result = feature.remoteParams(params);

            expect(result.sort).to.equal("name");
            expect(result.direction).to.equal("asc");
        });

        it("should return the same params object", function () {
            const params = { page: 1, limit: 10 };
            const result = feature.remoteParams(params);

            expect(result).to.equal(params);
            expect(result.page).to.equal(1);
            expect(result.limit).to.equal(10);
        });
    });

    describe("updateSortState", function() {
        it("should update current sort properties from header cell", function () {
            const headerCell = feature.headerCells[0];
            
            feature.updateSortState(headerCell);

            expect(feature.currentSortColumn).to.equal(headerCell.name);
            expect(feature.currentDirection).to.equal("desc");
            expect(feature.currentType).to.equal(headerCell.type);
        });

        it("should set sort flag on header cell", function () {
            const headerCell = feature.headerCells[0];
            
            feature.updateSortState(headerCell);

            expect(headerCell.isCurrentSort).to.be.true;
        });

        it("should reset previous sort if clicking new column", function () {
            const firstCell = feature.headerCells[0];
            const secondCell = feature.headerCells[1];

            feature.updateSortState(firstCell);
            expect(firstCell.isCurrentSort).to.be.true;

            feature.updateSortState(secondCell);
            expect(firstCell.isCurrentSort).to.be.false;
            expect(secondCell.isCurrentSort).to.be.true;
        });

        it("should toggle direction on same column", function () {
            const headerCell = feature.headerCells[0];

            feature.updateSortState(headerCell);
            expect(feature.currentDirection).to.equal("desc");

            feature.updateSortState(headerCell);
            expect(feature.currentDirection).to.equal("asc");
        });
    });

    describe("handleSort", function() { 
        it("should sort numeric column in desc order", async function () {
            const target = { currentTarget: { context: feature.headerCells[0] } };

            await feature.handleSort(target);

            expect(feature.currentDirection).to.equal("desc");
            expect(feature.context.persistence.data[0].id).to.equal(18);
        });

        it("should sort string column in asc order", async function () {
            const target = { currentTarget: { context: feature.headerCells[1] } };

            await feature.handleSort(target);
            await feature.handleSort(target);

            expect(feature.currentDirection).to.equal("asc");
            expect(feature.context.persistence.data[0].name).to.equal("Abc");
        });

        it("should toggle sort direction on same column", async function () {
            const target = { currentTarget: { context: feature.headerCells[0] } };

            await feature.handleSort(target);
            const firstDirection = feature.currentDirection;
            await feature.handleSort(target);

            expect(feature.currentDirection).to.not.equal(firstDirection);
        });

        it("should trigger render event", async function () {
            const target = { currentTarget: { context: feature.headerCells[0] } };
            let renderTriggered = false;

            feature.context.events.subscribe("render", () => {
                renderTriggered = true;
            }, false);

            await feature.handleSort(target);

            expect(renderTriggered).to.be.true;
        });
    });
    
    describe("resetSort", function() { 
        it("should remove sort flag from previous column", async function () {
            const target = { currentTarget: { context: feature.headerCells[0] } };

            await feature.handleSort(target);
            expect(feature.headerCells[0].isCurrentSort).to.be.true;

            feature.resetSort();
            expect(feature.headerCells[0].isCurrentSort).to.be.false;
        });

        it("should handle when no column is currently sorted", function () {
            expect(() => feature.resetSort()).to.not.throw();
        });

        it("should reset direction to desc", async function () {
            const target = { currentTarget: { context: feature.headerCells[0] } };

            await feature.handleSort(target);
            await feature.handleSort(target);
            expect(feature.headerCells[0].direction).to.equal("asc");

            feature.resetSort();
            expect(feature.headerCells[0].direction).to.equal("desc");
        });
    });

    describe("renderLocal", function() {
        it("should sort data by current sort column and direction", function () {
            feature.currentSortColumn = "id";
            feature.currentType = "number";
            feature.currentDirection = "asc";

            feature.renderLocal();

            expect(feature.context.persistence.data[0].id).to.equal(5);
            expect(feature.context.persistence.data[5].id).to.equal(18);
        });

        it("should sort in descending order", function () {
            feature.currentSortColumn = "id";
            feature.currentType = "number";
            feature.currentDirection = "desc";

            feature.renderLocal();

            expect(feature.context.persistence.data[0].id).to.equal(18);
            expect(feature.context.persistence.data[5].id).to.equal(5);
        });

        it("should sort string data", function () {
            feature.currentSortColumn = "name";
            feature.currentType = "string";
            feature.currentDirection = "asc";

            feature.renderLocal();

            expect(feature.context.persistence.data[0].name).to.equal("Abc");
            expect(feature.context.persistence.data[5].name).to.equal("Lance Mike");
        });

        it("should sort date data", function () {
            feature.currentSortColumn = "pcoe";
            feature.currentType = "date";
            feature.currentDirection = "asc";

            feature.renderLocal();

            expect(feature.context.persistence.data[0].pcoe).to.equal("2002-09-25");
        });

        it("should not sort if currentSortColumn is not set", function () {
            feature.currentSortColumn = "";
            const originalData = [...feature.context.persistence.data];

            feature.renderLocal();

            expect(feature.context.persistence.data).to.deep.equal(originalData);
        });
    });

    describe("moduleName", function() {
        it("should have correct module name", function () {
            expect(SortModule.moduleName).to.equal("sort");
        });
    });
});