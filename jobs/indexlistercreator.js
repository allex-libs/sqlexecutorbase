function createIndexLister (execlib, mylib, sqlsentencinglib, specializations) {
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib;

  function IndexDescriptor (name) {
    this.name = name;
    this.columns = [];
  }
  IndexDescriptor.prototype.destroy = function () {
    this.columns = null;
    this.name = null;
  };
  IndexDescriptor.prototype.matchesColumns = function (columns) {
    var tc, c;
    if (lib.isString(columns)) {
      columns = [columns];
    }
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
  //mylib.IndexDescriptor = IndexDescriptor;

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

  Indexes.prototype.drop = function (executor, indexname) {
    var i = this.all.remove(indexname);
    if (!i) {
      return;
    }
    var jobctor = (i == this.primary) ? mylib.PrimaryKeyDropper : mylib.IndexDropper;
    var ret = (new jobctor(executor, this.tablename, indexname)).go();
  };
  Indexes.prototype.add = function (executor, indexdescriptor, primarykey) {
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
  Indexes.prototype.matchesColumnsOnNonPrimary = function (columns) {
    var ret;
    if (!this.all) {
      return false;
    }
    ret = this.all.traverseConditionally(columnMatcherOnNonPrimary.bind(this, columns));
    columns = null;
    return ret;
  };  
  Indexes.prototype.matchesColumnsOnAny = function (columns) {
    var ret;
    if (!this.all) {
      return false;
    }
    ret = this.all.traverseConditionally(columnMatcherOnAny.bind(this, columns));
    columns = null;
    return ret;
  };
  Indexes.prototype.allIndexesExceptPrimaryNotIn = function (idxnames) {
    var retobj, ret, primary;
    if (!this.all) {
      return [];
    } 
    retobj = {ret: []};
    ret = retobj.ret;
    primary = this.primary;
    this.all.traverse(allIndexesExceptPrimaryNotInTraverser.bind(null, retobj, primary, idxnames));
    retobj = null;
    primary = null;
    idxnames = null;
    return ret;
  };
  Indexes.prototype.IndexDescriptor = IndexDescriptor;

  //static, this is Indexes
  function columnMatcherOnNonPrimary (columns, idx, idxname) {
    if (idx == this.primary) {
      return;
    }
    return columnMatcherOnAny.call(this, columns, idx, idxname);
  }
  //static, this is Indexes
  function columnMatcherOnAny (columns, idx, idxname) {
    if (!idx.matchesColumns(columns)) {
      return;
    }
    return idxname;
  }
  //non-static
  function allIndexesExceptPrimaryNotInTraverser (retobj, primary, notin, ix, ixname) {
    if (ix == primary) {
      return;
    }
    if (notin.indexOf(ixname)>=0) {
      return;
    }
    retobj.ret.push(ix);
  }

  function IndexListerJob (executor, tablename, defer) {
    mylib.SyncQuery.call(
      this,
      executor, sqlsentencinglib.indexColumnsQueryForTable(tablename), defer);
    this.tablename = tablename;
  }
  lib.inherit(IndexListerJob, mylib.SyncQuery);
  IndexListerJob.prototype.destroy = function () {
    this.tablename = null;
    mylib.SyncQuery.prototype.destroy.call(this);
  };
  IndexListerJob.prototype.onQueryResult = function (res) {
    throw new lib.Error('NOT_IMPLEMENTED', this.constructor.name+' has to implement onQueryResult');
  };
  IndexListerJob.prototype.Indexes = Indexes;
  
  mylib.IndexLister = (specializations && lib.isFunction(specializations.indexlister))
  ?
  specializations.indexlister(execlib, IndexListerJob)
  :
  IndexListerJob;
}
module.exports = createIndexLister;
