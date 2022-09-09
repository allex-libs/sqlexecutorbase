function createIndexDropperJob (lib, mylib) {
  'use strict';

  function IndexDropperJob (executor, tablename, indexname, defer) {
    mylib.SyncQuery.call(this, executor, 'DROP INDEX "'+indexname+'" ON "'+tablename+'"', defer);
  }
  lib.inherit(IndexDropperJob, mylib.SyncQuery);

  mylib.IndexDropper = IndexDropperJob;

  function PrimaryKeyDropperJob (executor, tablename, indexname, defer) {
    mylib.SyncQuery.call(this, executor, 'ALTER TABLE "'+tablename+'" DROP CONSTRAINT "'+indexname+'"', defer);
  }
  lib.inherit(PrimaryKeyDropperJob, mylib.SyncQuery);
  
  mylib.PrimaryKeyDropper = PrimaryKeyDropperJob;
}
module.exports = createIndexDropperJob;
