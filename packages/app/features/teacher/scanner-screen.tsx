'use client'

import React, { useState, useEffect } from 'react'
import {
  YStack,
  XStack,
  H1,
  Paragraph,
  Spinner,
  Card,
  H2,
  Button,
  Text,
  Sheet,
  Label,
  Input,
} from 'tamagui'
import { Clock, Users, MapPin, Plus, UserCheck, Check, Clock4, X } from '@tamagui/lucide-icons'
import QRCode from 'react-native-qrcode-svg'

import { db, auth } from '../../utils/firebase'
import { collection, getDocs, doc, getDoc, updateDoc, query, where } from 'firebase/firestore'
import { createAttendanceSession } from '../../services/session-service'
import { logout } from '../../services/auth-service'

type AttendanceStatus = 'present' | 'late' | 'absent' | null

export function TeacherScannerScreen() {
  const [loading, setLoading] = useState(false)
  const [upcomingSession, setUpcomingSession] = useState<any | null>(null)
  const [activeSession, setActiveSession] = useState<any | null>(null)
  const [qrPayload, setQrPayload] = useState('')

  const [showAddSheet, setShowAddSheet] = useState(false)
  const [showManualSheet, setShowManualSheet] = useState(false)

  const [students, setStudents] = useState<any[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)

  const [currentTeacherName, setCurrentTeacherName] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    group: '',
    start: '08:00',
    end: '10:00',
  })

  const fetchTeacherSession = async () => {
    try {
      const user = auth.currentUser
      if (!user) return

      const userDoc = await getDoc(doc(db, 'users', user.uid))
      const userData = userDoc.data() || {}
      const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
      setCurrentTeacherName(fullName)
      const fullNameLower = fullName.toLowerCase()

      const snap = await getDocs(collection(db, 'sessions'))
      const allSessions = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as any)
      const now = new Date()

      const teacherSessions = allSessions.filter((s) => {
        const matchId = s.teacherId === user.uid
        const matchName =
          Array.isArray(s.teachersNames) &&
          s.teachersNames.some((n: string) => n.toLowerCase() === fullNameLower)
        return matchId || matchName
      })

      const dateFormattedSessions = teacherSessions.map((s) => {
        let start = now
        let end = now
        let isValidDate = true
        try {
          start = s.startTime?.toDate ? s.startTime.toDate() : new Date(s.startTime || Date.now())
          end = s.endTime?.toDate ? s.endTime.toDate() : new Date(s.endTime || Date.now())
          if (isNaN(end.getTime())) isValidDate = false
        } catch (e) {
          isValidDate = false
        }
        return { ...s, start, end, isValidDate }
      })

      const finalSessions = dateFormattedSessions
        .filter((s) => s.isActive === true || (s.isValidDate && s.end > now))
        .sort((a, b) => a.start.getTime() - b.start.getTime())

      if (finalSessions.length > 0) {
        const runningSession = finalSessions.find((s) => s.isActive === true)
        if (runningSession) {
          setActiveSession(runningSession)
          setUpcomingSession(runningSession)
        } else {
          setUpcomingSession(finalSessions[0])
          setActiveSession(null)
        }
      } else {
        setUpcomingSession(null)
        setActiveSession(null)
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchTeacherSession()
  }, [])

  useEffect(() => {
    if (!activeSession) return
    const updateQR = () => {
      setQrPayload(JSON.stringify({ sessionId: activeSession.id, t: Date.now() }))
    }
    updateQR()
    const interval = setInterval(updateQR, 5000)
    return () => clearInterval(interval)
  }, [activeSession])

  const startSession = async () => {
    if (!upcomingSession) return
    setLoading(true)
    try {
      const sessionDataToUpdate: any = { isActive: true }
      if (!upcomingSession.attendance) sessionDataToUpdate.attendance = {}
      await updateDoc(doc(db, 'sessions', upcomingSession.id), sessionDataToUpdate)
      setActiveSession({ ...upcomingSession, ...sessionDataToUpdate })
    } catch (error) {
      alert('Erreur démarrage')
    } finally {
      setLoading(false)
    }
  }

  const stopSession = async () => {
    if (!activeSession) return
    setLoading(true)
    try {
      await updateDoc(doc(db, 'sessions', activeSession.id), { isActive: false })
      setActiveSession(null)
      setUpcomingSession(null)
      setShowManualSheet(false)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateManualSession = async () => {
    const user = auth.currentUser
    if (!user || !formData.name || !formData.group) return
    setLoading(true)
    try {
      const sessionId = await createAttendanceSession(
        user.uid,
        formData.name,
        formData.group,
        formData.start,
        formData.end,
        [currentTeacherName]
      )
      if (sessionId) {
        setShowAddSheet(false)
        setFormData({ name: '', group: '', start: '08:00', end: '10:00' })
        await fetchTeacherSession()
      }
    } catch (error) {
      alert('Erreur création')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchStudentsForGroup = async () => {
      if (showManualSheet && activeSession?.groupId) {
        setLoadingStudents(true)
        try {
          const q = query(collection(db, 'users'), where('role', '==', 'student'))
          const snap = await getDocs(q)
          const groupStudents = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as any)
            .filter(
              (s) =>
                s.group === activeSession.groupId ||
                (s.subGroups && s.subGroups.includes(activeSession.groupId))
            )
            .sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''))
          setStudents(groupStudents)
        } catch (error) {
          console.error(error)
        } finally {
          setLoadingStudents(false)
        }
      }
    }
    fetchStudentsForGroup()
  }, [showManualSheet, activeSession])

  const handleSetAttendance = async (studentId: string, status: AttendanceStatus) => {
    if (!activeSession) return
    const currentAttendance = { ...(activeSession.attendance || {}) }
    currentAttendance[studentId] = currentAttendance[studentId] === status ? null : status
    setActiveSession({ ...activeSession, attendance: currentAttendance })
    try {
      await updateDoc(doc(db, 'sessions', activeSession.id), { attendance: currentAttendance })
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <YStack flex={1} padding="$4" paddingTop="$8" backgroundColor="$background" alignItems="center">
      <XStack
        width="100%"
        justifyContent={activeSession ? 'center' : 'space-between'}
        alignItems="center"
        marginBottom="$6"
      >
        <H1>Appel</H1>
        {!activeSession && (
          <Button
            icon={Plus}
            circular
            size="$4"
            theme="blue"
            onPress={() => setShowAddSheet(true)}
          />
        )}
      </XStack>

      {activeSession ? (
        <YStack alignItems="center" width="100%">
          <Card
            padding="$6"
            alignItems="center"
            borderRadius="$8"
            width="100%"
            borderColor="$blue8"
            borderWidth={2}
          >
            <H2 color="$blue10" marginBottom="$1" fontWeight="500" textAlign="center">
              {activeSession.courseName}
            </H2>
            <Text color="$gray11" marginBottom="$4">
              Groupe : {activeSession.groupId}
            </Text>
            <Button
              icon={UserCheck}
              theme="blue"
              variant="outlined"
              marginBottom="$4"
              width="100%"
              onPress={() => setShowManualSheet(true)}
            >
              Appel manuel
            </Button>
            <Button
              variant="outlined"
              marginBottom="$4"
              width="100%"
              onPress={stopSession}
              disabled={loading}
              borderColor="$red8"
            >
              {loading ? <Spinner /> : "Clôturer l'appel"}
            </Button>
            <YStack padding="$4" backgroundColor="white" borderRadius="$4">
              {qrPayload ? <QRCode value={qrPayload} size={250} /> : <Spinner size="large" />}
            </YStack>
          </Card>
        </YStack>
      ) : upcomingSession ? (
        <YStack flex={1} justifyContent="center" width="100%" gap="$4">
          <Card padding="$6" alignItems="center" borderRadius="$8" backgroundColor="$blue2">
            <Text color="$blue10" fontWeight="bold">
              Prochain cours :
            </Text>
            <H2 textAlign="center">{upcomingSession.courseName}</H2>
            <XStack gap="$4" marginTop="$4">
              <XStack alignItems="center" gap="$2">
                <Users size={16} />
                <Text>{upcomingSession.groupId}</Text>
              </XStack>
              <XStack alignItems="center" gap="$2">
                <Clock size={16} />
                <Text>
                  {upcomingSession.start.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </XStack>
            </XStack>
          </Card>
          <Button theme="blue" size="$6" onPress={startSession} disabled={loading}>
            {loading ? <Spinner /> : "Démarrer l'appel"}
          </Button>
        </YStack>
      ) : (
        <YStack flex={1} justifyContent="center">
          <Paragraph color="$gray10">Aucun cours prévu.</Paragraph>
        </YStack>
      )}

      <Sheet
        modal
        open={showManualSheet}
        onOpenChange={setShowManualSheet}
        snapPoints={[85]}
        dismissOnSnapToBottom
        zIndex={100000}
      >
        <Sheet.Overlay enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        <Sheet.Frame padding="$4">
          <Sheet.Handle />
          <YStack gap="$4" flex={1} marginTop="$4">
            <H2>Appel Manuel</H2>
            <Sheet.ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              {loadingStudents ? (
                <Spinner size="large" marginVertical="$4" />
              ) : (
                <YStack gap="$3">
                  {students.map((student) => {
                    const status = activeSession?.attendance?.[student.id]
                    return (
                      <Card
                        key={student.id}
                        padding="$3"
                        borderWidth={1}
                        borderColor={
                          status === 'present'
                            ? '$green8'
                            : status === 'late'
                              ? '$orange8'
                              : status === 'absent'
                                ? '$red8'
                                : '$borderColor'
                        }
                      >
                        <YStack gap="$2">
                          <Text fontWeight="bold">
                            {student.lastName?.toUpperCase()} {student.firstName}
                          </Text>
                          <XStack gap="$2">
                            <Button
                              flex={1}
                              size="$2"
                              theme={status === 'present' ? 'green' : null}
                              onPress={() => handleSetAttendance(student.id, 'present')}
                            >
                              Présent
                            </Button>
                            <Button
                              flex={1}
                              size="$2"
                              theme={status === 'late' ? 'orange' : null}
                              onPress={() => handleSetAttendance(student.id, 'late')}
                            >
                              Retard
                            </Button>
                            <Button
                              flex={1}
                              size="$2"
                              theme={status === 'absent' ? 'red' : null}
                              onPress={() => handleSetAttendance(student.id, 'absent')}
                            >
                              Absent
                            </Button>
                          </XStack>
                        </YStack>
                      </Card>
                    )
                  })}
                </YStack>
              )}
            </Sheet.ScrollView>
            <Button theme="blue" onPress={() => setShowManualSheet(false)}>
              Fermer
            </Button>
          </YStack>
        </Sheet.Frame>
      </Sheet>

      <Sheet
        modal
        open={showAddSheet}
        onOpenChange={setShowAddSheet}
        snapPoints={[80]}
        zIndex={100000}
      >
        <Sheet.Overlay />
        <Sheet.Frame padding="$4">
          <Sheet.Handle />
          <Sheet.ScrollView>
            <YStack gap="$4" marginTop="$4">
              <H2>Session manuelle</H2>
              <Label>Cours</Label>
              <Input
                value={formData.name}
                onChangeText={(t) => setFormData({ ...formData, name: t })}
              />
              <Label>Groupe</Label>
              <Input
                value={formData.group}
                onChangeText={(t) => setFormData({ ...formData, group: t })}
              />
              <XStack gap="$4">
                <YStack flex={1}>
                  <Label>Début</Label>
                  <Input
                    value={formData.start}
                    onChangeText={(t) => setFormData({ ...formData, start: t })}
                  />
                </YStack>
                <YStack flex={1}>
                  <Label>Fin</Label>
                  <Input
                    value={formData.end}
                    onChangeText={(t) => setFormData({ ...formData, end: t })}
                  />
                </YStack>
              </XStack>
              <Button theme="blue" onPress={handleCreateManualSession} disabled={loading}>
                {loading ? <Spinner /> : 'Créer session'}
              </Button>
            </YStack>
          </Sheet.ScrollView>
        </Sheet.Frame>
      </Sheet>

      <Button marginTop="auto" chromeless onPress={() => logout()}>
        <Text color="$red10" fontWeight="bold">
          Déconnexion
        </Text>
      </Button>
    </YStack>
  )
}
