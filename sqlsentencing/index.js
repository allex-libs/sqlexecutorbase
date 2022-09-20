function createSqlSentencingLib (execlib, templateslib, specializations) {
  'use strict';

  var mylib = {};

  require ('./sqlvaluercreator')(execlib, mylib);
  require ('./keyingcreator')(execlib, specializations, mylib);
  require ('./sqlsentencercreator')(execlib, mylib);
  require ('./tablemanagementcreator')(execlib, specializations, mylib);
  require ('./templatizercreator')(execlib, templateslib, mylib);

  return mylib;
}

module.exports = createSqlSentencingLib;