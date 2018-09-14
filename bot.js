// Get config values from config file
var conf = require('./config.js');

// Using node-twitter library for Stream API and to post updates on Twitter
var Twitter = require('node-twitter');
var twitterRestClient = new Twitter.RestClient(
  conf.consumer_key,
  conf.consumer_secret,
  conf.access_token,
  conf.access_token_secret
);

// Still using 'twit' lib, plannig to remove
var Twit = require('twit')
var T = new Twit({
  consumer_key:         conf.consumer_key,
  consumer_secret:      conf.consumer_secret,
  access_token:         conf.access_token,
  access_token_secret:  conf.access_token_secret
})

// Underscore handler to manage promises 
var _ = require('underscore');
_.mixin( require('underscore.deferred') );


// Helper function. This is what's all about
// @todo: don't apply vowel change to user names
function cinvirtString(str) {
	return str.replace(/[AEOU]/g, 'I')
						.replace(/[aeou]/g, 'i')
						.replace(/[áéóú]/g, 'í')
						.replace(/[àèò]/g,  'ì');
}

// function postSarcasm(tweet) {
// 	console.log(tweet);
// 	if (tweet.in_reply_to_user_id_str) {
// 		// Get the text from the parent tweet
// 		var text = getParentTweet(tweet.in_reply_to_user_id_str);
// 		text = cinvirtString(text);
// 		console.log(text);
// 	}
// }

// Post the sarcasm on the right thread :)
function postSarcasm(status, reply, url, data){
	console.log('Posting tweet');
	console.log(status);
	console.log(reply);
	console.log(url);
	// console.log(data);
  twitterRestClient.statusesUpdate(
    { 
    	status: text
    	, in_reply_to_status_id: reply
    	// status: text + ' ' + url
			//, status: '@' + data.user.screen_name + ' ' + status
    }
  , function (err, data) {
      if (err) {
        console.error(err);
      } else {
				console.log('Tweet posted! Check your timeline.');
        console.log(data);
      }
    }
  );      			
}


// Get the tweet by Id using node-twitter to get the original tweet from 'in_reply_to_status_id_str'
function generateSarcasm(tid, tweet) {
  var dfd = new _.Deferred();
	T.get('statuses/show/:id', { id: tweet.in_reply_to_status_id_str },
		function (err, data, response) {
			if (err) {
				console.log('Error getting parent tweet. Not posting');
				// console.log(err);
	      dfd.reject(err);
			} else {
				console.log('Got parent tweet data succesfully!');
				console.log(data);
				console.log(data.text);
				var text = cinvirtString(data.text);
				var url = 'https://twitter.com/' + data.user.screen_name + '/status/' + data.id_str;
				console.log(text);
				console.log(url);
				console.log(tid);
				dfd.resolve(text, tid, url, data);
			}
		}
	);

  return dfd.promise();
}

// Main function to offer the service to people
function listenToMasses() {
  var twitterStreamClient = new Twitter.StreamClient(
    conf.consumer_key,
    conf.consumer_secret,
    conf.access_token,
    conf.access_token_secret
  );

  if (twitterStreamClient.isRunning())
  {
    twitterStreamClient.stop();
  }

  twitterStreamClient.start(['@istipidi']);

  twitterStreamClient.on('tweet', function(tweet) {
      console.log('A new request is on the way');
			console.log(tweet);
			console.log(tweet.id_str);
      generateSarcasm(tweet.id_str, tweet)
      .then(
      	// status: text to tweet
      	// reply: id of the tweet to reply to
      	// url: url of the tweet to reply to in case we want to RT it
      	function(status, reply, url, data) {
      		postSarcasm(status, reply, url, data);  		
      	}
      )
			.fail(function( err ){			
			  console.log(err.message); 
			});
  });

  twitterStreamClient.on('close', function() {
      console.log('Connection closed.');
  });
  twitterStreamClient.on('end', function() {
      console.log('End of Line.');
  });
  twitterStreamClient.on('error', function(error) {
      console.log('Error: ' + (error.code ? error.code + ' ' + error.message : error.message));
  });
}

// Start listening to masses to offer our Sarcasm for free
listenToMasses();

// Challenge 2
// var Tid = '1035490030284881920';
// getParentTweet(Tid);

// Challenge 1
// var strTest = 'Hello Twitter! #myfirstTweet';
// console.log(strTest);
// console.log('---');
// console.log(cinvirtString(strTest));
