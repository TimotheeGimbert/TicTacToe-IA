class Morpion {
	humanPlayer = 'J1';
	iaPlayer = 'J2';
  turn = 0;
	gameOver = false;

	gridMap = [
		[null, null, null],
		[null, null, null],
		[null, null, null],
	];

  log = [];
  difficulty = 'hard';

	constructor(firstPlayer = 'J1') {
		this.humanPlayer = firstPlayer;
		this.iaPlayer = (firstPlayer === 'J1') ? 'J2' : 'J1';
		this.initGame();
	}

	initGame = () => {
    const storedLog = JSON.parse(localStorage.getItem('game log'));
    if (storedLog !== null) {
      this.log = storedLog;
      storedLog.map((hit) => this.drawHit(hit['x'], hit['y'], hit['player']))
    }

		this.gridMap.forEach((line, y) => {
			line.forEach((cell, x) => {
				this.getCell(x, y).onclick = () => this.doPlayHuman(x, y);
			});
		});
		if (this.iaPlayer === 'J1') this.doPlayIa();

    document.getElementById('difficulty').innerHTML = this.difficulty;
    document.getElementById('replayBtn').addEventListener('click', () => this.replay());
    document.getElementById('undoBtn').addEventListener('click', () => this.undo());
    document.getElementById('redoBtn').addEventListener('click', () => this.redo());
    //document.getElementById('logBtn').addEventListener('click', () => console.log(this.log, this.gridMap));
    document.getElementById('difficultyBtn').addEventListener('click', () => this.changeDifficulty());
	}

  changeDifficulty = () => {
    this.difficulty = 
      this.difficulty === 'hard' ? 'easy' : 
        this.difficulty === 'easy' ? 'medium' : 'hard';
    document.getElementById('difficulty').innerHTML = this.difficulty;
    console.log(this.difficulty)
  }

  replay = () => {
    localStorage.removeItem('game log');
    this.gridMap = [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ];
  }

	getCell = (x, y) => {
		const column = x + 1;
		const lines = ['A', 'B', 'C'];
		const cellId = `${lines[y]}${column}`;
		return document.getElementById(cellId);
	}

	drawHit = (x, y, player) => {
		if (this.gridMap[y][x] !== null) return false;
    this.gridMap[y][x] = player;
    this.turn += 1;
		this.getCell(x, y).classList.add(`filled-${player}`);
    this.saveInLog(x, y , player);
		this.checkWinner(player);
		return true;
	}

  saveInLog = (x, y , player) => this.log.push( { player: player, x: x, y: y  } );
  saveLogInStorage = () => localStorage.setItem('game log', JSON.stringify(this.log));

  undo = () => {
    const undoHit = () => {
      const lastHit = this.log.splice(-1)[0];
      if (lastHit === undefined) return;
      const x = lastHit['x'];
      const y = lastHit['y'];
      const player = lastHit['player'];
      this.getCell(x, y).classList.remove(`filled-${player}`);
      this.gridMap[y][x] = null;
      this.turn -= 1;
    }
    undoHit();
    undoHit();
  }

  redo = () => {
    const redoHit = () => {
      const storedLog = JSON.parse(localStorage.getItem('game log'));
      if (storedLog === null) return;
      const nextHit = storedLog[this.log.length];
      if (nextHit === undefined) return;
      const x = nextHit['x'];
      const y = nextHit['y'];
      const player = nextHit['player'];
      this.drawHit(x, y, player);
    }
    redoHit();
    redoHit();
  }

	doPlayHuman = (x, y) => {
		if (this.gameOver) {
			return;
		}

		if (this.drawHit(x, y, this.humanPlayer)) {
      this.saveLogInStorage();
			this.doPlayIa();
		}
	}

	doPlayIa = () => {
		if (this.gameOver) return;
    const getStrat = () => {
      switch(this.difficulty) {
        case 'hard':
          return this.minmaxStrat(this.gridMap, 0, -Infinity, Infinity, true);
        case 'medium':
          return this.mediumStrat(this.gridMap);
        case 'easy':
          return this.randomStrat(this.gridMap);
      }
    }
    
    const {x, y} = getStrat();
    this.drawHit(x, y, this.iaPlayer);
    this.saveLogInStorage();
	}

  getBoardWinner = (board) => {
    const isWinningRow = ([a, b, c]) => (
        a !== null && a === b && b === c
    );

    let winner = null;

    // Horizontal
    board.forEach((line) => {
        if (isWinningRow(line)) {
            winner = line[0];
        }
    });

    // Vertical
    [0, 1, 2].forEach((col) => {
        if (isWinningRow([board[0][col], board[1][col], board[2][col]])) {
            winner = board[0][col];
        }
    });

    if (winner) {
        return winner;
    }

    // Diagonal
    const diagonal1 = [board[0][0], board[1][1], board[2][2]];
    const diagonal2 = [board[0][2], board[1][1], board[2][0]];
    if (isWinningRow(diagonal1) || isWinningRow(diagonal2)) {
        return board[1][1];
    }

    const isFull = board.every((line) => (
  line.every((cell) => cell !== null)
));
    return isFull ? 'tie' : null;
}

  checkWinner = (lastPlayer) => {
    const displayEndMessage = (message) => {
      const endMessageElement = document.getElementById('end-message');
      endMessageElement.textContent = message;
      endMessageElement.style.display = 'block';
    }
    const winner = this.getBoardWinner(this.gridMap);
    if (!winner) return;
  
    this.gameOver = true;
    switch(winner) {
      case 'tie':
        displayEndMessage("Vous êtes à égalité !");
        break;
      case this.iaPlayer:
        displayEndMessage("L'IA a gagné !");
        break;
      case this.humanPlayer:
        displayEndMessage("Tu as battu l'IA !");
        break;
    }
  }

  randomStrat = (board) => {
    let possibleHits = [];
    board.forEach( (line, y) => {
      line.forEach( (cell, x) => {
        if (cell === null) possibleHits.push({x: x, y: y})
      });
    });
    const randomPosition = Math.floor(Math.random() * possibleHits.length);
    const randomHit = possibleHits[randomPosition];
    return randomHit;
  }

  mediumStrat = (board) => {
    let possibleHits = [];
    board.forEach( (line, y) => {
      line.forEach( (cell, x) => {
        if (cell === null) possibleHits.push({x: x, y: y})
      });
    });

    const isTestHitWinner = (x, y, player) => {
      this.gridMap[y][x] = player;
      const winner = this.getBoardWinner(this.gridMap);
      console.log(winner);
      this.gridMap[y][x] = null;
      return winner === player ? true : false;
    }


    const findBest = (player) => {
      const bestCell = {'x': null, 'y': null};
      possibleHits.forEach( (cell) => {
        const x = cell['x'];
        const y = cell['y'];
        if (isTestHitWinner(x, y, player)) {
          bestCell['x'] = x;
          bestCell['y'] = y;
        }
      });
      if (bestCell['x'] !== null) {
        const x = bestCell['x'];
        const y = bestCell['y'];
        return {x, y}
      }
    }
    if (findBest(this.iaPlayer)) return findBest(this.iaPlayer);
    else if (findBest(this.humanPlayer)) return findBest(this.humanPlayer);
    else return this.randomStrat(this.gridMap);
  }

  minmaxStrat = (board, depth, alpha, beta, isMaximizing) => {
    // Return a score when there is a winner
    const winner = this.getBoardWinner(board);
    if (winner === this.iaPlayer) {
        return 10 - depth;
    }
    if (winner === this.humanPlayer) {
        return depth - 10;
    }
    if (winner === 'tie' && this.turn === 9) {
        return 0;
    }
    const getSimulatedScore = (x, y, player) => {
      board[y][x] = player;
      this.turn += 1;
      const score = this.minmaxStrat(
          board,
          depth + 1,
          alpha,
          beta,
          player === this.humanPlayer
      );
      board[y][x] = null;
      this.turn -= 1;
      return score;
    };
    // This tree is going to test every move still possible in game
    // and suppose that the 2 players will always play there best move.
    // The IA search for its best move by testing every combinations,
    // and affects score to every node of the tree.
    if (isMaximizing) {
      // The higher is the score, the better is the move for the IA.
      let bestIaScore = -Infinity;
      let optimalMove;
      for (const y of [0, 1, 2]) {
        for (const x of [0, 1, 2]) {
          if (board[y][x]) {
              continue;
          }
          const score = getSimulatedScore(x, y, this.iaPlayer);
          if (score > bestIaScore) {
              bestIaScore = score;
              optimalMove = { x, y };
          }
          // clear useless branch of the algorithm tree
          // (optional but recommended)
          alpha = Math.max(alpha, score);
          if (beta <= alpha) {
              break;
          }
        }
      }
      return (depth === 0) ? optimalMove : bestIaScore;
    }
    // The lower is the score, the better is the move for the player.
    let bestHumanScore = Infinity;
    for (const y of [0, 1, 2]) {
      for (const x of [0, 1, 2]) {
        if (board[y][x]) {
            continue;
        }
        const score = getSimulatedScore(x, y, this.humanPlayer);
        bestHumanScore = Math.min(bestHumanScore, score);
        // clear useless branch of the algorithm tree
        // (optional but recommended)
        beta = Math.min(beta, score);
        if (beta <= alpha) {
            break;
        }
      }
    }
    return bestHumanScore;
  }
}
