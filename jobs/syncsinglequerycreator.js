function createSyncSingleQuery (execlib, mylib, specializations) {
  'use strict';

  var lib = execlib.lib;
  var SyncQueryJob = mylib.SyncQuery;

  function SyncSingleQueryJob (executor, query, defer) {
    SyncQueryJob.call(this, executor, query, defer);
  }
  lib.inherit(SyncSingleQueryJob, SyncQueryJob);
  SyncSingleQueryJob.prototype.onResult = function (res) {
    throw new lib.Error('NOT_IMPLEMENTED', this.constructor.name+' has to implement onResult');
  };

  mylib.SyncSingleQuery = lib.isFunction(specializations.syncsinglequery)
  ?
  specializations.syncsinglequery(execlib, SyncSingleQueryJob)
  :
  SyncSingleQueryJob;
}
module.exports = createSyncSingleQuery;
