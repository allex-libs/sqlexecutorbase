function createUpsertJob (lib, mylib, sqlsentencing, specializations) {
  'use strict';

  function myRowsAffected (sqlresult) {
    return (sqlresult &&
      lib.isArray(sqlresult.rowsAffected) &&
      sqlresult.rowsAffected.length>0)
      ?
      sqlresult.rowsAffected[0]
      :
      0
  }

  var rowsAffected = specializations.rowsAffected || myRowsAffected;

  var qlib = lib.qlib;
  var SteppedJobOnSteppedInstance = qlib.SteppedJobOnSteppedInstance;

  var selecttime = 0;
  var exectime = 0;

  function UpsertJobCore (executor, options) {
    this.executor = executor;
    this.options = options;
    this.finalResult = void 0;
    this.recordRead = null;
    this.start = null;
  }
  UpsertJobCore.prototype.destroy = function () {
    this.recordRead = null;
    this.finalResult = null;
    this.options = null;
    this.executor = null;
  };
  UpsertJobCore.prototype.shouldContinue = function () {
    if (lib.defined(this.finalResult)) {
      return this.finalResult;
    }
    if(!this.options) {
      throw new lib.Error('NO_OPTIONS', this.constructor.name+' needs to have options');
    }
    if (!this.options.record) {
      throw new lib.Error('NO_OPTIONS.RECORD', this.constructor.name+' needs to have options.record');
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

  UpsertJobCore.prototype.init = function () {
  };
  UpsertJobCore.prototype.doRead = function () {
    this.start = Date.now();
    return (new mylib.SyncSingleQuery(
      this.executor,
      sqlsentencing.selectViaFieldNames(
        this.options.tablename,
        this.options.selectfields,
        this.options.record
      )
    )).go();
  };
  UpsertJobCore.prototype.onDoRead = function (doreadresult) {
    selecttime += (Date.now()-this.start);
    this.recordRead = doreadresult;
  };
  UpsertJobCore.prototype.doTheInsertOrUpdate = function () {
    this.start = Date.now();
    if (this.isUpdate()) {
      return (new mylib.SyncQuery(
        this.executor,
        sqlsentencing.updateViaWhereAndSetFieldNames(
          this.options.tablename,
          this.options.selectfields,
          this.options.setfields,
          this.options.record
        )
      )).go();
    }
    return (new mylib.SyncQuery(
      this.executor,
      sqlsentencing.insertValuesOfHashArray(
        this.options.tablename,
        [this.options.record],
        [].concat(this.options.selectfields).concat(this.options.setfields)
      )
    )).go();
  };
  UpsertJobCore.prototype.onDoTheInsertOrUpdate = function (dotheinsertorupdateresult) {
    exectime += (Date.now()-this.start);
    var res = rowsAffected(dotheinsertorupdateresult);
    //console.log('tablename', this.options.tablename, 'selecttime', selecttime, 'exectime', exectime);
    return this.isUpdate() 
    ?
    {
      updated: res
    }
    :
    {
      inserted: res
    };
  };


  UpsertJobCore.prototype.steps = [
    'init',
    'doRead',
    'onDoRead',
    'doTheInsertOrUpdate',
    'onDoTheInsertOrUpdate'
  ];

  UpsertJobCore.prototype.isUpdate = function () {
    return lib.isArray(this.recordRead) && this.recordRead.length>0;
  };

  function UpsertJob (executor, options, defer) {
    SteppedJobOnSteppedInstance.call(
      this,
      new UpsertJobCore(executor, options),
      defer
    )
  }
  lib.inherit(UpsertJob, SteppedJobOnSteppedInstance);
  mylib.Upsert = UpsertJob;
}
module.exports = createUpsertJob;