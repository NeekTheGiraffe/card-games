// TODO: Pass other props down like className
const Card = props => {
  const { back = false, rank, suit, style = { height: 100 } } = props;
  if (back)
  return <img src={backImgPath} alt="card back" style={style} />;
  const imgPath = `${getCardPath(suit, rank)}`
  return <img src={imgPath} alt={`${rank}${suit}`} style={style} />;
};

export const mapCardArrayToComponents = cardArr => {
  return cardArr.map((card, index) => <Card rank={card.rank} suit={card.suit} back={!card.faceUp} key={index} />);
};

const suitMap = {
  '♦': 'D', '♣': 'C', '♥': 'H', '♠': 'S'
};
const imgDirPath = 'cards';
const backImgPath = `${imgDirPath}/1B.svg`;
const getCardPath = (suit, rank) => {
  if (rank === '10') rank = 'T';
  suit = suitMap[suit];
  return `${imgDirPath}/${rank}${suit}.svg`;
}

export default Card;