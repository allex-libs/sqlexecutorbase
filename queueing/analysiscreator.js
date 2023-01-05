function createQueueResultAnalysisJob (execlib, templateslib, mylib) {
  'use strict';

  var lib = execlib.lib;
  var q = lib.q;
  var qlib = lib.qlib;
  var SteppedJobOnSteppedInstance = qlib.SteppedJobOnSteppedInstance;

  function QueueResultAnalysisJobCore (options) {
    this.options = options;
    this.finalResult = void 0;
    this.target = null;
    this.autoCreate = null;
  }
  QueueResultAnalysisJobCore.prototype.destroy = function () {
    this.autoCreate = null;
    this.target = null;
    this.finalResult = null;
    this.options = null;
  };
  QueueResultAnalysisJobCore.prototype.shouldContinue = function () {
    if (lib.defined(this.finalResult)) {
      return this.finalResult;
    }
    if(!this.options) {
      throw new lib.Error('NO_OPTIONS', this.constructor.name+' needs to have options');
    }
    if (!(this.options.executor && this.options.executor.queueTypeRegistry && lib.isFunction(this.options.executor.queueTypeRegistry.get))) {
      throw new lib.Error('NO_OPTIONS.REGISTRY', this.constructor.name+' needs to have options.executor');
    }
    if (!this.options.item) {
      throw new lib.Error('NO_OPTIONS.ITEM', this.constructor.name+' needs to have options.item');
    }
    if (!lib.isArray(this.options.recordsets)) {
      throw new lib.Error('NO_OPTIONS.RECORDSETS', this.constructor.name+' needs to have options.recordsets');
    }
    if (!lib.isNumber(this.options.cursor)) {
      throw new lib.Error('NO_OPTIONS.CURSOR', this.constructor.name+' needs to have options.cursor');
    }
  };

  QueueResultAnalysisJobCore.prototype.init = function () {
    this.evaluateTargetForItem(this.options.item);
  };
  QueueResultAnalysisJobCore.prototype.extractRawResult = function () {
    var t = this.options.executor.queueTypeRegistry.get(this.options.item.type);
    if (!(t && lib.isFunction(t.analyzer))) {
      throw new lib.Error('QUEUE_OBJ_TYPE_NOT_SUPPORTED', 'Queue object type '+item.type+' is not supported');
    }
    return t.analyzer.call(this.options.item, this.options.recordsets, this.options.cursor, this.options.executor);
  };
  QueueResultAnalysisJobCore.prototype.runProc = function (rawresult) {
    var procs, procsres;
    if (lib.isArray(rawresult) && lib.isArray(this.options.item.proc)) {
      procs = this.options.item.proc;
      procsres = rawresult.reduce(multiprocer.bind(this.options.item, procs), {promises: [], ress: []});
      procs = null;
      if (procsres.promises.length>0) {
        return q.all(procsres.promises).then(qlib.returner(procsres.ress));
      }
      return procsres.ress;
    }
    if (lib.isFunction(this.options.item.proc)) {
      if (!lib.isArray(rawresult)) {
        rawresult = [rawresult];
      }
      return this.options.item.proc.apply(this.options.item, rawresult);
    }
    return rawresult;
  };
  QueueResultAnalysisJobCore.prototype.packProcResults = function (procsres) {
    var ret;
    if (lib.isArray(this.options.item.fields)) {
      ret = this.options.item.fields.reduce(packer.bind(this, procsres), this.target);
      procsres = null;
      return ret;
    }
    if (lib.isString(this.options.item.field)) {
      lib.writePropertyFromDotDelimitedString(this.target, this.options.item.field, procsres);
      return this.target;
    }
    return procsres;
  };
  QueueResultAnalysisJobCore.prototype.finalize = function (ret) {
    return ret;
  };

  QueueResultAnalysisJobCore.prototype.steps = [
    'init',
    'extractRawResult',
    'runProc',
    'packProcResults',
    'finalize'
  ];

  QueueResultAnalysisJobCore.prototype.evaluateTargetForItem  = function (item) {
    if (item.result) {
      this.target = item.result;
      this.autoCreate = false;
      return;
    }
    if (lib.isString(this.field)) {
      this.target = {};
      this.autoCreate = true;
      return;
    }
    if (lib.isArrayOfStrings(this.fields)) {
      this.target = {};
      this.autoCreate = true;
      return;
    }
    this.target = [];
    this.autoCreate = false;
  };



  //statics
  function multiprocer (procs, res, rawres, index) {
    var proc = procs[index];
    var procret = lib.isFunction(proc) ? proc.call(this, rawres) : rawres;
    var ress;
    if (q.isThenable(procret)) {
      ress = res.ress;
      ress.push(null);
      procret.then(resassigner.bind(null, ress, index));
      ress = null;
      index = null;
      res.promises.push(procret);
      return res;
    }
    res.ress.push(procret);
    return res;
  }
  function packer (procsres, res, fld, index) {
    lib.writePropertyFromDotDelimitedString(res, fld, procsres[index], this.autoCreate);
    return res;
  }
  //endof statics
  function resassigner (arry, index, val) {
    arry[index] = val;
  }

  function QueueResultAnalysisJob (options, defer) {
    SteppedJobOnSteppedInstance.call(
      this,
      new QueueResultAnalysisJobCore(options),
      defer
    )
  }
  lib.inherit(QueueResultAnalysisJob, SteppedJobOnSteppedInstance);

  return function queueResultAnalysis (options, defer) {
    return (new QueueResultAnalysisJob(options, defer)).go();
  }
}
module.exports = createQueueResultAnalysisJob;