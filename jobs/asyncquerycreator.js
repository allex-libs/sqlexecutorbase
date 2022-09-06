function createAsyncQueryJob (execlib, mylib, specializations) {
  'use strict';

  var lib = execlib.lib;
  var AsyncJob = mylib.Async;

  function AsyncQueryJob (executor, query, cbs, defer) {
    AsyncJob.call(this, executor, cbs, defer);
    this.query = query;
  }
  lib.inherit(AsyncQueryJob, AsyncJob);

  mylib.AsyncQuery = lib.isFunction(specializations.asyncquery)
  ?
  specializations.asyncquery(execlib, AsyncQueryJob)
  :
  AsyncQuery;
}
module.exports = createAsyncQueryJob;
