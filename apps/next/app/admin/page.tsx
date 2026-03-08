'use client'

import React, { useState, useEffect } from 'react'
import { YStack, XStack, Text, Card, H1, H2, Spinner, ScrollView, Separator } from 'tamagui'
import {
  Users,
  Clock,
  ShieldCheck,
  BookOpen,
  Activity,
  FileWarning,
  GraduationCap,
} from '@tamagui/lucide-icons'

// Import du nouveau service !
import { getDashboardRealStats } from 'app/services/dashboard-service'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    async function loadRealData() {
      setLoading(true)
      const stats = await getDashboardRealStats()
      setData(stats)
      setLoading(false)
    }

    loadRealData()
  }, [])

  if (loading || !data) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
        <Spinner size="large" color="$blue10" />
        <Text marginTop="$4" color="$gray10">
          Chargement des données en temps réel...
        </Text>
      </YStack>
    )
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$6" gap="$6" paddingBottom="$10">
          {/* --- EN-TÊTE --- */}
          <YStack gap="$2">
            <H1 size="$9" color="$blue10" fontWeight="900">
              Tableau de bord
            </H1>
            <Text color="$gray11" fontSize="$4">
              Vue d'ensemble de l'établissement en temps réel.
            </Text>
          </YStack>

          {data.students === 0 && data.teachers === 0 && (
            <Card backgroundColor="$red2" borderColor="$red6" borderWidth={1} padding="$4">
              <Text color="$red10" fontWeight="bold">
                ⚠️ Attention : Aucun utilisateur trouvé dans la base de données.
              </Text>
            </Card>
          )}

          {/* --- SECTION 1 : UTILISATEURS --- */}
          <YStack gap="$4" marginTop="$4">
            <H2 size="$6" fontWeight="bold" color="$gray12">
              Communauté
            </H2>
            <XStack gap="$4" flexWrap="wrap">
              <StatCard
                title="Total Inscrits"
                value={data.totalUsers}
                icon={Users}
                color="$blue10"
                bg="$blue2"
              />
              <StatCard
                title="Élèves"
                value={data.students}
                icon={GraduationCap}
                color="$purple10"
                bg="$purple2"
              />
              <StatCard
                title="Enseignants"
                value={data.teachers}
                icon={ShieldCheck}
                color="$green10"
                bg="$green2"
              />
              <StatCard
                title="Comptes en attente"
                value={data.toValidate}
                icon={Clock}
                color="$orange10"
                bg="$orange2"
                alert={data.toValidate > 0}
              />
            </XStack>
          </YStack>

          <Separator marginVertical="$4" borderColor="$borderColor" />

          {/* --- SECTION 2 : PÉDAGOGIE & ABSENCES --- */}
          <YStack gap="$4">
            <H2 size="$6" fontWeight="bold" color="$gray12">
              Activité du jour
            </H2>
            <XStack gap="$4" flexWrap="wrap">
              <StatCard
                title="Cours aujourd'hui"
                value={data.totalSessionsToday}
                icon={BookOpen}
                color="$gray11"
                bg="$gray3"
              />
              <StatCard
                title="Cours en direct"
                value={data.activeSessions}
                icon={Activity}
                color="$red10"
                bg="$red2"
                pulse={data.activeSessions > 0}
              />
              <StatCard
                title="Justificatifs à traiter"
                value={data.pendingJustifications}
                icon={FileWarning}
                color="$orange10"
                bg="$orange2"
                alert={data.pendingJustifications > 0}
              />
            </XStack>
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  )
}

// --- SOUS-COMPOSANT : CARTE STATISTIQUE ---
function StatCard({ title, value, icon: Icon, color, bg, alert, pulse }: any) {
  return (
    <Card
      flex={1}
      minWidth={240}
      padding="$5"
      borderWidth={1}
      borderColor={alert ? '$orange6' : '$borderColor'}
      backgroundColor="white"
      hoverStyle={{ scale: 0.98, borderColor: color }}
    >
      <XStack justifyContent="space-between" alignItems="flex-start">
        <YStack flex={1}>
          <Text
            color="$gray11"
            fontSize="$3"
            textTransform="uppercase"
            letterSpacing={1}
            fontWeight="600"
          >
            {title}
          </Text>
          <Text fontSize="$9" fontWeight="900" color="$gray12" marginTop="$2">
            {value}
          </Text>

          {alert && (
            <Text fontSize="$3" color="$orange10" marginTop="$2" fontWeight="bold">
              Action requise
            </Text>
          )}
        </YStack>

        <YStack padding="$3" backgroundColor={bg} borderRadius="$4">
          <Icon size={26} color={color} />
        </YStack>
      </XStack>
    </Card>
  )
}
