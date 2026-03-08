'use client'

import React, { useEffect, useState } from 'react'
import { YStack, XStack, Text, Button, Spinner } from 'tamagui'
import {
  LayoutDashboard,
  UserCheck,
  LogOut,
  User,
  Users,
  Calendar,
  BookCheck,
} from '@tamagui/lucide-icons'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { onAuthStateChanged, signOut, type Auth } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

import { auth, db } from 'app/utils/firebase'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth as Auth, async (user) => {
      if (!user) {
        setIsAdmin(false)
        if (pathname !== '/admin/login') {
          router.replace('/admin/login')
        } else {
          setLoading(false)
        }
        return
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))

        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true)
        } else {
          setIsAdmin(false)
          if (pathname !== '/admin/login') {
            alert('Accès refusé : Réservé aux administrateurs.')
            await signOut(auth as Auth)
            router.replace('/admin/login')
          }
        }
      } catch (error) {
        console.error('Erreur vérification admin:', error)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [pathname, router])

  const handleLogout = async () => {
    try {
      // CORRECTION ICI AUSSI
      await signOut(auth as Auth)
      router.replace('/admin/login')
    } catch (error) {
      console.error('Erreur lors de la déconnexion', error)
    }
  }

  const menuItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Validations', href: '/admin/validations', icon: UserCheck },
    { label: 'Justifications', href: '/admin/justifications', icon: BookCheck },
    { label: 'Utilisateurs', href: '/admin/users', icon: User },
    { label: 'Classes', href: '/admin/groups', icon: Users },
    { label: 'Sessions', href: '/admin/sessions', icon: Calendar },
  ]

  if (loading) {
    return (
      <YStack
        flex={1}
        height="100vh"
        justifyContent="center"
        alignItems="center"
        backgroundColor="$background"
      >
        <Spinner size="large" color="$blue10" />
        <Text marginTop="$4" color="$gray10">
          Vérification de l'accès sécurisé...
        </Text>
      </YStack>
    )
  }

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  if (!isAdmin) return null

  return (
    <XStack height="100vh" width="100vw" backgroundColor="$background">
      {/* SIDEBAR */}
      <YStack width={280} borderRightWidth={1} borderColor="$borderColor" p="$4" gap="$4">
        <Text fontSize="$6" fontWeight="600" p="$4" color="$blue10">
          FlashRoll Admin
        </Text>

        <YStack flex={1} gap="$2">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <Button
                justifyContent="flex-start"
                icon={item.icon}
                backgroundColor={pathname === item.href ? '$blue5' : 'transparent'}
                chromeless
                width="100%"
              >
                <Text color={pathname === item.href ? '$blue10' : '$gray11'}>{item.label}</Text>
              </Button>
            </Link>
          ))}
        </YStack>

        <Button
          icon={LogOut}
          chromeless
          theme="red"
          justifyContent="flex-start"
          hoverStyle={{ backgroundColor: '$red2' }}
          onPress={handleLogout}
        >
          Déconnexion
        </Button>
      </YStack>

      {/* CONTENU PRINCIPAL */}
      <YStack flex={1} overflowY="auto" backgroundColor="$gray1">
        {children}
      </YStack>
    </XStack>
  )
}
