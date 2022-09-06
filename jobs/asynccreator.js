function createAsyncJob (execlib, mylib, specializations) {
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib;

  /*
   * AsyncJob
   * Uses the request Object in a certain way, according to the ancestor class' useTheRequest method,
   * but always finishes when the request emits 'done'
   * If the request during its lifetime produced error(s), concat of all errors occured will be the rejection Error's message
   * If the request did not produce errors, AsyncJob will resolve with affectedRows
   * During request's lifetime, 2 notification types will occur:
   * 1. notify({request: request, columns: columns}) - this notification occurs at the beggining of execution,
   *   telling that the request has these columns in a certain recordset (multiple recordsets seem to be ambiguous)
   * 2. notify({request: request, row: row}) - this notification occurs for each row in a particular redordset (yes, multiple ambiguous)
   */

  function AsyncJob (executor, cbs, defer) {
    mylib.Base.call(this, executor, defer);
    this.cbs = cbs;
  }
  lib.inherit(AsyncJob, mylib.Base);
  AsyncJob.prototype.destroy = function () {
    this.cbs = null;
    mylib.Base.prototype.destroy.call(this);
  };
  AsyncJob.prototype.goForSure = function () {
    throw new lib.Error('NOT_IMPLEMENTED', this.constructor.name+' has to implement goForSure');
  };

  mylib.Async = lib.isFunction(specializations.async)
  ?
  specializations.async(execlib, AsyncJob)
  :
  AsyncJob;
}
module.exports = createAsyncJob;
