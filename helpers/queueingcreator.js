function createSQLQueueingHelpers (execlib, mylib) {
  'use strict';

  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib;

  function isExecutorAndQ (thingy) {
    return lib.isArray(thingy) && thingy.length==2 && thingy[0] && lib.isFunction(thingy[0].queue);
  }
  function thenthener (results, res) {
    results.push(res);
    return results;
  }
  function thener (res, thingy) {
    var ret, results = res.result;
    if (res.promise) {
      ret = {promise: res.promise.then(thingy[0].queue.bind(thingy[0], thingy[1])).then(thenthener.bind(null, results)), result: res.result};
      results = null;
      return ret;
    }
    ret = {promise: thingy[0].queue(thingy[1]).then(thenthener.bind(null, results)), result: res.result};
    results = null;
    return ret;
  }
  function queueOneAfterAnother (arry) {
    if (!lib.isArrayOfHaving(arry, isExecutorAndQ)) {
      throw new lib.JSONizingError('NOT_EXECUTORS_AND_QUEUES', arry, 'Must be an array of 2-element arrays, each having first element to be an Executor');
    }
    if (arry.length<1) {
      return q([]);
    }
    return arry.reduce(thener, {promise: null, result: []}).promise;
  }
  mylib.helpers.queueOneAfterAnother = queueOneAfterAnother;
}
module.exports = createSQLQueueingHelpers;