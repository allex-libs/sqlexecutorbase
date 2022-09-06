function createSqlSentencingLib (execlib, specializations) {
  'use strict';

  var mylib = {};

  require ('./sqlvaluercreator')(execlib, mylib);
  require ('./keyingcreator')(execlib, specializations, mylib);
  require ('./sqlsentencercreator')(execlib, mylib);
  require ('./tablemanagementcreator')(execlib, mylib);

  return mylib;
}

module.exports = createSqlSentencingLib;