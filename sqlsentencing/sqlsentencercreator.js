function createSqlSentencer(execlib, mylib){
  'use strict';

    var lib = execlib.lib,
  q = lib.q;

  function SqlSentencer () {

  }
  SqlSentencer.prototype.destroy = function () {

  };
  SqlSentencer.prototype.insertFromDataRecord = function(tablename, record, datahash) {
    var cols = [], values = [], f, i;
    for(i=0; i<record.fields.length; i++){
      f = record.fields[i];
      cols.push(mylib.entityNameOf(f.name));
      values.push(mylib.sqlValueOf(datahash, f));
    }
    return "INSERT INTO "+mylib.entityNameOf(tablename)+" ("+cols.join(',')+") VALUES("+values.join(',')+")";
  };
  SqlSentencer.prototype.setClauseFromObject = function (obj) {
    var ret = '';
    for (var p in obj) {
      if (!obj.hasOwnProperty(p)) continue;
      if (ret.length>0) ret = ret + ', ';
      ret += p+'='+mylib.toSqlValue(obj[p]);
    }
    return ret.length>0 ? 'SET '+ret : ret;
  };

  mylib.SqlSentencer = SqlSentencer;
}

module.exports = createSqlSentencer;