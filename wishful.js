;
var Promise = (function () {
    function Promise(init) {
        var _this = this;
        this._listeners = [];
        this._resolve = function (value) {
            if (_this._state === 0) {
                var simpleResolve = function () {
                    _this._state = 1;
                    _this._value = value;
                    setTimeout(function () {
                        _this._drainListeners();
                    }, 0);
                };
                if (_this === value) {
                    _this._reject(new TypeError("Cannot resolve a promise with itself."));
                }
                else if (value && (typeof value === 'function' || typeof value === 'object')) {
                    var called = false;
                    try {
                        var then = value.then;
                        if (typeof then === 'function') {
                            then.call(value, function (value) {
                                if (!called) {
                                    called = true;
                                    _this._resolve(value);
                                }
                            }, function (value) {
                                if (!called) {
                                    called = true;
                                    _this._reject(value);
                                }
                            });
                        }
                        else {
                            simpleResolve();
                        }
                    }
                    catch (e) {
                        if (!called) {
                            _this._reject(e);
                        }
                    }
                }
                else {
                    simpleResolve();
                }
            }
        };
        this._reject = function (reason) {
            if (_this._state === 0) {
                _this._state = 2;
                _this._value = reason;
                setTimeout(function () {
                    _this._drainListeners();
                }, 0);
            }
        };
        this._state = 0;
        init(this._resolve, this._reject);
    }
    Promise.prototype.then = function (onFulfilled, onRejected) {
        var _this = this;
        var deferred = Promise.deferred();
        if (this._state === 1) {
            if (typeof (onFulfilled) !== 'function') {
                return this;
            }
            setTimeout(function () {
                _this._executeListener(onFulfilled, deferred);
            }, 0);
        }
        else if (this._state === 2) {
            if (typeof (onRejected) !== 'function') {
                return this;
            }
            setTimeout(function () {
                _this._executeListener(onRejected, deferred);
            }, 0);
        }
        else {
            this._listeners.push({
                onFulfilled: onFulfilled,
                onRejected: onRejected,
                deferred: deferred
            });
        }
        return deferred.promise;
    };
    Promise.prototype._executeListener = function (func, deferred) {
        var result;
        var hasError = false;
        if (typeof (func) === 'function') {
            try {
                result = func.call(undefined, this._value);
            }
            catch (e) {
                hasError = true;
                result = e;
            }
        }
        else {
            result = this._value;
            hasError = this._state === 2;
        }
        if (hasError) {
            deferred.reject(result);
        }
        else {
            deferred.resolve(result);
        }
    };
    Promise.prototype._drainListeners = function () {
        var _this = this;
        if (this._listeners.length) {
            this._listeners.forEach(function (listener) {
                if (_this._state === 1) {
                    _this._executeListener(listener.onFulfilled, listener.deferred);
                }
                else {
                    _this._executeListener(listener.onRejected, listener.deferred);
                }
            });
        }
    };
    Promise.deferred = function () {
        var result = {
            resolve: null,
            reject: null,
            promise: null
        };
        result.promise = new Promise(function (resolve, reject) {
            result.resolve = resolve,
                result.reject = reject;
        });
        return result;
    };
    Promise.wrap = function (value) {
        return new Promise(function (resolve) {
            resolve(value);
        });
    };
    Promise.wrapError = function (reason) {
        return new Promise(function (resolve, reject) {
            reject(reason);
        });
    };
    return Promise;
})();
exports.__esModule = true;
exports["default"] = Promise;
