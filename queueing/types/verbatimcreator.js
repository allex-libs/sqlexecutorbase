function createVerbatim (execlib, mylib) {
  'use strict';

  var lib = execlib.lib;

  function validator () {
    if (!lib.isVal(this.value)) {
      this.value = null;
    }
    this.sentence = '';
    this.recordsetcount = 0;
    this.rowsaffectedcount = 0;
  }

  function analyzer () {
    return this.value;
  }

  return {
    dbname: null,
    type: 'verbatim',
    validator: validator,
    analyzer: analyzer
  };
}
module.exports = createVerbatim;