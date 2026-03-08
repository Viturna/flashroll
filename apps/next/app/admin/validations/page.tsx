'use client'

import React, { useState, useEffect } from 'react'
import { YStack, XStack, Text, Card, H1, Button, Spinner, ScrollView } from 'tamagui'
import { Check, UserX, RefreshCw } from '@tamagui/lucide-icons'
import { getPendingUsers, validateUser } from 'app/services/auth-service'

export default function UserValidationPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadUsers = async () => {
    setLoading(true)
    const pending = await getPendingUsers()
    setUsers(pending)
    setLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleValidate = async (uid: string) => {
    setActionLoading(uid)
    await validateUser(uid)
    setUsers(users.filter((u) => u.uid !== uid)) 
    setActionLoading(null)
  }

  if (loading) return <Spinner size="large" mt="$10" color="$blue10" />

  return (
    <YStack p="$6" gap="$6" flex={1} backgroundColor="$background">
      <XStack justifyContent="space-between" alignItems="center">
        <H1>Validations en attente</H1>
        <Button icon={RefreshCw} circular onPress={loadUsers} />
      </XStack>

      <ScrollView>
        <YStack gap="$4">
          {users.length > 0 ? (
            users.map((user) => (
              <Card key={user.uid} p="$4">
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack gap="$1">
                    <Text fontWeight="bold" fontSize="$5">
                      {user.firstName} {user.lastName}
                    </Text>
                    <Text color="$gray10">{user.email}</Text>
                    <Text fontSize="$2">
                      Rôle: {user.role}
                    </Text>
                  </YStack>

                  <XStack gap="$2">
                    <Button
                      theme="green"
                      icon={actionLoading === user.uid ? <Spinner /> : Check}
                      onPress={() => handleValidate(user.uid)}
                      disabled={!!actionLoading}
                    >
                      Valider
                    </Button>
                    <Button theme="red" variant="outlined" icon={UserX}>
                      Refuser
                    </Button>
                  </XStack>
                </XStack>
              </Card>
            ))
          ) : (
            <YStack alignItems="center" p="$10">
              <Text color="$gray10">Aucun utilisateur en attente de validation.</Text>
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  )
}
