'use client'

import React, { useState } from 'react'
import { StyleSheet } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { YStack, H1, Button, Paragraph, Spinner, Card, Text } from 'tamagui'
import { useAuth } from '../../provider/auth'
import { db } from '../../utils/firebase'
import { doc, updateDoc, getDoc } from 'firebase/firestore'

export function StudentDashboardScreen() {
  const { user, userData } = useAuth()
  const [permission, requestPermission] = useCameraPermissions()

  const [scanned, setScanned] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return

    setScanned(true)
    setLoading(true)
    setMessage(null)
    setIsSuccess(false)

    console.log('📱 QR Code lu :', data)

    try {
      if (!user || !userData) throw new Error('Utilisateur non connecté.')

      let payload
      try {
        // On essaie de lire le format JSON dynamique (Anti-Triche)
        payload = JSON.parse(data)
      } catch (e) {
        // Si ça plante, c'est que le prof génère peut-être encore l'ancien format texte brut !
        console.log("⚠️ Format JSON invalide, on essaie l'ID brut.")
        payload = { sessionId: data, t: Date.now() }
      }

      const { sessionId, t: qrTimestamp } = payload

      if (!sessionId) {
        throw new Error('QR Code invalide ou corrompu.')
      }

      console.log("🔍 Recherche de la session dans Firebase avec l'ID :", sessionId)

      // Vérification Anti-Triche (Tolérance de 15 secondes max)
      const now = Date.now()
      const diffInSeconds = (now - qrTimestamp) / 1000
      if (diffInSeconds > 15) {
        throw new Error("QR Code expiré ! Rapprochez-vous de l'écran du professeur.")
      }

      // Récupération du cours
      const sessionRef = doc(db, 'sessions', sessionId)
      const sessionSnap = await getDoc(sessionRef)

      if (!sessionSnap.exists()) {
        throw new Error('Session introuvable en base de données.')
      }

      const sessionData = sessionSnap.data()

      if (!sessionData.isActive) {
        throw new Error("L'appel pour ce cours est clôturé.")
      }

      // Contournement TypeScript avec "as any" pour les groupes
      const uData = userData as any
      const myGroups = [uData?.group, ...(uData?.subGroups || [])].filter(Boolean)

      if (!myGroups.includes(sessionData.groupId)) {
        throw new Error(
          `Erreur : Ce cours est réservé au groupe ${sessionData.groupId}. Vous êtes dans : ${myGroups.join(', ')}`
        )
      }

      // Vérification si déjà présent
      const currentStatus = sessionData.attendance?.[user.uid]
      if (currentStatus === 'present') {
        setIsSuccess(true)
        setMessage('Vous êtes déjà marqué présent pour ce cours !')
        setLoading(false)
        return
      }

      // Enregistrement officiel
      await updateDoc(sessionRef, {
        [`attendance.${user.uid}`]: 'present',
      })

      setIsSuccess(true)
      setMessage('✅ Présence validée avec succès !')
    } catch (e: any) {
      console.error('❌ Erreur validation :', e.message)
      setIsSuccess(false)
      setMessage(e.message || 'Erreur lors du scan.')
    } finally {
      setLoading(false)
    }
  }

  if (!permission) return <Spinner />
  if (!permission.granted) {
    return (
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        padding="$4"
        backgroundColor="$background"
      >
        <H1 textAlign="center" marginBottom="$4">
          Salut, {(userData as any)?.firstName}
        </H1>
        <Paragraph textAlign="center" marginBottom="$4">
          L'application a besoin d'accéder à votre caméra pour scanner les QR Codes de présence.
        </Paragraph>
        <Button theme="blue" onPress={requestPermission}>
          Autoriser la caméra
        </Button>
      </YStack>
    )
  }

  return (
    <YStack flex={1} mt="$8" padding="$4" backgroundColor="$background">
      <H1 textAlign="center" marginBottom="$4">
        Appel
      </H1>

      <Card
        overflow="hidden"
        height={450}
        borderRadius="$8"
        borderWidth={2}
        borderColor={scanned && !loading ? (isSuccess ? '$green8' : '$red8') : '$borderColor'}
        backgroundColor="$backgroundHover"
      >
        {loading ? (
          <YStack flex={1} alignItems="center" justifyContent="center" gap="$4">
            <Spinner size="large" color="$blue10" />
            <Text>Validation en cours...</Text>
          </YStack>
        ) : (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
        )}

        {/* Overlay si scanné */}
        {scanned && !loading && message && (
          <YStack
            style={StyleSheet.absoluteFillObject}
            backgroundColor="rgba(0,0,0,0.85)"
            alignItems="center"
            justifyContent="center"
            padding="$6"
            gap="$4"
          >
            <Text
              color={isSuccess ? '$green10' : '$red10'}
              textAlign="center"
              fontSize="$6"
              fontWeight="bold"
            >
              {message}
            </Text>
            <Button
              theme={isSuccess ? 'green' : 'red'}
              size="$5"
              marginTop="$4"
              onPress={() => {
                setScanned(false)
                setMessage(null)
              }}
            >
              {isSuccess ? 'Fermer' : 'Réessayer'}
            </Button>
          </YStack>
        )}
      </Card>

      {!scanned && (
        <Paragraph marginTop="$6" textAlign="center" color="$gray10" fontSize="$4">
          Visez le QR Code affiché sur l'écran de l'enseignant.
        </Paragraph>
      )}
    </YStack>
  )
}
