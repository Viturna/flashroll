import { ScheduleScreen } from 'app/features/student/schedule-screen'
import { Stack } from 'expo-router'

export default function StudentSchedule() {
  return (
    <>
      <Stack.Screen options={{ title: 'Emploi du temps', headerShown: false }} />
      <ScheduleScreen />
    </>
  )
}
