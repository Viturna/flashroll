import React, { useState, useEffect } from 'react'
import { Linking } from 'react-native'
import { YStack, Text, Spinner, Button } from 'tamagui'
import { User, BarChart2, Mail, LogOut } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'

// Imports Firebase & Services
import { auth, db } from '../../utils/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { logout } from '../../services/auth-service'

export function ProfileScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = auth.currentUser
        if (currentUser) {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
          if (userDoc.exists()) {
            setUserData(userDoc.data())
          }
        }
      } catch (error) {
        console.error('Erreur récupération profil:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  // --- FONCTION DE DÉCONNEXION ---
  const handleLogout = async () => {
    try {
      await logout()
      router.replace('/(auth)/login')
    } catch (error) {
      console.error('Erreur de déconnexion', error)
      alert('Erreur lors de la déconnexion')
    }
  }

  const handleContactSecretariat = () => {
    Linking.openURL('mailto:secretariat@ecole.fr?subject=Demande%20étudiant')
  }

  if (loading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Spinner size="large" />
      </YStack>
    )
  }

  return (
    <YStack flex={1} padding="$4" gap="$4" marginTop="$6">
      {/* 1. INFO DE PROFIL (Ultra simple) */}
      <YStack alignItems="center" gap="$2" paddingBottom="$4">
        <Text fontSize="$6" fontWeight="bold">
          {userData?.firstName || 'Prénom'} {userData?.lastName || 'Nom'}
        </Text>
        <Text>{userData?.email || 'email@ecole.com'}</Text>
      </YStack>

      {/* 2. BOUTONS D'ACTION (Boutons Tamagui par défaut) */}
      <YStack gap="$3">
        <Button icon={User} onPress={() => router.push('/(teacher)/profile/info')}>
          Informations de profil
        </Button>

        <Button icon={BarChart2} onPress={() => router.push('/student/profile/stats')}>
          Mes statistiques
        </Button>

        <Button icon={Mail} onPress={handleContactSecretariat}>
          Contacter le secrétariat
        </Button>
      </YStack>

      {/* 3. BOUTON DÉCONNEXION (Séparé et rouge) */}
      <YStack marginTop="$4">
        <Button icon={LogOut} theme="red" onPress={handleLogout}>
          Se déconnecter
        </Button>
      </YStack>
    </YStack>
  )
}
