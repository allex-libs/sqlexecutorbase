function createLookupType (execlib, mylib) {
  'use strict';

  var lib = execlib.lib;

  function identitier (thingy) {
    return thingy;
  }
  function arrayOfIdentitiers (len) {
    var ret = [], i;
    for (i=0; i<len; i++) {
      ret.push(identitier);
    }
    return ret;
  }

  function sentencer () {
    return mylib.sqlsentencing.processTemplate(
      "SELECT WHAT FROM TABLE WHERECLAUSE",
      {
        WHAT: this.what,
        TABLE: this.table,
        WHERECLAUSE: 'WHERE '+this.where || ''
      }
    );
  }

  function validator () {
    if (!lib.isNonEmptyString(this.table)) {
      throw new lib.JSONizingError('NO_QUEUE_OBJ_TABLE', this, 'Must have a non-empty "table" property (String)');
    }
    if (!lib.isNonEmptyString(this.what)) {
      throw new lib.JSONizingError('NO_QUEUE_OBJ_WHAT', this, 'Must have a non-empty "what" property (String)');
    }
    if (!this.sentence) {
      this.sentence = sentencer.call(this)
    }
    if (lib.isArrayOfStrings(this.fields)) {
      if (!lib.isArrayOfFunctions(this.proc)) {
        this.proc = arrayOfIdentitiers(this.fields.length);
        //throw new lib.JSONizingError('NO_QUEUE_OBJ_PROC', this, 'Must have a "proc" property (Array)');
      }
      if (this.proc.length != this.fields.length) {
        throw new lib.JSONizingError('QUEUE_OBJ_FIELDS_PROC_MISMATCH', this, 'Must have the same length of "proc" and "fields"');
      }
    }
    this.recordsetcount = 1;
    this.rowsaffectedcount = 1;
  }


  function fielder (obj, col, colname) {
    if (!col) {
      return;
    }
    if (col.index>=obj.maxlen) {
      return;
    }
    obj.ret[col.index] = obj.rec ? obj.rec[colname] : null;
  }

  function analyzer (recordsets, rscursor) {
    var rs, rec, ret, fielderobj;
    rs = recordsets[rscursor];
    rec = rs.length>0 ? rs[0] : null;
    ret = [];
    fielderobj = {
      ret: ret,
      rec: rec,
      maxlen: lib.isArrayOfStrings(this.fields) ? this.fields.length : Infinity
    };
    lib.traverseShallow(rs.columns, fielder.bind(null, fielderobj));
    fielderobj = null;
    return ret;
  }

  return {
    dbname: null,
    type: 'lookup',
    validator: validator,
    analyzer: analyzer,
    schema: {
      table: {type: 'string', required: true},
      what: {type: 'string', required: true},
      where: {type: 'string'}
    }
  }
}
module.exports = createLookupType;