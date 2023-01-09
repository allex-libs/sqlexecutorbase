function createQueuer (execlib, mylib, qinghelperfuncs) {
  'use strict';

  var lib = execlib.lib;
  var q = lib.q;
  var qlib = lib.qlib;
  var JobBase = qlib.JobBase;

  function Queuer (executor) {
    JobBase.call(this);
    this.executor = executor;
    this.q = [];
    this.promise = this.defer.promise;
    this.recordsetcount = 0;
  }
  lib.inherit(Queuer, JobBase);
  Queuer.prototype.destroy = function () {
    this.recordsetcount = null;
    this.promise = null;
    this.q = null;
    this.executor = null;
    JobBase.prototype.destroy.call(this);
  };
  Queuer.prototype.reject = function (reason) {
    var ret;
    if (lib.isArray(this.q)) {
      this.q.forEach(rejecter.bind(null, reason));
    }
    ret = JobBase.prototype.reject.call(this, reason);
    reason = null;
    return ret;
  };
  function rejecter (reason, item) {
    item.defer.reject(reason);
  }
  Queuer.prototype.push = function (queueobj) {
    //validateQueueObj?
    this.q.push(queueobj);
    this.recordsetcount += queueobj.recordsetcount;
  };
  Queuer.prototype.go = function () {
    (new mylib.jobs.SyncQuery(
      this.executor,
      this.q.map(sentencer).join(';\n')
    )).go().then(
      this.onQuery.bind(this),
      this.reject.bind(this)
    );
  };  
  function sentencer (item) {
    return item.sentence;
  }
  Queuer.prototype.onQuery = function (res) {
    var promises;
    res = qinghelperfuncs.recordsetFormatProducer(res);
    if (!res) {
      this.reject(new lib.Error('NO_QUERY_RESULT', this.constructor.name+' got no query result'));
      return;
    }
    if (!lib.isArray(res.recordsets)) {
      this.reject(new lib.Error('NO_QUERY_RESULT', this.constructor.name+' got no query result recordsets'));
      return;
    }
    if (res.recordsets.length != this.recordsetcount) {
      this.reject(new lib.Error(
        'QUERY_RESULT_RECORDSETCOUNT_MISMATCH',
        this.constructor.name+
        ' got '+
        res.recordsets.length+
        ' query result recordsets, but expected '+
        this.recordsetcount
      ));
      return;
    }
    try {
      promises = this.executor.analyzeQueueResult(this.q, res.recordsets);
      if (!(lib.isArray(promises) && promises.length>0)) {
        this.resolve(true);
        return;
      }
      qlib.promise2defer(q.all(promises), this);
    } catch (e) {
      this.reject(e);
    }
  };

  return Queuer;
}
module.exports = createQueuer;