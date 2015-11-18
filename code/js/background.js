;(function() {

  // Register your feature here for inclusion in the popup window
  var defaultFeatures = [
    {
      name: 'Attendee Enabler',
      shortName: 'googleCalendarPermissions',
      service: 'Google Calendar',
      description: 'Automatically selects the "guests can modify this event" checkbox for new events.',
      enabled: true,
      settings: {}
    },
    {
      name: 'Google Docs Night Mode',
      shortName: 'docsNightMode',
      service: 'Google Docs',
      description: 'Night mode for Docs, so your eyes don\'t explode from reading docs late into the night.',
      enabled: false,
      settings: {}
    }
  ];

  var $ = require('./libs/jquery');

  var prevFeatures = JSON.parse(localStorage.settings || '[]');
  var features = [];

  defaultFeatures.forEach(function(defaultFeature) {
    var found = false;
    prevFeatures.forEach(function(prevFeature) {
      var feature = {};
      if (defaultFeature.shortName === prevFeature.shortName) {
        feature.name = defaultFeature.name;
        feature.shortName = defaultFeature.shortName;
        feature.service = defaultFeature.service;
        feature.description = defaultFeature.description;
        feature.note = defaultFeature.note;
        feature.enabled = prevFeature.enabled;
        features.push(feature);
        found = true;
      }
    });

    // if we don't have something stored for this, it must be a new feature!
    if (!found) {
      features.push(defaultFeature);
    }
  });

  localStorage.settings = JSON.stringify(features);

  // function setting(data) {
  //   var settings = JSON.parse(localStorage.settings || '{}');
  //   for (var key in settings) {
  //     setting = settings[key];
  //     features.forEach(function(feature){
  //       if (feature.shortName = settings.shortName) {
  //          feature.enabled = setting.enabled;
  //       }
  //     });
  //   }
  //   console.log(settings);


  //   if (!data) return JSON.parse(localStorage.settings || '{}');

  //   settings[data.shortName] = data.enabled;
  //   localStorage.settings = JSON.stringify(settings);
  //   console.log('setting ' + data.shortName, settings);


  // }


  /**
   * Possible parameters for request:
   *  action: "getJSON" for a cross-origin JSON request,
   *          "xhttp" for a cross-origin HTTP request
   *  method: Default "GET" (optional for "getJSON" action)
   *  url   : required, but not validated
   *  data  : data to send in a POST request (optional for "getJSON" action)
   *
   * The callback function is called upon completion of the request */
  chrome.runtime.onMessage.addListener(function(request, sender, callback) {
      if (request.action === 'getJSON') {
        $.ajax({
          url: request.url,
          dataType: 'json',
          timeout: 10000,
          success: function(data){
            callback(data);
          },
          error: function() {
            callback();
          }
        });
        return true;
      }

      if (request.action === "xhttp") {
          var xhttp = new XMLHttpRequest();
          var method = request.method ? request.method.toUpperCase() : 'GET';

          xhttp.onload = function() {
              callback(xhttp.responseText);
          };
          xhttp.onerror = function() {
              // Do whatever you want on error. Don't forget to invoke the
              // callback to clean up the communication port.
              callback();
          };
          xhttp.open(method, request.url, true);
          if (method == 'POST') {
              xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
          }
          xhttp.send(request.data);
          return true; // prevents the callback from being called too early on return
      }
  });



  // console.log('BACKGROUND SCRIPT WORKS!');

  // here we use SHARED message handlers, so all the contexts support the same
  // commands. in background, we extend the handlers with two special
  // notification hooks. but this is NOT typical messaging system usage, since
  // you usually want each context to handle different commands. for this you
  // don't need handlers factory as used below. simply create individual
  // `handlers` object for each context and pass it to msg.init() call. in case
  // you don't need the context to support any commands, but want the context to
  // cooperate with the rest of the extension via messaging system (you want to
  // know when new instance of given context is created / destroyed, or you want
  // to be able to issue command requests from this context), you may simply
  // omit the `hadnlers` parameter for good when invoking msg.init()
  var handlers = require('./modules/handlers').create('bg');
  // adding special background notification handlers onConnect / onDisconnect
  function logEvent(ev, context, tabId) {
    console.log(ev + ': context = ' + context + ', tabId = ' + tabId);
  }
  handlers.onConnect = logEvent.bind(null, 'onConnect');
  handlers.onDisconnect = logEvent.bind(null, 'onDisconnect');
  // handlers.onSettingsChange = function(data, response) {
  //   console.log(data);
  // };
  handlers.getSettings = function() {
    if (typeof arguments[0] === 'function') {
      console.log('getting all settings (bg.js)', arguments);
      arguments[0]( settings.getAll() );
    } else if (typeof arguments[1] === 'function') {
      console.log('getting all settings (bg.js)', arguments, settings.get(arguments[0]));
      arguments[1]( settings.get(arguments[0]) );
    }
  };

  handlers.setSetting = function(shortName, enabled, response) {
    settings.set(shortName, enabled);
  };

  var settings = {
    set: function(shortName, enabled) {
      var settings = this.getAll();
      settings.forEach(function(feature){
        if (feature.shortName === shortName) {
          console.log('enabling ' + shortName + feature.shortName);
          feature.enabled = enabled;
        }
      });
      console.log('SETTINGS: ', settings);
      localStorage.settings = JSON.stringify(settings);
    },
    get: function(shortName) {
      var settings = this.getAll();
      var winningFeature;
      // console.log(settings);
      settings.forEach(function(feature){
        // console.log(feature);
        if (feature.shortName === shortName) {
          // console.log('winner',feature);
          winningFeature = feature;
        }
      });
      return winningFeature;
    },
    getAll: function() {
      var settings = JSON.parse(localStorage.settings || '{}');
      return settings;
    }
  };

  var msg = require('./modules/msg').init('bg', handlers);

  // setTimeout(function() {
  //   msg.bcast('init', 'googleCalendar', function(successBool) {
  //     if (successBool) console.log('Success with ' + 'quizAnalytics');
  //     console.log(successBool);
  //   });
  // },5000);


  // issue `echo` command in 10 seconds after invoked,
  // schedule next run in 5 minutes
  function helloWorld() {
    console.log('===== will broadcast "hello world!" in 10 seconds');
    setTimeout(function() {
      console.log('>>>>> broadcasting "hello world!" now');
      msg.bcast('echo', 'hello world!', function() {
        console.log('<<<<< broadcasting done');
      });
    }, 10 * 1000);
    setTimeout(helloWorld, 5 * 60 * 1000);
  }

  // start broadcasting loop
  // helloWorld();

})();
