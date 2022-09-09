function createIndexCreatorJob (lib, mylib, sqlsentencinglib) {
  'use strict';

  function columner (thingy) {
    if (lib.isArray(thingy)) {
      return thingy;
    }
    if (lib.isString(thingy)) {
      return [thingy];
    }
    throw new lib.Error('COLUMNS_NEITHER_AN_ARRAY_NOR_A_STRING', 'Columns provided to IndexCreatorJob have to be an Array of Strings or a single String');
  }

  function IndexCreatorJob (executor, tablename, indexname, columns, defer) {
    mylib.SyncQuery.call(this, executor, sqlsentencinglib.createIndexQuery(tablename, indexname, columner(columns)), defer);
  }
  lib.inherit(IndexCreatorJob, mylib.SyncQuery);

  mylib.IndexCreator = IndexCreatorJob;

  function PrimaryKeyCreatorJob (executor, tablename, indexname, columns, defer) {
    mylib.SyncQuery.call(this, executor, sqlsentencinglib.createPrimaryKeyQuery(tablename, indexname, columner(columns)), defer);
  }
  lib.inherit(PrimaryKeyCreatorJob, IndexCreatorJob);

  mylib.PrimaryKeyCreator = PrimaryKeyCreatorJob;
}
module.exports = createIndexCreatorJob;
