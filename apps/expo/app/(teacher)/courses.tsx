import React, { useState, useEffect } from 'react'
import { YStack, XStack, Text, Button, Input, ScrollView, Sheet, Label, H2, Spinner } from 'tamagui'
import { Plus, Clock, Users, Calendar as CalendarIcon } from '@tamagui/lucide-icons'
import { Calendar, LocaleConfig } from 'react-native-calendars'

// Utilisation des alias du monorepo
import { db, auth } from 'app/utils/firebase'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { createAttendanceSession } from 'app/services/session-service'

// Configuration calendrier en français
LocaleConfig.locales['fr'] = {
  monthNames: [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ],
  monthNamesShort: [
    'Janv.',
    'Févr.',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juil.',
    'Août',
    'Sept.',
    'Oct.',
    'Nov.',
    'Déc.',
  ],
  dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  dayNamesShort: ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'],
  today: "Aujourd'hui",
}
LocaleConfig.defaultLocale = 'fr'

export default function CoursesPage() {
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const [courses, setCourses] = useState<any[]>([])
  const [formData, setFormData] = useState({ name: '', group: '', end: '12:00' })

  // 1. Récupération des cours depuis Firebase
  const fetchCourses = async () => {
    setFetching(true)
    try {
      const user = auth.currentUser
      if (!user) {
        console.log('Aucun utilisateur connecté')
        return
      }

      console.log('Récupération des sessions pour :', user.uid)

      const q = query(
        collection(db, 'sessions'),
        where('teacherId', '==', user.uid),
        orderBy('startTime', 'desc')
      )

      const querySnapshot = await getDocs(q)
      const fetched = querySnapshot.docs.map((doc) => {
        const data = doc.data()
        // Sécurité : conversion du Timestamp Firebase en Date JS
        const dateObj = data.startTime?.toDate ? data.startTime.toDate() : new Date()
        return {
          id: doc.id,
          ...data,
          dateDisplay: dateObj.toISOString().split('T')[0],
        }
      })

      console.log(`${fetched.length} sessions trouvées.`)
      setCourses(fetched)
    } catch (e: any) {
      console.error('Erreur Firebase Fetch:', e)
      // Si l'erreur contient "index", c'est qu'il faut créer l'index dans la console Firebase
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  // 2. Création d'une nouvelle session via le service
  const handleSaveCourse = async () => {
    const user = auth.currentUser
    if (!user) {
      alert('Vous devez être connecté')
      return
    }

    if (!formData.name || !formData.group) {
      alert('Veuillez remplir le nom et le groupe')
      return
    }

    setLoading(true)
    try {
      console.log('Appel service createAttendanceSession...')
      const sessionId = await createAttendanceSession(
        user.uid,
        formData.name,
        formData.group,
        formData.end
      )

      if (sessionId) {
        console.log('Session créée avec ID :', sessionId)
        setShowAddSheet(false)
        setFormData({ name: '', group: '', end: '12:00' })
        // Recharger la liste pour voir le nouveau cours
        await fetchCourses()
      }
    } catch (e: any) {
      console.error('Erreur lors de la création:', e)
      alert('Erreur Firebase: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView>
        <YStack padding="$4" gap="$4">
          <XStack justifyContent="space-between" alignItems="center" marginTop="$4">
            <H2 fontSize="$8">Planning</H2>
            <Button
              icon={Plus}
              circular
              size="$4"
              backgroundColor="$blue10"
              onPress={() => setShowAddSheet(true)}
            />
          </XStack>

          {/* Calendrier */}
          <YStack
            borderRadius="$4"
            overflow="hidden"
            borderWidth={1}
            borderColor="$borderColor"
            backgroundColor="white"
          >
            <Calendar
              onDayPress={(day: any) => setSelectedDate(day.dateString)}
              markedDates={{
                [selectedDate]: { selected: true, selectedColor: '#007AFF' },
              }}
              theme={{
                todayTextColor: '#007AFF',
                selectedDayBackgroundColor: '#007AFF',
                arrowColor: '#007AFF',
              }}
            />
          </YStack>

          <Text fontWeight="bold" fontSize="$5" color="$blue10" marginTop="$2">
            Cours du {selectedDate}
          </Text>

          {fetching ? (
            <YStack padding="$8" ai="center">
              <Spinner size="large" color="$blue10" />
            </YStack>
          ) : (
            <YStack gap="$3">
              {courses.filter((c) => c.dateDisplay === selectedDate).length > 0 ? (
                courses
                  .filter((c) => c.dateDisplay === selectedDate)
                  .map((course) => (
                    <YStack
                      key={course.id}
                      padding="$4"
                      backgroundColor="$backgroundHover"
                      borderRadius="$4"
                      borderWidth={1}
                      borderColor="$borderColor"
                    >
                      <H2 fontSize="$6" fontWeight="bold">
                        {course.courseName}
                      </H2>
                      <XStack gap="$4" marginTop="$2">
                        <XStack alignItems="center" gap="$1">
                          <Users size={14} color="$gray10" />
                          <Text color="$gray10">{course.groupId}</Text>
                        </XStack>
                        <XStack alignItems="center" gap="$1">
                          <Clock size={14} color="$gray10" />
                          <Text color="$gray10">Fin: {course.endTime}</Text>
                        </XStack>
                      </XStack>
                    </YStack>
                  ))
              ) : (
                <YStack
                  padding="$8"
                  alignItems="center"
                  backgroundColor="$gray2"
                  borderRadius="$4"
                  borderStyle="dashed"
                  borderWidth={1}
                  borderColor="$borderColor"
                >
                  <CalendarIcon size={32} color="$gray8" marginBottom="$2" />
                  <Text color="$gray10">Aucun cours trouvé pour cette date</Text>
                </YStack>
              )}
            </YStack>
          )}
        </YStack>
      </ScrollView>

      {/* Formulaire d'ajout */}
      <Sheet
        modal
        open={showAddSheet}
        onOpenChange={setShowAddSheet}
        snapPoints={[75]}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Frame padding="$4">
          <Sheet.Handle />
          <YStack gap="$4" marginTop="$4">
            <H2>Démarrer une session</H2>

            <YStack gap="$1">
              <Label>Nom du cours</Label>
              <Input
                placeholder="ex: Développement Mobile"
                value={formData.name}
                onChangeText={(t) => setFormData({ ...formData, name: t })}
              />
            </YStack>

            <YStack gap="$1">
              <Label>Groupe (ID)</Label>
              <Input
                placeholder="ex: M1_DEV"
                value={formData.group}
                onChangeText={(t) => setFormData({ ...formData, group: t })}
              />
            </YStack>

            <YStack gap="$1">
              <Label>Heure de fin prévue</Label>
              <Input
                placeholder="12:00"
                value={formData.end}
                onChangeText={(t) => setFormData({ ...formData, end: t })}
              />
            </YStack>

            <Button backgroundColor="$blue10" onPress={handleSaveCourse} disabled={loading}>
              <Text color="white" fontWeight="bold">
                {loading ? 'Création...' : 'Lancer la session (Générer QR)'}
              </Text>
            </Button>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </YStack>
  )
}
