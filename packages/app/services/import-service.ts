import { db } from '../utils/firebase'
import { collection, addDoc, Timestamp } from 'firebase/firestore'

// Fonction pour convertir la date ICS (ex: 20260402T070000Z) en objet Date JS
const parseICSDate = (icsDate: string) => {
  const year = icsDate.substring(0, 4)
  const month = icsDate.substring(4, 6)
  const day = icsDate.substring(6, 8)
  const hour = icsDate.substring(9, 11)
  const minute = icsDate.substring(11, 13)
  const second = icsDate.substring(13, 15)
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`)
}

export const processICSFile = async (icsContent: string) => {
  const events = icsContent.split('BEGIN:VEVENT').slice(1)
  let importedCount = 0

  for (const event of events) {
    try {
      // Extraire les champs avec des expressions régulières
      const summaryMatch = event.match(/SUMMARY:(.*)/)
      const startMatch = event.match(/DTSTART:(.*)/)
      const endMatch = event.match(/DTEND:(.*)/)
      const locationMatch = event.match(/LOCATION:(.*)/)
      const descMatch = event.match(/DESCRIPTION:(.*)UID/s)

      if (!summaryMatch || !startMatch || !endMatch) continue

      const courseName = summaryMatch[1].trim()
      const startTime = parseICSDate(startMatch[1].trim())
      const endTime = parseICSDate(endMatch[1].trim())
      const location = locationMatch ? locationMatch[1].trim() : ''

      let groupId = 'Non défini'
      let teachers: string[] = []

      if (descMatch) {
        const cleanDesc = descMatch[1].replace(/\\n/g, '\n').trim()
        const lines = cleanDesc
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 0)

        if (lines.length > 0) {
          groupId = lines[0]
          teachers = lines.slice(1).filter((l) => !l.startsWith('(Exporté'))
        }
      }

      //  session dans Firestore
      await addDoc(collection(db, 'sessions'), {
        courseName,
        groupId,
        teachersNames: teachers,
        room: location,
        startTime: Timestamp.fromDate(startTime),
        endTime: Timestamp.fromDate(endTime),
        isActive: false,
        createdAt: Timestamp.now(),
      })

      importedCount++
    } catch (e) {
      console.error("Erreur lors de l'import d'un événement:", e)
    }
  }

  return importedCount
}
