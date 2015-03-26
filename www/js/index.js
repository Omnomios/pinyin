/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {

    wordAudio:{},
    pinyinTable:{},

    consonate:"t",
    vowel:"a",
    tone:1,

    timer: {hintfade:0},

    // Application Constructor
    initialize: function() {
        var parentThis = this;

        this.bindEvents();

        $.ajax({
            url:"pinyinTable.json",
            type: "GET",
            dataType: "json"
        }).done(function(result){
            parentThis.pinyinTable = result;
            parentThis.nextWord();
        });

        $("div.slide").click(this.clickRate);
        $("div.guide").click(function(){
            clearTimeout(parentThis.timer.hintfade);
            $(this).html("");
            $(this).css("opacity",0);
            $(this).hide();
        });

        setupScale(360);
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
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
        this.consonate = this.pickRandomProperty(this.pinyinTable.consonate);
        this.vowel = this.pickRandomProperty(this.pinyinTable.consonate[this.consonate].words);

        this.render();
    },

    wordSound: function(){
        $("div.word").addClass("pulse");
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

        app.nextWord();
    },

    changeTone: function(tone){
        this.tone = tone;
        this.render();
    },

    render: function(){

        var soundword = this.pinyinTable.consonate[this.consonate].words[this.vowel];
        this.wordAudio = new Audio("sound/"+this.consonate.replace(" ","none")+"/"+this.vowel+"/"+soundword+this.tone+".mp3", function(){});

        //Autoload file.
        this.wordAudio.addEventListener("ended", function()
        {
            $("div.word").removeClass("pulse");
        });

        $("div.guide").html("");
        $("div.guide").css("opacity", 0);
        $("div.guide").hide();

        $("div.consonate").html(this.consonate);
        $("div.vowel").html(this.vowel);

        var word = this.addtone(soundword, this.tone);

        $("div.word").html(word);
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


function setupScale (minWidth) {
    var viewWidth = Math.max(document.documentElement.clientWidth, window.innerWidth);
    var viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
    var portWidth = Math.min(viewWidth, viewHeight);
    var landWidth = Math.max(viewWidth, viewHeight);
    var fixScale = function () {
        if (Math.abs(window.orientation) != 90) {
            // portrait
            document.body.style.zoom = portWidth / minWidth;
        } else if (landWidth < minWidth) {
            // landscape, but < minWidth
            document.body.style.zoom = landWidth / minWidth;
        } else {
            // landscape >= minWidth. Turn off zoom.
            // This will make things "larger" in landscape.
            document.body.style.zoom = 1;
        }
    };

    if (gPortWidth >= minWidth) {
        return;     // device is greater than minWidth even in portrait.
    }
    fixScale();                             // fix the current scale.
    window.onorientationchange = fixScale;  // and when orientation is changed
}
