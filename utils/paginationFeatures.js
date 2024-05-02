class Pagination {
  constructor(query) {
    this.page = query.page;
    this.limit = query.limit;
    this.metaData = null;
    this.data = null;
  }

  pagination(documents) {
    this.page = this.page * 1 || 1;
    this.limit = this.limit * 1 || 6;
    const skip = (this.page - 1) * this.limit;
    this.data = documents.slice(skip, skip + this.limit);

    this.metaData = {
      totalPages: Math.ceil(documents.length / this.limit),
      totalDocuments: documents.length,
      page: this.page,
      count: this.data.length,
      limit: this.limit,
    };
    return this;
  }
}
module.exports = Pagination;
