import { auth } from './firebase-config'

const SignOut = () => {
    return auth.currentUser && (
      <a class="navbar-item" onClick={() => auth.signOut()}>Sign Out</a>
    )
}

export default SignOut