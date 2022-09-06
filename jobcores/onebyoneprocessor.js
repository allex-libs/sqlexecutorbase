function createOneByOneProcessor (lib, mylib) {
  'use strict';

  var qlib = lib.qlib;

  function OneByOneProcessorJobCore (obj) {
    this.obj = obj;
    this.records = obj[this.recordsKeyName()];
    this.currentIndex = -1;
    this.result = this.initiateResult();
  }
  OneByOneProcessorJobCore.prototype.destroy = function () {
    this.result = null;
    this.currentIndex = null;
    this.records = null;
    this.obj = null;
  };
  OneByOneProcessorJobCore.prototype.doOne = function (res) {
    var ctor;
    if (!lib.isArray(this.records)) {
      return 0;
    }
    if (!lib.isArray(this.result)) {
      return 0;
    }
    if (this.currentIndex>=0) { //NOT just started
      this.processOneResult(res);
    }
    this.currentIndex++;
    if (this.currentIndex>=this.records.length) {
      return this.result;
    }
    ctor = this.oneProcessorJobCoreCtor();
    return qlib.newSteppedJobOnSteppedInstance(
      new ctor(this.obj, this.records[this.currentIndex])
    ).go().then(this.doOne.bind(this));
  };
  OneByOneProcessorJobCore.prototype.recordsKeyName = function () {
    throw new lib.Error('NOT_IMPLEMENTED', 'recordsKeyName has to be implemented by '+this.constructor.name);
  };
  OneByOneProcessorJobCore.prototype.initiateResult = function () {
    throw new lib.Error('NOT_IMPLEMENTED', 'initiateResult has to be implemented by '+this.constructor.name);
  };
  OneByOneProcessorJobCore.prototype.processOneResult = function (oneresult) {
    throw new lib.Error('NOT_IMPLEMENTED', 'processOneResult has to be implemented by '+this.constructor.name);
  };
  OneByOneProcessorJobCore.prototype.oneProcessorJobCoreCtor = function (oneresult) {
    throw new lib.Error('NOT_IMPLEMENTED', 'oneProcessorJobCoreCtor has to be implemented by '+this.constructor.name);
  };

  OneByOneProcessorJobCore.prototype.steps = [
    'doOne'
  ];
  OneByOneProcessorJobCore.prototype.newJob = function (defer) {
    return qlib.newSteppedJobOnSteppedInstance(this, defer);
  };

  mylib.OneByOneProcessor = OneByOneProcessorJobCore;
}
module.exports = createOneByOneProcessor;