'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  YStack,
  XStack,
  Text,
  Button,
  Input,
  ScrollView,
  Sheet,
  Label,
  H2,
  Spinner,
  Card,
} from 'tamagui'
import {
  Plus,
  Clock,
  Users,
  Calendar as CalendarIcon,
  ArrowRight,
  AlertCircle,
  MapPin,
} from '@tamagui/lucide-icons'
import { Calendar, LocaleConfig } from 'react-native-calendars'

import { db, auth } from 'app/utils/firebase'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
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

  // NOUVEAU: État étendu pour le formulaire
  const [formData, setFormData] = useState({
    name: '',
    group: '',
    start: '08:00',
    end: '10:00',
    teachersStr: '',
  })

  const [currentTeacherName, setCurrentTeacherName] = useState('')

  const fetchCourses = async () => {
    setFetching(true)
    try {
      const user = auth.currentUser
      if (!user) return

      const userDoc = await getDoc(doc(db, 'users', user.uid))
      const userData = userDoc.data()
      const fullName = `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim()

      // On sauvegarde le nom pour le pré-remplir dans le formulaire plus tard
      setCurrentTeacherName(fullName)

      const querySnapshot = await getDocs(collection(db, 'sessions'))

      const fetched = querySnapshot.docs
        .map((docSnap) => {
          const data = docSnap.data()
          const dateObj = data.startTime?.toDate
            ? data.startTime.toDate()
            : new Date(data.startTime || Date.now())
          const endDateObj = data.endTime?.toDate
            ? data.endTime.toDate()
            : new Date(data.endTime || Date.now())

          return {
            id: docSnap.id,
            ...data,
            startTimeObj: dateObj,
            endTimeObj: endDateObj,
            dateDisplay: dateObj.toISOString().split('T')[0],
          }
        })
        .filter((c: any) => {
          const isManualTeacher = c.teacherId === user.uid
          const isImportedTeacher =
            c.teachersNames && Array.isArray(c.teachersNames) && c.teachersNames.includes(fullName)
          return isManualTeacher || isImportedTeacher
        })
        .sort((a, b) => a.startTimeObj.getTime() - b.startTimeObj.getTime())

      setCourses(fetched)
    } catch (e: any) {
      console.error('Erreur Firebase Fetch:', e)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  // 2. Déduction du "Prochain Cours"
  const nextCourse = useMemo(() => {
    const now = new Date()
    return courses.find((c) => c.endTimeObj > now)
  }, [courses])

  // 3. Calcul des dates à marquer sur le calendrier
  const markedDates = useMemo(() => {
    const marks: any = {}
    courses.forEach((c) => {
      marks[c.dateDisplay] = { marked: true, dotColor: '#007AFF' }
    })
    if (marks[selectedDate]) {
      marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: '#007AFF' }
    } else {
      marks[selectedDate] = { selected: true, selectedColor: '#007AFF' }
    }
    return marks
  }, [courses, selectedDate])

  // 4. Création manuelle d'une session
  const handleSaveCourse = async () => {
    const user = auth.currentUser
    if (!user) {
      alert('Vous devez être connecté')
      return
    }

    if (!formData.name || !formData.group || !formData.start || !formData.end) {
      alert('Veuillez remplir tous les champs obligatoires (Nom, Groupe, Début, Fin)')
      return
    }

    setLoading(true)
    try {
      // Transformation de la chaîne "Prof 1, Prof 2" en tableau ["Prof 1", "Prof 2"]
      const teachersArray = formData.teachersStr
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)

      // Si le champ est vide, on s'assure qu'au moins le prof actuel est dedans !
      if (teachersArray.length === 0 && currentTeacherName) {
        teachersArray.push(currentTeacherName)
      }

      const sessionId = await createAttendanceSession(
        user.uid,
        formData.name,
        formData.group,
        formData.start, // On envoie l'heure de début
        formData.end,
        teachersArray // On envoie le tableau de profs
      )

      if (sessionId) {
        setShowAddSheet(false)
        // On réinitialise le formulaire (en remettant le nom du prof par défaut)
        setFormData({
          name: '',
          group: '',
          start: '08:00',
          end: '10:00',
          teachersStr: currentTeacherName,
        })
        await fetchCourses()
      }
    } catch (e: any) {
      console.error('Erreur lors de la création:', e)
      alert('Erreur Firebase: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  // Quand on ouvre la popup, on s'assure que le champ prof est pré-rempli avec le prof actuel
  const handleOpenSheet = () => {
    if (!formData.teachersStr) {
      setFormData((prev) => ({ ...prev, teachersStr: currentTeacherName }))
    }
    setShowAddSheet(true)
  }

  const coursesOfDay = courses.filter((c) => c.dateDisplay === selectedDate)

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
              onPress={handleOpenSheet}
            />
          </XStack>

          {/* --- SECTION : PROCHAIN COURS --- */}
          {!fetching && nextCourse && (
            <Card
              padding="$4"
              backgroundColor="$blue2"
              borderWidth={1}
              borderColor="$blue6"
              hoverStyle={{ scale: 0.99 }}
            >
              <XStack alignItems="center" gap="$2" marginBottom="$2">
                <AlertCircle size={18} color="$blue10" />
                <Text fontWeight="bold" color="$blue10">
                  Ton prochain cours
                </Text>
              </XStack>

              <H2 fontSize="$6" fontWeight="bold">
                {nextCourse.courseName}
              </H2>

              <XStack gap="$4" marginTop="$2" flexWrap="wrap">
                <XStack alignItems="center" gap="$1.5">
                  <Clock size={14} color="$gray11" />
                  <Text color="$gray11" fontSize="$3">
                    {nextCourse.startTimeObj.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    -{' '}
                    {nextCourse.endTimeObj.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </XStack>
                <XStack alignItems="center" gap="$1.5">
                  <Users size={14} color="$gray11" />
                  <Text color="$gray11" fontSize="$3">
                    {nextCourse.groupId}
                  </Text>
                </XStack>
                {nextCourse.room && (
                  <XStack alignItems="center" gap="$1.5">
                    <MapPin size={14} color="$gray11" />
                    <Text color="$gray11" fontSize="$3">
                      {nextCourse.room}
                    </Text>
                  </XStack>
                )}
              </XStack>

              <Button theme="blue" marginTop="$3" iconAfter={ArrowRight}>
                Préparer l'appel
              </Button>
            </Card>
          )}

          {/* --- CALENDRIER --- */}
          <YStack
            borderRadius="$4"
            overflow="hidden"
            borderWidth={1}
            borderColor="$borderColor"
            backgroundColor="white"
          >
            <Calendar
              onDayPress={(day: any) => setSelectedDate(day.dateString)}
              markedDates={markedDates}
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

          {/* --- LISTE DES COURS DU JOUR --- */}
          {fetching ? (
            <YStack padding="$8" alignItems="center">
              <Spinner size="large" color="$blue10" />
            </YStack>
          ) : (
            <YStack gap="$3">
              {coursesOfDay.length > 0 ? (
                coursesOfDay.map((course) => (
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
                    <XStack gap="$4" marginTop="$2" flexWrap="wrap">
                      <XStack alignItems="center" gap="$1">
                        <Clock size={14} color="$gray10" />
                        <Text color="$gray10">
                          {course.startTimeObj.toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          -{' '}
                          {course.endTimeObj.toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </XStack>
                      <XStack alignItems="center" gap="$1">
                        <Users size={14} color="$gray10" />
                        <Text color="$gray10">{course.groupId}</Text>
                      </XStack>
                    </XStack>

                    {/* Affichage des professeurs assignés */}
                    {course.teachersNames && course.teachersNames.length > 0 && (
                      <XStack gap="$1" marginTop="$2" flexWrap="wrap">
                        <Text color="$gray10" fontSize="$2" fontWeight="bold">
                          Profs :
                        </Text>
                        <Text color="$gray10" fontSize="$2">
                          {course.teachersNames.join(', ')}
                        </Text>
                      </XStack>
                    )}
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

      {/* --- FORMULAIRE D'AJOUT MANUEL --- */}
      <Sheet
        modal
        open={showAddSheet}
        onOpenChange={setShowAddSheet}
        snapPoints={[85]}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Frame padding="$4">
          <Sheet.Handle />
          <YStack gap="$4" marginTop="$4">
            <H2>Créer une session</H2>

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
              <Label>Professeurs (séparés par une virgule)</Label>
              <Input
                placeholder="ex: Jean Dupont, Marie Curie"
                value={formData.teachersStr}
                onChangeText={(t) => setFormData({ ...formData, teachersStr: t })}
              />
            </YStack>

            <XStack gap="$4">
              <YStack gap="$1" flex={1}>
                <Label>Heure de début</Label>
                <Input
                  placeholder="08:00"
                  value={formData.start}
                  onChangeText={(t) => setFormData({ ...formData, start: t })}
                />
              </YStack>

              <YStack gap="$1" flex={1}>
                <Label>Heure de fin</Label>
                <Input
                  placeholder="10:00"
                  value={formData.end}
                  onChangeText={(t) => setFormData({ ...formData, end: t })}
                />
              </YStack>
            </XStack>

            <Button
              backgroundColor="$blue10"
              marginTop="$4"
              onPress={handleSaveCourse}
              disabled={loading}
            >
              <Text color="white" fontWeight="bold">
                {loading ? 'Création...' : 'Créer et planifier'}
              </Text>
            </Button>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </YStack>
  )
}
