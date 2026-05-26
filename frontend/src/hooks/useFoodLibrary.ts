import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../lib/axios'
import { getLineUserId } from '../lib/liff'

export interface FoodLibraryItem {
  id: string
  name: string
  amount: string
  calories: number
  protein: number
  carbs: number
  fat: number
  usageCount: number
}

export function useFoodLibrary() {
  const lineUserId = getLineUserId()

  return useQuery<FoodLibraryItem[]>({
    queryKey: ['foodLibrary', lineUserId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/users/${lineUserId}/food-library`)
      return res.data.data as FoodLibraryItem[]
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useDeleteFoodFromLibrary() {
  const queryClient = useQueryClient()
  const lineUserId = getLineUserId()

  return useMutation({
    mutationFn: (foodId: string) =>
      apiClient.delete(`/api/users/${lineUserId}/food-library/${foodId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foodLibrary', lineUserId] })
    },
  })
}
