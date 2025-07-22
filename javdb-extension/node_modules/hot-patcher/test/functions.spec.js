const { sequence } = require("../source/functions.js");

describe("functions", function() {
    describe("sequence", function() {
        it("returns a function", function() {
            const fn = sequence(() => {});
            expect(fn).to.be.a("function");
        });

        it("passes parameters to the first function", function() {
            const spy = sinon.spy();
            const fn = sequence(spy);
            fn(1, 2, 3);
            expect(spy.calledWithExactly(1, 2, 3)).to.be.true;
        });

        it("chains results from function to function", function() {
            const meth1 = (a, b) => a + b;
            const meth2 = sinon.stub().returnsArg(0);
            const fn = sequence(meth1, meth2);
            const output = fn(1, 2);
            expect(output).to.equal(3);
            expect(meth2.calledWithExactly(3)).to.be.true;
        });

        it("calls all functions with bound 'this'", function() {
            const _this = {};
            const meth1 = sinon.spy();
            const meth2 = sinon.spy();
            const fn = sequence(meth1, meth2);
            fn.call(_this);
            expect(meth1.calledOn(_this)).to.be.true;
            expect(meth2.calledOn(_this)).to.be.true;
        });

        it("throws if no functions are provided", function() {
            expect(() => {
                sequence();
            }).to.throw(/No functions provided/i);
        });
    });
});
