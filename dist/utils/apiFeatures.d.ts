import type { Query } from 'mongoose';
interface QueryString {
    page?: string;
    sort?: string;
    limit?: string;
    fields?: string;
    [key: string]: any;
}
declare class APIFeatures {
    query: Query<any, any>;
    queryString: QueryString;
    totalDocument: number;
    constructor(query: Query<any, any>, queryString: QueryString);
    filter(arr?: string[]): APIFeatures;
    sorting(): APIFeatures;
    limitFields(): APIFeatures;
}
export default APIFeatures;
//# sourceMappingURL=apiFeatures.d.ts.map