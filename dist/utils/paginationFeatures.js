"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Pagination {
    constructor(query) {
        this.page = Math.max(1, Number(query.page) || 1);
        this.limit = Math.max(1, Number(query.limit) || 6);
    }
    paginate(documents) {
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
exports.default = Pagination;
//# sourceMappingURL=paginationFeatures.js.map