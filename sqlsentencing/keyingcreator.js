function createKeyingFunctionality (execlib, specializations, mylib) {
  'use strict';

  var lib = execlib.lib;

  function indexColumnsQueryForTable (tablename) {
    throw new lib.Error('NOT_IMPLEMENTED', 'indexColumnsQueryForTable is implementation specific');
  }

  function indexCreationText () {
    return 'INDEX';
  }
  function primaryKeyCreationText () {
    return 'PRIMARY KEY';
  }

  function createIndexQuery (tablename, indexname, columns) {
    if (!lib.isArray(columns)) {
      throw new lib.Error('COLUMNS_NOT_AN_ARRAY', 'Columns provided to createIndexQuery have to be an Array of Strings');
    }
    indexname = indexname || 'idx_'+lib.uid();
    return 'CREATE '+mylib.indexCreationText()+' '+
      mylib.entityNameOf(indexname)+
      ' ON '+mylib.entityNameOf(tablename)+' '+
      indexColumnsString(columns);
  }

  function createPrimaryKeyQuery (tablename, indexname, columns) {
    if (!lib.isArray(columns)) {
      throw new lib.Error('COLUMNS_NOT_AN_ARRAY', 'Columns provided to createPrimaryKeyQuery have to be an Array of Strings');
    }
    indexname = indexname || 'idx_'+lib.uid();
    return 'ALTER TABLE '+
      mylib.entityNameOf(tablename)+
      ' ADD CONSTRAINT '+mylib.entityNameOf(indexname)+' '+mylib.primaryKeyCreationText()+' '+
      indexColumnsString(columns);
  }

  function indexColumnsString (columns) {
    if (!lib.isArray(columns)) {
      throw new lib.Error('COLUMNS_NOT_AN_ARRAY', 'Columns provided to indexColumnsString have to be an Array of Strings');
    }
    return '('+columns.map(mylib.entityNameOf).join(', ')+')';
  }

  mylib.indexCreationText = specializations.indexCreationText || indexCreationText;
  mylib.primaryKeyCreationText = specializations.primaryKeyCreationText || primaryKeyCreationText;
  mylib.indexColumnsQueryForTable = specializations.indexColumnsQueryForTable || indexColumnsQueryForTable;
  mylib.createIndexQuery = createIndexQuery;
  mylib.createPrimaryKeyQuery = createPrimaryKeyQuery;
  mylib.indexColumnsString = indexColumnsString;
}
module.exports = createKeyingFunctionality;