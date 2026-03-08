import { auth, db } from '../utils/firebase'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
} from 'firebase/auth'
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
} from 'firebase/firestore'

/**
 * Inscription initiale (Auth uniquement + Lien avec import CSV)
 */
export const signUp = async (email: string, password: string) => {
  // 1. Firebase Auth crée le compte sécurisé
  const res = await createUserWithEmailAndPassword(auth, email, password)
  const uid = res.user.uid
  const userEmail = email.toLowerCase()

  // 2. On cherche si ce mail a été pré-importé par l'admin (depuis le CSV)
  const q = query(collection(db, 'users'), where('email', '==', userEmail))
  const snap = await getDocs(q)

  if (!snap.empty) {
    // 🏆 MATCH ! L'admin avait importé cet élève.
    const importedDoc = snap.docs[0]
    const prefilledData = importedDoc.data()

    // On crée son VRAI document avec le vrai UID de Firebase Auth
    // en conservant les données métier pré-remplies (groupe, sous-groupes, nom...)
    await setDoc(doc(db, 'users', uid), {
      ...prefilledData,
      uid: uid,
      isRegistered: true, // Il s'est connecté pour de vrai
      createdAt: new Date().toISOString(),
    })

    // On supprime le document temporaire ("import_xxx") pour faire le ménage
    if (importedDoc.id !== uid) {
      await deleteDoc(doc(db, 'users', importedDoc.id))
    }
  } else {
    // ❌ Aucun match : Inscription classique en attente de validation
    await setDoc(doc(db, 'users', uid), {
      uid: uid,
      email: userEmail,
      role: 'student',
      isValidated: false, // L'admin devra le valider
      isRegistered: true,
      createdAt: new Date().toISOString(),
    })
  }

  return res.user
}
// Google connection 
const handleGoogleUserInFirestore = async (user: any) => {
  const userEmail = user.email.toLowerCase()
  const q = query(collection(db, 'users'), where('email', '==', userEmail))
  const snap = await getDocs(q)

  if (!snap.empty) {
    // Le compte a été importé par l'admin via CSV
    const importedDoc = snap.docs[0]
    const prefilledData = importedDoc.data()

    await setDoc(
      doc(db, 'users', user.uid),
      {
        ...prefilledData,
        uid: user.uid,
        isRegistered: true,
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    )

    if (importedDoc.id !== user.uid) {
      await deleteDoc(doc(db, 'users', importedDoc.id))
    }
  } else {
    // Nouvel utilisateur non invité, doit être validé
    const userRef = doc(db, 'users', user.uid)
    const docSnap = await getDoc(userRef)

    // On ne l'écrase pas s'il existe déjà
    if (!docSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: userEmail,
        firstName: user.displayName?.split(' ')[0] || '',
        lastName: user.displayName?.split(' ')[1] || '',
        role: 'student',
        isValidated: false,
        isRegistered: true,
        createdAt: new Date().toISOString(),
      })
    }
  }
}

// Pour le WEB 
export const signInWithGoogleWeb = async () => {
  const provider = new GoogleAuthProvider()
  const res = await signInWithPopup(auth, provider)
  await handleGoogleUserInFirestore(res.user)
  return res.user
}

// Pour le MOBILE
export const signInWithGoogleMobile = async (idToken: string) => {
  const credential = GoogleAuthProvider.credential(idToken)
  const res = await signInWithCredential(auth, credential)
  await handleGoogleUserInFirestore(res.user)
  return res.user
}

/**
 * Mise à jour du profil (Données métier par l'utilisateur)
 */
export const updateProfile = async (data: any) => {
  const user = auth.currentUser
  if (!user) throw new Error('Non authentifié')

  const userRef = doc(db, 'users', user.uid)

  // Utilisation de merge: true au cas où on voudrait ajouter des champs
  // sans écraser ceux mis par l'admin (comme les sous-groupes)
  await updateDoc(userRef, {
    firstName: data.firstName,
    lastName: data.lastName,
    birthDate: data.birthDate,
    group: data.class,
    profileCompleted: true,
  })
}

/**
 * Statistiques pour le Dashboard Admin
 */
export const getAdminStats = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'))
    const users = querySnapshot.docs.map((doc) => doc.data())

    return {
      students: users.filter((u) => u.role === 'student').length,
      teachers: users.filter((u) => u.role === 'teacher').length,
      toValidate: users.filter((u) => u.isValidated === false).length,
      total: users.length,
    }
  } catch (error) {
    console.error('Erreur stats:', error)
    return { students: 0, teachers: 0, toValidate: 0, total: 0 }
  }
}

/**
 * Valide un utilisateur (Admin uniquement)
 */
export const validateUser = async (uid: string) => {
  try {
    const userRef = doc(db, 'users', uid)
    await updateDoc(userRef, {
      isValidated: true,
    })
    return { success: true }
  } catch (error) {
    console.error('Erreur lors de la validation :', error)
    throw error
  }
}

/**
 * Récupère uniquement les utilisateurs en attente de validation
 */
export const getPendingUsers = async () => {
  const q = query(collection(db, 'users'), where('isValidated', '==', false))
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

/**
 * Récupère la totalité des utilisateurs de la base
 */
export const getAllUsers = async () => {
  const querySnapshot = await getDocs(collection(db, 'users'))
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

/**
 * Mise à jour des groupes d'un utilisateur (Admin)
 */
export const updateUserGroups = async (uid: string, groupName: string, subGroups: string[]) => {
  const userRef = doc(db, 'users', uid)
  await updateDoc(userRef, {
    group: groupName,
    subGroups: subGroups,
  })
}

// LOGIN & LOGOUT

export const logout = async () => {
  await auth.signOut()
}

export const login = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password)
}

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider()
  return await signInWithPopup(auth, provider)
}
