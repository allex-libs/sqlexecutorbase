var fs = require('fs');

function createExecutor (execlib, resourcehandlinglib, mylib) {
  'use strict';

  var lib = execlib.lib;
  var ResMixin = resourcehandlinglib.mixins.ResourceHandler;

  function SQLLogger () {
    this.logname = null;
    this.lastInvocation = lib.now();
  }
  SQLLogger.prototype.destroy = function () {
    this.lastInvocation = null;
    this.logname = null;
  };
  SQLLogger.prototype.setLogName = function (logname) {
    this.logname = logname;
  };
  SQLLogger.prototype.maybeLog = function (thingy) {
    var li = this.lastInvocation;
    this.lastInvocation = lib.now();
    maybeWriteToFile.call(this,
      '\n'+formatComment(
        'After '+((this.lastInvocation-li)/1000)+' sec',
        ''
      )+thingy
    );
  };
  SQLLogger.prototype.maybeLogComment = function (thingy, caption) {
    this.lastInvocation = lib.now();
    maybeWriteToFile.call(this, formatComment(thingy, caption));
  };
  //statics on SQLLogger
  function maybeWriteToFile (thingy) {
    if (this.logname) {
      fs.appendFileSync(this.logname, thingy);
    }
  } 
  //endof statics on SQLLogger
  //functions for SQLLogger
  function formatComment (thingy, caption) {
    return (caption ? [
      '/*' + (caption ? ' '+caption : ''),
      thingy,
      '*/'
    ].join('\n') : '/* '+thingy+' */')+'\n';
  }
  //endof functions for SQLLogger

  function SQLExecutor (options) {
    ResMixin.call(this, options);
    this.dbname = null;
    this.logger = new SQLLogger();
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
    if(this.logger) {
      this.logger.destroy();
    }
    this.logger = null;
    this.dbname = null;
    ResMixin.prototype.destroy.call(this);
  };

  SQLExecutor.prototype.startLog = function (logname) {
    if (this.logger) {
      this.logger.setLogName(logname);
    }
  };
  SQLExecutor.prototype.stopLog = function () {
    this.startLog(null);
  };

  SQLExecutor.prototype.maybeLog = function (thingy) {
    if (this.logger) {
      this.logger.maybeLog(this.prepareForLog(thingy));
    }
  };

  SQLExecutor.prototype.maybeLogComment = function (thingy, caption) {
    if (this.logger) {
      this.logger.maybeLogComment(thingy, caption);
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
