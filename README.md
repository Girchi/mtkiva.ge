Default configuration
1. configure .env file for your application like example.env
2. insert client_id and client_secret from drupal's Ouath module
3. we need to have configured JSON:API, Simple Oauth and Token, Simple Oauth Facebook Connect and Social Auth Facebook in drupal side


For FB authorization
1. if you don't already have a FB application, create at https://developers.facebook.com/
2. change the FB_APP_ID variable with your application ID on:
```ruby
  assets/js/authorization.js
```

NOTE: Make sure project uses SSL connection, Facebook only allows domains that use SSL.


Documents with user cards will generate on:
```ruby
  /cards-download
```

