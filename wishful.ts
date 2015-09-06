interface IDeferred {
	resolve:(value: any) => void;
	reject:(reason: any) => void;
	promise: Promise;
}

interface IListener {
	onFulfilled: (value: any) => any;
	onRejected: (reason: any) => any;
	deferred: IDeferred;
}

const enum STATE {
	PENDING,
	FULFILLED,
	REJECTED
};

export default class Promise {
	private _value: any;
	private _listeners: IListener[] = [];
	
	constructor(init:(resolve:(value: any) => void, reject:(reason: any) => void) => void) {
		init(this._resolve, this._reject);
	}
	
	public then(onFulfilled: (value: any) => any, onRejected: (reason: any) => any): Promise {
		var deferred = Promise.deferred();
		if(this._state === STATE.FULFILLED) {
			if(typeof(onFulfilled) !== 'function') {
				return this;
			}
			setTimeout(() => {
				this._executeListener(onFulfilled, deferred);
			}, 0);
		} else if(this._state === STATE.REJECTED) {
			if(typeof(onRejected) !== 'function') {
				return this;
			}
			setTimeout(() => {
				this._executeListener(onRejected, deferred);
			}, 0);
		} else {
			// pending
			this._listeners.push({
				onFulfilled: onFulfilled,
				onRejected: onRejected,
				deferred: deferred
			});
		}
		return deferred.promise;
	}
	
	private _executeListener(func: (value: any) => any, deferred: IDeferred) {
		
		let result: any;
		let hasError = false;
		if(typeof(func) === 'function') {
			try {
				result = func.call(undefined, this._value);
			} catch(e) {
				hasError = true;
				result = e;
			}
		} else {
			result = this._value;
			hasError = this._state === STATE.REJECTED;
		}
		
		if(hasError) {
			deferred.reject(result);
		} else {
			deferred.resolve(result);
		}
	}
	
	private _drainListeners() {
		if(this._listeners.length) {
			this._listeners.forEach((listener) => {
				if(this._state === STATE.FULFILLED) {
					this._executeListener(listener.onFulfilled, listener.deferred);
				} else {
					this._executeListener(listener.onRejected, listener.deferred);
				}
			});
		}
	}
	
	private _resolve = (value: any) => {
		if(this._state === STATE.PENDING) {
			let simpleResolve = () => {
				this._state = STATE.FULFILLED;
				this._value = value;
				setTimeout(() => {
					this._drainListeners();
				}, 0);
			}
			if(this === value) {
				this._reject(new TypeError("Cannot resolve a promise with itself."));
			} else if(value && (typeof value === 'function' || typeof value === 'object')) {
				let called = false;
				try {
					let then = value.then;
					if(typeof then === 'function') {
						then.call(value, (value: any) => {
							if(!called) {
								called = true;
								this._resolve(value);
							}
						}, (value: any) => {
							if(!called) {
								called = true;
								this._reject(value);
							}
						});
					} else {
						simpleResolve();
					}
					
				} catch(e) {
					if(!called) {
						this._reject(e);
					}
				}
			} else {
				simpleResolve();
			}
		}
	};
	
	private _reject = (reason: any) => {
		if(this._state === STATE.PENDING) {
			this._state = STATE.REJECTED;
			this._value = reason;
			setTimeout(() => {
				this._drainListeners();
			}, 0);
		}
	};
	
	private _state = STATE.PENDING;
	
	static deferred() {
		var result: IDeferred = {
			resolve: null,
			reject: null,
			promise: null
		};
		result.promise = new Promise((resolve, reject) => {
			result.resolve = resolve,
			result.reject = reject
		});
		return result;
	}
	
	static wrap(value: any) {
		return new Promise((resolve) => {
			resolve(value);
		});
	}
	
	static wrapError(reason: any) {
		return new Promise((resolve, reject) => {
			reject(reason);
		});
	}
}