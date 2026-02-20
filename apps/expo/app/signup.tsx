import { SignUpScreen } from 'app/features/auth/signup-screen'
import { useRouter } from 'expo-router'

export default function SignupPage() {
  const router = useRouter()
  return <SignUpScreen onNext={() => router.push('/profile-setup')} />
}