import { useInfiniteQuery } from "@tanstack/react-query";

import type { PageData } from "@/types/response";

export type OffsetPage<T> = PageData<T>;

type PageParams = {
  page: number;
  page_size: number;
};

type FetchPage<T, TParams> = (
  params: TParams & PageParams,
) => Promise<OffsetPage<T>>;

type UseOffsetPaginationOptions<T, TParams extends object> = {
  fetchPage: FetchPage<T, TParams>;
  params?: TParams;
  pageSize?: number;
  enabled?: boolean;
};

const fetcherIds = new WeakMap<object, number>();
let nextFetcherId = 0;

function getFetcherId(fetchPage: object) {
  const existingId = fetcherIds.get(fetchPage);
  if (existingId !== undefined) return existingId;

  const id = nextFetcherId++;
  fetcherIds.set(fetchPage, id);
  return id;
}

export function useOffsetPagination<T, TParams extends object = Record<string, never>>({
  fetchPage,
  params,
  pageSize = 20,
  enabled = true,
}: UseOffsetPaginationOptions<T, TParams>) {
  const query = useInfiniteQuery({
    queryKey: ["offset-pagination", getFetcherId(fetchPage), params, pageSize],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchPage({
        ...params,
        page: pageParam,
        page_size: pageSize,
      } as TParams & PageParams),
    getNextPageParam: (lastPage) =>
      lastPage.has_next ? lastPage.page + 1 : undefined,
    enabled,
  });

  return {
    ...query,
    items: query.data?.pages.flatMap((page) => page.items) ?? [],
    total: query.data?.pages[0]?.total ?? 0,
  };
}
