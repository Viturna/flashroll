import { Button, Input, YStack, Text } from 'tamagui'
import { useState } from 'react'
import { signUp } from './auth-service'

export function SignUpScreen({ onNext }) {
  const [form, setForm] = useState({ email: '', password: '' })

  const handleSignUp = async () => {
    await signUp(form.email, form.password)
    onNext()
  }

  return (
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
          /* navigate login */
        }}
      >
        Déjà un compte ? Se connecter
      </Button>
    </YStack>
  )
}
