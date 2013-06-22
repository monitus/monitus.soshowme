![soshowme icon](http://new.malus.ca/wp-content/uploads/2012/11/soshowme.png)
========

soshowme is a jQuery-UI plugin that allows users to pick any element on a page, and get the jQuery selector to it. 

Particularly useful in interfaces where you want users to pick areas on a page, but don’t want them to bother with 
learning jQuery selector syntax… Simply move your mouse over the box below, and see what it’s all about. Clicking 
on an element sends an event that you can use to save the jQuery selector.

See it in action on our demo page: http://www.malus.ca/soshowme/.

Usage
=====

You can start the tracking on any area of a page with something like:

```javascript
jQuery(function($) {
  var demo = $("#demo-zone");
  demo.soshowme({ // create the widget
    select: function(event, ui) { // callback when the user selects (clicks) a node inside "#demo-zone"
      alert(ui.selector);
    }
  });
  demo.soshowme("tracking", true); // start tracking mouse movements inside "#demo-zone"
  // you can also stop tracking at any time with:
  // demo.soshowme("tracking", false);
});
```

Styling
=======

See the included css file for classes you can override in your own css and get complete control over thw widget's look.
