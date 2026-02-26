import React, { useState } from 'react'
import { StyleSheet } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { YStack, H1, Button, Paragraph, Spinner, Card, Text } from 'tamagui'
import { useAuth } from '../../provider/auth'
import { db } from '../../utils/firebase'
import { doc, updateDoc, arrayUnion, Timestamp, getDoc } from 'firebase/firestore'

export function StudentDashboardScreen() {
  const { user, userData } = useAuth()
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    // 1. On bloque tout de suite les scans multiples
    if (scanned || loading) return

    setScanned(true)
    setLoading(true)
    setMessage(null)

    const sessionId = data

    try {
      const sessionRef = doc(db, 'sessions', sessionId)
      const sessionSnap = await getDoc(sessionRef)

      if (!sessionSnap.exists()) {
        throw new Error('Session introuvable.')
      }

      const sessionData = sessionSnap.data()

      // 2. Vérification du Groupe (Sécurité)
      if (sessionData.groupId !== userData?.groupId) {
        setMessage(`Erreur : Cette session est pour le groupe ${sessionData.groupId}.`)
        setLoading(false)
        return
      }

      // 3. Vérification si déjà présent (Évite les doublons Firestore)
      const alreadyPresent = sessionData.presents?.some((p: any) => p.studentId === user?.uid)

      if (alreadyPresent) {
        setMessage('Vous êtes déjà marqué présent pour ce cours !')
        setLoading(false)
        return
      }

      // 4. Enregistrement de la présence
      await updateDoc(sessionRef, {
        presents: arrayUnion({
          studentId: user?.uid,
          studentName: `${userData?.firstName} ${userData?.lastName}`,
          scannedAt: Timestamp.now(),
        }),
      })

      setMessage('✅ Présence validée avec succès !')
    } catch (e: any) {
      setMessage(e.message || 'Erreur lors du scan.')
    } finally {
      setLoading(false)
    }
  }

  if (!permission) return <Spinner />
  if (!permission.granted) {
    return (
      <YStack flex={1} ai="center" jc="center" p="$4">
        <H1 textAlign="center" mb="$4">
          Salut, {userData?.firstName}
        </H1>
        <Button onPress={requestPermission}>Activer la caméra</Button>
      </YStack>
    )
  }

  return (
    <YStack flex={1} p="$4" bg="$background">
      <H1 textAlign="center" mt="$6" mb="$4">
        Scanner l'appel
      </H1>

      <Card overflow="hidden" height={400} borderRadius="$8" bordered bg="$backgroundHover">
        {loading ? (
          <YStack flex={1} ai="center" jc="center" gap="$4">
            <Spinner size="large" color="$blue10" />
            <Text>Validation en cours...</Text>
          </YStack>
        ) : (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
        )}

        {/* Overlay si déjà scanné pour informer l'utilisateur */}
        {scanned && !loading && message && (
          <YStack
            style={StyleSheet.absoluteFillObject}
            bg="rgba(0,0,0,0.8)"
            ai="center"
            jc="center"
            p="$4"
          >
            <Text color="white" textAlign="center" fontSize="$5" mb="$4">
              {message}
            </Text>
            <Button
              theme="blue"
              onPress={() => {
                setScanned(false)
                setMessage(null)
              }}
            >
              Scanner à nouveau
            </Button>
          </YStack>
        )}
      </Card>

      {!scanned && (
        <Paragraph mt="$6" textAlign="center" color="$gray10">
          Visez le QR Code affiché sur l'écran de l'enseignant.
        </Paragraph>
      )}
    </YStack>
  )
}
