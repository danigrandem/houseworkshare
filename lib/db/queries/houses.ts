import { createClient } from '@/lib/supabase/server'
import type {
  House,
  HouseWithMembers,
  HouseMember,
  HouseInvitation,
  User,
} from '@/lib/db/schema'

export async function createHouse(name: string, userId: string): Promise<House> {
  const supabase = await createClient()
  
  const { data: house, error: houseError } = await supabase
    .from('houses')
    .insert({ name, created_by: userId })
    .select()
    .single()

  if (houseError) throw houseError

  const { error: memberError } = await supabase
    .from('house_members')
    .insert({
      house_id: house.id,
      user_id: userId,
      role: 'owner',
    })

  if (memberError) throw memberError

  const { error: updateError } = await supabase
    .from('users')
    .update({ current_house_id: house.id })
    .eq('id', userId)

  if (updateError) throw updateError

  return house
}

export async function getHouseById(houseId: string): Promise<HouseWithMembers | null> {
  const supabase = await createClient()
  
  const { data: house, error: houseError } = await supabase
    .from('houses')
    .select('*')
    .eq('id', houseId)
    .single()

  if (houseError && houseError.code !== 'PGRST116') throw houseError
  if (!house) return null

  const { data: members, error: membersError } = await supabase
    .from('house_members')
    .select(`
      *,
      user:users(*)
    `)
    .eq('house_id', houseId)

  if (membersError) throw membersError

  return {
    ...house,
    members: (members || []).map((m) => {
      const row = m as unknown as { user: User | User[] }
      const user = Array.isArray(row.user) ? row.user[0] : row.user
      return { ...m, user }
    }),
  }
}

export async function getUserHouses(userId: string): Promise<House[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('house_members')
    .select('house:houses(*)')
    .eq('user_id', userId)

  if (error) throw error
  return (data || []).map((item) => {
    const row = item as unknown as { house: House | House[] }
    const house = Array.isArray(row.house) ? row.house[0] : row.house
    return house
  })
}

export async function getCurrentUserHouse(userId: string): Promise<HouseWithMembers | null> {
  const supabase = await createClient()
  
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('current_house_id')
    .eq('id', userId)
    .single()

  if (userError) throw userError
  if (!user?.current_house_id) return null

  const { data: houseData, error: houseError } = await supabase
    .from('houses')
    .select(`
      *,
      members:house_members(
        *,
        user:users(*)
      )
    `)
    .eq('id', user.current_house_id)
    .single()

  if (houseError && houseError.code !== 'PGRST116') throw houseError
  if (!houseData) return null

  return {
    ...houseData,
    members: (houseData.members || []).map((m: unknown) => {
      const row = m as { user: User | User[] }
      const user = Array.isArray(row.user) ? row.user[0] : row.user
      return { ...(m as object), user }
    }),
  }
}

export async function updateHouseWeekStartDay(houseId: string, weekStartDay: number): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('houses')
    .update({ week_start_day: weekStartDay })
    .eq('id', houseId)
  if (error) throw error
}

export async function updateHouseRotationWeeks(houseId: string, rotationWeeks: number): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('houses')
    .update({ rotation_weeks: rotationWeeks })
    .eq('id', houseId)
  if (error) throw error
}

export async function setCurrentHouse(userId: string, houseId: string): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('users')
    .update({ current_house_id: houseId })
    .eq('id', userId)

  if (error) throw error
}

export async function createHouseInvitation(
  houseId: string,
  invitedBy: string,
  invitedEmail: string
): Promise<HouseInvitation> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('house_invitations')
    .insert({
      house_id: houseId,
      invited_by: invitedBy,
      invited_email: invitedEmail,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getHouseInvitations(houseId: string): Promise<HouseInvitation[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('house_invitations')
    .select('*')
    .eq('house_id', houseId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getPendingInvitationsForEmail(email: string): Promise<(HouseInvitation & { house: House })[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('house_invitations')
    .select(`
      *,
      house:houses(*)
    `)
    .eq('invited_email', email)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map((item) => ({
    ...item,
    house: item.house as House,
  }))
}

export async function acceptInvitation(
  invitationId: string,
  userId: string
): Promise<void> {
  const supabase = await createClient()
  
  const { data: invitation, error: invError } = await supabase
    .from('house_invitations')
    .select('*')
    .eq('id', invitationId)
    .single()

  if (invError) throw invError
  if (!invitation || invitation.status !== 'pending') {
    throw new Error('Invitation not found or already processed')
  }

  const { error: memberError } = await supabase
    .from('house_members')
    .insert({
      house_id: invitation.house_id,
      user_id: userId,
      role: 'member',
    })

  if (memberError) throw memberError

  const { error: updateError } = await supabase
    .from('house_invitations')
    .update({
      status: 'accepted',
      responded_at: new Date().toISOString(),
    })
    .eq('id', invitationId)

  if (updateError) throw updateError

  const { error: userUpdateError } = await supabase
    .from('users')
    .update({ current_house_id: invitation.house_id })
    .eq('id', userId)

  if (userUpdateError) throw userUpdateError
}

export async function rejectInvitation(invitationId: string): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('house_invitations')
    .update({
      status: 'rejected',
      responded_at: new Date().toISOString(),
    })
    .eq('id', invitationId)

  if (error) throw error
}
