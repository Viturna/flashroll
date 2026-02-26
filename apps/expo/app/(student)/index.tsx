import { StudentDashboardScreen } from 'app/features/student/dashboard-screen'
import { Stack } from 'expo-router'

export default function Page() {
  return (
    <>
      <Stack.Screen options={{ title: 'Mon Dashboard', headerShown: false }} />
      <StudentDashboardScreen />
    </>
  )
}
