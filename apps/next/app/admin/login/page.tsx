'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { YStack, Card, Input, Button, Text, H1, Spinner } from 'tamagui'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from 'app/utils/firebase'
import { Lock } from '@tamagui/lucide-icons'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setError('')
    setLoading(true)

    try {
      // 1. Connexion Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // 2. Vérification immédiate du rôle
      const userDoc = await getDoc(doc(db, 'users', user.uid))

      if (userDoc.exists() && userDoc.data().role === 'admin') {
        // Succès ! Redirection vers la page principale de l'admin
        router.replace('/admin/users') // Ou '/admin' selon ta structure
      } else {
        // C'est un étudiant/professeur qui essaie de se connecter ici
        await auth.signOut() // On le déconnecte par sécurité
        setError("Ce compte n'a pas les droits d'administration.")
      }
    } catch (err: any) {
      console.error(err)
      setError('Email ou mot de passe incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <YStack
      flex={1}
      justifyContent="center"
      alignItems="center"
      backgroundColor="$background"
      padding="$4"
    >
      <Card padding="$6" width="100%" maxWidth={400} borderWidth={1} borderColor="$borderColor">
        <YStack gap="$4" alignItems="center">
          <YStack backgroundColor="$blue2" padding="$3" borderRadius="$10">
            <Lock size={32} color="$blue10" />
          </YStack>

          <H1 fontSize="$6" textAlign="center">
            Administration
          </H1>
          <Text color="$gray10" textAlign="center" marginBottom="$2">
            Connectez-vous pour accéder au dashboard
          </Text>

          {error ? (
            <Text color="$red10" fontSize="$3" textAlign="center" fontWeight="bold">
              {error}
            </Text>
          ) : null}

          <YStack width="100%" gap="$3">
            <Input
              placeholder="Email administrateur"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Input
              placeholder="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Button
              theme="blue"
              marginTop="$2"
              onPress={handleLogin}
              disabled={loading}
              icon={loading ? <Spinner /> : undefined}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </YStack>
        </YStack>
      </Card>
    </YStack>
  )
}
