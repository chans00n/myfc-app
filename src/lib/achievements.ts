import { Database } from '@/types/database'

type UserAchievement = Database['public']['Tables']['user_achievements']['Row']

export interface Achievement {
  id: string
  name: string
  description: string
  category: 'streak' | 'duration' | 'difficulty' | 'variety'
  requirement: number
  reward_points: number
}

interface WorkoutStats {
  totalWorkouts: number
  totalDuration: number
  currentStreak: number
  uniqueExercises: number
  advancedWorkouts: number
}

// Define achievements
export const ACHIEVEMENTS: Achievement[] = [
  // Streak achievements
  {
    id: 'streak-3',
    name: 'Consistency Starter',
    description: 'Complete workouts for 3 days in a row',
    category: 'streak',
    requirement: 3,
    reward_points: 50
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: 'Complete workouts for 7 days in a row',
    category: 'streak',
    requirement: 7,
    reward_points: 100
  },
  {
    id: 'streak-14',
    name: 'Fortnight Fighter',
    description: 'Complete workouts for 14 days in a row',
    category: 'streak',
    requirement: 14,
    reward_points: 200
  },
  {
    id: 'streak-30',
    name: 'Monthly Master',
    description: 'Complete workouts for 30 days in a row',
    category: 'streak',
    requirement: 30,
    reward_points: 500
  },
  
  // Duration achievements
  {
    id: 'duration-60',
    name: 'Hour Crusher',
    description: 'Accumulate 1 hour of total workout time',
    category: 'duration',
    requirement: 60 * 60, // 1 hour in seconds
    reward_points: 50
  },
  {
    id: 'duration-300',
    name: 'Five Hour Force',
    description: 'Accumulate 5 hours of total workout time',
    category: 'duration',
    requirement: 5 * 60 * 60, // 5 hours in seconds
    reward_points: 100
  },
  {
    id: 'duration-1200',
    name: 'Day Dedicator',
    description: 'Accumulate 20 hours of total workout time',
    category: 'duration',
    requirement: 20 * 60 * 60, // 20 hours in seconds
    reward_points: 300
  },
  {
    id: 'duration-3600',
    name: 'Workout Warrior',
    description: 'Accumulate 60 hours of total workout time',
    category: 'duration',
    requirement: 60 * 60 * 60, // 60 hours in seconds
    reward_points: 500
  },
  
  // Difficulty achievements
  {
    id: 'difficulty-1',
    name: 'Challenge Accepted',
    description: 'Complete 1 advanced difficulty workout',
    category: 'difficulty',
    requirement: 1,
    reward_points: 50
  },
  {
    id: 'difficulty-5',
    name: 'Difficulty Dominator',
    description: 'Complete 5 advanced difficulty workouts',
    category: 'difficulty',
    requirement: 5,
    reward_points: 100
  },
  {
    id: 'difficulty-15',
    name: 'Expert Exerciser',
    description: 'Complete 15 advanced difficulty workouts',
    category: 'difficulty',
    requirement: 15,
    reward_points: 300
  },
  {
    id: 'difficulty-30',
    name: 'Elite Athlete',
    description: 'Complete 30 advanced difficulty workouts',
    category: 'difficulty',
    requirement: 30,
    reward_points: 500
  },
  
  // Variety achievements
  {
    id: 'variety-3',
    name: 'Variety Beginner',
    description: 'Try 3 different workouts',
    category: 'variety',
    requirement: 3,
    reward_points: 50
  },
  {
    id: 'variety-10',
    name: 'Variety Enthusiast',
    description: 'Try 10 different workouts',
    category: 'variety',
    requirement: 10,
    reward_points: 100
  },
  {
    id: 'variety-20',
    name: 'Variety Master',
    description: 'Try 20 different workouts',
    category: 'variety',
    requirement: 20,
    reward_points: 300
  }
]

/**
 * Check if a user has earned new achievements based on their workout stats
 */
export function checkAchievementProgress(
  stats: WorkoutStats,
  earnedAchievements: UserAchievement[]
): Achievement[] {
  // Create a set of already earned achievement IDs for quick lookup
  const earnedAchievementIds = new Set(earnedAchievements.map(a => a.achievement_id))
  
  // Check each achievement to see if it's been earned
  const newlyEarnedAchievements: Achievement[] = []
  
  for (const achievement of ACHIEVEMENTS) {
    // Skip if already earned
    if (earnedAchievementIds.has(achievement.id)) {
      continue
    }
    
    // Check if the achievement has been earned based on its category
    let earned = false
    
    switch (achievement.category) {
      case 'streak':
        earned = stats.currentStreak >= achievement.requirement
        break
      case 'duration':
        earned = stats.totalDuration >= achievement.requirement
        break
      case 'difficulty':
        earned = stats.advancedWorkouts >= achievement.requirement
        break
      case 'variety':
        earned = stats.uniqueExercises >= achievement.requirement
        break
    }
    
    if (earned) {
      newlyEarnedAchievements.push(achievement)
    }
  }
  
  return newlyEarnedAchievements
}

/**
 * Calculate the total achievement points earned by a user
 */
export function calculateAchievementPoints(earnedAchievements: UserAchievement[]): number {
  let totalPoints = 0
  
  for (const userAchievement of earnedAchievements) {
    const achievement = ACHIEVEMENTS.find(a => a.id === userAchievement.achievement_id)
    if (achievement) {
      totalPoints += achievement.reward_points
    }
  }
  
  return totalPoints
} 