/* global describe */
/* global it */
/* global expect */

var λ = require('./lambada');

var numbers = [[-1], [0], [1], [Math.PI], [0.1], [142857], [Infinity]];
var pairs = [[0, 0], [Math.PI, -Math.SQRT2], [1, 1], [-1, 0], [100/7, -200/13]];
var triplets = [[0, 0, 0], [Math.PI, -Math.SQRT2, 100], [1, 3, 2], [100/7, -200/13, 400/Math.E]];
var things = ['xyz', Math.E, ['Hola', 'mundo'], {a: 11, b: 22, c: 33}, function () {}, undefined, null, false];

var slice = Array.prototype.slice;

function compareFunctions(f, g, domain) {
    expect(typeof f).toEqual('function');
    expect(typeof g).toEqual('function');
    domain.forEach(function (args) {
        expect(f.apply(null, args)).toEqual(g.apply(null, args));
    });
}

describe('λ', function () {
    it('should be a function', function () {
        expect(typeof λ).toEqual('function');
    });

    it("passes Functional Javascript's tests", function () {
        expect(λ('x -> x + 1')(1)).toEqual(2);
        expect(λ('x y -> x + 2*y')(1, 2)).toEqual(5);
        expect(λ('x, y -> x + 2*y')(1, 2)).toEqual(5);
        expect(λ('_ + 1')(1)).toEqual(2);
        expect(λ('/2')(4)).toEqual(2);
        expect(λ('2/')(4)).toEqual(0.5);
        expect(λ('/')(2,4)).toEqual(0.5);
        expect(λ('x + 1')(1)).toEqual(2);
        expect(λ('x + 2*y')(1, 2)).toEqual(5);
        expect(λ('y + 2*x')(1, 2)).toEqual(5);
        expect(λ('x -> y -> x + 2*y')(1)(2)).toEqual(5);
    });

    it('creates a unary function for a simple expression', function () {
        var f = λ('3 + x');
        compareFunctions(f, function (x) { return 3 + x; }, numbers);
    });

    it('creates a binary function for a simple expression', function () {
        var f = λ('x + 2 * y');
        compareFunctions(f, function (x, y) { return x + 2 * y; }, pairs);
    });

    it('creates a function for a binary operator', function () {
        var f = λ('+');
        compareFunctions(f, function (x, y) { return x + y; }, pairs);
    });

    it('creates a function for a partially applied postfix binary operator', function () {
        var f = λ('3-');
        compareFunctions(f, function (x) { return 3 - x; }, numbers);
    });

    it('creates a function for a partially applied postfix binary operator', function () {
        var f = λ('/5');
        compareFunctions(f, function (x) { return x / 5; }, numbers);
    });

    it('caches functions', function () {
        var f = λ('x -> 2 * x + 5');
        var g = λ('x -> 2 * x + 5');
        expect(typeof f).toEqual('function');
        expect(typeof g).toEqual('function');
        expect(f).toBe(g);
    });

    it('returns a function unchanged', function () {
        var f = function () {};
        var g = λ(f);
        expect(f).toBe(g);
    });

    it('supports dot something as an operation', function () {
        var f = λ('.foo');
        var obj = { foo: 5, bar: 6, baz: 7 };
        expect(f(obj)).toEqual(5);
    });
});

describe('λ.sequence', function () {
    it('exists and is a function', function () {
        expect(λ.sequence).toBeDefined();
        expect(typeof λ.sequence).toEqual('function');
    });

    it('applies unary functions from left to right', function () {
        var f = λ.sequence('+2', '*3', '4-');
        var g = function(x) { return 4 - ((x + 2) * 3); };
        compareFunctions(f, g, numbers);
    });

    it('handles regular functions correctly', function () {
        var f = λ.sequence('*100', Math.floor, '/10');
        var g = function (x) { return Math.floor(x * 100) / 10; };
        compareFunctions(f, g, numbers);
    });

    it('can accept a non-unary function as a first argument', function () {
        var f = λ.sequence(Math.max, '/100');
        var g = function () {
            return Math.max.apply(null, slice.call(arguments)) / 100;
        };
        compareFunctions(f, g, triplets);
    });
});

describe('λ.compose', function () {
    it('exists and is a function', function () {
        expect(λ.compose).toBeDefined();
        expect(typeof λ.compose).toEqual('function');
    });

    it('applies unary functions from right to left', function () {
        var f = λ.compose('+2', '*3', '4-');
        var g = function(x) { return ((4 - x) * 3) + 2; };
        compareFunctions(f, g, numbers);
    });

    it('handles regular functions correctly', function () {
        var f = λ.compose(Math.exp, '*2', Math.abs);
        var g = function (x) { return Math.exp(2 * Math.abs(x)); };
        compareFunctions(f, g, numbers);
    });

    it('can accept a non-unary function as a last argument', function () {
        var f = λ.compose(Math.floor, Math.pow);
        var g = function () {
            return Math.floor(Math.pow.apply(null, slice.call(arguments)));
        };
        compareFunctions(f, g, pairs);
    });
});

describe('λ.flip', function () {
    it('exists and is a function', function () {
        expect(λ.flip).toBeDefined();
        expect(typeof λ.flip).toEqual('function');
    });

    it('swaps the first and second arguments of a regular function', function () {
        var f = λ.flip(function (x, y) { return 100 * x + y; });
        var g =        function (y, x) { return 100 * x + y; } ;
        compareFunctions(f, g, pairs);
    });

    it('swaps the first and second arguments of a string lambda function', function () {
        var f = λ.flip('x, y -> 1000 * x + y');
        var g = λ     ('y, x -> 1000 * x + y');
        compareFunctions(f, g, pairs);
    });

    it('keeps arguments after the second untouched', function () {
        var f = λ.flip(function () { return slice.call(arguments); });
        expect(f(11, 22, 33, 44, 55)).toEqual([22, 11, 33, 44, 55]);
    });
});

describe('λ.id', function () {
    it('exists and is a function', function () {
        expect(λ.id).toBeDefined();
        expect(typeof λ.id).toEqual('function');
    });

    it('returns its first argument', function () {
        things.forEach(function (thing) {
            expect(λ.id(thing)).toBe(thing);
        });
    });
});

describe('λ.constant', function () {
    it('exists and is a function', function () {
        expect(λ.constant).toBeDefined();
        expect(typeof λ.constant).toEqual('function');
    });

    it('returns a function that returns the constant', function () {
        things.forEach(function (thing) {
            var k = λ.constant(thing);
            expect(k()).toBe(thing);
            expect(k(99, 88, 77)).toBe(thing);
        });
    });
});
