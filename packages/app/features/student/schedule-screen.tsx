import React, { useState, useEffect } from 'react'
import { YStack, XStack, Text, Card, H1, Spinner, ScrollView, Separator } from 'tamagui'
import { CalendarDays, MapPin, BookOpen, AlertCircle } from '@tamagui/lucide-icons'
import { auth } from '../../utils/firebase'
import { getStudentSchedule } from '../../services/session-service'

export function ScheduleScreen() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [groupedSessions, setGroupedSessions] = useState<{ [key: string]: any[] }>({})

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const currentUser = auth.currentUser
        if (!currentUser) {
          setError("Vous n'êtes pas connecté.")
          setLoading(false)
          return
        }

        const sessions = await getStudentSchedule(currentUser.uid)

        // Grouper par jour (ex: "Lundi 15 Mars")
        const grouped = sessions.reduce((acc: any, session: any) => {
          const date = session.startTime.toDate()
          const dateStr = date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })
          const capitalizedDateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)

          if (!acc[capitalizedDateStr]) acc[capitalizedDateStr] = []
          acc[capitalizedDateStr].push(session)
          return acc
        }, {})

        setGroupedSessions(grouped)
      } catch (err: any) {
        console.error('Erreur planning :', err)
        setError(err.message || "Impossible de charger l'emploi du temps.")
      } finally {
        setLoading(false)
      }
    }

    fetchSchedule()
  }, [])

  if (loading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
        <Spinner size="large" color="$blue10" />
        <Text marginTop="$4" color="$gray10">
          Chargement de ton planning...
        </Text>
      </YStack>
    )
  }

  if (error) {
    return (
      <YStack
        flex={1}
        justifyContent="center"
        alignItems="center"
        padding="$6"
        backgroundColor="$background"
      >
        <AlertCircle size={48} color="$red10" />
        <Text marginTop="$4" color="$red10" textAlign="center" fontWeight="bold">
          {error}
        </Text>
      </YStack>
    )
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <YStack padding="$6" paddingBottom="$2" paddingTop="$8">
        <H1>Mon Planning</H1>
        <Text color="$gray10" fontSize="$3" marginTop="$2">
          Retrouve tes prochains cours ci-dessous.
        </Text>
      </YStack>

      {Object.keys(groupedSessions).length === 0 ? (
        <YStack flex={1} justifyContent="center" alignItems="center" padding="$6">
          <CalendarDays size={64} color="$gray6" />
          <Text marginTop="$4" color="$gray10" fontSize="$5" fontWeight="bold">
            Aucun cours à venir
          </Text>
        </YStack>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
          {Object.entries(groupedSessions).map(([dateStr, daySessions]) => (
            <YStack key={dateStr} gap="$3">
              <XStack alignItems="center" gap="$2">
                <CalendarDays size={20} color="$blue10" />
                <Text fontSize="$5" fontWeight="bold" color="$gray12">
                  {dateStr}
                </Text>
              </XStack>
              <Separator borderColor="$gray5" />

              <YStack gap="$3">
                {daySessions.map((session: any) => (
                  <CourseCard key={session.id} session={session} />
                ))}
              </YStack>
            </YStack>
          ))}
        </ScrollView>
      )}
    </YStack>
  )
}

function CourseCard({ session }: { session: any }) {
  const startTime = session.startTime
    .toDate()
    .toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const endTime = session.endTime
    .toDate()
    .toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const isNow = session.isActive === true

  return (
    <Card
      padding="$4"
      borderWidth={1}
      borderColor={isNow ? '$blue8' : '$borderColor'}
      backgroundColor={isNow ? '$blue2' : '$background'}
    >
      <XStack gap="$4">
        {/* Colonne de gauche : Horaires */}
        <YStack
          width={60}
          alignItems="center"
          justifyContent="center"
          borderRightWidth={1}
          borderColor="$borderColor"
          paddingRight="$4"
        >
          <Text fontWeight="bold" fontSize="$4" color={isNow ? '$blue10' : '$gray12'}>
            {startTime}
          </Text>
          <Text fontSize="$2" color="$gray10" marginTop="$1">
            {endTime}
          </Text>
        </YStack>

        {/* Colonne de droite : Détails */}
        <YStack flex={1} gap="$2">
          <XStack justifyContent="space-between" alignItems="flex-start">
            <Text fontWeight="bold" fontSize="$5" flex={1} color={isNow ? '$blue11' : '$gray12'}>
              {session.courseName}
            </Text>
            {isNow && (
              <YStack
                backgroundColor="$blue10"
                paddingHorizontal="$2"
                paddingVertical="$1"
                borderRadius="$4"
                marginLeft="$2"
              >
                <Text fontSize="$1" fontWeight="bold" color="white">
                  EN COURS
                </Text>
              </YStack>
            )}
          </XStack>

          <XStack gap="$4" flexWrap="wrap" marginTop="$1">
            {session.room && (
              <XStack alignItems="center" gap="$1.5">
                <MapPin size={14} color="$gray10" />
                <Text fontSize="$3" color="$gray11">
                  {session.room}
                </Text>
              </XStack>
            )}

            {session.teachersNames && session.teachersNames.length > 0 && (
              <XStack alignItems="center" gap="$1.5">
                <BookOpen size={14} color="$gray10" />
                <Text fontSize="$3" color="$gray11" numberOfLines={1}>
                  {session.teachersNames[0]} {session.teachersNames.length > 1 ? '(+)' : ''}
                </Text>
              </XStack>
            )}
          </XStack>
        </YStack>
      </XStack>
    </Card>
  )
}
