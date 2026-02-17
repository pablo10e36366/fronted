export type ApiMeta = {
  page: number;
  page_size: number;
  total: number;
};

export type ApiResponse<T> = {
  data: T;
  meta?: ApiMeta;
};

