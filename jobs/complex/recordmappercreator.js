function createRecordMapperJob (lib, mylib, sqlsentencing) {
  'use strict';

  var qlib = lib.qlib;
  var SteppedJobOnSteppedInstance = qlib.SteppedJobOnSteppedInstance;

  function RecordMapperJobCore (executor, query, cb) {
    this.executor = executor;
    this.query = query;
    this.cb = cb;
    this.finalResult = void 0;
    this.mappings = [];
  }
  RecordMapperJobCore.prototype.destroy = function () {
    this.mappings = null;
    this.finalResult = null;
    this.cb = null;
    this.query = null;
    this.executor = null;
  };
  RecordMapperJobCore.prototype.shouldContinue = function () {
    if (lib.defined(this.finalResult)) {
      return this.finalResult;
    }
    if(!lib.isFunction(this.cb)) {
      throw new lib.Error('NO_CB', this.constructor.name+' needs to have options');
    }
    if (!this.executor) {
      throw new lib.Error('NO_EXECUTOR', this.constructor.name+' needs to have executor');
    }
    if (!this.query) {
      throw new lib.Error('NO_QUERY', this.constructor.name+' needs to have query');
    }
  };

  RecordMapperJobCore.prototype.init = function () {
    return (new mylib.AsyncQuery(
      this.executor,
      this.query,
      {
        record: this.onRecord.bind(this)
      }
    )).go();
  };
  RecordMapperJobCore.prototype.finalize = function () {
    return this.mappings;
  };

  RecordMapperJobCore.prototype.steps = [
    'init',
    'finalize'
  ];

  RecordMapperJobCore.prototype.onRecord = function (rec) {
    this.mappings.push(this.cb(rec));
  };

  function RecordMapperJob (executor, query, cb, defer) {
    SteppedJobOnSteppedInstance.call(
      this,
      new RecordMapperJobCore(executor, query, cb),
      defer
    )
  }
  lib.inherit(RecordMapperJob, SteppedJobOnSteppedInstance);
  mylib.RecordMapper = RecordMapperJob;
}
module.exports = createRecordMapperJob;