function createJustDoIt (execlib, mylib) {
  'use strict';

  var lib = execlib.lib;

  function upsertmapper (rec) {
    return {
      type: 'upsert',
      tablename: this.tablename,
      record: rec,
      selectfields: this.selectfields,
      setfields: this.setfields
    };
  }

  function aggregator (res, ups) {
    res.updated += ups.updated;
    res.inserted += ups.inserted;
    return res;
  }

  function proc () {
    var ret = Array.prototype.reduce.call(arguments, aggregator, {updated: 0, inserted: 0});
    return lib.isFunction(this.finalproc) 
    ?
    this.finalproc(ret)
    :
    ret;
  }

  function validator (executor) {
    this.type='composite';
    this.items = this.records.map(upsertmapper.bind(this));
    this.finalproc = this.proc;
    this.proc = proc.bind(this);
    executor = null;
  }

  function analyzer (recordsets, rscursor) {
    return true;
  }

  return {
    dbname: null,
    type: 'upsertmany',
    validator: validator,
    analyzer: analyzer,
    schema: {
      tablename: {type: 'string', required: true},
      records: {type: 'array', required: true},
      selectfields: {type: 'array', items: {type: 'string'}},
      setfields: {type: 'array', items: {type: 'string'}}
    }
  };
}
module.exports = createJustDoIt;