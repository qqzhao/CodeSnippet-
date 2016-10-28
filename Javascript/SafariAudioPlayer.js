var SafariAudioPlayer = (function() {
    var SOUNDS = [];

    var isIOS = navigator.userAgent.indexOf('iPhone') > 0;
    var isAndroid = navigator.userAgent.indexOf('Android') > 0;
    if (isAndroid) {
      // if(typeof mylog === 'function')mylog('andorid init safariaudio return..');
      return{};
    }
    var myAudioContext, myAudioAnalyser,
        myBuffers = {},
        mySource,
        myNodes = {},
        mySpectrum,
        isPlaying = false;

    /**
     * 如果其他浏览器进行WebAudio的话，这里状态就可能变成interrupted。这里进行恢复。
     * @type {[type]}
     */
    setInterval(function() {
      if (myAudioContext.state === 'interrupted') {
        myAudioContext.resume();
      }
    }, 3000);

    var init = function init(audioPath) {
        if (typeof myAudioContext === 'undefined') {
          /**
           * 下面这些初始化代码放到了开头，因为这些不能初始化多次。会产生 ‘unavailable for AudioContext construction’错误
           * @type {webkitAudioContext}
           */
          var AudioContextG = window.AudioContext || window.webkitAudioContext;
          myAudioContext = new AudioContextG();
          // an analyser is used for the spectrum
          myAudioAnalyser = myAudioContext.createAnalyser();
          myAudioAnalyser.smoothingTimeConstant = 0.85;
          myAudioAnalyser.connect(myAudioContext.destination);
        }
        SOUNDS = [audioPath];
        // if ('webkitAudioContext' in window) {
            fetchSounds();
        // }
    }

    /**
     * 这里获取音频文件后，再进行直接播放，有问题，没有声音。所以，这里使用myBuffers字典进行缓存。
     * @param  {Function} callback [description]
     * @return {[type]}            [description]
     */
    function fetchSounds(callback) {
        var request = new XMLHttpRequest();
        // the underscore prefix is a common naming convention
        // to remind us that the variable is developer-supplied
        request._soundName = SOUNDS[0];
        request.open('GET', SOUNDS[0], true);
        request.setRequestHeader('Access-Control-Allow-Headers', '*');
        // request.setRequestHeader('Content-type', 'application/ecmascript');
        request.setRequestHeader('Access-Control-Allow-Origin', '*');
        request.setRequestHeader('Access-Control-Allow-Methods', 'GET');
        request.responseType = 'arraybuffer';
        request.addEventListener('load', function(event) {
            var request = event.target;
            var buffer = myAudioContext.createBuffer(request.response, false);
            myBuffers[SOUNDS[0]] = buffer;
            if (typeof callback === 'function') {
                callback();
            };
        }, false);
        request.send();
    }

    // function bufferSound(event) {
    //     var request = event.target;
    //     var buffer = myAudioContext.createBuffer(request.response, false);
    //     myBuffers[0] = buffer;
    // }

    /**
     * 播放前对buffer的connect操作。
     * @param  {[type]} source [description]
     * @return {[type]}        [description]
     */
    function routeSound(source) {
        myNodes.filter = myAudioContext.createBiquadFilter();
        myNodes.panner = myAudioContext.createPanner();
        myNodes.volume = myAudioContext.createGainNode();
        // var compressor = myAudioContext.createDynamicsCompressor();

        // set node values to current slider values
        var highpass = 512
        var panX = 0
        var volume = 1

        myNodes.filter.type = 1; // highpass
        myNodes.filter.frequency.value = highpass;
        myNodes.panner.setPosition(panX, 0, 0);
        myNodes.volume.gain.value = volume;

        // pass source through series of nodes
        source.connect(myNodes.filter);
        myNodes.filter.connect(myNodes.panner);
        myNodes.panner.connect(myNodes.volume);
        myNodes.volume.connect(myAudioAnalyser);

        return source;
    }

    /**
     * 播放已经缓存的url，否则进行缓存。
     * @param  {[type]} url [description]
     * @return {[type]}     [description]
     */
    var playSound = function playSound(url) {
        // create a new AudioBufferSourceNode
        var currentBuf = myBuffers[url];
        if (currentBuf) {
            pauseSound(); //先暂停之前的。
            try {
              var source = myAudioContext.createBufferSource();
              source.buffer = currentBuf;
              source.loop = false;
              source = routeSound(source);
              source.noteOn(0);
            } catch (e) {
              console.log('error:',e);
            }

            mySource = source;
        } else {
            init(url);
            fetchSounds();
        }
    }

    var pauseSound = function pauseSound() {
        if (mySource) {
          var source = mySource;
          source.noteOff(0);
          clearInterval(mySpectrum);
        }
    }

    /**
     * 这个函数暂时没有使用。
     * @param  {[type]} button [description]
     * @return {[type]}        [description]
     */
    var toggleSound = function toggleSound(button) {
        if (!isPlaying) {
            playSound();
            button.value = "Pause sound";
            isPlaying = true;
        } else {
            pauseSound();
            button.value = "Play random sound";
            isPlaying = false;
        }
    }

    return {
        init: init,
        playSound: playSound,
        pauseSound: pauseSound,
        toggleSound: toggleSound,
        myAudioContext:myAudioContext
    }
})();
