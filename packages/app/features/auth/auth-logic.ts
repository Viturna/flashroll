import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../../utils/firebase'

async function signUpUser(email, password) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  const user = userCredential.user

  await setDoc(doc(db, 'users', user.uid), {
    email: user.email,
    role: 'student',
    createdAt: new Date(),
  })
}

async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  const result = await signInWithPopup(auth, provider)
  const user = result.user

  await setDoc(
    doc(db, 'users', user.uid),
    {
      email: user.email,
    },
    { merge: true }
  )

  return result
}

export { signUpUser, signInWithGoogle }
