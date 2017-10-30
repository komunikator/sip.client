// video-size
videoHeight = 60;
videoWidth = 80;
document.getElementById('video').height = videoHeight;
document.getElementById('video').width = videoWidth;
document.getElementById('canvas').height = videoHeight;
document.getElementById('canvas').width = videoWidth;

// Default imgs
var faceimg = "img/face.png";
var eyeimg = "img/eye.png";

// дефолтные размеры размера экрана
var defHeight = 2048;
var defWidth = 1536;

function getNewFaceSizes() {
    //размер экрана
    fullWidth = document.documentElement.clientWidth;
    fullHeight = fullWidth * (defHeight / defWidth);

    // дефолтная позиция глаз
    leftEyeXdefault = fullWidth * 400 / defWidth;
    rightEyeXdefault = fullWidth * 1010 / defWidth;
    leftEyeYdefault = fullHeight * 397 / defHeight;
    rightEyeYdefault = fullHeight * 397 / defHeight;

    // ширина зрачка с подложкой
    eyesWidth = fullWidth * 159 / defWidth;

    // размер отверстия для зрачков
    eyeHoleWidth = fullWidth * 264 / defWidth;
    eyeHoleHeight = fullHeight * 186 / defHeight;

    //максимальные движения глаз
    // левый
    minLeftEyeX = fullWidth * 337 / defWidth;
    maxLeftEyeX = fullWidth * 510 / defWidth;
    minLeftEyeY = fullHeight * 357 / defHeight;
    maxLeftEyeY = fullHeight * 447 / defHeight;
    //правый
    minRightEyeX = fullWidth * 969 / defWidth;
    maxRightEyeX = fullWidth * 1159 / defWidth;
    minRightEyeY = fullHeight * 337 / defHeight;
    maxRightEyeY = fullHeight * 447 / defHeight;

    // коксоглазие (мин и макс ширина рамки с которого начинается скашивание)
    squintMin = fullWidth * (videoHeight / 3);
    squintMax = fullWidth * (videoWidth / 3);

    // рамка видео
    frameWidth = videoWidth;
    frameHeight = videoHeight;
    
    console.log(fullWidth);
}
// Internal
var jseyeso = null,
    jseye1 = null,
    jseye2 = null;
var standardbody = (document.compatMode == "CSS1Compat") ? document.documentElement : document.body; //create reference to common "body" across doctypes

// General utils

// Find object by name or id

function eyesobj(id) {
    var i, x;
    x = document[id];
    if (!x && document.getElementById) x = document.getElementById(id);
    for (i = 0; !x && i < document.forms.length; i++) x = document.forms[i][id];
    return (x);
}


// Move eyes

function eyesmove(x, y, z) {
    x = x - frameWidth / 2;
    if (x > frameWidth / 2) x = frameWidth / 2;
    leftEyeX = x / (frameWidth / 2) / 2 * (eyeHoleWidth / 2) + leftEyeXdefault;
    rightEyeX = x / (frameWidth / 2) / 2 * (eyeHoleWidth / 2) + rightEyeXdefault;

    y = y - frameHeight / 2;
    if (y > frameHeight / 2) y = frameHeight / 2;
    leftEyeY = y / (frameHeight / 2) / 2 * (eyeHoleHeight / 2) + leftEyeYdefault;
    rightEyeY = y / (frameHeight / 2) / 2 * (eyeHoleHeight / 2) + rightEyeYdefault;

    // косоглазие
    /*
    if (z > 120 && x >= frameWidth*0,4 && x <= frameWidth*0,6){
        var squint = (z-squintMin)/(squintMax-squintMin);
        leftEyeX += (maxLeftEyeX-leftEyeX)*squint;
        rightEyeX -= (rightEyeX-minRightEyeX)*squint;
    }
    */

    // ограничения по движению глаз
    if (leftEyeX > maxLeftEyeX) leftEyeX = maxLeftEyeX;
    if (leftEyeX < minLeftEyeX) leftEyeX = minLeftEyeX;
    if (leftEyeY > maxLeftEyeY) leftEyeY = maxLeftEyeY;
    if (leftEyeY < minLeftEyeY) leftEyeY = minLeftEyeY;
    if (rightEyeX > maxRightEyeX) rightEyeX = maxRightEyeX;
    if (rightEyeX < minRightEyeX) rightEyeX = minRightEyeX;
    if (rightEyeY > maxRightEyeY) rightEyeY = maxRightEyeY;
    if (rightEyeY < minRightEyeY) rightEyeY = minRightEyeY;

    // перерисовка глаз
    leftEye.style.left = leftEyeX + 'px';
    leftEye.style.top = leftEyeY + 'px';
    rightEye.style.left = rightEyeX + 'px';
    rightEye.style.top = rightEyeY + 'px';
};

// Main

function eyes() {
    getNewFaceSizes();
    var face;
    var x, y, a = false;

    if (arguments.length == 2) {
        x = arguments[0];
        y = arguments[1];
        a = true;
    }
    face =
    // eyes layer
    "<div id='eyesLayer' style='position:" +
        (a ? "absolute; left:" + x + "; top:" + y : "relative") +
        "; z-index:-1; width:" + fullWidth + "; height:auto'>" +
    // left eye
    "<div id='leftEye' style='position:absolute; left:" + leftEyeXdefault + "px; top:" + leftEyeYdefault + "px; width: " + eyesWidth + "px; height:auto'>" +
        "<img src='" + eyeimg + "' width=" + eyesWidth + "px height=auto>" +
        "</div>" +
    //right eye
    "<div id='rightEye' style='position:absolute; left:" + rightEyeXdefault + "px; top:" + rightEyeYdefault + "px; width:" + eyesWidth + "px; height:auto'>" +
        "<img src='" + eyeimg + "' width=" + eyesWidth + "px height=auto>" +
        "</div>" +
        "</div>" +
    // face
    "<img src='" + faceimg + "' width=" + fullWidth + "px;>";
    document.write(face);
    eyeso = eyesobj('eyesLayer');
    leftEye = eyesobj('leftEye');
    rightEye = eyesobj('rightEye');

    document.onmousemove = eyesmousemove;
}


// Mouse move events

function eyesmousemove(e) {
    var mousex = (e) ? e.pageX : event.clientX + standardbody.scrollLeft
    var mousey = (e) ? e.pageY : event.clientY + standardbody.scrollTop
    eyesmove(mousex, mousey, 0);
}
