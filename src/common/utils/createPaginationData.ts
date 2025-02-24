export const createPaginationData = ({ page = 1, limit = 10 }) => {
  const currentPage = parseInt(page.toString(), 10)
  const take = parseInt(limit.toString(), 10)
  const skip = (currentPage - 1) * take

  return {
    createResponse: (total: number) => {
      const totalPages = Math.ceil(total / take)
      const isLastPage = currentPage === totalPages
      return {
        currentPage,
        isLastPage,
        nextCursor: isLastPage ? null : currentPage + 1,
        prevCursor: currentPage === 1 ? null : currentPage - 1,
        totalItems: total,
        totalPages,
      }
    },
    skip,
    take,
  }
}
