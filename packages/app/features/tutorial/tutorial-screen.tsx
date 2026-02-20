import { Button, YStack, H1, Paragraph, Spacer } from 'tamagui'

export function TutorialScreen({
  onSignUp,
  onLogin,
}: {
  onSignUp: () => void
  onLogin: () => void
}) {
  return (
    <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
      <H1>FlashRoll</H1>
      <Spacer size="$8" />
      <YStack width="100%" maxWidth={300} gap="$4">
        <Button backgroundColor="$blue10" onPress={onSignUp}>
          S'inscrire
        </Button>
        <Button onPress={onLogin}>Se connecter</Button>
      </YStack>
    </YStack>
  )
}
