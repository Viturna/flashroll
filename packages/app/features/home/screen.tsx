'use client'

import { Button, H1, Paragraph, Separator, XStack, YStack } from '@my/ui'
import { SwitchThemeButton } from '@my/ui'
import { Platform } from 'react-native'
import { LoginScreen } from '../auth/login-screen'
import { useState } from 'react'

export function HomeScreen() {
  const [showAuth, setShowAuth] = useState(false)

  if (showAuth) {
    return <LoginScreen />
  }

  return (
    <YStack flex={1} justifyContent="center" alignItems="center" gap="$8" p="$4" bg="$background">
      <XStack
        position="absolute"
        width="100%"
        top="$6"
        gap="$6"
        justifyContent="center"
        flexWrap="wrap"
        $sm={{ position: 'relative', top: 0 }}
      >
        {Platform.OS === 'web' && <SwitchThemeButton />}
      </XStack>

      <YStack gap="$4" alignItems="center">
        <H1 textAlign="center" color="$color12">
          FlashRoll ⏱️
        </H1>
        <Paragraph color="$color10" textAlign="center">
          Application de gestion d'appel intelligent. [cite: 2, 5]
        </Paragraph>
        <Separator />
      </YStack>

      <Button size="$5" backgroundColor="$blue10" onPress={() => setShowAuth(true)}>
        Aller à la connexion
      </Button>
    </YStack>
  )
}
