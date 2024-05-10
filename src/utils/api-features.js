import { handlePagination } from "./Pagination.js";

export class APIFeatures {
  constructor(mongooseQuery) {
    this.mongooseQuery = mongooseQuery;
  }

  pagination({ page, size }) {
    const { limit, skip } = handlePagination({ page, size });
    this.mongooseQuery = this.mongooseQuery.limit(limit).skip(skip);
    return this;
  }

  sort(sortBy) {
    if (!sortBy) {
      this.mongooseQuery = this.mongooseQuery.sort({ createdAt: -1 });
      return this;
    }
    const handle = sortBy
      .replace(/desc/g, -1)
      .replace(/ass/g, 1)
      .replace(/ /g, ":");
    const [key, value] = handle.split(":");
    this.mongooseQuery = this.mongooseQuery.sort({ [key]: value });
    return this;
  }

  search(search) {
    const queryFilter = {};

    if (search.title)
      queryFilter.title = { $regex: search.title, $options: "i" };
    if (search.desc) queryFilter.desc = { $regex: search.desc, $options: "i" };
    if (search.discount) queryFilter.discount = { $ne: 0 };
    if (search.stock) queryFilter.stock = { $gt: 0 };
    if (search.rate) queryFilter.rate = { $in: search.rate };
    if (search.priceFrom && !search.priceTo)
      queryFilter.appliedPrice = { $gte: search.priceFrom };
    if (search.priceTo && !search.priceFrom)
      queryFilter.appliedPrice = { $lte: search.priceTo };
    if (search.priceTo && search.priceFrom)
      queryFilter.appliedPrice = {
        $gte: search.priceFrom,
        $lte: search.priceTo,
      };

    if (search.color) queryFilter["specs.color"] = { $all: search.color };
    if (search.size) queryFilter["specs.size"] = { $all: search.size };

    this.mongooseQuery = this.mongooseQuery.find(queryFilter);
    return this;
  }

  filters(filters) {
    const queryFilter = JSON.parse(
      JSON.stringify(filters).replace(
        /gt|gte|lt|lte|in|nin|eq|ne|regex/g,
        (OP) => `$${OP}`
      )
    );
    this.mongooseQuery.find(queryFilter);
    return this;
  }
}
