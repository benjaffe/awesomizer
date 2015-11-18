;(function() {
  console.log('POPUP SCRIPT WORKS!');

  // here we use SHARED message handlers, so all the contexts support the same
  // commands. but this is NOT typical messaging system usage, since you usually
  // want each context to handle different commands. for this you don't need
  // handlers factory as used below. simply create individual `handlers` object
  // for each context and pass it to msg.init() call. in case you don't need the
  // context to support any commands, but want the context to cooperate with the
  // rest of the extension via messaging system (you want to know when new
  // instance of given context is created / destroyed, or you want to be able to
  // issue command requests from this context), you may simply omit the
  // `hadnlers` parameter for good when invoking msg.init()
  var handlers = require('./modules/handlers').create('popup');
  var msg = require('./modules/msg').init('popup', handlers);
  var form = require('./modules/form');
  var runner = require('./modules/runner');

  var $ = require('./libs/jquery');

//   msg.bcast(/* ['ct'], */ 'ping', 'foo _true', function(responses) {
// //     console.log(responses);  // --->  ['pong','pong',...]
//   });

  //msg.bcast(/* ['ct'], */ 'setSettings', function(responses) {
//     console.log(responses);  // --->  ['pong','pong',...]
  //});
  var features;
  var view = {
    render: function() {
      console.log('view rendering');
      $('#settings-list').html();
      msg.bcast(/* ['ct'], */ 'getSettings', function(responses) {
        console.log('just got settings')
        features = responses[0];
        console.log(features);

        features.forEach(function(feature){
          console.log(feature);
          var fdis = (feature.enabled) ? '' : 'feature-disabled';
          var elem = $('<li id="feature-'+feature.shortName+'" class="feature ' + fdis + '">'+
              '<h3 class="title">'+
                '<span class="feature-name">'+feature.name+'</span>'+
                '<span class="feature-service"> for '+feature.service+'</span></h3>'+
              '<p class="description">'+feature.description+'</p>'+
              (feature.note ? '<div class="note">'+feature.note+'</div>' : '')+
            '</li>');

          elem.click(function(e){
            var currentlyEnabled = !$(this).hasClass('feature-disabled');
            console.log($(this),currentlyEnabled);
            $(this).toggleClass('feature-disabled');

            msg.bcast(/* ['ct'], */ 'setSetting', feature.shortName, !currentlyEnabled, function(responses) {
              // features = responses[0];
            });
          });

          $('#settings-list').append(elem);
          console.log($('#settings-list'), elem);
        });
      });
    }
  };

  $(function(){
    view.render();
  });
  //form.init(runner.go.bind(runner, msg));

})();
