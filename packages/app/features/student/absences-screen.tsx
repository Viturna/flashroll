'use client'

import React, { useState, useEffect } from 'react'
import {
  YStack,
  XStack,
  H1,
  H2,
  Paragraph,
  Card,
  Button,
  Text,
  Spinner,
  Sheet,
  Label,
  TextArea,
  ScrollView,
} from 'tamagui'
import {
  FileUp,
  FileText,
  CheckCircle,
  Clock as ClockIcon,
  XCircle,
  AlertCircle,
} from '@tamagui/lucide-icons'
import * as DocumentPicker from 'expo-document-picker'

import { db, auth } from '../../utils/firebase'
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  Timestamp,
} from 'firebase/firestore'

export function AbsencesScreen() {
  const [loading, setLoading] = useState(true)
  const [absences, setAbsences] = useState<any[]>([])

  const [activeSheet, setActiveSheet] = useState<boolean>(false)
  const [selectedSession, setSelectedSession] = useState<any>(null)

  const [message, setMessage] = useState('')
  const [attachedFile, setAttachedFile] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchAbsences = async () => {
    setLoading(true)
    try {
      const user = auth.currentUser
      if (!user) return

      const userDoc = await getDoc(doc(db, 'users', user.uid))
      const userData = userDoc.data()
      if (!userData) return

      const myGroups = [userData.group, ...(userData.subGroups || [])].filter(Boolean)
      if (myGroups.length === 0) return

      const q = query(collection(db, 'sessions'), where('groupId', 'in', myGroups))
      const snap = await getDocs(q)

      const now = new Date()

      const pastSessions = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as any)
        .filter((s) => {
          const end = s.endTime?.toDate ? s.endTime.toDate() : new Date(s.endTime || 0)
          return s.isActive === false && end < now
        })

      const myAbsences = pastSessions.filter((s) => {
        const myStatus = s.attendance?.[user.uid]
        return myStatus === 'absent' || !myStatus
      })

      const justifQ = query(collection(db, 'justifications'), where('studentId', '==', user.uid))
      const justifSnap = await getDocs(justifQ)
      const myJustifications = justifSnap.docs.map((d) => d.data())

      const absencesWithStatus = myAbsences
        .map((abs) => {
          const justif = myJustifications.find((j) => j.sessionId === abs.id)
          const start = abs.startTime?.toDate ? abs.startTime.toDate() : new Date(abs.startTime)
          return {
            ...abs,
            startObj: start,
            justificationStatus: justif?.status || 'none',
          }
        })
        .sort((a, b) => b.startObj.getTime() - a.startObj.getTime())

      setAbsences(absencesWithStatus)
    } catch (error) {
      console.error('Erreur récupération absences:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAbsences()
  }, [])

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      })

      if (result.canceled === false) {
        setAttachedFile(result.assets[0])
      }
    } catch (error) {
      console.error('Erreur sélection fichier:', error)
    }
  }

  const handleSubmitJustification = async () => {
    const user = auth.currentUser
    if (!user || !selectedSession) return

    if (!message && !attachedFile) {
      alert('Veuillez ajouter un message ou un fichier joint.')
      return
    }

    setSubmitting(true)
    try {
      await addDoc(collection(db, 'justifications'), {
        studentId: user.uid,
        sessionId: selectedSession.id,
        courseName: selectedSession.courseName,
        message: message,
        fileName: attachedFile ? attachedFile.name : null,
        status: 'pending',
        createdAt: Timestamp.now(),
      })

      alert('Justificatif envoyé au secrétariat.')
      setActiveSheet(false)
      setMessage('')
      setAttachedFile(null)

      await fetchAbsences()
    } catch (error) {
      console.error('Erreur envoi justificatif:', error)
      alert("Erreur lors de l'envoi.")
    } finally {
      setSubmitting(false)
    }
  }

  const openJustifySheet = (session: any) => {
    setSelectedSession(session)
    setMessage('')
    setAttachedFile(null)
    setActiveSheet(true)
  }

  if (loading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
        <Spinner size="large" color="$blue10" />
      </YStack>
    )
  }

  return (
    <YStack flex={1} padding="$4" paddingTop="$8" backgroundColor="$background">
      <H1 marginBottom="$2">Mes Absences</H1>
      <Paragraph color="$gray11" marginBottom="$6">
        Consultez vos absences et soumettez vos justificatifs (certificat médical, etc.).
      </Paragraph>

      <ScrollView showsVerticalScrollIndicator={false}>
        {absences.length === 0 ? (
          <YStack
            padding="$6"
            alignItems="center"
            backgroundColor="$green2"
            borderRadius="$4"
            borderWidth={1}
            borderColor="$green6"
          >
            <CheckCircle size={32} color="$green10" marginBottom="$2" />
            <H2 color="$green10">Aucune absence !</H2>
            <Paragraph color="$green10" textAlign="center">
              Continuez comme ça.
            </Paragraph>
          </YStack>
        ) : (
          <YStack gap="$4" paddingBottom="$10">
            {absences.map((abs) => {
              const dateStr = abs.startObj.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })

              // Typage explicite pour contourner les erreurs TypeScript de Tamagui
              let statusProps: { color: any; bg: any; text: string; icon: any } = {
                color: '$red10',
                bg: '$red2',
                text: 'Non justifiée',
                icon: AlertCircle,
              }

              if (abs.justificationStatus === 'pending') {
                statusProps = {
                  color: '$orange10',
                  bg: '$orange2',
                  text: "En cours d'examen",
                  icon: ClockIcon,
                }
              } else if (abs.justificationStatus === 'approved') {
                statusProps = {
                  color: '$green10',
                  bg: '$green2',
                  text: 'Absence justifiée',
                  icon: CheckCircle,
                }
              } else if (abs.justificationStatus === 'rejected') {
                statusProps = {
                  color: '$red10',
                  bg: '$red2',
                  text: 'Justificatif refusé',
                  icon: XCircle,
                }
              }

              const StatusIcon = statusProps.icon

              return (
                <Card
                  key={abs.id}
                  borderWidth={1}
                  padding="$4"
                  backgroundColor="white"
                  borderColor="$borderColor"
                >
                  <YStack gap="$2">
                    <Text fontWeight="bold" fontSize="$5">
                      {abs.courseName}
                    </Text>
                    <Text color="$gray11" textTransform="capitalize">
                      {dateStr}
                    </Text>

                    <XStack
                      backgroundColor={statusProps.bg}
                      paddingHorizontal="$3"
                      paddingVertical="$1.5"
                      borderRadius="$4"
                      alignItems="center"
                      alignSelf="flex-start"
                      gap="$2"
                      marginTop="$2"
                    >
                      <StatusIcon size={14} color={statusProps.color} />
                      <Text color={statusProps.color} fontWeight="bold" fontSize="$2">
                        {statusProps.text}
                      </Text>
                    </XStack>

                    {(abs.justificationStatus === 'none' ||
                      abs.justificationStatus === 'rejected') && (
                      <Button
                        theme="blue"
                        variant="outlined"
                        size="$3"
                        marginTop="$3"
                        icon={FileUp}
                        onPress={() => openJustifySheet(abs)}
                      >
                        Fournir un justificatif
                      </Button>
                    )}
                  </YStack>
                </Card>
              )
            })}
          </YStack>
        )}
      </ScrollView>

      <Sheet
        modal
        open={activeSheet}
        onOpenChange={setActiveSheet}
        snapPoints={[85]}
        dismissOnSnapToBottom
        zIndex={100000}
      >
        <Sheet.Overlay zIndex={100000} />
        <Sheet.Frame padding="$4" zIndex={100000}>
          <Sheet.Handle />
          <YStack gap="$4" marginTop="$4" flex={1}>
            <H2>Justifier une absence</H2>
            <Paragraph color="$gray11">
              {selectedSession?.courseName} du{' '}
              {selectedSession?.startObj?.toLocaleDateString('fr-FR')}
            </Paragraph>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              <YStack gap="$4">
                <YStack gap="$2">
                  <Label>Message à l'administration</Label>
                  <TextArea
                    placeholder="Expliquez la raison de votre absence..."
                    value={message}
                    onChangeText={setMessage}
                    numberOfLines={4}
                  />
                </YStack>

                <YStack gap="$2">
                  <Label>Pièce jointe (Optionnel)</Label>
                  <Button
                    icon={FileText}
                    theme={attachedFile ? 'green' : 'gray'}
                    onPress={handlePickFile}
                  >
                    {attachedFile ? attachedFile.name : 'Sélectionner un fichier (PDF, IMG...)'}
                  </Button>
                  {attachedFile && (
                    <Text fontSize="$2" color="$gray11" textAlign="center">
                      Fichier prêt à être envoyé.
                    </Text>
                  )}
                </YStack>

                <Button
                  theme="blue"
                  marginTop="$4"
                  icon={submitting ? <Spinner /> : FileUp}
                  onPress={handleSubmitJustification}
                  disabled={submitting}
                >
                  {submitting ? 'Envoi en cours...' : 'Envoyer le justificatif'}
                </Button>
              </YStack>
            </ScrollView>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </YStack>
  )
}
