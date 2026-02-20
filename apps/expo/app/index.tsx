import { Stack, useRouter } from 'expo-router'
import { TutorialScreen } from 'app/features/tutorial/tutorial-screen'

export default function Page() {
  const router = useRouter()

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title: 'Bienvenue',
        }}
      />
      <TutorialScreen
        onSignUp={() => router.push('/signup')}
        onLogin={() => router.push('/login')}
      />
    </>
  )
}
