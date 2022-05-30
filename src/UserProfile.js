import { ref, get, set, child } from "firebase/database";
import { useObjectVal } from "react-firebase-hooks/database";
import { db } from "./App";

export const UserProfile = props =>
{
  const [profile] = useObjectVal(ref(db, `users/${props.uid}`));
  const [soloStats] = useObjectVal(ref(db, `stats/blackjackSolo/${props.uid}`));
  const [multiStats] = useObjectVal(ref(db, `stats/blackjackMulti/${props.uid}`));
  if (!profile) return null;
  if (!soloStats || !multiStats) return null;

  return (
    <div className="bg-base-200 p-4 rounded-xl">
      <div className="avatar float-left mr-4">
        <div className="w-48 rounded-xl">
          <img src={`cowboys/${profile.profilePicture}.png`} alt="snake" />
        </div>
      </div>
      <h1 className="text-5xl font-bold mb-2">{profile.displayName}</h1>
      <h2 className="text-xl font-semibold">Solo Blackjack</h2>
      <StatsBar stats={soloStats} />
      <h2 className="text-xl font-semibold">Multiplayer Blackjack</h2>
      <StatsBar stats={multiStats} />
    </div>
  );
}

const StatsBar = ({ stats }) => {
  const { wins, losses, ties } = stats;
  const nGames = wins + losses + ties;
  return (
    <div className="relative pt-1">
      <div className="overflow-hidden mb-4 text-sm flex rounded bg-amber-200">
        <div style={{ width: `${wins/nGames*100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-success text-success-content">{wins}</div>
        <div style={{ width: `${losses/nGames*100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-error text-error-content">{losses}</div>
        <div style={{ width: `${ties/nGames*100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-warning text-warning-content">{ties}</div>
      </div>
    </div>
  );
};

const cowboyAnimals = ['snake', 'walrus', 'elephant', 'zebra'];
const randomAnimal = () => cowboyAnimals[Math.floor(Math.random() * cowboyAnimals.length)];

// If a user profile doesn't exist, then create one
export const createUserProfile = async (uid) => {
  console.log(`users/${uid}`);

  const profileSnap = await get(child(ref(db), `users/${uid}`));

  if (!profileSnap.exists())
  {
    const profileRef = ref(db, `users/${uid}`);
    const profileData = {
      displayName: generateUsername(),
      profilePicture: randomAnimal()
    };
    await set(profileRef, profileData);
    return "Hello! Created user profile.";
  }
  return "Welcome back!";
}



const adjectives = ['Western','Skilled','Enormous','Scorching','Poisonous','Shady','Spurious','Spikey','Golden','Goodshot','Smoking','Ugly','Bad','Broken','Fantastic','SmallTown','Reckless','Fierce','Brave','Dusty','Stompin','Drunk','Yeehawin','Flashy','Fistfightin'];
const nouns = ['Cowboy','Cowgirl','Wrangler','Cactus','Tumbleweed','Sheriff','Bartender','Tractor','Pistol','Whiskey','DustBunny','Maverick','Boots','Rifle','Spaghetti','Duelist','Drunkard','Cowbell','Ranger','Lasso','HeatWave','GoldMine','Harlot','Cowhide','Stirrup'];

const generateUsername = () => {
  const i1 = Math.floor(Math.random() * adjectives.length);
  const i2 = Math.floor(Math.random() * nouns.length);
  const i3 = Math.floor(Math.random() * 100);
  return `${adjectives[i1]}${nouns[i2]}${i3}`;
}