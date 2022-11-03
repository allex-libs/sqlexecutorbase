function createSqlValuer (execlib, mylib) {
  'use strict';

  var lib = execlib.lib;

  var _NULL = 'NULL';
  function entityNameOf(val){
    if (!lib.isVal(val)) return _NULL;
    if (val[0]=='"') return val;
    return '"'+val+'"';

  }
  function quoted (val) {
    if (!lib.isVal(val)) return _NULL;
    //if (val[0]=="'") return val;
    return "'"+val.replace(/'/g, "''")+"'";
  }
  function sqlValueOf (datahash, field) {
    var val = datahash[field.name];
    if (!lib.isVal(val)) return _NULL;
    switch(field.type){
      case 'string': return quoted(val);
      case 'integer': 
      case 'number': 
        return val;
      case 'boolean':
        return val ? 1 : 0;
      case 'null':
        return _NULL;
      default: return val;
    }
  }
  function dateStringPart(char, datum) {
    switch (char) {
      case 'm':
        return datum.getMonth()+1;
      case 'd':
        return datum.getDay();
      case 'y':
        return datum.getFullYear();
      default:
        throw new lib.Error('UNRECOGNIZED_DATEFORMAT_CHAR', char+' is not a valid dateformat char');
    }
  }
  function dateString (datum) {
    var i, res;
    if (!(datum instanceof Date)) {
      throw new lib.Error('NOT_A_DATE', 'dateString works only on Date instances');
    }
    res = '';
    for (i=0; i<3; i++) {
      res = lib.joinStringsWith(res, dateStringPart(mylib.dateformat[i], datum), '/');
    }
    return res;
  }
  function toSqlValue (value) {
    if (value instanceof Date) return quoted(dateString(value)+' '+value.getHours()+':'+value.getMinutes()+':'+value.getSeconds()+'.'+value.getMilliseconds());
    if (lib.isString(value)) return quoted(value);
    if (lib.isNumber(value)) return value;
    if (lib.isBoolean(value)) return value ? 1 : 0;
    return _NULL;
  }
  function hashToSqlValue (hash) {
    var ret = {}, _r = ret;
    lib.traverseShallow(hash, hashToSqlValueer.bind(null, _r));
    _r = null;
    return ret;
  }
  function hashToSqlValueer (ret, val, name) {
    ret[name] = toSqlValue(val);
  }
  function equal (a, b) {
    var b1 = toSqlValue(b);
    return a+(b1==_NULL ? ' IS ' : '<>')+b1;
  }
  function unEqual (a, b) {
    var b1 = toSqlValue(b);
    return a+(b1==_NULL ? ' IS NOT ' : '<>')+b1;
  }

  function scalarmapper (s) {
    return '('+toSqlValue(s)+')';
  }


  function hashvaluer (hash, res, prop) {
    res.push(toSqlValue(hash[prop]));
    return res;
  }

  function hashmapper (props, h) {
    var vals = props.reduce(hashvaluer.bind(null, h), []);
    h = null;
    return '('+vals.join(',')+')';
  }

  function toValuesOfScalarArray (arrayofscalars, scalarsqlname) {
    var scalarsqlname = scalarsqlname||'a';
    return '(SELECT '+scalarsqlname+' FROM (VALUES'+arrayofscalars.map(scalarmapper).join(',')+') AS t('+scalarsqlname+'))';
  }
  function justValuesOfHashArray (arrayofhashes, arrayofhashpropertynames) {
    var ret;
    if (!lib.isArray(arrayofhashes)) {
      throw new lib.Error('HASHES_NOT_AN_ARRAY', 'Hashes has to be an Array of Objects');
    }
    if (!lib.isArray(arrayofhashpropertynames)) {
      throw new lib.Error('HASHPROPERTYNAMES_NOT_AN_ARRAY', 'Hash property names has to be an Array of Strings');
    }
    ret = 'VALUES'+arrayofhashes.map(hashmapper.bind(null, arrayofhashpropertynames));
    arrayofhashpropertynames = null;
    return ret;
  }
  function toValuesTableOfHashArray (arrayofhashes, arrayofhashpropertynames) {
    var hpns, ret;
    if (!lib.isArray(arrayofhashes)) {
      throw new lib.Error('HASHES_NOT_AN_ARRAY', 'Hashes has to be an Array of Objects');
    }
    if (!lib.isArray(arrayofhashpropertynames)) {
      throw new lib.Error('HASHPROPERTYNAMES_NOT_AN_ARRAY', 'Hash property names has to be an Array of Strings');
    }
    hpns = arrayofhashpropertynames.join(',');
    ret = '('+justValuesOfHashArray(arrayofhashes, arrayofhashpropertynames)+') AS t('+hpns+')';
    return ret;
  }
  function toValuesOfHashArray (arrayofhashes, arrayofhashpropertynames) {
    var hpns, ret;
    if (!lib.isArray(arrayofhashes)) {
      throw new lib.Error('HASHES_NOT_AN_ARRAY', 'Hashes has to be an Array of Objects');
    }
    if (!lib.isArray(arrayofhashpropertynames)) {
      throw new lib.Error('HASHPROPERTYNAMES_NOT_AN_ARRAY', 'Hash property names has to be an Array of Strings');
    }
    hpns = arrayofhashpropertynames.join(',');
    ret = '(SELECT '+hpns+' FROM '+toValuesTableOfHashArray(arrayofhashes, arrayofhashpropertynames)+')';
    return ret;
  }
  function insertValuesOfHashArray (tablename, arrayofhashes, arrayofhashpropertynames) {
    var hpns, ret;
    if (!lib.isArray(arrayofhashes)) {
      throw new lib.Error('HASHES_NOT_AN_ARRAY', 'Hashes has to be an Array of Objects');
    }
    if (!lib.isArray(arrayofhashpropertynames)) {
      throw new lib.Error('HASHPROPERTYNAMES_NOT_AN_ARRAY', 'Hash property names has to be an Array of Strings');
    }
    if (arrayofhashes.length<1) {
      return '';
    }
    hpns = arrayofhashpropertynames.join(',');
    ret = 'INSERT INTO '+tablename+' ('+hpns+') '+justValuesOfHashArray(arrayofhashes, arrayofhashpropertynames);
    return ret;

  }

  function SetStringMaker(obj){
    var arryObj = {
      arry : []
    };
    lib.traverseShallow(obj, set_string_maker_cb.bind(this, arryObj));
    return arryObj.arry.join(',');
  }
  function set_string_maker_cb(arryObj, item, key){
    arryObj.arry.push(''+key + '=' + toSqlValue(item));
  }

  function InsertStringMaker(obj){
    var arryObj = {
      arry1 : [],
      arry2 : []
    };
    lib.traverseShallow(obj, insert_string_maker_cb.bind(this, arryObj));
    return "(" + arryObj.arry1.join(',') + ") VALUES (" + arryObj.arry2.join(',') + ")";
  }
  function insert_string_maker_cb(arryObj, item, key){
    arryObj.arry1.push(''+key);
    arryObj.arry2.push('' + toSqlValue(item));
  }

  function selectViaFieldNames (tablename, wherefieldnames, record) {
    var whereclauses = [], wherefn, i;
    for(i=0; i<wherefieldnames.length; i++){
      wherefn = wherefieldnames[i];
      whereclauses.push(mylib.entityNameOf(wherefn)+'='+mylib.toSqlValue(record[wherefn]));
    }
    return "SELECT * FROM "+mylib.entityNameOf(tablename)+" WHERE "+whereclauses.join(' AND ');
  };
  function selectViaFieldNamesFromHashArray (tablename, wherefieldnames, records) {
    var whereclauses = [], subwhereclauses = [], wherefn, i, j, r;
    for(i=0; i<records.length; i++) {
      r = records[i];
      for(j=0; j<wherefieldnames.length; j++){
        wherefn = wherefieldnames[j];
        subwhereclauses.push(mylib.entityNameOf(wherefn)+'='+mylib.toSqlValue(r[wherefn]));
      }
      whereclauses.push(subwhereclauses.join(' AND '));
    }
    return "SELECT * FROM "+mylib.entityNameOf(tablename)+" WHERE "+subwhereclauses.join(' AND ');
  };
  function updateViaWhereAndSetFieldNames (tablename, wherefieldnames, setfieldnames, record) {
    var whereclauses = [], wherefn, setclauses = [], setfn, i;
    for(i=0; i<wherefieldnames.length; i++){
      wherefn = wherefieldnames[i];
      whereclauses.push(mylib.entityNameOf(wherefn)+'='+mylib.toSqlValue(record[wherefn]));
    }
    for(i=0; i<setfieldnames.length; i++) {
      setfn = setfieldnames[i];
      setclauses.push(mylib.entityNameOf(setfn)+'='+mylib.toSqlValue(record[setfn]));
    }
    return "UPDATE "+mylib.entityNameOf(tablename)+" SET "+setclauses.join(', ')+" WHERE "+whereclauses.join(' AND ');
  };


  mylib.dateformat = 'mdy';
  mylib.entityNameOf = entityNameOf;
  mylib.quoted = quoted;
  mylib.sqlValueOf = sqlValueOf;
  mylib.toSqlValue = toSqlValue;
  mylib.hashToSqlValue = hashToSqlValue;
  mylib.equal = equal;
  mylib.unEqual = unEqual;
  mylib.justValuesOfHashArray = justValuesOfHashArray;
  mylib.toValuesTableOfHashArray = toValuesTableOfHashArray;
  mylib.toValuesOfScalarArray = toValuesOfScalarArray;
  mylib.toValuesOfHashArray = toValuesOfHashArray;
  mylib.insertValuesOfHashArray = insertValuesOfHashArray;
  mylib.SetStringMaker = SetStringMaker;
  mylib.InsertStringMaker = InsertStringMaker;
  mylib.selectViaFieldNames = selectViaFieldNames;
  mylib.selectViaFieldNamesFromHashArray = selectViaFieldNamesFromHashArray;
  mylib.updateViaWhereAndSetFieldNames = updateViaWhereAndSetFieldNames;
}

module.exports = createSqlValuer;