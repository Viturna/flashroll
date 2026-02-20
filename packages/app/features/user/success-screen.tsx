import { Button, Input, Paragraph, YStack, H2 } from 'tamagui'
import { useState } from 'react'

export function SuccessScreen({ onFinish }) {
  return (
    <YStack flex={1} justifyContent="center" alignItems="center" p="$4">
      <H2>Inscription réussie !</H2>
      <Paragraph>Votre profil est en attente de validation.</Paragraph>
      <Button onPress={onFinish}>Accéder à l'accueil</Button>
    </YStack>
  )
}
