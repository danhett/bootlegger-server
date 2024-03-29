/**
 * global variables
 */
var currentMediaSession = null;
var currentVolume = 0.5;
var progressFlag = 1;
var mediaCurrentTime = 0;
var session = null;
//var mediaURLs = ['https://bootlegger.s3.amazonaws.com/upload/1410202939117_635456942836277410.mp4.mp4'];
//var mediaTitles = [
//           'Bootlegger Test'];

var currentMediaIndex = 0;
var timer = null;
var masterplaylist = [];

//var mastereventname = 'Loading Event...';
// var masterplaylist = [
//     {
//       title: 'Test Item 1',
//       contentId : 'https://bootlegger.s3.amazonaws.com/upload/1410203328256_635456945116542010.mp4.mp4',
//       image: 'https://bootlegger.s3.amazonaws.com/upload/1410202169768_tb_runners_follow.mp4.png'
//     },
//     {
//       title: 'Test Item 2',
//       contentId : 'https://bootlegger.s3.amazonaws.com/upload/1410203136595_635456944084044220.mp4.mp4',
//       image: 'https://bootlegger.s3.amazonaws.com/upload/1410202126970_tb_spectators.mp4.png'
//     }
// ]

function createTimer() {
  timer = setInterval(updateCurrentTime.bind(this), 1000);
}

function clearTimer() {
	console.log("clearTimer");
	if (timer) {
	  clearInterval(timer);	
	}
}

/**
 * Call initialization
 */

window['__onGCastApiAvailable'] = function(loaded, errorInfo) {
  if (loaded) {
    setTimeout(initializeCastApi, 1000);
    document.getElementById("cast_wrapper").style.display = 'block';
  }
}

/**
 * initialization
 */
function initializeCastApi() {
  var applicationID = '823ACE8C';
  var sessionRequest = new chrome.cast.SessionRequest(applicationID);
  var apiConfig = new chrome.cast.ApiConfig(sessionRequest,
    sessionListener,
    receiverListener);

  chrome.cast.initialize(apiConfig, onInitSuccess, onError);
};

/**
 * initialization success callback
 */
function onInitSuccess() {
  appendMessage("init success");
}

/**
 * initialization error callback
 */
function onError(err) {
  console.log("error:" + err);
  appendMessage("error");
}

/**
 * generic success callback
 */
function onSuccess(message) {
  console.log(message);
}

/**
 * callback on success for stopping app
 */
function onStopAppSuccess() {
  console.log('Session stopped');
  appendMessage('Session stopped');
  document.getElementById("casticon").src = '/cast/images/cast_icon_idle.png'; 
}

/**
 * session listener during initialization
 */
function sessionListener(e) {
  console.log('New session ID: ' + e.sessionId);
  appendMessage('New session ID:' + e.sessionId);
  session = e;
  if (session.media.length != 0) {
    appendMessage(
        'Found ' + session.media.length + ' existing media sessions.');
    onMediaDiscovered('onRequestSessionSuccess_', session.media[0]);
  }
  session.addMediaListener(
      onMediaDiscovered.bind(this, 'addMediaListener'));
  session.addUpdateListener(sessionUpdateListener.bind(this));  

  loadMedia();
}

/**
 * session update listener 
 */
function sessionUpdateListener(isAlive) {
  var message = isAlive ? 'Session Updated' : 'Session Removed';
  message += ': ' + session.sessionId;
  appendMessage(message);
  if (!isAlive) {
    session = null;
    document.getElementById("casticon").src = '/cast/images/cast_icon_idle.png'; 
    var playpauseresume = document.getElementById("playpauseresume");
    playpauseresume.innerHTML = 'Play';
    clearTimer();
  }
};

/**
 * receiver listener during initialization
 */
function receiverListener(e) {
  if( e === 'available' ) {
    console.log("receiver found");
    appendMessage("receiver found");
  }
  else {
    console.log("receiver list empty");
    appendMessage("receiver list empty");
  }
}

// /**
//  * select a media URL 
//  * @param {string} m An index for media URL
//  */
// function selectMedia(m) {
//   console.log("media selected" + m);
//   appendMessage("media selected" + m);
//   currentMediaIndex = m;
//   var playpauseresume = document.getElementById("playpauseresume");
//   document.getElementById('thumb').src = mediaThumbs[m];
// }

/**
 * launch app and request session
 */
function launchApp() {
  console.log("launching app...");
  appendMessage("launching app...");
  chrome.cast.requestSession(onRequestSessionSuccess, onLaunchError);
  clearTimer();
}

/**
 * callback on success for requestSession call  
 * @param {Object} e A non-null new session.
 */
function onRequestSessionSuccess(e) {
  console.log("session success: " + e.sessionId);
  appendMessage("session success: " + e.sessionId);
  session = e;
  document.getElementById("casticon").src = '/cast/images/cast_icon_active.png'; 
  session.addUpdateListener(sessionUpdateListener.bind(this));  

  loadMedia();

  //tlb -- send custom message to the receiver to load a bootlegger list...

  // var message = {
  //   type: 'EVENT',
  //   eventid : '5409bf25c51f944315ab1c59',
  //   eventname: 'Great North Run',
  //   items:{
  //     title: 'Test Item 1',
  //     contentId : 'https://bootlegger.s3.amazonaws.com/upload/1410203328256_635456945116542010.mp4.mp4',
  //     image: 'https://bootlegger.s3.amazonaws.com/upload/1410202169768_tb_runners_follow.mp4.png'
  //   }
  // };
  // session.sendMessage('urn:x-cast:tv.bootlegger.cast.playlist', JSON.stringify(message));
}

/**
 * callback on launch error
 */
function onLaunchError(err) {
  console.log("launch error:" + err);
  appendMessage("launch error");
  clearTimer();
}

/**
 * stop app/session
 */
function stopApp() {
  session.stop(onStopAppSuccess, onError);
  clearTimer();
}

/**
 * load media
 * @param {string} i An index for media
 */
function loadMedia() {

  //load media
  socket.get('/media/castlist/'+mastereventid,function(data)
  {
    masterplaylist = data;
 


  if (!session) {
    console.log("no session");
    appendMessage("no session");
    return;
  }
  //console.log("loading..." + mediaURLs[currentMediaIndex]);
  //appendMessage("loading..." + mediaURLs[currentMediaIndex]);

  var mediaInfo = new chrome.cast.media.MediaInfo(masterplaylist[0].contentId);
  mediaInfo.contentType = 'video/mp4';
  mediaInfo.metadata = new chrome.cast.media.MovieMediaMetadata();
  mediaInfo.metadata.title = masterplaylist[0].title;
  var image = new chrome.cast.Image();
  image.url = masterplaylist[0].image;
  mediaInfo.metadata.images = [image];

  var request = new chrome.cast.media.LoadRequest(mediaInfo);
  request.autoplay = false;
  request.currentTime = 0;

  // Pass an initial playlist to the receiver
  // as custom data with the media load request
  // Create playlist with 2 elements
  // var playlist = [];
  // for (var i = 1; i < 2; i++)
  // {
  //   var listItem = {
  //     title: mediaTitles[i],
  //     contentId : mediaURLs[i],
  //     image: mediaThumbs[i]
  //   };
  //   playlist.push(listItem);
  // }
  // Add the initial playlist as custom data for the load media request
  request.customData = {
    playlist: masterplaylist,
    eventname:mastereventname
    // Here you could add extra metadata for each media item, it is free-form
  };
  // load the media with custom data
  session.loadMedia(request,
    onMediaDiscovered.bind(this, 'loadMedia'),
    onMediaError);
   });
};


/**
 * add a video to the playlist
 */
function addToPlaylist() {
  if (!session) {
    console.log("no session");
    appendMessage("no session");
    return;
  }
  console.log("adding item to playlist..." + mediaURLs[currentMediaIndex]);
  appendMessage("adding item to playlist..." + mediaURLs[currentMediaIndex]);
    
  var message = {
    type: 'ADD',
    playlistItem: masterplaylist[currentMediaIndex]
  };
  session.sendMessage('urn:x-cast:tv.bootlegger.cast.playlist', JSON.stringify(message));
};


/**
 * callback on success for loading media
 * @param {Object} e A non-null media object
 */
function onMediaDiscovered(how, mediaSession) {
  console.log("new media session ID:" + mediaSession.mediaSessionId);
  appendMessage("new media session ID:" + mediaSession.mediaSessionId + ' (' + how + ')');
  currentMediaSession = mediaSession;
  mediaSession.addUpdateListener(onMediaStatusUpdate);
  mediaCurrentTime = currentMediaSession.currentTime;
  playpauseresume.innerHTML = 'Play';
  document.getElementById("casticon").src = '/cast/images/cast_icon_active.png'; 
  playMedia();
}

/**
 * callback on media loading error
 * @param {Object} e A non-null media object
 */
function onMediaError(e) {
  console.log("media error");
  appendMessage("media error");
  document.getElementById("casticon").src = '/cast/images/cast_icon_warning.png'; 
}

/**
 * callback for media status event
 * @param {Object} e A non-null media object
 */
function onMediaStatusUpdate(isAlive) {
  if( progressFlag ) {
    lastCurrentTimeUpdate = new Date().getTime();
    document.getElementById("progress").style.width = parseInt(100 * currentMediaSession.currentTime / currentMediaSession.media.duration) + "%";
  }
  document.getElementById("playerstate").innerHTML = currentMediaSession.playerState;

  // Have we changed media?
  //if (masterplaylist[currentMediaIndex] != currentMediaSession.media.metadata.title) {
    //document.getElementById('thumb').src = currentMediaSession.media.metadata.images[0].url;
  //}
}

/**
 * Updates the progress bar shown for each media item.
 */
function updateCurrentTime() {
  console.log("updateCurrentTime");
  if (!session || !currentMediaSession) {
    return;
  }

  if (currentMediaSession.media && currentMediaSession.media.duration != null) {
    document.getElementById("progress").style.width = parseInt(100 * currentMediaSession.getEstimatedTime() / currentMediaSession.media.duration) + "%";
  }
  else {
    document.getElementById("progress").style.width = 0;
    clearTimer();
  }
};

/**
 * play media
 */
function playMedia() {
  if( !currentMediaSession ) 
    return;

  clearTimer();

  var playpauseresume = document.getElementById("playpauseresume");
  if( playpauseresume.innerHTML == 'Play' ) {
    currentMediaSession.play(null,
      mediaCommandSuccessCallback.bind(this,"playing started for " + currentMediaSession.sessionId),
      onError);
      playpauseresume.innerHTML = 'Pause';
      //currentMediaSession.addListener(onMediaStatusUpdate);
      appendMessage("play started");
      createTimer();
  }
  else {
    if( playpauseresume.innerHTML == 'Pause' ) {
      currentMediaSession.pause(null,
        mediaCommandSuccessCallback.bind(this,"paused " + currentMediaSession.sessionId),
        onError);
      playpauseresume.innerHTML = 'Resume';
      appendMessage("paused");
      createTimer();
    }
    else {
      if( playpauseresume.innerHTML == 'Resume' ) {
        currentMediaSession.play(null,
          mediaCommandSuccessCallback.bind(this,"resumed " + currentMediaSession.sessionId),
          onError);
        playpauseresume.innerHTML = 'Pause';
        appendMessage("resumed");
        createTimer();
      }
    }
  }
}

/**
 * stop media
 */
function stopMedia() {
  if( !currentMediaSession ) 
    return;

  currentMediaSession.stop(null,
    mediaCommandSuccessCallback.bind(this,"stopped " + currentMediaSession.sessionId),
    onError);
  var playpauseresume = document.getElementById("playpauseresume");
  playpauseresume.innerHTML = 'Play';
  appendMessage("media stopped");
  clearTimer();
}

/**
 * set media volume
 * @param {Number} level A number for volume level
 * @param {Boolean} mute A true/false for mute/unmute 
 */
function setMediaVolume(level, mute) {
  if( !currentMediaSession ) 
    return;

  var volume = new chrome.cast.Volume();
  volume.level = level;
  currentVolume = volume.level;
  volume.muted = mute;
  var request = new chrome.cast.media.VolumeRequest();
  request.volume = volume;
  currentMediaSession.setVolume(request,
    mediaCommandSuccessCallback.bind(this, 'media set-volume done'),
    onError);
}

/**
 * set receiver volume
 * @param {Number} level A number for volume level
 * @param {Boolean} mute A true/false for mute/unmute 
 */
function setReceiverVolume(level, mute) {
  if( !session ) 
    return;

  if( !mute ) {
    session.setReceiverVolumeLevel(level,
      mediaCommandSuccessCallback.bind(this, 'media set-volume done'),
      onError);
    currentVolume = level;
  }
  else {
    session.setReceiverMuted(true,
      mediaCommandSuccessCallback.bind(this, 'media set-volume done'),
      onError);
  }
}

/**
 * mute media
 * @param {DOM Object} cb A checkbox element
 */
function muteMedia(cb) {
  if( cb.checked == true ) {
    //document.getElementById('muteText').innerHTML = 'Unmute';
    //setMediaVolume(currentVolume, true);
    setReceiverVolume(currentVolume, true);
    appendMessage("media muted");
  }
  else {
    //document.getElementById('muteText').innerHTML = 'Mute';
    //setMediaVolume(currentVolume, false);
    setReceiverVolume(currentVolume, false);
    appendMessage("media unmuted");
  } 
}

/**
 * seek media position
 * @param {Number} pos A number to indicate percent
 */
function seekMedia(pos) {
  console.log('Seeking ' + currentMediaSession.sessionId + ':' +
    currentMediaSession.mediaSessionId + ' to ' + pos + "%");
  progressFlag = 0;
  var request = new chrome.cast.media.SeekRequest();
  request.currentTime = pos * currentMediaSession.media.duration / 100;
  currentMediaSession.seek(request,
    onSeekSuccess.bind(this, 'media seek done'),
    onError);
  createTimer();
}

/**
 * callback on success for media commands
 * @param {string} info A message string
 * @param {Object} e A non-null media object
 */
function onSeekSuccess(info) {
  console.log(info);
  appendMessage(info);
  setTimeout(function(){progressFlag = 1},1500);
}

/**
 * callback on success for media commands
 * @param {string} info A message string
 * @param {Object} e A non-null media object
 */
function mediaCommandSuccessCallback(info) {
  console.log(info);
  appendMessage(info);
}


/**
 * append message to debug message window
 * @param {string} message A message string
 */
function appendMessage(message) {
  var dw = document.getElementById("debugmessage");
  dw.innerHTML += '\n' + JSON.stringify(message);
};

