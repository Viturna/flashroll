import { Button, Input, YStack, Text, H2, Spacer } from 'tamagui'
import { useState } from 'react'
import { login, signInWithGoogle } from '../../services/auth-service'
import { useRouter } from 'expo-router' 

export function LoginScreen() {
  const router = useRouter() // Initialisation du router
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    try {
      await login(email, password)
    } catch (error) {
      console.error('Erreur de connexion:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <YStack
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="$4"
      backgroundColor="$background"
    >
      <H2>Connexion 🔐</H2>
      <Spacer size="$4" />

      <YStack gap="$2" width="100%" maxWidth={300}>
        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input
          placeholder="Mot de passe"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Button backgroundColor="$blue10" onPress={handleLogin} disabled={loading}>
          <Text color="white">{loading ? 'Chargement...' : 'Se connecter'}</Text>
        </Button>
      </YStack>

      <Spacer size="$4" />

      {/* Nouveau bouton pour l'inscription */}
      <YStack alignItems="center" gap="$2">
        <Text color="$gray10">Pas encore de compte ?</Text>
        <Button
          onPress={() => router.push('/signup')} // Redirection vers la page d'inscription
          borderWidth={0}
        >
          <Text color="$blue10" fontWeight="bold">
            Créer un compte
          </Text>
        </Button>
      </YStack>

      <Spacer size="$4" />
      <Text color="$gray10">— OU —</Text>
      <Spacer size="$4" />

      <YStack gap="$2" width="100%" maxWidth={300}>
        <Button onPress={() => signInWithGoogle()}>Connexion avec Google</Button>
        <Button>Connexion avec Apple</Button>
      </YStack>
    </YStack>
  )
}
