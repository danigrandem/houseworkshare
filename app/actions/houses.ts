'use server'

import { createClient } from '@/lib/supabase/server'
import {
  createHouse as createHouseQuery,
  acceptInvitation as acceptInvitationQuery,
  createHouseInvitation,
  getCurrentUserHouse,
  getPendingInvitationsForEmail,
  updateHouseWeekStartDay as updateHouseWeekStartDayQuery,
  updateHouseRotationWeeks as updateHouseRotationWeeksQuery,
} from '@/lib/db/queries/houses'

export async function createHouse(name: string, userId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.id !== userId) {
    throw new Error('Unauthorized')
  }

  return await createHouseQuery(name, userId)
}

export async function acceptInvitation(invitationId: string, userId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.id !== userId) {
    throw new Error('Unauthorized')
  }

  return await acceptInvitationQuery(invitationId, userId)
}

export async function inviteUser(houseId: string, email: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const currentHouse = await getCurrentUserHouse(user.id)
  if (!currentHouse || currentHouse.id !== houseId) {
    throw new Error('You are not a member of this house')
  }

  const isOwner = currentHouse.members.some(
    (m) => m.user_id === user.id && m.role === 'owner'
  )

  if (!isOwner) {
    throw new Error('Only house owners can invite members')
  }

  return await createHouseInvitation(houseId, user.id, email)
}

export async function getPendingInvitations(email: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return await getPendingInvitationsForEmail(email)
}

export async function updateHouseWeekStartDay(houseId: string, weekStartDay: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const house = await getCurrentUserHouse(user.id)
  if (!house || house.id !== houseId) {
    throw new Error('No puedes modificar esta casa')
  }

  const isOwner = house.members.some(
    (m) => m.user_id === user.id && m.role === 'owner'
  )
  if (!isOwner) {
    throw new Error('Solo el dueño puede cambiar el día de inicio de semana')
  }

  if (weekStartDay < 0 || weekStartDay > 6) {
    throw new Error('Día no válido')
  }

  await updateHouseWeekStartDayQuery(houseId, weekStartDay)
}

export async function updateHouseRotationWeeks(houseId: string, rotationWeeks: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autorizado')
  }

  const house = await getCurrentUserHouse(user.id)
  if (!house || house.id !== houseId) {
    throw new Error('No puedes modificar esta casa')
  }

  const isOwner = house.members.some(
    (m) => m.user_id === user.id && m.role === 'owner'
  )
  if (!isOwner) {
    throw new Error('Solo el dueño puede cambiar la rotación de grupos')
  }

  if (rotationWeeks < 1 || rotationWeeks > 12) {
    throw new Error('El intervalo debe estar entre 1 y 12 semanas')
  }

  await updateHouseRotationWeeksQuery(houseId, rotationWeeks)
}
