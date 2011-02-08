(function() {

	Array.prototype.some = function(fn, ctx) {
		for(var i = 0, l = this.length; i<l; i++) {
			if((i in this) && fn.call(ctx, this[i], i, this)) return {'bool':true, 'index':i};
		}
		return false;
	}
	
	Array.prototype.filter = function(fn, ctx){
		var results = [];
		for (var i = 0, l = this.length; i < l; i++){
			if ((i in this) && fn.call(ctx, this[i], i, this)) results.push(this[i]);
		}
		return results;
	},
	
	Function.prototype.bind = function(bind){
		var self = this,
			args = (arguments.length > 1) ? Array.prototype.slice.call(arguments, 1) : null;
		
		return function(){
			if (!args && !arguments.length) return self.call(bind);
			if (args && arguments.length) return self.apply(bind, args.concat(Array.prototype.slice.call(arguments)));
			return self.apply(bind, args || arguments);
		};
	}
	
	var NodesToArray = function(item) {
			var i = item.length, array = new Array(i);
			while (i--) array[i] = item[i];
			return array;
		},
		
		IECanvas = function() {
			return document.createElement('canvas').getContext;
		};
	
	var Snake = this.Snake = function(config) {
	
		this.config = config || {};
		this.canvas = config.canvas;
		this.noCanvas = !IECanvas();
		if(this.noCanvas) G_vmlCanvasManager.initElement(this.canvas);
		this.ctx = config.canvas.getContext('2d');
		this.setting = this.config.setting;
		this.initEvents();
		
	}
	
	Snake.prototype = {
	
		start: function() {
			this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
			this.current = {
				'x': this.setting.startPoint.x,
				'y': this.setting.startPoint.y
			};
			this.course = this.setting.course;
			this.snake = [];
			this.snakeVml = [];
			this.foodsPoint = [];
			this.score = this.setting.startScore;
			this.level = this.setting.startLevel;
			this.snakeLength = this.setting.startSnakeLength;
			delete this.stop;
			this.draw();
			this.play();
			setTimeout(this.drawFoods.bind(this, [this.setting.foodsLength]), this.setting.delay*this.snakeLength/(this.level || 1));
		},
		
		pause: function() {
			clearInterval(this.interval);
			this.stop = true;
		},
		
		draw: function() {
			this.ctx.save();
			if(this.snake.some(this.eatItself, this) || this.wrongWay()) {
				this.gameOver();
				return;
			}
			this.snake.push([this.current.x, this.current.y]);
			if(this.snake.length > this.snakeLength) {
				var remove = this.snake.shift();
				if(!this.noCanvas) {
					this.ctx.clearRect(remove[0], remove[1], this.setting.snakeSize, this.setting.snakeSize);
				}else{
					var nodes = NodesToArray(this.ctx.element_.childNodes).filter(function(el) {return this.setting.snakeColor.indexOf(String(el.childNodes[0].color)) > -1}, this);
					nodes[0].removeNode(true);
				}
			}
			with(this.ctx) {
				fillStyle = this.setting.snakeColor;
				fillRect(this.current.x, this.current.y, this.setting.snakeSize, this.setting.snakeSize);
			}
			var eat = this.foodsPoint.some(this.eatFood, this);
			if(eat) {
				var level;
				this.foodsPoint.splice(eat.index, 1);
				if(this.noCanvas) {
					var some = NodesToArray(this.ctx.element_.childNodes).filter(function(el) {return String(el.childNodes[0].color).toUpperCase() == this.setting.foodColor}, this);
					some[eat.index].removeNode(true);
				}
				this.score += this.setting.onEatCount;
				level = parseInt(this.score/(this.setting.levelCount*this.setting.onEatCount)) + 1;
				if(this.setting.showInfo) this.onEatHandler(level);
				this.snakeLength += this.setting.onEatCount;
				setTimeout(this.drawFoods.bind(this, [1]), this.setting.delay*this.setting.onEatCount/(this.level || 1));
			}
		},
		
		onEatHandler: function(level) {
			var scoreDom = this.setting.scoreDom,
				levelDom = this.setting.levelDom;
			scoreDom.innerHTML = this.score;
			levelDom.innerHTML = level;
			if(this.level != level) {
				this.pause();
				this.level = level;
				this.play();
			}
		},
		
		drawFoods: function(len) {
			for(var i=0, l=len; i<l; i++) {
				var x = Math.floor(Math.random()*(this.canvas.width/this.setting.snakeSize))*this.setting.snakeSize,
					y = Math.floor(Math.random()*(this.canvas.height/this.setting.snakeSize))*this.setting.snakeSize;
				if(this.snake.some(function(elem) {return elem[0]==x && elem[1]==y})) {
					((this.canvas.width - x) >= this.setting.snakeSize) ? x+=this.setting.snakeSize : x-=this.setting.snakeSize;
					((this.canvas.height - y) >= this.setting.snakeSize) ? y+=this.setting.snakeSize : y-=this.setting.snakeSize;
				}
				var index = this.foodsPoint.push([x, y]);
				with(this.ctx) {
					fillStyle = this.setting.foodColor;
					fillRect(this.foodsPoint[index - 1][0], this.foodsPoint[index - 1][1], this.setting.snakeSize, this.setting.snakeSize);
				}
			}
		},
		
		gameOver: function() {
			Event.remove(document, 'keydown', this.keyDownHandler.bind(this));
			this.stop = true;
			this.pause();
			this.onGameOver();
		},
		
		restart: function() {
			this.resetResults();
			this.start();
		},
		
		resetResults: function() {
			var scoreDom = this.setting.scoreDom,
				levelDom = this.setting.levelDom;
			scoreDom.innerHTML = this.setting.startScore;
			levelDom.innerHTML = this.setting.startLevel;
		},
		
		onGameOver: function() {
			if(confirm(this.setting.gameOverText)) this.restart();
			else return;
		},
		
		move: function(course) {
			var axis = course == 'up' || course == 'down' ? 'y' : 'x',
				sign = course == 'left' || course == 'up' ? -this.setting.snakeSize : this.setting.snakeSize,
				value = this.current[axis] + sign;
			this.current[axis] = value;
			this.draw();
		},
		
		moveSnake: function() {
			this.move(this.course);
		},
		
		play: function () {
			delete this.stop;
			this.interval = setInterval(this.moveSnake.bind(this), this.setting.delay/(this.level || 1));
		},
		
		initEvents: function() {
			Event.add(document, 'keydown', this.keyDownHandler.bind(this));
		},
		
		keyDownHandler: function(e) {
			if(this.stop) return;
			var associations = {
				'37': 'left',
				'38': 'up',
				'39': 'right',
				'40': 'down'
			}
			var course = associations[e.keyCode.toString()];
			if((this.course == 'right' && course == 'left') 
				|| (this.course == 'down' && course == 'up')
				|| (this.course == 'left' && course == 'right')
				|| (this.course == 'up' && course == 'down')) return;
			if(e.keyCode.toString() in associations) {
				this.course = course;
				this.move(this.course);
			}
		},
		
		wrongWay: function() {
			return (this.current.x < 0 || this.current.y < 0 || this.current.x >= this.canvas.width || this.current.y >= this.canvas.height);
		},
		
		eatItself: function(element, index) {
			return element[0] == this.current.x && element[1] == this.current.y;
		},
		
		eatFood: function(element, index) {
			return element[0] == this.current.x && element[1] == this.current.y;
		}
	}
	
})();