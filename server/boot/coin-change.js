var _ = require('lodash');
var bkp = require('bkp');

module.exports = function(app) {
    var CoinChange = app.models.CoinChange;
    var Coin = app.models.Coin;

    CoinChange.beforeCreate = function(next) {
        var amount = this.amount;
        var coinChange = this;

        function coinToItem(coin) {
            return {
                name: {
                    id: coin.id,
                    amount: coin.amount
                },
                weight: coin.amount,
                value: coin.amount,
                pieces: coin.quantity
            };
        }

        function itemToCoin(item) {
            return {
                amount: item.item.amount,
                quantity: item.count,
                id: item.item.id
            }
        }

        function resultToCoinResult(result) {
            return {
                total: result.totalWeight,
                coins: _.map(result.items, itemToCoin)
            };
        }

        function mergeInCoinChange(coinResult) {
            coinChange.result = coinResult;
            return coinChange;
        }

        function substract(quantity) {
            return function(coin) {
                coin.quantity -= quantity;
                return coin;
            };
        }

        Coin.find()
            .then(function(coins) {
                var items = _.map(coins, coinToItem);
                return bkp.Bounded(items, amount);
            })
            .then(resultToCoinResult)
            .then(mergeInCoinChange)
            .then(function(coinChange) {
                var promises = _.map(coinChange.result.coins, function(coinResult) {
                    return Coin
                        .findById(coinResult.id)
                        .then(substract(coinResult.quantity))
                        .then(function (coin) {
                            return Coin.upsert(coin);
                        });
                });
                return Promise.all(promises);
            })
            .then(function (obj) {
                console.log(obj);
                next();
            })
            .catch(next);
      };
};
