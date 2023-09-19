function createJustDoIt (execlib, mylib) {
  'use strict';

  var lib = execlib.lib;

  function afterread (executor, rs) {
    if (lib.isArray(rs) && rs.length>0) {
      //update
      return executor.queue({
        type: 'rowsaffected',
        sentence: mylib.sqlsentencing.updateViaWhereAndSetFieldNames(
          this.tablename,
          this.selectfields,
          this.setfields,
          this.record
        ),
        field: 'updated',
        result: this.result
      });
    }
    return executor.queue({
      type: 'rowsaffected',
      sentence: mylib.sqlsentencing.insertValuesOfHashArray(
        this.tablename,
        [this.record],
        [].concat(this.selectfields||[]).concat(this.setfields||[]).concat(this.setonlyfields||[])
      ),
      field: 'inserted',
      result: this.result
    });
  }

  function validator (executor) {
    this.type='recordset';
    this.sentence = mylib.sqlsentencing.selectViaFieldNames(
      this.tablename,
      this.selectfields,
      this.record
    );
    this.finalproc = this.proc;
    this.rsproc = afterread.bind(this, executor);
    this.result = {
      inserted: 0,
      updated: 0
    };
    executor = null;
  }

  function analyzer (recordsets, rscursor) {
    return true;
  }

  return {
    dbname: null,
    type: 'upsert',
    validator: validator,
    analyzer: analyzer,
    schema: {
      tablename: {type: 'string', required: true},
      record: {type: ['object', 'array'], required: true},
      selectfields: {type: 'array', items: {type: 'string'}},
      setfields: {type: 'array', items: {type: 'string'}},
      setonlyfields: {type: 'array', items: {type: 'string'}}
    }
  };
}
module.exports = createJustDoIt;