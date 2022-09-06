function createIndexDropperJob (lib, mylib) {
  'use strict';

  function IndexDropperJob (pool, tablename, indexname, defer) {
    mylib.SingleQuery.call(this, pool, defer);
    this.tablename = tablename;
    this.indexname = indexname;
  }
  lib.inherit(IndexDropperJob, mylib.SingleQuery);
  IndexDropperJob.prototype.destroy = function () {
    this.indexname = null;
    this.tablename = null;
    mylib.SingleQuery.prototype.destroy.call(this);
  };
  IndexDropperJob.prototype.queryString = function () {
    return 'DROP INDEX "'+this.indexname+'" ON "'+this.tablename+'"';
  };

  mylib.IndexDropper = IndexDropperJob;

  function PrimaryKeyDropperJob (pool, tablename, indexname, defer) {
    IndexDropperJob.call(this, pool, tablename, indexname, defer);
  }
  lib.inherit(PrimaryKeyDropperJob, IndexDropperJob);
  PrimaryKeyDropperJob.prototype.queryString = function () {
    return 'ALTER TABLE "'+this.tablename+'" '+
    'DROP CONSTRAINT "'+this.indexname+'"';
  };
  
  mylib.PrimaryKeyDropper = PrimaryKeyDropperJob;
}
module.exports = createIndexDropperJob;