class RecordManager {
    static addRecord(name, score) {
        const records = JSON.parse(localStorage.getItem('records')) || [];
        records.push({ name, score });
        records.sort((a, b) => b.score - a.score);
        if (records.length > 3) {
            records.pop();
        }

        localStorage.setItem('records', JSON.stringify(records));
    }

}

class Tetromino {
    constructor(shape) {
        this.shape = shape;
        this.x = 0;
        this.y = 0;
    }

    rotate(board) {
        const oldShape = this.shape;
        const newShape = [];

        for (let col = 0; col < oldShape[0].length; col++) {
            const newRow = [];
            for (let row = oldShape.length - 1; row >= 0; row--) {
                newRow.push(oldShape[row][col]);
            }
            newShape.push(newRow);
        }

        if (!this.collidesWith(board, newShape, this.x, this.y)) {

            const oldCoordinates = this.getOccupiedCoordinates();
            this.shape = newShape;
            const newCoordinates = this.getOccupiedCoordinates();
            this.redrawTetromino(board, oldCoordinates, newCoordinates);
        }

    }

    canMove(board, dx, dy) {
        const nextX = this.x + dx;
        const nextY = this.y + dy;
        return !this.collidesWith(board, this.shape, nextX, nextY);
    }

    move(board, dx, dy) {
        if (this.canMove(board, dx, dy)) {
            const oldCoordinates = this.getOccupiedCoordinates();
            this.x += dx;
            this.y += dy;
            const newCoordinates = this.getOccupiedCoordinates();
            this.redrawTetromino(board, oldCoordinates, newCoordinates);
            return true;
        }
        return false;
    }

    redrawTetromino(board, oldCoordinates, newCoordinates) {
        for (const coord of oldCoordinates) {
            board[coord.y][coord.x] = 0;
        }

        for (const coord of newCoordinates) {
            board[coord.y][coord.x] = 1;
        }
    }

    getOccupiedCoordinates(x = this.x, y = this.y, shape = this.shape) {
        const occupiedCoordinates = [];

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] === 1) {
                    const boardX = x + col;
                    const boardY = y + row;
                    occupiedCoordinates.push({ x: boardX, y: boardY });
                }
            }
        }

        return occupiedCoordinates;
    }

    collidesWith(board, shape, x, y) {
        const oldCoordinates = this.getOccupiedCoordinates();

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] === 1) {
                    const boardX = x + col;
                    const boardY = y + row;

                    if (board[boardY][boardX] === 1 && !oldCoordinates.some(coord => coord.x === boardX && coord.y === boardY)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }
}

function getRandomBrightColor() {
    const r = Math.floor(Math.random() * 256); // Значение от 0 до 255
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('myCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.strokeStyle = getRandomBrightColor();
        this.ctx.fillStyle = 'white';
        this.ctx.font = '40px Common Pixel';
        this.cellSize = 25;
        this.rows = this.canvas.height / this.cellSize;
        this.columns = this.canvas.width / this.cellSize;
        this.grid = [];

        this.score = 0;
        this.level = 1
        this.scoreThreshold = 300;
        this.moveInterval = 500;
        this.lastMoveTime = 0;
        this.currentTetromino = this.spawnNewTetromino();
        this.nextTetromino =  this.spawnNewTetromino();
        this.nextTetrominoCanvas = document.getElementById('nextTetrominoCanvas');


        document.addEventListener('keydown', this.handleKeyPress.bind(this));

        this.initGrid();
        this.fillCellsAroundEdges();
        this.startGame();
    }

    initGrid() {
        for (let i = 0; i < this.rows; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.columns; j++) {
                this.grid[i][j] = 0;
            }
        }
    }

    drawTetromino() {
        const occupiedCoordinates = this.currentTetromino.getOccupiedCoordinates();

        for (const coord of occupiedCoordinates) {
            const cellX = coord.x;
            const cellY = coord.y;
            this.grid[cellY][cellX] = 1;
        }
    }

    drawGrid() {
        const borderSize = 4;

        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
                const cellX = j * this.cellSize;
                const cellY = i * this.cellSize;

                if (this.grid[i][j] === 1) {
                    this.ctx.fillRect(cellX + borderSize / 2, cellY + borderSize / 2, this.cellSize - borderSize, this.cellSize - borderSize);
                }
                this.ctx.strokeRect(cellX, cellY, this.cellSize, this.cellSize);
            }
        }
    }

    fillCellsAroundEdges() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
                if (i === this.rows - 1 || j === 0 || j === this.columns - 1) {
                    this.grid[i][j] = 1;
                }
            }
        }
    }

    startGame() {
        this.lastMoveTime = performance.now();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    gameOver() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        cancelAnimationFrame(this.animationId);
        this.ctx.fillText('Game Over', this.canvas.width / 2 - 100, this.canvas.height / 2);

        let savedUsername = localStorage.getItem('username');

        if (savedUsername !== null) {
            if (savedUsername.length > 0) {
                RecordManager.addRecord(savedUsername, (this.level - 1) * this.scoreThreshold + this.score);
            }
        }

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 3000);
    }

    gameLoop(timestamp) {
        const elapsedTime = timestamp - this.lastMoveTime;

        if (elapsedTime >= this.moveInterval) {
            this.lastMoveTime = timestamp;

            if (!this.moveCurrentTetrominoDown()) {
                this.clearFullRows();
                this.currentTetromino = this.nextTetromino
                this.nextTetromino = this.spawnNewTetromino();

                if(!this.canSpawnTetromino(this.nextTetromino)) {
                    this.gameOver();
                    return;
                }
            }
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
        this.drawTetromino();
        this.drawNextTetromino();

        if (this.score >= this.scoreThreshold) {
            this.moveInterval = Math.max(150, Math.floor(this.moveInterval * 0.9));
            this.score = 0;
            this.level += 1;
        }


        let savedUsername = localStorage.getItem('username');

        if (!savedUsername || savedUsername.length === 0) {
            savedUsername = "User";
        }

        document.getElementById('player').innerText = `Player: ${savedUsername}`;
        document.getElementById('score').innerText = `Score: ${this.score} / ${this.scoreThreshold}`;
        document.getElementById('level').innerText = `Level: ${this.level}`;
        this.animationId = requestAnimationFrame(this.gameLoop.bind(this));
    }

    handleKeyPress(event) {
        const key = event.key;
        switch (key) {
            case 'Enter':
                while(this.moveCurrentTetrominoDown());
                break;
            case 'ArrowUp':
                this.rotateCurrentTetromino();
                break;
            case 'ArrowDown':
                this.moveCurrentTetrominoDown();
                break;
            case 'ArrowLeft':
                this.moveCurrentTetrominoLeft();
                break;
            case 'ArrowRight':
                this.moveCurrentTetrominoRight();
                break;
        }
    }

    rotateCurrentTetromino() {
        if (this.currentTetromino) {
            this.currentTetromino.rotate(this.grid);
        }
    }

    moveCurrentTetrominoDown() {
        if (this.currentTetromino) {
            return this.currentTetromino.move(this.grid, 0, 1);
        }
    }

    moveCurrentTetrominoLeft() {
        if (this.currentTetromino) {
            return this.currentTetromino.move(this.grid, -1, 0);
        }
    }

    moveCurrentTetrominoRight() {
        if (this.currentTetromino) {
            return this.currentTetromino.move(this.grid, 1, 0);
        }
    }

    canSpawnTetromino(tetromino) {
        const occupiedCoordinates = tetromino.getOccupiedCoordinates();

        for (const coord of occupiedCoordinates) {
            if (this.grid[coord.y][coord.x] === 1) {
                return false;
            }
        }

        return true;
    }
    spawnNewTetromino() {
        const tetrominoShapes = [
            [[1, 1, 1, 1]],
            [[1, 1], [1, 1]],
            [[1, 1, 0], [0, 1, 1]],
            [[0, 1, 1], [1, 1, 0]],
            [[0, 1, 0], [1, 1, 1]],
            [[1, 0, 0], [1, 1, 1]],
            [[0, 0, 1], [1, 1, 1]]
        ];

        const randomShape = tetrominoShapes[Math.floor(Math.random() * tetrominoShapes.length)];
        const newTetromino = new Tetromino(randomShape);
        newTetromino.x = Math.floor((this.columns - newTetromino.shape[0].length) / 2);
        newTetromino.y = 0;
        return newTetromino;
    }

    clearFullRows() {
        const rowsToRemove = [];
        for (let row = 0; row < this.rows - 1; row++) {
            if (this.grid[row].every(cell => cell === 1)) {
                rowsToRemove.push(row);
            }
        }

        for (const rowIndex of rowsToRemove) {
            this.grid.splice(rowIndex, 1);
            this.score += 100;
        }

        for (let i = 0; i < rowsToRemove.length; i++) {
            const newRow = new Array(this.columns).fill(0);
            newRow[0] = 1;
            newRow[newRow.length-1] = 1
            this.grid.unshift(newRow);
        }
    }


    drawNextTetromino() {
        const ctx = this.nextTetrominoCanvas.getContext('2d');
        const borderSize = 4;

        ctx.clearRect(0, 0, this.nextTetrominoCanvas.width, this.nextTetrominoCanvas.height);
        ctx.strokeStyle = this.ctx.strokeStyle;
        ctx.fillStyle = this.ctx.fillStyle;

        if (this.nextTetromino) {
            for (let row = 0; row < this.nextTetromino.shape.length; row++) {
                for (let col = 0; col < this.nextTetromino.shape[row].length; col++) {
                    const cellX = col * this.cellSize;
                    const cellY = row * this.cellSize;

                    if (this.nextTetromino.shape[row][col] === 1) {
                        ctx.fillRect(cellX + borderSize / 2, cellY + borderSize / 2, this.cellSize - borderSize, this.cellSize - borderSize);
                        ctx.strokeRect(cellX, cellY, this.cellSize, this.cellSize);
                    }

                }
            }
        }
    }





}

const tetrisGame = new TetrisGame();

