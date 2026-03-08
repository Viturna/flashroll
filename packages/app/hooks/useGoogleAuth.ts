import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import * as Google from 'expo-auth-session/providers/google'
import { signInWithGoogleWeb, signInWithGoogleMobile } from '../services/auth-service'

export function useGoogleAuth() {
  const [isLoading, setIsLoading] = useState(false)

  // Configuration Expo Auth Session pour le mobile
  // Note : Il faudra remplacer ces strings par tes vrais ID depuis Google Cloud Console
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: '1:411431933445:web:a5c33348adfad3f6a9ee6c', // Utilisé par Expo Go
    iosClientId: '1:411431933445:ios:bcc19f1cd4be3265a9ee6c',
    androidClientId: '1:411431933445:android:affbad9188e5fd8da9ee6c',
  })

  // Écoute le retour de la popup Google sur Mobile
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params
      if (id_token) {
        setIsLoading(true)
        signInWithGoogleMobile(id_token)
          .catch((err) => console.error('Erreur Mobile Google:', err))
          .finally(() => setIsLoading(false))
      }
    }
  }, [response])

  // La fonction que ton bouton va appeler
  const loginWithGoogle = async () => {
    setIsLoading(true)
    try {
      if (Platform.OS === 'web') {
        await signInWithGoogleWeb()
      } else {
        // Lance la popup du navigateur natif sur mobile
        await promptAsync()
      }
    } catch (error) {
      console.error("Erreur d'authentification Google:", error)
    } finally {
      if (Platform.OS === 'web') setIsLoading(false)
      // Sur mobile, le finally se fait dans le useEffect
    }
  }

  return {
    loginWithGoogle,
    isLoading,
    isReady: Platform.OS === 'web' || !!request, // Le bouton est désactivé tant que Google n'est pas prêt
  }
}
