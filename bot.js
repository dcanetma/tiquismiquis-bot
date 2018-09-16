// Using Twitter library for Stream API and to post updates on Twitter
var Twitter = require('twitter');
var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});
	
// Underscore handler to manage promises 
var _ = require('underscore');
_.mixin( require('underscore.deferred') );


// Helper function. This is what's all about
// @todo: don't apply vowel change to user names
function cinvirtString(str) {
	// Remove all urls on the message, first -> then the vowel thing
	return str.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '')
						.replace(/[AEOU]/g, 'I')
						.replace(/[aeou]/g, 'i')
						.replace(/[áéóú]/g, 'í')
						.replace(/[àèò]/g,  'ì')
						.replace(/ ci/, ' qui')
						.replace(/qii/, 'qui')
						.replace(/qií/, 'quí')
						.replace(/(?<=\w)ci(?=\w)/, 'qui');
}

// 2. Post the sarcasm on the right thread :)
function postSarcasm(status, reply, url, data){
	console.log('Posting tweet with image');
	// console.log(status);
	// console.log(reply);
	// console.log(url);
	// console.log(data);
	// Load the image
	var data = require('fs').readFileSync('snapshot.png');
	// Make post request on media endpoint. Pass file data as media parameter
	client.post('media/upload', {media: data}, function(error, media, response) {
	  if (!error) {
	    // If successful, a media object will be returned.
	    // console.log(media);
	    var message = {
				// Add a mention to the user who the command is directed to #!important
	    	status: status 
	    	, in_reply_to_status_id: reply // Add the reply tweet string id
	      , media_ids: media.media_id_string // Pass the media id string
	    }

	    client.post('statuses/update', message, function(error, tweet, response) {
	      if (!error) {
			  	console.log('Tweet posted!');
	        // console.log(tweet);
			  } else {
			  	console.log('Error on posting!');
			  	console.log(error);		  	
			  }
	    });

	  } else {
	  	console.log('Error uploading image to Twitter!');
	  	console.log(error);		  		  	
	  }
	});
}

// 1. Get the tweet by Id to get the original tweet from 'in_reply_to_status_id_str'
//    and generate the tweet text with the mentions
function generateSarcasm(tid, reply, one, two, tweet) {
  var dfd = new _.Deferred();
	client.get('statuses/show/' + reply, { tweet_mode: 'extended' },
		function (err, data, response) {
			if (err) {
				// This version does nothing when there's no previous tweet
				console.log('Error getting parent tweet. Not posting');
				// console.log(err);
	      dfd.reject(err);
			} else {			
				console.log('Got parent tweet data succesfully!');
				// console.log(data);
				if (data.user.screen_name == 'istipidi') {
					console.log('I would not ridicule myself. Quitting!');
					dfd.reject();
				} else {
					console.log(data.full_text);
					// Add a mention to the user who invoked the command #!important
					var text = '@' + one + ' @' + two + ' ' + cinvirtString(data.full_text);
					var url = 'https://twitter.com/' + data.user.screen_name + '/status/' + data.id_str;
					console.log(text);
					console.log(url);
					console.log('Reply to: ' + tid + ' for ' + two);
					dfd.resolve(text, tid, url, data);					
				}
			}
		}
	);

  return dfd.promise();
}

// 0. Main function to offer the service to people
function listenToMasses() {
  console.log('Start listening to tweets');

	var stream = client.stream(
		'statuses/filter', 
		{
			track: '@istipidi'
		}
		// ,	{
		// 	port: process.env.PORT || 5000  // This line is necessary when deploying on Heroku
		// }
	);

	// Something like this should be possible to avoid duplicate processes
  // if (stream.isRunning())
  // {
  //   stream.stop();
  // }
	
	stream.on('data', function(tweet) {
    console.log('A new request is on the way by @' + tweet.user.screen_name + ' that is meant to @' + tweet.in_reply_to_screen_name);
	  // console.log(tweet);
	  // console.log(tweet.text);
		// console.log(tweet.id_str);
	  generateSarcasm(tweet.id_str, tweet.in_reply_to_status_id_str, tweet.in_reply_to_screen_name, tweet.user.screen_name, tweet)
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
	 
	stream.on('error', function(error) {
    console.log('Error: ' + (error.code ? error.code + ' ' + error.message : error.message));
	  throw error;
	});
}

// Start listening to masses to offer our Sarcasm for free
listenToMasses();

// Challenge 2
// var Tid = '1035490030284881920';
// getParentTweet(Tid);

// Challenge 1
// var strTest = 'Para los que alegan que no detienen a Willy Toledo por blasfemia sino por no comparecer, creo que este tuit sí que deja claro por qué lo detienen.';
// console.log(strTest);
// console.log('---');
// console.log(cinvirtString(strTest));
