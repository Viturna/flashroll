'use client'

import React, { useState, useEffect } from 'react'
import { YStack, XStack, Button, Input, Label, Spinner, ScrollView, Card, H2 } from 'tamagui'
import { ArrowLeft, Save } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router' // (ou 'solito/router' selon ta config exacte)

import { auth, db } from '../../utils/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'

export function ProfileInfoScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    group: '',
  })

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser
        if (!user) return

        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          setFormData({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            phone: data.phone || '',
            email: data.email || '',
            group: data.group || '',
          })
        }
      } catch (error) {
        console.error('Erreur de récupération:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const user = auth.currentUser
      if (!user) return

      await updateDoc(doc(db, 'users', user.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      })

      alert('Profil mis à jour avec succès !')
      router.back()
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      alert('Erreur lors de la mise à jour.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
        <Spinner size="large" color="$blue10" />
      </YStack>
    )
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView padding="$4">
        <XStack alignItems="center" gap="$4" marginBottom="$6" marginTop="$4">
          <Button circular icon={ArrowLeft} size="$4" onPress={() => router.back()} />
          <H2>Mes Informations</H2>
        </XStack>

        <Card padding="$4" borderWidth={1} borderColor="$borderColor">
          <YStack gap="$4">
            <YStack gap="$1">
              <Label>Prénom</Label>
              <Input
                value={formData.firstName}
                onChangeText={(t) => setFormData({ ...formData, firstName: t })}
              />
            </YStack>

            <YStack gap="$1">
              <Label>Nom</Label>
              <Input
                value={formData.lastName}
                onChangeText={(t) => setFormData({ ...formData, lastName: t })}
              />
            </YStack>

            <YStack gap="$1">
              <Label>Téléphone</Label>
              <Input
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={(t) => setFormData({ ...formData, phone: t })}
                placeholder="06 12 34 56 78"
              />
            </YStack>

            <YStack gap="$1" opacity={0.6}>
              <Label>Email (Non modifiable)</Label>
              <Input value={formData.email} disabled backgroundColor="$gray3" />
            </YStack>

            <YStack gap="$1" opacity={0.6}>
              <Label>Groupe / Classe (Géré par l'école)</Label>
              <Input value={formData.group} disabled backgroundColor="$gray3" />
            </YStack>

            <Button
              theme="blue"
              marginTop="$4"
              icon={saving ? <Spinner /> : Save}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </YStack>
        </Card>
      </ScrollView>
    </YStack>
  )
}
