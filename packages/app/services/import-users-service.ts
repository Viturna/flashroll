import { db } from '../utils/firebase'
import { collection, doc, setDoc, query, where, getDocs } from 'firebase/firestore'

export const importUsersFromCSV = async (csvContent: string) => {
  // Découper le CSV ligne par ligne
  const lines = csvContent.split('\n')

  // Ignorer la première ligne (en-têtes)
  const rows = lines.slice(1).filter((line) => line.trim().length > 0)

  let successCount = 0

  for (const row of rows) {
    try {
      const columns = row.split(/[,;]/).map((col) => col.replace(/['"]+/g, '').trim())

      if (columns.length < 3) continue

      const lastName = columns[0]
      const firstName = columns[1]
      const email = columns[2].toLowerCase()
      const birthDate = columns[3] || ''
      const group = columns[4] || ''
      const subGroupsRaw = columns[5] || ''
      const subGroups = subGroupsRaw ? subGroupsRaw.split('-').map((s) => s.trim()) : []

      // Vérifier si un compte avec cet email existe déjà
      const q = query(collection(db, 'users'), where('email', '==', email))
      const snap = await getDocs(q)

      // On utilise un ID temporaire commençant par "import_"
      let docId = 'import_' + Date.now() + Math.floor(Math.random() * 1000)

      if (!snap.empty) {
        // Si l'utilisateur existe déjà, MAJ document existant
        docId = snap.docs[0].id
      }

      // Créer ou mettre à jour le document Firestore
      await setDoc(
        doc(db, 'users', docId),
        {
          uid: docId, // Sera écrasé par le vrai UID quand l'élève s'inscrira
          email: email,
          firstName: firstName,
          lastName: lastName,
          birthDate: birthDate,
          group: group,
          subGroups: subGroups,
          role: 'student',
          isValidated: true,
          profileCompleted: true,
          importedAt: new Date().toISOString(),
          isRegistered: false,
        },
        { merge: true }
      )

      successCount++
    } catch (e) {
      console.error('Erreur import ligne:', row, e)
    }
  }

  return successCount
}
