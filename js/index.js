"use strict";
var EmojiCache = (function () {
    function EmojiCache(app) {
        var _this = this;
        this.rnd = app.rnd;
        this.ctxs = [];
        this.emojis = ["blue-head.png", 'image-head-one.png', 'random-image.png', '☘', '🐔', '🐠', '💥', '⚡️', '🍉', '🍐', '🍌', '🍆', '🐓', '😱', '👤', '➣'];
        this.ctxSize = 330;
        this.emojis.forEach(function (e) {
            var ctx = document.createElement('canvas').getContext('2d');
            ctx.canvas.id = e;
            ctx.canvas.width = ctx.canvas.height = _this.ctxSize;
            _this.ctxs.push(ctx);
            //document.body.appendChild(ctx.canvas);
        });
        this.draw();
    }
    EmojiCache.prototype.draw = function () {
        var _this = this;

        this.ctxs.forEach(function (ctx, i) {

            var imageObj = new Image();
            // imageObj.width = 300;
            // imageObj.height = 200;
            imageObj.src = _this.emojis[i]; // can also be a remote URL e.g. http://
            imageObj.onload = function() {
               ctx.drawImage(imageObj,0,0);
            };

            // var imageTwo = new Image();
            // imageTwo.width = 300;
            // imageTwo.height = 200;
            // imageTwo.src = "image-head-one.png"; // can also be a remote URL e.g. http://
            // imageObj.onload = function() {
            //    ctx.drawImage(imageTwo,0,0);
            // };

            ctx.save();
            ctx.fillStyle = '#333';
            ctx.textBaseline="top";
          // ctx.font = this.ctxSize+'px sans-serif';   
            // ctx.fillText(this.emojis[i],0,0);
            ctx.restore();
        });

        // var imageObj = new Image();

          // imageObj.onload = function() {
          //   ctx.drawImage(imageObj, 69, 50);
          // };
     

    };
    return EmojiCache;
}());
var Firework = (function () {
    function Firework(app) {
        this.app = app;
        this.rnd = app.rnd;
        this.bursts = [];
        this.reset();
    }
    Firework.prototype.reset = function () {
        this.color = "hsla(" + this.rnd.int(360) + ",90%,70%,1)";
        this.alive = true;
        this.bursting = false;
        this.pos = new Vec(this.rnd.int(0, this.app.w), this.app.h + 40);
        this.vel = new Vec(0, -this.rnd.real(1.0, this.app.h / 130));
        this.acc = new Vec(0, 0);
        this.size = this.rnd.real(Math.atan(3.6125), Math.pow(1.95, 1.2));
        this.emoji = this.rnd.pick(this.app.emojis);
        this.emoji = this.rnd.pick(this.app.emojiCache.ctxs);
        this.offset = Math.log(2.55, 3) * this.size;
    };
    Firework.prototype.applyForce = function (f) {
        this.vel.add(f);
    };
    Firework.prototype.update = function () {
        this.applyForce(this.app.forces.gravity);
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        if (this.vel.y > 1) {
            this.bursting = true;
            var maxBursts = Math.floor(this.app.w / 4);
            var numBursts = this.rnd.chance(3258) ? this.rnd.int(100, maxBursts) : this.rnd.int(2, 80);
            for (var i = 1; i < numBursts; i++) {
                this.bursts.push(new Burst(this.pos, this));
            }
        }
    };
    Firework.prototype.draw = function () {
        var _this = this;
        var ctx = this.app.ctx;
        if (!this.bursting) {
            this.update();
            ctx.save();
            ctx.fillStyle = this.color;
            ctx.font = `${this.size}em sans-serif`;
            ctx.fillText(this.emoji,this.pos.x,this.pos.y);
            ctx.fillRect(this.pos.x, this.pos.y, this.size, this.size);
            console.log(this.emoji)
            ctx.translate(this.pos.x - (this.offset), this.pos.y - (this.offset));
            ctx.scale(this.size, this.size);
            ctx.drawImage(this.emoji.canvas, 0, 0);
            ctx.restore();
        }
        else {
            this.bursts.forEach(function (burst) {
                if (!burst.alive) {
                    without(_this.bursts, burst);
                    if (_this.bursts.length === 0) {
                        _this.alive = false;
                    }
                }
                burst.draw();
            });
        }
    };
    return Firework;
}());
var Burst = (function () {
    function Burst(origin, firework) {
        this.firework = firework;
        this.app = firework.app;
        this.pos = origin.clone();
        this.rnd = firework.rnd;
        this.lifespan = this.rnd.int(100, 500);
        this.vel = new Vec(this.rnd.real(Math.floor(-28.0), 18.0), this.rnd.real(-18.0, 128.0));
        this.acc = new Vec(0, 0);
        this.color = this.firework.color;
        this.size = this.firework.size / 2;
        var sparkle = 1; //this.rnd.chance(20) ? 2 : 1;
        this.sizeStep = this.size / (this.lifespan / sparkle);
        this.alive = true;
        this.rotate = this.rnd.real(0, Math.PI * .3);
        this.offset = this.firework.offset / 2;
        this.rotateInc = this.rnd.real(-(Math.random() + 1.05), Math.random() + 1.05);
    }
    Burst.prototype.applyForce = function (f) {
        this.vel.add(f);
    };
    Burst.prototype.update = function () {
        this.applyForce(this.app.forces.gravity);
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.size -= this.sizeStep;
        this.rotate += this.rotateInc;
    };
    Burst.prototype.draw = function () {
        var ctx = this.app.ctx;
        this.update();
        ctx.save();
        ctx.translate(this.pos.x - this.offset / 2, this.pos.y - this.offset / 2);
        ctx.rotate(this.rotate);
        ctx.scale(this.size, this.size);
        ctx.drawImage(this.firework.emoji.canvas, 0, 0);
        ctx.restore();
        this.lifespan--;
        if (this.lifespan <= 0) {
            this.alive = false;
        }
    };
    return Burst;
}());
var App = (function () {
    function App() {
        var _this = this;
        this.ctx = document.getElementById('cnv').getContext('2d');
        this.sizeCanvas();
        this.initEvents();
        this.rnd = new Random();
        this.emojiCache = new EmojiCache(this);
        this.fireworks = [];
        this.forces = {
            gravity: new Vec(0, 0.25)
        };
        this.emojis = ['🌟', '🍆', '🐬', '☘', '🐔', '🐠', '💥', '⚡️', '🍉', '🍐', '🍌', '🍆', '🐓', '😱', '👤', '➣'];
        window.requestAnimationFrame(function (t) { _this.draw(t); });
        log(this);
    }
    App.prototype.sizeCanvas = function () {
        this.w = this.ctx.canvas.width = window.innerWidth;
        this.h = this.ctx.canvas.height = window.innerHeight;
    };
    App.prototype.clearIt = function () {
        //this.ctx.clearRect(0,0,this.w,this.h);
        this.ctx.save();
        this.ctx.fillStyle = 'hsla(208,60%,10%,0.92)';
        this.ctx.fillRect(0, 0, this.w, this.h);
        this.ctx.restore();
    };
    App.prototype.draw = function (t) {
        var _this = this;
        //this.clearIt();
        window.requestAnimationFrame(function (t) { _this.draw(t); });
        if (this.rnd.chance(this.w / 130)) {
            this.fireworks.push(new Firework(this));
        }
        this.fireworks.forEach(function (f) {
            if (!f.alive) {
                without(_this.fireworks, f);
            }
            //log(this.fireworks.length)
            f.draw();
        });
    };
    App.prototype.initEvents = function () {
        var _this = this;
        window.onresize = function (e) { _this.sizeCanvas(e); };
    };
    return App;
}());
var foo = 'dsdsa';
var log = console.log.bind(console);
document.addEventListener('DOMContentLoaded', function () {
    var app = new App();
});
function without(arr, el) {
    arr.splice(arr.indexOf(el), 1);
}