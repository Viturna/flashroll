import { db } from '../utils/firebase'
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  Timestamp,
} from 'firebase/firestore'

export const createAttendanceSession = async (
  teacherId: string,
  courseName: string,
  groupId: string,
  startTimeString: string,
  endTimeString: string,
  teachersArray: string[]
) => {
  try {
    const now = new Date()

    const [startHours, startMinutes] = startTimeString.split(':')
    const startDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      parseInt(startHours),
      parseInt(startMinutes)
    )

    const [endHours, endMinutes] = endTimeString.split(':')
    const endDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      parseInt(endHours),
      parseInt(endMinutes)
    )

    const docRef = await addDoc(collection(db, 'sessions'), {
      courseName,
      teacherId,
      teachersNames: teachersArray,
      groupId,
      startTime: Timestamp.fromDate(startDate),
      endTime: Timestamp.fromDate(endDate),
      isActive: false,
      presents: [],
    })

    return docRef.id
  } catch (e) {
    console.error(e)
  }
}

export const getStudentSchedule = async (uid: string) => {
  const userDoc = await getDoc(doc(db, 'users', uid))
  if (!userDoc.exists()) throw new Error('Profil introuvable.')

  const userData = userDoc.data()
  const myGroups = [userData.group, ...(userData.subGroups || [])].filter(Boolean)

  if (myGroups.length === 0) return []

  const q = query(collection(db, 'sessions'), where('groupId', 'in', myGroups))
  const snap = await getDocs(q)

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  let fetchedSessions = snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as any)
    .filter((session) => session.startTime?.toDate() >= now)

  fetchedSessions.sort((a, b) => a.startTime.toMillis() - b.startTime.toMillis())

  return fetchedSessions
}
