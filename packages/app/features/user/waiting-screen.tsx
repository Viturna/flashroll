import { YStack, H2, Paragraph, Spinner, Button } from 'tamagui'
import { auth } from '../../utils/firebase'
import { signOut } from 'firebase/auth'

export function WaitingScreen() {
  return (
    <YStack flex={1} justifyContent="center" alignItems="center" p="$4" gap="$4" bg="$background">
      <H2 textAlign="center">Compte en attente ⏳</H2>
      <Spinner size="large" color="$blue10" />
      <Paragraph textAlign="center" color="$gray10">
        Votre profil a été complété avec succès. 
        Un administrateur doit maintenant valider votre accès pour que vous puissiez scanner vos présences.
      </Paragraph>
      
      <Button  onPress={() => signOut(auth)}>
        Se déconnecter
      </Button>
    </YStack>
  )
}