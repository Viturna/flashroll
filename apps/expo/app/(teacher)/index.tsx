import { TeacherScannerScreen } from 'app/features/teacher/scanner-screen'
import { Stack } from 'expo-router'

export default function Page() {
  return (
    <>
      <Stack.Screen options={{ title: "Faire l'appel", headerShown: true }} />
      <TeacherScannerScreen />
    </>
  )
}
