import { Button, Input, YStack, Text, H2, Spacer } from 'tamagui'
import { useState } from 'react'
import { signUp } from '../../services/auth-service'
import { useRouter } from 'expo-router' 

export function SignUpScreen({ onNext }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const router = useRouter()

  const handleSignUp = async () => {
    await signUp(form.email, form.password)
    onNext()
  }

  return (
     <YStack
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="$4"
      backgroundColor="$background"
    >
    <H2>S'inscrire</H2>
    <Spacer size="$4" />
    <YStack p="$4" gap="$4">
      <Input placeholder="Email" onChangeText={(t) => setForm({ ...form, email: t })} />
      <Input
        placeholder="Mot de passe"
        secureTextEntry
        onChangeText={(t) => setForm({ ...form, password: t })}
      />
      <Button onPress={handleSignUp}>S'inscrire</Button>
      <Text textAlign="center">Ou s'inscrire avec</Text>
      <Button>Google</Button>
      <Button>Apple</Button>
      <Button
        onPress={() => {
        router.push('/login')
        }}
      >
        Déjà un compte ? Se connecter
      </Button>
    </YStack>
        </YStack>
  )
}
