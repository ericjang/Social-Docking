window.fbAsyncInit = function() {
    FB.init({
      appId      : '250027595026486', // App ID
      channelUrl : '//www.socialdocking.appspot.com', // Channel File
      status     : true, // check login status
      cookie     : true, // enable cookies to allow the server to access the session
      xfbml      : true  // parse XFBML
    });

    // Additional initialization code here
  };

  // Load the SDK Asynchronously
  (function(d){
     var js, id = 'facebook-jssdk'; if (d.getElementById(id)) {return;}
     js = d.createElement('script'); js.id = id; js.async = true;
     js.src = "//connect.facebook.net/en_US/all.js";
     d.getElementsByTagName('head')[0].appendChild(js);
   }(document));


//share function

function share(){
	FB.ui({
		   method: 'feed',
		   message: 'i smell nice!',
		   name: 'Social Docking',
		   caption: 'volunteer computing using web browsers',
		   description:'Donate your computer\'s extra CPU cycles... for science!',
		   link: 'http://apps.facebook.com/socialdocking/',
		   picture: 'https://lh4.googleusercontent.com/-Ie4zIo6JHiQ/TvxCIVP2N9I/AAAAAAAABGg/GOJvufG--3c/s144/Slide1.png',
		  user_message_prompt: 'Spread the love!'
		  },
		  function(response) {
		    if (response && response.post_id) {
		      //alert('Post was published.');
		    } else {
		      //alert('Post was not published.');
		    }
	  });
}
