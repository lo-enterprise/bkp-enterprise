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
            var mapped = mapReduceChanged(coin.changed());
            return _.reduce(mapped, sumQuantity, coin);
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
                'where': { 'quantity': { 'gt': 0 } },
                'include': { 'changed': 'changed' }
            })
            .then(mapReduceChanged)
            .then(function(coins) {
                var items = _.map(coins, coinToItem);
                return bkp.Bounded(items, amount);
            })
            .then(resultToCoinResult)
            .then(function(cointResult) {
                if (cointResult.total !== amount) {
                    throw new Error('Please Insert Coin ;->');
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
