var promisesAplusTests = require("promises-aplus-tests");
var wishful = require('./wishful').default;

var adapter = {
	resolved: wishful.wrap,
	rejected: wishful.wrapError,
	deferred: wishful.deferred
};

promisesAplusTests(adapter, { bail: true, reporter: 'dot' }, function (err) {
    // All done; output is in the console. Or check `err` for number of failures.
});