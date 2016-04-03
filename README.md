This project implements rest services in order to resolve the max change coin problem.

It provides REST services in order to:
* insert Coin e.g. insert 2 coins of value 1 POST /api/Coins { amount: 1, quantity: 2 }
* change coin e.g. request change for value 2 POST /api/ChangeCoins  { amount: 2 }
* retrieve result of change coin e.g. with previous response {id} from ChangeCoin resource GET /api/ChangeCoins/{id}/coins 
   And example of returned result:
```
{"amount":1,"quantity":-2,"id":2,"coinId":1,"coinChangeId":1}
```

# Requirement

Last Node JS LTS installed.

# To install & run

```
npm install

npm start
```

# To  unit test

```
npm test
```

# To use

Insert Coins
```
curl -X POST --header "Content-Type: application/json" --header "Accept: application/json" -d "
[{ \"amount\": 1, \"quantity\": 1 },
    { \"amount\": 2, \"quantity\": 1 },
    { \"amount\": 3, \"quantity\": 1 },
    { \"amount\": 4, \"quantity\": 1 },
    { \"amount\": 5, \"quantity\": 1 }
]" "http://localhost:3000/api/Coins"

[{"amount":1,"quantity":1,"id":1},{"amount":2,"quantity":1,"id":2},{"amount":3,"quantity":1,"id":3},{"amount":4,"quantity":1,"id":4},{"amount":5,"quantity":1,"id":5}]
```


Ask for some Coin Change. 
Example below request change for 8. 
```
curl -X POST --header "Content-Type: application/json" --header "Accept: application/json" -d "{
  \"amount\": 8
}" "http://localhost:3000/api/CoinChanges"

{"amount":8,"id":1}
```

Then consult result with returned CoinChanges id. 
Example for previous sample requests
```
curl -X GET --header "Accept: application/json" "http://localhost:3000/api/CoinChanges/1/coins"

[{"amount":1,"quantity":-1,"id":6,"coinId":1,"coinChangeId":1},{"amount":3,"quantity":-1,"id":7,"coinId":3,"coinChangeId":1},{"amount":4,"quantity":-1,"id":8,"coinId":4,"coinChangeId":1}]
```

Enjoy ;->

Explore with http://localhost:3000/explorer/