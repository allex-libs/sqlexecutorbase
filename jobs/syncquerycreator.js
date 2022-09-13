function createSyncQueryJob (lib, mylib) {
  'use strict';

  var SyncJob = mylib.Sync;

  function SyncQueryJob (executor, query, defer) {
    SyncJob.call(this, executor, defer);
    this.query = query;
  }
  lib.inherit(SyncQueryJob, SyncJob);
  SyncQueryJob.prototype.destroy = function () {
    this.query = null;
    SyncJob.prototype.destroy.call(this);
  };
  SyncQueryJob.prototype.useTheRequest = function (request) {
    return request.query(this.query);
  };

  mylib.SyncQuery = SyncQueryJob;
}
module.exports = createSyncQueryJob;
