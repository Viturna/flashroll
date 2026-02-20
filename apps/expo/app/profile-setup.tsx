import { ProfileSetupScreen } from 'app/features/user/profile-setup-screen'
import { useRouter } from 'expo-router'

export default function ProfileSetupPage() {
  const router = useRouter()
  return <ProfileSetupScreen onComplete={() => router.push('/success')} />
}
