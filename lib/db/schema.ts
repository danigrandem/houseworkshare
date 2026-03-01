export type User = {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  current_house_id: string | null
  created_at: string
  updated_at: string
}

export type HouseRole = 'owner' | 'member'
export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired'

export type House = {
  id: string
  name: string
  created_by: string
  created_at: string
  updated_at: string
  /** First day of week: 0 = Sunday, 1 = Monday, ... 6 = Saturday */
  week_start_day?: number
}

export type HouseMember = {
  id: string
  house_id: string
  user_id: string
  role: HouseRole
  joined_at: string
}

export type HouseInvitation = {
  id: string
  house_id: string
  invited_by: string
  invited_email: string
  status: InvitationStatus
  token: string
  expires_at: string
  created_at: string
  responded_at: string | null
}

export type HouseWithMembers = House & {
  members: (HouseMember & { user: User })[]
}

export type TaskFrequency = 'daily' | 'weekly'

export type Task = {
  id: string
  name: string
  points: number
  house_id: string
  frequency: TaskFrequency
  /** For weekly tasks: minimum completions in the week to earn points. Null = 1 counts. */
  weekly_minimum?: number | null
  created_at: string
  updated_at: string
}

export type TaskGroup = {
  id: string
  name: string
  house_id: string
  created_at: string
  updated_at: string
}

export type TaskGroupItem = {
  id: string
  task_id: string
  task_group_id: string
  created_at: string
}

export type WeeklyConfig = {
  id: string
  week_start_date: string
  points_target_per_person: number
  house_id: string
  created_at: string
  updated_at: string
}

export type WeeklyAssignment = {
  id: string
  week_start_date: string
  user_id: string
  task_group_id: string | null
  house_id: string
  created_at: string
}

export type CompletionStatus = 'pending' | 'validated'

export type TaskCompletion = {
  id: string
  task_id: string
  user_id: string
  completed_at: string
  week_start_date: string
  points_earned: number
  house_id: string
  status: CompletionStatus
  validated_at: string | null
  validated_by: string | null
  completion_date: string | null
  created_at: string
}

export type WeeklyScore = {
  id: string
  user_id: string
  week_start_date: string
  points_earned: number
  points_target: number
  points_carried_over: number
  house_id: string
  created_at: string
  updated_at: string
}

export type SwapType = 'temporary' | 'permanent'
export type SwapStatus = 'pending' | 'accepted' | 'rejected' | 'expired'

export type TaskSwap = {
  id: string
  task_id: string
  from_user_id: string
  to_user_id: string
  week_start_date: string
  swap_date: string | null
  swap_type: SwapType
  status: SwapStatus
  house_id: string
  requested_at: string
  responded_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export type TaskWithGroup = Task & {
  task_group_id: string | null
}

export type TaskGroupWithTasks = TaskGroup & {
  tasks: Task[]
}

export type WeeklyAssignmentWithGroup = WeeklyAssignment & {
  task_group: TaskGroupWithTasks | null
}

export type TaskCompletionWithTask = TaskCompletion & {
  task: Task
}

export type ExtraCompletion = {
  id: string
  user_id: string
  house_id: string
  week_start_date: string
  name: string
  points_earned: number
  completed_at: string
  status: CompletionStatus
  validated_at: string | null
  validated_by: string | null
  created_at: string
}

export type WeeklyScoreWithUser = WeeklyScore & {
  user: User
}

export type TaskSwapWithTask = TaskSwap & {
  task: Task
  from_user: User
  to_user: User
}
