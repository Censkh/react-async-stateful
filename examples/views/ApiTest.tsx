import * as React from "react";
import {useCallback} from "react";
import * as AsyncState from "../..";
import {useAsyncState} from "../..";
import {FoodItem, getList} from "../api";

const ApiTest: React.FC = (props) => {
    const [list, _, updateList] = useAsyncState([] as FoodItem[]);
    const submit = useCallback((refresh: boolean) => {
        updateList(async () => {
            const response = await getList();
            return response.data;
        }, {refresh: refresh});
    }, [list]);

    const reject = useCallback(() => {
        updateList(async () => {
            throw new Error("This is an API error");
        });
    }, [list]);

    return <div>
        <h3>Api Test</h3>
        <p><b>Pending:</b> <span>{AsyncState.isPending(list).toString()}</span></p>
        <button disabled={list.pending} onClick={() => submit(false)}>Submit</button>
        <button disabled={list.pending} onClick={() => submit(true)}>Refresh</button>
        <button disabled={list.pending} onClick={() => reject()}>Reject</button>
        <hr/>
        {AsyncState.isRejected(list) && <div><b>Error: </b> <span>{list.error.message}</span><br/></div>}
        {AsyncState.isResolved(list) ? <div><b>List (retrieved at {new Date(list.resolvedAt).toLocaleString()}):</b>
            <ul>
                {list.value.map((value, index) => {
                    return <li key={index}>
                        <span style={{width: "26px", display: "inline-block"}}>{value.icon}</span><span>{value.name}</span>
                    </li>;
                })}
            </ul>
        </div> : AsyncState.isPending(list) && <i>Loading...</i>}
    </div>;
};

export default ApiTest;