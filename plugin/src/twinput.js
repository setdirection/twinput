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
  var NUM_NERVOUS_CHARS = MAX_CHARS - 10; // Length of tweet when to start getting nervous about reaching max length
  var TIMER_INTERVAL = 2000; // Interval for periodic tasks, e.g. saving tweet, etc.
  var MIN_URL_LEN = 20; // URLs need to be more than this in order to bother shortening
  
  var getInputColorGradient = function(n) {
    var green = parseInt(251.0*n, 10);
    var red = parseInt(255.0*(1.0-n), 10); 
    var blue = parseInt(152.0*n, 10);
    
    return "rgba(" + red + "," + green + "," + blue + ", 0.2)";
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
  };
  
  var replaceLongUrl = function(textarea, shortUrl, longUrl, countElem) {
    var text;
    if (shortUrl && longUrl) {
      text = textarea.val();
      console.log("replaceLongUrl long: " + longUrl + " with short: " + shortUrl);
      textarea.val(text.replace(longUrl, shortUrl));
    }
    
    updateInput(textarea, countElem);
  };
  
  var updateInput = function(textarea, countElem, btn) {
    var remain = updateCount(textarea, countElem, btn);
    return remain;
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
  
  var doIntervalStuff = function(textarea, countElem, btn) {
    // Save tweet
    var text = textarea.val();
    
    if (text) {
      localStorage.savedTweet = textarea.val();
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
    
    // Shrink URLs
    var shrinkUrls = function(textarea, countElem) {
      var result;
      var text = textarea.val();
      // Stolen from Crockford
      // var parse_url = /(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?/g;
      // Stolen from http://daringfireball.net/2010/07/improved_regex_for_matching_urls
      var parse_url = /\b((?:[a-z][\w]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?]))/gmi;

      var callback = function(shortUrl, longUrl){ replaceLongUrl(textarea, shortUrl, longUrl, countElem); };

      if (!text) {
        return;
      }
      
      while (true) {
        result = parse_url.exec(text);
        if (result) {
          console.log("shrinkUrls url: " + result[0]);
          if (result[0].length > MIN_URL_LEN) {
            shortenUrl(result[0], callback);
          }
        } else {
          break;
        }
      }

      updateInput(textarea, countElem);
    };

    // Shrink words
    var shrinkWords = function(textarea, countElem) {
      var result, i;
      var text = textarea.val();
      var words = [ 
                    { regex: /(^|\s)(and)(\s|\.|;|,|$)/gmi,
                      sword: '&'
                    },
                    { regex: /(^|\s)(about)(\s|\.|;|,|$)/gmi,
                      sword: 'ab'
                    },
                    { regex: /(^|\s)(before)(\s|\.|;|,|$)/gmi,
                      sword: 'b4'
                    },
                    { regex: /(^|\s)(because)(\s|\.|;|,|$)/gmi,
                      sword: 'b/c'
                    },
                    { regex: /(^|\s)(background)(\s|\.|;|,|$)/gmi,
                      sword: 'bgd'
                    },
                    { regex: /(^|\s)(check)(\s|\.|;|,|$)/gmi,
                      sword: 'chk'
                    },
                    { regex: /(^|\s)(overheard)(\s|\.|;|,|$)/gmi,
                      sword: 'OH'
                    },
                    { regex: /(^|\s)(i see)(\s|\.|;|,|$)/gmi,
                      sword: 'IC'
                    }
                  ];

      if (!text) {
        return;
      }
      
      for (i = 0; i < words.length; i += 1) {
        while (true) {
          result = words[i].regex.exec(text);
          console.log("shrinkWords result: " + result);
          if (result) {
            textarea.val(text.replace(result[0], result[1] + words[i].sword + result[3]));
            text = textarea.val();
          } else {
            break;
          }
        }
      }

      updateInput(textarea, countElem);
    };

    var saveOptions = function(options) {
      var optionsString = JSON.stringify(options);
      localStorage.options = optionsString;
    };
    
    var getOptions = function() {
      var optionsString = localStorage.options;
      if (optionsString) {
        var options = JSON.parse(optionsString);
        return options;
      }
      return null;
    };
    
    var updateOptions = function(options) {
      // Why doesn't $("#autoshrinku").attr('checked', boolean); work?
      $('input[id=autoshrinkneeded]').attr('checked', options.onlyShrinkWhenNeeded);
      $('input[id=autoshrinku]').attr('checked', options.autoShrinkURLs);
      $('input[id=autoshrinkw]').attr('checked', options.autoShrinkWords);
      $('input[id=locationopt]').attr('checked', options.useLocation);
    };
    
    var handleKeyDown = function(event, textarea, charCount, tweetBtn) {
      var text = textarea.val();
      updateInput(textarea, charCount, tweetBtn);
      //console.log("handleKeyDown keyCode: " + event.keyCode);
      //var character = event.keyCode ? String.fromCharCode(event.keyCode) : null;
      //console.log("Keydown char: " + character);
      if (event.keyCode === 32) {
        if (opts.onlyShrinkWhenNeeded && text && text.length < NUM_NERVOUS_CHARS) {
          return;
        }

        if (opts.autoShrinkURLs) {
          shrinkUrls(textarea, charCount);
        }
        
        if (opts.autoShrinkWords) {
          shrinkWords(textarea, charCount);
        }
      }
    };
    
		var $tweetsDialog = $('<div class="tweets" id="tweets"></div>')
				.html('<p>Retrieving your tweets...</p>')
				.dialog({
					autoOpen: false,
					title: 'Your Recent Tweets',
					disabled: true,
					closeOnEscape: true
				});
				
		$tweetsDialog.bind("dialogopen", function(event, ui) {
      // Print recent tweets for user. Show use of jTwitter plugin
      $.jTwitter('ewpreston', 10, function(data){
        $('#tweets').empty();
        $.each(data, function(i, post){
            $('#tweets').append(
                '<div class="post">'
                +' <div class="txt">'
                // See output-demo.js file for details
                + (i+1) + '. '+    post.text
                +' </div>'
                +'</div>'
            );
        });
      });
    });

		var $paletteDialog = $('<div class="palette" id="palette"></div>')
				.html('<p>Configuring the palette...</p>')
				.dialog({
					autoOpen: false,
					title: 'Fun Characters',
					disabled: true,
					closeOnEscape: true
				});
				
		$paletteDialog.bind("dialogopen", function(event, ui) {
      // character palette popup
      $('#palette').empty();
      $('#palette').append(
          '<table><tr><td id="recycle">♺</td></tr></table>'
      );
    });

    // merge opts to clobber defaults
    opts = $.extend({}, defaults, opts, getOptions());
    
    // Add buttons and counter after textarea div
    $('<div id="optionsrow"><div id="optionsdiv" style="float: left;"><input type="checkbox" id="locationopt"/>Location<input type="checkbox" id="autoshrinkw"/>Shrink Words<input type="checkbox" id="autoshrinku"/>Shrink URLs<input type="checkbox" id="autoshrinkneeded"/>Shrink Needed</div><div id="counterdiv" style="float: right;">' +
      '<span id="charcount" class="tweet-counter">140</span></div></div>').appendTo(".twinputdiv");
    $('<div id="buttondiv" style="clear: both;"><button id="tweetbtn">Tweet</button><button id="showtweets">Recent Tweets</button><button id="charPalette">Chars</button><button id="shrinkUrls">Shrink URLs</button><button id="shrinkWords">Shrink Words</button><button id="cleartweet">Clear</button><button id="reloadtweet">Reload</button></div>').appendTo(".twinputdiv");
    
    updateOptions(opts);
    
    // This runs for all of the matches
    return this.each(function() {  
      var textarea = $(this);
      var tweetBtn = $("#tweetbtn");
      var charCount = $("#charcount");

      tweetBtn.attr('DISABLED', true);

      textarea.keydown(function(event) {
        handleKeyDown(event, textarea, charCount, tweetBtn);
      });
      
      tweetBtn.click(function() {
        sendTweet(textarea.val());
      });
      
      $("#cleartweet").click(function() {
        clearTweet(textarea, charCount, tweetBtn);
      });
      
      $("#reloadtweet").click(function() {
        reloadTweet(textarea, charCount, tweetBtn);
      });

      // Event binding for shrink URLs
      textarea.bind("shrinkUrlEvent", function(e) {
        shrinkUrls(textarea, charCount);
      });
      
      // Register shrink URL button click event
      $("#shrinkUrls").click(function() {
        textarea.trigger("shrinkUrlEvent");
      });
      
      // Register key bindings for shrink URL
      textarea.bind('keydown', 'Ctrl+s', function(e) {
        textarea.trigger("shrinkUrlEvent");
        return false;
      });
      
      textarea.bind('keydown', 'Meta+s', function(e) {
        textarea.trigger("shrinkUrlEvent");
        return false;
      });
      
      // Event binding for shrink words
      textarea.bind("shrinkWordEvent", function(e) {
        shrinkWords(textarea, charCount);
      });
      
      // Register shrink URL button click event
      $("#shrinkWords").click(function() {
        textarea.trigger("shrinkWordEvent");
      });
      
      // Register key bindings for shrink URL
      textarea.bind('keydown', 'Ctrl+e', function(e) {
        textarea.trigger("shrinkWordEvent");
        return false;
      });
      
      textarea.bind('keydown', 'Meta+e', function(e) {
        textarea.trigger("shrinkWordEvent");
        return false;
      });
      
      $("#locationopt").click(function() {
        opts.useLocation = $("#locationopt").attr('checked');
        saveOptions(opts);
      });
      
      $("#autoshrinkw").click(function() {
        opts.autoShrinkWords = $("#autoshrinkw").attr('checked');
        saveOptions(opts);
      });
      
      $("#autoshrinku").click(function() {
        opts.autoShrinkURLs = $("#autoshrinku").attr('checked');
        saveOptions(opts);
      });
      
      $("#autoshrinkneeded").click(function() {
        opts.onlyShrinkWhenNeeded = $("#autoshrinkneeded").attr('checked');
        saveOptions(opts);
      });
      
      $("#showtweets").click(function() {
        $tweetsDialog.dialog("open");
      });
      
      $("#charPalette").click(function() {
        $paletteDialog.dialog("open");
      });
      
      setInterval(function() { doIntervalStuff(textarea, charCount, tweetBtn); }, TIMER_INTERVAL); 

    });
    
  };
  
}(jQuery));

