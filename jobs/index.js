function createMSSQLJobs (execlib, sqlsentencing, specializations) {
  'use strict';
  var lib = execlib.lib, 
    mylib = {};
    require ('./basecreator')(lib, mylib);
    require ('./synccreator')(lib, mylib);
    require ('./asynccreator')(execlib, mylib, specializations);

    require ('./syncquerycreator')(lib, mylib);
    require ('./syncsinglequerycreator')(execlib, mylib, specializations);
    require ('./asyncquerycreator')(execlib, mylib, specializations);

    require ('./indexlistercreator')(execlib, mylib, sqlsentencing, specializations);
    require ('./indexcreatorcreator')(lib, mylib, sqlsentencing);
    require ('./indexdroppercreator')(lib, mylib, sqlsentencing);

    require ('./complex')(lib, mylib, sqlsentencing);

    /*
    require ('./steppedjobcreator')(lib, mylib);
    require ('./indexlistercreator')(lib, mylib, sqlsentencinglib);
    require ('./indexcreatorcreator')(lib, mylib, sqlsentencinglib);
    require ('./indexdroppercreator')(lib, mylib, sqlsentencinglib);
    */
  return mylib;
}
module.exports = createMSSQLJobs;
