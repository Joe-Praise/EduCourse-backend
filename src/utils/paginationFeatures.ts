interface PaginationQuery {
  page?: string | number;
  limit?: string | number;
}

interface PaginationResult<T> {
  data: T[];
  metaData: {
    totalPages: number;
    totalDocuments: number;
    page: number;
    count: number;
    limit: number;
  };
}

class Pagination<T = any> {
  private readonly page: number;
  private readonly limit: number;

  constructor(query: PaginationQuery) {
    this.page = Math.max(1, Number(query.page) || 1);
    this.limit = Math.max(1, Number(query.limit) || 6);
  }

  paginate(documents: T[]): PaginationResult<T> {
    const skip = (this.page - 1) * this.limit;
    const data = documents.slice(skip, skip + this.limit);

    return {
      data,
      metaData: {
        totalPages: Math.ceil(documents.length / this.limit),
        totalDocuments: documents.length,
        page: this.page,
        count: data.length,
        limit: this.limit,
      }
    };
  }
}

// Export for both CommonJS and ES modules compatibility
export default Pagination;
export type { PaginationQuery, PaginationResult };
