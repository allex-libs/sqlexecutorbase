function createCompositeType (execlib, mylib) {
  'use strict';

  var lib = execlib.lib;
  var q = lib.q;

  function subsentencer (item) {
    return item.sentence;
  }

  function sentencer (executor) {
    this.items.forEach(executor.validateQueueObj.bind(executor));
    return mylib.sqlsentencing.processTemplate(
      this.items.map(subsentencer),
      {}
    );
  }

  function validator (executor) {
    if (!lib.isArray(this.items)) {
      throw new lib.JSONizingError('NO_QUEUE_OBJ_ITEMS', this, 'Must have a "items" property (Array)');
    }
    if (!this.sentence) {
      this.sentence = sentencer.call(this, executor);
    }
    this.recordsetcount = this.items.reduce(function (res, it) {return res+it.recordsetcount}, 0);
    executor = null;
  }

  function analyzer (recordsets, cursor, executor) {
    var ret = executor.analyzeQueueResult(this.items, recordsets, cursor);
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