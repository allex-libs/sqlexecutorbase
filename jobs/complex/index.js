function createSQLComplexJobs (lib, mylib, sqlsentencing) {
  'use strict';

  require ('./upsertcreator')(lib, mylib, sqlsentencing);
  require ('./upsertmanycreator')(lib, mylib, sqlsentencing);
  require ('./recordmappercreator')(lib, mylib, sqlsentencing);
}
module.exports = createSQLComplexJobs;