function createIndexCreatorJob (lib, mylib, sqlsentencinglib) {
  'use strict';

  function IndexCreatorJob (executor, tablename, indexname, columns, defer) {
    if (!lib.isArray(columns)) {
      throw new lib.Error('COLUMNS_NOT_AN_ARRAY', 'Columns provided to IndexCreatorJob have to be an Array of Strings');
    }
    mylib.SyncQuery.call(this, executor, defer);
    this.tablename = tablename;
    this.indexname = indexname;
    this.columns = columns;
  }
  lib.inherit(IndexCreatorJob, mylib.SyncQuery);
  IndexCreatorJob.prototype.destroy = function () {
    this.columns = null;
    this.indexname = null;
    this.tablename = null;
    mylib.SyncQuery.prototype.destroy.call(this);
  };
  IndexCreatorJob.prototype.queryString = function () {
    return sqlsentencinglib.createIndexQuery(this.tablename, this.indexname, this.columns);
  };

  mylib.IndexCreator = IndexCreatorJob;

  function PrimaryKeyCreatorJob (executor, tablename, indexname, columns, defer) {
    IndexCreatorJob.call(this, executor, tablename, indexname, columns, defer);
  }
  lib.inherit(PrimaryKeyCreatorJob, IndexCreatorJob);
  PrimaryKeyCreatorJob.prototype.queryString = function () {
    return sqlsentencinglib.createPrimaryKeyQuery(this.tablename, this.indexname, this.columns);
  }

  mylib.PrimaryKeyCreator = PrimaryKeyCreatorJob;
}
module.exports = createIndexCreatorJob;
