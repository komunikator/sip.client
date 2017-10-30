// обработка tracking
window.onload = function() {
  var video = document.getElementById('video');
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');
  
  video.playbackRate = 2;

  var tracker = new tracking.ObjectTracker('face');
  tracker.setInitialScale(0.5);
  tracker.setStepSize(1);
  tracker.setEdgesDensity(0.1);

  tracking.track('#video', tracker, { camera: true });

  tracker.on('track', function(event) {
  context.clearRect(0, 0, canvas.width, canvas.height);

    event.data.forEach(function(rect) {
      context.strokeStyle = '#FF00ED';
      context.strokeRect(rect.x, rect.y, rect.width, rect.height);
       // координата - в середину рамки лица
      var eyeX = (videoWidth - rect.x) - (rect.width / 2);
      var eyeY = rect.y + rect.height / 2;
      var eyeZ = rect.width;
      setTimeout(eyesmove(eyeX, eyeY, eyeZ), 000);
      // губы
      //mouthmove();
    });
  });
};