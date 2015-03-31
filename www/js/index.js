var app = {

    /*rootPath: "",*/
    rootPath: "/android_asset/www/",

    wordAudio:{},
    pinyinTable:{},

    consonate:"",
    vowel:"",
    tone:1,

    timer: {hintfade:0},

    // Application Constructor
    initialize: function() {
        var parentThis = this;
        this.bindEvents();
    },

    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },

    onDeviceReady: function() {
        var parentThis = app;
        $.ajax({
            url: parentThis.rootPath + "pinyinTable.json",
            type: "GET",
            dataType: "json"
        }).done(function(result){
            parentThis.pinyinTable = result;
            parentThis.nextWord();
        });

        $("div.slide").click(app.clickRate);
        $("div.guide").click(function(){
            clearTimeout(parentThis.timer.hintfade);
            $(this).html("");
            $(this).css("opacity",0);
            $(this).hide();
        });
    },

    pickRandomProperty:function(obj) {
        var result;
        var count = 0;
        for (var prop in obj)
            if (Math.random() < 1/++count)
                result = prop;
        return result;
    },

    nextWord: function(){

        //Find Consonaote
        this.consonate = this.pickRandomProperty(this.pinyinTable.consonate);

        //Find Vowel
        this.vowel = this.pickRandomProperty(this.pinyinTable.consonate[this.consonate].words);

        //Update screen
        this.render();
    },

    wordSound: function(){
        $("div.word > div.sound").addClass("pulse");
        this.wordAudio.play();
    },

    consonateHint: function(){
        $("div.guide").html(this.pinyinTable.consonate[this.consonate].guide);
        $("div.guide").css("opacity", 1);
        $("div.guide").show();
        clearTimeout(this.timer.hintfade);
        this.timer.hintfade = setTimeout(function(){
            $("div.guide").animate({opacity:0},500,"swing",function(){$(this).html("").hide();});
        },5000);
    },

    vowelHint: function(){
        $("div.guide").html(this.pinyinTable.vowels[this.vowel]);
        $("div.guide").css("opacity", 1);
        $("div.guide").show();
        clearTimeout(this.timer.hintfade);
        this.timer.hintfade = setTimeout(function(){
            $("div.guide").animate({opacity:0},500,"swing",function(){$(this).html("").hide();});
        },5000);
    },

    clickRate: function(event){
        var posX = $(this).position().left,
            posY = $(this).position().top,
            width = $(this).width();
        var factor = (event.pageX-posX)/width;

        app.rate(factor-0.5);
        app.nextWord();
    },

    rate: function(factor)
    {
        var consonateJSON = window.localStorage.getItem("consonant");
        var vowelJSON      = window.localStorage.getItem("vowel");

        if(consonateJSON != null)
            var consonateObject = JSON.parse(consonateJSON);
        else
        {
            var consonateObject = {};
            for( var i in this.pinyinTable.consonate )
                consonateObject[i] = {f:0, t:Date.now()};
        }

        if(vowelJSON != null)
            var vowelObject = JSON.parse(vowelJSON);
        else
        {
            //buildbase
            var vowelObject = {};
            for( var i in this.pinyinTable.vowels )
                vowelObject[i] = {f:0, t:Date.now()};
        }

        consonateObject[this.consonate].f += factor;
        consonateObject[this.consonate].t += Date.now();

        vowelObject[this.vowel].f += factor;
        vowelObject[this.vowel].t += Date.now();

        window.localStorage.setItem("consonant",JSON.stringify(consonateObject));
        window.localStorage.setItem("vowel",    JSON.stringify(vowelObject));
    },

    changeTone: function(tone){
        this.tone = tone;
        this.render();
    },

    render: function(){
        var displayword = this.pinyinTable.consonate[this.consonate].words[this.vowel];
        var soundword = displayword.replace("ü","v");
        var audiopath = this.rootPath+"sound/"+this.consonate.replace(" ","none")+"/"+this.vowel.replace("ü","v")+"/"+soundword+this.tone+".ogg";

        if(typeof this.wordAudio.release == "function")
            this.wordAudio.release();

        this.wordAudio = new Media(audiopath, function(){
            $("div.word > div.sound").removeClass("pulse");
        }, function(error){
            switch(error.code)
            {
                case MediaError.MEDIA_ERR_ABORTED:
                    alert("Error playing audio: aborted");
                break;

                case MediaError.MEDIA_ERR_NETWORK:
                    alert("Error playing audio: network failure.");
                break;

                case MediaError.MEDIA_ERR_DECODE:
                    alert("Error playing audio: could not decode.");
                break;

                case MediaError.MEDIA_ERR_NONE_SUPPORTED:
                    alert("Error playing audio: no audio device found.");
                break;
            }
        });

        $("div.guide").html("");
        $("div.guide").css("opacity", 0);
        $("div.guide").hide();

        $("div.consonate > span").html(this.consonate);
        $("div.vowel > span").html(this.vowel);

        var word = this.addtone(displayword, this.tone);
        $("div.word > div.sound").removeClass("pulse");
        $("div.word > span").html(word);
    },

    addtone: function(word, tone){

        function setCharAt(str,index,chr) {
            if(index > str.length-1) return str;
            return str.substr(0,index) + chr + str.substr(index+1);
        }

        var vowels = new Array ("a","e","i","o","u","ü");
        var tones = [["ā","ē","ī","ō","ū","ǖ"],
                     ["á","é","í","ó","ú","ǘ"],
                     ["ǎ","ě","ǐ","ǒ","ǔ","ǚ"],
                     ["à","è","ì","ò","ù","ǜ"]];

        if(word.indexOf("a") != -1)
            return word.replace("a",tones[tone-1][0]);

        if(word.indexOf("e") != -1)
            return word.replace("e",tones[tone-1][1]);

        if(word.indexOf("ou") != -1)
            return word.replace("o",tones[tone-1][3]);

        if(word.match(/[aeiou]/gi).length == 1)
        {
            for(i in vowels)
            {
                word = word.replace(vowels[i], tones[tone-1][i]);
            }
            return word;
        }

        if(word.match(/[aeiou]/gi).length > 1)
        {
            for(var i = word.length; i > 0; i--)
            {
                var char = word.substr(i-1,1);
                if(char.match(/[aeiou]/gi).length == 1)
                {
                    var tonepoint = vowels.indexOf(char);
                    word = setCharAt(word,i-1,tones[tone-1][tonepoint]);
                    return word;
                }
            }
        }

        return word;
    }
};
