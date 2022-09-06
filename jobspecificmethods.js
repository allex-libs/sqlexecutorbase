function createJobSpecificMethods (execlib, SQLExecutor) {
  'use strict';

  SQLExecutor.prototype.activateConnection = function (connection) {
    throw new lib.Error('NOT_IMPLEMENTED', this.constructor.name+' has to implement activateConnection');
  };

}
module.exports = createJobSpecificMethods;