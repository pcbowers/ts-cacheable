"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var common_1 = require("./common");
exports.globalCacheBusterNotifier = new rxjs_1.Subject();
exports.Cacheable = common_1.makeCacheableDecorator(function (propertyDescriptor, oldMethod, cachePairs, pendingCachePairs, cacheConfig) {
    /**
     * subscribe to the globalCacheBuster
     * if a custom cacheBusterObserver is passed, subscribe to it as well
     * subscribe to the cacheBusterObserver and upon emission, clear all caches
     */
    rxjs_1.merge(exports.globalCacheBusterNotifier.asObservable(), cacheConfig.cacheBusterObserver
        ? cacheConfig.cacheBusterObserver
        : rxjs_1.empty()).subscribe(function (_) {
        cachePairs.length = 0;
        pendingCachePairs.length = 0;
    });
    cacheConfig.cacheResolver = cacheConfig.cacheResolver
        ? cacheConfig.cacheResolver
        : common_1.DEFAULT_CACHE_RESOLVER;
    /* use function instead of an arrow function to keep context of invocation */
    propertyDescriptor.value = function () {
        var _parameters = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _parameters[_i] = arguments[_i];
        }
        var parameters = JSON.parse(JSON.stringify(_parameters));
        var _foundCachePair = cachePairs.find(function (cp) {
            return cacheConfig.cacheResolver(cp.parameters, parameters);
        });
        var _foundPendingCachePair = pendingCachePairs.find(function (cp) {
            return cacheConfig.cacheResolver(cp.parameters, parameters);
        });
        /**
         * check if maxAge is passed and cache has actually expired
         */
        if (cacheConfig.maxAge && _foundCachePair && _foundCachePair.created) {
            if (new Date().getTime() - _foundCachePair.created.getTime() >
                cacheConfig.maxAge) {
                /**
                 * cache duration has expired - remove it from the cachePairs array
                 */
                cachePairs.splice(cachePairs.indexOf(_foundCachePair), 1);
                _foundCachePair = null;
            }
            else if (cacheConfig.slidingExpiration) {
                /**
                 * renew cache duration
                 */
                _foundCachePair.created = new Date();
            }
        }
        if (_foundCachePair) {
            var cached$ = rxjs_1.of(_foundCachePair.response);
            return cacheConfig.async ? cached$.pipe(operators_1.delay(0)) : cached$;
        }
        else if (_foundPendingCachePair) {
            return _foundPendingCachePair.response;
        }
        else {
            var response$ = oldMethod.call.apply(oldMethod, [this].concat(parameters)).pipe(operators_1.finalize(function () {
                /**
                 * if there has been an observable cache pair for these parameters, when it completes or errors, remove it
                 */
                var _pendingCachePairToRemove = pendingCachePairs.find(function (cp) {
                    return cacheConfig.cacheResolver(cp.parameters, parameters);
                });
                pendingCachePairs.splice(pendingCachePairs.indexOf(_pendingCachePairToRemove), 1);
            }), operators_1.tap(function (response) {
                /**
                 * if no maxCacheCount has been passed
                 * if maxCacheCount has not been passed, just shift the cachePair to make room for the new one
                 * if maxCacheCount has been passed, respect that and only shift the cachePairs if the new cachePair will make them exceed the count
                 */
                if (!cacheConfig.shouldCacheDecider ||
                    cacheConfig.shouldCacheDecider(response)) {
                    if (!cacheConfig.maxCacheCount ||
                        cacheConfig.maxCacheCount === 1 ||
                        (cacheConfig.maxCacheCount &&
                            cacheConfig.maxCacheCount < cachePairs.length + 1)) {
                        cachePairs.shift();
                    }
                    cachePairs.push({
                        parameters: parameters,
                        response: response,
                        created: cacheConfig.maxAge ? new Date() : null
                    });
                }
            }), 
            /**
             * replay cached observable, so we don't enter finalize and tap for every cached observable subscription
             */
            operators_1.shareReplay());
            /**
             * cache the stream
             */
            pendingCachePairs.push({
                parameters: parameters,
                response: response$,
                created: new Date()
            });
            return response$;
        }
    };
});
//# sourceMappingURL=cacheable.decorator.js.map