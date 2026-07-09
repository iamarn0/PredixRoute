export interface PaginationOptions {
  page: number;
  limit: number;
  sort?: Record<string, 1 | -1>;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface IBaseRepository<T> {
  findById(id: string, organizationId: string): Promise<T | null>;
  findByPublicId(publicId: string, organizationId: string): Promise<T | null>;
  findAll(organizationId: string, options: PaginationOptions): Promise<PaginatedResult<T>>;
  create(data: Partial<T>, organizationId: string): Promise<T>;
  update(id: string, organizationId: string, data: Partial<T>): Promise<T | null>;
  softDelete(id: string, organizationId: string): Promise<boolean>;
}
