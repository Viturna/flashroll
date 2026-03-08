import React from 'react'
import { XStack, Text, Button } from 'tamagui'
import { QrCode, CalendarDays, FileWarning, User } from '@tamagui/lucide-icons'
import { useRouter, usePathname } from 'expo-router'

interface NavItemProps {
  icon: React.ElementType
  label: string
  route: string
  isActive: boolean
  onPress: (route: string) => void
}

const NavItem = ({ icon: Icon, label, route, isActive, onPress }: NavItemProps) => (
  <Button
    flex={1}
    flexDirection="column"
    paddingVertical="$2"
    height={65}
    chromeless
    onPress={() => onPress(route)}
    backgroundColor="transparent"
    pressStyle={{ opacity: 0.5 }}
  >
    <Icon size={24} color={isActive ? '$blue10' : '$gray10'} />
    <Text
      fontSize="$1"
      marginTop="$1"
      color={isActive ? '$blue10' : '$gray10'}
      fontWeight={isActive ? 'bold' : 'normal'}
    >
      {label}
    </Text>
  </Button>
)

export function StudentNavbar() {
  const router = useRouter()
  const pathname = usePathname()

  const navItems = [
    { label: 'Scanner', icon: QrCode, route: '/(student)/' },
    { label: 'Planning', icon: CalendarDays, route: '/(student)/schedule' },
    { label: 'Absences', icon: FileWarning, route: '/(student)/absences' },
    { label: 'Profil', icon: User, route: '/(student)/profile' },
  ]

  return (
    <XStack
      backgroundColor="$background"
      borderTopWidth={1}
      borderColor="$borderColor"
      paddingBottom="$4"
      paddingTop="$2"
      justifyContent="space-around"
      alignItems="center"
      width="100%"
      elevation={5}
    >
      {navItems.map((item) => (
        <NavItem
          key={item.route}
          icon={item.icon}
          label={item.label}
          route={item.route}
          isActive={pathname === item.route}
          onPress={(route) => router.push(route as any)}
        />
      ))}
    </XStack>
  )
}
