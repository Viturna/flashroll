import { Button, Input, YStack, H2 } from 'tamagui'
import { useState } from 'react'
import { updateProfile } from '../auth/auth-service'

export function ProfileSetupScreen({ onComplete }) {
  const [profile, setProfile] = useState({ firstName: '', lastName: '', birthDate: '', class: '' })

  const handleSave = async () => {
    await updateProfile(profile)
    onComplete()
  }

  return (
    <YStack p="$4" gap="$4">
      <H2>Compléter le profil</H2>
      <Input placeholder="Prénom" onChangeText={(t) => setProfile({ ...profile, firstName: t })} />
      <Input placeholder="Nom" onChangeText={(t) => setProfile({ ...profile, lastName: t })} />
      <Input
        placeholder="Date de naissance (JJ/MM/AAAA)"
        onChangeText={(t) => setProfile({ ...profile, birthDate: t })}
      />
      <Input
        placeholder="Classe / Groupe"
        onChangeText={(t) => setProfile({ ...profile, class: t })}
      />
      <Button onPress={handleSave}>Finaliser</Button>
    </YStack>
  )
}
