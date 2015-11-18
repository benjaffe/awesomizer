;(function() {

  // var cssFiles = ['template.css']; // if you have CSS (relative path from this directory)

  // returns this file's filename without the .js (aka the shortName)
  var shortName = getShortName();
  
  // var $ = require('../../libs/jquery');  // if you need jQuery

  function init(feature) {
    if (initHappened) {console.log('...oh wait, we already inited!');return false;}
    initHappened = true;
    try {
      if (cssFiles) addCSS();
    } catch(e) {}


    // YOUR CODE HERE!

  }





  var initHappened;
  var handlers = require('../../modules/handlers').create('ct');

  // If you want to RESPOND to events, this is the code you'll need. Any number of
  // arguments can be passed, and the last will be the response function.

  // function iGotAMoo (argument1, argument2, response) {
  //   console.log('HOLY COW, I got a 'moo' event! I should send a response...');
  //   response('moooo!!!');
  // };
  // handlers['moo'] = iGotAMoo;

  handlers['setSetting'] = function(fShortName, enabled, response) {
    if (fShortName === shortName) {
      if (enabled) {
        console.log('OK guys, that\'s us! It\'s time to init!');
        init();
      } else {
        console.log('OK guys, it\'s time for us to go! Unload!');
        try{
          unload();
        } catch(e) {
          console.log('Wait a sec... we don\'t know how! We\'ll stay then.');
        }
      }
    }
  };

  var msg = require('../../modules/msg').init('ct', handlers);


  // Only initializes the feature if it is enabled...
  // (It sends a broadcast asking for the feature settings, then initializes (or not))
  msg.bcast('getSettings', shortName, function(setting, response){
    var feature = setting[0];
    if (feature.enabled) {
      console.log('=== Awesomizing ' + feature.service + ' with the ' + feature.name + ' ===');
      init(feature);
    }
  });

  // if we have CSS, load and inject it into the page
  function addCSS() {
    cssFiles.forEach(function(filePath){
      var path = chrome.extension.getURL('js/features/' + shortName + '/' + filePath);
      function reqListener () {
        if (!this.responseText) return false;
        var styleElem = document.createElement('style');
        styleElem.innerHTML = this.responseText;
        document.body.appendChild(styleElem);
      }

      var oReq = new XMLHttpRequest();
      oReq.onload = reqListener;
      oReq.open("get", path, true);
      oReq.send();
    });
  }

  function getShortName() {
    var error = new Error();
    var lastStackFrameRegex = new RegExp(/.+\/(.*?):\d+(:\d+)*$/);
    var currentStackFrameRegex = new RegExp(/getScriptName \(.+\/(.*):\d+:\d+\)/);
    var source, shortName;
    
    if((source = lastStackFrameRegex.exec(error.stack.trim())) && source[1] != "")
        shortName = source[1].split('.js')[0];
    else if((source = currentStackFrameRegex.exec(error.stack.trim())))
        shortName = source[1].split('.js')[0];

    return shortName;
  }

})();