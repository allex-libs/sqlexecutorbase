function createTableManagement (execlib, mylib) {
  'use strict';

  var lib = execlib.lib;

  function fieldmapper(fld) {
    var ret;
    if (!fld) {
      throw new lib.Error('FIELD_DOES_NOT_EXIST', 'Field in the array of fields does not exist');
    }
    if (!lib.isString(fld.name)) {
      throw new lib.Error(('FIELD_HAS_NO_NAME', 'Field in the array of fields has no name'));
    }
    if (!lib.isString(fld.type)) {
      throw new lib.Error(('FIELD_HAS_NO_TYPE', 'Field in the array of fields has no type'));
    }
    if (!lib.isBoolean(fld.nullable)) {
      throw new lib.Error(('FIELD_HAS_NO_NULLABLE', 'Field in the array of fields has no nullable property (boolean)'));
    }
    ret = fld.name+' '+fld.type+' '+(fld.nullable ? 'NULL' : 'NOT NULL');
    if (fld.constraint) {
      ret+=(' '+fld.constraint);
    }
    return ret;
  }

  function createTable(tabledesc) {
    var ret;
    if (!tabledesc) {
      throw new lib.Error('NO_TABLECREATION_DESCRIPTOR', 'Cannot create a CREATE TABLE sentence without a descriptor');
    }
    if (!lib.isString(tabledesc.name)) {
      throw new lib.Error('NAME_NOT_A_STRING', 'Name of the table to create must be a String');
    }
    if (!lib.isArray(tabledesc.fields)) {
      throw new lib.Error('FIELDS_NOT_AN_ARRAY', 'The fields of the table to create must be an array');
    }
    ret = [
      "IF NOT EXISTS (SELECT * FROM SYSOBJECTS WHERE name='"+tabledesc.name+"' AND xtype='U')",
      "CREATE"+(tabledesc.temp ? ' TEMP ' : ' ')+"TABLE "+tabledesc.name+" (",
      tabledesc.fields.map(fieldmapper).join(','),
      ")"
    ].join(' ');
    return ret;
  }

  mylib.createTable = createTable;
}
module.exports = createTableManagement;