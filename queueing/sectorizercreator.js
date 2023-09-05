function createSectorizer (lib, queue, queueTxned) {
  'use strict';

  function QRunnerJobCore (sectorizer, sector) {
    this.sectorizer = sectorizer;
    this.sector = sector;
  }
  QRunnerJobCore.prototype.destroy = function () {
    this.sector = null;
    this.sectorizer = null;
  };
  QRunnerJobCore.prototype.start = function () {
    if (this.sector.error) {
      throw this.sector.error;
    }
    if (this.sector.func != lib.dummyFunc && this.sector.items.length==0) {
      var a = 5;
    }
    return this.sector.func(this.sectorizer.lastResult);
  };
  QRunnerJobCore.prototype.run = function () {
    if (!(lib.isArray(this.sector.items) && this.sector.items.length>0)) {
      return;
    }
    return this.sector.qHandler.call(this.sectorizer.executor, this.sector.items);
  };
  QRunnerJobCore.prototype.postRun = function (res) {
    this.sectorizer.lastResult = res;
    if (lib.isArray(res)) {
      Array.prototype.push.apply(this.sectorizer.results, res);
    }
  };
  QRunnerJobCore.prototype.steps = [
    'start',
    'run',
    'postRun'
  ];

  function QTerminatorJobCore (sectorizer) {
    this.sectorizer = sectorizer;
  }
  QTerminatorJobCore.prototype.destroy = function () {
    this.sectorizer = null;
  }
  QTerminatorJobCore.prototype.run = function () {
    var res = this.sectorizer.results;
    var error = this.sectorizer.error;
    this.sectorizer.destroy();
    if (error) {
      throw error;
    }
    return res;
  };
  QTerminatorJobCore.prototype.steps = [
    'run'
  ];

  function isTxnBegin () {
    return this == 'BEGIN TRANSACTION';
  }
  function isTxnEnd () {
    return this == 'COMMIT TRANSACTION';
  }
  function isFunction() {
    return lib.isFunction(this);
  }
  function shouldGoToSector () {
    return !(lib.isString(this)||lib.isFunction(this));
  }

  function SectorBase (qitem) {
    this.items = [];
    this.done = false;
    this.func = lib.dummyFunc;
    if (shouldGoToSector.call(qitem)) {
      this.items.push(qitem);
    }
  }
  SectorBase.prototype.destroy = function () {
    this.func = null;
    this.done = null;
    this.items = null;
  };
  SectorBase.prototype.maybeAdd = function (qitem) {
    if (shouldGoToSector.call(qitem)) {
      this.items.push(qitem);
      return true;
    }
    return false;
  };
  SectorBase.prototype.qHandler = queue;

  function PlainSector (qitem) {
    SectorBase.call(this, qitem);
  }
  lib.inherit(PlainSector, SectorBase);
  PlainSector.prototype.maybeAdd = function (qitem) {
    if (isTxnBegin.call(qitem) || isFunction.call(qitem)) {
      this.done = true;
      return false;
    }
    if (isTxnEnd.call(qitem)) {
      throw new lib.Error('COMMIT_TXN_WITHOUT_MATCHING_BEGIN', 'Cannot have a COMMIT TRANSACTION without a matching BEGIN TRANSACTION');
    }
    return SectorBase.prototype.maybeAdd.call(this, qitem);
  };

  function TxnSector (qitem) {
    SectorBase.call(this, qitem);
  }
  lib.inherit(TxnSector, SectorBase);
  TxnSector.prototype.maybeAdd = function (qitem) {
    if (isTxnBegin.call(qitem)) {
      throw new lib.Error('NESTED_TXNS_NOT_SUPPORTED', 'Nested Transactions not supported');
    }
    if (isFunction.call(qitem)) {
      throw new lib.Error('FUNCTION_IN_TXN_NOT_SUPPORTED', 'Function within a Transaction not supported');
    }
    if (isTxnEnd.call(qitem)) {
      this.done = true;
      return true;
    }
    return SectorBase.prototype.maybeAdd.call(this, qitem);
  };
  TxnSector.prototype.qHandler = queueTxned;

  function FuncSector (qitem) {
    PlainSector.call(this, qitem);
    this.func = qitem;
  }
  lib.inherit(FuncSector, SectorBase);
  FuncSector.prototype.maybeAdd = function (qitem) {
    if (isFunction.call(qitem)) {
      this.done = true;
      return false;
    }
    if (isTxnBegin.call(qitem)) {
      this.done = true;
      return false;
    }
    if (isTxnEnd.call(qitem)) {
      throw new lib.Error('COMMIT_TXN_IN_FUNCTION_SECTOR', 'COMMIT TRANSACTION cannot appear in a Function sector');
    }
    return SectorBase.prototype.maybeAdd.call(this, qitem);
  };


  function SectorFactory (qitem) {
    if (isTxnBegin.call(qitem)) {
      return new TxnSector(qitem);
    }
    if (lib.isFunction(qitem)) {
      return new FuncSector(qitem);
    }
    if (isTxnEnd(qitem)) {
      throw new lib.Error('CANNOT_PRODUCE_SECTOR', 'A sector cannot be started with '+qitem);
    }
    return new PlainSector(qitem);
  }

  function QueueSectorizer (executor, queueobjarry) {
    this.executor = executor;
    this.arry = queueobjarry;
    this.jobs = new lib.qlib.JobCollection();
    this.txned = false;
    this.sectors = [];
    this.sector = null;
    this.lastResult = null;
    this.results = [];
    this.error = null;
  }
  QueueSectorizer.prototype.destroy = function () {
    this.error = null;
    this.results = null;
    this.lastResult = null;
    this.sector = null;
    if (this.sectors) {
      lib.arryDestroyAll(this.sectors);
    }
    this.sectors = null;
    this.txned = null;
    if (this.jobs) {
      this.jobs.destroy();
    }
    this.jobs = null;
    this.arry = null;
    this.executor = null;
  };
  QueueSectorizer.prototype.sectorize = function () {
    this.arry.forEach(this.itemizer.bind(this));
    this.pushSector();
    this.sectors.forEach(this.jobizer.bind(this));
    return this.jobs.run('.', lib.qlib.newSteppedJobOnSteppedInstance(
      new QTerminatorJobCore(this)
    ));
  };
  QueueSectorizer.prototype.itemizer = function (qitem) {
    var taken;
    if (!this.sector) {
      this.sector = SectorFactory(qitem);
      return;
    }
    taken = this.sector.maybeAdd(qitem);
    if (this.sector.done) {
      this.pushSector();
      if (!taken) {
        this.sector = SectorFactory(qitem);
        return;
      }
    }
    if (!taken) {
      throw new lib.JSONizingError('WHY_ITEM_NOT_TAKEN?', qitem, 'Was not taken');
    }
  };
  QueueSectorizer.prototype.jobizer = function (sector) {
    this.jobs.run('.', lib.qlib.newSteppedJobOnSteppedInstance(
      new QRunnerJobCore(this, sector)
    )).then(null, this.errorizer.bind(this));
  };
  QueueSectorizer.prototype.errorizer = function (reason) {
    this.error = reason;
  };
  QueueSectorizer.prototype.pushSector = function () {
    if (!this.sector) {
      return;
    }
    this.sectors.push(this.sector);
    this.sector = null;
  };

  return QueueSectorizer;
}
module.exports = createSectorizer;