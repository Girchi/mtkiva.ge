
this is a node application, which you can connect to a drupal database and exchange information about users. 
users can input their details and cards will be generated immediately, which can be converted as pdf and printed easily. 
names converting different language characters cleanly and every user gets their unique card number.
users can see how their cards will be, while inputting details, after authorization.


default configuration
1. configure .env file for your application like example.env
2. insert client_id and client_secret from drupal's Ouath module
3. you need to have configured JSON:API, Simple Oauth and Token, Simple Oauth Facebook Connect and Social Auth Facebook in drupal side


for facebook authorization
1. Create facebook application at https://developers.facebook.com/
2. Configure facebook and drupal front-side access locations at:
```ruby
  assets/js/auth_config.js
```

NOTE: Make sure project uses SSL connection, Facebook only allows domains that use SSL.


Documents with user cards will generate on:
```ruby
  /cards-download
```

