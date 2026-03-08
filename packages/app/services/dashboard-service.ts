import { db } from '../utils/firebase'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { getAdminStats } from './auth-service'

export const getDashboardRealStats = async () => {
  try {
    // 1. Récupération des stats utilisateurs (via ta fonction existante)
    const userStats = await getAdminStats()

    // 2. Récupération des sessions actuellement actives
    const activeSessionsQuery = query(collection(db, 'sessions'), where('isActive', '==', true))
    const activeSessionsSnap = await getDocs(activeSessionsQuery)
    const activeSessionsCount = activeSessionsSnap.size

    // 3. Récupération des justificatifs en attente ('pending')
    const pendingJustifsQuery = query(
      collection(db, 'justifications'),
      where('status', '==', 'pending')
    )
    const pendingJustifsSnap = await getDocs(pendingJustifsQuery)
    const pendingJustificationsCount = pendingJustifsSnap.size

    // 4. Récupération des cours prévus AUJOURD'HUI
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    const todaySessionsQuery = query(
      collection(db, 'sessions'),
      where('startTime', '>=', Timestamp.fromDate(startOfDay)),
      where('startTime', '<=', Timestamp.fromDate(endOfDay))
    )
    const todaySessionsSnap = await getDocs(todaySessionsQuery)
    const totalSessionsTodayCount = todaySessionsSnap.size

    // 5. On retourne tout bien formaté
    return {
      students: userStats?.students || 0,
      teachers: userStats?.teachers || 0,
      toValidate: userStats?.toValidate || 0,
      totalUsers: (userStats?.students || 0) + (userStats?.teachers || 0),
      activeSessions: activeSessionsCount,
      totalSessionsToday: totalSessionsTodayCount,
      pendingJustifications: pendingJustificationsCount,
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des stats du dashboard:', error)
    // En cas d'erreur, on renvoie des zéros pour ne pas faire crasher l'app
    return {
      students: 0,
      teachers: 0,
      toValidate: 0,
      totalUsers: 0,
      activeSessions: 0,
      totalSessionsToday: 0,
      pendingJustifications: 0,
    }
  }
}
