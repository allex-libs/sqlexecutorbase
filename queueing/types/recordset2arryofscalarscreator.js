function createRecordset2ArryOfScalarsType (execlib, mylib) {
  'use strict';

  var lib = execlib.lib;

  function proc (rec) {
    var ret = rec[this.scalarfield];
    return lib.isFunction(this.scalarproc) ? this.scalarproc(ret) : ret;
  }
  return {
    dbname: null,
    type: 'recordset2arryofscalars',
    validator: function () {
      this.type = 'recordset';
      this.recproc = proc;
    },
    analyzer: lib.dummyFunc,
    schema: {
      scalarfield: {type: 'string', required:true}
    }
  }
}
module.exports = createRecordset2ArryOfScalarsType;