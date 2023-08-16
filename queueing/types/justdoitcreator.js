function createJustDoIt (execlib, mylib) {
  'use strict';

  var lib = execlib.lib;

  function validator () {
    this.recordsetcount=0;
    this.rowsaffectedcount=0;
    if (this.sentence && !lib.isString(this.sentence) && lib.has(this.sentence, ['template'])) {
      this.sentence = mylib.sqlsentencing.processTemplate(this.sentence.template, this.sentence.replacements, this.sentence.prereplacements)
    }
  }

  function analyzer (recordsets, rscursor) {
    return true;
  }

  return {
    dbname: null,
    type: 'justdoit',
    validator: validator,
    analyzer: analyzer
  };
}
module.exports = createJustDoIt;