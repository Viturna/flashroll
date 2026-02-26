import { useEffect, useState } from 'react'
import { useColorScheme } from 'react-native'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { SplashScreen, Stack, useRouter } from 'expo-router'
import { Provider } from 'app/provider'
import { doc, onSnapshot } from 'firebase/firestore'
import { onAuthStateChanged, User } from 'firebase/auth'

import { db, auth } from 'app/utils/firebase'

export const unstable_settings = {
  initialRouteName: 'index',
}

SplashScreen.preventAutoHideAsync()

export default function App() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [authInitialized, setAuthInitialized] = useState(false)

  const [interLoaded, interError] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  })

  // Écouter l'état de connexion Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthInitialized(true)
    })
    return () => unsubscribe()
  }, [])

  // Cacher le Splash Screen
  useEffect(() => {
    if ((interLoaded || interError) && authInitialized) {
      SplashScreen.hideAsync()
    }
  }, [interLoaded, interError, authInitialized])

  //  Système d'attente et redirection selon Firestore
  useEffect(() => {
    if (!user) return

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnapshot) => {
      const data = docSnapshot.data()

      if (data?.isValidated || data?.role === 'teacher' || data?.role === 'admin') {
        switch (data?.role) {
          case 'teacher':
            router.replace('/(teacher)')
            break
          case 'admin':
            router.replace('/(admin)')
            break
          case 'student':
            router.replace('/(student)')
            break
          default:
            console.warn('Rôle inconnu:', data?.role)
            router.replace('/waiting')
        }
      }
    })

    return () => unsubscribe()
  }, [user, router])

  if (!interLoaded && !interError) {
    return null
  }

  return <RootLayoutNav />
}

function RootLayoutNav() {
  const colorScheme = useColorScheme()

  return (
    <Provider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </Provider>
  )
}
