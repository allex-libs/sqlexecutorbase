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
  QRunnerJobCore.prototype.run = function () {
    if (!(lib.isArray(this.sector.items) && this.sector.items.length>0)) {
      return;
    }
    return this.sector.func.call(this.sectorizer.executor, this.sector.items);
  };
  QRunnerJobCore.prototype.postRun = function (res) {
    if (lib.isArray(res)) {
      Array.prototype.push.apply(this.sectorizer.results, res);
    }
  };
  QRunnerJobCore.prototype.steps = [
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
    this.sectorizer.destroy();
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
  function shouldGoToSector () {
    return !lib.isString(this);
  }

  function Sector (qitem) {
    this.func = isTxnBegin.call(qitem) ? queueTxned : queue;
    this.items = [];
    this.done = false;
    if (shouldGoToSector.call(qitem)) {
      this.items.push(qitem);
    }
  }
  Sector.prototype.destroy = function () {
    this.done = null;
    this.items = null;
    this.func = null;
  };
  Sector.prototype.maybeAdd = function (qitem) {
    if (this.isTxned()) {
      if (isTxnBegin.call(qitem)) {
        throw new lib.Error('NESTED_TXNS_NOT_SUPPORTED');
      }
      if (isTxnEnd.call(qitem)) {
        this.done = true;
        return true;
      }
      if (shouldGoToSector.call(qitem)) {
        this.items.push(qitem);
        return true;
      }
      return false;
    }
    if (isTxnBegin.call(qitem)) {
      this.done = true;
      return false;
    }
    if (isTxnEnd.call(qitem)) {
      throw new lib.Error('COMMIT_TXN_WITHOUT_MATCHING_BEGIN');
    }
    if (shouldGoToSector.call(qitem)) {
      this.items.push(qitem);
      return true;
    }
    return false;
  }
  Sector.prototype.isTxned = function () {
    return this.func == queueTxned;
  };

  function QueueSectorizer (executor, queueobjarry) {
    this.executor = executor;
    this.arry = queueobjarry;
    this.jobs = new lib.qlib.JobCollection();
    this.txned = false;
    this.sectors = [];
    this.sector = null;
    this.results = [];
  }
  QueueSectorizer.prototype.destroy = function () {
    this.results = null;
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
      this.sector = new Sector(qitem);
      return;
    }
    taken = this.sector.maybeAdd(qitem);
    if (this.sector.done) {
      this.pushSector();
      if (!taken) {
        this.sector = new Sector(qitem);
        return;
      }
    }
    if (!taken) {
      throw new lib.Error('WHY_ITEM_NOT_TAKEN?');
    }
  };
  QueueSectorizer.prototype.jobizer = function (sector) {
    this.jobs.run('.', lib.qlib.newSteppedJobOnSteppedInstance(
      new QRunnerJobCore(this, sector)
    ));
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