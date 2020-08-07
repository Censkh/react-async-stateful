import * as React                  from "react";
import {useCallback, useState}     from "react";
import AsyncState, {useAsyncState} from "../..";
import {FoodItem, getList}         from "../api";

const MinimumPending: React.FC = () => {
  const [minimumPending, setMinimumPending] = useState(0);

  const [list, , updateList] = useAsyncState([] as FoodItem[]);
  const submit = useCallback(
    (refresh: boolean) => {
      updateList(
        async () => {
          const response = await getList();
          return response.data;
        },
        {refresh: refresh, minimumPending: minimumPending},
      );
    },
    [list, minimumPending],
  );

  const reject = useCallback(() => {
    updateList(async () => {
      throw new Error("This is an API error");
    });
  }, [list]);


  return (
    <div>
      <h3>Minimum Pending</h3>
      <a
        href={
          "https://github.com/Censkh/react-async-stateful/blob/master/examples/views/MinimumPending.tsx"
        }
      >
        Source Code
      </a>
      <p>
        <b>Pending:</b> <span>{AsyncState.isPending(list).toString()}</span>
        <br/>
        <b>Minimum Pending:</b> <input value={minimumPending}
                                       onChange={(e) => setMinimumPending(Number(e.target.value))}
                                       type={"number"}/>
      </p>
      <button disabled={list.pending} onClick={() => submit(false)}>
        Submit
      </button>
      <button disabled={list.pending} onClick={() => submit(true)}>
        Refresh
      </button>
      <button disabled={list.pending} onClick={() => reject()}>
        Reject
      </button>
      <hr/>
      {AsyncState.isRejected(list) && (
        <div>
          <b>Error: </b> <span>{list.error.message}</span>
          <br/>
        </div>
      )}
      {AsyncState.isResolved(list) ? (
        <div>
          <b>
            List (retrieved at {new Date(list.resolvedAt).toLocaleString()}):
          </b>
          <ul>
            {list.value.map((value, index) => {
              return (
                <li key={index}>
                  <span
                    style={{
                      width  : "26px",
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

export default MinimumPending;
