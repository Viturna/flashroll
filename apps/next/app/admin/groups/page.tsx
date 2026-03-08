'use client'

import React, { useState, useEffect } from 'react'
import {
  YStack,
  XStack,
  Text,
  Card,
  H1,
  H2,
  Button,
  Input,
  ScrollView,
  Separator,
  Spinner,
} from 'tamagui'
import { Plus, Trash2, Users, Layers } from '@tamagui/lucide-icons'
import { createGroup, getGroups, deleteGroup } from 'app/services/group-service'

export default function GroupsAdminPage() {
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<any[]>([])

  // Formulaire
  const [name, setName] = useState('')
  const [year, setYear] = useState('2025-2026')
  const [subGroupInput, setSubGroupInput] = useState('')
  const [subGroups, setSubGroups] = useState<string[]>([])

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    setLoading(false)
    const data = await getGroups()
    setGroups(data)
  }

  const handleAddSubGroup = () => {
    if (subGroupInput.trim()) {
      setSubGroups([...subGroups, subGroupInput.trim()])
      setSubGroupInput('')
    }
  }

  const handleCreate = async () => {
    if (!name) return alert('Nom requis')
    await createGroup(name, year, subGroups)
    setName('')
    setSubGroups([])
    loadGroups()
  }

  return (
    <XStack
      padding="$6"
      gap="$6"
      flex={1}
      backgroundColor="$background"
      $sm={{ flexDirection: 'column' }}
    >
      <YStack width={350} gap="$4" $sm={{ width: '100%' }}>
        <H2>Créer une Classe</H2>
        <Card padding="$4">
          <YStack gap="$3">
            <Text fontWeight="bold">Nom de la promotion</Text>
            <Input placeholder="ex: M1_DEV" value={name} onChangeText={setName} />

            <Text fontWeight="bold">Année scolaire</Text>
            <Input value={year} onChangeText={setYear} />

            <Separator />

            <Text fontWeight="bold">Sous-groupes (TP, TD...)</Text>
            <XStack gap="$2">
              <Input
                flex={1}
                placeholder="ex: TP1"
                value={subGroupInput}
                onChangeText={setSubGroupInput}
                onKeyPress={(e) => e.nativeEvent.key === 'Enter' && handleAddSubGroup()}
              />
              <Button icon={Plus} onPress={handleAddSubGroup} />
            </XStack>

            <XStack flexWrap="wrap" gap="$2">
              {subGroups.map((sg) => (
                <YStack key={sg} backgroundColor="$blue5" paddingHorizontal="$2" borderRadius="$2">
                  <Text fontSize="$2">{sg}</Text>
                </YStack>
              ))}
            </XStack>

            <Button theme="blue" marginTop="$4" onPress={handleCreate}>
              Enregistrer la classe
            </Button>
          </YStack>
        </Card>
      </YStack>

      <YStack flex={1} gap="$4">
        <H2>Classes Existantes</H2>
        <ScrollView>
          <XStack gap="$4" flexWrap="wrap">
            {groups.map((group) => (
              <Card key={group.id} width={300} padding="$4">
                <YStack gap="$2">
                  <XStack justifyContent="space-between" alignItems="center">
                    <Text fontWeight="bold" fontSize="$6">
                      {group.name}
                    </Text>
                    <Button
                      size="$2"
                      theme="red"
                      chromeless
                      icon={Trash2}
                      onPress={() => deleteGroup(group.id).then(loadGroups)}
                    />
                  </XStack>

                  <XStack alignItems="center" gap="$2">
                    <Users size={16} color="$gray10" />
                    <Text color="$gray10">{group.year}</Text>
                  </XStack>

                  <Separator />

                  <Text fontSize="$3" fontWeight="bold">
                    Sous-groupes :
                  </Text>
                  <XStack gap="$2" flexWrap="wrap">
                    {group.subGroups?.map((sg: string) => (
                      <XStack
                        key={sg}
                        alignItems="center"
                        backgroundColor="$background"
                        borderWidth={1}
                        borderColor="$borderColor"
                        paddingHorizontal="$2"
                        borderRadius="$2"
                        gap="$1"
                      >
                        <Layers size={12} />
                        <Text fontSize="$2">{sg}</Text>
                      </XStack>
                    ))}
                  </XStack>
                </YStack>
              </Card>
            ))}
          </XStack>
        </ScrollView>
      </YStack>
    </XStack>
  )
}
