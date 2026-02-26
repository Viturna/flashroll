import { SuccessScreen } from 'app/features/user/success-screen'
import { useRouter } from 'expo-router'

export default function SuccessPage() {
  const router = useRouter()
  return <SuccessScreen onFinish={() => router.replace('/')} />
}
