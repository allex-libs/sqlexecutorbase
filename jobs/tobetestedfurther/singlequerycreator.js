function createSingleQueryJob (lib, mylib) {
  'use strict';
  var q = lib.q,
    qlib = lib.qlib;

    function SingleQueryJob (pool, defer) {
      mylib.Base.call(this, pool, defer);
    }
    lib.inherit(SingleQueryJob, mylib.Base);
    SingleQueryJob.prototype.goForSure = function () {
      var qs = this.queryString();
      this.destroyable.request().query(this.queryString()).then(
        this.onQueryResult.bind(this),
        this.onQueryFailed.bind(this, qs)
      );
      qs = null;
    }
    SingleQueryJob.prototype.onQueryResult = function (res) {
      this.resolve(res);
    };
    SingleQueryJob.prototype.onQueryFailed = function (querystring, reason) {
      this.reject(reason);
    };

    mylib.SingleQuery = SingleQueryJob;
}
module.exports = createSingleQueryJob;