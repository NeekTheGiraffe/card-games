import { ref } from "firebase/database";
import FuzzySearch from "fuzzy-search";
import { useState } from "react";
import { useObjectVal } from "react-firebase-hooks/database";
import { db } from "./App";

export const UserSearch = props => {

  const [searchKey, setSearchKey] = useState(null);
  const search = sKey => setSearchKey(sKey);
  return (
    <div>
      <UserSearchForm onSubmit={formValue => search(formValue)} />
      <UserSearchResult searchKey={searchKey} />
    </div>
  );
};

const UserSearchForm = props => {

  const [formValue, setFormValue] = useState('');
  const handleSubmit = event => {
    event.preventDefault();
    props.onSubmit(formValue);
  };
  const handleChange = event => setFormValue(event.target.value);

  return (
    <form onSubmit={handleSubmit}>
      <label className="input-group">
        <input type="text" placeholder="Search for users..." value={formValue} onChange={handleChange} />
      </label>
      <button type="submit" className="btn">Search</button>
    </form>
  );
};

const UserSearchResult = props => {

  const [users] = useObjectVal(ref(db, 'users'));
  if (props.searchKey == null) return null;
  const mapped = Object.keys(users).map(key => ({ ...users[key], uid: key}));
  const searchResult = searchByUsername(props.searchKey, mapped);
  const resultCards = searchResult.map(user => <p key={user.uid}>{user.displayName}</p>);

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