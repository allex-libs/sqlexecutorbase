function createQueueing (execlib, templateslib, mylib, qinghelperfuncs) {
  'use strict';

  var Queuer = require('./queuercreator')(execlib, mylib, qinghelperfuncs);
  var analysis = require('./analysiscreator')(execlib, templateslib, mylib);
  var lib = execlib.lib;
  var q = lib.q;
  var jobcoreslib = require('./jobcores')(lib);
  var QueueSectorizer = require('./sectorizercreator')(lib, queue, queueTxned);

  function txnedqueuer (queueobj, txnedexecutor) {
    return jobcoreslib.newQueuer(txnedexecutor, queueobj);
  }
  function queueTxned (queueobj) {
    var ret = lib.qlib.newSteppedJobOnSteppedInstance(
      new mylib.jobcores.TxnWrapped(this, txnedqueuer.bind(null, queueobj))
    ).go();
    queueobj = null;
    return ret;
  };
  function queue (queueobj) {
    var ret = this.connect().then(
      doQueue.bind(this, queueobj)
    );
    queueobj = null;
    return ret;
  }


  mylib.Executor.prototype.queue = function (queueobj) {
    if (!lib.isArray(queueobj)) {
      return queue.call(this, queueobj);
    }
    return (new QueueSectorizer(this, queueobj)).sectorize();
    return queue.call(this, queueobj);
  };
  mylib.Executor.prototype.validateQueueObj = function (item) {
    var t, originaltype;
    maybeBuildQueueTypeRegistry.call(this);
    if (!item) {
      throw new lib.Error('NO_QUEUE_OBJ', 'Queue obj not specified');
    }
    if (!lib.isNonEmptyString(item.type)) {
      throw new lib.JSONizingError('NO_QUEUE_OBJ_TYPE', item, 'Must have a non-empty "type" property (String)');
    }
    originaltype = item.type;    
    t = this.queueTypeRegistry.get(item.type);
    if (!(t && lib.isFunction(t.validator))) {
      throw new lib.JSONizingError('QUEUE_OBJ_TYPE_NOT_SUPPORTED', item, 'type '+item.type+' not recognized');
    }
    if (t.schema) {
      lib.jsonSchemValidateToJsonizedErrorThrow(item, t.schema);
    }
    t.validator.call(item, this);
    if (originaltype !== item.type) {
      return this.validateQueueObj(item);
    }
    if (!lib.isString(item.sentence)) {
      throw new lib.JSONizingError('NO_QUEUE_OBJ_SENTENCE', item, 'Must have a "sentence" property (String)');
    }
    if (!lib.isNumber(item.recordsetcount)) {
      throw new lib.JSONizingError('NO_QUEUE_OBJ_RECORDSETCOUNT', item, 'Must have a "recordsetcount" property (Number)');
    }
    if (!lib.isNumber(item.rowsaffectedcount)) {
      throw new lib.JSONizingError('NO_QUEUE_OBJ_ROWSAFFECTEDCOUNT', item, 'Must have a "rowsaffectedcount" property (Number)');
    }
    /*
    if (!lib.isFunction(item.proc)) {
      throw new lib.JSONizingError('NO_QUEUE_OBJ_PROC', item, 'Must have a "proc" property (Function)');
    }
    if (!(lib.isArray(item.fields))) {
      throw new lib.JSONizingError('NO_QUEUE_OBJ_FIELDS', item, 'Must have a "fields" property (Array)');
    }
    */
    if (!(item.defer && item.defer.promise)) {
      item.defer = q.defer();
    }
  };
  mylib.Executor.prototype.analyzeQueueResult = function (items, recordsets, rowsaffected, rscursor, racursor) {
    var i, item, ret = [], defer;
    rscursor = rscursor || 0;
    racursor = racursor || 0;
    for (i=0; i<items.length; i++) {
      item = items[i];
      ret.push(item.defer.promise);
      analysis({
        executor: this,
        item: item,
        recordsets: recordsets,
        rowsaffected: rowsaffected,
        rscursor: rscursor,
        racursor: racursor
      }).then(
        onAnalysisSucceeded.bind(item),
        onAnalysisFailed.bind(item)
      );
      rscursor += (item.recordsetcount||0);
      racursor += (item.rowsaffectedcount||0);
      item = null;
    }
    return ret;
  };
  mylib.Executor.prototype.queueTypes = require('./types')(execlib, mylib);

  //statics for Executor
  function doQueue (queueobj) {
    try {
      if (lib.isArrayOfObjectsWithProperty(queueobj, 'type')) {
        return q.all(queueobj.map(doQueue.bind(this)));
      }
      this.validateQueueObj(queueobj);
      if (!this.queuer) {
        this.queuer = new Queuer(this);
        lib.runNext(queueTriggerer.bind(this));
      }
      this.queuer.push(queueobj);
      return queueobj.defer.promise;
    } catch (e) {
      return q.reject(e);
    }
  }
  function maybeBuildQueueTypeRegistry () {
    if (this.queueTypeRegistry) {
      return;
    }
    this.queueTypeRegistry = new lib.Map();
    if (!lib.isArrayOfObjectsWithProperties(
      this.queueTypes, ['dbname', 'type', 'validator', 'analyzer']
    )) {
      throw new lib.Error('INVALID_QUEUE_TYPES', this.constructor.name+' must have queueTypes as an Array[Object(dbname, type, sentencer, validator, analyzer');
    }
    this.queueTypes.forEach(queueTypeAdder.bind(this));
  }
  function queueTypeAdder (qtitem) {
    var ritem, reqarry, _reqarry;
    if (!qtitem.dbname || qtitem.dbname==this.dbname) {
      ritem = lib.pick(qtitem, ['validator', 'analyzer', 'expectsrowsaffected']);
      if (qtitem.schema) {
        ritem.schema = lib.allexSpecToJsonSchema(qtitem.schema);
      }
      this.queueTypeRegistry.add(qtitem.type, ritem);
    }
  }
  function queueTriggerer () {
    var qr = this.queuer;
    this.queuer = null;
    qr.go();
  }
  //endof statics for Executor

  //statics for Queue item
  function onAnalysisSucceeded (res) {
    if (this.defer) {
      this.defer.resolve(res);
    }
    this.defer = null;
  }
  function onAnalysisFailed (reason) {
    if (this.defer) {
      this.defer.reject(reason);
    }
    this.defer = null;
  }
  //endof statics for Queue item
}
module.exports = createQueueing;