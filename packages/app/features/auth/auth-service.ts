import { auth, db } from '../../utils/firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, updateDoc } from 'firebase/firestore'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
/**
 * Inscription initiale (Auth uniquement)
 */
export const signUp = async (email, password) => {
  const res = await createUserWithEmailAndPassword(auth, email, password)
  await setDoc(doc(db, 'users', res.user.uid), {
    uid: res.user.uid,
    email,
    role: 'student',
    isValidated: false,
    createdAt: new Date().toISOString(),
  }) 
  return res.user
}

/**
 * Mise à jour du profil (Données métier)
 */
export const updateProfile = async (data) => {
  const user = auth.currentUser
  if (!user) throw new Error('Non authentifié')

  const userRef = doc(db, 'users', user.uid)
  await updateDoc(userRef, {
    firstName: data.firstName,
    lastName: data.lastName,
    birthDate: data.birthDate,
    group: data.class,
    profileCompleted: true,
  })
}

export const login = async (email, password) => {
  return await signInWithEmailAndPassword(auth, email, password)
}

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider()
  return await signInWithPopup(auth, provider)
}
