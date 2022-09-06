function createIndexLister (lib, mylib, sqlsentencinglib) {
  'use strict';
  var q = lib.q,
    qlib = lib.qlib;

  function IndexDescriptor (name) {
    this.name = name;
    this.columns = [];
  }
  IndexDescriptor.prototype.destroy = function () {
    this.columns = null;
    this.name = null;
  };
  IndexDescriptor.prototype.addColumn = function (col) {
    this.columns.push(col);
  };
  IndexDescriptor.prototype.matchesColumns = function (columns) {
    var tc, c;
    if (!lib.isArray(columns)){
      return false;
    }
    if (!lib.isArray(this.columns)) {
      return false;
    }
    if (this.columns.length != columns.length) {
      return false;
    }
    tc = this.columns.slice();
    while(tc.length) {
      c = tc.pop();
      if (columns.indexOf(c)<0) {
        return false;
      }
    }
    return true;
  }
  mylib.IndexDescriptor = IndexDescriptor;

  function Indexes (tablename) {
    this.tablename = tablename;
    this.primary = null;
    this.all = new lib.Map();
  }
  Indexes.prototype.destroy = function () {
    if (this.all) {
      lib.containerDestroyAll(this.all);
      this.all.destroy();
    }
    this.all = null;
    this.primary = null;
    this.tablename = null;
  };
  Indexes.prototype.addIndexColumn = function (indexname, indexcolumn, isprimarykey) {
    var i = this.all.get(indexname);
    if (!i) {
      i = new IndexDescriptor(indexname);
      this.all.add(indexname, i);
    }
    i.addColumn(indexcolumn);
    if (isprimarykey) {
      this.primary = i;
    }
  };
  Indexes.prototype.drop = function (pool, indexname) {
    var i = this.all.remove(indexname);
    if (!i) {
      return;
    }
    var jobctor = (i == this.primary) ? mylib.PrimaryKeyDropper : mylib.IndexDropper;
    var ret = (new jobctor(pool, this.tablename, indexname)).go();
  };
  Indexes.prototype.add = function (pool, indexdescriptor, primarykey) {
    var ci, ctor;
    if (this.primary && primarykey) {
      return q.reject(new lib.Error('PRIMARY_KEY_ALREADY_EXISTS', 'Cannot add primary key because one already exists'));
    }
    if (!(indexdescriptor && indexdescriptor.name && lib.isArray(indexdescriptor.columns))) {
      return q(false);
    }
    ci = this.all.get(indexdescriptor.name);
    if (ci) {
      return q.reject(new lib.Error('INDEX_ALREADY_EXISTS', 'Index named '+indexdescriptor.name+' already exists'));
    }
    ctor = primarykey ? mylib.PrimaryKeyCreator : mylib.IndexCreator;
    (new ctor(this.client, this.tablename, indexdescriptor.name, indexdescriptor.columns));
  };
  Indexes.prototype.onIndexCreated = function (indexdescriptor, ignore_result) {
    this.all.add(indexdescriptor.name, indexdescriptor);
    return true;
  };

  function IndexListerJob (pool, tablename, defer) {
    mylib.SingleQuery.call(this, pool, defer);
    this.tablename = tablename;
  }
  lib.inherit(IndexListerJob, mylib.SingleQuery);
  IndexListerJob.prototype.destroy = function () {
    this.tablename = null;
    mylib.SingleQuery.prototype.destroy.call(this);
  };
  IndexListerJob.prototype.queryString = function () {
    return sqlsentencinglib.indexColumnsQueryForTable(this.tablename);
  };
  IndexListerJob.prototype.onQueryResult = function (res) {
    var inds = new Indexes(this.tablename), i, r;
    if (!(res && lib.isArray(res.recordset) && res.recordset.length)) {
      this.resolve(inds);
      return;
    }
    for (i=0; i<res.recordset.length; i++) {
      r = res.recordset[i];
      inds.addIndexColumn(r.name, r.index_column_id, r.is_primary_key)
    }
    this.resolve(inds);
  };
  
  mylib.IndexLister = IndexListerJob;
}
module.exports = createIndexLister;