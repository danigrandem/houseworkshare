import { createClient } from '@/lib/supabase/server'
import type { ExtraCompletion } from '@/lib/db/schema'
import { requireHouseId } from './house-utils'

export async function createExtraCompletion(
  userId: string,
  weekStartDate: string,
  name: string,
  pointsEarned: number
): Promise<ExtraCompletion> {
  const supabase = await createClient()
  const houseId = await requireHouseId(userId)

  const { data, error } = await supabase
    .from('extra_completions')
    .insert({
      user_id: userId,
      house_id: houseId,
      week_start_date: weekStartDate,
      name,
      points_earned: pointsEarned,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function validateExtraCompletion(
  completionId: string,
  validatorUserId: string
): Promise<void> {
  const supabase = await createClient()
  const houseId = await requireHouseId(validatorUserId)

  const { data: row, error: fetchError } = await supabase
    .from('extra_completions')
    .select('id, user_id, house_id')
    .eq('id', completionId)
    .eq('house_id', houseId)
    .single()

  if (fetchError || !row) throw new Error('Completado extra no encontrado')
  if (row.user_id === validatorUserId) throw new Error('No puedes validar tu propio completado')

  const { error } = await supabase
    .from('extra_completions')
    .update({
      status: 'validated',
      validated_at: new Date().toISOString(),
      validated_by: validatorUserId,
    })
    .eq('id', completionId)

  if (error) throw error
}

export async function getExtraCompletionsByUserAndWeek(
  userId: string,
  weekStartDate: string
): Promise<ExtraCompletion[]> {
  const supabase = await createClient()
  const houseId = await requireHouseId(userId)

  const { data, error } = await supabase
    .from('extra_completions')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start_date', weekStartDate)
    .eq('house_id', houseId)
    .order('completed_at', { ascending: false })

  if (error) throw error
  return data || []
}

/** Pending extra completions for other members (for current user to validate) */
export async function getPendingExtraCompletionsToValidate(
  weekStartDate: string,
  userId: string
): Promise<ExtraCompletion[]> {
  const supabase = await createClient()
  const houseId = await requireHouseId(userId)

  const { data, error } = await supabase
    .from('extra_completions')
    .select('*')
    .eq('week_start_date', weekStartDate)
    .eq('house_id', houseId)
    .eq('status', 'pending')
    .neq('user_id', userId)
    .order('completed_at', { ascending: false })

  if (error) throw error
  return data || []
}
