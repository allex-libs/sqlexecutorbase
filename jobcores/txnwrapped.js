function createTxnWrappedJobCore (execlib, specializations, mylib) {
  'use strict';

  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib;

  function SafeJobRunnerJobCore (job) {
    this.job = job;
    this.notify = new lib.HookCollection();
  }
  SafeJobRunnerJobCore.prototype.destroy = function () {
    this.job = null;
    if (this.notify) {
      this.notify.destroy();
    }
    this.notify = null;
  };
  SafeJobRunnerJobCore.prototype.shouldContinue = function () {
    if (!this.job) {
      return new lib.Error('NO_JOB_TO_SAFE_RUN');
    }
    if (!this.notify) {
      return new lib.Error('ALREADY_DESTROYED');
    }
  };
  SafeJobRunnerJobCore.prototype.run = function () {
    return this.job.go().then(
      this.onRunSuccess.bind(this),
      this.onRunFail.bind(this),
      this.notify.fire.bind(this.notify)
    );
  };
  SafeJobRunnerJobCore.prototype.onRunSuccess = function (result) {
    return {
      success: result
    };
  };
  SafeJobRunnerJobCore.prototype.onRunFail = function (reason) {
    return {
      fail: reason
    };
  };

  SafeJobRunnerJobCore.prototype.steps = [
    'run'
  ];

  function TxnWrappedJobCore (executor, jobproducerfunc) {
    this.executor = executor;
    this.jobProducerFunc = jobproducerfunc;
    this.jobToWrap = null;
    this.pool = null;
    this.txn = null;
    this.txnUnderWay = false;
    this.txnExecutor = null;
    this.result = null;
  }
  TxnWrappedJobCore.prototype.destroy = function () {
    if (this.txn && this.txnUnderWay) {
      this.txn.rollback();
    }
    this.result = null;
    if (this.txnExecutor) {
      this.txnExecutor.destroy();
    }
    this.txnExecutor = null;
    this.txnUnderWay = null;
    this.txn = null;
    this.pool = null;
    this.jobToWrap = null;
    this.executor = null;
  };
  TxnWrappedJobCore.prototype.shouldContinue = function () {
    if (!this.executor) {
      return new lib.Error('NO_EXECUTOR', 'No Executor');
    }
    if (!lib.isFunction(this.jobProducerFunc)) {
      return new lib.Error('JOB_PRODUCER_FUNC_NOT_A_FUNCTION');
    }
    if (this.jobToWrap) {
      if (!lib.isFunction(this.jobToWrap.go)) {
        return new lib.Error('PRODUCED_JOB_TO_WRAP_NOT_GOABLE');
      }
    }
  };

  TxnWrappedJobCore.prototype.connect = function () {
    return this.executor.connect();
  };
  TxnWrappedJobCore.prototype.onConnected = function (pool) {
    throw new lib.Error('NOT_IMPLEMENTED', this.constructor.name+' has to implement onConnected');
  };
  TxnWrappedJobCore.prototype.beginTransaction = function () {
    throw new lib.Error('NOT_IMPLEMENTED', this.constructor.name+' has to implement beginTransaction');
  };
  TxnWrappedJobCore.prototype.onTransactionBegun = function () {
    this.txnUnderWay = true;
  };
  TxnWrappedJobCore.prototype.createWrapped = function () {
    throw new lib.Error('NOT_IMPLEMENTED', this.constructor.name+' has to implement createWrapped');
  };
  TxnWrappedJobCore.prototype.onWrapped = function (wrapped) {
    this.jobToWrap = wrapped;
  };

  TxnWrappedJobCore.prototype.runWrapped = function (wrapped) {
    return qlib.newSteppedJobOnSteppedInstance(
      new SafeJobRunnerJobCore(this.jobToWrap)
    ).go();
  };
  TxnWrappedJobCore.prototype.onWrappedResult = function (runresult) {
    this.result = runresult;
  };
  TxnWrappedJobCore.prototype.finalizeTxn = function () {
    throw new lib.Error('NOT_IMPLEMENTED', this.constructor.name+' has to implement finalizeTxn');
  };
  TxnWrappedJobCore.prototype.finalize = function () {
    this.txn = null;
    if (this.result.fail) {
      throw this.result.fail;
    }
    return this.result.success;
  };

  TxnWrappedJobCore.prototype.steps = [
    'connect',
    'onConnected',
    'beginTransaction',
    'onTransactionBegun',
    'createWrapped',
    'onWrapped',
    'runWrapped',
    'onWrappedResult',
    'finalizeTxn',
    'finalize'
  ];

  mylib.TxnWrapped = specializations.txnwrapped(execlib, TxnWrappedJobCore);
}
module.exports = createTxnWrappedJobCore;