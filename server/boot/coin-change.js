
module.exports = function(app) {
    var CoinChange = app.models.CoinChange;

    var connection = require('strong-mq')
        .create('native:')
        .open();

    var push = connection.createPushQueue('bkp.Bounded');

    CoinChange.afterCreate = function(next) {
        push.publish(this);
        next();
    };
};
