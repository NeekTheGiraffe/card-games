import { ref } from "firebase/database";
import FuzzySearch from "fuzzy-search";
import { useState } from "react";
import { useObjectVal } from "react-firebase-hooks/database";
import { db } from "./App";
import { UserListing } from "./UserProfile";

export const UserSearch = ({ defaultKey, onSearch }) => {

  const [searchKey, setSearchKey] = useState(defaultKey);
  const search = sKey => { setSearchKey(sKey); onSearch(sKey); }
  return (
    <div>
      <UserSearchForm onSubmit={formValue => search(formValue)} defaultKey={defaultKey} />
      <UserSearchResult searchKey={searchKey} />
    </div>
  );
};

const UserSearchForm = props => {

  const [formValue, setFormValue] = useState(props.defaultKey != null ? props.defaultKey : '');
  const handleSubmit = event => {
    event.preventDefault();
    props.onSubmit(formValue);
  };
  const handleChange = event => setFormValue(event.target.value != null ? event.target.value : '');

  return (
    <form onSubmit={handleSubmit}>
      <div className="input-group mb-2">
        <input className="input input-bordered" type="text" placeholder="Search for users..." value={formValue} onChange={handleChange} />
        <button type="submit" className="btn">Search</button>
      </div>
    </form>
  );
};

const UserSearchResult = props => {

  const [users] = useObjectVal(ref(db, 'users'));
  if (props.searchKey == null) return null;
  if (users == null) return null;
  const mapped = Object.keys(users).map(key => ({ ...users[key], uid: key}));
  const searchResult = searchByUsername(props.searchKey, mapped);
  const resultCards = searchResult.map(user => (
    <div key={user.uid} className="bg-base-200 rounded-lg mb-1 px-2 flex flex-row items-center">
      <UserListing displayName={user.displayName} profilePicture={user.profilePicture} />
      <button className="btn">Profile</button>
    </div>
  ));

  return (
    <div>
      {resultCards}
    </div>
  );
};

export const searchByUsername = (searchKey, users) => {
  let fuzzy = new FuzzySearch(users, ['displayName'], { caseSensitive: false, sort: true });
  return fuzzy.search(searchKey);
};