//
// twinput: jQuery plugin to add rich twitter input to an <input>
//
// Examples
//
// $('.twitter').twinput() // simple, use defaults on any class='twitter'
//
// $('input[twitter]').twinput({ // twitter types and change defaults
//    autoShrinkURLs: false
// })
//

(function($) {

  $.fn.twinput = function(opts) {

    var defaults = {
      autoShrinkURLs : true, // take a long URL and shrink it *if space is needed*
      autoShrinkWords: true, // make changes to the input (e.g. s/and/\&/) *if space is needed*
      autoLookupNames: true, // if user types '@d' lookup friends (case insensitively!) in dropdown based on username AND real name (e.g. dalmaer and Dion Almaer)
      allowUpload    : true, // have the upload button that then shows a file upload for users
      useLocation    : false // default setting for sending geo location
    };
    
    // If options are passed in, merge them with the defaults (options win)
    if (opts) {
      $.extend(defaults, opts);
    }

    // This runs for all of the matches
    return this.each(function() {        

        // THIS IS WHERE WE DO SOMETHING TO THE ELEMENT
        $(this).fadeOut(); // change this :)

    });
    
  };
})(jQuery);