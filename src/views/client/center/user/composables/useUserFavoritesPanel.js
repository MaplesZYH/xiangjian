export const useUserFavoritesPanel = ({
  favoriteStore,
  favoritePagination,
  favorites,
  currentFavoriteUserId,
  getStoredUserId,
  router,
  message,
}) => {
  const goToHousePage = () => router.push('/houseList')
  const viewFavoriteDetail = (item) => router.push(`/houseDetail/${item.id}`)

  const fetchFavorites = async () => {
    try {
      await favoriteStore.fetchFavoriteList({
        page: favoritePagination.page,
        pageSize: favoritePagination.pageSize,
      })
    } catch (error) {
      void error
      message.error('获取收藏列表失败')
    }
  }

  const refreshFavorites = () => {
    favoritePagination.page = 1
    fetchFavorites()
  }

  const handleFavoritePageChange = (page) => {
    favoritePagination.page = page
    fetchFavorites()
  }

  const cancelFavorite = async (item) => {
    const userId = currentFavoriteUserId.value || getStoredUserId()
    if (!userId || !item?.id) return

    try {
      const shouldFallbackPrevPage =
        favorites.value.length === 1 && favoritePagination.page > 1

      await favoriteStore.toggleFavorite(item.id, userId)
      message.success('已取消收藏')

      favoritePagination.page = shouldFallbackPrevPage
        ? favoritePagination.page - 1
        : favoritePagination.page
      await fetchFavorites()
    } catch (error) {
      void error
      message.error('取消收藏失败')
    }
  }

  return {
    goToHousePage,
    viewFavoriteDetail,
    fetchFavorites,
    refreshFavorites,
    handleFavoritePageChange,
    cancelFavorite,
  }
}
