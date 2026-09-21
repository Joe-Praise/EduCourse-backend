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
declare class Pagination<T = any> {
    private readonly page;
    private readonly limit;
    constructor(query: PaginationQuery);
    paginate(documents: T[]): PaginationResult<T>;
}
export default Pagination;
export type { PaginationQuery, PaginationResult };
//# sourceMappingURL=paginationFeatures.d.ts.map