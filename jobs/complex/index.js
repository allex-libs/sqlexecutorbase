function createSQLComplexJobs (lib, mylib, sqlsentencing, specializations) {
  'use strict';

  require ('./upsertcreator')(lib, mylib, sqlsentencing, specializations);
  require ('./upsertmanycreator')(lib, mylib, sqlsentencing, specializations);
  require ('./recordmappercreator')(lib, mylib, sqlsentencing);
}
module.exports = createSQLComplexJobs;