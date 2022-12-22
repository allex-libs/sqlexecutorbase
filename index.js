function createSQLExecutor (execlib, resourcehandlinglib, templateslib) {
  'use strict';
  var mylib = {};
  
  //require('./helperjobs')(execlib, mylib);

  require('./executorcreator')(execlib, resourcehandlinglib, mylib);

  mylib.createSqlSentencing = function (specializations) {
    return require('./sqlsentencing')(execlib, templateslib, specializations);
  };
  mylib.createJobs = function (sqlsentencting, specializations) {
    return require('./jobs')(execlib, sqlsentencting, specializations);
  };
  mylib.createJobCores = function (specializations) {
    return require('./jobcores')(execlib, specializations);
  };
  mylib.createExecutorQueueing = require('./queueing').bind(null, execlib, templateslib);

  return mylib;
}
function createLib (execlib) {
  'use strict';
  var ret = execlib.loadDependencies('client', ['allex:resourcehandling:lib','allex:templateslite:lib'], createSQLExecutor.bind(null, execlib));
  execlib = null;
  return ret;
}
module.exports = createLib;
