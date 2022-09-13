function createIndexDropperJob (lib, mylib) {
  'use strict';

  function IndexDropperJob (executor, tablename, indexname, defer) {
    mylib.SyncQuery.call(this, executor, 'DROP INDEX "'+indexname+'" ON "'+tablename+'"', defer);
  }
  lib.inherit(IndexDropperJob, mylib.SyncQuery);

  mylib.IndexDropper = IndexDropperJob;

  var _id = 0;
  function PrimaryKeyDropperJob (executor, tablename, indexname, defer) {
    this.id = ++_id;
    mylib.SyncQuery.call(this, executor, 'ALTER TABLE "'+tablename+'" DROP CONSTRAINT "'+indexname+'"', defer);
  }
  lib.inherit(PrimaryKeyDropperJob, mylib.SyncQuery);
  PrimaryKeyDropperJob.prototype.destroy = function () {
    mylib.SyncQuery.prototype.destroy.call(this);
  };
  
  mylib.PrimaryKeyDropper = PrimaryKeyDropperJob;
}
module.exports = createIndexDropperJob;
