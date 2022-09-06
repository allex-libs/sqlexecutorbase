function createSyncSingleQuery (lib, mylib) {
  'use strict';

  var SyncQueryJob = mylib.SyncQuery;

  function SyncSingleQueryJob (executor, query, defer) {
    SyncQueryJob.call(this, executor, query, defer);
  }
  lib.inherit(SyncSingleQueryJob, SyncQueryJob);
  SyncSingleQueryJob.prototype.onResult = function (res) {
    this.resolve(res.recordset);
  };


  mylib.SyncSingleQuery = SyncSingleQueryJob;
}
module.exports = createSyncSingleQuery;
