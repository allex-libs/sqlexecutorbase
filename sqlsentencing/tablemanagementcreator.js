function createTableManagement (execlib, specializations, mylib) {
  'use strict';

  var lib = execlib.lib;

  function readFieldType(flddesc) {
    return flddesc.sqltype || flddesc.type
  }

  mylib.readFieldType = lib.isFunction(specializations.readFieldType)
  ?
  specializations.readFieldType
  :
  readFieldType;

  function fieldmapper(fld) {
    var ret;
    var type;
    if (!fld) {
      throw new lib.Error('FIELD_DOES_NOT_EXIST', 'Field in the array of fields does not exist');
    }
    type = mylib.readFieldType(fld);
    if (!lib.isString(fld.name)) {
      throw new lib.JSONizingError('FIELD_HAS_NO_NAME', fld, 'Field in the array of fields has no name');
    }
    if (!lib.isString(type)) {
      throw new lib.JSONizingError('FIELD_HAS_NO_TYPE', fld, 'Field in the array of fields has no type');
    }
    if (!lib.isBoolean(fld.nullable)) {
      throw new lib.JSONizingError('FIELD_HAS_NO_NULLABLE', fld, 'Field in the array of fields has no nullable property (boolean)');
    }
    ret = fld.name+' '+type+' '+(fld.nullable ? 'NULL' : 'NOT NULL');
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

  mylib.createTable = specializations.createTableCreator(fieldmapper);
}
module.exports = createTableManagement;