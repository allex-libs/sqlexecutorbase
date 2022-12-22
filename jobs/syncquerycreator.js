function createSyncQueryJob (lib, mylib) {
  'use strict';

  var SyncJob = mylib.Sync;

  function SyncQueryJob (executor, query, options, defer) {
    if (options && lib.isFunction(options.resolve)) {
      throw new lib.Error('BACKWARDS_INCOMPATIBILITY', 'options is now the third ctor parameter, and defer is the fourth');
    }
    SyncJob.call(this, executor, defer);
    this.query = query;
    this.options = options;
  }
  lib.inherit(SyncQueryJob, SyncJob);
  SyncQueryJob.prototype.destroy = function () {
    this.options = null;
    this.query = null;
    SyncJob.prototype.destroy.call(this);
  };
  SyncQueryJob.prototype.useTheRequest = function (request) {
    this.destroyable.maybeLog(this.query);
    return request.query(this.query);
  };

  SyncQueryJob.prototype.makeUpError = function (reason) {
    return new lib.Error('SYNCQUERY_ERROR', lib.joinStringsWith(this.query, reason ? reason.message : '', '\n'));
  };

  mylib.SyncQuery = SyncQueryJob;
}
module.exports = createSyncQueryJob;
