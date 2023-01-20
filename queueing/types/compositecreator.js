function createCompositeType (execlib, mylib) {
  'use strict';

  var lib = execlib.lib;
  var q = lib.q;

  function subsentencer (item) {
    return item.sentence;
  }

  function sentencer (executor) {
    this.items.forEach(executor.validateQueueObj.bind(executor));
    return this.items.map(subsentencer).join(';\n');
  }

  function validator (executor) {
    if (!lib.isArray(this.items)) {
      throw new lib.JSONizingError('NO_QUEUE_OBJ_ITEMS', this, 'Must have a "items" property (Array)');
    }
    if (!this.sentence) {
      this.sentence = sentencer.call(this, executor);
    }
    this.recordsetcount = this.items.reduce(function (res, it) {return res+(it.recordsetcount||0)}, 0);
    this.rowsaffectedcount = this.items.reduce(function (res, it) {return res+(it.rowsaffectedcount||0)}, 0);
    executor = null;
  }

  function analyzer (recordsets, rscursor, executor, rowsaffected, racursor) {
    var ret = executor.analyzeQueueResult(this.items, recordsets, rowsaffected, rscursor, racursor);
    if (!(lib.isArray(ret) && ret.length>0)) {
      return;
    }
    return q.all(ret);
  }

  return {
    dbname: null,
    type: 'composite',
    validator: validator,
    analyzer: analyzer
  };
}
module.exports = createCompositeType;