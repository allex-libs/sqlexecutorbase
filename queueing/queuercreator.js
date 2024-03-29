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
    this.rowsaffectedcount = 0;
    this.totalquery = null;
  }
  lib.inherit(Queuer, JobBase);
  Queuer.prototype.destroy = function () {
    this.totalquery = null;
    this.rowsaffectedcount = null;
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
    if (!(item && item.defer)) {
      return;
    }
    item.defer.reject(reason);
  }
  Queuer.prototype.push = function (queueobj) {
    //validateQueueObj?
    this.q.push(queueobj);
    this.recordsetcount += queueobj.recordsetcount;
    this.rowsaffectedcount += queueobj.rowsaffectedcount;
  };
  Queuer.prototype.go = function () {
    this.totalquery = this.q.map(sentencer).join(';\n');
    (new mylib.jobs.SyncQuery(
      this.executor,
      this.totalquery
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
      console.error('on', this.executor.dbname);
      console.error(this.totalquery);
      this.reject(new lib.Error('NO_QUERY_RESULT', this.constructor.name+' got no query result'));
      return;
    }
    if (!lib.isArray(res.recordsets)) {
      console.error('on', this.executor.dbname);
      console.error(this.totalquery);
      this.reject(new lib.Error('NO_QUERY_RESULT', this.constructor.name+' got no query result recordsets'));
      return;
    }
    if (res.recordsets.length != this.recordsetcount) {
      console.error('on', this.executor.dbname);
      console.error(this.totalquery);
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
    if (res.rowsAffected.length != this.rowsaffectedcount) {
      console.error('on', this.executor.dbname);
      console.error(this.totalquery);
      this.reject(new lib.Error(
        'QUERY_RESULT_ROWSAFFECTEDCOUNT_MISMATCH',
        this.constructor.name+
        ' got '+
        res.rowsAffected.length+
        ' query result rowsAffected, but expected '+
        this.rowsaffectedcount
      ));
      return;
    }
    try {
      promises = this.executor.analyzeQueueResult(this.q, res.recordsets, res.rowsAffected);
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