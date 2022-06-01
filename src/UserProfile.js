import { ref, get, set, child } from "firebase/database";
import { useState } from "react";
import { useObjectVal } from "react-firebase-hooks/database";
import { auth, db } from "./App";
import { UserSearch } from "./UserSearch";

export const UserInfoRegion = () => {

  const [state, setState] = useState({
    selectedTab: 'myprofile',
    lastSearch: null,
    otherUid: null,
    otherName: null,
  });
  const getButtonClass = buttonName => ((buttonName === state.selectedTab) ? "btn btn-primary" : "btn");
  const selectTab = tabName => setState({...state, selectedTab: tabName });
  const selectUser = (uid, displayName) => {
    if (auth.currentUser != null && auth.currentUser.uid === uid) {
      setState({...state, selectedTab: 'myprofile'});
      return; // We just selected ourselves from the dropdown
    }
    setState({...state, selectedTab: 'otheruser', otherUid: uid, otherName: displayName});
    return; // We selected someone else
  };
  
  const topBar = (
    <div className="btn-group mb-2">
      <button className={getButtonClass('myprofile')}
        onClick={() => selectTab('myprofile')}>
        My Profile
      </button>
      <button className={getButtonClass('findusers')}
        onClick={() => selectTab('findusers')}>
        Find users
      </button>
      { state.otherUid && <button className={getButtonClass('otheruser')}
        onClick={() => selectTab('otheruser')}>
        {state.otherName}
      </button>}
    </div>
  );
  if (state.selectedTab === 'myprofile') 
    return <div>{topBar}<UserProfile uid={auth.currentUser ? auth.currentUser.uid : null} /></div>;
  if (state.selectedTab === 'findusers') {
    return <div>{topBar}<UserSearch defaultKey={state.lastSearch}
      onSearch={key => setState({...state, lastSearch: key})}
      onSelect={(uid, displayName) => selectUser(uid, displayName)} /></div>;
  }
  if (state.selectedTab === 'otheruser') {
    return <div>{topBar}<UserProfile uid={state.otherUid} /></div>;
  }
  return (
    <div>
      {topBar}
    </div>
  );
};

export const UserListing = ({ displayName, profilePicture, leader, className }) => {
  let cname = "break-words w-full flex flex-row items-center my-2";
  if (className) cname =`${cname} ${className}`;
  return (
    <div className={cname}>
      <img className="w-12 h-12 mr-2 self-center rounded-full"
        src={`cowboys/${profilePicture}_tiny.png`} alt={profilePicture}/>
      <span className="font-semibold mr-2">{displayName}</span>
      {leader && <div className="badge bg-amber-200 text-black">Leader</div>}
    </div>
  );
}

export const UserProfile = props =>
{
  const [profile] = useObjectVal(ref(db, `users/${props.uid}`));
  const [soloStats] = useObjectVal(ref(db, `stats/blackjackSolo/${props.uid}`));
  const [multiStats] = useObjectVal(ref(db, `stats/blackjackMulti/${props.uid}`));
  if (!profile) return <p>Sign in to track your stats across games!</p>;

  return (
    <div className="bg-base-200 p-4 rounded-xl">
      <div className="avatar float-left mr-4">
        <div className="w-48 rounded-xl">
          <img src={`cowboys/${profile.profilePicture}.png`} alt="snake" />
        </div>
      </div>
      <h1 className="text-5xl font-bold mb-2">{profile.displayName}</h1>
      <h2 className="text-xl font-semibold">Solo Blackjack</h2>
      <StatsBar stats={soloStats} name="Solo Blackjack" />
      <h2 className="text-xl font-semibold">Multiplayer Blackjack</h2>
      <StatsBar stats={multiStats} name="Multiplayer Blackjack" />
    </div>
  );
}

const StatsBar = ({ stats, name }) => {
  if (!stats) return <p>This user hasn't played {name} yet.</p>;

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