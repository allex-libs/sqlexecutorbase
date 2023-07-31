function createFirstRecord (execlib, mylib) {
  'use strict';

  var lib = execlib.lib;

  function proc (rs) {
    return (lib.isArray(rs) && rs.length>0) ? rs[0] : null;
  }

  return {
    dbname: null,
    type: 'justfirstrecord',
    validator: function () {
      this.type = 'recordset';
      this.rsproc = proc;
    },
    analyzer: lib.dummyFunc
  };
}
module.exports = createFirstRecord;