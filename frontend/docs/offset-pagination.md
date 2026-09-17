# 触底分页使用示例

项目的分页接口统一返回 `PageData<T>`，请求工具会自动解包外层的 `ApiResponse.data`。

## 1. 定义分页接口函数

接口函数接收一个对象，其中必须包含 `page` 和 `page_size`：

```ts
import type { PageData } from "@/types/response";
import type { User } from "@/types/user";
import request from "@/utils/request";

type UserParams = {
  keyword?: string;
  status?: string;
};

export function getUsers({
  page,
  page_size,
  keyword,
  status,
}: UserParams & { page: number; page_size: number }) {
  return request.get<PageData<User>>("/users/all", {
    params: {
      page,
      page_size,
      keyword,
      status,
    },
  });
}
```

`page` 和 `page_size` 由分页 Hook 自动传入，其他字段就是业务查询参数。

## 2. 使用 `useOffsetPagination`

```tsx
import { useOffsetPagination } from "@/hooks/useOffsetPagination";

const usersQuery = useOffsetPagination<User, UserParams>({
  fetchPage: getUsers,
  params: {
    keyword: "张",
    status: "active",
  },
  pageSize: 20,
  enabled: true,
});
```

只有分页参数时，可以省略泛型参数和 `params`：

```tsx
const usersQuery = useOffsetPagination<User>({
  fetchPage: getUsers,
});
```

Hook 会根据后端返回的 `has_next` 自动决定是否请求下一页，并根据查询参数变化自动切换缓存。

## 3. 配合 `ScrollContainer`

```tsx
import { ScrollContainer } from "@/components/ScrollContainer";

const {
  items,
  total,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
} = usersQuery;

return (
  <ScrollContainer
    className="table-wrap"
    hasMore={Boolean(hasNextPage)}
    isLoading={isFetchingNextPage}
    onLoadMore={() => void fetchNextPage()}
  >
    {isLoading ? (
      <div>正在加载用户...</div>
    ) : (
      <ul>
        {items.map((user) => (
          <li key={user.id}>
            {user.name} - {user.email}
          </li>
        ))}
      </ul>
    )}
  </ScrollContainer>
);
```

`ScrollContainer` 默认使用 `IntersectionObserver` 监听底部触发器。当触发器进入滚动容器底部前 `200px` 的区域时，会调用 `onLoadMore`。

滚动容器需要有固定或最大高度，并开启纵向滚动：

```css
.table-wrap {
  max-height: 520px;
  overflow: auto;
}
```

## 4. 完整组件示例

```tsx
import { useState } from "react";
import { ScrollContainer } from "@/components/ScrollContainer";
import { useOffsetPagination } from "@/hooks/useOffsetPagination";
import { getUsers } from "@/api/user";
import type { User } from "@/types/user";

type UserParams = {
  keyword?: string;
};

export function UserList() {
  const [keyword, setKeyword] = useState("");
  const usersQuery = useOffsetPagination<User, UserParams>({
    fetchPage: getUsers,
    params: {
      keyword: keyword || undefined,
    },
  });

  return (
    <section>
      <input
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        placeholder="搜索用户"
      />

      <p>共 {usersQuery.total} 位用户</p>

      <ScrollContainer
        className="table-wrap"
        hasMore={Boolean(usersQuery.hasNextPage)}
        isLoading={usersQuery.isFetchingNextPage}
        onLoadMore={() => void usersQuery.fetchNextPage()}
      >
        {usersQuery.isLoading ? (
          <p>正在加载...</p>
        ) : (
          usersQuery.items.map((user) => (
            <div key={user.id}>{user.name}</div>
          ))
        )}
      </ScrollContainer>
    </section>
  );
}
```

## 5. 参数说明

### `useOffsetPagination`

| 参数 | 是否必填 | 说明 |
| --- | --- | --- |
| `fetchPage` | 是 | 分页接口函数，接收 `page`、`page_size` 和其他查询参数 |
| `params` | 否 | 业务查询参数，变化后从第一页重新查询 |
| `pageSize` | 否 | 每页条数，默认 `20` |
| `enabled` | 否 | 是否启用查询，默认 `true` |

### 返回值

| 返回值 | 说明 |
| --- | --- |
| `items` | 所有已加载页面合并后的数据 |
| `total` | 第一页返回的总数据量 |
| `isLoading` | 首次加载状态 |
| `isFetchingNextPage` | 加载下一页状态 |
| `hasNextPage` | 是否还有下一页 |
| `fetchNextPage` | 手动加载下一页 |

外层 `QueryClientProvider` 已在 `src/main.tsx` 中配置，业务组件不需要重复配置。
