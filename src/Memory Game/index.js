import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import cardBack from './cardBack.jpg';
import banner from './banner.jpg';
import four from './four.png';
import Jack from './Jack.png';
import Joker from './Joker.jpg';
import King from './King.png';
import Queen from './Queen.png';
import suits from './suits.jpg';
import ten from './ten.png';
import circle from './circle.png';

class Square extends React.Component {
    render() {
        return (
            <button className="square"
               onClick = {() => this.props.onClick()}>
              {images[this.props.value]}
            </button>
        );
  }
}

let initialFlip = [];
let isOver=[];
for(let i=0; i < 16; i++) {
    initialFlip[i] = false;
    isOver[i]=false;
}
  
class Board extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            numberOfClicks: 0,
            numberOfFound: 0,
            previousClick2: null,
            previousClick: null,
            numbers: randImages(),
            isFliped: initialFlip,
            winner: null,
            isOver: initialFlip
        };

        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(i) {
        this.setState({numberOfClicks: (this.state.numberOfClicks+1)});
        if(this.state.previousClick2 === null) {
            initialFlip[i]=true;
            this.setState({isFliped: initialFlip,
                        previousClick: i});
        } else {
            initialFlip[i]=true;
            if(!(this.state.numbers[this.state.previousClick2] ===
                this.state.numbers[i])) {
            initialFlip[this.state.previousClick2]=false;
            this.setState({isFliped: initialFlip,
                        previousClick: i,
                        previousClick2: null});
            } else {
                isOver[this.state.previousClick2]=true;
                isOver[i]=true;
                this.setState({numberOfFound: (this.state.numberOfFound+1)});
                initialFlip[i]=true;
                this.setState({isFliped: initialFlip,
                            isOver: isOver,
                            previousClick: null,
                            previousClick2: null})
            }
        }
    }

    handleClcikToInitialState(i) {
        this.setState({numberOfClicks: (this.state.numberOfClicks+1)});
        initialFlip[i]=true;

        if (!(this.state.numbers[this.state.previousClick] ===
            this.state.numbers[i])) {
            initialFlip[this.state.previousClick]=false;
            this.setState({isFliped: initialFlip,
                previousClick: null,
                previousClick2: i});
        }
        else {
            isOver[this.state.previousClick]=true;
            isOver[i]=true;
            this.setState({numberOfFound: (this.state.numberOfFound+1)});
            initialFlip[i]=true;
            this.setState({isFliped: initialFlip,
                            isOver: isOver,
                            previousClick: null,
                            previousClick2: null})
        }
    }

    handleStartOver() {
        for(let i=0; i < 16; i++) {
            isOver[i]=false;
        }
        initialFlip = isOver;
          
        this.setState({
            numberOfClicks: 0,
            numberOfFound: 0,
            previousClick2: null,
            previousClick: null,
            numbers: randImages(),
            isFliped: isOver,
            winner: null,
            isOver: isOver
        });
    }

    renderSquare(i) {
        let value;
        if(!this.state.isFliped[i]) {
            value=0;
        }
        else {
            value=this.state.numbers[i];
        }
      return ( <Square 
        onClick={() => {
            if(this.state.previousClick == null) {
                if(!this.state.isOver[i]) {
                    this.handleClick(i);
                } else {
                    return;
                }
            } 
            else {
                if(!this.state.isOver[i]){
                    this.handleClcikToInitialState(i);
                } else {
                    return;
                }
            } 
          }
        }
        value={value}
      /> );
    }

    calculateWinner() {
        for(let i=0; i < 16; i++){
            if(!this.state.isOver[i]){
                return false;
            }
        }
        return true;
    }
  
    render() {
        let grid = [];

        for (let i=0; i <= 3; i++) {
            let gridrow = [];
            for (let j = (4*i); j <= (3+4*i); j++) {
                gridrow.push(this.renderSquare(j));
            }

            grid.push(<div className="board-row">
                        {gridrow}
                    </div>);
        }

        if (!this.calculateWinner()) {    
            return (<div>
                    <div className='grid'>
                        {grid}
                    </div>
                    <div className="statatistics">
                        <p1>
                        <br></br>
                            The number of clicks: {this.state.numberOfClicks}
                        <br></br>
                            The number of pairs found: {this.state.numberOfFound}
                        <br></br>
                            There are {8-this.state.numberOfFound} pairs 
                            left to find!
                        <br></br>
                        <br></br>
                        </p1>
                    </div>
                </div>);
        }
        else {
            return (<div>
                <div className='grid'>
                    {grid}
                </div>
                <div className="statatistics">
                    <p1>You won the game!
                        <br></br>
                        Total number of clicks: 
                        {this.state.numberOfClicks}
                        <br></br>
                    </p1>
                    <button className="startOver"
                    onClick={() => this.handleStartOver()}>
                        Start over!
                    </button>
                </div>
            </div>
          );
        }
    }
}

class MemoryGame extends React.Component {
    render() {
        return (
            <div className="game">
                <div className="game-board">
                    <Board />
                    <p1 className="headerText">
                        <br></br>
                        <br></br>
                        <br></br>
                        Game Rules
                        <br></br>
                    </p1>
                    <p1 className="rules">
         The rules for this memory game are pretty simple. 
         The game board contains 8 pairs of two identical 
         cards. Once clicked on the card, it is flipped. If 
         two consecutive flips are the same card then a pair 
         is found, otherwise the card previously flipped is 
         being flipped back. The game is over once all the 
         pairs are found.</p1>
                </div>
            </div>
        )
    }
}

const images = {
    9: <img src={circle} alt="clear"
    width="100" height="140"/>, 
    0: <img src={cardBack} alt="back of a card"
    width="100" height="140"/>,
    1: <img src={banner} alt="back of a card"
    width="100" height="120"/>,
    2: <img src={four} alt="back of a card"
    width="100" height="140"/>,
    3: <img src={Jack} alt="back of a card"
    width="100" height="130"/>,
    4: <img src={Joker} alt="back of a card"
    width="100" height="140"/>,
    5: <img src={King} alt="back of a card"
    width="95" height="140"/>,
    6: <img src={Queen} alt="back of a card"
    width="100" height="140"/>,
    7: <img src={suits} alt="back of a card"
    width="100" height="140"/>,
    8: <img src={ten} alt="back of a card"
    width="95" height="140"/>
}


function randImages() {
    let numbers = [];
    for (let i = 0; i < 8; i++) {
        numbers[i] = i + 1;
    }
    for (let i =8; i < 16; i++) {
        numbers[i] = i - 7;
    }

    function shuffleArray (array) {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const temp = array[i];
          array[i] = array[j];
          array[j] = temp;
        }

        return array;
    }

    numbers = shuffleArray(numbers);

    return numbers;
}


export default MemoryGame;
