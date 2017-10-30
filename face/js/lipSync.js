lipsContainer = document.getElementById("mouth");

fullWidth = fullWidth; // ширина экрана, берется из eyes
//дефолтное расположение и ширина картинок/вся ширина
lipsContainer.style.left = 484 / 1920 * fullWidth + "px";
//lipsContainer.style.top = 750 / 1920 * fullWidth + "px";
lipsContainer.style.top = "500px";
lipsContainer.style.width = 950 / 1920 * fullWidth + "px";

showTime = 200;

lipsHappy = {
    "а": {
        "img": "v2.png",
        "showTime": showTime,
    },
    "б": {
        "img": "h4.png",
        "showTime": showTime,
    },
    "в": {
        "img": "h4.png",
        "showTime": showTime,
    },
    "г": {
        "img": "h3.png",
        "showTime": showTime,
    },
    "д": {
        "img": "h2.png",
        "showTime": showTime,
    },
    "е": {
        "img": "h2.png",
        "showTime": showTime,
    },
    "ё": {
        "img": "v3.png",
        "showTime": showTime,
    },
    "ж": {
        "img": "h3.png",
        "showTime": showTime,
    },
    "з": {
        "img": "h1.png",
        "showTime": showTime,
    },
    "и": {
        "img": "h1.png",
        "showTime": showTime,
    },
    "й": {
        "img": "h1.png",
        "showTime": showTime,
    },
    "к": {
        "img": "h1.png",
        "showTime": showTime,
    },
    "л": {
        "img": "h3.png",
        "showTime": showTime,
    },
    "м": {
        "img": "h4.png",
        "showTime": showTime,
    },
    "н": {
        "img": "h3.png",
        "showTime": showTime,
    },
    "о": {
        "img": "v3.png",
        "showTime": showTime,
    },
    "п": {
        "img": "h3.png",
        "showTime": showTime,
    },
    "р": {
        "img": "h1.png",
        "showTime": showTime,
    },
    "с": {
        "img": "h3.png",
        "showTime": showTime,
    },
    "т": {
        "img": "h3.png",
        "showTime": showTime,
    },
    "у": {
        "img": "v1.png",
        "showTime": showTime,
    },
    "ф": {
        "img": "h3.png",
        "showTime": showTime,
    },
    "х": {
        "img": "h2.png",
        "showTime": showTime,
    },
    "ц": {
        "img": "h1.png",
        "showTime": showTime,
    },
    "ч": {
        "img": "h3.png",
        "showTime": showTime,
    },
    "ш": {
        "img": "h3.png",
        "showTime": showTime,
    },
    "щ": {
        "img": "h3.png",
        "showTime": showTime,
    },
    "ъ": {
        "img": "h4.png",
        "showTime": showTime,
    },
    "ы": {
        "img": "h1.png",
        "showTime": showTime,
    },
    "ъ": {
        "img": "h4.png",
        "showTime": showTime,
    },
    "э": {
        "img": "h2.png",
        "showTime": showTime,
    },
    "ю": {
        "img": "v1.png",
        "showTime": showTime,
    },
    "я": {
        "img": "h2.png",
        "showTime": showTime,
    },
    " ": {
        "img": "h4.png",
        "showTime": showTime,
    },
};

lipsSad = {
    "а": {
        "img": "v2.png",
        "showTime": showTime,
    },
    "б": {
        "img": "s4.png",
        "showTime": showTime,
    },
    "в": {
        "img": "h4.png",
        "showTime": showTime,
    },
    "г": {
        "img": "s2.png",
        "showTime": showTime,
    },
    "д": {
        "img": "s3.png",
        "showTime": showTime,
    },
    "е": {
        "img": "s1.png",
        "showTime": showTime,
    },
    "ё": {
        "img": "v3.png",
        "showTime": showTime,
    },
    "ж": {
        "img": "s2.png",
        "showTime": showTime,
    },
    "з": {
        "img": "s3.png",
        "showTime": showTime,
    },
    "и": {
        "img": "s1.png",
        "showTime": showTime,
    },
    "й": {
        "img": "s1.png",
        "showTime": showTime,
    },
    "к": {
        "img": "s2.png",
        "showTime": showTime,
    },
    "л": {
        "img": "s3.png",
        "showTime": showTime,
    },
    "м": {
        "img": "s4.png",
        "showTime": showTime,
    },
    "н": {
        "img": "s3.png",
        "showTime": showTime,
    },
    "о": {
        "img": "v3.png",
        "showTime": showTime,
    },
    "п": {
        "img": "s3.png",
        "showTime": showTime,
    },
    "р": {
        "img": "s1.png",
        "showTime": showTime,
    },
    "с": {
        "img": "s2.png",
        "showTime": showTime,
    },
    "т": {
        "img": "s2.png",
        "showTime": showTime,
    },
    "у": {
        "img": "v1.png",
        "showTime": showTime,
    },
    "ф": {
        "img": "s3.png",
        "showTime": showTime,
    },
    "х": {
        "img": "s1.png",
        "showTime": showTime,
    },
    "ц": {
        "img": "s2.png",
        "showTime": showTime,
    },
    "ч": {
        "img": "s3.png",
        "showTime": showTime,
    },
    "ш": {
        "img": "s2.png",
        "showTime": showTime,
    },
    "щ": {
        "img": "s2.png",
        "showTime": showTime,
    },
    "ъ": {
        "img": "s4.png",
        "showTime": showTime,
    },
    "ы": {
        "img": "s3.png",
        "showTime": showTime,
    },
    "ь": {
        "img": "s4.png",
        "showTime": showTime,
    },
    "э": {
        "img": "s1.png",
        "showTime": showTime,
    },
    "ю": {
        "img": "v1.png",
        "showTime": showTime,
    },
    "я": {
        "img": "s1.png",
        "showTime": showTime,
    },
    " ": {
        "img": "s4.png",
        "showTime": showTime,
    },
};

function lipSync(message, lips) {
    messageArr = message.toString().split("")
    i = 0;
    function fn() {
        if (i < messageArr.length) {
            i++;
            if (lips[messageArr[i-1]] == undefined) {
                lipsContainer.src = "img/h4.png";
                showTime = 100;
            }
            else {
                lipsContainer.src = "img/" + lips[messageArr[i-1]]["img"];
                showTime = lips[messageArr[i-1]]["showTime"];
            }
            setTimeout(fn, showTime);
        }
    }
    fn();
}


lipSync("привет ", lipsHappy);
// setInterval( ()=>{
//     lipSync("привет ", lipsHappy);
// }, 1000 );