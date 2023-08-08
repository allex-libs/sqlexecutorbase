function createFirstRecord (execlib, mylib) {
  'use strict';

  var lib = execlib.lib;

  function proc (rs) {
    var ret = (lib.isArray(rs) && rs.length>0) ? rs[0] : null;
    if (ret && lib.isFunction(this.particularproc)) {
      return this.particularproc(ret);
    }
    return ret;
  }

  return {
    dbname: null,
    type: 'justfirstrecord',
    validator: function () {
      this.type = 'recordset';
      this.particularproc = this.proc;
      this.rsproc = proc;
    },
    analyzer: lib.dummyFunc
  };
}
module.exports = createFirstRecord;