var fs = require('fs');

function createExecutor (execlib, resourcehandlinglib, mylib) {
  'use strict';

  var ResMixin = resourcehandlinglib.mixins.ResourceHandler;

  function SQLExecutor (options) {
    ResMixin.call(this, options);
    this.dbname = null;
    this.logname = null;
    this.queueTypeRegistry = null;
    this.queuer = null;
  }
  ResMixin.addMethods(SQLExecutor);
  SQLExecutor.prototype.destroy = function () {
    if (this.queuer) {
      this.queuer.reject(new lib.Error('SQL_EXECUTOR_DYING', 'This instance of '+this.constructor.name+'is already dying'));
    }
    this.queuer = null;
    if(this.queueTypeRegistry) {
       this.queueTypeRegistry.destroy();
    }
    this.queueTypeRegistry = null;
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

  SQLExecutor.prototype.maybeLogComment = function (thingy, caption) {
    this.maybeLog([
      '/*' + (caption ? ' '+caption : ''),
      thingy,
      '*/'
    ].join('\n'));
  };

  SQLExecutor.prototype.prepareForLog = function (thingy) {
    return '\n'+thingy;
  };

  require('./connectionhandling')(execlib, SQLExecutor);
  require('./jobspecificmethods')(execlib, SQLExecutor);

  mylib.Executor = SQLExecutor;
}
module.exports = createExecutor;
