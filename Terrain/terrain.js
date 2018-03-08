var canvas = document.getElementById("canvas");
var processing = new Processing(canvas, function(processing) {
    processing.size(400, 400);
    processing.background(0xFFF);

    var mouseIsPressed = false;
    processing.mousePressed = function () { mouseIsPressed = true; };
    processing.mouseReleased = function () { mouseIsPressed = false; };

    var keyIsPressed = false;
    processing.keyPressed = function () { keyIsPressed = true; };
    processing.keyReleased = function () { keyIsPressed = false; };

    function getImage(s) {
        var url = "https://www.kasandbox.org/programming-images/" + s + ".png";
        processing.externals.sketch.imageCache.add(url);
        return processing.loadImage(url);
    }

    function getLocalImage(url) {
        processing.externals.sketch.imageCache.add(url);
        return processing.loadImage(url);
    }

    // use degrees rather than radians in rotate function
    var rotateFn = processing.rotate;
    processing.rotate = function (angle) {
        rotateFn(processing.radians(angle));
    };

    with (processing) {
      
var keys = [];
keyPressed = function()
{
    keys[keyCode] = true;
};
keyReleased = function()
{
    keys[keyCode] = false;
};

var getPosOnGrid = function(Point, grid)
{
    return {
        col : constrain(
            round((Point.xPos - ((grid.gridWidth / 2) + grid.xPos)) / grid.gridWidth), 
            0, 
            grid.length - 1),
        row : constrain(
            round((Point.yPos - ((grid.gridHeight / 2) + grid.yPos)) / grid.gridHeight),
            0,
            grid[0].length - 1),
    };
};

var Camera = function(xPos, yPos, Width, Height)
{
    this.xPos = xPos;
    this.yPos = yPos;
    
    this.width = Width;
    this.height = Height;
    
    this.halfWidth = this.width/2;
    this.halfHeight = this.height/2;
    
    this.viewXPos = this.xPos;
    this.viewYPos = this.yPos;
    
    this.xAreaOffSet = 0;
    this.yAreaOffSet = 0;
    
    this.upperLeft = { 
        col : 0,
        row : 0,
    };
    this.lowerRight = { 
        col : 0,
        row : 0,
    };
    
    this.view = function(object, world)
    {
        this.viewXPos = object.xPos + object.width/2;
        this.viewYPos = object.yPos + object.height/2;
        
        this.viewXPos = constrain(
            this.viewXPos, 
            this.halfWidth - this.xAreaOffSet, 
            world.width - this.halfWidth + this.xAreaOffSet);
        this.viewYPos = constrain(
            this.viewYPos, 
            this.halfHeight - this.yAreaOffSet, 
            world.height - this.halfHeight + this.yAreaOffSet);
        
        translate(this.xPos, this.yPos);
        
        if(world.width >= this.width)
        {
            translate(this.halfWidth - this.viewXPos, 0);
        }
        if(world.height >= this.height)
        {
            translate(0, this.halfHeight - this.viewYPos);
        }
    };
    
    this.update = function(world)
    {
        var xPos = (this.viewXPos - this.halfWidth);
        var yPos = (this.viewYPos - this.halfHeight);
        
        this.upperLeft = getPosOnGrid({
            xPos : xPos,
            yPos : yPos,
        }, world);
        this.lowerRight = getPosOnGrid({
            xPos : xPos + this.width,
            yPos : yPos + this.height,
        }, world);
    };
    
    this.draw = function() 
    {
        noFill();
        stroke(0, 0, 0);
        rect(this.xPos, this.yPos, this.width, this.height);
        noStroke();
    };
};
var cam = new Camera(0, 0, width, height);

var world = [];
world.setup = function(config)
{
    this.xPos = config.xPos || 0;
    this.yPos = config.yPos || 0;
    this.gridWidth = config.gridWidth || 20;
    this.gridHeight = config.gridHeight || 20;
};
world.create = function(config)
{
    this.noiseScale = config.noiseScale || 0.05;
    this.octaves = config.octaves || 3;
    this.fallOff = config.fallOff || 0.5; 
    
    this.cols = config.cols || 20;
    this.rows = config.rows || 20;
    
    for(var col = 0; col < this.cols; col++)
    {
        this[col] = [];
        
        for(var row = 0; row < this.rows; row++)
        {
            this[col][row] = [world.getNoise(col, row)];
        }
    }
};
world.getNoise = function(col, row)
{
    noiseDetail(this.octaves, this.fallOff);
    
    var noiseVal = noise(
        col * this.noiseScale,
        row * this.noiseScale
    );
    
    return noiseVal;
};
world.addObjects = function(objectsList)
{
    for(var col = 0; col < this.length; col++)
    {
        for(var row = 0; row < this[0].length; row++)
        {
            this[col][row] = [this.getObject(this[col][row])];
        }
    }
};
world.getObject = function(input)
{
    var output = input;
    
    switch(true)
    {
        case input > 0.4 && input < 0.45 : 
                output = color(120, 28, 28);
            break;
        
        case input < 0.4 : 
                output = color(255, 0, 0);
            break;
            
        case input > 0.4 :
                output = {
                    name : "rock",
                    draw : function(config) 
                    {
                        fill(130, 130, 130);
                        rect(config.xPos + config.gridWidth / 4,
                        config.yPos + config.gridHeight / 4, 
                        config.gridWidth / 2, config.gridHeight / 2);
                    },
                };
            break;
                
        default : 
                output = color(0, 0, 0);
            break;
    }
    
    return output;
};
world.addObject = function(object)
{
    var col = floor(object.xPos / world.gridWidth);
    var row = floor(object.yPos / world.gridHeight);
    var index = max(world[col][row].length - 1, 1);
    this[col][row][index] = {
        name : object.name,
        draw : function(config)
        { 
            return object.draw(config);
        },
    };
};
world.addCol = function()
{
    var array = [];
    for(var row = 0; row < this[this.length - 1].length; row++)
    {
        array.push([this.getObject(this.getNoise(this.length, row))]);
    }
    this[this.length] = array;
};
world.addRow = function()
{
    for(var col = 0; col < this.length; col++)
    {
        this[col][this[col].length] = [this.getObject(
        this.getNoise(col, this[col].length))];
    }
};
world.draw = function() 
{
    for(var col = cam.upperLeft.col; col < cam.lowerRight.col; col++)
    {
        for(var row = cam.upperLeft.row; row < cam.lowerRight.row; row++)
        {
            for(var i = 0; i < this[col][row].length; i++)
            {
                var type = typeof this[col][row][i];
                var xPos = this.xPos + col * this.gridWidth;
                var yPos = this.yPos + row * this.gridHeight;
                
                switch(type)
                {
                    case "object" :
                        
                        if(this[col][row][i].draw !== undefined)
                        {
                            this[col][row][i].draw({
                                xPos : xPos, 
                                yPos : yPos, 
                                gridWidth : this.gridWidth, 
                                gridHeight : this.gridHeight
                            });
                        }
                        break;
                        
                    case "number" :
                        fill(this[col][row][i]);
                        rect(xPos, yPos, this.gridWidth, this.gridHeight);
                        break;
                }
            }
        }
    }
};
world.update = function()
{
    this.width = this.length * this.gridWidth;
    this.height = this[0].length * this.gridHeight;
};

world.setup({
    gridWidth : 15,
    gridHeight : 15,
});
world.create({
    cols : 40,
    rows : 40,
});
world.addObjects();

var GameObject = function(config)
{
    this.xPos = config.xPos;
    this.yPos = config.yPos;
    this.width = config.width;
    this.height = config.height;
    this.color = config.color;
     
    this.name = config.name;
    this.index = config.index;
    this.arrayName = config.arrayName;
    
    this.col = 0;
    this.row = 0;
    this.lastCol = 0;
    this.lastRow = 0;
    
    this.delete = false;
    
    this.draw = function() 
    {
        noStroke();
        fill(this.color);
        rect(this.xPos, this.yPos, this.width, this.height);
    };
    this.update = function() {};
    
    this.setPos = function(func)
    {
        var index = max(world[this.lastCol][this.lastRow].length - 1, 1);
        world[this.lastCol][this.lastRow][index] = {};
        func(this);
        world.addObject(this);
    };
    
    this.remove = function()
    {
        this.delete = true;   
    };
};

var createArray = function(Obj, Arr)
{
    var array = Arr || [];
    array.refs = {};
    array.add = function(config)
    {
        config.index = this.length;
        config.arrayName = this.name;
        this.push((Obj.apply === undefined) ? config : new Obj(config));
    };
    array.addObj = function(name, config)
    {
        config.name = name;
        this.refs[name] = this.length;
        this.add(config);
    };
    array.getObj = function(name)
    {
        if(this[this.refs[name]] !== undefined)
        {
            return this[this.refs[name]];
        }else{
            println("Error referencing obj '" + name + "'"); 
            return {};
        }
    };
    array.removeObj = function(name)
    {
        this.splice(this.getObj(name), 1);
        this.refs[name] = undefined;
    };
    array.draw = function() 
    {
        for(var i = 0; i < this.length; i++)
        {
            this[i].draw();   
        }
    };
    array.update = function() 
    {
        for(var i = 0; i < this.length; i++)
        {
            this[i].update();  
            if(this[i].delete)
            {
                this.splice(0, 1);   
            }
        }
    };
    return array;
};
var gameObjects = createArray([]);

var Player = function(config)
{
    GameObject.call(this, config);
    
    this.xVel = 3;
    this.yVel = 3;
    
    this.draw = function(config) 
    {
        fill(25, 60, 170);
        rect((config.xPos + config.gridWidth / 2) - this.width / 2, 
             (config.yPos + config.gridHeight / 2) - this.height / 2, 
        this.width, this.height);
    };    
        
    this.update = function()
    {
        this.lastXPos = this.xPos;
        this.lastYPos = this.yPos;
        
        this.lastCol = floor(this.lastXPos / world.gridWidth);
        this.lastRow = floor(this.lastYPos / world.gridHeight);
        
        if(keys[LEFT] || keys[65])
        {
            this.xPos -= this.xVel;
        }
        if(keys[RIGHT] || keys[68])
        {
            this.xPos += this.xVel;
        }
        if(keys[UP] || keys[87])
        {
            this.yPos -= this.yVel;
        }
        if(keys[DOWN] || keys[83])
        {
            this.yPos += this.yVel;
        }
        
        this.xPos = max(this.xPos, 0);
        this.yPos = max(this.yPos, 0);
        
        this.col = floor(this.xPos / world.gridWidth);
        this.row = floor(this.yPos / world.gridHeight);
        
        if(this.col !== this.lastCol || this.row !== this.lastRow)
        {
            var index = max(world[this.lastCol][this.lastRow].length - 1, 1);
            var temp = world[this.lastCol][this.lastRow][index];
            
            index = max(world[this.lastCol][this.lastRow].length - 1, 1);
            world[this.lastCol][this.lastRow][index] = {};
            
            index = max(world[this.col][this.row].length - 1, 1);
            world[this.col][this.row][index] = temp;
        }
        
        if(this.col >= (world.length - 1) - ((width / 2) / world.gridWidth))
        {
            world.addCol();
        }
        if(this.row >= (world[0].length - 1) - ((height / 2) / world.gridHeight))
        {
            world.addRow();
        }
    };
};
gameObjects.addObj("player", createArray(Player));
gameObjects.getObj("player").addObj("#1", {
    xPos : width / 2,
    yPos : height / 2,
    width : world.gridWidth,
    height : world.gridHeight,
});

world.addObject(gameObjects.getObj("player")[0]);

draw = function() 
{
    noStroke();
    background(0, 0, 0);
    
    var player = gameObjects.getObj("player")[0];
    
    pushMatrix();
        cam.view(player, world);
        cam.update(world);
        world.update();
        world.draw();
        gameObjects.update();
    popMatrix();
    
    cam.draw();
    
    fill(255, 255, 255);
    text("x : " + player.xPos, 20, 20);
    text("y : " + player.yPos, 20, 35);
    
    text("World Cols : " + world.length, 280, 20);
    text("World Rows : " + world[0].length, 280, 35);
};

var lastKeyReleased = keyReleased;
keyReleased = function()
{
    if(keys[84])
    {
        gameObjects.getObj("player")[0].setPos(function(player) 
        {
            player.xPos = round(random(0, (world.length - 1) * world.gridWidth));
            player.yPos = round(random(0, (world[0].length - 1) * world.gridHeight));
        });
    }
    lastKeyReleased();
};


    }
    if (typeof draw !== 'undefined') processing.draw = draw;
});