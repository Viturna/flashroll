'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  YStack,
  XStack,
  Text,
  Card,
  H1,
  Tabs,
  Separator,
  Spinner,
  ScrollView,
  Button,
  Input,
  Avatar,
} from 'tamagui'
import {
  Calendar,
  Hash,
  Check,
  Search,
  RotateCw,
  UploadCloud,
  Filter,
  Users,
  ShieldCheck,
  MoreVertical,
} from '@tamagui/lucide-icons'

// Imports de tes services
import { importUsersFromCSV } from 'app/services/import-users-service'
import { getAllUsers, updateUserGroups } from 'app/services/auth-service'
import { getGroups } from 'app/services/group-service'

export default function UsersListPage() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [availableGroups, setAvailableGroups] = useState<any[]>([])

  // États des FILTRES
  const [searchQuery, setSearchQuery] = useState('')
  const [promoFilter, setPromoFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const loadData = async () => {
    setLoading(true)
    try {
      const [allUsers, allGroups] = await Promise.all([getAllUsers(), getGroups()])
      setUsers(allUsers)
      setAvailableGroups(allGroups)
    } catch (err) {
      console.error('Erreur chargement:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Logique de filtrage calculée
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const fullName = `${u.firstName || ''} ${u.lastName || ''} ${u.email || ''}`.toLowerCase()
      const matchesSearch = fullName.includes(searchQuery.toLowerCase())
      const matchesPromo = promoFilter === 'all' || u.group === promoFilter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'valid' && u.isValidated === true) ||
        (statusFilter === 'pending' && u.isValidated === false)

      return matchesSearch && matchesPromo && matchesStatus
    })
  }, [users, searchQuery, promoFilter, statusFilter])

  const students = filteredUsers.filter((u) => u.role === 'student')
  const teachers = filteredUsers.filter((u) => u.role === 'teacher')

  if (loading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
        <Spinner size="large" color="$blue10" />
        <Text marginTop="$4" color="$gray10">
          Chargement de l'annuaire...
        </Text>
      </YStack>
    )
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$6" gap="$6" paddingBottom="$10">
          {/* --- EN-TÊTE --- */}
          <XStack justifyContent="space-between" alignItems="flex-end" flexWrap="wrap" gap="$4">
            <YStack gap="$2">
              <H1 size="$9" color="$blue10" fontWeight="900">
                Annuaire
              </H1>
              <Text color="$gray11" fontSize="$4">
                Gérez les accès, les classes et les groupes de vos utilisateurs.
              </Text>
            </YStack>
            <Button icon={RotateCw} size="$3" theme="blue" onPress={loadData}>
              Actualiser
            </Button>
          </XStack>

          {/* --- ZONE D'IMPORT GLISSER DÉPOSER --- */}
          <UserCSVUploader onImportSuccess={loadData} />

          {/* --- SECTION FILTRES (Modernisée) --- */}
          <Card padding="$4" backgroundColor="white" borderWidth={1} borderColor="$borderColor">
            <XStack gap="$4" flexWrap="wrap" alignItems="center">
              {/* Recherche */}
              <XStack
                flex={2}
                minWidth={250}
                alignItems="center"
                backgroundColor="$gray2"
                paddingHorizontal="$3"
                borderRadius="$4"
                borderWidth={1}
                borderColor="transparent"
                focusStyle={{ borderColor: '$blue8' }}
              >
                <Search size={18} color="$gray8" />
                <Input
                  flex={1}
                  borderWidth={0}
                  backgroundColor="transparent"
                  placeholder="Rechercher un nom, un email..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </XStack>

              {/* Filtre Promotion */}
              <XStack
                flex={1}
                minWidth={150}
                alignItems="center"
                gap="$2"
                backgroundColor="$gray2"
                paddingHorizontal="$3"
                borderRadius="$4"
                height={44}
              >
                <Filter size={16} color="$gray8" />
                <select
                  style={selectStyle}
                  value={promoFilter}
                  onChange={(e) => setPromoFilter(e.target.value)}
                >
                  <option value="all">Toutes les promos</option>
                  {availableGroups.map((g) => (
                    <option key={g.id} value={g.name}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </XStack>

              {/* Filtre Statut */}
              <XStack
                flex={1}
                minWidth={150}
                alignItems="center"
                gap="$2"
                backgroundColor="$gray2"
                paddingHorizontal="$3"
                borderRadius="$4"
                height={44}
              >
                <ShieldCheck size={16} color="$gray8" />
                <select
                  style={selectStyle}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="valid">Comptes Validés</option>
                  <option value="pending">En attente de validation</option>
                </select>
              </XStack>

              <Button
                size="$3"
                chromeless
                theme="red"
                onPress={() => {
                  setSearchQuery('')
                  setPromoFilter('all')
                  setStatusFilter('all')
                }}
              >
                Réinitialiser
              </Button>
            </XStack>
          </Card>

          {/* --- LISTE TABS --- */}
          <Tabs defaultValue="tab1" orientation="horizontal" flexDirection="column" width="100%">
            <Tabs.List
              backgroundColor="transparent"
              borderBottomWidth={1}
              borderColor="$borderColor"
              borderRadius={0}
              paddingBottom="$2"
              gap="$4"
            >
              <Tabs.Tab
                value="tab1"
                unstyled
                paddingVertical="$2"
                paddingHorizontal="$4"
                cursor="pointer"
              >
                <XStack alignItems="center" gap="$2">
                  <Users size={18} />
                  <Text fontWeight="bold" fontSize="$5">
                    Étudiants
                  </Text>
                  <YStack backgroundColor="$blue3" paddingHorizontal="$2" borderRadius="$10">
                    <Text color="$blue10" fontSize="$2" fontWeight="bold">
                      {students.length}
                    </Text>
                  </YStack>
                </XStack>
              </Tabs.Tab>

              <Tabs.Tab
                value="tab2"
                unstyled
                paddingVertical="$2"
                paddingHorizontal="$4"
                cursor="pointer"
              >
                <XStack alignItems="center" gap="$2">
                  <ShieldCheck size={18} />
                  <Text fontWeight="bold" fontSize="$5">
                    Enseignants
                  </Text>
                  <YStack backgroundColor="$green3" paddingHorizontal="$2" borderRadius="$10">
                    <Text color="$green10" fontSize="$2" fontWeight="bold">
                      {teachers.length}
                    </Text>
                  </YStack>
                </XStack>
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Content value="tab1" marginTop="$4">
              <UserGrid
                users={students}
                type="élèves"
                groups={availableGroups}
                onUpdate={loadData}
              />
            </Tabs.Content>

            <Tabs.Content value="tab2" marginTop="$4">
              <UserGrid
                users={teachers}
                type="enseignants"
                groups={availableGroups}
                onUpdate={loadData}
              />
            </Tabs.Content>
          </Tabs>
        </YStack>
      </ScrollView>
    </YStack>
  )
}

// --- SOUS-COMPOSANTS ---

function UserGrid({ users, type, groups, onUpdate }: any) {
  if (users.length === 0)
    return (
      <YStack
        padding="$8"
        alignItems="center"
        backgroundColor="$gray2"
        borderRadius="$4"
        borderWidth={1}
        borderColor="$borderColor"
        borderStyle="dashed"
      >
        <Users size={32} color="$gray8" marginBottom="$2" />
        <Text color="$gray10">Aucun {type} ne correspond aux critères de recherche.</Text>
      </YStack>
    )

  return (
    <XStack gap="$4" flexWrap="wrap" justifyContent="flex-start">
      {users.map((user: any) => (
        <UserDetailCard key={user.uid} user={user} groups={groups} onUpdate={onUpdate} />
      ))}
    </XStack>
  )
}

function UserDetailCard({ user, groups, onUpdate }: any) {
  const isValid = user.isValidated === true
  const [selectedGroup, setSelectedGroup] = useState(user.group || '')
  const [selectedSubGroups, setSelectedSubGroups] = useState<string[]>(user.subGroups || [])

  const currentGroupData = groups.find((g: any) => g.name === selectedGroup)
  const availableSubGroups = currentGroupData?.subGroups || []

  const toggleSubGroup = (name: string) => {
    if (selectedSubGroups.includes(name)) {
      setSelectedSubGroups(selectedSubGroups.filter((sg) => sg !== name))
    } else {
      setSelectedSubGroups([...selectedSubGroups, name])
    }
  }

  const handleSave = async () => {
    await updateUserGroups(user.uid, selectedGroup, selectedSubGroups)
    onUpdate()
  }

  const hasChanged =
    selectedGroup !== user.group ||
    JSON.stringify([...selectedSubGroups].sort()) !==
      JSON.stringify([...(user.subGroups || [])].sort())

  // Initiales pour l'avatar
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()

  return (
    <Card
      padding="$4"
      width={340} // Un peu plus large pour respirer
      borderWidth={1}
      borderColor="$borderColor"
      backgroundColor="white"
      hoverStyle={{ scale: 0.99, borderColor: '$blue8' }}
    >
      <YStack gap="$4">
        {/* EN-TÊTE CARTE */}
        <XStack gap="$3" alignItems="center">
          <Avatar circular size="$4" backgroundColor="$blue3">
            <Text color="$blue10" fontWeight="bold" fontSize="$4">
              {initials || '?'}
            </Text>
          </Avatar>

          <YStack flex={1}>
            <Text fontWeight="bold" fontSize="$5" numberOfLines={1}>
              {user.lastName?.toUpperCase()} {user.firstName}
            </Text>
            <Text fontSize="$3" color="$gray11" numberOfLines={1}>
              {user.email}
            </Text>
          </YStack>

          {/* Badge de statut */}
          <YStack
            backgroundColor={isValid ? '$green2' : '$orange2'}
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius="$10"
          >
            <Text fontSize="$2" fontWeight="bold" color={isValid ? '$green10' : '$orange10'}>
              {isValid ? 'Actif' : 'En attente'}
            </Text>
          </YStack>
        </XStack>

        <Separator borderColor="$gray4" />

        {/* ASSIGNATION */}
        <YStack gap="$3" backgroundColor="$gray2" padding="$3" borderRadius="$4">
          <YStack gap="$1">
            <Text
              fontSize="$2"
              color="$gray11"
              textTransform="uppercase"
              letterSpacing={1}
              fontWeight="bold"
            >
              Classe Principale
            </Text>
            <select
              style={miniSelectStyle}
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value)
                setSelectedSubGroups([])
              }}
            >
              <option value="">-- Non assigné --</option>
              {groups.map((g: any) => (
                <option key={g.id} value={g.name}>
                  {g.name}
                </option>
              ))}
            </select>
          </YStack>

          {selectedGroup && availableSubGroups.length > 0 && (
            <YStack gap="$2" marginTop="$1">
              <Text
                fontSize="$2"
                color="$gray11"
                textTransform="uppercase"
                letterSpacing={1}
                fontWeight="bold"
              >
                Sous-groupes (Options)
              </Text>
              <XStack flexWrap="wrap" gap="$2">
                {availableSubGroups.map((sg: string) => {
                  const isSelected = selectedSubGroups.includes(sg)
                  return (
                    <Button
                      key={sg}
                      size="$2"
                      theme={isSelected ? 'blue' : undefined}
                      backgroundColor={isSelected ? '$blue3' : 'white'}
                      onPress={() => toggleSubGroup(sg)}
                      borderWidth={1}
                      borderColor={isSelected ? '$blue8' : '$borderColor'}
                    >
                      <Text
                        fontSize="$2"
                        color={isSelected ? '$blue10' : '$gray11'}
                        fontWeight={isSelected ? 'bold' : 'normal'}
                      >
                        {sg}
                      </Text>
                      {isSelected && <Check size={12} color="$blue10" />}
                    </Button>
                  )
                })}
              </XStack>
            </YStack>
          )}

          {/* Bouton de sauvegarde animé */}
          {hasChanged && (
            <Button size="$3" theme="green" marginTop="$2" onPress={handleSave}>
              <Check size={16} /> Sauvegarder l'assignation
            </Button>
          )}
        </YStack>

        {/* INFOS COMPLÉMENTAIRES */}
        <XStack justifyContent="space-between" alignItems="center" marginTop="$1">
          <XStack alignItems="center" gap="$2">
            <Calendar size={14} color="$gray10" />
            <Text fontSize="$2" color="$gray11">
              {user.birthDate || 'Date inconnue'}
            </Text>
          </XStack>
          <XStack alignItems="center" gap="$2">
            <Hash size={14} color="$gray10" />
            <Text fontSize="$2" color="$gray9">
              ID: {user.uid?.substring(0, 6)}
            </Text>
          </XStack>
        </XStack>
      </YStack>
    </Card>
  )
}

// === COMPOSANT UPLOADER CSV (Plus discret et esthétique) ===
function UserCSVUploader({ onImportSuccess }: { onImportSuccess: () => void }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file || (!file.name.endsWith('.csv') && !file.name.endsWith('.txt'))) {
      alert('Format invalide. Veuillez utiliser un fichier CSV.')
      return
    }

    setUploading(true)
    try {
      const text = await file.text()
      const count = await importUsersFromCSV(text)
      alert(`${count} élèves importés avec succès !`)
      onImportSuccess()
    } catch (error) {
      console.error(error)
      alert("Erreur lors de l'importation.")
    } finally {
      setUploading(false)
      setIsDragOver(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDrop = (e: any) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  return (
    <Card
      padding="$4"
      borderWidth={2}
      borderStyle="dashed"
      borderColor={isDragOver ? '$blue8' : '$borderColor'}
      backgroundColor={isDragOver ? '$blue2' : 'white'}
      onDragOver={(e: any) => {
        e.preventDefault()
        setIsDragOver(true)
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      cursor="pointer"
      onPress={() => fileInputRef.current?.click()}
      hoverStyle={{ borderColor: '$blue8', backgroundColor: '$blue1' }}
    >
      <XStack alignItems="center" justifyContent="center" gap="$4">
        <input
          type="file"
          accept=".csv,.txt"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
        />
        {uploading ? (
          <Spinner size="large" color="$blue10" />
        ) : (
          <YStack backgroundColor="$blue3" padding="$3" borderRadius="$10">
            <UploadCloud size={24} color="$blue10" />
          </YStack>
        )}
        <YStack>
          <Text fontWeight="bold" fontSize="$4" color="$gray12">
            {uploading ? 'Importation en cours...' : "Importer une liste d'étudiants (CSV)"}
          </Text>
          <Text fontSize="$2" color="$gray10">
            Glissez-déposez ou cliquez ici. (Nom, Prénom, Email, Date, Classe)
          </Text>
        </YStack>
      </XStack>
    </Card>
  )
}

// --- STYLES CSS INLINE POUR LES SELECT NOUVELLE GÉNÉRATION ---
const selectStyle = {
  flex: 1,
  padding: '0px',
  border: 'none',
  outline: 'none',
  fontSize: '14px',
  backgroundColor: 'transparent',
  color: '#444',
  cursor: 'pointer',
}

const miniSelectStyle = {
  width: '100%',
  padding: '8px',
  borderRadius: '6px',
  border: '1px solid #ddd',
  fontSize: '14px',
  backgroundColor: 'white',
  cursor: 'pointer',
  outline: 'none',
}
