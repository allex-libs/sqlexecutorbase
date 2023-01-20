function createRowsAffected (execlib, mylib) {
  'use strict';

  function validator () {
    this.recordsetcount=0;
    this.rowsaffectedcount = this.rowsaffectedcount || 1;
    if (this.sentence && !lib.isString(this.sentence) && lib.has(this.sentence, ['template', 'replacements'])) {
      this.sentence = mylib.sqlsentencing.processTemplate(this.sentence.template, this.sentence.replacements)
    }
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