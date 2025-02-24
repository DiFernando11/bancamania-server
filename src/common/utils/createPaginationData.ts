export const createPaginationData = ({ page = 1, limit = 10 }) => {
  const currentPage = parseInt(page.toString(), 10)
  const take = parseInt(limit.toString(), 10)
  const skip = (currentPage - 1) * take

  return {
    createResponse: (total: number) => {
      const totalPages = Math.ceil(total / take)
      return {
        currentPage,
        isLastPage: currentPage === totalPages,
        totalItems: total,
        totalPages,
      }
    },
    skip,
    take,
  }
}
