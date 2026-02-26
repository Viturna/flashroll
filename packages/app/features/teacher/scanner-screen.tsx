import { useState, useEffect } from 'react'
import { YStack, H1, Paragraph, Spinner, Card, H2, Button, ThemeName } from 'tamagui'
import QRCode from 'react-native-qrcode-svg'
import { db } from '../../utils/firebase'
import { collection, query, where, limit, getDocs, addDoc, Timestamp } from 'firebase/firestore'
import { logout } from '../../services/auth-service'

export function TeacherScannerScreen() {
  const [loading, setLoading] = useState(false)
  const [activeSession, setActiveSession] = useState<{
    id: string
    courseName: string
    groupId: string
  } | null>(null)

  // Chercher une session active au démarrage
  useEffect(() => {
    const fetchSession = async () => {
      const q = query(collection(db, 'sessions'), where('isActive', '==', true), limit(1))
      const snap = await getDocs(q)
      if (!snap.empty) {
        const doc = snap.docs[0]
        setActiveSession({ id: doc.id, ...doc.data() } as any)
      }
    }
    fetchSession()
  }, [])

  const createSession = async () => {
    setLoading(true)
    try {
      const docRef = await addDoc(collection(db, 'sessions'), {
        courseName: 'Développement Mobile',
        groupId: 'M1_DEV',
        teacherId: 'teacher_001',
        isActive: true,
        startTime: Timestamp.now(),
        presents: [],
      })
      setActiveSession({ id: docRef.id, courseName: 'Développement Mobile', groupId: 'M1_DEV' })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <YStack flex={1} p="$4" pt="$8" bg="$background" alignItems="center">
      <H1 textAlign="center">Espace Enseignant</H1>

      {activeSession ? (
        <YStack ai="center" width="100%">
          <Card p="$6" ai="center" mt="$6" elevation={5} borderRadius="$8" width="100%">
            <H2 color="$blue10" mb="$2">
              {activeSession.courseName}
            </H2>
            <Paragraph mb="$5">Groupe : {activeSession.groupId}</Paragraph>

            {/* Le QR Code contient l'ID de la session que l'étudiant va scanner */}
            <QRCode value={activeSession.id} size={250} />

            <Paragraph mt="$5" textAlign="center" color="$gray10">
              Demandez aux étudiants de scanner ce code pour marquer leur présence.
            </Paragraph>
          </Card>

          <Button mt="$6" theme="red" onPress={() => setActiveSession(null)}>
            Clôturer la session
          </Button>
        </YStack>
      ) : (
        <YStack ai="center" jc="center" flex={1}>
          <Paragraph mb="$4">Aucune session en cours.</Paragraph>
          <Button theme="blue" size="$6" onPress={createSession} disabled={loading}>
            {loading ? <Spinner /> : "Démarrer l'appel"}
          </Button>
        </YStack>
      )}

      <Button mt="$auto" chromeless onPress={() => logout()}>
        Se déconnecter
      </Button>
    </YStack>
  )
}
