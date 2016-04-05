var _ = require('lodash');
var bkp = require('bkp');

module.exports = function(app) {
    var CoinChange = app.models.CoinChange;
    var Coin = app.models.Coin;

    CoinChange.observe('after save', function(ctx, next) {
        var coinChange = ctx.instance;
        var amount = coinChange.amount;
        var coinChangeId = coinChange.id;

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
                quantity: -item.count,
                coinId: item.item.id,
                coinChangeId: coinChangeId
            };
        }

        function resultToCoinResult(result) {
            return {
                total: result.totalWeight,
                coins: _.map(result.items, itemToCoin)
            };
        }

        function mapReduceChanged(coins) {
            return _.map(coins, reduceCoin);
        }

        function reduceCoin(coin) {
            return _.reduce(coin.changed(), sumQuantity, coin);
        }

        function sumQuantity(to, from) {
            if (to.amount === from.amount) {
                to.quantity += from.quantity;
            } else {
                throw new Error('Invalid From' + JSON.stringify(from));
            }
            return to;
        }

        Coin
            .find({
                where: { quantity: { gt: 0 } },
                include: {
                    relation: 'changed',
                    scope: { where: { quantity: { lt: 0 } } }
                }
            })
            .then(mapReduceChanged)
            .then(function (coins) {
                return _.sortBy(coins, 'amount');
            })
            .then(function(coins) {
                var items = _.map(coins, coinToItem);
                return bkp.Bounded(items, amount);
            })
            .then(resultToCoinResult)
            .then(function(cointResult) {
                var difference = amount - cointResult.total;
                if (difference > 0) {
                    throw new Error('Please Insert ' +
                        difference + ' Coin(s) ;->');
                } else if (difference < 0) {
                    throw new Error('Unexpected difference of ' + difference);
                } else {
                    return cointResult.coins;
                }
            })
            .then(function(coins) {
                // TIPS: return nothing for next success
                Coin.create(coins);
            })
            .then(next)
            .catch(next);
    });
};
