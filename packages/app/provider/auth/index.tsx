import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../../utils/firebase'

// Définition de la structure des données utilisateur de ton schéma
interface UserData {
  role: 'admin' | 'teacher' | 'student'
  isValidated: boolean
  profileCompleted: boolean
  firstName?: string
  lastName?: string
}

interface AuthContextType {
  user: User | null
  userData: UserData | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  isLoading: true,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 1. Écouter l'état de connexion Firebase (Auth)
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)

      if (!currentUser) {
        setUserData(null)
        setIsLoading(false)
        return
      }

      // 2. Écouter les changements de rôle/validation en temps réel (Firestore)
      const unsubscribeDoc = onSnapshot(doc(db, 'users', currentUser.uid), (snapshot) => {
        if (snapshot.exists()) {
          setUserData(snapshot.data() as UserData)
        }
        setIsLoading(false)
      })

      return () => unsubscribeDoc()
    })

    return () => unsubscribeAuth()
  }, [])

  return (
    <AuthContext.Provider value={{ user, userData, isLoading }}>{children}</AuthContext.Provider>
  )
}
