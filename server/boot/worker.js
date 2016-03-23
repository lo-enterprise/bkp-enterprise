var bkp = require('bkp');
var _ = require('lodash');

module.exports = function(app) {
    var CoinChange = app.models.CoinChange;
    var Coin = app.models.Coin;
  
    var connection = require('strong-mq')
        .create('native:')
        .open();

    var pull = connection.createPullQueue('bkp.Bounded');
    pull.subscribe(function(_self) {
        var amount = _self.amount;

        Coin.find()
            .then(function(coins) {
                var list = _.map(coins, function(obj) {
                    return { name: { id: obj.id, amount: obj.amount}, weight: obj.amount, value: obj.amount, pieces: obj.quantity };
                });
                _self.result = bkp.Bounded(list, amount);
                return _self.result.items;
            })
            .then(function(items) {
                var promises = _.map(items, function(obj) {
                    return Coin
                        .findById(obj.item.id)
                        .then(function(coin) {
                            coin.quantity -= obj.count;
                            return coin;
                        })
                        .then(function(coin) {
                            Coin.upsert(coin)
                        });
                });
                return Promise.all(promises);
            })
            .then(function () {
                return CoinChange.upsert(_self);
            })
            .then(console.log)
            .catch(console.err);

    });
}