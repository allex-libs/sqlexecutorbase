function createConnectionHandling(execlib, SQLExecutor) {
  'use strict';

  SQLExecutor.prototype.connect = function () {
    return this.getHoldOfResource();
  };
  SQLExecutor.prototype.acquireResource = function (desc) {
    throw new lib.Error('NOT_IMPLEMENTED', this.constructor.name+' has to implement acquireResource');
  };
  SQLExecutor.prototype.isResourceUsable = function (connection) {
    throw new lib.Error('NOT_IMPLEMENTED', this.constructor.name+' has to implement isResourceUsable');
  };
  SQLExecutor.prototype.destroyResource = function (res) {
    throw new lib.Error('NOT_IMPLEMENTED', this.constructor.name+' has to implement destroyResource');
  };
}

module.exports = createConnectionHandling;
