'use client'

import React, { useState, useEffect } from 'react'
import {
  YStack,
  XStack,
  H1,
  H2,
  Paragraph,
  Card,
  Button,
  Text,
  Spinner,
  ScrollView,
  Separator,
} from 'tamagui'
import {
  CheckCircle,
  XCircle,
  FileText,
  Clock as ClockIcon,
  RefreshCw,
} from '@tamagui/lucide-icons'

import { db } from 'app/utils/firebase'
import { collection, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore'

export default function AdminJustificationsPage() {
  const [loading, setLoading] = useState(true)
  const [justifications, setJustifications] = useState<any[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)

  const fetchJustifications = async () => {
    setLoading(true)
    try {
      // 1. Récupérer toutes les demandes triées par date de création (les plus récentes en premier)
      const q = query(collection(db, 'justifications'), orderBy('createdAt', 'desc'))
      const justifSnap = await getDocs(q)

      // 2. Récupérer tous les utilisateurs pour faire la correspondance ID -> Nom
      const usersSnap = await getDocs(collection(db, 'users'))
      const usersMap: Record<string, any> = {}
      usersSnap.docs.forEach((d) => {
        usersMap[d.id] = d.data()
      })

      // 3. Fusionner les données
      const data = justifSnap.docs.map((d) => {
        const jData = d.data()
        const student = usersMap[jData.studentId]

        return {
          id: d.id,
          ...jData,
          studentName: student
            ? `${student.lastName?.toUpperCase()} ${student.firstName}`
            : 'Étudiant inconnu',
          studentEmail: student?.email || 'Email inconnu',
          dateObj: jData.createdAt?.toDate ? jData.createdAt.toDate() : new Date(),
        }
      })

      setJustifications(data)
    } catch (error) {
      console.error('Erreur récupération des justificatifs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJustifications()
  }, [])

  // Fonction pour Accepter ou Refuser un justificatif
  const handleAction = async (id: string, newStatus: 'approved' | 'rejected') => {
    setProcessingId(id)
    try {
      await updateDoc(doc(db, 'justifications', id), {
        status: newStatus,
      })
      // Mettre à jour l'affichage localement sans recharger toute la base
      setJustifications((prev) => prev.map((j) => (j.id === id ? { ...j, status: newStatus } : j)))
    } catch (error) {
      console.error('Erreur de mise à jour:', error)
      alert("Une erreur s'est produite lors de la mise à jour.")
    } finally {
      setProcessingId(null)
    }
  }

  // Séparer les demandes "En attente" de l'historique
  const pendingRequests = justifications.filter((j) => j.status === 'pending')
  const processedRequests = justifications.filter((j) => j.status !== 'pending')

  if (loading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
        <Spinner size="large" color="$blue10" />
      </YStack>
    )
  }

  return (
    <YStack flex={1} padding="$6" gap="$6" backgroundColor="$background">
      <XStack justifyContent="space-between" alignItems="center">
        <H1>Gestion des Justificatifs</H1>
        <Button icon={RefreshCw} size="$3" variant="outlined" onPress={fetchJustifications}>
          Actualiser
        </Button>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* --- SECTION : EN ATTENTE --- */}
        <YStack gap="$4" marginBottom="$8">
          <H2 color="$orange10">À traiter ({pendingRequests.length})</H2>

          {pendingRequests.length === 0 ? (
            <Paragraph color="$gray10" fontStyle="italic">
              Aucune demande en attente.
            </Paragraph>
          ) : (
            pendingRequests.map((j) => (
              <JustificationCard
                key={j.id}
                data={j}
                onAccept={() => handleAction(j.id, 'approved')}
                onReject={() => handleAction(j.id, 'rejected')}
                isProcessing={processingId === j.id}
              />
            ))
          )}
        </YStack>

        <Separator />

        {/* --- SECTION : HISTORIQUE --- */}
        <YStack gap="$4" marginTop="$6" paddingBottom="$10">
          <H2 color="$gray11">Historique ({processedRequests.length})</H2>

          {processedRequests.length === 0 ? (
            <Paragraph color="$gray10" fontStyle="italic">
              Aucun historique.
            </Paragraph>
          ) : (
            processedRequests.map((j) => <JustificationCard key={j.id} data={j} isHistory />)
          )}
        </YStack>
      </ScrollView>
    </YStack>
  )
}

// Sous-composant pour afficher une carte de justificatif proprement
function JustificationCard({
  data,
  onAccept,
  onReject,
  isProcessing = false,
  isHistory = false,
}: {
  data: any
  onAccept?: () => void
  onReject?: () => void
  isProcessing?: boolean
  isHistory?: boolean
}) {
  const dateStr = data.dateObj.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Card padding="$4" borderColor="$borderColor" backgroundColor="white">
      <YStack gap="$3">
        {/* En-tête : Étudiant & Date */}
        <XStack justifyContent="space-between" alignItems="flex-start">
          <YStack>
            <Text fontWeight="bold" fontSize="$5">
              {data.studentName}
            </Text>
            <Text color="$gray11" fontSize="$3">
              {data.studentEmail}
            </Text>
          </YStack>
          <Text color="$gray10" fontSize="$2">
            {dateStr}
          </Text>
        </XStack>

        {/* Détails du cours */}
        <YStack backgroundColor="$gray2" padding="$3" borderRadius="$4">
          <Text fontWeight="bold" color="$blue10">
            Cours manqué :
          </Text>
          <Text>{data.courseName}</Text>
        </YStack>

        {/* Message de l'étudiant */}
        <YStack>
          <Text fontWeight="bold" color="$gray11" fontSize="$3">
            Motif / Message :
          </Text>
          <Paragraph marginTop="$1">{data.message || 'Aucun message fourni.'}</Paragraph>
        </YStack>

        {/* Pièce jointe */}
        {data.fileName && (
          <XStack
            alignItems="center"
            gap="$2"
            backgroundColor="$blue2"
            padding="$2"
            borderRadius="$4"
            alignSelf="flex-start"
          >
            <FileText size={16} color="$blue10" />
            <Text color="$blue10" fontSize="$3" fontWeight="bold">
              Fichier joint : {data.fileName}
            </Text>
          </XStack>
        )}

        {/* Boutons d'action (si en attente) */}
        {!isHistory && (
          <XStack gap="$3" marginTop="$2">
            <Button
              flex={1}
              theme="green"
              icon={isProcessing ? <Spinner /> : CheckCircle}
              onPress={onAccept}
              disabled={isProcessing}
            >
              Accepter
            </Button>
            <Button
              flex={1}
              theme="red"
              icon={isProcessing ? <Spinner /> : XCircle}
              onPress={onReject}
              disabled={isProcessing}
            >
              Refuser
            </Button>
          </XStack>
        )}

        {/* Badge de statut (si historique) */}
        {isHistory && (
          <XStack
            marginTop="$2"
            alignSelf="flex-start"
            alignItems="center"
            gap="$2"
            paddingHorizontal="$3"
            paddingVertical="$1.5"
            borderRadius="$4"
            backgroundColor={data.status === 'approved' ? '$green2' : '$red2'}
          >
            {data.status === 'approved' ? (
              <CheckCircle size={14} color="$green10" />
            ) : (
              <XCircle size={14} color="$red10" />
            )}
            <Text
              fontWeight="bold"
              fontSize="$2"
              color={data.status === 'approved' ? '$green10' : '$red10'}
            >
              {data.status === 'approved' ? 'Absence justifiée' : 'Justificatif refusé'}
            </Text>
          </XStack>
        )}
      </YStack>
    </Card>
  )
}
