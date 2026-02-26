import { Slot } from 'expo-router'
import { YStack } from 'tamagui'
import { TeacherNavbar } from '../../components/navigation/TeacherNavbar'

export default function TeacherLayout() {
  return (
    <YStack flex={1}>
      <YStack flex={1}>
        <Slot />
      </YStack>

      <TeacherNavbar />
    </YStack>
  )
}
