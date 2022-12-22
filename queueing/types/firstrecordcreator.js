function createFirstRecord (execlib, mylib) {
  'use strict';

  var lib = execlib.lib;

  function validator (executor) {
    var t = executor.queueTypeRegistry.get('recordset');
    return t.validator.call(this, executor);
  }

  function analyzer (recordsets, cursor) {
    var mycursor = cursor + (this.recordsetoffset||0);
    var rs = recordsets[mycursor];
    return (lib.isArray(rs) && rs.length>0) ? rs[0] : null;
  }

  return {
    dbname: null,
    type: 'firstrecord',
    validator: validator,
    analyzer: analyzer
  };
}
module.exports = createFirstRecord;