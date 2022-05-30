import { ref, get, set, child } from "firebase/database";
import { useObjectVal } from "react-firebase-hooks/database";
import { db } from "./App";

export const UserProfile = props =>
{
  const [profile] = useObjectVal(ref(db, `users/${props.uid}`));
  const [record] = useObjectVal(ref(db, `stats/blackjackSolo/${props.uid}`));

  return (
    <div className="hero bg-base-200">
      <div className="hero-content flex-col">
        <div className="flex flex-row">
          <div className="avatar">
            <div className="w-48 rounded-xl">
              <img src={`cowboys/${profile && profile.profilePicture}.png`} alt="snake" />
            </div>
          </div>
          <h1 className="text-5xl font-bold">{profile && profile.displayName}</h1>
        </div>
        <p>Blackjack record: {record && record.wins} wins, {record && record.losses} losses, {record && record.ties} ties</p>
      </div>
    </div>
  );
}

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