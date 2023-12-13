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
    this.startTime = null;
  }
  lib.inherit(SyncQueryJob, SyncJob);
  SyncQueryJob.prototype.destroy = function () {
    this.options = null;
    this.query = null;
    SyncJob.prototype.destroy.call(this);
  };
  SyncQueryJob.prototype.useTheRequest = function (request) {
    this.startTime = lib.now();
    this.destroyable.maybeLog(this.query);
    return request.query(this.query);
  };
  SyncQueryJob.prototype.onResult = function (res) {
    this.destroyable.maybeLogComment(this.destroyable.prepareForLog('Done in '+(lib.now()-this.startTime)/1000+' sec'));
    return SyncJob.prototype.onResult.call(this, res);
  };

  SyncQueryJob.prototype.makeUpError = function (reason) {
    this.destroyable.maybeLogComment(reason ? reason.message : '', 'Sync Query Error');
    return new lib.Error('SYNCQUERY_ERROR', lib.joinStringsWith(this.query, reason ? reason.message : '', '\n'));
  };

  mylib.SyncQuery = SyncQueryJob;
}
module.exports = createSyncQueryJob;
