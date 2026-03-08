import { ProfileScreen } from 'app/features/student/profile-screen'
import { Stack } from 'expo-router'

export default function StudentProfile() {
  return (
    <>
      <Stack.Screen options={{ title: 'Profil', headerShown: false }} />
      <ProfileScreen />
    </>
  )
}
