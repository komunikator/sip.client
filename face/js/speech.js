/*
(function () {
    if (!console) {
        console = {};
    }
    var old = console.log;
    var logger = document.getElementById('log');
    console.log = function (message) {
        if (typeof message == 'object') {
            logger.innerHTML += (JSON && JSON.stringify ? JSON.stringify(message) : String(message)) + '<br />';
        } else {
            logger.innerHTML += message + '<br />';
        }
    }
})();
*/

var info_no_speech = 'Речь не была обнаружена. Вам, возможно, потребуется изменить настройки микрофона.';
var info_no_microphone = 'Микрофон не был найден. Убедитесь, что микрофон установлен и что настройки микрофона сделаны правильно.';
var info_allow = 'Нажмите кнопку "Разрешить", чтобы включить микрофон.';
var info_denied = 'Разрешение на использование микрофона было отклонено.';
var info_upgrade = 'Web Speech API не поддерживается в браузере. Обновите до Chrome версии 25 или более поздней.';

var final_transcript = '';
var recognizing = false; // признак того, что сейчас включено распознавание речи
var chating = false; // признак того, что сейчас идёт общение с чат-ботом
var stop = true; // флаг для отработки останова распознавания (true - остановить, false - запустить) изначально =true, т.к. при самом первом запуске сразу меняется значение переменной



// возврат даты и времени в привычном виде
function formatDate(date) {
    var dd = date.getDate();
    if (dd < 10) dd = '0' + dd;

    var mm = date.getMonth() + 1;
    if (mm < 10) mm = '0' + mm;

    var yy = date.getFullYear();

    var hh = date.getHours();
    if (hh < 10) hh = '0' + hh;

    var min = date.getMinutes();
    if (min < 10) min = '0' + min;

    var sec = date.getSeconds();
    if (sec < 10) sec = '0' + sec;

    var strData = dd + '.' + mm + '.' + yy + ' ' + hh + ':' + min + ':' + sec + '';

    return strData;
};



if (!('webkitSpeechRecognition' in window))
{
  upgrade();
} else {
  start_button.style.display = 'inline-block';

  var speak = new SpeechSynthesisUtterance();
  speak.text = '';
  speak.lang = 'ru-RU';
  speak.rate = 0.8; // от 0,1 до 10
  speak.pitch = 1; // от 0 до 2
  speak.volume = 1; // от 0 до 1

  var recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = 'ru-RU';

  startRecognize(); // запуск распознавания при загрузке страницы


  var interval = 40; // инттервал в секундах
  // останов и запуск распознавания каждые interval секунд
  setTimeout(function run() {
      if (recognizing && !chating)  // если включено распознавание и не включено общение с чат-ботом, останавливаем и снова запускаем распознавание (ввиду короткого интервала принятия голоса)
      {
        // console.log('timer');
        restartRecognize();
      }
      setTimeout(run, interval*1000);
  }, interval*1000);


  recognition.onstart = function()
  {
    console.log('распознавание включено...');

    recognizing = true;
    start_img.src = 'mic-animate.gif';
    // console.log('onStart. Recognizing: ', recognizing);
  };

  recognition.onerror = function(event)
  {
    if (event.error == 'no-speech') {
      start_img.src = 'mic.gif';
      showInfo(info_no_speech);
    }
    if (event.error == 'audio-capture') {
      start_img.src = 'mic.gif';
      showInfo(info_no_microphone);
    }

    if (event.error == 'not-allowed')
    {
      showInfo(info_denied);
    }
  };

  recognition.onend = function()
  {
    // console.log('onStop. Stop: ', stop);
    recognizing = false;
    if (stop)
    {
        // console.log('onStop. Recognizing_0: ', recognizing);
        console.log('...остановлено распознавание');
        start_img.src = 'mic.gif';
        return;
    };

    // console.log('onStop. Recognizing: ', recognizing);
    restartRecognize();
  };

  recognition.onresult = function(event)
  {
    var interim_transcript = '';
    for (var i = event.resultIndex; i < event.results.length; ++i)
    {
      if (event.results[i].isFinal)
      {
        final_transcript = event.results[i][0].transcript;
        console.log('final_transcript: ' + final_transcript);
      } // else {
        // interim_transcript = event.results[i][0].transcript;
        // console.log('interim_transcript: ', interim_transcript);
      // }
    }

    if( final_transcript.trim().toLowerCase() == 'привет' ) // удаляем пробелы, т.к. в конечный результат распознавания добавляются лидирующий и конечный пробелы
    {
        chating = true;
    }

    if( final_transcript.trim().toLowerCase() == 'стоп' ) // удаляем пробелы, т.к. в конечный результат распознавания добавляются лидирующий и конечный пробелы
    {
        stop = true;
        chating = false;
        recognition.stop();
    }

    if (chating) // если включено общение с чат-ботом, отсылаем ему запросы
    {
        // speakText(final_transcript); // озвучка распознанного текста

        var x = new XMLHttpRequest();
        // x.open("GET", "http://ec2-50-112-186-165.us-west-2.compute.amazonaws.com:9090/?id=12345&question=" + final_transcript.trim(), true);
        x.open("GET", "/?id=12345&question=" + final_transcript.trim(), true);
        x.onload = function (){
            var curAnswer = JSON.parse(x.responseText).current.dataQA.curAnswer; // выделяем ответ чат-бота из пришедшего объекта
            console.log(curAnswer);
            speakText(curAnswer); // озвучка ответа чат-бота
        }
        x.onerror = function() {
          console.log( 'Ошибка ' + this.status );
        }
        x.send(null);
    }

    if( final_transcript.trim().toLowerCase() == 'до свидания' ) // удаляем пробелы, т.к. в конечный результат распознавания добавляются лидирующий и конечный пробелы
    {
        chating = false;
    }

  };
}

speak.onstart = function(event)
  {
    console.log('начато проговаривание...');
    // console.log(event);
    // console.log(formatDate(new Date(event.elapsedTime)));
    // console.log(formatDate(new Date(event.timeStamp)));
    // console.log(event.target.text);
  };


speak.onend = function(event)
  {
    console.log('...закончено проговаривание');

    // после окончания проговаривания запускаем распознавание
    if (!recognizing)
    {
        stop = false;
        recognition.start();
    }
  };

function upgrade()
{
  start_button.style.visibility = 'hidden';
  showInfo(info_upgrade);
}

function restartRecognize()
{
    if (recognizing)
    {
        recognition.stop();
    } else {
                recognition.start();
           }
}

function startRecognize()
{
  stop = !stop;
  if (recognizing) {
    recognition.stop();
    return;
  }
  final_transcript = '';
  recognition.start();
  start_img.src = 'mic-slash.gif';
  showInfo(info_allow);
}

function showInfo(s)
{
    console.log(s);
}

function speakText (txt)
{
    // прежде чем проговаривать, останавливаем распознавание
    if (recognizing)
    {
        stop = true;
        recognition.stop();
    }
   // проговаривается то, что распознано
   speak.text = txt;
   speechSynthesis.speak(speak);
}
