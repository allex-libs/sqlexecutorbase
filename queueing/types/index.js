function createBaseTypes (execlib, mylib) {
  'use strict';

  var ret = [];
  ret.push(require('./lookupcreator')(execlib, mylib));
  ret.push(require('./compositecreator')(execlib, mylib));
  ret.push(require('./verbatimcreator')(execlib, mylib));
  ret.push(require('./recordsetcreator')(execlib, mylib));
  ret.push(require('./recordset2arryofscalarscreator')(execlib, mylib));
  ret.push(require('./firstrecordcreator')(execlib, mylib));
  return ret;
}
module.exports = createBaseTypes;