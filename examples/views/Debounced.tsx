import type * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import AsyncState, { useAsyncState } from "../../src";
import { type FoodItem, getFoodList } from "../api";

export const useDebouncedEffect = (effect: React.EffectCallback, deps: React.DependencyList, delay = 300) => {
  let handler;
  useEffect(() => {
    clearTimeout(handler);
    handler = setTimeout(() => {
      effect();
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, deps);
};

const Debounced = () => {
  const [list, , updateList] = useAsyncState([] as FoodItem[]);
  const [search, setSearch] = useState("");
  const updateListDebounced = updateList.useDebounced(500);

  useEffect(() => {
    updateListDebounced(
      async () => {
        const response = await getFoodList({
          search,
        });
        return response.data;
      },
      { refresh: true },
    );
  }, [search]);

  return (
    <div>
      <h3>Debounced</h3>
      <a href={"https://github.com/Censkh/react-async-stateful/blob/master/examples/views/Debounced.tsx"}>
        Source Code
      </a>
      <p>
        <b>Pending:</b> <span>{AsyncState.isPending(list).toString()}</span>
        <br />
        <b>Search:</b> <input value={search} onChange={(e) => setSearch(e.target.value)} type={"text"} />
      </p>
      <hr />
      {AsyncState.isRejected(list) && (
        <div>
          <b>Error: </b> <span>{list.error.message}</span>
          <br />
        </div>
      )}
      {AsyncState.isResolved(list) ? (
        <div>
          <b>List (retrieved at {new Date(list.resolvedAt).toLocaleString()}):</b>
          <ul>
            {list.value.map((value, index) => {
              return (
                <li key={index}>
                  <span
                    style={{
                      width: "26px",
                      display: "inline-block",
                    }}
                  >
                    {value.icon}
                  </span>
                  <span>{value.name}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        AsyncState.isPending(list) && <i>Loading...</i>
      )}
    </div>
  );
};

export default Debounced;
