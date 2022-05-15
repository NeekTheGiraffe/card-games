import { auth } from './firebase-config'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { useAuthState } from 'react-firebase-hooks/auth';

import SignIn from './SignIn'
import SignOut from './SignOut'

const Navbar = () => {
    const [user] = useAuthState(auth);
    return (
      <nav class='navbar has-shadow'>
        <div class='navbar-brand'>
          <a class='navbar-item'>The Card Game Cowboys</a>
        </div>
        <div class='navbar-menu'>
          <div class='navbar-start'></div>
          <div class='navbar-end'>
            <a class ='navbar-item' href='/'>Home</a>
            <a class ='navbar-item' href='/profile'>Profile</a>
            {user ? <SignOut /> : <SignIn />}
          </div>
        </div>
      </nav>
    );
}

export default Navbar