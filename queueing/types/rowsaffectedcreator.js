function createRowsAffected (execlib, mylib) {
  'use strict';

  var lib = execlib.lib;

  function validator () {
    this.recordsetcount=0;
    this.rowsaffectedcount = this.rowsaffectedcount || 1;
    if (this.sentence && !lib.isString(this.sentence) && lib.has(this.sentence, ['template'])) {
      this.sentence = mylib.sqlsentencing.processTemplate(this.sentence.template, this.sentence.replacements, this.sentence.prereplacements)
    }
    if (this.totalall) {
      this.proc = allsummer;
    }
  }

  function allsummer () {
    return Array.prototype.slice.call(arguments).reduce(summer, 0);
  }
  function summer (res, rowsaffected) {
    return res+rowsaffected;
  }

  function analyzer (rowsaffected, rscursor) {
    if (this.rowsaffectedcount > 1 && !lib.isNumber(this.rowsaffectedoffset)) {
      return rowsaffected.slice(rscursor, rscursor+this.rowsaffectedcount);
    }
    var mycursor = rscursor + (this.rowsaffectedoffset||0);
    return rowsaffected[mycursor];
  }

  return {
    dbname: null,
    expectsrowsaffected: true,
    type: 'rowsaffected',
    validator: validator,
    analyzer: analyzer
  };

}
module.exports = createRowsAffected;