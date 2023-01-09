function createUpsertManyJob (lib, mylib, sqlsentencing, specializations) {
  'use strict';

  var qlib = lib.qlib;
  var SteppedJobOnSteppedInstance = qlib.SteppedJobOnSteppedInstance;

  function readeranalyzer (readrecordset) {
    return lib.isArray(readrecordset) && readrecordset.length>0;
  }

  function myWereRecordsRead (sqlresult) {
    if (!(sqlresult &&
      lib.isArray(sqlresult.recordsets)
    )){
      throw new lib.Error('NO_RECORDSETS', 'No recordsets were found in SQL result');
    }
    return sqlresult.recordsets.map(readeranalyzer);
  }
  var wereRecordsRead = specializations.wereRecordsRead || myWereRecordsRead;

  function execresultanalyzer (recordsread, res, rowsaff, index) {
    var read;
    if (rowsaff) {
      read = recordsread[index];
      res[read ? 'updated' : 'inserted'] ++;
    }
    return res;
  };

  function myUpdatedInserted (sqlresult, recordsread) {
    var ret;
    ret = (sqlresult &&
      lib.isArray(sqlresult.rowsAffected) &&
      sqlresult.rowsAffected.length>0)
      ?
      sqlresult.rowsAffected.reduce(execresultanalyzer.bind(null, recordsread), {updated: 0, inserted:0})
      :
      {updated: 0, inserted: 0}
    recordsread = null;
    return ret;
  }
  var updatedInserted = specializations.updatedInserted || myUpdatedInserted;

  var selecttime = 0;
  var exectime = 0;

  function UpsertManyJobCore (executor, options) {
    this.executor = executor;
    this.options = options;
    this.finalResult = void 0;
    this.allfields = null;
    this.start = null;
  }
  UpsertManyJobCore.prototype.destroy = function () {
    this.start = null;
    this.allfields = null;
    this.finalResult = null;
    this.options = null;
    this.executor = null;
  };
  UpsertManyJobCore.prototype.shouldContinue = function () {
    if (lib.defined(this.finalResult)) {
      return this.finalResult;
    }
    if(!this.options) {
      throw new lib.Error('NO_OPTIONS', this.constructor.name+' needs to have options');
    }
    if (!lib.isArray(this.options.records)) {
      throw new lib.Error('NO_OPTIONS.RECORDS', this.constructor.name+' needs to have options.records');
    }
    if (!this.options.tablename) {
      throw new lib.Error('NO_OPTIONS.TABLENAME', this.constructor.name+' needs to have options.tablename');
    } 
    if (!lib.isArray(this.options.selectfields)) {
      throw new lib.Error('NO_OPTIONS.SELECTFIELDS', this.constructor.name+' needs to have options.selectfields');
    }
    if (!lib.isArray(this.options.setfields)) {
      throw new lib.Error('NO_OPTIONS.SETFIELDS', this.constructor.name+' needs to have options.setfields');
    }
    if (!this.executor) {
      throw new lib.Error('NO_EXECUTOR', this.constructor.name+' needs to have executor');
    }
  };

  UpsertManyJobCore.prototype.init = function () {
    this.allfields = [].concat(this.options.selectfields).concat(this.options.setfields);
  };
  UpsertManyJobCore.prototype.doRead = function () {
    this.start = Date.now();
    return (new mylib.SyncQuery(
      this.executor,
      this.options.records.reduce(this.readerCreator.bind(this), '')
    )).go();
  };
  UpsertManyJobCore.prototype.onDoRead = function (doreadresult) {
    selecttime += (Date.now()-this.start);
    try {
      this.recordRead = wereRecordsRead(doreadresult);
    } catch (e) {
      this.finalResult = {inserted: 0, updated:0};
    }
  };
  UpsertManyJobCore.prototype.doTheInsertOrUpdate = function () {
    this.start = Date.now();
    return (new mylib.SyncQuery(
      this.executor,
      this.recordRead.reduce(this.execCreator.bind(this), '')
    )).go();
  };
  UpsertManyJobCore.prototype.onDoTheInsertOrUpdate = function (dotheinsertorupdateresult) {
    var ret;
    exectime += (Date.now()-this.start);
    //console.log('tablename', this.options.tablename, 'selecttime', selecttime, 'exectime', exectime);
    return updatedInserted(dotheinsertorupdateresult, this.recordRead);
  };

  UpsertManyJobCore.prototype.steps = [
    'init',
    'doRead',
    'onDoRead',
    'doTheInsertOrUpdate',
    'onDoTheInsertOrUpdate'
  ];

  UpsertManyJobCore.prototype.readerCreator = function (res, rec) {
    return lib.joinStringsWith(res,sqlsentencing.selectViaFieldNames(
      this.options.tablename,
      this.options.selectfields,
      rec
    ), ';\n');
  };
  UpsertManyJobCore.prototype.execCreator = function (res, read, index) {
    return lib.joinStringsWith(res,
      read
      ?
      sqlsentencing.updateViaWhereAndSetFieldNames(
        this.options.tablename,
        this.options.selectfields,
        this.options.setfields,
        this.options.records[index]
      )
      :
      sqlsentencing.insertValuesOfHashArray(
        this.options.tablename,
        [this.options.records[index]],
        this.allfields
      )
      ,
      ';\n');
  };


  function UpsertManyJob (executor, options, defer) {
    SteppedJobOnSteppedInstance.call(
      this,
      new UpsertManyJobCore(executor, options),
      defer
    )
  }
  lib.inherit(UpsertManyJob, SteppedJobOnSteppedInstance);
  mylib.UpsertMany = UpsertManyJob;
}
module.exports = createUpsertManyJob;