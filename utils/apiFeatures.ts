import type { Query } from 'mongoose';

interface QueryString {
  page?: string;
  sort?: string;
  limit?: string;
  fields?: string;
  [key: string]: any;
}

class APIFeatures {
  query: Query<any, any>;
  queryString: QueryString;
  totalDocument: number;

  constructor(query: Query<any, any>, queryString: QueryString) {
    this.query = query;
    this.queryString = queryString;
    this.totalDocument = 0;
  }

  filter(arr: string[] = []): APIFeatures {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    if (arr.length) {
      arr.forEach((el) => {
        // checks if arr element is part of the queryObj
        if (queryObj[el]) {
          const value = queryObj[el];
          const newValue = value.indexOf(',') !== -1 ? value.split(',') : value;
          queryObj[el] = { $in: newValue };
        }
      });
    }

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    // console.log('API Feature', this.queryStr);
    return this;
  }

  sorting(): APIFeatures {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields(): APIFeatures {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }
}

export default APIFeatures;
