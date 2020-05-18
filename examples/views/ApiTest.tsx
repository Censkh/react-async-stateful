import * as React          from "react";
import {useCallback}       from "react";
import {useAsyncState}     from "../..";
import {FoodItem, getList} from "../api";

const ApiTest: React.FC = () => {
  const [list, _, updateList] = useAsyncState([] as FoodItem[]);
  const submit = useCallback(
    (refresh: boolean) => {
      updateList(
        async () => {
          const response = await getList();
          return response.data;
        },
        {refresh: refresh},
      );
    },
    [list],
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
        <b>Pending:</b> <span>{list.isPending().toString()}</span>
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
      {list.isRejected() && (
        <div>
          <b>Error: </b> <span>{list.error.message}</span>
          <br/>
        </div>
      )}
      {list.isResolved() ? (
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
        list.isPending() && <i>Loading...</i>
      )}
    </div>
  );
};

export default ApiTest;
