import { Slot } from 'expo-router'
import { YStack } from 'tamagui'
import { StudentNavbar } from '../../components/navigation/StudentNavbar'

export default function StudentLayout() {
  return (
    <YStack flex={1}>
      <YStack flex={1}>
        <Slot />
      </YStack>

      <StudentNavbar />
    </YStack>
  )
}
