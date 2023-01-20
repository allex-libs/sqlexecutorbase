function createBaseTypes (execlib, mylib) {
  'use strict';

  var ret = [];
  ret.push(require('./justdoitcreator')(execlib, mylib));
  ret.push(require('./lookupcreator')(execlib, mylib));
  ret.push(require('./compositecreator')(execlib, mylib));
  ret.push(require('./verbatimcreator')(execlib, mylib));
  ret.push(require('./recordsetcreator')(execlib, mylib));
  ret.push(require('./recordset2arryofscalarscreator')(execlib, mylib));
  ret.push(require('./firstrecordcreator')(execlib, mylib));
  ret.push(require('./rowsaffectedcreator')(execlib, mylib));
  
  ret.push(require('./upsertcreator')(execlib, mylib));
  ret.push(require('./upsertmanycreator')(execlib, mylib));
  return ret;
}
module.exports = createBaseTypes;