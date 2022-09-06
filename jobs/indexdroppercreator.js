function createIndexDropperJob (lib, mylib) {
  'use strict';

  function IndexDropperJob (executor, tablename, indexname, defer) {
    mylib.SyncQuery.call(this, executor, defer);
    this.tablename = tablename;
    this.indexname = indexname;
  }
  lib.inherit(IndexDropperJob, mylib.SyncQuery);
  IndexDropperJob.prototype.destroy = function () {
    this.indexname = null;
    this.tablename = null;
    mylib.SyncQuery.prototype.destroy.call(this);
  };
  IndexDropperJob.prototype.queryString = function () {
    return 'DROP INDEX "'+this.indexname+'" ON "'+this.tablename+'"';
  };

  mylib.IndexDropper = IndexDropperJob;

  function PrimaryKeyDropperJob (executor, tablename, indexname, defer) {
    IndexDropperJob.call(this, executor, tablename, indexname, defer);
  }
  lib.inherit(PrimaryKeyDropperJob, IndexDropperJob);
  PrimaryKeyDropperJob.prototype.queryString = function () {
    return 'ALTER TABLE "'+this.tablename+'" '+
    'DROP CONSTRAINT "'+this.indexname+'"';
  };
  
  mylib.PrimaryKeyDropper = PrimaryKeyDropperJob;
}
module.exports = createIndexDropperJob;
