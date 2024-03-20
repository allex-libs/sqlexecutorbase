function createJustFirstRecordUnconditionally (execlib, mylib) {
  'use strict';

  var lib = execlib.lib;

  function proc (rs) {
    var ret = (lib.isArray(rs) && rs.length>0) ? rs[0] : void 0;
    if (lib.isFunction(this.particularproc)) {
      return this.particularproc(ret);
    }
    return ret;
  }

  return {
    dbname: null,
    type: 'justfirstrecordunconditionally',
    validator: function () {
      this.type = 'recordset';
      this.particularproc = this.proc;
      this.rsproc = proc;
    },
    analyzer: lib.dummyFunc
  };
}
module.exports = createJustFirstRecordUnconditionally;