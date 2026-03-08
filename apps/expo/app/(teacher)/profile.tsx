import { ProfileScreen } from 'app/features/teacher/profile-screen'
import { Stack } from 'expo-router'

export default function TeacherProfile() {
  return (
    <>
      <Stack.Screen options={{ title: 'Profil', headerShown: false }} />
      <ProfileScreen />
    </>
  )
}
