import { ref } from "firebase/database";
import { useObjectVal } from "react-firebase-hooks/database";
import { db } from "./App";

export const UserProfile = props =>
{
  const [profile] = useObjectVal(ref(db, `users/${props.uid}`));
  const [record] = useObjectVal(ref(db, `stats/blackjackSolo/${props.uid}`));

  return (
    <div>
      <h1>My Profile</h1>
      <p>Display name: {profile && profile.displayName}</p>
      <p>Blackjack record: {record && record.wins} wins, {record && record.losses} losses, {record && record.ties} ties</p>
    </div>
  );
}