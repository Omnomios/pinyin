var app = {
    /*rootPath: "",*/
    rootPath: "/android_asset/www/",

    wordAudio:{},

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

        parentThis.nextWord();

        $("div.slide").click(app.clickRate);
        $("div.guide").click(function(){
            clearTimeout(parentThis.timer.hintfade);
            $(this).html("");
            $(this).css("opacity",0);
            $(this).hide();
        });
    },

    nextWord: function(){

        this.consonate = this.pickConsonate()
        this.vowel = pickRandomProperty(pinyinTable.consonate[this.consonate].words);

        //Update screen
        this.render();
    },

    pickConsonate: function()
    {
        var consonateObject = this.consonateRatings.get();
        var consonateByFactor = {};
        for(var i in consonateObject)
        {
            if(typeof consonateByFactor[consonateObject[i].f] == "undefined")
                consonateByFactor[consonateObject[i].f] = Array();
            consonateByFactor[consonateObject[i].f].push(i);
        }
        consonateByFactor = sortObjectByKey(consonateByFactor);

        var minAge = 86400000;

        //Pick a consonate
        while(true)
        {
            for(var i in consonateByFactor)
            {
                for(var ci in consonateByFactor[i])
                {
                    var candidate = consonateByFactor[i][ci];

                    if(consonateObject[candidate].t + minAge < Date.now())
                    {
                        return candidate;
                    }
                }
            }

            if(minAge < 60000)
                break;

            minAge *= 0.5;
        }

        //Still nothing? Pick one at random.
        return pickRandomProperty(pinyinTable.consonate);
    },

    pickVowel: function(consonate)
    {
        var vowelObject     = this.vowelRatings.get();
        var vowelByFactor     = {};
        for(var i in vowelObject)
        {
            if(typeof vowelByFactor[vowelObject[i].f] == "undefined")
                vowelByFactor[vowelObject[i].f] = Array();
            vowelByFactor[vowelObject[i].f] = i;
        }
        vowelByFactor = sortObjectByKey(vowelByFactor);
    },

    wordSound: function(){
        $("div.word > div.sound").addClass("pulse");
        this.wordAudio.play();
    },

    consonateHint: function(){
        $("div.guide").html(pinyinTable.consonate[this.consonate].guide);
        $("div.guide").css("opacity", 1);
        $("div.guide").show();
        clearTimeout(this.timer.hintfade);
        this.timer.hintfade = setTimeout(function(){
            $("div.guide").animate({opacity:0},500,"swing",function(){$(this).html("").hide();});
        },5000);
    },

    vowelHint: function(){
        $("div.guide").html(pinyinTable.vowels[this.vowel]);
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

        $("div.ratemark label").html(Math.round((factor*6)-3,0));
        $("div.ratemark").addClass("float");
        $("div.ratemark").css("left", $(this).width()*factor);
        setTimeout(function(){$("div.ratemark").removeClass("float")}, 1000);

        app.rate(factor-0.5);
        app.nextWord();
    },

    consonateRatings:
    {
        get:function()
        {
            var consonateJSON = window.localStorage.getItem("consonant");
            if(consonateJSON != null)
                var consonateObject = JSON.parse(consonateJSON);
            else
            {
                var consonateObject = {};
                for( var i in pinyinTable.consonate )
                {
                    consonateObject[i] = {f:0.5, t: Date.now()};
                }
            }
            return consonateObject;
        },

        set:function(consonateObject)
        {
            window.localStorage.setItem("consonant", JSON.stringify(consonateObject));
        }
    },

    vowelRatings:
    {
        get:function()
        {
            var vowelJSON = window.localStorage.getItem("vowel");

            if(vowelJSON != null)
                var vowelObject = JSON.parse(vowelJSON);
            else
            {
                var vowelObject = {};
                for( var i in pinyinTable.vowels )
                    vowelObject[i] = {f:0.5, t: Date.now()};
            }
            return vowelObject;
        },
        set:function(vowelObject)
        {
            window.localStorage.setItem("vowel", JSON.stringify(vowelObject));
        }
    },

    rate: function(factor)
    {
        var consonateObject = this.consonateRatings.get();
        var vowelObject     = this.vowelRatings.get();

        consonateObject[this.consonate].f += factor;
        consonateObject[this.consonate].t = Date.now();
        consonateObject[this.consonate].f.clamp(0, 1);

        vowelObject[this.vowel].f += factor;
        vowelObject[this.vowel].t = Date.now();
        vowelObject[this.vowel].f.clamp(0, 1);

        this.consonateRatings.set(consonateObject);
        this.vowelRatings.set(vowelObject);
    },

    changeTone: function(tone){
        this.tone = tone;
        this.render();
    },

    render: function(){
        var displayword = pinyinTable.consonate[this.consonate].words[this.vowel];
        var soundword = displayword.replace("ü","v");
        var audiopath = this.rootPath+"sound/"+this.consonate.replace(" ","none")+"/"+this.vowel.replace("ü","v")+"/"+soundword+this.tone+".ogg";

        if(typeof this.wordAudio.release == "function")
            this.wordAudio.release();

        if(typeof Media != "undefined")
        {
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
        }

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
