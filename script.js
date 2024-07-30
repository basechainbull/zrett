const canvas = document.getElementById('canvas1');

const ctx = canvas.getContext("2d");
canvas.width = 900;
canvas.height = 600;

// global variables

const cellSize = 100;
const cellGap = 3;
let numberOfResources = 300;
// let defenderCost = 100;
let enemiesInterval = 240;
const minInterval = 20;
let frame = 0;
let score = 0;
let gameOver = false;
let winningScore = 10;
const gameGrid = [];
const defenders = [];
const enemies = [];
const resources = [];
const enemyPositions = [];
const projectiles = [];

// background tiles
const topImg = new Image();
topImg.src= "./imgs/top.png"
const mid = new Image();
mid.src= "./imgs/middle.png"
const ground = new Image();
ground.src= "./imgs/ground.png"
const bottom = new Image();
bottom.src= "./imgs/bottom.png"
const zrett = new Image();
zrett.src= "./imgs/zrett.png"
const bg = new Image();
bg.src= "./imgs/bg.png"

const field = new Image();
field.src= "./imgs/field.png"

const images = {
    zrett,
    bg
}
const backgroundTile = {
    top: topImg,
    middle: mid,
    bottom: bottom,
    ground,
    field
}

// mouse 
const mouse = {
    x: 10, y:10, width: 0.1, height:.1
}

let canvasPosition = canvas.getBoundingClientRect();


canvas.addEventListener('mousemove', function(e){
    mouse.x = e.x - canvasPosition.left;
    mouse.y = e.y - canvasPosition.top;
})
canvas.addEventListener('mouseleave', function(){
    mouse.x = undefined;
    mouse.y = undefined;
})
// game board
const controlsBar = {
    width: canvas.width, 
    height: cellSize,

}

class Cell {
    constructor(x,y){
        this.x = x;
        this.y = y;
        this.width = cellSize;
        this.height = cellSize;

    }

    draw(){
        if(mouse.x && mouse.y && collision(this,mouse)){
            // ctx.strokeStyle = 'black';
            // ctx.strokeRect(this.x,this.y, this.width, this.height);
                // ctx.fillStyle = "green";
                // ctx.font = '30px Orbitron';
                // ctx.fillText(`${this.x},${this.y}`, this.x + 15, this.y + 30); 
        }
    }
}

function createGrid(){
    for(let y = cellSize; y < canvas.height; y += cellSize){
        for(let x = 0; x < canvas.width; x += cellSize){
            let tile = undefined; 
            
            if( y === cellSize){
                tile = backgroundTile.top
            } else if (y === canvas.height - cellSize){
                tile = backgroundTile.bottom;
            }
            else {
                tile = backgroundTile.middle
            }
            gameGrid.push(new Cell(x,y));

        }
    }
}
createGrid();

function paintTiles () {
    // ctx.drawImage(backgroundTile.field,650,500,2360,2197,0,0,1800,1200);
    // ctx.clearRect(0,0,cellSize,600);

    // for(let y = cellSize; y < canvas.height; y += cellSize){
    //     for(let x = 0; x < canvas.width; x += cellSize){
    //         let tile = undefined; 
            
    //         if( y === cellSize){
    //             tile = backgroundTile.top
    //         } else if (y === canvas.height - cellSize){
    //             tile = backgroundTile.bottom;
    //         }
    //         // else if(x < canvas.width && x > cellSize){
    //         //     tile = backgroundTile.ground
    //         // }
    //         else{
    //             tile= backgroundTile.ground
    //         }

    //         // ctx.drawImage(tile,x,y, cellSize, cellSize);
    //         ctx.fillStyle = "green";
    //         ctx.font = '30px Orbitron';
    //         ctx.fillText(`${x},${y}`, this.x + 15, this.y + 30); 
    //         if(x === 300){
    //             ctx.drawImage(images.zrett,x,y, cellSize, cellSize);
                
    //         }
    //     }
    // }
}



function handleGameGrid(){
    for(let i = 0; i < gameGrid.length; i++){
        gameGrid[i].draw()
    }
}

const projectile = new Image();
projectile.src = './imgs/projectile.png';
// projectiles
class Projectile{
    constructor(x,y){
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.power = 20;
        this.speed = 5;
        this.frameX = 0;
        this.frameY = 0;
        this.minFrame = 0;
        this.maxFrame = 4;
        this.spriteWidth = 174;
        this.spriteHeight = 141;
    }
    update(){
        this.x += this.speed;
        if(frame % 10 === 0){

            if(this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = this.minFrame;
        }
    }
    draw(){
        // ctx.fillStyle = "black";
        // ctx.beginPath();
        // ctx.arc(this.x,this.y,this.width,0,Math.PI * 2);
        // ctx.fill();
        ctx.drawImage(projectile, this.frameX * this.spriteWidth , 0 ,this.spriteWidth,this.spriteHeight, this.x + 40, this.y - 20,this.width,this.height)

    }
}

function handleProjectiles(){
    for(let i = 0; i < projectiles.length; i++ ){
        projectiles[i].update();
        projectiles[i].draw();
        // hits and adjust enemies
        for(let j = 0; j < enemies.length; j++){
            if(projectiles[i] && enemies[j] && collision(projectiles[i],enemies[j])){
                enemies[j].health -= projectiles[i].power;
                projectiles.splice(i,1);
                i--;

            }
        }
        // Remove projectile after going too far
        if(projectiles[i] && projectiles[i].x > canvas.width 
            // - cellSize / 2
        ){
            projectiles.splice(i,1);
            i--;
        }

    }
}

const defenderShooting = new Image();
defenderShooting.src = './imgs/zrett-defender.png'

const defenderIdle = new Image();
defenderIdle.src = './imgs/zrett-idle.png'
const defenderMap = {
    idle: {
        type: defenderIdle,
        maxFrame: 9,
        spriteWidth: 192,
        spriteHeight: 188
    },
    shooting:{
        type: defenderShooting,
        maxFrame: 3,
        spriteWidth:567,
        spriteHeight : 556
    }
}

// defenders
class Defender {
    constructor(x,y){
        this.x = x;
        this.y = y;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize  - cellGap * 2;
        this.shooting = false;
        this.shootNow = false;
        this.health = 100;
        this.projectiles = [];
        this.timer = 0;
        this.frameX = 0;
        this.frameY = 0;
        // this.timer = 0;
        this.type = defenderMap.idle.type;
        this.minFrame = 0;
        this.maxFrame = defenderMap.idle.maxFrame;
        this.spriteWidth = defenderMap.idle.spriteWidth;
        this.spriteHeight = defenderMap.idle.spriteHeight;
    }
    draw(){
        // ctx.fillStyle = 'blue';
        // ctx.fillRect(this.x,this.y,this.width,this.height);
        ctx.fillStyle = '#a6e439';
        ctx.font = '30px Orbitron';
        ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 10);
        ctx.drawImage(this.type, this.frameX * this.spriteWidth , 0 ,this.spriteWidth,this.spriteHeight, this.x, this.y,this.width,this.height)

    }
    update(){

        if(frame % 10  === 0){

            if(this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = this.minFrame;
            // max frame 3 tells that its a idle type
            if(this.frameX === 3) this.shootNow = true;
        }
        if(this.shooting && this.shootNow){
            this.type = defenderMap.shooting.type;
            this.maxFrame = defenderMap.shooting.maxFrame;
            this.spriteWidth = defenderMap.shooting.spriteWidth;
            this.spriteHeight = defenderMap.shooting.spriteHeight;
            this.timer++;
            if(this.timer % 50 === 0){
                projectiles.push(new Projectile(this.x,this.y + cellSize / 2));
                this.shootNow = false;
            }
        }else{
            
            this.timer = 0
        }
    }
}


function handleDefenders(){
    for(let i = 0; i < defenders.length; i++){
        defenders[i].draw();
        defenders[i].update();
        const enemyOnRow = enemyPositions.indexOf(defenders[i].y);
        // console.log("enemyOnRow",enemyOnRow,defenders[i]);
        if(enemyOnRow !== -1){
            defenders[i].shooting = true;
        }
        else{
            defenders[i].shooting=  false;
            defenders[i].type = defenderMap.idle.type;
            defenders[i].maxFrame = defenderMap.idle.maxFrame;
            defenders[i].spriteWidth = defenderMap.idle.spriteWidth;
            defenders[i].spriteHeight = defenderMap.idle.spriteHeight;
        }
        for(let j = 0; j < enemies.length; j++){
            if(defenders[i] && collision(defenders[i], enemies[j])){
                enemies[j].movement = 0;
                defenders[i].health -= 0.2;
               
            }
            if(defenders[i] && defenders[i].health <= 0){
                defenders.splice(i,1);
                i--;
                const e = enemies[j];
                console.log("Enemy BEFORE death: ",e)
                enemies[j].movement = enemies[j].speed;
                console.log("Enemy AFTER death: ",e)
                
            }
        }
    }
}
// Floating Messages
const floatingMessages =[];
class FloatingMessage {
    constructor(value,x,y,size,color){
        this.value = value;
        this.x = x;
        this.y = y;
        this.size = size;
        this.lifeSpan = 0;
        this.color = color;
        this.opacity = 1;
    }
    update(){
        this.y -= 0.3;
        this.lifeSpan += 1;
        if(this.opacity > 0.03) this.opacity -= 0.03;
    }
    draw(){
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.font = this.size + "px Orbitron";
        ctx.fillText(this.value, this.x, this.y);
        ctx.globalAlpha = 1;
    }

}

function handleFloatingMessages () {
    for(let i = 0; i < floatingMessages.length; i++){
        floatingMessages[i].update();
        floatingMessages[i].draw();
        if(floatingMessages[i].lifeSpan >= 15){
            floatingMessages.splice(i,1);
            i--;
        }
    }
}

// enemies
const enemyTypes = []
const enemyB = new Image();
enemyB.src = './imgs/brett-attacker.png'
const boy = {
    enemy: enemyB,
    spriteWidth: 192,
    spriteHeight: 232
}
enemyTypes.push(boy)
const enemyG = new Image();
enemyG.src = './imgs/enemy-g.png';
const girl = {
    enemy: enemyG,
    spriteWidth: 521,
    spriteHeight: 576
}
enemyTypes.push(girl);
const mochiRun = new Image();
mochiRun.src = './imgs/mochi-run.png';
const mochi = {
    maxFrame: 7,
    enemy: mochiRun,
    spriteWidth: 240,
    spriteHeight: 211
}
enemyTypes.push(mochi);

class Enemy{
    constructor(verticalPosition){
        this.x = canvas.width;
        this.y = verticalPosition;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        this.speed = Math.random() * .2 + 0.4;
        this.movement = this.speed;
        this.health = 100;
        this.maxHealth = this.health;
        const enemyObj = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];

        this.enemyType = enemyObj.enemy;
        this.frameX = 0;
        this.frameY = 0;
        this.minFrame = 0;
        this.maxFrame = enemyObj.maxFrame || 9;
        this.spriteWidth = enemyObj.spriteWidth;
        this.spriteHeight = enemyObj.spriteHeight;
    }
    update(){
        this.x -= this.movement;
        if(frame % 10 === 0){

            if(this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = this.minFrame;
        }
    }
    draw(){
        // ctx.fillStyle= "red";
        // ctx.fillcaRect(this.x,this.y,this.width,this.height);
        ctx.fillStyle = "red";
        ctx.font = '30px Orbitron';
        ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 10); 
        // ctx.drawImage(img,sx,sy,sw,sh,dx,dy,dw,dh);
        ctx.drawImage(this.enemyType, this.frameX * this.spriteWidth , 0 ,this.spriteWidth,this.spriteHeight, this.x, this.y,this.width,this.height)
    }
}

function handleEnemies(){
    for(let i = 0; i < enemies.length; i++){
        enemies[i].update();
        enemies[i].draw();
        if(enemies[i].x < 0 ){
            gameOver = true;
        }
        if(enemies[i].health <= 0){
            let gainedResources = enemies[i].maxHealth/10;
            floatingMessages.push(new FloatingMessage("+" + gainedResources, 250, 50, 30,"orange"))
            floatingMessages.push(new FloatingMessage("+" + gainedResources, enemies[i].x, enemies[i].y, 30,"black"))

            numberOfResources += gainedResources;
            score += gainedResources;
            const findThisIndex = enemyPositions.indexOf(enemies[i].y); // just tracks if an enemy is on the row so it doesnt matter if its the exacton dying.

            enemyPositions.splice(findThisIndex,1)
            enemies.splice(i,1);
            i--;

        }
    }
    if(frame % enemiesInterval === 0 && defenders.length < 30){
        console.log("DEFENDERS: ",defenders)
        let verticalPosition = Math.floor(Math.random () * 5 + 1 ) * cellSize + cellGap;
        enemies.push(new Enemy(verticalPosition));
        enemyPositions.push(verticalPosition);
        // if(enemiesInterval > 120) enemiesInterval -= 50;

    }
}


const resourceImg = new Image();
resourceImg.src= './imgs/resource-jesse.png';

// resources
const amounts = [20,30,40];
class Resources {
    constructor(){
        this.x = Math.random() * (canvas.width - cellSize);
        this.y = (Math.floor(Math.random() * 5) + 1 ) * cellSize + 25;
        this.width = cellSize * 0.6;
        this.height = cellSize * 0.6;
        this.amount = amounts[Math.floor(Math.random() * amounts.length)];
    }
    draw(){
        // ctx.fillStyle = 'yellow';
        ctx.drawImage(resourceImg, 0 , 0 ,336,336, this.x, this.y,this.width,this.height)

        // ctx.fillRect(this.x,this.y, this.width, this.height);
        ctx.fillStyle = '#a6e439';
        ctx.font = '20px Orbitron';
        ctx.fillText('+'+this.amount, this.x + 15 , this.y + 5);
    }
}

function handleResources(){
    if(frame % 1000 === 0 && score < 150){
        resources.push(new Resources());
    }
    for(let i = 0; i< resources.length; i++){
        resources[i].draw();
        if(resources[i] && mouse.x && mouse.y && collision(resources[i],mouse)){
            numberOfResources += resources[i].amount;
            floatingMessages.push(new FloatingMessage("+" + resources[i].amount, resources[i].x, resources[i].y, 30,"#a6e439"))
            floatingMessages.push(new FloatingMessage("+" + resources[i].amount, 250, 50, 30,"#a6e439"))
            resources.splice(i,1);
            i--;
        }
    }
}

// utilities

function handleGameStatus(){
    ctx.fillStyle = "orange";
    ctx.font = "30px Orbitron";
    ctx.fillText('Score: : '  + score,20,40);
    ctx.fillText('Resources: ' + numberOfResources,20,80);
    if(gameOver){
        ctx.fillStyle = 'RED';
        ctx.font = "90px Orbitron";
        ctx.fillText("GAME OVER", 235, 330);
    }
    if(score >= winningScore && enemies.length === 0 && defenders.length >= 30){
        ctx.fillStyle = 'red';
        ctx.font = '60px Orbitron';
        ctx.fillText("TOTAL ZRENIALATION", 130, 180)
        ctx.font = "30px Orbitron";
        ctx.fillText("ZRETT WINS: " + score + " POINTS!", 134, 340);
        gameOver = true;
    }
}


canvas.addEventListener('click',function(e){
    const gridPositionX = mouse.x - (mouse.x % cellSize) + cellGap;
    const gridPositionY = mouse.y - (mouse.y % cellSize) + cellGap;
    if(gridPositionY < cellSize)return;
    let defenderCost = 100;

    for(let i = 0; i < defenders.length; i++){
        if(defenders[i].x === gridPositionX && defenders[i].y === gridPositionY) {
            return;
        }
    }

    if(numberOfResources >= defenderCost){
        defenders.push(new Defender(gridPositionX,gridPositionY));
        numberOfResources -= defenderCost;
    } else {
        floatingMessages.push(new FloatingMessage('Need more resources', mouse.x, mouse.y,30,"#f98041"))
    }
})





function animate(){

    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0,0,controlsBar.width, controlsBar.height);
    handleGameGrid();
    paintTiles();
    handleDefenders();
    handleResources();
    handleProjectiles();
    handleEnemies();
    handleGameStatus();
    handleFloatingMessages();
    frame++;
    console.log("enemiesInterval",enemiesInterval)
    if(frame % 1000 === 0 && enemiesInterval >  minInterval){
        enemiesInterval -= minInterval;
        console.log("INTERVAL CHANGE: ",enemiesInterval)
    }
    if(!gameOver){
        requestAnimationFrame(animate);
    }
}

animate();

function collision(first,second){
    if( 
        !(first.x > second.x + second.width  || 
          first.x + first.width < second.x   || 
          first.y > second.y + second.height || 
          first.y + first.height < second.y) 
    ){
        return true;
    }
    return false;
}

window.addEventListener('resize', function(e){
    canvasPosition = canvas.getBoundingClientRect();
})