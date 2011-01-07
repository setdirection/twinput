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
  var updateCount = function(textarea, elem) {
    var val = textarea.val();
    var len = val ? val.length : 0;
    var remain = MAX_CHARS - len;
    elem.html("" + remain);
    
    elem.css("color", getCountColorGradient(remain));
    
    textarea.css("background-color", getInputColorGradient(remain/140.0));
  };
  
  var updateInput = function(textarea, countElem) {
    updateCount(textarea, countElem);
    
    // Is this too expensive to do every keypress event?
    sessionStorage.savedTweet = textarea.val();
  };
  
  var sendTweet = function(val) {
    if (val) {
      alert("Sent the tweet: " + val);
    } else {
      alert("You ain't tweeting nuttin");
    }
  };
  
  var clearTweet = function(textarea, countElem) {
    textarea.val("");
    updateCount(textarea, countElem);
  };
  
  var reloadTweet = function(textarea, countElem) {
    var savedTweet = sessionStorage.savedTweet;
    if (savedTweet) {
      textarea.val(savedTweet);
      updateCount(textarea, countElem);
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
    $('<div style="float: right;"><span id="charcount" class="tweet-counter">140</span><button id="cleartweet">Clear</button><button id="reloadtweet">Reload</button><button id="tweetbtn">Tweet</button></div>').appendTo(".twinputdiv");
    
    // This runs for all of the matches
    return this.each(function() {  
            
      var textarea = $(this);

      // I'm not happy to hook up two events here, but the DEL key doesn't generate a keypress event
      // and if you hold a key down it doesn't update the display unless both keyup and keydown are registered
      textarea.keyup(function() {
        updateInput(textarea, $("#charcount"));
      });
      
      textarea.keydown(function() {
        updateInput(textarea, $("#charcount"));
      });
      
      $("#tweetbtn").click(function() {
        sendTweet(textarea.val());
      });
      
      $("#cleartweet").click(function() {
        clearTweet(textarea, $("#charcount"));
      });
      
      $("#reloadtweet").click(function() {
        reloadTweet(textarea, $("#charcount"));
      });

    });
    
  };
  
})(jQuery);

