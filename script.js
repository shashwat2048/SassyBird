//board variables
let board;
let boardWidth = 360;
let boardHeight = 650;
let context;

//bird variables
let birdWidth = 34;
let birdHeight = 24;
let birdX = boardWidth/8;
let birdY = boardHeight/2;
let bird = {x : birdX, y : birdY, width : birdWidth, height : birdHeight}; //bird object
//let birdImg;
let birdImgs = [];
let birdImgsIndex = 0;

//ground variables
let groundWidth = boardWidth;
let groundHeight = 64;
let groundX = 0;
let groundY = boardHeight - groundHeight;
let groundImg;
let groundArray = [];

//pipe variables
let pipeArray = [];
let pipeWidth = 64;
let pipeHeight = 512;
let pipeX = boardWidth;
let pipeY = 0;
let topPipeImg;
let bottomPipeImg;

//game physics variables
let velocityX = 0;
let velocityY = 0;
let gravity = 0;

//game state variables
let gameStarted = false;
let score = 0;
let gameOver = false;

//sound variables 
let scoreSound = new Audio("./sfx_point.mp3");
let hitSound = new Audio("./sfx_hit.mp3");
let dieSound = new Audio("./sfx_die.mp3");
let bgm = new Audio("./bgm.mp3");
let sadSound = new Audio("./sad-music.mp3");
let newHighScoreSound = new Audio("./new_high_score.mp3");
let isBgmPlaying = false;  

//game loader
window.onload = function() {
    //board setup
    setBoard();
    //draw bird
    setBird();
    //load pipe images
    loadPipeImages();
    //draw ground
    setGround();
    //main game loop
    requestAnimationFrame(gameLoop);
    setInterval(placePipes, 1500);
    setInterval(animateBird, 100);
    document.addEventListener("keydown", moveBird);
    document.addEventListener("touchstart", function(e) {
        e.preventDefault();
        moveBird({ code: "Space" });
    });
    
}

//board functions
function setBoard(){
    board = document.getElementById("myCanvas");
    context = board.getContext("2d");
    boardWidth = Math.min(window.innerWidth, 360);
    boardHeight = Math.min(window.innerHeight, 650);
    board.width = boardWidth;
    board.height = boardHeight;
}

//ground functions
function setGround(){
    groundImg = new Image();
    groundImg.src = "./ground.png";
    groundArray.push({img : groundImg, x : groundX, y : groundY, width : groundWidth, height : groundHeight});
    groundArray.push({img : groundImg, x : groundX + groundWidth, y : groundY, width : groundWidth, height : groundHeight});
}

let drawGround = () =>{
    for(let i = 0; i < groundArray.length; i++){
        let ground = groundArray[i];
        ground.x += velocityX;
        if(ground.x + ground.width < 0){
            let rightMostX = Math.max(...groundArray.map(g => g.x));
            ground.x = rightMostX + ground.width - 2;
        }
        context.drawImage(ground.img, ground.x, ground.y, ground.width, ground.height);
    }
}
 
//bird functions
function setBird(){
    for(let i = 0; i < 4; i++){
        let birdImg = new Image();
        birdImg.src = `./flappybird${i}.png`;
        birdImgs.push(birdImg);
    }
}
function drawBird() {
    context.save(); 
    let maxAngle = Math.PI / 5; 
    let angle = velocityY / 15 ; 
    if (angle > maxAngle) angle = maxAngle;
    if (angle < -maxAngle) angle = -maxAngle;

    context.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    context.rotate(angle);

    context.drawImage(birdImgs[birdImgsIndex], -bird.width / 2, -bird.height / 2, bird.width, bird.height);

    context.restore();
}
function animateBird(){
    if(gameStarted){
        birdImgsIndex++;
        birdImgsIndex %= birdImgs.length;
    }
}
function moveBird(event){
    if(event.code == "Space" || event.code == "ArrowUp" || event.code == "KeyX"){
        velocityY = -6;
        velocityX = -2;
        gravity = 0.5;
        gameStarted = true;
        let flapSound = new Audio("./sfx_wing.mp3");
        flapSound.volume = 0.1;
        flapSound.play();
    }
    if(gameOver){
        resetGame(); 
    }
}

//pipe functions
function loadPipeImages(){
    topPipeImg = new Image();
    topPipeImg.src = "./toppipe.png";
    bottomPipeImg = new Image();
    bottomPipeImg.src = "./bottompipe.png";
}
function placePipes(){
    if(!gameStarted){
        return;
    }
    if(gameOver){
        bgm.pause();
        isBgmPlaying = false;
        bgm.currentTime = 0;  
        return;
    }
    if(!isBgmPlaying){
        bgm.volume = 0.5;
        bgm.loop = true;
        bgm.play();
        isBgmPlaying = true;
    }
    let randomPipeY = pipeY - pipeHeight/4 - Math.floor(Math.random() * (pipeHeight/2));
    let openingSpace = boardHeight/4;
    let TopPipe = {img : topPipeImg,x : pipeX, y : randomPipeY, width : pipeWidth, height : pipeHeight, passed : false};
    pipeArray.push(TopPipe);
    let BottomPipe = {img : bottomPipeImg, x : pipeX, y : randomPipeY + pipeHeight + openingSpace, width : pipeWidth, height : pipeHeight, passed : false};
    pipeArray.push(BottomPipe);
}
let drawPipes = () =>{
    for(let i = 0; i < pipeArray.length; i++){
        let pipe =  pipeArray[i];
        pipe.x += velocityX;
        context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);
        if(pipe.x + pipe.width < bird.x && !pipe.passed){
            pipe.passed = true;
            score+=0.5;
            scoreSound.volume = 0.1;
            scoreSound.play();
        }
        if(checkCollision(bird, pipe)){
            gameOver = true;
            hitSound.volume = 0.8;
            hitSound.play();
            sadSound.volume = 0.2;
            sadSound.play(); 
        }
        if(checkCollision(bird, groundArray[0]) || checkCollision(bird, groundArray[1])){
            gameOver = true;
                dieSound.volume = 0.5;
                dieSound.play();
                sadSound.volume = 0.2;
                sadSound.loop = true; 
                sadSound.play();
        }
    }

    while(pipeArray.length > 0 && pipeArray[0].x < -pipeWidth){
        pipeArray.shift();
    }
    drawScore();
}

//collision detection
function checkCollision(a, b){
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}
//score updation
function drawScore(){
    context.fillStyle = "white";
    context.font = "30px poppins";
    context.fillText("Score: " + score, 10, 30);
    let storedHighScore = localStorage.getItem("highScore");
    let highScore = storedHighScore ? parseFloat(storedHighScore) : 0;
    context.fillText("High Score: " + highScore, 10, 70);
}
function updateHighScore() {
    let storedHighScore = localStorage.getItem("highScore");
    let highScore = storedHighScore ? parseFloat(storedHighScore) : 0;
    if (score > highScore) {
        sadSound.pause();
        sadSound.currentTime = 0;
        localStorage.setItem("highScore", score);
        highScore = score;
        context.font = "30px poppins";
        context.fillStyle = "white"; 
        context.fillText(" New High Score: " + highScore, boardWidth/2 - 110, boardHeight/2 + 40);
        newHighScoreSound.volume = 0.5;
        newHighScoreSound.play();
    }
    return highScore;
}


//reset game
function resetGame(){
    bird.y = birdY;
    velocityY = 0;
    pipeArray = [];
    score = 0;
    gameOver = false;
    velocityX = 0;
    gravity = 0;
    gameStarted = false;
    isDead = false;
    birdImgsIndex = 0;
    sadSound.pause();
    sadSound.currentTime = 0;
}

//game loop
function gameLoop(){
    requestAnimationFrame(gameLoop);
    if(gameOver){
        updateHighScore();
        context.font = "30px poppins";
        context.fillText("Game Over", boardWidth/2 - 60, boardHeight/2);
        return;
    }
    context.clearRect(0, 0, boardWidth, boardHeight);

    //draw bird
    velocityY += gravity;
    bird.y = Math.max(bird.y + velocityY, 0);   
    if(bird.y >= boardHeight){
        gameOver = true;
    }  
    drawBird();

    //draw pipes
    drawPipes();

    //draw ground
    drawGround();
}





