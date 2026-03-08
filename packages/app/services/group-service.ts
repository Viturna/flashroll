import { db } from '../utils/firebase'
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'

export const createGroup = async (name: string, year: string, subGroups: string[]) => {
  return await addDoc(collection(db, 'groups'), {
    name,
    year,
    subGroups,
    createdAt: serverTimestamp(),
    studentCount: 0,
  })
}

export const getGroups = async () => {
  const snapshot = await getDocs(collection(db, 'groups'))
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const deleteGroup = async (id: string) => {
  await deleteDoc(doc(db, 'groups', id))
}
