"use strict";
/* tslint:disable quotemark */
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var channel_1 = require("../../src/channel");
var log = require("../../src/log");
var type_1 = require("../../src/type");
var util_1 = require("../util");
describe('FacetModel', function () {
    describe('initFacet', function () {
        it('should drop unsupported channel and throws warning', log.wrap(function (localLogger) {
            var model = util_1.parseFacetModel({
                facet: ({
                    shape: { field: 'a', type: 'quantitative' }
                }),
                spec: {
                    mark: 'point',
                    encoding: {}
                }
            });
            chai_1.assert.equal(model.facet['shape'], undefined);
            chai_1.assert.equal(localLogger.warns[0], log.message.incompatibleChannel(channel_1.SHAPE, 'facet'));
        }));
        it('should drop channel without field and value and throws warning', log.wrap(function (localLogger) {
            var model = util_1.parseFacetModel({
                facet: {
                    row: { type: 'ordinal' }
                },
                spec: {
                    mark: 'point',
                    encoding: {}
                }
            });
            chai_1.assert.equal(model.facet.row, undefined);
            chai_1.assert.equal(localLogger.warns[0], log.message.emptyFieldDef({ type: type_1.ORDINAL }, channel_1.ROW));
        }));
        it('should drop channel without field and value and throws warning', log.wrap(function (localLogger) {
            var model = util_1.parseFacetModel({
                facet: {
                    row: { field: 'a', type: 'quantitative' }
                },
                spec: {
                    mark: 'point',
                    encoding: {}
                }
            });
            chai_1.assert.deepEqual(model.facet.row, { field: 'a', type: 'quantitative' });
            chai_1.assert.equal(localLogger.warns[0], log.message.facetChannelShouldBeDiscrete(channel_1.ROW));
        }));
    });
    describe('parseAxisAndHeader', function () {
        // TODO: add more tests
        // - correctly join title for nested facet
        // - correctly generate headers with right labels and axes
        it('applies text format to the fieldref of a temporal field', function () {
            var model = util_1.parseFacetModelWithScale({
                facet: {
                    column: { timeUnit: 'year', field: 'date', type: 'ordinal' }
                },
                spec: {
                    mark: 'point',
                    encoding: {
                        x: { field: 'b', type: 'quantitative' },
                        y: { field: 'c', type: 'quantitative' }
                    }
                }
            });
            model.parseAxisAndHeader();
            var headerMarks = model.assembleHeaderMarks();
            var columnHeader = headerMarks.filter(function (d) {
                return d.name === "column_header";
            })[0];
            chai_1.assert(columnHeader.title.text.signal, "timeFormat(parent[\"year_date\"], '%Y')");
        });
        it('applies number format for fieldref of a quantitative field', function () {
            var model = util_1.parseFacetModelWithScale({
                facet: {
                    column: { field: 'a', type: 'quantitative', format: 'd' }
                },
                spec: {
                    mark: 'point',
                    encoding: {
                        x: { field: 'b', type: 'quantitative' },
                        y: { field: 'c', type: 'quantitative' }
                    }
                }
            });
            model.parseAxisAndHeader();
            var headerMarks = model.assembleHeaderMarks();
            var columnHeader = headerMarks.filter(function (d) {
                return d.name === "column_header";
            })[0];
            chai_1.assert(columnHeader.title.text.signal, "format(parent[\"a\"], 'd')");
        });
        it('ignores number format for fieldref of a binned field', function () {
            var model = util_1.parseFacetModelWithScale({
                facet: {
                    column: { bin: true, field: 'a', type: 'quantitative' }
                },
                spec: {
                    mark: 'point',
                    encoding: {
                        x: { field: 'b', type: 'quantitative' },
                        y: { field: 'c', type: 'quantitative' }
                    }
                }
            });
            model.parseAxisAndHeader();
            var headerMarks = model.assembleHeaderMarks();
            var columnHeader = headerMarks.filter(function (d) {
                return d.name === "column_header";
            })[0];
            chai_1.assert(columnHeader.title.text.signal, "parent[\"a\"]");
        });
    });
    describe('parseScale', function () {
        it('should correctly set scale component for a model', function () {
            var model = util_1.parseFacetModelWithScale({
                facet: {
                    row: { field: 'a', type: 'quantitative' }
                },
                spec: {
                    mark: 'point',
                    encoding: {
                        x: { field: 'b', type: 'quantitative' }
                    }
                }
            });
            chai_1.assert(model.component.scales['x']);
        });
        it('should create independent scales if resolve is set to independent', function () {
            var model = util_1.parseFacetModelWithScale({
                facet: {
                    row: { field: 'a', type: 'quantitative' }
                },
                spec: {
                    mark: 'point',
                    encoding: {
                        x: { field: 'b', type: 'quantitative' }
                    }
                },
                resolve: {
                    scale: {
                        x: 'independent'
                    }
                }
            });
            chai_1.assert(!model.component.scales['x']);
        });
    });
    describe('assembleHeaderMarks', function () {
        it('should sort headers in ascending order', function () {
            var model = util_1.parseFacetModelWithScale({
                facet: {
                    column: { field: 'a', type: 'quantitative', format: 'd' }
                },
                spec: {
                    mark: 'point',
                    encoding: {
                        x: { field: 'b', type: 'quantitative' },
                        y: { field: 'c', type: 'quantitative' }
                    }
                }
            });
            model.parseAxisAndHeader();
            var headerMarks = model.assembleHeaderMarks();
            var columnHeader = headerMarks.filter(function (d) {
                return d.name === "column_header";
            })[0];
            chai_1.assert.deepEqual(columnHeader.sort, { field: 'datum["a"]', order: 'ascending' });
        });
    });
    describe('assembleGroup', function () {
        it('includes a columns fields in the encode block for facet with column that parent is also a facet.', function () {
            var model = util_1.parseFacetModelWithScale({
                facet: {
                    column: { field: 'a', type: 'quantitative' }
                },
                spec: {
                    facet: {
                        column: { field: 'c', type: 'quantitative' }
                    },
                    spec: {
                        mark: 'point',
                        encoding: {
                            x: { field: 'b', type: 'quantitative' }
                        }
                    }
                }
                // TODO: remove "any" once we support all facet listed in https://github.com/vega/vega-lite/issues/2760
            });
            model.parseData();
            var group = model.child.assembleGroup([]);
            chai_1.assert.deepEqual(group.encode.update.columns, { field: 'distinct_c' });
        });
    });
    describe('assembleLayout', function () {
        it('returns a layout with a column signal for facet with column', function () {
            var model = util_1.parseFacetModelWithScale({
                facet: {
                    column: { field: 'a', type: 'quantitative' }
                },
                spec: {
                    mark: 'point',
                    encoding: {
                        x: { field: 'b', type: 'quantitative' }
                    }
                }
            });
            var layout = model.assembleLayout();
            chai_1.assert.deepEqual(layout, {
                padding: { row: 10, column: 10 },
                offset: 10,
                columns: {
                    signal: "length(data('column_domain'))"
                },
                bounds: 'full',
                align: 'all'
            });
        });
        it('returns a layout without a column signal for facet with column that parent is also a facet.', function () {
            var model = util_1.parseFacetModelWithScale({
                facet: {
                    column: { field: 'a', type: 'quantitative' }
                },
                spec: {
                    facet: {
                        column: { field: 'c', type: 'quantitative' }
                    },
                    spec: {
                        mark: 'point',
                        encoding: {
                            x: { field: 'b', type: 'quantitative' }
                        }
                    }
                }
                // TODO: remove "any" once we support all facet listed in https://github.com/vega/vega-lite/issues/2760
            });
            var layout = model.child.assembleLayout();
            chai_1.assert.deepEqual(layout.columns, undefined);
        });
        it('returns a layout with header band if child spec is also a facet', function () {
            var model = util_1.parseFacetModelWithScale({
                "$schema": "https://vega.github.io/schema/vega-lite/v2.json",
                "data": { "url": "data/cars.json" },
                "facet": { "row": { "field": "Origin", "type": "ordinal" } },
                "spec": {
                    "facet": { "row": { "field": "Cylinders", "type": "ordinal" } },
                    "spec": {
                        "mark": "point",
                        "encoding": {
                            "x": { "field": "Horsepower", "type": "quantitative" },
                            "y": { "field": "Acceleration", "type": "quantitative" }
                        }
                    }
                }
                // TODO: remove "any" once we support all facet listed in https://github.com/vega/vega-lite/issues/2760
            });
            model.parseLayoutSize();
            model.parseAxisAndHeader();
            var layout = model.assembleLayout();
            chai_1.assert.deepEqual(layout.headerBand, { row: 0.5 });
        });
    });
    describe('assembleMarks', function () {
        it('should add cross and sort if we facet by multiple dimensions', function () {
            var model = util_1.parseFacetModelWithScale({
                facet: {
                    row: { field: 'a', type: 'ordinal' },
                    column: { field: 'b', type: 'ordinal' }
                },
                spec: {
                    mark: 'point',
                    encoding: {
                        x: { field: 'c', type: 'quantitative' }
                    }
                }
            });
            model.parse();
            var marks = model.assembleMarks();
            chai_1.assert(marks[0].from.facet.aggregate.cross);
            chai_1.assert.deepEqual(marks[0].sort, {
                field: [
                    'datum["a"]',
                    'datum["b"]'
                ],
                order: [
                    'ascending',
                    'ascending'
                ]
            });
        });
        it('should add calculate cardinality for independent scales', function () {
            var model = util_1.parseFacetModelWithScale({
                facet: {
                    row: { field: 'a', type: 'ordinal' }
                },
                spec: {
                    mark: 'rect',
                    encoding: {
                        x: { field: 'b', type: 'nominal' },
                        y: { field: 'c', type: 'nominal' }
                    }
                },
                resolve: {
                    scale: {
                        x: 'independent',
                        y: 'independent'
                    }
                }
            });
            model.parse();
            var marks = model.assembleMarks();
            chai_1.assert.deepEqual(marks[0].from.facet.aggregate, {
                fields: ['b', 'c'],
                ops: ['distinct', 'distinct']
            });
        });
        it('should add calculate cardinality for child column facet', function () {
            var model = util_1.parseFacetModelWithScale({
                facet: {
                    column: { field: 'a', type: 'quantitative' }
                },
                spec: {
                    facet: {
                        column: { field: 'c', type: 'quantitative' }
                    },
                    spec: {
                        mark: 'point',
                        encoding: {
                            x: { field: 'b', type: 'quantitative' }
                        }
                    }
                }
                // TODO: remove "any" once we support all facet listed in https://github.com/vega/vega-lite/issues/2760
            });
            model.parse();
            var marks = model.assembleMarks();
            chai_1.assert.deepEqual(marks[0].from.facet.aggregate, {
                fields: ['c'],
                ops: ['distinct']
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmFjZXQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Rlc3QvY29tcGlsZS9mYWNldC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw4QkFBOEI7O0FBRTlCLDZCQUE0QjtBQUM1Qiw2Q0FBNkM7QUFJN0MsbUNBQXFDO0FBQ3JDLHVDQUF1QztBQUV2QyxnQ0FBa0U7QUFFbEUsUUFBUSxDQUFDLFlBQVksRUFBRTtJQUNyQixRQUFRLENBQUMsV0FBVyxFQUFFO1FBQ3BCLEVBQUUsQ0FBQyxvREFBb0QsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQUMsV0FBVztZQUM1RSxJQUFNLEtBQUssR0FBRyxzQkFBZSxDQUFDO2dCQUM1QixLQUFLLEVBQUUsQ0FBQztvQkFDTixLQUFLLEVBQUUsRUFBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUM7aUJBQzFDLENBQXlCO2dCQUMxQixJQUFJLEVBQUU7b0JBQ0osSUFBSSxFQUFFLE9BQU87b0JBQ2IsUUFBUSxFQUFFLEVBQUU7aUJBQ2I7YUFDRixDQUFDLENBQUM7WUFDSCxhQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDOUMsYUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsZUFBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDdEYsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVKLEVBQUUsQ0FBQyxnRUFBZ0UsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQUMsV0FBVztZQUN4RixJQUFNLEtBQUssR0FBRyxzQkFBZSxDQUFDO2dCQUM1QixLQUFLLEVBQUU7b0JBQ0wsR0FBRyxFQUFFLEVBQUMsSUFBSSxFQUFFLFNBQVMsRUFBQztpQkFDdkI7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