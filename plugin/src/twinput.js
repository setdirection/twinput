//
// twinput: jQuery plugin to add rich twitter input to a <textarea>
//
// Examples
//
// $('.twitter').twinput() // simple, use defaults on any class='twitter'
//
// $('textarea').twinput({ // grab all textareas! mwhaha and change defaults
//    autoShrinkURLs: false
// })
//
// $('textarea[for=twitter]').twinput(); // you get the message
//

(function($) {

  var MAX_CHARS = 140;
  var NUM_NERVOUS_CHARS = 140; // Number of remaining chars to start getting nervous about reaching max length
  
  var getInputColorGradient = function(n) {
    var green = parseInt(251.0*n, 10);
    var red = parseInt(255.0*(1.0-n), 10); 
    var blue = parseInt(152.0*n, 10);
    
    return "rgb(" + red + "," + green + "," + blue + ")";
  };
  
  var getCountColorGradient = function(remain) {
    var color = "#989898";
    if (remain < 0) {
      color = "#FF0000";
    } else if (remain < 10) {
      color = "#FF6600";
    } else if (remain < 51) {
      color = "#FFCC00";
    } else {
      // Some shade of gray
      var cval = parseInt((remain-50) / 90.0 * 152.0, 10);
      if (cval > 152) {
        cval = 152;
      }
      color = "rgb(" + cval + "," + cval + "," + cval + ")";
    }
    return color;
  };

  // Func to update the remaining char count field
  var updateCount = function(textarea, elem, btn) {
    var val = textarea.val();
    var len = val ? val.length : 0;
    var remain = MAX_CHARS - len;
    elem.html("" + remain);
    
    elem.css("color", getCountColorGradient(remain));
    
    textarea.css("background-color", getInputColorGradient(remain/140.0));
    if (btn && (len > 0) && len < (MAX_CHARS+1)) {
      btn.removeAttr('DISABLED');
    } else if (btn) {
      btn.attr('DISABLED', true);
    }
    return remain;
  };
  
  var shortenUrl = function(url, callback) {
    //TODO use OAuth here instead; this is just for testing
    var user = "ewpreston";
    var key = "R_edcd67a19bc686f2b667e39e07cf1fc1";
    
    $.getJSON("http://api.bit.ly/v3/shorten?callback=?",
              {
                login: user,
                apiKey: key,
                longUrl: url,
                format: "json"
              },
              function(data) { callback(data.data.url, url); });
    
    //TODO how to return the shortened URL?
  };
  
  var replaceLongUrl = function(textarea, shortUrl, longUrl, countElem) {
    //alert("replaceLongUrl " + shortUrl + " long " + longUrl);
    var text = textarea.val();
    console.log("replaceLongUrl long: " + longUrl + " short: " + shortUrl);
    if (shortUrl && longUrl) {
      textarea.val(text.replace(longUrl, shortUrl));
    }
    
    updateInput(textarea, countElem);
  };
  
  var updateInput = function(textarea, countElem, btn) {
    var remain = updateCount(textarea, countElem, btn);
    
    // Is this too expensive to do every keypress event?
    localStorage.savedTweet = textarea.val();
    return remain;
  };
  
  // Shrink URLs, common words, etc.
  var shrinkTweet = function(textarea, countElem) {
    var result;
    var text = textarea.val();
    // Stolen from Crockford
    // var parse_url = /(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?/g;
    // Stolen from http://daringfireball.net/2010/07/improved_regex_for_matching_urls
    var parse_url = /\b((?:[a-z][\w]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?]))/gmi;
    
    var callback = function(shortUrl, longUrl){ replaceLongUrl(textarea, shortUrl, longUrl, countElem); };
    
    while ((result = parse_url.exec(text))) {
      if (result) {
        shortenUrl(result[0], callback);
      }
    }
    
    updateInput(textarea, countElem);
  };
  
  var sendTweet = function(val) {
    if (val) {
      alert("Sent the tweet: " + val);
    } else {
      alert("You ain't tweeting nuttin");
    }
  };
  
  var clearTweet = function(textarea, countElem, btn) {
    textarea.val("");
    updateCount(textarea, countElem, btn);
  };
  
  var reloadTweet = function(textarea, countElem, btn) {
    var savedTweet = localStorage.savedTweet;
    if (savedTweet) {
      textarea.val(savedTweet);
      updateCount(textarea, countElem, btn);
    }
  };
  
  $.fn.twinput = function(opts) {
    var defaults = {
      onlyShrinkWhenNeeded : true,  // if there is plenty of space, don't shrink the URLs or words
      autoShrinkURLs       : true,  // take a long URL and shrink it *if space is needed*
      autoShrinkWords      : true,  // make changes to the input (e.g. s/and/\&/) *if space is needed*
      autoLookupNames      : true,  // if user types '@d' lookup friends (case insensitively!) in dropdown based on username AND real name (e.g. dalmaer and Dion Almaer)
      allowUpload          : true,  // have the upload button that then shows a file upload for users
      useLocation          : false, // default setting for sending geo location
      tweetWithLocation    : false, // add another button to tweet with the location
      useKeyboardShortcuts : false, // allow keyboard shortcuts for actions
      useCharacterPalette  : true,  // allow the palette action to popup a palette of chars
      expandTypingArea     : false  // the input is made larger so you can see everything
    };

    // If options are passed in, merge them with the defaults (options win)
    if (opts) {
      $.extend(defaults, opts);
    }

    // Add buttons and counter after textarea div
    $('<div style="float: right;"><span id="charcount" class="tweet-counter">140</span><button id="shrinktweet">Shrink</button><button id="cleartweet">Clear</button><button id="reloadtweet">Reload</button><button id="tweetbtn">Tweet</button></div>').appendTo(".twinputdiv");
    
    // This runs for all of the matches
    return this.each(function() {  
            
      var textarea = $(this);
      var tweetBtn = $("#tweetbtn");
      tweetBtn.attr('DISABLED', true);

      // I'm not happy to hook up two events here, but the DEL key doesn't generate a keypress event
      // and if you hold a key down it doesn't update the display unless both keyup and keydown are registered
      textarea.keyup(function() {
        updateInput(textarea, $("#charcount"), tweetBtn);
      });
      
      textarea.keydown(function() {
        updateInput(textarea, $("#charcount"), tweetBtn);
      });
      
      tweetBtn.click(function() {
        sendTweet(textarea.val());
      });
      
      $("#cleartweet").click(function() {
        clearTweet(textarea, $("#charcount"), tweetBtn);
      });
      
      $("#reloadtweet").click(function() {
        reloadTweet(textarea, $("#charcount"), tweetBtn);
      });

      $("#shrinktweet").click(function() {
        shrinkTweet(textarea, $("#charcount"));
      });

    });
    
  };
  
}(jQuery));

