import * as React                  from "react";
import {useCallback, useState}     from "react";
import AsyncState, {useAsyncState} from "../..";
import {FoodItem, getList}         from "../api";

const ApiTest: React.FC = () => {
  const [list, , updateList] = useAsyncState([] as FoodItem[]);
  const [timeoutMs, setTimeoutMs] = useState(0);

  const submit = useCallback(
    (refresh: boolean) => {
      updateList(
        async () => {
          await new Promise(resolve => setTimeout(resolve, 2500));
          const response = await getList();
          return response.data;
        },
        {refresh: refresh, timeout: timeoutMs},
      );
    },
    [list, timeoutMs],
  );

  const reject = useCallback(() => {
    updateList(async () => {
      throw new Error("This is an API error");
    });
  }, [list]);

  return (
    <div>
      <h3>Api Test</h3>
      <a
        href={
          "https://github.com/Censkh/react-async-stateful/blob/master/examples/views/ApiTest.tsx"
        }
      >
        Source Code
      </a>
      <p>
        <b>Pending:</b> <span>{AsyncState.isPending(list).toString()}</span>
        <br/>
        <b>Timeout:</b> <input value={timeoutMs}
                               onChange={(e) => setTimeoutMs(Number(e.target.value))}
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

export default ApiTest;
