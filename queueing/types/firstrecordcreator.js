function createFirstRecord (execlib, mylib) {
  'use strict';

  var lib = execlib.lib;

  function validator (executor) {
    var t = executor.queueTypeRegistry.get('recordset');
    return t.validator.call(this, executor);
  }

  function analyzer (recordsets, cursor, executor) {
    var mycursor = cursor + (this.recordsetoffset||0);
    var rs = recordsets[mycursor];
    var rec;
    var lut;
    var myrs;
    lut = executor.queueTypeRegistry.get('lookup');
    if (!lut) {
      throw new lib.Error('NO_LOOKUP_TYPE_FOR_FIRSTRECOR', 'firstrecord type needs the "lookup" type for analysis');
    }
    rec = (lib.isArray(rs) && rs.length>0) ? rs[0] : null;
    myrs = [rec];
    myrs.columns = rs.columns;
    return lut.analyzer.call(this, [myrs], 0, executor);
    return rec;
  }

  return {
    dbname: null,
    type: 'firstrecord',
    validator: validator,
    analyzer: analyzer
  };
}
module.exports = createFirstRecord;