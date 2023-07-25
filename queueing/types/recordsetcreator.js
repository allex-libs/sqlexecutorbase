function createRecordset (execlib, mylib) {
  'use strict';

  var lib = execlib.lib;

  function recordsetprocessor () {
    return this.rsproc.call(this, Array.prototype.slice.call(arguments));
  }

  function recordapplier (rec) {
    return this.recproc.call(this, rec);
  }

  function recordprocessor () {
    var p = recordapplier.bind(this);
    var ret = Array.prototype.slice.call(arguments).map(p);
    p = null;
    return ret;
  }

  function prepareProc () {
    if (lib.isFunction(this.rsproc)) {
      this.proc = recordsetprocessor;
      return;
    }
    if (lib.isFunction(this.recproc)) {
      this.proc = recordprocessor;
      return;
    }
  }

  function validator () {
    this.recordsetcount=this.recordsetcount || 1;
    this.rowsaffectedcount= lib.isNumber(this.rowsaffectedcount) ? this.rowsaffectedcount : this.recordsetcount;
    if (this.sentence && !lib.isString(this.sentence) && lib.has(this.sentence, ['template', 'replacements'])) {
      this.sentence = mylib.sqlsentencing.processTemplate(this.sentence.template, this.sentence.replacements, this.sentence.prereplacements)
    }
    prepareProc.call(this);
  }

  function analyzer (recordsets, rscursor) {
    var mycursor = rscursor + (this.recordsetoffset||0);
    return recordsets[mycursor];
  }

  return {
    dbname: null,
    type: 'recordset',
    validator: validator,
    analyzer: analyzer
  };
}
module.exports = createRecordset;