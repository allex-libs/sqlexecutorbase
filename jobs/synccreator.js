function createSyncJob (lib, mylib) {
  'use strict';
  var q = lib.q,
    qlib = lib.qlib;

  function SyncJob (executor, defer) {
    mylib.Base.call(this, executor, defer);
  }
  lib.inherit(SyncJob, mylib.Base);
  SyncJob.prototype.goForSure = function () {
    try {
      this.useTheRequest(this.destroyable.activateConnection(this.pool)).then(
        this.onResult.bind(this),
        this.onFailed.bind(this)
      );
    }
    catch (e) {
      this.reject(e);
    }
  }
  SyncJob.prototype.onResult = function (res) {
    this.resolve(res);
  };
  SyncJob.prototype.onFailed = function (reason) {
    this.reject(reason);
  };
  SyncJob.prototype.useTheRequest = function (request) {
    throw new lib.Error('NOT_IMPLEMENTED', this.constructor.name+' has to implement useTheRequest');
  };

  mylib.Sync = SyncJob;
}
module.exports = createSyncJob;
