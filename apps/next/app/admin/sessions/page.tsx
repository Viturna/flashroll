'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  YStack,
  XStack,
  Text,
  Card,
  H1,
  H2,
  Spinner,
  ScrollView,
  Button,
  Separator,
  Input,
} from 'tamagui'
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Search,
  BookOpen,
  RefreshCw,
  Pencil,
  Save,
  X,
  Check,
  Trash2,
} from '@tamagui/lucide-icons'

import { db } from 'app/utils/firebase'
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore'
import { processICSFile } from 'app/services/import-service'
import { getGroups } from 'app/services/group-service'

// --- UTILITAIRE DATE ---
const toDatetimeLocal = (timestamp: any) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function ICSUploader({ onImportSuccessAction }: { onImportSuccessAction: () => void }) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const text = await file.text()
      const count = await processICSFile(text)
      alert(`${count} sessions importées avec succès !`)
      onImportSuccessAction()
    } catch (error) {
      console.error("Erreur d'import", error)
      alert("Une erreur est survenue lors de l'importation.")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <Card padding="$4" borderWidth={1} borderColor="$borderColor" backgroundColor="$blue2">
      <XStack gap="$4" alignItems="center" justifyContent="space-between" flexWrap="wrap">
        <YStack flex={1} minWidth={250}>
          <Text fontWeight="bold" fontSize="$5" color="$blue10">
            Importer le planning ADE (.ics)
          </Text>
          <Text fontSize="$3" color="$gray11">
            Génère automatiquement les sessions, assigne les groupes et les professeurs.
          </Text>
        </YStack>

        <input
          type="file"
          accept=".ics"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        <Button
          theme="blue"
          icon={isUploading ? <Spinner /> : Calendar}
          onPress={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? 'Importation en cours...' : 'Choisir un fichier .ics'}
        </Button>
      </XStack>
    </Card>
  )
}

export default function SessionsAdminPage() {
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const qSessions = query(collection(db, 'sessions'), orderBy('startTime', 'desc'))
      const qTeachers = query(collection(db, 'users'), where('role', '==', 'teacher'))

      const [snapSessions, allGroups, snapTeachers] = await Promise.all([
        getDocs(qSessions),
        getGroups(),
        getDocs(qTeachers),
      ])

      setSessions(snapSessions.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      setGroups(allGroups)
      setTeachers(snapTeachers.docs.map((doc) => doc.data()))
    } catch (error) {
      console.error('Erreur récupération données:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredSessions = useMemo(() => {
    if (!searchQuery) return sessions
    const lowerQuery = searchQuery.toLowerCase()
    return sessions.filter(
      (s) =>
        s.courseName?.toLowerCase().includes(lowerQuery) ||
        s.groupId?.toLowerCase().includes(lowerQuery) ||
        s.teachersNames?.some((t: string) => t.toLowerCase().includes(lowerQuery)) ||
        s.room?.toLowerCase().includes(lowerQuery)
    )
  }, [sessions, searchQuery])

  return (
    <YStack padding="$6" gap="$6" flex={1} backgroundColor="$background">
      <XStack justifyContent="space-between" alignItems="center">
        <H1>Planning & Sessions</H1>
        <Button icon={RefreshCw} size="$3" variant="outlined" onPress={loadData}>
          Actualiser
        </Button>
      </XStack>

      <ICSUploader onImportSuccessAction={loadData} />

      <Separator />

      <XStack alignItems="center" gap="$4">
        <H2 flex={1}>Toutes les sessions ({filteredSessions.length})</H2>
        <XStack
          alignItems="center"
          backgroundColor="$background"
          borderRadius="$4"
          borderWidth={1}
          borderColor="$borderColor"
          paddingHorizontal="$3"
          width={300}
        >
          <Search size={18} color="$gray8" />
          <Input
            flex={1}
            borderWidth={0}
            placeholder="Rechercher (cours, prof, salle)..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </XStack>
      </XStack>

      {loading ? (
        <YStack padding="$10" alignItems="center">
          <Spinner size="large" color="$blue10" />
        </YStack>
      ) : filteredSessions.length === 0 ? (
        <YStack padding="$10" alignItems="center">
          <Text color="$gray10" fontStyle="italic">
            Aucune session trouvée.
          </Text>
        </YStack>
      ) : (
        <ScrollView>
          <XStack gap="$4" flexWrap="wrap">
            {filteredSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                groups={groups}
                teachers={teachers}
                onUpdate={loadData}
              />
            ))}
          </XStack>
        </ScrollView>
      )}
    </YStack>
  )
}

// --- CARTE D'UNE SESSION (Affichage + Édition) ---
function SessionCard({
  session,
  groups,
  teachers,
  onUpdate,
}: {
  session: any
  groups: any[]
  teachers: any[]
  onUpdate: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [courseName, setCourseName] = useState(session.courseName || '')
  const [groupId, setGroupId] = useState(session.groupId || '')
  const [room, setRoom] = useState(session.room || '')

  const [selectedTeachers, setSelectedTeachers] = useState<string[]>(session.teachersNames || [])
  const [startTime, setStartTime] = useState(toDatetimeLocal(session.startTime))
  const [endTime, setEndTime] = useState(toDatetimeLocal(session.endTime))

  const toggleTeacher = (teacherName: string) => {
    if (selectedTeachers.includes(teacherName)) {
      setSelectedTeachers(selectedTeachers.filter((t) => t !== teacherName))
    } else {
      setSelectedTeachers([...selectedTeachers, teacherName])
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateDoc(doc(db, 'sessions', session.id), {
        courseName,
        groupId,
        room,
        teachersNames: selectedTeachers,
        startTime: startTime ? Timestamp.fromDate(new Date(startTime)) : null,
        endTime: endTime ? Timestamp.fromDate(new Date(endTime)) : null,
      })

      setIsEditing(false)
      onUpdate()
    } catch (error) {
      console.error('Erreur lors de la modification:', error)
      alert("Erreur lors de l'enregistrement.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (
      window.confirm(
        'Êtes-vous sûr de vouloir supprimer cette session ? Cette action est irréversible.'
      )
    ) {
      setSaving(true)
      try {
        await deleteDoc(doc(db, 'sessions', session.id))
        setIsEditing(false)
        onUpdate()
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
        alert('Erreur lors de la suppression.')
        setSaving(false)
      }
    }
  }

  // --- MODE ÉDITION ---
  if (isEditing) {
    return (
      <Card padding="$4" width={350} borderWidth={2} borderColor="$blue8" backgroundColor="$blue1">
        <YStack gap="$3">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontWeight="bold" color="$blue10" fontSize="$4">
              Modifier la session
            </Text>
            <XStack gap="$2">
              <Button
                size="$2"
                circular
                chromeless
                theme="red"
                icon={Trash2}
                onPress={handleDelete}
              />
              <Button size="$2" circular chromeless icon={X} onPress={() => setIsEditing(false)} />
            </XStack>
          </XStack>

          <Input
            size="$3"
            value={courseName}
            onChangeText={setCourseName}
            placeholder="Nom du cours"
          />

          <XStack gap="$2" alignItems="center">
            <select
              style={selectStyle}
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
            >
              <option value="">-- Assigner un groupe --</option>
              {groups.map((g: any) => (
                <option key={g.id} value={g.name}>
                  {g.name}
                </option>
              ))}
            </select>

            <Input flex={1} size="$3" value={room} onChangeText={setRoom} placeholder="Salle" />
          </XStack>

          <YStack gap="$2">
            <Text fontSize="$2" color="$gray11">
              Professeurs assignés :
            </Text>
            {teachers.length === 0 ? (
              <Text fontSize="$2" color="$red10">
                Aucun professeur trouvé en base.
              </Text>
            ) : (
              <XStack flexWrap="wrap" gap="$1.5">
                {teachers.map((t) => {
                  const fullName =
                    t.firstName && t.lastName ? `${t.firstName} ${t.lastName}` : t.email
                  const isSelected = selectedTeachers.includes(fullName)
                  return (
                    <Button
                      key={t.uid || t.email}
                      size="$2"
                      theme={isSelected ? 'blue' : undefined}
                      backgroundColor={isSelected ? undefined : 'white'}
                      borderWidth={1}
                      borderColor={isSelected ? '$blue8' : '$borderColor'}
                      onPress={() => toggleTeacher(fullName)}
                    >
                      <Text fontSize="$2">{fullName}</Text>
                      {isSelected && <Check size={12} marginLeft="$1" />}
                    </Button>
                  )
                })}
              </XStack>
            )}
          </YStack>

          <XStack gap="$2" alignItems="center">
            <Text fontSize="$2" width={40} color="$gray11">
              Début
            </Text>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={dateInputStyle}
            />
          </XStack>

          <XStack gap="$2" alignItems="center">
            <Text fontSize="$2" width={40} color="$gray11">
              Fin
            </Text>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              style={dateInputStyle}
            />
          </XStack>

          <Button
            theme="blue"
            marginTop="$2"
            icon={saving ? <Spinner /> : Save}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? 'Traitement...' : 'Enregistrer'}
          </Button>
        </YStack>
      </Card>
    )
  }

  // --- MODE LECTURE (Classique) ---
  const startDate = session.startTime?.toDate
    ? session.startTime.toDate()
    : new Date(session.startTime)
  const endDate = session.endTime?.toDate ? session.endTime.toDate() : new Date(session.endTime)

  const dateStr = startDate.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  const startTimeStr = startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const endTimeStr = endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  return (
    <Card
      padding="$4"
      width={350}
      borderWidth={1}
      borderColor="$borderColor"
      hoverStyle={{ scale: 0.99 }}
    >
      <YStack gap="$3">
        <XStack justifyContent="space-between" alignItems="flex-start">
          <YStack flex={1} marginRight="$2">
            <Text fontWeight="bold" fontSize="$5" numberOfLines={2}>
              {session.courseName}
            </Text>
            <XStack alignItems="center" gap="$2" marginTop="$1">
              <Users size={14} color="$blue10" />
              <Text fontSize="$3" color="$blue10" fontWeight="bold">
                {session.groupId}
              </Text>
            </XStack>
          </YStack>
          <YStack
            backgroundColor={session.isActive ? '$green5' : '$gray5'}
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius="$2"
          >
            <Text fontSize="$1" fontWeight="bold" color={session.isActive ? '$green10' : '$gray10'}>
              {session.isActive ? 'EN COURS' : 'EN ATTENTE'}
            </Text>
          </YStack>
        </XStack>

        <Separator />

        <YStack gap="$2">
          <XStack alignItems="center" gap="$2">
            <Calendar size={16} color="$gray10" />
            <Text fontSize="$3" color="$gray11">
              {dateStr}
            </Text>
          </XStack>

          <XStack alignItems="center" gap="$2">
            <Clock size={16} color="$gray10" />
            <Text fontSize="$3" color="$gray11">
              {startTimeStr} - {endTimeStr}
            </Text>
          </XStack>

          {session.room && (
            <XStack alignItems="center" gap="$2">
              <MapPin size={16} color="$gray10" />
              <Text fontSize="$3" color="$gray11">
                {session.room}
              </Text>
            </XStack>
          )}

          {session.teachersNames && session.teachersNames.length > 0 && (
            <XStack alignItems="flex-start" gap="$2" marginTop="$2">
              <BookOpen size={16} color="$orange10" marginTop="$1" />
              <YStack>
                {session.teachersNames.map((teacher: string, idx: number) => (
                  <Text key={idx} fontSize="$3" fontWeight="bold" color="$gray12">
                    {teacher}
                  </Text>
                ))}
              </YStack>
            </XStack>
          )}
        </YStack>

        <XStack gap="$2" marginTop="$2">
          <Button flex={1} size="$3" icon={Pencil} onPress={() => setIsEditing(true)}>
            Modifier
          </Button>
          <Button flex={1} size="$3" theme="blue">
            Gérer l'appel
          </Button>
        </XStack>
      </YStack>
    </Card>
  )
}

const dateInputStyle = {
  flex: 1,
  padding: '8px',
  borderRadius: '8px',
  border: '1px solid #ccc',
  fontSize: '14px',
  fontFamily: 'inherit',
}

const selectStyle = {
  flex: 1,
  padding: '8px',
  borderRadius: '8px',
  border: '1px solid #ccc',
  fontSize: '14px',
  fontFamily: 'inherit',
  backgroundColor: 'white',
  height: '44px',
}
