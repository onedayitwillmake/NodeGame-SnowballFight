/**
 * AudioManager.js
 *
 * @author michael.paige@ogilvy.com
 * @description Initializes and plays audio files
 *
 */
define(function() {
    return {
        playSound: function() {

        }
    }; //return
});

function AudioManager() {
}

EventDispatcher.create(AudioManager);

AudioManager.PRELOAD_SETTING = "auto";
AudioManager.INTRO = "intro";
AudioManager.MUSIC = "music";
AudioManager.DEFEAT = "defeat";
AudioManager.VICTORY = "victory";
AudioManager.CANNON_FIRE = "cannon";
AudioManager.CANNON_IMPACT = "cannonImpact";
AudioManager.CANNON_ADDED = "cannonAdded";
AudioManager.SHOOTER_FIRE = "shooter";
AudioManager.SHOOTER_ADDED = "shooterAdded";
AudioManager.SABRE_FIRE = "sabre";
AudioManager.SABRE_ADDED = "sabreAdded";
AudioManager.CABIN_BOY_FIRE = "cabinBoy";
AudioManager.CABIN_BOY_ADDED = "cabinBoyAdded";
AudioManager.CAPTAIN_ADDED = "captainAdded";
AudioManager.CAPTAIN_AHOY = "captainAhoy";
AudioManager.CAPTAIN_ARGH = "captainArgh";
AudioManager.RAT_HURT = "ratHurt";
AudioManager.CRAB_HURT = "crabHurt";
AudioManager.OCTOPUS_HURT = "octopusHurt";
AudioManager.GULL_HURT = "gullHurt";
AudioManager.KRAKEN_HURT = "krakenHurt";
AudioManager.KRAKEN_DEATH = "krakenDeath";
AudioManager.PLACE_TOWER = "placeTower";
AudioManager.UPGRADE = "upgrade";
AudioManager.RETIRE = "retire";
AudioManager.STEAL_DAISY = "stealDaisy";
AudioManager.CLICK = "click";
AudioManager.DAISY_LOST = "daisyLost";
AudioManager.KRAKEN_MUSIC = "krakenMusic";
AudioManager.THUNDER1 = "thunder1";
AudioManager.THUNDER2 = "thunder2";

AudioManager.playSoundDelayed = function(c, e) {
    if (e == null)e = 0;
    setTimeout(function() {
        AudioManager.playSound(c)
    }, e)
};

AudioManager.mute = function(c) {
    AudioManager.muted = c;
    $("audio").each(function(e, b) {
        b.volume = c ? 0 : 1
    })
};

AudioManager.playSound = function(c, e) {
    for (var b,a = 1; a <= 10; a++) {
        var f = $("#" + (c + "_" + a)).get(0);
        if (f == null)break;
        if (f.currentTime == 0 || f.duration - f.currentTime < 0.25) {
            b = f;
            break
        }
    }
    if (b == null)b = $("#" + c + "_1").get(0);
    if (b != null) {
        try {
            b.currentTime = 0
        } catch(h) {
        }
        b.loop = e;
        b.play()
    }
    return b;
};

AudioManager.pauseSound = function(c) {
    for (var e = 1; e <= 10; e++) {
        var b = $("#" + (c + "_" + e));
        if (b != undefined)b.get(0).pause(); else break
    }
};

AudioManager.stopAllSounds = function() {
    $.each($("audio"), function(c, e) {
        var b = $(e).get(0);
        try {
            b.pause();
            b.currentTime = 0
        } catch(a) {
        }
    })
};