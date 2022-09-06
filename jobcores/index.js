function createMSSQLStorageJobCores (execlib, specializations) {
  'use strict';
  var lib = execlib.lib, 
    mylib = {};

  require ('./onebyoneprocessor')(lib, mylib);
  require ('./txnwrapped')(execlib, specializations, mylib);

  return mylib;
}
module.exports = createMSSQLStorageJobCores;