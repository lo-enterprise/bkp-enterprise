var assert = require('assert'),
    app = require('../server/server'),
    supertest = require('supertest'),
    async = require('async');

describe('CoinChange#create', function() {
    describe('When no Coin', function() {
        it('please Insert Coin ;->', function(done) {
            supertest(app)
                .post('/api/CoinChanges')
                .send({ amount: 1 })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .expect(500, /Please Insert Coin ;->/)
                .end(function(err, res) {
                    if (err) return done(err);
                    done();
                });
        });
    });
    describe('When enough Coins', function() {
        var Coin = app.models.Coin;

        it('Provided quantity are substracted', function(done) {
            async.series([
                function (cb) {
                  supertest(app)
                    .post('/api/Coins')
                    .send([{ amount: 1, quantity: 1 },
                        { amount: 2, quantity: 1 },
                        { amount: 3, quantity: 1 },
                        { amount: 4, quantity: 1 },
                        { amount: 5, quantity: 1 },
                    ])
                    .expect(200, [ { amount: 1, quantity: 1, id: 1 },
                        { amount: 2, quantity: 1, id: 2 },
                        { amount: 3, quantity: 1, id: 3 },
                        { amount: 4, quantity: 1, id: 4 },
                        { amount: 5, quantity: 1, id: 5 } ], cb);
                },
                function(cb) {
                    supertest(app)
                        .post('/api/CoinChanges')
                        .send({ amount: 8 })
                        .set('Accept', 'application/json')
                        .set('Content-Type', 'application/json')
                        .expect(200, { id: 2, amount: 8 }, cb);
                },
                function(cb) {
                    supertest(app)
                        .get('/api/CoinChanges/2/coins')
                        .set('Accept', 'application/json')
                        .set('Content-Type', 'application/json')
                        .expect(200, [
                            { amount: 1, quantity: -1, id: 6, 
                                coinId: 1, coinChangeId: 2 },
                            { amount: 3, quantity: -1, id: 7,
                                coinId: 3, coinChangeId: 2 },
                            { amount: 4, quantity: -1, id: 8,
                                coinId: 4, coinChangeId: 2 }],
                        cb);
                },
            ], done);
        });
    });
});
