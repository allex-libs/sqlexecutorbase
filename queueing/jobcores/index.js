function createQueueingJobCores (lib) {
  'use strict';

  var qlib = lib.qlib;

  function ExecutorQueuerJobCoreBase (executor, queueobj) {
    this.executor = executor;
    this.queueobj = queueobj;
  }
  ExecutorQueuerJobCoreBase.prototype.destroy = function () {
    this.queueobj = null;
    this.executor = null;
  };
  ExecutorQueuerJobCoreBase.prototype.doDaQ = function () {
    return this.executor[this.queueMethod](this.queueobj);
  };
  ExecutorQueuerJobCoreBase.prototype.steps = [
    'doDaQ'
  ];

  function ExecutorQueuerJobCore (executor, queueobj) {
    ExecutorQueuerJobCoreBase.call(this, executor, queueobj);
  }
  lib.inherit(ExecutorQueuerJobCore, ExecutorQueuerJobCoreBase);
  ExecutorQueuerJobCore.prototype.queueMethod = 'queue';

  return {
    newQueuer: function (executor, queueobj) {
      return qlib.newSteppedJobOnSteppedInstance(
        new ExecutorQueuerJobCore(executor, queueobj)
      )
    }
  }
}
module.exports = createQueueingJobCores;