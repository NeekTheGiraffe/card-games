import { auth } from './firebase-config'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'

const SignIn = () => {

    const signInWithGoogle = () => {
      const provider = new GoogleAuthProvider();
      signInWithPopup(auth, provider);
    }
  
    return (
      <>
        <a class="navbar-item" onClick={signInWithGoogle}>Sign in with Google</a>
      </>
    )
  
}

export default SignIn