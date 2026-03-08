import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { useAuth } from 'app/provider/auth'

export default function Index() {
  const { user, userData, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      router.replace('/login')
    } else if (userData?.profileCompleted && !userData?.isValidated) {
      router.replace('/waiting') //
    } else if (userData?.isValidated) {
      // Redirection par rôle une fois validé
      switch (userData.role) {
        case 'admin':
          router.replace('/(student)')
          break
        case 'teacher':
          router.replace('/(teacher)')
          break
        case 'student':
          router.replace('/(student)')
          break
        default:
          router.replace('/waiting')
      }
    }
  }, [user, userData, isLoading])

  return null
}
