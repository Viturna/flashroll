import { db } from '../utils/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

export const createAttendanceSession = async (
  teacherId: string,
  courseName: string,
  groupId: string,
  endTime: string,
) => {
  try {
    const docRef = await addDoc(collection(db, 'sessions'), {
      courseName: courseName,
      teacherId: teacherId,
      groupId: groupId,
      startTime: serverTimestamp(),
      endTime: endTime,
      isActive: true,
      presents: [],
    })

    console.log("Session créée avec l'ID: ", docRef.id)
    return docRef.id
  } catch (e) {
    console.error('Erreur création session: ', e)
  }
}
