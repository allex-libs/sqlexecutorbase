var fs = require('fs');

function createExecutor (execlib, resourcehandlinglib, mylib) {
  'use strict';

  var ResMixin = resourcehandlinglib.mixins.ResourceHandler;

  function SQLExecutor (options) {
    ResMixin.call(this, options);
    this.dbname = null;
    this.logname = null;
  }
  ResMixin.addMethods(SQLExecutor);
  SQLExecutor.prototype.destroy = function () {
    this.logname = null;
    this.dbname = null;
    ResMixin.prototype.destroy.call(this);
  };

  SQLExecutor.prototype.startLog = function (logname) {
    this.logname = logname;
  };
  SQLExecutor.prototype.stopLog = function () {
    this.startLog(null);
  };

  SQLExecutor.prototype.maybeLog = function (thingy) {
    if (this.logname) {
      fs.appendFileSync(this.logname, this.prepareForLog(thingy));
    }
  };

  SQLExecutor.prototype.prepareForLog = function (thingy) {
    return '\n'+thingy;
  };

  require('./connectionhandling')(execlib, SQLExecutor);
  require('./jobspecificmethods')(execlib, SQLExecutor);

  mylib.Executor = SQLExecutor;
}
module.exports = createExecutor;
