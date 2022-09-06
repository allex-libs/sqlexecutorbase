function createExecutor (execlib, resourcehandlinglib, mylib) {
  'use strict';

  var ResMixin = resourcehandlinglib.mixins.ResourceHandler;

  function SQLExecutor (options) {
    ResMixin.call(this, options);
  }
  ResMixin.addMethods(SQLExecutor);
  SQLExecutor.prototype.destroy = function () {
    ResMixin.prototype.destroy.call(this);
  };

  require('./connectionhandling')(execlib, SQLExecutor);
  require('./jobspecificmethods')(execlib, SQLExecutor);

  mylib.Executor = SQLExecutor;
}
module.exports = createExecutor;
